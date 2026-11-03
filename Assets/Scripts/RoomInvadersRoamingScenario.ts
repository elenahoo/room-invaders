/** Real room geometry, repeated SIK hits, and spatial warning positions across changing spawn sites. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {RoomInvadersLeafHelper} from './RoomInvadersLeafHelper';
@component
export class RoomInvadersRoamingScenario extends Scenario {
 async run():Promise<void>{
  const h=new RoomInvadersLeafHelper();try{await h.waitFor(()=>h.main().placementStatus().ready,25000);}catch(e){console.log('ROAMING_SETUP_FAILURE '+JSON.stringify({placement:h.main().placementStatus(),pool:h.main().reviewStatus().roaming}));throw e;}await h.start();await h.defendUntil(25);
  const r=h.main().reviewStatus(),pool=r.roaming;
  expect(pool.siteCount).toBeGreaterThan(3);expect(pool.history.length).toBeGreaterThan(5);
  expect(new Set(pool.history.map(x=>x.site)).size).toBeGreaterThan(3);
  expect([0,1,2].some(slot=>new Set(pool.history.filter(x=>x.slot===slot).map(x=>x.site)).size>1)).toBe(true);
  for(let i=1;i<pool.history.length;i++)expect(pool.history[i].site===pool.history[i-1].site).toBe(false);
  for(const a of r.warnings.events){
    const location=pool.history.find(e=>e.id===a.id);expect(!!location).toBe(true);expect(a.spatial).toBe(true);
  }
  expect(h.main().snapshot().score).toBeGreaterThan(h.main().snapshot().hits*100);
  h.main().primary();
  console.log('ROAMING_REACTION_INTEGRATION_PASS '+JSON.stringify({state:h.main().snapshot(),review:h.main().reviewStatus()}));
 }
}
