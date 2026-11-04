/** Measured geometry only. Three live creature slots roam among a larger room-site pool. */
import {Snapshot} from './RoomInvadersState';
export type RoomSite={key:number;p:vec3;n:vec3;kind:string;seen:number;uses:number};
export class RoomInvadersRoaming {
 private sites:RoomSite[]=[];private serial=0;private probe=0;private nextProbe=0;
 private assigned=new Map<number,RoomSite>();private seen=new Set<string>();private recent:number[]=[];
 private history:{id:string;slot:number;site:number;kind:string;position:number[]}[]=[];
 private lastTime=0;
 constructor(private anchors:SceneObject[]){}
 reset():void{this.sites=[];this.assigned.clear();this.seen.clear();this.recent=[];this.history=[];this.probe=0;this.nextProbe=0;this.lastTime=0;}
 add(p:vec3,n:vec3,kind:string):void{
  if(![p.x,p.y,p.z,n.x,n.y,n.z].every(Number.isFinite)||n.length<.8)return;
  const old=this.sites.find(s=>s.p.sub(p).length<55&&s.n.dot(n)>.75);
  if(old){old.seen=getTime();return;}
  if(this.sites.length>=36||this.sites.filter(s=>s.kind===kind).length>=12)return;
  this.sites.push({key:this.serial++,p,n:n.normalize(),kind,seen:getTime(),uses:0});
 }
 sample(camera:Camera,ground:number|null):void{
  if(getTime()<this.nextProbe)return;this.nextProbe=getTime()+.16;
  const tr=camera.getTransform(),origin=tr.getWorldPosition();
  const tracking=camera.getSceneObject().getComponent('Component.DeviceTracking') as DeviceTracking;
  if(!tracking)return;
  const k=this.probe++,yaw=Math.floor(k/7)%12*Math.PI/6,pitch=[-.7,-.35,0,.35,.7,1.05,-1.05][k%7];
  const dir=tr.getWorldRotation().multiplyVec3(new vec3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)));
  const hits=tracking.raycastWorldMesh(origin,origin.add(dir.uniformScale(650)));
  if(!hits.length)return;
  const p=hits[0].position,n=hits[0].normal.normalize(),distance=p.sub(origin).length;
  if(distance<100||distance>600)return;
  // Ground is not a hiding place. Unknown ground keeps low horizontal hits out of the pool.
  if(n.y>.5&&(ground===null?p.y<origin.y-125:p.y<=ground+22))return;
  let kind=n.y<-.55&&p.y>origin.y+35?'ceiling':n.y>.55?'surface':'';
  if(!kind){
   const side=dir.cross(vec3.up());if(side.length<.01)return;
   let edge=false,corner=false;
   for(const sign of [-1,1]){
    const endpoint=p.add(side.normalize().uniformScale(65*sign));
    const adjacent=tracking.raycastWorldMesh(origin,origin.add(endpoint.sub(origin).normalize().uniformScale(650)));
    if(!adjacent.length){edge=true;continue;}
    const a=adjacent[0],delta=a.position.sub(p);
    if(delta.length<170&&Math.abs(a.normal.dot(n))<.65)corner=true;
    if(delta.length>70&&delta.dot(n)<-25)edge=true;
   }
   kind=corner?'corner':edge?'cover':'';
  }
  if(kind)this.add(p,n,kind);
  if(ground!==null)this.sites=this.sites.filter(s=>s.n.y<=.5||s.p.y>ground+22);
 }
 placeRescue(rescue:SceneObject,camera:vec3,clear:(p:vec3)=>boolean):boolean{
  const sites=this.sites.filter(s=>s.kind!=='ceiling'&&s.p.sub(camera).length>100).sort((a,b)=>(b.n.y>.5?1:0)-(a.n.y>.5?1:0));
  for(const site of sites){
   const toward=camera.sub(site.p).normalize();
   // Pip floats in reachable space in front of a measured hiding place. Test the
   // full cage, not just its center: a nearby table must not hide the lower locks.
   for(const offset of [65,100,140]){
    const point=site.p.add(toward.uniformScale(offset));point.y=Math.max(camera.y-45,Math.min(camera.y+5,point.y));
    if(point.sub(camera).length<80)continue;
    const facing=new vec3(camera.x-point.x,0,camera.z-point.z).normalize(),right=new vec3(facing.z,0,-facing.x);
    const checks=[point,point.add(right.uniformScale(-18)).add(new vec3(0,-20,0)),point.add(new vec3(0,-20,0)),point.add(right.uniformScale(18)).add(new vec3(0,-20,0)),point.add(new vec3(0,24,0))];
    if(!checks.every(clear))continue;
    const t=rescue.getTransform();t.setWorldPosition(point);t.setWorldRotation(quat.lookAt(facing,vec3.up()));return true;
   }
  }return false;
 }
 bootstrap(placed:vec3[]=[]):RoomSite[]{
  if(!this.sites.some(s=>s.kind!=='ceiling'))return [];
  const result:RoomSite[]=[];
  for(const s of this.sites.slice().sort((a,b)=>(a.kind==='ceiling'?1:0)-(b.kind==='ceiling'?1:0)))if(placed.every(p=>p.sub(s.p).length>=90)&&result.every(t=>t.p.sub(s.p).length>=90)){result.push(s);if(result.length+placed.length===3)break;}
  return result;
 }
 sync(s:Snapshot,camera:vec3,tracking:DeviceTracking):void{
  if(s.phase==='ready'||s.elapsed<this.lastTime){this.seen.clear();this.assigned.clear();this.history=[];}
  this.lastTime=s.elapsed;
  if(s.phase!=='playing'||s.paused)return;
  for(const slot of Array.from(this.assigned.keys()))if(!s.enemies.some(e=>e.spawn===slot))this.assigned.delete(slot);
  for(const e of s.enemies)if(!this.seen.has(e.id)){
   const occupied=Array.from(this.assigned.values());
   let choices=this.sites.filter(v=>getTime()-v.seen<180&&v.p.sub(camera).length>=100&&v.p.sub(camera).length<=650&&occupied.every(a=>a.p.sub(v.p).length>=75)).filter(v=>{
    const end=v.p.add(v.n.uniformScale(v.kind==='ceiling'?55:v.n.y>.5?14:55)),distance=end.sub(camera).length;
    if(distance<55)return false;
    const hits=tracking?.raycastWorldMesh(camera,end);
    return !hits?.length||hits[0].position.sub(camera).length+3>=distance;
   });
   const fresh=choices.filter(v=>!this.recent.slice(-2).includes(v.key));if(fresh.length)choices=fresh;
   const ranked=choices.map(v=>({v,rank:this.history.filter(h=>h.kind===v.kind).length*10+v.uses+(this.history.slice(-1)[0]?.kind===v.kind?3:0)+Math.random()})).sort((a,b)=>a.rank-b.rank);
   const site=ranked[0]?.v;if(!site)continue;
   this.seen.add(e.id);site.uses++;this.recent.push(site.key);this.assigned.set(e.spawn,site);
   const base=site.p.add(site.n.uniformScale(site.kind==='ceiling'?55:site.n.y>.5?14:55));
   const tr=this.anchors[e.spawn].getTransform();tr.setWorldPosition(base);
   const facing=new vec3(camera.x-base.x,0,camera.z-base.z);
   if(facing.length>.01)tr.setWorldRotation(quat.lookAt(facing.normalize(),vec3.up()));
   this.history.push({id:e.id,slot:e.spawn,site:site.key,kind:site.kind,position:[site.p.x,site.p.y,site.p.z]});
   console.log('ROAMING_SPAWN '+JSON.stringify(this.history[this.history.length-1]));
  }
 }
 normal(slot:number):vec3|null{return this.assigned.get(slot)?.n??null;}
 kind(slot:number):string{return this.assigned.get(slot)?.kind??'surface';}
 status(){return {siteCount:this.sites.length,kinds:Array.from(new Set(this.sites.map(s=>s.kind))),sites:this.sites.map(s=>({key:s.key,kind:s.kind,position:[s.p.x,s.p.y,s.p.z]})),history:this.history.slice()};}
}
