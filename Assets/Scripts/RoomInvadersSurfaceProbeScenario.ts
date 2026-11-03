/** Diagnostic only: real WorldQuery samples from the current camera, without committing positions. */
import {RoomInvadersLeafHelper} from './RoomInvadersLeafHelper';
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {sleep} from 'Leaf.lspkg/Utils/common/Utils';
import WorldCameraFinderProvider from 'SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider';
@component
export class RoomInvadersSurfaceProbeScenario extends Scenario {
  async run():Promise<void> {
    const session=(require('LensStudio:WorldQueryModule') as WorldQueryModule).createHitTestSession();
    session.start();await sleep(1500);
    const camera=WorldCameraFinderProvider.getInstance().getComponent();
    try {
      const from=camera.getTransform().getWorldPosition();
      const tracking=camera.getSceneObject().getComponent('Component.DeviceTracking') as DeviceTracking;
      const to=from.add(new vec3(0,-650,0));
      console.log('FLOOR_MESH '+JSON.stringify(tracking?.raycastWorldMesh(from,to).map(h=>({p:h.position,n:h.normal}))));
      await new Promise<void>(resolve=>session.hitTest(from,to,hit=>{console.log('FLOOR_QUERY '+JSON.stringify(hit?{p:hit.position,n:hit.normal}:null));resolve();}));
      for(const y of [0.87,0.9,0.93,0.96,0.99])for(const x of [0.2,0.5,0.8]) {
      const from=camera.getTransform().getWorldPosition(),to=camera.screenSpaceToWorldSpace(new vec2(x,y),1000);
      await new Promise<void>(resolve=>session.hitTest(from,to,hit=>{
        console.log('SURFACE_PROBE '+JSON.stringify({screen:[x,y],from:[from.x,from.y,from.z],to:[to.x,to.y,to.z],hit:hit?[hit.position.x,hit.position.y,hit.position.z]:null,normal:hit?[hit.normal.x,hit.normal.y,hit.normal.z]:null,mesh:tracking.raycastWorldMesh(from,to).slice(0,1).map(h=>({p:h.position,n:h.normal}))}));resolve();}));await sleep(220);
    }console.log('SCAN_DIAGNOSTIC '+JSON.stringify(new RoomInvadersLeafHelper().main().placementStatus()));}finally{session.stop();}
  }
}
