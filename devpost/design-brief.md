---
status: approved
planning_review_date: 2026-10-28
initial_prototype_date: 2026-10-24
approval: "yes looks good — user approval in this chat"
---

# Design brief: Room Invaders

This is the approved October 28 design record. See **Implemented revisions, October 31 and November 3** at the end for the current scan, spawn and scoring behavior.

This formal plan-lens review follows the initial prototype. It does not claim the original build was preceded by this interview. The October 28 tests and recording cover the earlier cartoon build; the approved revision has now been implemented and tested. See revision evidence under room-invaders/docs/2026-10-28/revision; a 123.73-second local review playthrough has been recorded. Continue in the same chat, without subagents, spending, publishing or submission.

## The one spatial moment
A casual gamer at home hears a monster from a nearby room location before seeing it, turns toward the sound, then watches a creature emerge from behind a room surface and pinches to shoot it. One point is close and two are farther away; rescuing Pip adds a focused change of pace.

## Why it belongs on glasses
- Uses: shares the player's view and draws creatures into the surrounding room while leaving the player free to look around.
- Learner's intended audience: “casual gamers who want a fun, immersive game at home, with monsters surprising them from behind real objects and a simple pinch gesture to shoot.”
- Looking around the room and locating creatures by sound are part of the intended experience, rather than viewing an enclosed virtual world on a screen.

## Product or overlay
- Type: product — an AR game that uses measured surrounding surfaces.
- What the real version senses: room geometry and ordinary targeting/pinch input; it does not identify furniture by name.
- Stand-in for the preview: Snap's bundled simulated room provides surface/depth geometry. This is a simulated room demonstration, not live camera recognition or physical-device evidence.
- Select three distinct measured points; do not claim they necessarily belong to three semantically recognized objects.

## Where things live
- Player: at home, able to look around; no running or required movement through obstacles.
- Spawn points: one close and two farther away, chosen from actual measured geometry. Candidate bands are 1–2.5 m close and 3–6 m far, with far points at least 1 m farther than the close point (all numerical ranges are implementation defaults). Reconcile these against the available preview geometry. If the room cannot supply the arrangement, keep setup incomplete and offer rescan/manual placement; never fabricate hit positions.
- Selection is not confined to a flat screen. Actual all-around surface coverage depends on room scanning; do not claim 360-degree spawn coverage without a measured test.
- Current UI remains world-placed near the task at approximately the existing 110 cm authored distance (default); keep text readable and controls within view. Near/far targets and head turning need visual review.
- Monster dimensions (defaults, subject to preview fit): roughly 40–80 cm tall, with grounded quadruped length up to about 100 cm and compact tentacle spread. The visual aim is more realistic anatomy, forms and materials than the old one-eyed cartoon creatures, within the graphics budget.

## Monster designs
Agent selection explicitly delegated by the learner for the indoor home environment:
- Shadow Wraith: smoky skeletal humanoid silhouette, narrow luminous eyes, ragged trailing form and long clawed arms.
- Ember Hound: grounded quadruped, charred rough body plates, visible orange fissures and pronounced jaw/claws.
- Void Leech: floating organic central body, purple internal glow and multiple articulated tentacles.

Use monters_image.png as local visual reference. Create original lightweight assets locally. Cinematic reference fidelity is not promised. Card text about abilities, recognition or outdoor environments is not a functional requirement. The other five reference types are deferred from this first version. Keep the reference image out of the future public repository unless redistribution rights are established.

## Hands and input
- Aim at an exposed creature and perform one standard SIK pinch to shoot; release before another shot.
- Pinch three separate violet locks, then select green Pip to rescue them.
- Start, pause/resume, restart, rescan and manual placement use standard SIK/UIKit controls.
- Targets are big and highlight when aimed at.
- Voice: none.

## When things show
- Each new monster gives a sound from its world position before any part becomes visible. Initial warning lead is 0.9 seconds (default); confirm actual playback and reveal timing.
- Looking around and the direction of the monster sound guide the player. No directional arrow is requested.
- Covered portions remain hidden by reconstructed geometry while the creature emerges. A full creature is rendered; it does not grow from zero size.
- Sounds stop or pause appropriately when the game is paused, restarted, reset or finished. No stale warning from an earlier round.
- A 90-second encounter, five shields, rescue at 30 seconds, a 22-second rescue window, 50 points per lock and 500 for Pip are retained prototype defaults, not invented learner answers.
- The rescue appears only when needed; the cage disappears on rescue/timeout and Pip clears the shooting lane after the celebration.

## Done criteria
Each can be checked in Lens Studio Preview:
1. Automatic setup produces one measured close point and two measured farther points, with the recorded distance/separation rules. Rescan/manual fallback works without invented surface hits.
2. The three selected monster designs can each be seen in gameplay, with distinguishable silhouettes/materials. For each new appearance, a positional warning is emitted before visual reveal; looking/turning toward the source remains usable.
3. Actual room geometry hides a covered monster, partially masks it during emergence, then reveals it. A covered shot does not score; one exposed pinch scores one hit.
4. All three locks require separate pinches; protected Pip cannot be rescued early. Pinching freed Pip grants the rescue bonus, clears the cage and permits a rescued 90-second finish.
5. Pause freezes time and warning behavior; restart clears encounter state and stale sounds while keeping selected points. Missed rescue and shield loss show their correct outcomes.

## Out of scope
- Outdoor/city encounters or the other five reference monster types.
- Furniture-name recognition, live camera AI, heat tracking, elemental combat or abilities inferred from reference-card text.
- Multiplayer, persistent anchors, custom finger-gun gestures and recording/identifying people.
- Spending, paid generation, uploads, publishing and competition submission.

## Risks and open questions
- The approved arrangement, warnings and three monster models are implemented. Eight native gameplay scenarios pass in the simulated room; see the dated revision evidence. This does not prove physical-glasses behavior.
- Room reconstruction may miss thin, moving, reflective or individual object outlines; some supplied-room surfaces may be unsuitable for the requested distances.
- Far targets may be small, and additive displays can hide dark detail. Preserve bright silhouette/eye/material cues and check readability without claiming device comfort.
- More realistic local procedural art may not match the cinematic reference's detail. Show the actual result for review rather than label it photorealistic.
- Physical tracking, sound localization, comfort and on-device performance remain feel unproven.
- No personal learner reflection has been supplied. A factual development-lessons note can be used without blocking this plan. Final brief approved by the learner in this chat.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources

## Implemented revisions, October 31 and November 3
Automatic setup now counts three measured starting sites and then continues surveying. Later monsters can appear at ceiling undersides, corners, elevated surfaces and cover edges. Automatic placement supersedes the original fixed near/far arrangement. Manual placement retains the near/far bands. Speed scoring awards up to 100 extra points over the first two seconds of exposed, shootable time. Setup gives progress and recovery prompts as the player looks around.
