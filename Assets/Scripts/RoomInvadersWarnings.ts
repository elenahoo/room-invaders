/** Local spatial cues start before each monster is visible. No network audio. */
import {Snapshot} from './RoomInvadersState';
import WorldCameraFinderProvider from 'SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider';
const TRACKS=[requireAsset('../GeneratedSFX/WraithWarning.wav'),requireAsset('../GeneratedSFX/HoundWarning.wav'),requireAsset('../GeneratedSFX/LeechWarning.wav')] as AudioTrackAsset[];
export class RoomInvadersWarnings {
 private players:AudioComponent[]=[];private roots:SceneObject[]=[];private seen=new Set<string>();private wasPaused=false;
 private history:{id:string;spawn:number;at:number;position:number[];spatial:boolean}[]=[];
 constructor(anchors:SceneObject[],volume:number){
  const camera=WorldCameraFinderProvider.getInstance().getComponent().getSceneObject();
  if(!camera.getComponent('Component.AudioListenerComponent'))camera.createComponent('Component.AudioListenerComponent');
  anchors.forEach((anchor,i)=>{
   const root=global.scene.createSceneObject('MonsterWarning'+i);root.setParent(anchor);this.roots.push(root);
   const audio=root.createComponent('Component.AudioComponent') as AudioComponent;
   audio.audioTrack=TRACKS[i];audio.volume=volume;audio.playbackMode=Audio.PlaybackMode.LowLatency;
   audio.spatialAudio.enabled=true;audio.spatialAudio.positionEffect.enabled=true;
   audio.spatialAudio.distanceEffect.enabled=true;audio.spatialAudio.distanceEffect.minDistance=120;audio.spatialAudio.distanceEffect.maxDistance=1200;
   this.players.push(audio);
  });
 }
 reset():void{this.players.forEach(a=>a.stop(false));this.seen.clear();this.history=[];this.wasPaused=false;}
 sync(s:Snapshot):void{
  if(s.phase!=='playing'){this.players.forEach(a=>a.stop(false));return;}
  if(s.paused){if(!this.wasPaused)this.players.forEach(a=>{if(a.isPlaying())a.pause();});this.wasPaused=true;return;}
  if(this.wasPaused)this.players.forEach(a=>{if(a.isPaused())a.resume();});this.wasPaused=false;
  for(const e of s.enemies)if(!this.seen.has(e.id)){
   this.seen.add(e.id);const a=this.players[e.spawn];a.stop(false);a.play(1);
   const p=this.roots[e.spawn].getTransform().getWorldPosition();
   this.history.push({id:e.id,spawn:e.spawn,at:s.elapsed,position:[p.x,p.y,p.z],spatial:a.spatialAudio.enabled&&a.spatialAudio.positionEffect.enabled});
   console.log('MONSTER_WARNING '+e.id+' at '+s.elapsed.toFixed(3));
  }
 }
 get active():boolean{return this.players.some(a=>a.isPlaying());}
 status(){return {events:this.history.slice(),playing:this.players.map(a=>a.isPlaying()),paused:this.wasPaused,audioPaused:this.players.map(a=>a.isPaused())};}
 destroy():void{this.players.forEach(a=>a.stop(false));this.roots.forEach(o=>o.destroy());}
}
