/** LEAF-only lookups and standard SIK triggers. No direct mutation of game state. */
import {DefaultLeafInteractor} from 'Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor';
import {findInteractablesByName} from 'Leaf.lspkg/Interactors/InteractableUtils';
import {findSceneObjectByName,sleep} from 'Leaf.lspkg/Utils/common/Utils';
import {InteractorTriggerType} from 'SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor';
import WorldCameraFinderProvider from 'SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider';
import {RoomInvadersMain} from './RoomInvadersMain';
class SurfaceTestInteractor extends DefaultLeafInteractor {
  async surfacePinch(x:number,y:number,holdMs=250,localRay?:vec3):Promise<void> {
    const camera=WorldCameraFinderProvider.getInstance().getComponent();
    const original=this.sikInteractor.isTargeting;
    this.sikInteractor.isTargeting=()=>true;
    this.startPoint=camera.getTransform().getWorldPosition();
    this.endPoint=localRay?this.startPoint.add(camera.getTransform().getWorldRotation().multiplyVec3(localRay.normalize()).uniformScale(1000)):camera.screenSpaceToWorldSpace(new vec2(x,y),1000);
    try {
      await sleep(350);this.setTriggerType(InteractorTriggerType.Pinch);await sleep(holdMs);
      this.setTriggerType(InteractorTriggerType.None);await sleep(350);
    }finally {this.setTriggerType(InteractorTriggerType.None);this.sikInteractor.isTargeting=original;}
  }
}
export class RoomInvadersLeafHelper {
  readonly input=new SurfaceTestInteractor();
  main():RoomInvadersMain {
    return findSceneObjectByName('RoomInvadersMain').getComponent(RoomInvadersMain.getTypeName()) as RoomInvadersMain;
  }
  async tap(name:string):Promise<void> {
    if(name==='StartButton'&&this.main().snapshot().phase==='playing'&&!this.main().snapshot().paused)name='PauseMenuButton';
    if(['RestartButton','Room setupButton','Place myselfButton'].includes(name)&&this.main().snapshot().phase==='playing'&&!findInteractablesByName(name,undefined,true)[0])await this.tap('PauseMenuButton');
    const target=findInteractablesByName(name,undefined,true)[0];
    if(!target)throw new Error('Missing enabled target: '+name);
    await this.input.trigger(target);await sleep(280);
  }
  async setup():Promise<void> {
    if(this.main().placementStatus().automatic){await this.waitFor(()=>this.main().placementStatus().ready,60000);return;}
    await sleep(600);await this.input.surfacePinch(.5,.9,500,new vec3(-.35,-.75,-1));
    for(const x of [0.5,0.8])await this.input.surfacePinch(x,0.9);
    await this.waitFor(()=>this.main().placementStatus().ready,4000);
  }
  async start():Promise<void> {if(!this.main().placementStatus().ready)await this.setup();await this.tap('RestartButton');}
  async waitFor(condition:()=>boolean,timeoutMs:number):Promise<void> {
    const end=getTime()+timeoutMs/1000;
    while(!condition()) {if(getTime()>end)throw new Error('Timed out waiting for game condition');await sleep(100);}
  }
  async defendUntil(endElapsed:number):Promise<Set<number>> {
    const seen=new Set<number>();const end=getTime()+endElapsed+15;
    while(this.main().snapshot().phase==='playing'&&this.main().snapshot().elapsed<endElapsed) {
      if(getTime()>end)throw new Error('Encounter clock stalled');
      const s=this.main().snapshot();
      const e=s.enemies.find(v=>v.targetable);
      if(e) {seen.add(e.spawn);await this.tap(['Monster_box','Monster_door','Monster_shelf'][e.spawn]);}
      else await sleep(100);
    }
    return seen;
  }
  hud():string {return (findSceneObjectByName('Stats').getComponent('Component.Text') as Text).text;}
}
