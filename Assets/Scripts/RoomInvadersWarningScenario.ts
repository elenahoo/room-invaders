/** Regression for actual hidden warning interval, spatial settings and all three new models. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {ScenarioConfig} from 'Leaf.lspkg/Scenarios/scenario/ScenarioConfig';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {sleep} from 'Leaf.lspkg/Utils/common/Utils';
import {RoomInvadersLeafHelper} from './RoomInvadersLeafHelper';
@component
export class RoomInvadersWarningScenario extends Scenario {
 async run(config?:ScenarioConfig):Promise<void>{
  const h=new RoomInvadersLeafHelper();
  // Visual review includes deliberate head turns while the real depth scan gathers furniture.
  await h.waitFor(()=>h.main().placementStatus().ready,120000);await h.start();
  await h.waitFor(()=>h.main().snapshot().enemies.length===1,5000);
  let s=h.main().snapshot(),r=h.main().reviewStatus(),first=s.enemies[0];
  expect(r.models.targets[first.spawn].visible).toBe(false);expect(first.targetable).toBe(false);
  expect(r.warnings.events.length).toBe(1);expect(r.warnings.events[0].spatial).toBe(true);
  expect(r.warnings.playing[0]).toBe(true);h.main().primary();
  expect(h.main().reviewStatus().warnings.audioPaused[0]).toBe(true);
  const warningTime=h.main().snapshot().elapsed;await sleep(500);
  expect(h.main().snapshot().elapsed).toBe(warningTime);h.main().primary();
  expect(h.main().reviewStatus().warnings.events.length).toBe(1);
  await h.waitFor(()=>h.main().reviewStatus().models.reveals.length>0,3000);
  r=h.main().reviewStatus();expect(r.models.reveals[0].at-r.warnings.events[0].at>=h.main().warningLead-.03).toBe(true);
  await h.waitFor(()=>h.main().reviewStatus().models.targets.every(t=>t.visible),10000);
  h.main().primary();s=h.main().snapshot();r=h.main().reviewStatus();
  expect(s.paused).toBe(true);expect(r.warnings.paused).toBe(true);
  expect(r.models.targets.map(t=>t.name).join(',')).toBe('Shadow Wraith,Ember Hound,Void Leech');
  expect(r.models.targets.every(t=>t.visible)).toBe(true);
  expect(r.warnings.events.length).toBe(3);
  for(const event of r.warnings.events){const reveal=r.models.reveals.find(x=>x.id===event.id);
   expect(!!reveal).toBe(true);expect(reveal.at-event.at>=h.main().warningLead-.03).toBe(true);expect(event.spatial).toBe(true);
  }
  console.log('WARNINGS_AND_ROSTER_PASS '+JSON.stringify({state:s,review:r,placement:h.main().placementStatus()}));
  if(config?.get('view')==='review')return;
  const frozen=s.elapsed;await sleep(600);expect(h.main().snapshot().elapsed).toBe(frozen);
  await h.tap('RestartButton');r=h.main().reviewStatus();
  expect(r.warnings.events.length).toBe(0);expect(r.warnings.playing.some(Boolean)).toBe(false);
 }
}
