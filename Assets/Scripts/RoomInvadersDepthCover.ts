/** Conservative, bounded depth patches supplement holes in the reconstructed world mesh.
 * Every vertex is a WorldQuery measurement. Never bridge missing or discontinuous depth. */
import {RoomInvadersRoaming} from './RoomInvadersRoaming';
type Hit={p:vec3;n:vec3};
type Patch={v:vec3[];n:vec3;center:vec3;seen:number;confirmations:number};
export class RoomInvadersDepthCover {
 static current:RoomInvadersDepthCover|null=null;
 private session:HitTestSession;
 private patches:Patch[]=[];
 private epoch=0;private next=0;private busy=false;
 private object:SceneObject;
 private builder=new MeshBuilder([{name:'position',components:3},{name:'normal',components:3,normalized:true}]);
 constructor(private roaming:RoomInvadersRoaming){
  this.session=(require('LensStudio:WorldQueryModule') as WorldQueryModule).createHitTestSession();this.session.start();
  this.object=global.scene.createSceneObject('Measured depth cover');
  this.builder.topology=MeshTopology.Triangles;this.builder.indexType=MeshIndexType.UInt16;
  const visual=this.object.createComponent('Component.RenderMeshVisual') as RenderMeshVisual;
  visual.mesh=this.builder.getMesh();visual.mainMaterial=requireAsset('../RoomOcclusion.mat') as Material;visual.setRenderOrder(-100);
  this.object.enabled=false;RoomInvadersDepthCover.current=this;
 }
 reset():void{this.epoch++;this.busy=false;this.next=0;this.patches=[];this.rebuild();}
 update(camera:Camera,ground:number|null):void{
  if(this.busy||getTime()<this.next)return;this.next=getTime()+1;this.busy=true;
  const epoch=this.epoch,origin=camera.getTransform().getWorldPosition(),rows=5,cols=9;
  const hits:(Hit|null)[]=Array(rows*cols).fill(null);let remaining=hits.length;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const i=y*cols+x,to=camera.screenSpaceToWorldSpace(new vec2(.06+x*.11,.08+y*.21),650);
   this.session.hitTest(origin,to,hit=>{
    if(epoch!==this.epoch)return;
    if(hit&&hit.position.sub(origin).length<=650&&hit.normal.length>.8)hits[i]={p:hit.position,n:hit.normal.normalize()};
    if(--remaining===0){this.busy=false;this.consume(hits,cols,rows,origin,ground);}
   });
  }
 }
 private consume(hits:(Hit|null)[],cols:number,rows:number,origin:vec3,ground:number|null):void{
  const now=getTime();this.patches=this.patches.filter(p=>now-p.seen<90);
  for(let y=0;y<rows-1;y++)for(let x=0;x<cols-1;x++){
   const ids=[y*cols+x,y*cols+x+1,(y+1)*cols+x+1,(y+1)*cols+x],h=ids.map(i=>hits[i]);
   if(h.some(a=>!a))continue;
   const a=h as Hit[],n=a[0].n,v=a.map(a=>a.p);
   if(a.some(a=>a.n.dot(n)<.94||Math.abs(a.p.sub(v[0]).dot(n))>4)||v.some(p=>p.sub(v[0]).length>145))continue;
   const center=v.reduce((s,p)=>s.add(p),vec3.zero()).uniformScale(.25);
   let patch=this.patches.find(p=>p.center.sub(center).length<18&&p.n.dot(n)>.96);
   if(patch){patch.seen=now;patch.confirmations++;patch.v=v;patch.center=center;}
   else{patch={v,n,center,seen:now,confirmations:1};this.patches.push(patch);}
   if(patch.confirmations<2||center.sub(origin).length<100||center.sub(origin).length>600)continue;
   if(n.y>.5&&(ground===null?center.y<origin.y-125:center.y<=ground+22))continue;
   let kind=n.y<-.55&&center.y>origin.y+35?'ceiling':n.y>.55?'surface':'';
   if(!kind){
    // A measured nearer face beside a missing/deeper sample is an observed silhouette.
    const neighbors=[x>0?hits[y*cols+x-1]:undefined,x+2<cols?hits[y*cols+x+2]:undefined];
    const edge=neighbors.some(p=>p===null||(p&&p.p.sub(center).length>70&&p.p.sub(center).dot(n)<-25));
    const corner=neighbors.some(p=>p&&Math.abs(p.n.dot(n))<.65&&p.p.sub(center).length<170);
    if(center.y>origin.y-110&&center.y<origin.y+100)kind=corner?'corner':edge?'cover':'';
   }
   if(kind)this.roaming.add(center,n,kind);
  }
  this.patches=this.patches.slice(-160);this.rebuild();
 }
 private rebuild():void{
  const b=this.builder;if(b.getIndicesCount())b.eraseIndices(0,b.getIndicesCount());if(b.getVerticesCount())b.eraseVertices(0,b.getVerticesCount());
  for(const patch of this.patches){
   if(patch.confirmations<2)continue;
   const v=patch.v,n=patch.n,base=b.getVerticesCount();
   b.appendVerticesInterleaved(v.flatMap(p=>[p.x,p.y,p.z,n.x,n.y,n.z]));
   for(const tri of [[0,1,2],[0,2,3]]){if(v[tri[1]].sub(v[tri[0]]).cross(v[tri[2]].sub(v[tri[0]])).dot(n)<0)[tri[1],tri[2]]=[tri[2],tri[1]];b.appendIndices(tri.map(i=>base+i));}
  }
  this.object.enabled=b.getIndicesCount()>0;if(this.object.enabled)b.updateMesh();
 }
 /** Same measured triangles block score exposure and pinch rays as well as rendering. */
 blocked(from:vec3,to:vec3):boolean{
  const ray=to.sub(from),length=ray.length;if(length<1)return false;const dir=ray.normalize();
  for(const patch of this.patches){if(patch.confirmations<2)continue;
   for(const t of [[0,1,2],[0,2,3]]){
    const a=patch.v[t[0]],e1=patch.v[t[1]].sub(a),e2=patch.v[t[2]].sub(a),p=dir.cross(e2),det=e1.dot(p);
    if(Math.abs(det)<.00001)continue;
    const inv=1/det,s=from.sub(a),u=s.dot(p)*inv;if(u<0||u>1)continue;
    const q=s.cross(e1),v=dir.dot(q)*inv;if(v<0||u+v>1)continue;
    const d=e2.dot(q)*inv;if(d>1&&d+2<length)return true;
   }
  }return false;
 }
 get count():number{return this.patches.filter(p=>p.confirmations>=2).length;}
 destroy():void{this.epoch++;this.session.stop();this.object.destroy();if(RoomInvadersDepthCover.current===this)RoomInvadersDepthCover.current=null;}
}
