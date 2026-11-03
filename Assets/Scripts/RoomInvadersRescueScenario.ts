/** Full real-time round through SIK triggers, including protected friend, three locks and rescue. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {sleep,findSceneObjectByName} from 'Leaf.lspkg/Utils/common/Utils';
import {RoomInvadersLeafHelper} from './RoomInvadersLeafHelper';
@component
export class RoomInvadersRescueScenario extends Scenario {
  async run():Promise<void> {
    const h=new RoomInvadersLeafHelper();await h.start();await h.defendUntil(h.main().rescueAt);
    expect(h.main().snapshot().rescue).toBe('locked');
    const initial=h.main().snapshot().score;await h.tap('Pip');
    expect(h.main().snapshot().score).toBe(initial);expect(h.main().snapshot().rescue).toBe('locked');
    await sleep(300);
    for(let i=0;i<3;i++) {
      const before=h.main().snapshot().score;await h.tap('RescueLock'+i);
      expect(h.main().snapshot().score-before).toBe(h.main().lockPoints);
      expect(h.main().snapshot().locks[i]).toBe(false);
    }
    expect(h.main().snapshot().rescue).toBe('free');
    const before=h.main().snapshot().score;await h.tap('Pip');
    expect(h.main().snapshot().score-before).toBe(h.main().rescuePoints);
    expect(h.main().snapshot().rescue).toBe('saved');
    expect(findSceneObjectByName('CageBars').enabled).toBe(false);
    console.log('RoomInvaders Pip rescue verified through three separate SIK locks');
    // A final target can be removed while the SIK test interactor is waiting for release.
    // Observe the real terminal game state independently of that gesture's completion.
    await Promise.race([h.defendUntil(h.main().duration),h.waitFor(()=>h.main().snapshot().phase==='finished',115000)]);
    expect(h.main().snapshot().phase).toBe('finished');expect(h.main().snapshot().result).toBe('rescued');
    expect(h.main().snapshot().remaining).toBe(0);
    console.log('RoomInvaders full real-time round verified: '+JSON.stringify(h.main().snapshot()));
  }
}
