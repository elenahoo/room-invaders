/** Integration against Sunlit Room depth. No fabricated hits or direct placement mutations. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {sleep,findSceneObjectByName} from 'Leaf.lspkg/Utils/common/Utils';
import {RoomInvadersLeafHelper} from './RoomInvadersLeafHelper';
@component
export class RoomInvadersPlacementScenario extends Scenario {
  async run():Promise<void> {
    const h=new RoomInvadersLeafHelper();await sleep(800);await h.tap('Place myselfButton');
    await h.tap('StartButton');expect(h.main().snapshot().phase).toBe('ready');
    expect(h.main().placementStatus().count).toBe(0);
    await h.input.surfacePinch(0.2,0.9);expect(h.main().placementStatus().count).toBe(0);
    await h.input.surfacePinch(.5,.9,1200,new vec3(-.35,-.75,-1));expect(h.main().placementStatus().count).toBe(1);
    await h.input.surfacePinch(.5,.9,250,new vec3(-.35,-.75,-1));expect(h.main().placementStatus().count).toBe(1);
    await h.input.surfacePinch(0.5,0.9);await h.input.surfacePinch(0.8,0.9);
    expect(h.main().placementStatus().ready).toBe(true);
    const points=JSON.stringify(h.main().placementStatus().points);
    await h.tap('StartButton');await sleep(1600);expect(h.main().snapshot().phase).toBe('playing');
    expect(JSON.stringify(h.main().placementStatus().points)).toBe(points);
    expect(h.main().placementStatus().distances[0]<=2.5).toBe(true);
    expect(h.main().placementStatus().distances.slice(1).every(d=>d>=3&&d<=6)).toBe(true);
    await h.tap('Place myselfButton');expect(h.main().snapshot().phase).toBe('ready');
    expect(h.main().placementStatus().count).toBe(0);
    await h.setup();expect(h.main().placementStatus().ready).toBe(true);
    console.log('PLACEMENT_PASS '+JSON.stringify(h.main().placementStatus()));
  }
}
