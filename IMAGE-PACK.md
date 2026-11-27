# IMAGE PACK — vocabulary artwork

The app's picture questions currently draw ~50 hand-coded SVGs while ~180 words
fall back to the same generic blob — so picture-choice items like Unit 4's
*geography / science / math / art* show four identical circles. This pack
replaces **all** vocabulary artwork with your own images, one per concept.

**You generate the images. This document is the complete brief.**

---

## How it works

1. Put image files in `public/img/words/`, named exactly as listed below
   (e.g. `go-camping.webp`).
2. Run `npm run images:manifest` (or just `npm run build` — it runs automatically).
   It prints per-unit coverage so you can see what's still missing.
3. Any word without a file keeps its current SVG/blob until its image lands —
   the pack can arrive gradually, unit by unit.

Filename = the **slug** in the lists below: lowercase, hyphens, no spaces.
Accepted formats: `.webp` (preferred), `.png`, `.jpg`, `.svg`.

---

## STYLE SPECIFICATION — follow this exactly so the set looks like ONE artist

| Property | Rule |
|---|---|
| **Ratio & size** | Square **1:1**, export at **512 × 512 px** |
| **Background** | **Transparent** (PNG/WebP with alpha) — the cards behind are white |
| **Style** | Flat vector/cartoon illustration, friendly and simple — one clear subject per image, no photorealism |
| **Outlines** | Consistent bold rounded outlines, same weight in every image (≈6–8 px at 512), rounded caps/joins |
| **Colour palette** | Anchor on the app palette and reuse it everywhere: teal `#0F766E`, coral `#F05A47`, amber `#D89B24`, mint `#168A72`, violet `#6657C8`, ink `#172033` — plus natural colours (food, wood, skin) in the same flat, slightly desaturated register |
| **Shading** | Flat colours only — at most one darker shade for depth. **No gradients, no textures, no shadows** except a simple soft ellipse under standing objects if you use it everywhere |
| **Detail level** | Match the sample complexity of a kids' flashcard: readable at 72 px, interesting at 300 px |
| **Safe area** | Keep the subject inside the central ~85% — corners must stay empty |
| **Text in images** | **No readable English words** (they give away answers in picture-choice items). Single letters and numerals are fine where they ARE the concept (math `2+3`, English `ABC`) |
| **File size** | Under ~60 KB each (WebP q80 handles 512 px easily) |

### Distinction rules — the whole point of this pack

- **Near-twins must stay visibly different.** These pairs appear in the same
  quizzes — make the difference obvious at a glance:
  - `sweatshirt` (grey pullover with kangaroo pocket) vs `sweater`
    (red knitted, visible knit texture) vs `jacket` (opens at the front,
    zip) vs `coat` (long, worn open) vs `raincoat` (yellow, hood up)
  - `cap` (soft small-brim cap) vs `baseball-cap` (blue, long stiff front
    brim) vs `hat` (wide all-round brim) vs `panama-hat` (straw) vs
    `conical-hat` (tall pointed leaf hat)
  - `mountain` (one tall snow-capped peak) vs `mountains` (a RANGE of
    peaks) vs `high` (peak with clouds at the top, arrow up)
  - `globe` (desk globe of Earth) vs `geography` (a child looking at a
    big wall map — must NOT be another globe) vs `map` (folded paper map
    with a pin)
  - `tent` (canvas A-frame tent) vs `ger` (round white Mongolian yurt) vs
    `go-camping` (orange tent in a forest clearing)
  - `ice-cream` (three scoops in a bowl with a spoon) vs
    `ice-cream-cone` (cone, two scoops)
  - `hill` (one rounded green hill) vs `mountain`; `ant-farm` (glass case
    with tunnels) vs `ant-hill` (outdoor soil mound) vs `queen-ant` (big
    crowned ant)
  - `beach` (sand + gentle wave) vs `beach-umbrella` (umbrella + towel +
    sea) vs `sandy` (close-up of pale sand)
- Same object may appear in several units (e.g. `trousers` in Units 2 & 6) —
  it is ONE image, listed under its main unit.

---

## THE LIST — 181 images

### Unit 1 — Food (8)

| # | Filename | Draw |
|---|---|---|
| 1 | `cereal.webp` | Bowl of cereal flakes with milk |
| 2 | `cookies.webp` | Two chocolate-chip cookies |
| 3 | `fruit.webp` | A bowl of mixed fruit (apple, banana, grapes) |
| 4 | `popcorn.webp` | Red-striped popcorn box with puffed corn |
| 5 | `soda.webp` | Fizzy drink cup with straw and bubbles |
| 6 | `tomatoes.webp` | Two red tomatoes with green stems |
| 7 | `vegetables.webp` | Carrot and broccoli together |
| 8 | `yogurt.webp` | Yogurt cup with a spoon |

