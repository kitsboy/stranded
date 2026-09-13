# Map glyph fonts (Noto Sans)

These are MapLibre fontstack `.pbf` glyphs used by the map's symbol layers
(site labels + cluster counts). They were fetched from the MapLibre demo glyph
server (`https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf`) which
serves glyphs generated from **Noto Sans** (Google Fonts).

- Font: Noto Sans — Copyright Google, licensed under the **SIL Open Font
  License 1.1** (https://openfontlicense.org/documents/OFL.txt).
- Format: standard MapLibre/Mapbox vector-tile glyph PBFs (UTF-8 code-point
  ranges `0-255` … `1024-1279`), the exact format `maplibre-gl` requests.
- Why local: the previous stack (`Open Sans` + `Arial Unicode MS`) is **not**
  hosted by the glyph server — every request 404'd (measured on live). Serving
  from `/fonts/` removes the external dependency and the 404 class entirely.

Included stacks: `Noto Sans Regular` (5 ranges) and `Noto Sans Bold` (5 ranges).
The map style references them as `['Noto Sans Regular']` / `['Noto Sans Bold']`.
