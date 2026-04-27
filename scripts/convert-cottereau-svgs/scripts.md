# Overview of conversion process

First, get the georeference points (this just needs to be done once, since the goereference points can be used with all map images, assuming they all use the same basemap):

1. Convert the original SVG to PNG (or any raster image), then load it into QGIS
2. Georeference raster image with a target CRS **EPSG:4326 (WGS84)** and transformation **Polynomial 3** (this one seemed to get the best results)
3. Export the QGIS GCP table to `.points` file (this is basically just a plane text file with a bunch of point pairs that match the raster image to a actual points on the real map)

Then, for any/all SVG files for any specific year:

1. Run a python script to that parses the original SVG file to extract the region polygons, then uses the georeference points to convert the SVG polygons to GeoJSON objects
2. The app, which knows how to read GeoJSON, can display them

# Implementation instructions and details

### SVG to GeoJSON (Cottereau historical maps)

Source Illustrator exports live under `scripts/convert-cottereau-svgs/sample-svg-maps-from-cottereau/`. That directory is **gitignored** because the files are large (multi‑MB); place the SVGs there locally after clone.

Install Python deps:

`pip install -r time-map/scripts/convert-cottereau-svgs/requirements-svg.txt`

David uses virtualenv so `workon time-map`

Then:

`python3 time-map/scripts/convert-cottereau-svgs/extract_svg_civilizations.py`

The extractor uses `2500_BC_qgis_polynomial3.points`, exported from QGIS Georeferencer in EPSG:4326, and fits a degree-3 polynomial from SVG coordinates to `(longitude, latitude)`. The QGIS raster used for georeferencing was exported at 2x SVG scale with inverted y, so the extractor converts QGIS source coordinates with `svg_x = sourceX * 0.5` and `svg_y = -sourceY * 0.5` before fitting.

Internally, the script:

1. Parses the SVG style block.
2. Finds only the fill colors that correspond to Cottereau civilizations.
3. Extracts `path`, `polygon`, and `rect` geometry from the relevant geographic layers.
4. Samples SVG paths into point rings.
5. Fits the Polynomial 3 SVG-to-WGS84 transform from all enabled QGIS GCPs.
6. Converts every SVG `(x, y)` vertex to WGS84 `(longitude, latitude)`.
7. Writes a GeoJSON-shaped JSON file.

GeoJSON content is written to `app/data/civilizations-from-cottereau/` as `2500_BC_civilizations.json` (JSON file extension because it's importable by Next.js web app framework, but note the content is a GeoJSON).

The app imports that file through `app/data/cottereau-2500bce.ts`, groups features by civilization label, assigns the 2500 BCE time range, and includes the result in `app/data/complete-dataset.ts` for timeline and globe rendering.

### Updating the QGIS georeference

Use all enabled GCPs, not a single point. One point only fixes a translation; polynomial 3 uses the whole GCP network to capture the image warp.

1. In QGIS Georeferencer, keep the target CRS as **EPSG:4326**.
2. Use **Polynomial 3** transformation for this Cottereau source.
3. Export the GCP table as `.points`.
4. Replace `2500_BC_qgis_polynomial3.points` with the exported file.
5. Re-run `python3 time-map/scripts/convert-cottereau-svgs/extract_svg_civilizations.py`.

If you change the raster scale used in QGIS, update `QGIS_RASTER_TO_SVG_SCALE` in `extract_svg_civilizations.py` too. For example, a 1x raster uses `1.0`; the current 2x raster uses `0.5`.