### Unit 2 — Clothing (22)

| # | Filename | Draw |
|---|---|---|
| 1 | `jeans.webp` | Blue denim trousers with a pocket |
| 2 | `boots.webp` | Brown lace-up boots, pair |
| 3 | `breeze.webp` | Curved breeze/wind lines beside a hat |
| 4 | `shirt.webp` | Light-blue buttoned shirt with collar |
| 5 | `cap.webp` | Soft cap with a small brim |
| 6 | `coat.webp` | Long buttoned coat with a hood |
| 7 | `dress.webp` | Long pink dress with a belt |
| 8 | `glasses.webp` | Round glasses on a simple face |
| 9 | `hat.webp` | Wide-brim sun hat |
| 10 | `jacket.webp` | Navy short zip-up jacket with collar |
| 11 | `skirt.webp` | Green knee-length pleated skirt |
| 12 | `panama-hat.webp` | Light straw hat with a black band |
| 13 | `trousers.webp` | Long trousers with side pockets |
| 14 | `shoes.webp` | Pair of black lace-up shoes |
| 15 | `pajamas.webp` | Soft two-piece sleep set with stars |
| 16 | `t-shirt.webp` | Short-sleeve top with a round neck |
| 17 | `fur.webp` | Soft thick light-brown fur texture |
| 18 | `warm.webp` | Sun with soft heat lines |
| 19 | `sweatshirt.webp` | Thick grey pullover with a pocket |
| 20 | `ring.webp` | Thin band with a small blue stone |
| 21 | `watch.webp` | Wristwatch with a round face and strap |
| 22 | `conical-hat.webp` | Wide conical leaf hat (non la) |

### Unit 3 — Food & taste (21)

| # | Filename | Draw |
|---|---|---|
| 1 | `salad.webp` | Bowl of green leaves with tomato |
| 2 | `cake.webp` | Chocolate cake with a slice cut out |
| 3 | `frown-face.webp` | Frowning face beside a plate with grey smoke |
| 4 | `fish.webp` | Fish fillet on a plate with lemon |
| 5 | `juice.webp` | Glass of orange juice with a straw |
| 6 | `honey.webp` | Honey pot and sugar cubes |
| 7 | `sour.webp` | Lemon with a face pulling a sour expression |
| 8 | `italy.webp` | Map outline of Italy in green-white-red |
| 9 | `pasta.webp` | Plate of pasta with tomato sauce and basil |
| 10 | `delicious.webp` | Plate with sparkle lines around it |
| 11 | `pizza.webp` | Round pizza cut into slices |
| 12 | `bread.webp` | Sliced loaf of brown bread |
| 13 | `italy-flag.webp` | Small green-white-red flag on a stick |
| 14 | `smile-face.webp` | Smiling face beside a full plate |
| 15 | `stone-oven.webp` | Stone oven with flames inside |
| 16 | `lemonade.webp` | Tall glass jug of lemonade with lemon slices |
| 17 | `cheese.webp` | Wedge of yellow cheese with holes |
| 18 | `chips.webp` | Golden potato chips (some in a paper bag) |
| 19 | `basil.webp` | Green basil leaves on a wooden board |
| 20 | `ice-cream.webp` | Three scoops in a bowl with a spoon |
| 21 | `meat.webp` | Sliced grilled meat on a plate |

### Unit 4 — School (22)

| # | Filename | Draw |
|---|---|---|
| 1 | `english.webp` | Letters A B C on a stack of books |
| 2 | `desk.webp` | Classroom desk with chair and laptop |
| 3 | `thinking.webp` | Face thinking hard beside a puzzle piece |
| 4 | `map.webp` | Folded world map with a pin |
| 5 | `globe.webp` | Desk globe of Earth |
| 6 | `science.webp` | Microscope and a beaker with a leaf |
| 7 | `art.webp` | Paint palette with brushes |
| 8 | `shorts.webp` | Dark-blue sports shorts |
| 9 | `scissors.webp` | Green-handled scissors cutting paper |
| 10 | `music.webp` | Recorder flute and a music note |
| 11 | `computers.webp` | Row of computer screens on desks |
| 12 | `gym.webp` | School gymnasium with basketball hoop and benches |
| 13 | `lunchbox.webp` | Small box with a handle and a sandwich |
| 14 | `folders.webp` | Stack of bright folders in several colours |
| 15 | `paper.webp` | Stack of plain white sheets |
| 16 | `dictionary.webp` | Thick dark book with a bookmark (no readable word on it) |
| 17 | `timetable.webp` | Weekly grid with days across the top |
| 18 | `recorder.webp` | Wooden recorder flute |
| 19 | `backpack.webp` | Open school backpack with books inside |
| 20 | `calculator.webp` | Orange pocket calculator with number keys |
| 21 | `geography.webp` | Child looking at a big wall map — NOT a globe |
| 22 | `math.webp` | Numbers and a plus sign on a green board |

