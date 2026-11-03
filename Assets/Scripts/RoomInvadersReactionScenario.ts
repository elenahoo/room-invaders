/** Compare independent real state machines: reaction speed, hidden/paused time, score floor and double hits. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {RoomInvadersState,Rules} from './RoomInvadersState';
const rules:Rules={duration:90,rescueAt:80,rescueWindow:8,cooldown:.22,health:20,spawnInterval:2.7,lateSpawnInterval:2.1,enemyLifetime:12,lateEnemyLifetime:12,warningLead:.9,emergence:2,peekPeriod:2.2,peekVisible:1.5,hitPoints:100,comboStep:20,comboCap:5,lockPoints:50,rescuePoints:500,reactionMax:100,reactionWindow:2,measuredExposure:true};
function ready(){const g=new RoomInvadersState(rules);g.start();g.advance(4.35);return g;}
@component
export class RoomInvadersReactionScenario extends Scenario {
 async run():Promise<void>{
  const shot=(delay:number)=>{const g=ready(),e=g.snapshot().enemies[0];g.setExposure(e.id,true);g.advance(delay);expect(g.pinch(e.id)).toBe('hit');const event=g.drainEvents().find(v=>v.type==='hit');const score=g.snapshot().score;g.advance(.3);expect(g.pinch(e.id)).toBe('miss');expect(g.snapshot().score).toBe(score);return event;};
  const fast=shot(.05),slow=shot(1.05),late=shot(2.5);
  expect(fast.points).toBeGreaterThan(slow.points);expect(slow.points).toBeGreaterThan(late.points);
  expect(late.points).toBe(100);expect(late.speedBonus).toBe(0);
  const hidden=ready(),id=hidden.snapshot().enemies[0].id;hidden.advance(2);
  expect(hidden.snapshot().enemies[0].reactionTime??0).toBe(0);hidden.setExposure(id,true);hidden.advance(.05);
  hidden.pinch(id);expect(hidden.drainEvents().find(e=>e.type==='hit').points).toBe(fast.points);
  const paused=ready(),pid=paused.snapshot().enemies[0].id;paused.setExposure(pid,true);paused.advance(.25);
  const before=paused.snapshot();paused.pause(true);paused.advance(20);expect(paused.pinch(pid)).toBe('inactive');
  expect(paused.snapshot().elapsed).toBe(before.elapsed);paused.pause(false);paused.pinch(pid);
  expect(paused.drainEvents().find(e=>e.type==='hit').reactionTime<.26).toBe(true);
  const peek=new RoomInvadersState(rules);peek.start();peek.advance(7.1);
  const peeker=peek.snapshot().enemies.find(e=>e.kind==='peek');peek.setExposure(peeker.id,true);peek.advance(1.55);
  const frozen=peek.snapshot().enemies.find(e=>e.id===peeker.id).reactionTime;peek.advance(.3);
  expect(peek.snapshot().enemies.find(e=>e.id===peeker.id).reactionTime).toBe(frozen);
  console.log('REACTION_SCORE_PASS '+JSON.stringify({fast,slow,late,hiddenTimeExcluded:true,pauseExcluded:true,peekHidingExcluded:true}));
 }
}
