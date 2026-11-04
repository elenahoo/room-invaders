# Outdoor update · November 4, 2026

The new local review video is `Room-Invaders-final-demo.mp4` (about 1:41). It retains the complete earlier 77-second two-room edit, then adds a 24.2-second Sunlit Outdoor chapter. The full outdoor Preview frame is preserved with side margins because its capture aspect ratio differs from the earlier wide recordings. There is no crop or stretch of the gameplay.

The outdoor chapter includes a fast complete turn around the plaza, followed by Wraith, Hound and Leech encounters at several measured column/doorway positions and six successful pinch captures. `edit.json` contains the source cuts and 13 event-timed sound cues. `Sunlit-Outdoor-take1.mp4` is the untouched native capture; the chosen footage ends before the later escape/paused tail.

Lens Studio again encoded a silent native audio track (maximum -91 dB). The stereo soundtrack was rebuilt locally from the original BackgroundMusic, WraithWarning, HoundWarning, LeechWarning and Zap assets, using the actual gameplay log and video timing. Direction is approximated in stereo. It is not audio recorded from physical glasses. The original indoor music and effects remain in the first section. No generated paid media or external services were used.

## Scan and cover changes
- Keep WorldQuery rays inside the camera view; use separate wider rays for mesh queries.
- Explicitly enable reconstructed mesh tracking.
- Supplement missing mesh geometry with bounded, confirmed WorldQuery depth patches. Every vertex is a measured hit. Reject missing corners, discontinuous depth and inconsistent normals; never bridge unknown gaps.
- Use the same confirmed patches for depth masking and shot blocking. Discover additional measured cover/corner sites from this data.
- Improve stalled-scan guidance: move closer to an object and sweep across edges/corners. An outdoor plaza with distant or glass-only surfaces still cannot provide reliable cover at the initial pose.
- Check the space around Pip and all three locks when choosing the rescue position, so other measured furniture cannot hide the lower locks.

## Evidence and limits
The outdoor covered-shot test passed: a point behind cover was blocked and one in front was accepted. The roaming/reaction integration test passed, with more than three measured sites and bonus-scored pinch hits. The recording harness completed 38 seconds with six hits and 1,438 points; it was not a completed outdoor rescue round. The updated build passed a full Sunlit Room round with Pip saved, five shields and 38 hits (10,290 points), following a look-around scan.

Earlier failures are retained in the diagnostics: empty-mesh initialization was fixed; a stationary wall-facing indoor scan timed out; a later rescue test exposed a blocked-lock placement and led to the rescue clearance fix. Preview automation/camera-control failures were separate from gameplay and their failed recording was discarded. The final take was captured after the retained-timer camera controller worked.

The source and video remain local. Real-glasses tracking, performance, optics and sound localization are still unverified. Sparse depth, thin surfaces and glass can still produce imperfect cover. The temporary recording harness and camera controller are evidence tools, not shipped gameplay code. Cash spend: $0; revenue: $0; human time and Codex monetary allocation: unknown.

Final regression: Colorful Home also passed a full 90-second round with Pip saved, five shields and 38 hits (10,294 points), following a look-around scan. Both updated indoor tests use the rescue-clearance correction.