### Unit 5 — Around the house & garden (20)

| # | Filename | Draw |
|---|---|---|
| 1 | `soap.webp` | Bar of pink soap with bubbles |
| 2 | `rope.webp` | Coiled length of rope |
| 3 | `porch.webp` | Covered wooden step area at a house door |
| 4 | `counter.webp` | Flat bathroom counter beside a basin |
| 5 | `towel.webp` | Folded pink towel on a rail |
| 6 | `ant-farm.webp` | Glass case filled with sand and ant tunnels |
| 7 | `garden.webp` | Grassy garden area behind a house |
| 8 | `comb.webp` | Green plastic comb with teeth |
| 9 | `soil.webp` | Handful of dark soil |
| 10 | `queen-ant.webp` | Larger ant with a small crown above it |
| 11 | `shovel.webp` | Metal spade with a wooden handle |
| 12 | `ball.webp` | Red-and-white striped ball |
| 13 | `bush.webp` | Round green bush with small leaves |
| 14 | `ant-hill.webp` | Small mound of loose soil with ants |
| 15 | `toothbrush.webp` | Toothbrush in a glass cup |
| 16 | `shower.webp` | Wall shower head with falling water |
| 17 | `sink.webp` | White basin with a tap, seen from above |
| 18 | `toilet.webp` | White toilet with the lid up |
| 19 | `swing-set.webp` | Wooden frame with two hanging swings |
| 20 | `bucket.webp` | Red plastic bucket with a handle |

### Unit 6 — Weather (21)

