# Room Invaders
A sound comes from across the room. You turn, catch a glimpse of a creature slipping out of cover, and pinch before it escapes. Room Invaders is a 90-second arcade game for casual players who want their surroundings to surprise them.

## How to play
Look around until the Lens finds three measured starting spots. If scanning stalls, move closer to opaque objects, rescan, or use Place myself to pinch one nearby surface and two farther surfaces. As you play, the Lens continues looking for additional hiding places. A Shadow Wraith can descend from overhead, an Ember Hound can rise behind cover, and a Void Leech can appear around an edge. Listen for the warning, aim at an exposed creature, and pinch. A quick hit earns up to 100 extra points on top of base and combo points. The speed clock runs only while the creature is exposed and can be shot. When Pip appears, pinch each of the three violet locks, then pinch Pip. Save Pip and keep at least one shield until the timer ends.

## What the surroundings contribute
The Lens uses measured geometry, including surfaces, corners, overhead areas and cover edges, rather than recognizing furniture by name. It keeps a pool of discovered hiding places and can move later encounters to different sites. The latest build also uses measured elevated edges for rooftop appearances. Creatures rise from behind the edge while measured cover masks the hidden portions and blocks covered shots. This depends on the geometry captured during scanning; thin, reflective or incompletely scanned surfaces can still leave gaps.

## The demo
The 2:01 edited demo shows three Lens Studio Preview environments: Colorful Home, Sunlit Room and Sunlit Outdoor. It includes overhead and furniture encounters, Pip’s rescue, an outdoor look-around, tree, rubbish-bin and arch encounters, and two Hounds and a Wraith emerging at different roof positions. The rooftop ending was recorded after the final roof-edge masking adjustment. The earlier indoor footage and non-rooftop outdoor footage are retained from previous local captures. Fast opening look-arounds lead into gameplay at recorded speed. The outdoor capture uses the manual placement fallback before roaming among measured sites.

The soundtrack uses the game’s original music, warning cues and effects synchronized to recorded events because Lens Studio’s native captures were silent. Stereo direction is approximate. This is simulator footage; physical SPECS tracking, optics, sound localization, comfort and performance have not been tested.

## How it was built and what we learned
The first prototype was built during the challenge. The Devpost Learn planning interview guided the subsequent revision, and Codex used CLAD and the Lens Studio connection to build and test the native SPECS Lens. The monster models and sounds were made procedurally. The main design lesson was about fairness: a warning gives players a reason to turn, but the speed bonus should start only when they have something they can actually hit. Testing also showed why scanning needs visible progress and recovery controls, and why a roof silhouette needs more careful measurements than a broad flat surface.
