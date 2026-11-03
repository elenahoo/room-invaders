/** Real automatic scan + deterministic rejection checks; never injects placement points into the game. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {sleep} from 'Leaf.lspkg/Utils/common/Utils';
import {RoomInvadersLeafHelper} from './RoomInvadersLeafHelper';
import {RoomInvadersAutoScan,SurfaceSample,suitableSurface,hasSurfaceFeature} from './RoomInvadersAutoScan';
@component
export class RoomInvadersAutoScanScenario extends Scenario {
  async run():Promise<void> {
    const camera=new vec3(0,0,0),normal=new vec3(0,0,1);
    const wall:SurfaceSample={camera,normal,position:new vec3(0,0,-200),seen:getTime(),stable:2};
    expect(new RoomInvadersAutoScan().candidate([],camera)).toBe(null);
    expect(hasSurfaceFeature(wall,[wall,{...wall,position:new vec3(30,0,-200)}])).toBe(false);
    expect(suitableSurface({...wall,position:new vec3(0,-180,-100)})).toBe(false);
    expect(suitableSurface({...wall,position:new vec3(0,0,-20)})).toBe(false);
    expect(suitableSurface({...wall,position:({x:NaN,y:0,z:-100} as vec3)})).toBe(false);
    expect(hasSurfaceFeature({...wall,normal:vec3.up()},[])).toBe(true);
    expect(hasSurfaceFeature(wall,[wall,{...wall,position:new vec3(20,0,-212)}])).toBe(true);
    const h=new RoomInvadersLeafHelper();
    // No placement pinches, hand mocks or direct placement calls: only automatic depth scanning.
    await h.waitFor(()=>h.main().placementStatus().ready,60000);
    const placed=h.main().placementStatus();expect(placed.automatic).toBe(true);expect(placed.count).toBe(3);
    expect(placed.distances.every(d=>d>=.6&&d<=6.5)).toBe(true);
    expect(h.main().reviewStatus().roaming.siteCount).toBeGreaterThan(2);
    expect(h.main().snapshot().phase).toBe('ready');expect(h.main().snapshot().elapsed).toBe(0);
    for(let i=0;i<3;i++)for(let j=i+1;j<3;j++) {
      const a=placed.points[i],b=placed.points[j];
      expect(new vec3(a[0],a[1],a[2]).sub(new vec3(b[0],b[1],b[2])).length).toBeGreaterThan(74.9);
    }
    console.log('AUTO_SCAN_READY '+JSON.stringify(placed));
    await h.tap('StartButton');await sleep(1200);
    await h.tap('RestartButton');expect(JSON.stringify(h.main().placementStatus().points)).toBe(JSON.stringify(placed.points));
    await h.tap('Room setupButton');expect(h.main().placementStatus().count).toBe(0);
    expect(h.main().snapshot().phase).toBe('ready');await h.waitFor(()=>h.main().placementStatus().ready,60000);
    console.log('AUTO_SCAN_RESCAN_PASS '+JSON.stringify(h.main().placementStatus()));
  }
}
