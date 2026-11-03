/** A real unassisted encounter must lose shields and stop on zero. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {RoomInvadersLeafHelper} from './RoomInvadersLeafHelper';
@component
export class RoomInvadersTimeoutScenario extends Scenario {
  async run():Promise<void> {
    const h=new RoomInvadersLeafHelper();await h.start();
    const initial=h.main().snapshot().health;
    await h.waitFor(()=>h.main().snapshot().phase==='finished',40000);
    expect(h.main().snapshot().health).toBe(0);expect(h.main().snapshot().health<initial).toBe(true);
    expect(h.main().snapshot().result).toBe('overrun');
  }
}
