# Occlusion update — 2026-10-24

Active implementation: native World Mesh + Occluder material at render order -100, with depth-tested creature materials. Full-size monsters animate from behind the selected surface into view; no scale-from-zero appearance. Placement and shot visibility use reconstructed mesh hits when available. Both behind/front shot checks and the full rescue scenario passed. Screenshot occlusion-verified-2026-10-24.jpg demonstrates hidden/partial/front test fixtures. The unsuccessful camera World Depth Texture approach was removed. No physical-device performance claims; no spending or submission.

## Previous automatic-setup design

# Automatic setup update — 2026-10-24

Default setup now automatically samples room depth, selects stable tops/protrusions at least 45 cm apart, and waits for Start. Restart retains selections. Rescan room automatically chooses again; Place myself explicitly selects the prior manual mode. RoomInvadersAutoScan.ts implements local geometric heuristics, not semantic object recognition or a guarantee of distinct furniture. No paid services, uploads or submissions. Runtime and acceptance evidence: room-invaders/docs/native-auto-scan-tests-2026-10-24.json. Automatic setup/rescan, manual fallback, and full real-time rescue tests passed. Physical glasses remain untested.

## Previous manual-placement design

# Room-surface update — 2026-10-24

Supersedes the original prop-based layout below. Virtual crate, door and shelf geometry is removed. WorldQuery + SIK free-space pinch selects three stationary room surfaces, at least 35 cm apart and 0.5–6 m away. Session-only world positions are required before Start. Restart retains them; Room setup clears them. Pip spawns above the second selected point. No invented fallback hits, automatic object naming, cloud services, physical occlusion or hardware verification. All generated artwork/audio remains local. Native placement, full 90-second rescue, and shooting/pause/restart tests passed against Sunlit Room depth. $0 spent; no submission.

The existing root names are retained solely for scene-reference compatibility and are overwritten by successful surface hits before play. RoomInvadersPlacement.ts owns sensing, marker geometry and setup validation; Main gates game start and HUDUI shows setup instructions. No subagents.

## Historical initial plan (superseded spatial layout)

# Room Invaders native build — 2026-10-24

User scope: three spawn points, standard pinch shooting, rescue moment, local only, no spending or submission. Continue in the same chat without subagents.

Tier: mechanics-driven. Original violet one-eyed invaders and mint-green friend Pip. Animated code-authored MeshBuilder geometry is a planned first-class backend, including articulated eyes/tentacles and modular crate/door/shelf props. No hosted mesh/image generation.

Authored roots (centimeters, camera initially at origin, looking -Z):

| Root | Position | Bounds / purpose |
|---|---|---|
| RoomInvadersMain | 0,0,0 | Controller; no visual geometry |
| BoxSpawn | -30,-28,-145 | 28×18×22 crate, invader rises behind it |
| DoorSpawn | 0,-22,-175 | 32×48×5 doorway and edge, invader peeks beside edge |
| ShelfSpawn | 30,-21,-150 | 27×4×18 shelf, invader rises above it |
| RescueSpot | 0,-7,-132 | 20 cm Pip, cage with three 7 cm lock targets |
| RoomInvadersHUD | 0,19,-110 | One UIKit panel with title, stats, guidance, start/pause and restart |

These are authored stand-ins for room items, with movable editor roots. No object recognition or real-world placement is claimed. No enclosed virtual world is built.

Manifest: RoomInvadersGeometry.ts (procedural meshes), RoomInvadersState.ts (state owner), RoomInvadersTargets.ts (render/target adapters), RoomInvadersHUDUI.ts (passive UIKit view), RoomInvadersMain.ts (orchestration). Icons play_arrow and restart_alt. Audio Zap.wav, Rescue.wav, Escape.wav and BackgroundMusic.wav (locally synthesized light synthwave/pluck bed with sparse melody, quiet mix). Imported vertex-color material from the official toolkit.

Default flow: 90 seconds; five shields; 0.22 s shot cooldown; rescue at 30 s with a 22 s window; three separate locks then pinch Pip for +500. Expose mechanics and presentation controls. Only standard SIK targeting is used, with no duplicate touch handler. Pause/restart and held-pinch behavior must be verified in preview. Preserve the browser prototype separately.

Verification: compile, runtime logs, preview images at multiple moments, actual preview pinch interactions, full encounter and restart. Add LEAF scenarios for acceptance criteria when package support is available. Record limits honestly; no device testing claims.
