/** Pure encounter state, ported from the tested local playtest. No scene, input or UI ownership. */
export type Rules = {
  duration:number; rescueAt:number; rescueWindow:number; cooldown:number; health:number;
  spawnInterval:number; lateSpawnInterval:number; enemyLifetime:number; lateEnemyLifetime:number;
  warningLead?:number; emergence:number; peekPeriod:number; peekVisible:number; hitPoints:number; comboStep:number;
  comboCap:number; reactionMax?:number; reactionWindow?:number; measuredExposure?:boolean; lockPoints:number; rescuePoints:number;
};
export type Enemy = {id:string; spawn:number; kind:string; born:number; lifetime:number; targetable?:boolean; reactionTime?:number};
export type GameEvent = {type:string; id?:string; index?:number; points?:number; result?:string; speedBonus?:number; reactionTime?:number};
export type Snapshot = {
  phase:string; paused:boolean; elapsed:number; remaining:number; score:number; health:number;
  shots:number; hits:number; combo:number; enemies:Enemy[]; rescue:string; locks:boolean[]; result:string;
};
/** Give a peeker its full exposed window after emergence, independent of reveal duration. */
export function peekIsExposed(age:number,emergence:number,period:number,visible:number):boolean {
  return age<emergence||(age-emergence)%period<visible;
}
/** Spend most of the reveal intersecting the measured surface rather than racing through it. */
export function emergenceReveal(progress:number):number {
  const p=Math.max(0,Math.min(1,progress));
  const lerp=(a:number,b:number,t:number)=>a+(b-a)*t*t*(3-2*t);
  if(p<0.15)return lerp(0,0.34,p/0.15);
  if(p<0.55)return lerp(0.34,0.5,(p-0.15)/0.4);
  return lerp(0.5,1,(p-0.55)/0.45);
}
export class RoomInvadersState {
  private s:Snapshot;
  private serial=0;
  private nextSpawn=1.4;
  private lastShot=-1;
  private events:GameEvent[]=[];
  private exposed=new Set<string>();
  setExposure(id:string,visible:boolean):void{if(visible)this.exposed.add(id);else this.exposed.delete(id);}
  constructor(public rules:Rules) { this.reset(); }
  reset():void {
    this.exposed.clear();this.serial=0; this.nextSpawn=1.4; this.lastShot=-1; this.events=[];
    this.s={phase:'ready',paused:false,elapsed:0,remaining:this.rules.duration,score:0,health:this.rules.health,
      shots:0,hits:0,combo:0,enemies:[],rescue:'waiting',locks:[true,true,true],result:''};
  }
  start():void {this.reset(); this.s.phase='playing'; this.emit('start');}
  pause(value:boolean):void {if(this.s.phase==='playing') this.s.paused=value;}
  private emit(type:string, data:Partial<GameEvent>={}):void {this.events.push({...data,type});}
  private targetable(e:Enemy):boolean {
    const age=this.s.elapsed-e.born-(this.rules.warningLead??0);
    return age>=this.rules.emergence && (e.kind!=='peek'||peekIsExposed(age,this.rules.emergence,this.rules.peekPeriod,this.rules.peekVisible));
  }
  private finish(result:string):void {
    this.s.phase='finished';this.s.result=result;this.s.paused=false;this.s.enemies=[];this.emit('finish',{result});
  }
  advance(seconds:number):void {
    if(!Number.isFinite(seconds)||seconds<0) throw new Error('Invalid encounter time');
    if(this.s.phase!=='playing'||this.s.paused) return;
    let left=Math.min(seconds,this.rules.duration-this.s.elapsed);
    while(left>0.000001&&this.s.phase==='playing') {
      const dt=Math.min(0.05,left);this.step(dt);left-=dt;
    }
  }
  private step(dt:number):void {
    const r=this.rules,s=this.s;
    s.elapsed=Math.min(r.duration,s.elapsed+dt);
    if(r.duration-s.elapsed<0.000001) s.elapsed=r.duration;
    if(s.rescue==='waiting'&&s.elapsed>=r.rescueAt) {s.rescue='locked';s.enemies=[];this.emit('rescue-start');}
    if(['locked','free'].includes(s.rescue)&&s.elapsed>=r.rescueAt+r.rescueWindow) {
      s.rescue='missed';this.nextSpawn=s.elapsed+1;this.emit('rescue-missed');
    }
    for(const e of s.enemies)if(this.targetable(e)&&(!r.measuredExposure||this.exposed.has(e.id)))e.reactionTime=(e.reactionTime??0)+dt;
    for(const e of s.enemies.slice()) if(s.elapsed-e.born>=e.lifetime) {
      s.enemies=s.enemies.filter(v=>v.id!==e.id);s.health--;s.combo=0;this.emit('escape');
      if(s.health<=0) {this.finish('overrun');return;}
    }
    if(s.elapsed>=r.duration) {this.finish(s.rescue==='saved'?'rescued':'rescue-missed');return;}
    if(!['locked','free'].includes(s.rescue)&&s.elapsed>=this.nextSpawn) {
      const spawn=this.serial%3;
      if(!s.enemies.some(e=>e.spawn===spawn)) {
        const e={id:'monster-'+this.serial,spawn,kind:this.serial%2?'peek':'pop',born:s.elapsed,
          lifetime:s.elapsed<r.rescueAt?r.enemyLifetime:r.lateEnemyLifetime};
        s.enemies.push(e);this.serial++;this.emit('spawn',{id:e.id});
      }
      this.nextSpawn=s.elapsed+(s.elapsed<r.rescueAt?r.spawnInterval:r.lateSpawnInterval);
    }
  }
  pinch(id:string):string {
    const s=this.s,r=this.rules;
    if(s.phase!=='playing'||s.paused) return 'inactive';
    if(s.elapsed-this.lastShot<r.cooldown) return 'cooldown';
    this.lastShot=s.elapsed;
    if(id==='friend'&&s.rescue==='free') {
      s.rescue='saved';s.score+=r.rescuePoints;this.nextSpawn=s.elapsed+2;this.emit('saved');return 'saved';
    }
    s.shots++;
    if(s.rescue==='locked'&&/^lock-[0-2]$/.test(id)) {
      const i=Number(id.slice(-1));
      if(s.locks[i]) {s.locks[i]=false;s.hits++;s.score+=r.lockPoints;this.emit('unlock',{index:i});
        if(s.locks.every(v=>!v)) {s.rescue='free';this.emit('friend-free');}return 'unlock';}
    }
    if(id==='friend'&&s.rescue==='locked') {s.combo=0;this.emit('friend-protected');return 'friend-protected';}
    const e=s.enemies.find(v=>v.id===id);
    if(e&&this.targetable(e)) {
      s.enemies=s.enemies.filter(v=>v.id!==id);this.exposed.delete(id);s.hits++;s.combo++;
      const speedBonus=Math.round((r.reactionMax??100)*Math.max(0,1-(e.reactionTime??0)/(r.reactionWindow??2)));
      const points=r.hitPoints+Math.min(r.comboCap,s.combo-1)*r.comboStep+speedBonus;
      s.score+=points;this.emit('hit',{id,points,speedBonus,reactionTime:e.reactionTime??0});return 'hit';
    }
    s.combo=0;this.emit('miss');return 'miss';
  }
  snapshot():Snapshot {
    return {...this.s,remaining:Math.max(0,this.rules.duration-this.s.elapsed),locks:this.s.locks.slice(),
      enemies:this.s.enemies.map(e=>({...e,targetable:this.targetable(e)}))};
  }
  drainEvents():GameEvent[] {const out=this.events;this.events=[];return out;}
}
