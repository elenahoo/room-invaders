# Room Invaders
A sound comes from across the room. You turn, catch a glimpse of a creature slipping out of cover, and pinch before it escapes. Room Invaders is a 90-second arcade game for casual players who want their own room to surprise them.

## How to play
Look around until the Lens finds three hiding spots. As you play, it keeps sampling the room for more. A Shadow Wraith can hang from the ceiling, an Ember Hound can slip out from furniture, and a Void Leech can wait behind an edge. Listen for the warning, aim at an exposed creature, and pinch. A quick hit earns up to 100 extra points. The speed clock runs only while the creature is exposed and can be shot. When Pip appears, pinch each of the three violet locks, then pinch Pip. Save Pip and keep at least one shield until the timer ends.

## What the room contributes
The Lens samples surfaces, corners, overhead geometry and cover edges. The measured room hides parts of a creature during emergence and blocks shots through cover. A different room changes where the encounter happens. The Lens uses geometry rather than identifying furniture by name. The demo shows two Lens Studio preview rooms: look overhead and between dining chairs in Colorful Home, then follow the sofa edge and curtains in Sunlit Room before freeing Pip. The room tours are sped up; the encounters play at their recorded speed. The soundtrack uses the game’s own music and event-timed effects.

## How it was built and what we learned
The first prototype was built during the challenge. The Devpost Learn planning interview guided the subsequent revision, and Codex used CLAD and the Lens Studio connection to build and test the native SPECS Lens. The monster models and sounds were made procedurally. The most important design lesson was about fairness: a warning gives players a reason to turn, but the speed bonus should start only when they have something they can actually hit. Testing also showed why the scan needs visible progress and a way to recover when the room offers little cover.
