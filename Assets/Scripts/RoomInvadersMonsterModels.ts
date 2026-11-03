/** Original articulated indoor creature interpretations; no downloaded art or image-texture dependency. */
import {Geometry,obj,Color} from './RoomInvadersGeometry';
export const MONSTER_NAMES=['Shadow Wraith','Ember Hound','Void Leech'];
export type MonsterModel={root:SceneObject;bounds:vec3;animate:(time:number)=>void};
const c=(r:number,g:number,b:number):Color=>[r,g,b,1];
const bone=c(.82,.86,.9),dark=c(.42,.48,.56),socket=c(.065,.07,.10);
const cyan=c(.5,.94,1),ember=c(1,.26,.025),violet=c(.69,.15,1);
type P=[number,number,number];
function claw(g:Geometry,p:P,q:P,r:P,color:Color,width=1.5):void{g.tube([p,q,r],[width,width*.58,.06],color,8);}
export function monster(parent:SceneObject,material:Material,index:number):MonsterModel {
 const root=obj(parent,MONSTER_NAMES[index]+'Visual'),body=new Geometry(true),glow=new Geometry(),moving:SceneObject[]=[];
 const emit=(g:Geometry,n:string)=>g.draw(root,n,material);
 if(index===0){
  // Long skeletal proportions, recessed sockets, rib cage and ragged shadow tendrils.
  body.sphere(0,13,0,10,15,6,dark);body.sphere(0,31,1,7.2,10,6.7,bone);
  body.sphere(-3.1,32,6.6,2.5,3,.9,socket);body.sphere(3.1,32,6.6,2.5,3,.9,socket);
  body.sphere(0,27,7.1,1.2,2,.8,socket);body.sphere(0,23,4.7,4.6,3,3.8,bone);
  body.tube([[0,-6,0],[0,4,-1],[0,18,0],[0,23,1]],[2.6,2,2.3,1.6],bone,10);
  for(let j=0;j<6;j++)for(const side of [-1,1]){
   const y=18-j*3.3;body.tube([[0,y,3],[side*7,y+1,4.5],[side*(9-j*.5),y-1,1],[side*5,y-3,-3]],[.9,1.0,.8,.5],bone,8);
  }
  for(const side of [-1,1]){
   body.sphere(side*12,18,0,4.2,4.4,4,bone);
   body.tube([[side*11,18,0],[side*20,9,0],[side*23,-2,7]],[3.4,2.1,1.8],bone,10);
   body.sphere(side*23,-3,8,3.8,4.5,2.6,bone);
   for(let k=0;k<4;k++)claw(body,[side*(20+k*1.7),-5,9],[side*(22+k*2),-12,12],[side*(20+k*2.3),-17,16],bone,1);
   body.tube([[side*4,-3,0],[side*9,-17,0],[side*5,-31,4]],[3,2,1.4],dark,10);
  }
  for(let k=0;k<9;k++){
   const a=k/9*Math.PI*2,g=new Geometry(true);
   g.tube([[Math.cos(a)*7,4,Math.sin(a)*5],[Math.cos(a)*10,-8,Math.sin(a)*8],[Math.cos(a+0.4)*13,-22,Math.sin(a+.4)*10],[Math.cos(a+.8)*18,-36-k%3*2,Math.sin(a+.8)*11]],[3.4,2.3,1.3,.06],c(.40,.46,.56),10);
   const o=emit(g,'ShadowTendril'+k);moving.push(o);
  }
  glow.sphere(-3.1,32.4,7.4,.85,1.45,.4,cyan);glow.sphere(3.1,32.4,7.4,.85,1.45,.4,cyan);
  for(let k=0;k<7;k++)body.sphere((k-3)*1.1,22,8,.48,1.25,.5,bone);
 }else if(index===1){
  // Deep chest, raised shoulder blades, four digitigrade limbs and a tapered canine muzzle.
  const coat=c(.58,.47,.40);
  body.sphere(0,1,-5,12,13,24,coat);body.sphere(0,7,11,14,17,12,coat);
  body.sphere(0,15,18,10,12,10,coat);body.sphere(0,11,29,8,6.7,13,coat);
  body.sphere(0,8,37,7.3,3.9,10,socket);body.sphere(0,4,32,7,2.8,11,coat);
  for(const side of [-1,1]){
   body.sphere(side*7,16,27,4,3,3.5,coat);body.sphere(side*5.5,16.2,30,2.2,1.1,1.6,socket);
   glow.sphere(side*5.5,16.5,31,1.55,.65,.7,ember);
   claw(body,[side*6,23,17],[side*11,33,11],[side*14,38,6],coat,3.2);
   for(const z of [-22,11]){
    const x=side*(z>0?10.5:9);
    body.tube([[x,5,z],[x+side*3,-8,z-3],[x,-21,z+3],[x,-25,z+10]],[5.5,4,2.8,3.3],coat,12);
    body.sphere(x,-25,z+10,5,3,7,coat);
    for(let k=0;k<3;k++)claw(body,[x+(k-1)*2.5,-24,z+13],[x+(k-1)*2.7,-25,z+18],[x+(k-1)*2.7,-26,z+21],c(.64,.55,.43),1.1);
   }
   for(let j=0;j<8;j++)claw(body,[side*6.5,9.5,22+j*2.6],[side*5.8,6.5,22+j*2.6],[side*5.5,5,23+j*2.6],c(.92,.76,.51),.7);
   for(let k=0;k<7;k++){
    const z=-24+k*8;
    glow.tube([[side*6,10,z],[side*12,3,z+3],[side*10,-3,z+6]],[.65,.95,.35],ember,7);
    body.sphere(side*10,7,z,4.2,4,5.3,coat);
   }
  }
  for(let j=0;j<9;j++)claw(body,[0,13,-25+j*6],[0,24+j%2*4,-28+j*6],[0,27+j%2*5,-30+j*6],coat,3);
  const tail=new Geometry(true);tail.tube([[0,2,-25],[5,8,-40],[10,20,-48],[8,27,-46]],[4.3,3.3,2,.2],coat,12);moving.push(emit(tail,'HoundTail'));
  for(let j=0;j<6;j++)glow.sphere(0,15+j%2*2,-21+j*7,1,1.3,2,ember);
 }else{
  // Organic mantle plates around a vertical luminous maw, with many independently swaying tendrils.
  const shell=c(.55,.35,.65);
  body.sphere(0,17,0,17,16,11,shell);body.sphere(0,24,-3,13,9,9,shell);
  body.sphere(0,11,9,10.5,12,5,socket);glow.sphere(0,12,12,3.2,7.7,1.1,violet);
  for(const side of [-1,1])for(let k=0;k<5;k++){
   body.sphere(side*(8+k*.6),22-k*5,10,4.5,4.2,3.5,shell);
   claw(body,[side*8,21-k*4,13],[side*5,19-k*4,15],[side*2.8,18-k*4,14.8],c(.68,.52,.76),1);
   glow.tube([[side*14,24-k*5,4],[side*16,20-k*5,8],[side*12,17-k*5,12]],[.65,.75,.25],violet,7);
  }
  for(let k=0;k<10;k++){
   const a=k/10*Math.PI*2,x=Math.cos(a)*12,z=Math.sin(a)*7;
   const g=new Geometry(true),light=new Geometry(),sway=(k%2?1:-1);
   const path:P[]=[[x,10,z],[x*1.7,-4,z+4],[x*1.6+sway*9,-19,z+8],[x*.8+sway*10,-34,z+16],[x*.5,-43-k%3*3,z+22]];
   g.tube(path,[3.5,3,2.2,1.1,.08],shell,11);
   light.tube(path.map(p=>[p[0],p[1],p[2]+1.8] as P),[.6,.8,.6,.3,.04],violet,7);
   const limb=obj(root,'LeechTentacle'+k);g.draw(limb,'OrganicTissue',material);light.draw(limb,'Vein',material);moving.push(limb);
  }
  for(let k=0;k<8;k++){const a=k/8*Math.PI;claw(body,[Math.cos(a)*13,27,Math.sin(a)*7],[Math.cos(a)*20,37,Math.sin(a)*11],[Math.cos(a)*25,42,Math.sin(a)*12],shell,2.3);}
 }
 emit(body,'Anatomy');emit(glow,'LuminousDetails');
 console.log('MONSTER_MODEL '+MONSTER_NAMES[index]+' original procedural articulated mesh');
 return {root,bounds:index===1?new vec3(48,62,105):index===0?new vec3(65,86,46):new vec3(82,95,74),
  animate:(time:number)=>{moving.forEach((o,k)=>o.getTransform().setLocalRotation(quat.fromEulerAngles(Math.sin(time*1.7+k)*.055,0,Math.sin(time*2.1+k*.8)*.06)));}};
}
