/** Defend to the rescue, leave the locks intact, then verify the timeout without changing the clock. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {findSceneObjectByName} from 'Leaf.lspkg/Utils/common/Utils';
import {RoomInvadersLeafHelper} from './RoomInvadersLeafHelper';
@component
export class RoomInvadersMissedRescueScenario extends Scenario {
  async run():Promise<void> {
    const h=new RoomInvadersLeafHelper();await h.start();await h.defendUntil(h.main().rescueAt);
    expect(h.main().snapshot().rescue).toBe('locked');
    const before=h.main().snapshot().score;
    await h.waitFor(()=>h.main().snapshot().rescue==='missed',(h.main().rescueWindow+3)*1000);
    expect(h.main().snapshot().score).toBe(before);
    expect(findSceneObjectByName('CageBars').enabled).toBe(false);
    expect(findSceneObjectByName('Pip').enabled).toBe(false);
    console.log('RoomInvaders rescue timeout verified with all locks intact');
  }
}
