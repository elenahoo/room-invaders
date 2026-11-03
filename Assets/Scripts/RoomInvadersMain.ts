/** Orchestrates state, authored spawn anchors, target views and audio. UI stays in HUDUI. */
import {RoomInvadersHUDUI} from './RoomInvadersHUDUI';
import {RoomInvadersState,Snapshot,Rules} from './RoomInvadersState';
import {RoomInvadersVisibility} from './RoomInvadersVisibility';
import {RoomInvadersPlacement} from './RoomInvadersPlacement';
import {RoomInvadersTargets} from './RoomInvadersTargets';
import {RoomInvadersWarnings} from './RoomInvadersWarnings';
const ZAP=requireAsset('../GeneratedSFX/Zap.wav') as AudioTrackAsset;
const RESCUE=requireAsset('../GeneratedSFX/Rescue.wav') as AudioTrackAsset;
const ESCAPE=requireAsset('../GeneratedSFX/Escape.wav') as AudioTrackAsset;
const MUSIC=requireAsset('../GeneratedSFX/BackgroundMusic.wav') as AudioTrackAsset;
@component
export class RoomInvadersMain extends BaseScriptComponent {
  @ui.label('Room Invaders — encounter controller')
  @ui.separator
  @ui.group_start('References')
  @input @hint('Passive world-space UI') hud:RoomInvadersHUDUI;
  @input @hint('Room object 1 surface anchor') boxSpawn:SceneObject;
  @input @hint('Room object 2 surface anchor') doorSpawn:SceneObject;
  @input @hint('Room object 3 surface anchor') shelfSpawn:SceneObject;
  @input @hint('Movable Pip rescue anchor') rescueSpot:SceneObject;
  @input @hint('Imported vertex-color material') material:Material;
  @ui.group_end
  @ui.group_start('Settings')
  @input @hint('Round duration in seconds') @widget(new SliderWidget(15,180,1)) duration:number=90;
  @input @hint('Rescue trigger in seconds') @widget(new SliderWidget(5,120,1)) rescueAt:number=30;
  @input @hint('Seconds allowed to free Pip') @widget(new SliderWidget(5,60,1)) rescueWindow:number=22;
  @input @hint('Minimum seconds between shots') @widget(new SliderWidget(0.1,1,0.01)) cooldown:number=0.22;
  @input @hint('Starting shield count') @widget(new SliderWidget(1,20,1)) health:number=5;
  @input @hint('Early seconds between spawns') @widget(new SliderWidget(1,8,0.1)) spawnInterval:number=2.7;
  @input @hint('Seconds between spawns after rescue') @widget(new SliderWidget(1,8,0.1)) lateSpawnInterval:number=2.1;
  @input @hint('Early seconds until escape') @widget(new SliderWidget(3,15,0.5)) enemyLifetime:number=6.5;
  @input @hint('Late seconds until escape') @widget(new SliderWidget(3,15,0.5)) lateEnemyLifetime:number=5.5;
  @input @hint('Untargetable emergence time') @widget(new SliderWidget(0.2,2,0.05)) emergence:number=2;
  @input @hint('Directional audio lead before visible emergence') @widget(new SliderWidget(0.4,2,0.05)) warningLead:number=0.9;
  @input @hint('Peeker animation cycle') @widget(new SliderWidget(1,5,0.1)) peekPeriod:number=2.2;
  @input @hint('Visible portion of each peek cycle') @widget(new SliderWidget(0.5,4,0.1)) peekVisible:number=1.5;
  @input @hint('Base points per invader') @widget(new SliderWidget(10,500,10)) hitPoints:number=100;
  @input @hint('Extra points per combo step') @widget(new SliderWidget(0,100,5)) comboStep:number=20;
  @input @hint('Maximum combo bonus steps') @widget(new SliderWidget(0,10,1)) comboCap:number=5;
  @input @hint('Points per lock') @widget(new SliderWidget(0,200,10)) lockPoints:number=50;
  @input @hint('Bonus for selecting freed Pip') @widget(new SliderWidget(0,2000,50)) rescuePoints:number=500;
  @input @hint('Immediate feedback volume') @widget(new SliderWidget(0,1,0.05)) sfxVolume:number=0.3;
  @input @hint('Quiet looping music volume') @widget(new SliderWidget(0,0.4,0.01)) musicVolume:number=0.06;
  @input('vec4','{0.66,0.34,1,1}') @widget(new ColorWidget()) @hint('Invader and cage color') violet:vec4;
  @input('vec4','{0.32,1,0.72,1}') @widget(new ColorWidget()) @hint('Pip color') mint:vec4;
  @input('vec4','{0.35,0.24,0.46,1}') @widget(new ColorWidget()) @hint('Prop color') wood:vec4;
  @input('vec4','{0.4,0.82,1,1}') @widget(new ColorWidget()) @hint('Prop edge color') accent:vec4;
  @ui.group_end
  @input @hint('Show target collider wireframes after restart') debugColliders:boolean=false;
  private visibility:RoomInvadersVisibility;
  private placement:RoomInvadersPlacement;
  private game:RoomInvadersState;
  private targets:RoomInvadersTargets;
  private warnings:RoomInvadersWarnings;
  private zap:AudioComponent;
  private rescue:AudioComponent;
  private escape:AudioComponent;
  private music:AudioComponent;
  private off:(()=>void)[]=[];
  private feedback='';
  private feedbackUntil=0;
  onAwake():void {
    this.createEvent('OnStartEvent').bind(()=>this.initialize());
    this.createEvent('UpdateEvent').bind(()=>this.update());
    this.createEvent('LateUpdateEvent').bind(()=>this.placement?.update());
    this.createEvent('OnDestroyEvent').bind(()=>{this.visibility?.destroy();this.placement?.destroy();this.targets?.destroy();this.warnings?.destroy();this.off.forEach(f=>f());});
  }
  private initialize():void {
    if(!this.hud||!this.boxSpawn||!this.doorSpawn||!this.shelfSpawn||!this.rescueSpot||!this.material) {
      console.error('RoomInvaders: required scene references missing');return;
    }
    const rules:Rules={
      duration:this.duration,
      rescueAt:this.rescueAt,
      rescueWindow:this.rescueWindow,
      cooldown:this.cooldown,
      health:this.health,
      spawnInterval:this.spawnInterval,
      lateSpawnInterval:this.lateSpawnInterval,
      enemyLifetime:this.enemyLifetime,
      lateEnemyLifetime:this.lateEnemyLifetime,
      emergence:this.emergence,warningLead:this.warningLead,
      peekPeriod:this.peekPeriod,
      peekVisible:this.peekVisible,
      hitPoints:this.hitPoints,
      comboStep:this.comboStep,
      comboCap:this.comboCap,reactionMax:100,reactionWindow:2,measuredExposure:true,
      lockPoints:this.lockPoints,
      rescuePoints:this.rescuePoints,
    };
    this.game=new RoomInvadersState(rules);
    const color=(c:vec4):[number,number,number,number]=>[c.x,c.y,c.z,c.w];
    this.targets=new RoomInvadersTargets(this.material,(id,point)=>this.shootVisible(id,point),this.debugColliders,
      [this.boxSpawn,this.doorSpawn,this.shelfSpawn],this.rescueSpot,color(this.violet),color(this.mint),color(this.wood),color(this.accent),i=>this.placement?.surfaceNormal(i)??vec3.up(),i=>this.placement?.surfaceKind(i)??'surface');
    this.warnings=new RoomInvadersWarnings([this.boxSpawn,this.doorSpawn,this.shelfSpawn],Math.min(1,this.sfxVolume*1.5));
    this.visibility=new RoomInvadersVisibility();
    this.placement=new RoomInvadersPlacement([this.boxSpawn,this.doorSpawn,this.shelfSpawn],this.rescueSpot,this.material,this.sceneObject);
    this.zap=this.audio(ZAP,this.sfxVolume,true);this.rescue=this.audio(RESCUE,this.sfxVolume,true);
    this.escape=this.audio(ESCAPE,this.sfxVolume,true);this.music=this.audio(MUSIC,this.musicVolume,false);
    this.off.push(this.hud.onPrimary.add(()=>this.primary()),this.hud.onRestart.add(()=>this.startRound()),this.hud.onReposition.add(()=>this.reposition()),this.hud.onManual.add(()=>this.reposition(false)));
    this.render();console.log('RoomInvaders ready: 3 spawns, SIK pinch targets, Pip rescue.');
  }
  public snapshot():Snapshot {return this.game?.snapshot();}
  public reviewStatus(){return {models:this.targets?.status(),warnings:this.warnings?.status(),warningLead:this.warningLead,roaming:this.placement?.roamingStatus()};}
  public placementStatus(){return this.placement?.status();}
  public reposition(automatic=true):void {
    this.warnings.reset();this.visibility.reset();this.game.reset();this.music.stop(false);this.feedback='';this.placement.reset(automatic);this.render();
  }
  public startRound():void {
    if(!this.game||!this.placement.ready)return;this.warnings.reset();this.visibility.reset();this.feedback='';this.placement.prepareRescue();this.game.start();this.music.stop(false);this.music.play(-1);this.render();
    console.log('RoomInvaders round started');
  }
  public primary():void {
    if(!this.game)return;const s=this.game.snapshot();
    if(s.phase!=='playing'){this.startRound();return;}
    this.game.pause(!s.paused);if(!s.paused)this.music.pause();else this.music.resume();this.render();
  }
  private shootVisible(id:string,point:vec3):void {
    this.visibility.check(point,visible=>{
      if(visible)this.shoot(id);
      else {this.feedback='Aim at an exposed part of the creature.';this.feedbackUntil=this.game.snapshot().elapsed+1.2;this.render();}
    });
  }
  public shoot(id:string):void {
    if(!this.game)return;const result=this.game.pinch(id);
    if(['hit','unlock'].includes(result))this.zap.play(1);
    if(result==='saved')this.rescue.play(1);
    this.render();
  }
  private update():void {
    if(!this.game)return;
    for(const e of this.game.snapshot().enemies)this.game.setExposure(e.id,this.visibility.exposed(this.targets.exposurePoints(e.spawn)));
    this.game.advance(Math.max(0,Math.min(getDeltaTime(),0.1)));this.render();
  }
  private render():void {
    if(!this.game)return;
    for(const e of this.game.drainEvents()) {
      if(e.type==='hit')this.feedback='ZAP! +'+e.points+' · Speed +'+e.speedBonus;
      else if(e.type==='unlock')this.feedback='Lock broken — keep going!';
      else if(e.type==='friend-protected')this.feedback='Pip is a friend. Break the three locks first.';
      else if(e.type==='escape'){this.feedback='Invader escaped — shield lost';this.escape.play(1);}
      else if(e.type==='saved')this.feedback='PIP SAVED! +'+this.rescuePoints;
      else continue;
      this.feedbackUntil=this.game.snapshot().elapsed+1.2;
    }
    const s=this.game.snapshot();let message='Listen and look around the room. Point + pinch.';
    if(s.phase==='ready')message=this.hud.readyMessage;
    else if(s.phase==='finished') {
      message=s.result==='rescued'?'MISSION COMPLETE — Pip is safe!':s.result==='overrun'?'ROOM OVERRUN — try again!':'ROUND COMPLETE — Pip still needs rescuing';
      this.music.stop(false);
    } else if(s.paused)message='PAUSED — pinch Resume when ready';
    else if(s.rescue==='locked')message='SAVE PIP — pinch the three violet locks!';
    else if(s.rescue==='free')message='CAGE OPEN — pinch Pip to rescue!';
    else if(s.rescue==='saved')message='Pip is safe. Keep the room clear!';
    if(s.phase==='playing'&&!s.paused&&s.elapsed<this.feedbackUntil)message=this.feedback;
    if(!this.placement.ready)message=this.placement.status().message;
    else if(s.phase==='ready')message='Room ready · Pinch Start · Keep looking around for hiding places.';
    this.placement.showMarkers(s.phase!=='playing');
    this.hud.render(s,message,!this.placement.ready,this.placement.status().count,this.placement.status().automatic);this.placement.prepare(s);this.targets.render(s,this.emergence,this.peekPeriod,this.peekVisible,this.warningLead);
    this.warnings.sync(s);this.music.volume=this.musicVolume*(this.warnings.active?0.25:1);
  }
  private audio(track:AudioTrackAsset,volume:number,lowLatency:boolean):AudioComponent {
    const a=this.sceneObject.createComponent('Component.AudioComponent') as AudioComponent;
    a.audioTrack=track;a.volume=volume;a.playbackMode=lowLatency?Audio.PlaybackMode.LowLatency:Audio.PlaybackMode.LowPower;return a;
  }
}