| # | Filename | Draw |
|---|---|---|
| 1 | `sunny.webp` | Bright yellow sun with soft rays on a blue sky |
| 2 | `snowsuit.webp` | Padded one-piece winter suit, navy with orange |
| 3 | `mountains.webp` | Range of pointed grey-and-white peaks |
| 4 | `foggy.webp` | Street lamp half hidden by thick white fog |
| 5 | `cold.webp` | Thermometer with blue at the bottom and a snowflake |
| 6 | `hot.webp` | Thermometer with red at the top and a heat haze |
| 7 | `scarf.webp` | Thick green knitted scarf |
| 8 | `sweater.webp` | Thick red knitted jumper (visible knit texture) |
| 9 | `antarctica.webp` | White continent shaped like a rounded map, on blue sea |
| 10 | `desert.webp` | Wide dry landscape with a single bare tree |
| 11 | `sun-cream.webp` | Yellow bottle of sun cream with a sun on the label |
| 12 | `raincoat.webp` | Yellow waterproof coat with a hood |
| 13 | `baseball-cap.webp` | Blue cap with a long stiff front brim |
| 14 | `ice-sheet.webp` | Blocky white-blue ice sheets with cracks |
| 15 | `cloudy.webp` | Three grey clouds covering the sky |
| 16 | `dry.webp` | Cracked dry ground with no water |
| 17 | `windy.webp` | Curved wind lines moving a tree and a hat |
| 18 | `sunglasses.webp` | Dark sunglasses with a blue reflection |
| 19 | `trousers.webp` | *(same image as Unit 2 #13)* |
| 20 | `wet.webp` | Raindrops falling on a puddle |
| 21 | `rain.webp` | Slanted rain lines under a grey cloud |

### Unit 7 — Seasons & activities (24)

| # | Filename | Draw |
|---|---|---|
| 1 | `beach-umbrella.webp` | Beach umbrella with towel and sea |
| 2 | `pick-apples.webp` | Child reaching up to red apples on a tree |
| 3 | `go-sledding.webp` | Child sliding down a snowy hill on a red sled |
| 4 | `play-baseball.webp` | Child with a bat and a ball on a green field |
| 5 | `four-seasons.webp` | Circle split into four coloured quarters (spring/summer/fall/winter) |
| 6 | `compass.webp` | Compass needle pointing up to an N |
| 7 | `ice-cream-cone.webp` | Cone with two scoops of ice cream |
| 8 | `make-sandcastle.webp` | Girl building a sandcastle with bucket and spade |
| 9 | `hiking.webp` | Person with a backpack walking up a mountain path |
| 10 | `clean-the-house.webp` | Person with a broom and a bucket of soapy water |
| 11 | `rake-leaves.webp` | Rake and a pile of orange leaves |
| 12 | `tennis.webp` | Tennis racket and ball on a court |
| 13 | `go-camping.webp` | Orange tent in a forest clearing |
| 14 | `beach.webp` | Sand beside water with a gentle wave |
| 15 | `cherry-blossoms.webp` | Pink blossom flowers on a bare branch |
| 16 | `school-bus.webp` | Children with backpacks climbing onto a yellow school bus |
| 17 | `go-skating.webp` | Child ice-skating on a frozen pond |
| 18 | `planting.webp` | Hands putting a small plant into soil with a watering can |
| 19 | `ice-skates.webp` | Pair of ice skates |
| 20 | `make-snowman.webp` | Two children building a snowman with a carrot nose |
| 21 | `snow.webp` | Snow scene — falling snowflakes on white ground |
| 22 | `autumn-leaves.webp` | Three leaves in green, orange and red |
| 23 | `throw-snowballs.webp` | Two children throwing snowballs in a snowy garden |
| 24 | `walking.webp` | Two people walking on a path under trees |

### Unit 8 — House & home (21)

| # | Filename | Draw |
|---|---|---|
| 1 | `stereo.webp` | Black stereo with two speakers |
| 2 | `moving-boxes.webp` | Box and a rolled carpet beside an open door |
| 3 | `tent.webp` | Canvas A-frame tent seen from outside |
| 4 | `door.webp` | Closed wooden door with a handle |
| 5 | `centre-dot.webp` | A dot exactly in the centre of a circle |
| 6 | `tv.webp` | Flat television on a low stand |
| 7 | `photo.webp` | Framed photograph of a family on a wall |
| 8 | `plant.webp` | Leafy green plant in a pot |
| 9 | `sofa.webp` | Long soft sofa with two cushions |
| 10 | `stove.webp` | Metal stove with a door and a chimney |
| 11 | `rug.webp` | Rectangular orange rug with fringed ends |
| 12 | `ger.webp` | Round white tent-like house (yurt) on green grass |
| 13 | `window.webp` | Square window with curtains and daylight |
| 14 | `lamp.webp` | Table lamp with a round shade |
| 15 | `apartment.webp` | Tall building with rows of windows |
| 16 | `bookcase.webp` | Tall wooden shelf full of books |
| 17 | `bed.webp` | Wooden bed with a white pillow |
| 18 | `chair.webp` | Wooden chair with a slatted back |
| 19 | `dresser.webp` | Wooden chest of drawers |
| 20 | `table.webp` | Wooden dining table with four legs |
| 21 | `mirror.webp` | Oval mirror in a dark frame |

### Unit 9 — Nature & the field trip (21)

| # | Filename | Draw |
|---|---|---|
| 1 | `lake.webp` | Blue lake with trees on the far bank |
| 2 | `deep-water.webp` | Cutaway of a lake showing dark water far down |
| 3 | `snake.webp` | Long green snake in tall grass |
| 4 | `california.webp` | Map outline of California on the west coast |
| 5 | `park.webp` | Park entrance sign with trees behind it |
| 6 | `hill.webp` | Rounded green hill under a blue sky |
| 7 | `tree.webp` | Single leafy tree on grass |
| 8 | `bird.webp` | Small bird on a branch |
| 9 | `hill-compare.webp` | Small flat hill next to a tall one, with an arrow |
| 10 | `island.webp` | Small green island surrounded by water |
| 11 | `high.webp` | Tall peak with clouds near the top |
| 12 | `mountain.webp` | One tall pointed mountain with a snow cap |
| 13 | `island-compare.webp` | Tiny island beside a large island, for scale |
| 14 | `tree-rings.webp` | Tree trunk cut showing many rings |
| 15 | `tall-tree.webp` | Very tall tree seen from below, looking up |
| 16 | `landscape.webp` | Wide landscape with forests and mountains |
| 17 | `ancient.webp` | Enormous old tree trunk with rough bark |
| 18 | `beach.webp` | *(same image as Unit 7 #14)* |
| 19 | `sandy.webp` | Close-up of pale sand |
| 20 | `grass.webp` | Long green grass blades, close up |
| 21 | `forest.webp` | Many tall trees standing close together |

### Capstone only (3)

| # | Filename | Draw |
|---|---|---|
| 1 | `carrot.webp` | Orange carrot with green top |
| 2 | `cushion.webp` | Sofa cushion with a button |
| 3 | `sneakers.webp` | Pair of white-and-teal sneakers |

---

## Notes

- **181 unique files.** Shared words across units (beach, trousers, snow…)
  reuse one file — flagged in the lists above.
- After adding files, `npm run images:manifest` prints exactly which words
  are still missing, per unit. The app picks up new images on the next
  build — no code changes, ever.
- Wrong size or busy background are the two things that break the look —
  when in doubt: simpler, bigger subject, transparent background.
