# Final local review — November 6, 2026

The designated final local demo is `Room-Invaders-final-demo.mp4`: **120.618667 seconds (2:01)**, 1920 × 1080 at 60 fps, stereo AAC. The SHA-256 and source hashes are in `release-manifest.json`. This report records the local verification performed before the user authorized the subsequent repository and Devpost update.

## What changed
- Four gameplay files now match the tested working build: `RoomInvadersDepthCover.ts`, `RoomInvadersPlacement.ts`, `RoomInvadersRoaming.ts` and `RoomInvadersTargets.ts`.
- `RoomOcclusion.mat` now includes the final two-sided depth mask. Roof silhouettes use additional measured samples; rooftop monsters rise behind measured ledges.
- Only the short demo’s rooftop ending changed. The preceding 104.616667 seconds retain all 6,277 video packets and timestamps, and their decoded audio is identical to the previous short edit. The new ending shows two Hound rooftop encounters and one Wraith rooftop encounter, with turns and normal pinch captures. Music phase and level are matched; new ending effects follow the recorded events.
- The README, approved design record and Devpost description now describe the current build, final video and remaining limits.

## Verification
The native final build completed these rounds using normal automated SIK pinch interactions:

| Preview environment | Round duration | Result | Score | Shields |
| --- | ---: | --- | ---: | ---: |
| Colorful Home | 90 s | Pip saved | 6,159 | 1 |
| Sunlit Room | 90 s | Pip saved | 7,769 | 1 |
| Sunlit Outdoor | 90 s | Pip saved | 9,714 | 4 |

The indoor rounds used automatic setup. The outdoor round used the existing manual placement fallback and then measured roaming surfaces. No scores, shields or results were injected. The measured roof diagnostic blocked all 116 tested rays. Runtime and export checks are summarized in the release manifest. The short demo includes earlier indoor/non-rooftop footage; the table describes the separate final-build full-round verification captures.

The repository’s gameplay scene matches the working scene. Only regenerated editor preview-helper IDs differ; the established distribution scene is retained. Temporary recording code is absent from shipped gameplay. Packaged source files and the ZIP are checked byte for byte.

## Limits
The rooms are Lens Studio simulations, not physical-glasses recordings. Sparse, thin, reflective, moving or unscanned geometry may still have imperfect cover. The world-placed menu/result panel can be outside the current view. Physical tracking, optics, comfort, performance and spatial audio remain untested. Native recordings were silent, so the demo uses original local game sounds synchronized to logged events with approximate stereo direction.

No spending occurred. After these checks, the user authorized updating the existing repository and competition description. The user uploaded the latest video separately; its link is recorded in [demo.md](demo.md). Previous demo exports and raw takes were removed at the user’s request to recover disk space; logs, checksums and review images remain. The results above describe the checks performed before that cleanup.
