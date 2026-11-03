/** LEAF registration only. Scenarios run on demand; no automatic gameplay on Lens start. */
import {RoomInvadersReactionScenario} from './RoomInvadersReactionScenario';
import {RoomInvadersRoamingScenario} from './RoomInvadersRoamingScenario';
import {RoomInvadersWarningScenario} from './RoomInvadersWarningScenario';
import {scenariosIndex} from 'Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator';
import {ScenarioMetadata} from 'Leaf.lspkg/Scenarios/scenario/ScenarioMetadata';
import {RoomInvadersShootingScenario} from './RoomInvadersShootingScenario';
import {RoomInvadersRescueScenario} from './RoomInvadersRescueScenario';
import {RoomInvadersTimeoutScenario} from './RoomInvadersTimeoutScenario';
import {RoomInvadersMissedRescueScenario} from './RoomInvadersMissedRescueScenario';
import {RoomInvadersSurfaceProbeScenario} from './RoomInvadersSurfaceProbeScenario';
import {RoomInvadersPlacementScenario} from './RoomInvadersPlacementScenario';
import {RoomInvadersAutoScanScenario} from './RoomInvadersAutoScanScenario';
import {RoomInvadersOcclusionScenario} from './RoomInvadersOcclusionScenario';
@component
export class RoomInvadersLeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex:ScenarioMetadata[]=[
    {id:'room-invaders-reaction-scoring',typename:RoomInvadersReactionScenario.getTypeName()},
    {id:'room-invaders-roaming',typename:RoomInvadersRoamingScenario.getTypeName()},
    {id:'room-invaders-warning-and-roster',typename:RoomInvadersWarningScenario.getTypeName(),parameters:{view:'check'}},
    {id:'room-invaders-world-occlusion',typename:RoomInvadersOcclusionScenario.getTypeName(),parameters:{view:'guard',progress:'0.5'}},
    {id:'room-invaders-auto-scan',typename:RoomInvadersAutoScanScenario.getTypeName()},
    {id:'room-invaders-room-placement',typename:RoomInvadersPlacementScenario.getTypeName()},
    {id:'room-invaders-surface-probe',typename:RoomInvadersSurfaceProbeScenario.getTypeName()},
    {id:'room-invaders-shoot-pause-restart',typename:RoomInvadersShootingScenario.getTypeName()},
    {id:'room-invaders-full-round-rescue',typename:RoomInvadersRescueScenario.getTypeName()},
    {id:'room-invaders-unassisted-overrun',typename:RoomInvadersTimeoutScenario.getTypeName()},
    {id:'room-invaders-missed-rescue',typename:RoomInvadersMissedRescueScenario.getTypeName()},
  ];
}
