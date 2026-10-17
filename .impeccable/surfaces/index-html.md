---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["app.js"]
---

# Surface: Gengo app shell (home, review session, journey, friends, settings)

Mode: Operate. Users: Chris, his brother (Android) and a friend (iPhone); a few minutes at a time, one-handed. Job: clear today's due kana, see the journey, see each other.
Constraints: adaptive chrome (iOS conventions on iPhone, Material 3 on Android) around one shared Gengo identity; system UI faces; prints are public-domain Hiroshige (Hōeidō Tōkaidō); light and dark follow the phone.

## Direction contract

THESIS: The current station's Hiroshige print IS the app's ground; the UI lives on it as the print's own title cartouche, paper plates and a red seal. Refuses the study-app default of white cards, progress rings and a green Continue button.
OWN-WORLD: Full-bleed print; washi-paper plates (#f1ece2 / dark #23211d) carry every word, never bare text on the print; vertical cartouche with a thin vermilion rule; one square red seal (#b23a2a) is the only primary action; the tint is sampled live from the print's sky band (fallback bero-ai #2b4c7e) and drives OS controls. Kana and station names in a self-hosted Edo-era mincho subset; everything else in the platform face.
STORY: You open the app and are standing at a station on the Tōkaidō; one seal says how many kana are due; tapping it walks you into a review where the print recedes and a single huge kana stands on paper; finishing brings you back to the road, the print a little more coloured.
FIRST VIEWPORT: Print covers the full screen (object-position tuned per print). Top-right: vertical cartouche, station kanji ~30px mincho, romaji + "n of 55" small. Lower third: the red seal, ~120px square, count ~44px, label START/DONE. Bottom: three friend plates (name + streak) above the OS nav (iOS tab bar on material / Android nav bar). Ink-sketch fade: print saturation follows progress to the next station.
FORM: Living Hiroshige Plate, position 1 on the grounded list (IMPECCABLE'S PICK, chosen by Chris over the rolled Stamp Book); seed key 09e93709. Signature interaction: the print's colour fills in (grayscale→colour) as mastery approaches the next station, and a station arrival cross-fades to the next print. Session grammar kept from the Stamp Book: one decision on screen, kana monumental, a right answer stamped 良.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
