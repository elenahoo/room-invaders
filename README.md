# Room Invaders
A 90-second SPECS game for casual players. Listen for monsters emerging from measured surroundings, point and pinch to shoot, then break three locks and rescue Pip.

## Run locally
1. Open `room-invaders-lens.esproj` in Lens Studio 5.23.2. Let package import and TypeScript compilation finish.
2. Select SPECS 27, Interactive Preview, and a room such as Sunlit Room. Right-drag to look around and watch the hiding-spot count rise. If it stalls, move closer to an opaque object, sweep up and sideways, or select Rescan room. Place myself lets you pinch one nearby surface and two farther surfaces.
3. Select Start. Interactive Preview clicks simulate pinches. Listen for a monster, turn toward it and shoot an exposed part. Fast captures earn up to 100 bonus points on top of base and combo points.
4. At 60 seconds remaining, pinch the three violet locks and then green Pip within 22 seconds. Keep a shield until time expires. Menu opens pause, restart and room controls.

## Final demo and description
[Final demo — 2:01, stereo sound](https://youtu.be/aWNthK0TW9M) · [Devpost description](devpost/submission-description.md) · [Design brief](devpost/design-brief.md) · [Final local review](devpost/final-local-review.md) · [Asset credits](THIRD_PARTY_NOTICES.md).

This local revision contains the final roof-edge masking adjustment and a new rooftop ending recorded after that adjustment. The earlier indoor footage and non-rooftop outdoor footage are preserved. The short demo shows Colorful Home, Sunlit Room and Sunlit Outdoor, including tree, bin, arch and roof encounters. The outdoor capture uses manual starting-point placement, followed by measured roaming sites. The opening room turns are sped up; gameplay runs at recorded speed. Original game music and effects are synchronized to actual recorded events because native recordings were silent. Stereo direction is approximate, not physical-device audio.

## Current build
Automatic setup finds three measured starting sites and continues surveying for ceilings, corners, surfaces, cover edges and elevated ledges. The Lens does not identify objects by name or invent missing geometry. The manual fallback retains the near/far distance bands. Confirmed WorldQuery patches supplement reconstructed geometry for masking and shot blocking. The latest revision refines roof silhouettes, keeps small curved-surface patches and renders the depth mask from both sides. Rooftop creatures start behind the measured edge and rise vertically.

Coverage depends on looking around nearby opaque geometry. Distant, thin, reflective or unscanned surfaces can still produce gaps. Room Invaders is tested in native Preview; physical SPECS tracking, optics, sound localization, comfort and performance remain unverified.

## Development and verification
Original gameplay was built during the challenge with Codex, CLAD and the Lens Studio MCP. The approved Devpost Learn plan guided later native revisions; its timing is disclosed in the design brief. LEAF scenarios in `Assets/Scripts` cover setup, shooting, roaming, rescue, scoring and failure paths.

The final local build completed full 90-second rounds with Pip saved in Colorful Home, Sunlit Room and Sunlit Outdoor. The measured roof-mask diagnostic blocked 116 of 116 tested rays. The two-minute export decodes cleanly with stereo audio and stays below three minutes. See the final local review for results and evidence boundaries; older test reports describe earlier revisions.

The November 6 submission update contains the final verified build and description. The demo is hosted at the link above; this source repository no longer bundles an older video file. See [the competition project](https://devpost.com/software/room-invaders) and [demo details](devpost/demo.md).
