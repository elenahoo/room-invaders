/** Integration: all three spawns, SIK shot deltas, pause freeze and reset through actual UI. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {sleep} from 'Leaf.lspkg/Utils/common/Utils';
import {RoomInvadersLeafHelper} from './RoomInvadersLeafHelper';
@component
export class RoomInvadersShootingScenario extends Scenario {
  async run():Promise<void> {
    const h=new RoomInvadersLeafHelper();await h.start();
    const seen=await h.defendUntil(11);
    expect(seen.size).toBe(3);expect(h.main().snapshot().hits).toBeGreaterThan(2);
    expect(h.hud().includes(h.main().snapshot().score+' points')).toBe(true);
    await h.tap('StartButton');expect(h.main().snapshot().paused).toBe(true);
    const frozen=h.main().snapshot();await sleep(1200);
    expect(h.main().snapshot().elapsed).toBe(frozen.elapsed);
    expect(h.main().snapshot().health).toBe(frozen.health);
    await h.tap('StartButton');await sleep(300);expect(h.main().snapshot().paused).toBe(false);
    expect(h.main().snapshot().elapsed).toBeGreaterThan(frozen.elapsed);
    await h.tap('StartButton');
    await h.tap('RestartButton');const reset=h.main().snapshot();
    expect(reset.score).toBe(0);expect(reset.health).toBe(h.main().health);expect(reset.locks.every(Boolean)).toBe(true);
    console.log('RoomInvaders shooting, all spawns, pause/resume and restart verified');
  }
}
