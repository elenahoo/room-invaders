/** Owns pooled visual/target adapters under authored anchors. Does not decide score or game phase. */
import {Interactable} from 'SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable';
import {creature,lockVisual,cage,obj,animateCreature,Color} from './RoomInvadersGeometry';
import {monster,MonsterModel,MONSTER_NAMES} from './RoomInvadersMonsterModels';
import {Snapshot,emergenceReveal,peekIsExposed} from './RoomInvadersState';
type Target={root:SceneObject;visual:SceneObject;collider:ColliderComponent;id:string;interactable:Interactable;pressed:boolean;size:vec3};
export class RoomInvadersTargets {
  private monsters:Target[]=[];
  private models:MonsterModel[]=[];
  private reveals:{id:string;at:number}[]=[];private lastElapsed=0;
  private friend:Target;
  private locks:Target[]=[];
  private cage:SceneObject;
  private cleanup:(()=>void)[]=[];
  private savedAt=-1;
  constructor(private material:Material,private shoot:(id:string,point:vec3)=>void,private debug:boolean,
    private anchors:SceneObject[],rescue:SceneObject,private violet:Color,private mint:Color,wood:Color,accent:Color,private normalAt:(index:number)=>vec3,private kindAt:(index:number)=>string) {
    for(let i=0;i<3;i++) {
      const root=obj(anchors[i],['Monster_box','Monster_door','Monster_shelf'][i]);
      const model=monster(root,material,i);this.models.push(model);
      this.monsters.push(this.target(root,model.root,'',model.bounds));
    }
    const f=obj(rescue,'Pip');this.friend=this.target(f,creature(f,material,mint,true),'friend',new vec3(17,25,17));
    this.cage=cage(rescue,material,violet);
    for(let i=0;i<3;i++) {
      const root=obj(rescue,'RescueLock'+i,new vec3((i-1)*11,-15,10));
      const v=lockVisual(root,material,violet);this.locks.push(this.target(root,v,'lock-'+i,new vec3(8,10,5)));
    }
  }
  private target(root:SceneObject,visual:SceneObject,id:string,size:vec3):Target {
    const collider=root.createComponent('Physics.ColliderComponent') as ColliderComponent;
    const box=Shape.createBoxShape();box.size=size;collider.shape=box;
    collider.debugDrawEnabled=this.debug;
    const interactable=root.createComponent(Interactable.getTypeName()) as Interactable;
    const target={root,visual,collider,id,interactable,pressed:false,size};
    // Keep the invisible target wrapper alive until release so SIK completes the gesture.
    this.cleanup.push(interactable.onTriggerStart.add(event=>{target.pressed=true;this.shoot(target.id,event.interactor.targetHitPosition??target.root.getTransform().getWorldPosition());}),
      interactable.onTriggerEnd.add(()=>{target.pressed=false;}),
      interactable.onTriggerCanceled.add(()=>{target.pressed=false;}));
    return target;
  }
  exposurePoints(slot:number):vec3[]{const root=this.monsters[slot].visual,t=root.getTransform();return [new vec3(0,0,0),new vec3(0,18,12),new vec3(-12,10,12),new vec3(12,10,12)].map(p=>t.getWorldPosition().add(t.getWorldRotation().multiplyVec3(p.uniformScale(t.getWorldScale().x))));}
  status(){return {targets:this.monsters.map((t,i)=>({name:MONSTER_NAMES[i],id:t.id,visible:t.root.enabled&&t.visual.enabled,targetable:t.collider.enabled})),reveals:this.reveals.slice()};}
  render(s:Snapshot,emergence:number,peekPeriod:number,peekVisible:number,warningLead=0):void {
    if(s.elapsed<this.lastElapsed||s.phase==='ready')this.reveals=[];this.lastElapsed=s.elapsed;
    for(let i=0;i<3;i++) {
      const t=this.monsters[i],e=s.enemies.find(v=>v.spawn===i);
      t.root.enabled=!!e||t.pressed;t.visual.enabled=!!e&&s.elapsed-e.born>=warningLead;
      t.collider.enabled=(!!e?.targetable||t.pressed)&&!s.paused;
      if(!e)continue;
      t.id=e.id;const age=Math.max(0,s.elapsed-e.born-warningLead);
      if(t.visual.enabled&&!this.reveals.some(r=>r.id===e.id))this.reveals.push({id:e.id,at:s.elapsed});
      const progress=Math.min(1,age/emergence),peek=e.kind==='peek'&&!peekIsExposed(age,emergence,peekPeriod,peekVisible);
      // Full-size creature travels from behind the physical surface into view. Depth handles masking.
      const reveal=peek?0:emergenceReveal(progress);
      const base=this.anchors[i].getTransform().getWorldPosition();
      const offset=this.normalAt(i).uniformScale(-80*(1-reveal)).add(new vec3(0,this.kindAt(i)==='ceiling'?0:(this.normalAt(i).y>.5?[32,16,40][i]:0)*reveal,0));
      t.root.getTransform().setWorldPosition(base.add(offset));
      // Overhead creatures must fit the glasses view at close ceiling distances.
      const scale=this.kindAt(i)==='ceiling'?.55:1;
      if(Math.abs(t.visual.getTransform().getLocalScale().x-scale)>.001){
        t.visual.getTransform().setLocalScale(new vec3(scale,scale,scale));
        const shape=Shape.createBoxShape();shape.size=t.size.uniformScale(scale);t.collider.shape=shape;
      }
      const bounce=Math.sin(age*5)*0.5;
      t.visual.getTransform().setLocalPosition(new vec3(0,bounce,0));
      t.visual.getTransform().setLocalRotation(quat.fromEulerAngles(0,0,(this.kindAt(i)==='ceiling'?Math.PI:0)+Math.sin(age*2)*0.08));
      if(!s.paused)this.models[i].animate(age);
    }
    const showing=s.phase==='playing'&&['locked','free'].includes(s.rescue);
    if(s.rescue!=='saved')this.savedAt=-1;
    else if(this.savedAt<0)this.savedAt=s.elapsed;
    // Celebrate briefly, then clear Pip from the shooting lanes before the next wave.
    this.friend.root.enabled=showing||(s.rescue==='saved'&&s.elapsed-this.savedAt<1.5)||this.friend.pressed;
    this.friend.collider.enabled=(showing||this.friend.pressed)&&!s.paused;
    this.cage.enabled=showing&&s.rescue==='locked';
    if(!this.friend.pressed)this.friend.root.getTransform().setLocalPosition(new vec3(0,0,0));
    if(!s.paused){this.friend.visual.getTransform().setLocalRotation(quat.fromEulerAngles(0,0,Math.sin(s.elapsed*2)*0.12));
      animateCreature(this.friend.visual,s.elapsed);}
    this.locks.forEach((t,i)=>{const active=showing&&s.locks[i];t.root.enabled=active||t.pressed;
      t.visual.enabled=active;t.collider.enabled=(active||t.pressed)&&!s.paused;});
  }
  destroy():void {this.cleanup.forEach(off=>off());this.cleanup=[];}
}
