/** A shot must reach the visible target without crossing measured physical geometry. */
const WORLD_MESH=requireAsset('../Render/RoomOcclusionMesh.worldmesh') as RenderMesh;
import WorldCameraFinderProvider from 'SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider';
export class RoomInvadersVisibility {
  private session:HitTestSession;
  private epoch=0;
  private busyUntil=0;
  constructor(){
    this.session=(require('LensStudio:WorldQueryModule') as WorldQueryModule).createHitTestSession();
    this.session.start();
  }
  exposed(points:vec3[]):boolean{
    const camera=WorldCameraFinderProvider.getInstance().getComponent(),from=camera.getTransform().getWorldPosition();
    const tracking=camera.getSceneObject().getComponent('Component.DeviceTracking') as DeviceTracking;
    const mesh=WORLD_MESH.control as WorldRenderObjectProvider;
    if(!tracking||mesh.faceCount===0)return false;
    return points.some(p=>{const hits=tracking.raycastWorldMesh(from,p);return !hits.length||hits[0].position.sub(from).length+2>=p.sub(from).length;});
  }
  reset():void {this.epoch++;this.busyUntil=0;}
  check(point:vec3,done:(visible:boolean)=>void):void {
    if(getTime()<this.busyUntil)return;
    const epoch=++this.epoch;this.busyUntil=getTime()+0.75;
    const camera=WorldCameraFinderProvider.getInstance().getComponent();
    const from=camera.getTransform().getWorldPosition(),ray=point.sub(from),distance=ray.length;
    if(distance<1){this.busyUntil=0;done(false);return;}
    const end=from.add(ray.normalize().uniformScale(distance+30));
    const mesh=WORLD_MESH.control as WorldRenderObjectProvider;
    const tracking=camera.getSceneObject().getComponent('Component.DeviceTracking') as DeviceTracking;
    if(mesh.faceCount>0&&tracking){
      const hits=tracking.raycastWorldMesh(from,end);this.busyUntil=0;
      done(hits.length===0||hits[0].position.sub(from).length+2>=distance);return;
    }
    this.session.hitTest(from,end,hit=>{
      if(epoch!==this.epoch)return;
      this.busyUntil=0;
      // Two cm tolerance accommodates small depth fluctuations without allowing shots through solid objects.
      done(!!hit&&hit.position.sub(from).length+2>=distance);
    });
  }
  destroy():void {this.reset();this.session.stop();}
}
