/** Conservative, bounded depth patches supplement holes in the reconstructed world mesh.
 * Every vertex is a WorldQuery measurement. Never bridge missing or discontinuous depth. */
import {RoomInvadersRoaming} from './RoomInvadersRoaming';
type Hit={p:vec3;n:vec3};
type Patch={v:vec3[];n:vec3;center:vec3;seen:number;confirmations:number;radius:number;tier:number};
export class RoomInvadersDepthCover {
 static current:RoomInvadersDepthCover|null=null;
 private session:HitTestSession;
 private patches:Patch[]=[];private focusPoints:vec3[]=[];
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
 reset():void{this.epoch++;this.busy=false;this.next=0;this.patches=[];this.focusPoints=[];this.rebuild();}
 focus(p:vec3):void{if(!this.focusPoints.some(q=>q.sub(p).length<30))this.focusPoints.push(p);this.focusPoints=this.focusPoints.slice(-8);}
 update(camera:Camera,ground:number|null):void{
  if(this.busy||getTime()<this.next)return;this.next=getTime()+1;this.busy=true;
  const epoch=this.epoch,origin=camera.getTransform().getWorldPosition();
  const forward=camera.getTransform().getWorldRotation().multiplyVec3(new vec3(0,0,-1));
  const centers=this.focusPoints.filter(p=>p.sub(origin).dot(forward)>0).map(p=>camera.worldSpaceToScreenSpace(p)).filter(p=>p.x>.08&&p.x<.92&&p.y>.08&&p.y<.92).sort((a,b)=>Math.abs(a.x-.5)+Math.abs(a.y-.5)-Math.abs(b.x-.5)-Math.abs(b.y-.5)).slice(0,1);
  if(!centers.length)centers.push(new vec2(.5,.5));
  const grids=[{cols:15,rows:7,x:.02,y:.02,spanX:.96,spanY:.96,tier:0},...centers.map(p=>({cols:19,rows:17,x:p.x-.2,y:p.y-.16,spanX:.4,spanY:.48,tier:1}))];
  let pending=grids.length;
  for(const g of grids){
   const hits:(Hit|null)[]=Array(g.rows*g.cols).fill(null);let remaining=hits.length;
   for(let y=0;y<g.rows;y++)for(let x=0;x<g.cols;x++){
    const i=y*g.cols+x,to=camera.screenSpaceToWorldSpace(new vec2(g.x+x*g.spanX/(g.cols-1),g.y+y*g.spanY/(g.rows-1)),650);
    this.session.hitTest(origin,to,hit=>{
     if(epoch!==this.epoch)return;
     if(hit&&hit.position.sub(origin).length<=650&&hit.normal.length>.8)hits[i]={p:hit.position,n:hit.normal.normalize()};
     if(--remaining===0){this.consume(hits,g.cols,g.rows,origin,ground,g.tier);const done=()=>{if(epoch!==this.epoch)return;if(--pending===0){this.busy=false;this.rebuild();}};if(g.tier===1)this.refineRoofEdges(hits,g,camera,origin,ground,epoch,done);else done();}
    });
   }
  }
 }
 /** Bisect measured solid-to-sky transitions rather than extending a guessed roof plane. */
 private refineRoofEdges(hits:(Hit|null)[],g:{cols:number;rows:number;x:number;y:number;spanX:number;spanY:number},camera:Camera,origin:vec3,ground:number|null,epoch:number,done:()=>void):void{
  const strips=new Map<number,(Hit|null)[]>();let remaining=0;
  const tasks:(()=>void)[]=[];
  for(let y=1;y<g.rows;y++)for(let x=0;x<g.cols;x++){
   const solid=hits[y*g.cols+x],above=hits[(y-1)*g.cols+x];
   if(!solid||solid.p.y<origin.y+100||(above&&above.p.sub(solid.p).length<80))continue;
   if(!strips.has(y))strips.set(y,Array(g.cols*2).fill(null));const strip=strips.get(y)!;strip[g.cols+x]=solid;
   const u=g.x+x*g.spanX/(g.cols-1);let low=g.y+y*g.spanY/(g.rows-1),high=low-g.spanY/(g.rows-1),best=solid,step=0;remaining++;
   const probe=()=>{const v=(low+high)/2,to=camera.screenSpaceToWorldSpace(new vec2(u,v),650);this.session.hitTest(origin,to,hit=>{
    if(epoch!==this.epoch)return;
    if(hit&&hit.position.sub(solid.p).length<60&&hit.normal.length>.8){low=v;best={p:hit.position,n:hit.normal.normalize()};}else high=v;
    if(++step<5){probe();return;}strip[x]=best;
    if(--remaining===0){for(const row of strips.values())this.consume(row,g.cols,2,origin,ground,2);done();}
   });};tasks.push(probe);
  }
  if(!tasks.length){done();return;}tasks.forEach(t=>t());
 }
 private consume(hits:(Hit|null)[],cols:number,rows:number,origin:vec3,ground:number|null,tier:number):void{
  const now=getTime();this.patches=this.patches.filter(p=>now-p.seen<90);
  for(let y=0;y<rows-1;y++)for(let x=0;x<cols-1;x++){
   const ids=[y*cols+x,y*cols+x+1,(y+1)*cols+x+1,(y+1)*cols+x];
   for(const corners of [[0,1,2],[0,2,3]]){
    const h=corners.map(i=>hits[ids[i]]);if(h.some(a=>!a))continue;
    const a=h as Hit[],n=a.reduce((s,h)=>s.add(h.n),vec3.zero()).normalize(),v=a.map(a=>a.p);
    const geometric=v[1].sub(v[0]).cross(v[2].sub(v[0]));
    const edge=Math.max(...v.flatMap(p=>v.map(q=>p.sub(q).length)));
    const curved=tier>=1&&edge<30;
    if(geometric.length<.01||(!curved&&(Math.abs(geometric.normalize().dot(n))<.8||a.some(a=>a.n.dot(n)<.8)))||edge>90)continue;
    const center=v.reduce((s,p)=>s.add(p),vec3.zero()).uniformScale(1/3),radius=Math.max(...v.map(p=>p.sub(center).length));
    // Match only the same triangle footprint. A fine patch must never replace a
    // larger patch, and neighboring cells cannot confirm one another in one scan.
    let patch=this.patches.find(p=>p.tier===tier&&p.center.sub(center).length<Math.min(3,radius*.25)&&p.n.dot(n)>.96&&Math.abs(p.radius-radius)<Math.max(2,radius*.2)&&p.v.every((q,i)=>q.sub(v[i]).length<6));
    if(patch){if(now-patch.seen>.45)patch.confirmations++;patch.seen=now;patch.v=v;patch.center=center;patch.n=n;}
    else{patch={v,n,center,seen:now,confirmations:1,radius,tier};this.patches.push(patch);}
    if(patch.confirmations<2||center.sub(origin).length<100||center.sub(origin).length>600)continue;
    if(n.y>.5&&(ground===null?center.y<origin.y-125:center.y<=ground+22))continue;
    let kind=n.y<-.55&&center.y>origin.y+35?'ceiling':n.y>.55?'surface':'';
    if(!kind){
     const neighbors=[x>0?hits[y*cols+x-1]:undefined,x+2<cols?hits[y*cols+x+2]:undefined];
     const edge=neighbors.some(p=>p===null||(p&&p.p.sub(center).length>70&&p.p.sub(center).dot(n)<-25));
     const corner=neighbors.some(p=>p&&Math.abs(p.n.dot(n))<.65&&p.p.sub(center).length<170);
     if(center.y>origin.y-110&&center.y<origin.y+100)kind=corner?'corner':edge?'cover':'';
    }
    if(kind)this.roaming.add(center,n,kind);
   }
  }
  // Upper silhouettes are measured along a continuous solid row below sky/deeper space.
  for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
   const h=hits[y*cols+x],left=hits[y*cols+x-1],right=hits[y*cols+x+1],above=hits[(y-1)*cols+x];
   if(!h||!left||!right||h.p.y<origin.y+150||Math.abs(h.n.y)>.6||h.p.sub(origin).length>600)continue;
   if(left.p.sub(h.p).length>60||right.p.sub(h.p).length>60||left.n.dot(h.n)<.8||right.n.dot(h.n)<.8)continue;
   if(above&&above.p.sub(h.p).length<80)continue;
   if(this.patches.some(p=>p.confirmations>=2&&p.center.sub(h.p).length<45&&p.n.dot(h.n)>.8))this.roaming.add(h.p,h.n,'ledge');
  }
  const keep=(t:number)=>this.patches.filter(p=>p.tier===t).sort((a,b)=>b.seen-a.seen||b.confirmations-a.confirmations).slice(0,t===1?2048:512);
  this.patches=[...keep(0),...keep(1),...keep(2)];
 }
 private rebuild():void{
  const b=this.builder;if(b.getIndicesCount())b.eraseIndices(0,b.getIndicesCount());if(b.getVerticesCount())b.eraseVertices(0,b.getVerticesCount());
  for(const patch of this.patches){
   if(patch.confirmations<2)continue;
   const v=patch.v,n=patch.n,base=b.getVerticesCount();
   b.appendVerticesInterleaved(v.flatMap(p=>[p.x,p.y,p.z,n.x,n.y,n.z]));
   for(const tri of [[0,1,2]]){if(v[tri[1]].sub(v[tri[0]]).cross(v[tri[2]].sub(v[tri[0]])).dot(n)<0)[tri[1],tri[2]]=[tri[2],tri[1]];b.appendIndices(tri.map(i=>base+i));}
  }
  this.object.enabled=b.getIndicesCount()>0;if(this.object.enabled)b.updateMesh();
 }
 /** Same measured triangles block score exposure and pinch rays as well as rendering. */
 blocked(from:vec3,to:vec3):boolean{
  const ray=to.sub(from),length=ray.length;if(length<1)return false;const dir=ray.normalize();
  for(const patch of this.patches){if(patch.confirmations<2)continue;
   for(const t of [[0,1,2]]){
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
