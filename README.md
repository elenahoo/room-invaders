# Room Invaders
A 90-second SPECS game for casual players at home. Listen for monsters emerging from measured room surfaces, point and pinch to shoot, then break three locks and rescue Pip.

## Run locally
1. Open room-invaders-lens.esproj in Lens Studio 5.23.2. Let package import and TypeScript compilation finish.
2. Select SPECS 27, Interactive Preview, and a room scene such as Sunlit Room. Right-drag to look around. Watch the hiding-spot count rise. If it stalls, sweep up and sideways or select Rescan room. Place myself lets you pinch one nearby surface and two farther surfaces.
3. Select Start. In Interactive Preview a click simulates a pinch. An enemy sounds before it emerges. Shoot an exposed part. Fast hits earn up to 100 bonus points on top of base and combo points.
4. At 60 seconds remaining pinch three violet locks, then green Pip, within 22 seconds. Keep a shield until time expires. Menu opens pause, restart and room controls.

## Development and verification
Original gameplay built during the challenge with Codex, CLAD and the Lens Studio MCP. See devpost/design-brief.md for the approved plan, its timing and later revisions. The LEAF scenarios in Assets/Scripts cover setup, shooting, roaming, rescue, scoring and failure paths. The simulated rooms supply measured geometry. Thin surfaces can have imperfect cover. Physical SPECS tracking, optics, comfort and performance have not been measured.

## Watch and review
[Final demo (1:41, with stereo sound)](devpost/Room-Invaders-final-demo.mp4) · [Project description](devpost/submission-description.md) · [Design brief](devpost/design-brief.md) · [Asset credits](THIRD_PARTY_NOTICES.md).

The earlier indoor baseline passed scan, rescan and complete rescue rounds in both rooms. The updated outdoor scan also passed covered-shot and roaming/reaction tests. After the rescue-clearance correction, both indoor rooms passed new full 90-second rescue rounds with five shields and 38 hits. The video retains the indoor baseline footage and Pip’s Sunlit Room rescue, then appends the updated Sunlit Outdoor build with three monster types across several measured hiding places. The two opening room turns run at double speed. Gameplay runs at recorded speed; the stereo mix uses the original game music and effects synchronized to logged events. It demonstrates the intended warnings, not sound localization on physical glasses.

## Outdoor scan update (November 4)
When reconstructed geometry is incomplete, confirmed WorldQuery depth patches provide additional measured cover and shot blocking. No fixed fallback positions or semantic object labels are invented. Move near opaque objects (roughly 1–6 m) and look across different edges; distant or glass-only scenery may not yield three usable spots. The rescue placement checks clearance around Pip and all locks. See devpost/outdoor-update.md for verification and limitations.
