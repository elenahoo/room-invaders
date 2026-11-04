/** Local surface placement. No network, semantic recognition, persistence or synthetic fallback. */
import {RoomInvadersAutoScan,distanceFits} from './RoomInvadersAutoScan';
import {SIK} from 'SpectaclesInteractionKit.lspkg/SIK';
import {InteractorTriggerType} from 'SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor';
import WorldCameraFinderProvider from 'SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider';
import {RoomInvadersDepthCover} from './RoomInvadersDepthCover';
import {RoomInvadersRoaming} from './RoomInvadersRoaming';
import {Snapshot} from './RoomInvadersState';
import {surfaceMarker} from './RoomInvadersGeometry';
export class RoomInvadersPlacement {
  private automatic=true;
  private roaming:RoomInvadersRoaming;
  private depthCover:RoomInvadersDepthCover;
  private setupStarted=0;
  private lastProgress=0;
  private setupOrigin:vec3;private probe=0;
  private floorY:number|null=null;
  private scanner=new RoomInvadersAutoScan();
  private session:HitTestSession;
  private cursor:SceneObject;
  private marks:SceneObject[]=[];
  private points:vec3[]=[];
  private active=false;
  private pending=false;
  private epoch=0;
  private nextQuery=0;
  private lastInput=-1;
  private queued:{origin:vec3;end:vec3}|null=null;
  private note='Point at a nearby object and pinch.';
  private normal:vec3[]=[];
  constructor(private anchors:SceneObject[],private rescue:SceneObject,material:Material,parent:SceneObject) {
    this.roaming=new RoomInvadersRoaming(anchors);this.depthCover=new RoomInvadersDepthCover(this.roaming);
    this.cursor=surfaceMarker(parent,material,'SurfaceCursor',[0.32,1,0.72,1]);
    for(let i=0;i<3;i++)this.marks.push(surfaceMarker(parent,material,'SurfacePoint'+(i+1),[0.66,0.34,1,1]));
    this.cursor.enabled=false;this.marks.forEach(m=>m.enabled=false);
    try {
      const module=require('LensStudio:WorldQueryModule') as WorldQueryModule;
      const options=HitTestSessionOptions.create();options.filter=false;
      this.session=module.createHitTestSessionWithOptions(options);
    } catch(e) {this.note='Room sensing unavailable. Reopen in a room preview or on Specs.';console.warn('Room placement unavailable: '+e);}
    // The renderer's WorldMesh asset alone does not reliably enable raycast tracking
    // after switching interactive environments. Placement explicitly requests it.
    const camera=WorldCameraFinderProvider.getInstance().getComponent();
    const tracking=camera.getSceneObject().getComponent('Component.DeviceTracking') as DeviceTracking;
    if(tracking)tracking.worldOptions.enableWorldMeshesTracking=true;
    this.reset();
  }
  surfaceNormal(index:number):vec3 {return this.roaming.normal(index)??this.normal[index]??vec3.up();}
  surfaceKind(index:number):string{return this.roaming.kind(index);}
  prepare(s:Snapshot):void{const camera=WorldCameraFinderProvider.getInstance().getComponent();this.roaming.sync(s,camera.getTransform().getWorldPosition(),camera.getSceneObject().getComponent('Component.DeviceTracking') as DeviceTracking);}
  prepareRescue():void{
    if(!this.automatic)return;
    const camera=WorldCameraFinderProvider.getInstance().getComponent(),origin=camera.getTransform().getWorldPosition();
    const tracking=camera.getSceneObject().getComponent('Component.DeviceTracking') as DeviceTracking;
    this.roaming.placeRescue(this.rescue,origin,p=>{if(this.depthCover.blocked(origin,p))return false;const hits=tracking?.raycastWorldMesh(origin,p);return !hits?.length||hits[0].position.sub(origin).length+2>=p.sub(origin).length;});
  }
  roamingStatus(){return {...this.roaming.status(),depthPatches:this.depthCover.count};}
  get ready():boolean{return this.points.length===3;}
  status():{count:number;ready:boolean;automatic:boolean;message:string;points:number[][];distances:number[];roles:string[];scan:ReturnType<RoomInvadersAutoScan["diagnostics"]>} {
    return {scan:this.scanner.diagnostics(),count:this.points.length,ready:this.ready,automatic:this.automatic,message:this.note,points:this.points.map(p=>[p.x,p.y,p.z]),distances:this.points.map(p=>p.sub(this.setupOrigin).length/100),roles:this.points.map((_,i)=>this.automatic?'starter':i===0?'near':'far')};
  }
  reset(automatic=true):void {
    this.automatic=automatic;this.roaming.reset();this.depthCover.reset();this.setupStarted=getTime();this.lastProgress=this.setupStarted;this.scanner.reset();this.probe=0;this.floorY=null;
    this.setupOrigin=WorldCameraFinderProvider.getInstance().getComponent().getTransform().getWorldPosition();
    this.epoch++;this.pending=false;this.queued=null;this.points=[];this.normal=[];this.active=!!this.session;
    this.cursor.enabled=false;this.marks.forEach(m=>m.enabled=false);
    if(this.session){this.session.start();this.note=automatic?'Scanning room — slowly look around.':'Pinch a near surface (1–2.5 m), then two far surfaces (3–6 m).';}
    this.nextQuery=0;this.lastInput=getTime();
  }
  update():void {
    if(this.automatic&&this.session){
      const camera=WorldCameraFinderProvider.getInstance().getComponent();
      this.roaming.sample(camera,this.scanner.diagnostics().groundEstimate);
      this.depthCover.update(camera,this.scanner.diagnostics().groundEstimate);
      if(!this.ready&&getTime()-this.setupStarted>8){
        const sites=this.roaming.bootstrap(this.points);
        for(const s of sites){
          if(this.ready)break;
          if(this.points.every(p=>p.sub(s.p).length>=75))this.commit(s.p,s.n,camera.getTransform().getWorldPosition(),true);
        }
      }
    }
    if(!this.active||!this.session)return;
    if(this.automatic){this.scan();return;}
    const inputs=SIK.InteractionManager.getTargetingInteractors().filter(i=>i.isActive()&&i.startPoint&&i.endPoint);
    const input=inputs.find(i=>(i.currentTrigger&InteractorTriggerType.Pinch)!==0)||inputs[0];
    if(!input||input.currentInteractable){this.cursor.enabled=false;return;}
    const pinch=(input.currentTrigger&InteractorTriggerType.Pinch)!==0&&input.previousTrigger===InteractorTriggerType.None;
    let origin=input.startPoint;const dir=input.endPoint.sub(origin);
    if(dir.length<0.01)return;
    let end=origin.add(dir.normalize().uniformScale(650));
    if(pinch&&getTime()-this.lastInput>=0.35){this.queued={origin,end};this.lastInput=getTime();}
    if(this.pending||(!this.queued&&getTime()<this.nextQuery))return;
    const commit=!!this.queued;
    if(this.queued){origin=this.queued.origin;end=this.queued.end;this.queued=null;}
    const epoch=this.epoch;this.pending=true;this.nextQuery=getTime()+0.2;
    this.session.hitTest(origin,end,result=>{
      if(epoch!==this.epoch||!this.active)return;
      this.pending=false;
      let hit:{position:vec3;normal:vec3}|null=result;
      const cameraComponent=WorldCameraFinderProvider.getInstance().getComponent();
      const tracking=cameraComponent.getSceneObject().getComponent('Component.DeviceTracking') as DeviceTracking;
      if(tracking&&(!hit||!distanceFits(hit.position,this.setupOrigin,this.points))){
        const mesh=tracking.raycastWorldMesh(origin,end);
        if(mesh.length)hit={position:mesh[0].position,normal:mesh[0].normal};
      }
      if(!hit){this.cursor.enabled=false;this.note='No surface yet. Look at a well-lit nearby object.';return;}
      const camera=WorldCameraFinderProvider.getInstance().getComponent().getTransform().getWorldPosition();
      const distance=hit.position.sub(camera).length;
      if(!distanceFits(hit.position,this.setupOrigin,this.points)){this.cursor.enabled=false;this.note=this.points.length===0?'Choose a near surface 1–2.5 metres away.':'Choose a far surface 3–6 metres away.';return;}
      this.cursor.enabled=true;this.alignMarker(this.cursor,hit.position,hit.normal);
      this.note='Object '+(this.points.length+1)+'/3 — pinch the green spot to place.';
      if(commit)this.commit(hit.position,hit.normal,camera);
    });
  }
  private scan():void {
    const stalled=getTime()-this.lastProgress;
    if(stalled>=14)this.note=this.scanner.diagnostics().observations===0?'No nearby surfaces yet. Move closer to an object, then look across it.':'Look at another edge or corner, or try Rescan room.';
    else if(stalled>=7)this.note='Look up, then sweep across the room.';
    else if(this.points.length===0)this.note='Look across nearby objects, edges and corners.';
    else if(this.points.length===1)this.note='Turn toward a different corner.';
    else this.note='One more spot. Look higher or farther.';
    if(this.pending||getTime()<this.nextQuery)return;
    const camera=WorldCameraFinderProvider.getInstance().getComponent();
    const origin=camera.getTransform().getWorldPosition();
    // Depth queries only work inside the camera view. Keep this ray on screen;
    // use a separate wider ray for the reconstructed mesh.
    const end=camera.screenSpaceToWorldSpace(this.scanner.next(),650);let meshEnd=end;
    // Sample a wider band of nearby furniture, including tops outside the narrow display field.
    if(this.points.length===0){
      const k=this.probe++%54,x=[-1.4,-1,-.7,-.35,0,.35,.7,1,1.4][k%9],y=[-.55,-.75,-.85,-.95,-1.15,-.35][Math.floor(k/9)];
      meshEnd=origin.add(camera.getTransform().getWorldRotation().multiplyVec3(new vec3(x,y,-1).normalize()).uniformScale(650));
    }
    const epoch=this.epoch;this.pending=true;this.nextQuery=getTime()+0.2;
    this.session.hitTest(origin,end,hit=>{
      if(epoch!==this.epoch||!this.active)return;
      this.pending=false;
      if(hit)this.scanner.accept(hit.position,hit.normal,this.setupOrigin);
      // Mesh hits are measured geometry too; no invented fallback positions.
      const tracking=camera.getSceneObject().getComponent('Component.DeviceTracking') as DeviceTracking;
      if(tracking){
        if(this.floorY===null){
          const floor=tracking.raycastWorldMesh(this.setupOrigin,this.setupOrigin.add(new vec3(0,-650,0)));
          if(floor.length&&floor[0].normal.y>.7){this.floorY=floor[0].position.y;this.scanner.setFloor(this.floorY);console.log('RoomInvaders measured floor '+this.floorY);}
        }
        const hits=tracking.raycastWorldMesh(origin,meshEnd);if(hits.length)this.scanner.accept(hits[0].position,hits[0].normal,this.setupOrigin);
      }
      const candidate=this.scanner.candidate(this.points,this.setupOrigin);
      if(candidate)this.commit(candidate.position,candidate.normal,origin);
    });
  }
  private alignMarker(o:SceneObject,p:vec3,n:vec3):void {
    const tr=o.getTransform();tr.setWorldPosition(p.add(n.uniformScale(1.5)));
    const tangent=Math.abs(n.dot(vec3.up()))>0.95?vec3.forward():n.cross(vec3.up()).normalize();
    tr.setWorldRotation(quat.lookAt(tangent,n));
  }
  private commit(p:vec3,n:vec3,camera:vec3,wide=false):void {
    // Match placement to the same reconstructed geometry used by the occluder when available.
    const cam=WorldCameraFinderProvider.getInstance().getComponent();
    const tracking=cam.getSceneObject().getComponent('Component.DeviceTracking') as DeviceTracking;
    if(tracking){const ray=p.sub(camera),hits=tracking.raycastWorldMesh(camera,camera.add(ray.normalize().uniformScale(ray.length+40)));
      if(hits.length&&hits[0].position.sub(p).length<40){p=hits[0].position;n=hits[0].normal;}}
    if(this.automatic&&!wide&&!this.scanner.aboveGround(p))return;
    if(!wide&&!distanceFits(p,this.setupOrigin,this.points)){this.note=this.points.length===0?'Look down toward a surface 1–2.5 m away.':'Find a farther surface 3–6 m away.';return;}
    if(this.points.some(q=>q.sub(p).length<75)){this.note='Pick a different spot, at least 75 cm from the others.';return;}
    this.roaming.add(p,n,n.y<-.55?'ceiling':n.y>.55?'surface':'cover');
    const i=this.points.length;this.points.push(p);this.normal.push(n);this.lastProgress=getTime();
    this.alignMarker(this.marks[i],p,n);this.marks[i].enabled=true;
    // Upright creatures face the player; their bases clear the selected surface.
    const base=p.add(n.uniformScale(12)).add(new vec3(0,Math.max(0,n.y)*2,0));
    const face=new vec3(camera.x-p.x,0,camera.z-p.z);
    const tr=this.anchors[i].getTransform();tr.setWorldPosition(base);
    if(face.length>0.01)tr.setWorldRotation(quat.lookAt(face.normalize(),vec3.up()));
    console.log('RoomInvaders surface '+(i+1)+' placed: '+JSON.stringify([p.x,p.y,p.z]));
    if(this.ready){
      this.active=false;this.session.stop();this.cursor.enabled=false;
      const a=this.anchors[1].getTransform(),r=this.rescue.getTransform();
      r.setWorldPosition(a.getWorldPosition().add(new vec3(0,22,0)));r.setWorldRotation(a.getWorldRotation());
      this.note='Three room spots ready. Pinch Start.';
    }
  }
  showMarkers(show:boolean):void {this.marks.forEach((m,i)=>m.enabled=show&&i<this.points.length);}
  destroy():void {this.depthCover.destroy();this.active=false;this.epoch++;this.session?.stop();this.cursor.destroy();this.marks.forEach(m=>m.destroy());}
}
