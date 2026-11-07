# ECO-EXPERT.AI · Six AI agents, one platform

A full-screen, step-by-step web presentation of ECO-EXPERT.AI, the artificial intelligence platform for ecological expertise developed by the State Ecological Expertise Center's Artificial Intelligence Department. It opens with 180,000+ conclusions streaming onto the map of Uzbekistan, shows each of the six agents at work on what it reads, and ends on ECO-MAP's 3D picture of the country. 28 steps, about 6 minutes, in Uzbek, Russian or English, in a dark or a light theme. It is the sibling of the ECO SERVICE presentation (`../eco-service`) and runs on the same engine.

## Present it

1. Double-click **`present.bat`**. The first run installs dependencies, which takes a minute. After that it builds the latest version and opens it in your browser (http://localhost:4175).
2. Press **F** for full screen.
3. Needs Node.js and an internet connection: the satellite imagery and terrain stream live.

| Action | Keys |
|---|---|
| Next step | Right arrow, Space, Page Down, Enter, a presentation clicker, or left click |
| Previous step | Left arrow, Page Up, Backspace, or right click |
| First / last step | Home / End |
| Full screen | F |
| Language (UZ → RU → EN) | L, or the switch at the top right |
| Light / dark mode | T, or the moon / sun button at the top right |
| Jump to a step | add `#12` to the address (`?lang=ru`, `?theme=light` also work) |

The language and theme are remembered in the browser. The switches hide with the pointer while presenting.

The mouse pointer hides itself after two seconds without movement. Step 2 waits for the camera to land, then streams the points in (about 8 seconds in all); going back to step 1 and forward again replays it.

## The story

| Steps | What the audience sees |
|---|---|
| 1–3 | The globe; 180,000+ conclusions landing on the districts; the six agents drawn as the logo's leaf vein |
| 4–7 | 01 ECO-INTAKE: 3–4 hours by hand against 90 seconds, the reading light, the list of deficiencies, and the site checked against the protected zones (930 m to the Chirchiq river's water protection zone) |
| 8–10 | 02 ECO-CONSULT: the operator queue, answers in Uzbek, Russian and English at any hour, traced to the law |
| 11–12 | 03 ECO-COMPARE: two stages of one conclusion side by side, mismatches and an unfulfilled requirement |
| 13–14 | 04 ECO-EXPERT COPILOT: the library of regulations, the article found with its source |
| 15–18 | 05 ECO-CONTROL: a run of conclusions analyzed, the quality report for management, and before approval every site measured against the protected zones |
| 19–24 | 06 ECO-MAP: scattered data, every site on the 3D map, the protected zones, one company's plume on the wind, district columns, the whole country |
| 25–28 | On-premise servers, the legal basis, the results, "Fast. Accurate. Transparent." |

## Edit it

- **The story** lives in `src/steps.js`: one entry per step, with its id, the map camera and layers, the visual and the agent rail.
- **All text** is in `src/lang/uz.js`, `src/lang/ru.js` and `src/lang/en.js`, under each step's id (cards) and `viz` (the visuals). Uzbek and Russian wording follows the UZ and RU decks.
- **Agent names** are in `src/data.js`; roles and figures are in the language files. The sample company of the zone check and the plume is `SAMPLE` in `src/data.js`.
- **The plume** (step 22): `src/plume.js`, an approximate Gaussian plume (wind 3 m/s, neutral air, 10 m release height). The emission figures on the card are the user's sample figures.
- **Map cameras and layers**: `src/map.js` (`CAMERAS` at the top; column size in `COL_R` and `COL_H`).
- **The animated visuals on the right**: `src/visuals.js`. Each visual is drawn in rem units, so traces always meet their terminals.
- **The opening stream**: `src/stream.js`.
- **Colours, type and layout**: `src/styles.css` (tokens at the top).

To preview while editing, run `npm run dev` and open http://localhost:5175.

## What is real and what is illustrative

On screen, every illustration says so in the card's note. In short:

- **Real, from the deck:** every figure (3–4 hours → 90 seconds, 95%, 2 minutes, 24/7 in three languages, 180,000+), the six agents and their roles, Law No. LRU-1036 and Cabinet of Ministers Resolution No. 234, on-premise operation.
- **Real public data:** Uzbekistan's 199 district boundaries; 5,480 industrial sites mapped in OpenStreetMap (landuse=industrial, man_made=works, power=plant, downloaded on 2026-11-06).
- **Illustrative:** the positions of the 18,000 conclusion points (each stands for 10 conclusions, spread evenly across the districts); the sample application sections, deficiencies, questions, figures and conclusions inside the agent visuals; answer text and article numbers, shown as placeholders.
- **Real, from the Center's KMZ files:** the protected zones in `public/data/zones.geojson` (301 water protection zones of 16.09.2024, forest and hunting farms, reservoirs, drinking-water deposits), simplified for the web. `public/data/sitezones.json` holds each site's distance to its nearest zone (0 = inside): 444 of the 5,480 sites lie inside a zone.
- **Illustrative:** the plume of the sample company: its wind, direction and reach are an estimate, not a regulatory calculation.
- **A stand-in, labelled:** ECO-MAP's companies are shown as the OpenStreetMap industrial sites, and its district columns rise with the number of those sites (square-root scale). They are not emission data. To show ECO-MAP's real output, replace `public/data/sites.json` (an array of `[longitude, latitude]`) and `public/data/columns.json` (`{ "at": [lng, lat], "n": value }` per district).

## Sources and credits

- Content: the ECO-EXPERT.AI deck (`ECO-EXPERT-AI_presentation_EN (3).pptx`), including its logo.
- Satellite imagery: Esri World Imagery (© Esri, Maxar, Earthstar Geographics). Check Esri's terms of use before a public event or publishing a recording; the tile source is one line in `src/map.js` and can be swapped for a licensed provider.
- Terrain: Mapzen / AWS Terrain Tiles (open data).
- Boundaries: geoBoundaries (CC BY 4.0); district boundaries from OCHA ROCCA (CC BY 3.0 IGO); Natural Earth (public domain).
- Industrial sites: © OpenStreetMap contributors, under the Open Database License (ODbL).
- Map engine: MapLibre GL JS. Animation: GSAP. Icons: Lucide. Fonts: Geologica and Martian Mono (SIL Open Font License).
