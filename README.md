# Skyline Builder

A small, original city-building game made for a 6-year-old to play on an iPhone
in short 5–10 minute sessions. He builds roads, homes, shops and tall towers
while Pip the builder bird gives him short sentences to read.

Each session starts by picking a city: Paris, London, New York, Tokyo, Sydney,
Rome, Cairo, Rio de Janeiro or Dubai. Every city starts with two of its famous
places already standing (the Eiffel Tower, Big Ben, the pyramids and so on), and
each city keeps its own saved progress.

Next, a **Today's jobs** card gives him three small jobs, for example "Build a
road to the Eiffel Tower," "Build 2 houses next to a road," or "Make 2 parks."
Jobs tick off as he works. When all three are done, the game says "See you
tomorrow!" and offers a calm good-night screen as a natural place to stop.
An unfinished session is picked up again if he comes back within 2 hours.

In the **🎨 Building Studio** he designs his own buildings. He chooses the floors
(1–20), shape (box, slim, steps, round), colour, windows (small, big, glass) and roof
(flat, pointy, spire, dome, garden, helipad, pool), then gives it a name. A live
preview shows the building, and short sentences describe it ("Sky Tower has 14
floors. It is blue. Helicopters can land on the roof!"). Saved designs (up to 12) can
be built in any city. Return visits to a city always include a job to design and
build one.

No accounts, ads, streaks or notifications. The town is saved on the phone.

## Play it on the iPhone (same Wi-Fi as this Mac)

1. On the Mac, in this folder, run:

   ```bash
   python3 -m http.server 8000
   ```

2. Find the Mac's Wi-Fi address (System Settings → Wi-Fi → Details → IP address),
   e.g. `192.168.1.20`.
3. On the iPhone, open Safari and go to `http://192.168.1.20:8000`.
4. Tap **Share → Add to Home Screen**. It now opens full-screen like an app.

This setup needs the Mac running. For a permanent version that works offline
anywhere, host the folder on HTTPS (for example GitHub Pages). Note: saves are
stored per web address, so a town built on one address won't move to another.

## How to play

| Tool | What it does |
|---|---|
| 👆 Look | Tap anything to read about it, including a fact about each famous place. Drag to move around. |
| 🛣️ Road | Drag to draw roads. Roads over water become bridges. |
| 🎨 Design | Open the Building Studio to make a building, or pick a saved one to build. |
| 🏠 🏪 🏢 🏙️ | Tap to place a house, shop, apartment or tower. |
| 🌳 Park | Drag to plant parks. |
| 🚜 Remove | Tap to clear a spot. |

Buildings need a road next to them. Without one they turn gray and show a red **!**.
Pinch with two fingers to zoom. ↩️ undoes a mistake. 📋 (or the city name) shows
today's jobs. 🔊 reads any message aloud. The ⚙️ menu can make Pip read every message
automatically, switch cities, or start a city over.

## Code

Plain HTML, CSS and JavaScript modules with no build step and no dependencies.

- `js/cities.js`: the city list, landmark positions and landmark facts
- `js/world.js`: map generation, building rules, stats, per-city saving
- `js/session.js`: today's jobs, progress checks, and the all-done screens
- `js/custom.js`: Studio choices, how designed buildings are drawn and described
- `js/studio.js`: the Building Studio screen and saved designs
- `js/render.js`: isometric canvas drawing; `js/landmarks.js` draws the famous places;
  `js/draw.js` has shared drawing helpers
- `js/pip.js`: Pip's messages and read-aloud
- `js/main.js`: touch input, camera, cars, toolbar and game loop
- `sw.js`: offline cache; `tools/make_icons.py` redraws the home-screen icons

## Roadmap

1. ✅ **Playable town**: roads, bridges, buildings, parks, cars, auto-save, undo
1. ✅ **World cities and daily jobs**: city picker, famous places, 3 jobs per session
1. ✅ **Building Studio**: design, name, save and build your own buildings
3. **City Day extras**: a small daily building budget and a sunset at the end of
   each session
4. **Infrastructure**: power and water, parks that make neighbours happy, buses and trains
5. **Unlocks and polish**: new parts earned from requests, sounds, a photo mode,
   people walking around
6. **Permanent hosting**: HTTPS hosting so it works offline anywhere
