/** Shot-path assertions plus opt-in paused frames of actual gameplay, not visual pass assertions. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {ScenarioConfig} from 'Leaf.lspkg/Scenarios/scenario/ScenarioConfig';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {RoomInvadersLeafHelper} from './RoomInvadersLeafHelper';
import {RoomInvadersVisibility} from './RoomInvadersVisibility';
import WorldCameraFinderProvider from 'SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider';
@component
export class RoomInvadersOcclusionScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void> {
    const h=new RoomInvadersLeafHelper();await h.waitFor(()=>h.main().placementStatus().ready,60000);
    const camera=WorldCameraFinderProvider.getInstance().getComponent(),from=camera.getTransform().getWorldPosition();
    const visibility=new RoomInvadersVisibility();
    try {
      const positions=h.main().placementStatus().points;
      const p=new vec3(positions[0][0],positions[0][1],positions[0][2]);
      const ray=p.sub(from).normalize();
      const check=(point:vec3)=>new Promise<boolean>(resolve=>visibility.check(point,resolve));
      expect(await check(p.add(ray.uniformScale(25)))).toBe(false);
      expect(await check(p.sub(ray.uniformScale(25)))).toBe(true);
      console.log('OCCLUSION_SHOT_GUARD_PASS');
      if(config?.get('view')==='gameplay') {
        const progress=Number(config.get('progress')??'0.5');
        if(!Number.isFinite(progress)||progress<0||progress>1.2)throw new Error('progress must be0–1.2');
        await h.start();
        await h.waitFor(()=>{const s=h.main().snapshot();return s.enemies.some(e=>s.elapsed-e.born>=h.main().warningLead+h.main().emergence*progress);},8000);
        // Production pause handler only; do not advance time, inject positions or bypass scoring.
        h.main().primary();
        const s=h.main().snapshot();expect(s.paused).toBe(true);
        expect(s.enemies[0].targetable).toBe(progress>=1);
        console.log('OCCLUSION_GAMEPLAY_PAUSED '+JSON.stringify({progress,surface:positions[0],state:s}));
      }
    }finally{visibility.destroy();}
  }
}
