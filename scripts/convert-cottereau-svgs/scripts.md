### SVG to GeoJSON (Cottereau historical maps)

Source Illustrator exports live under `scripts/convert-cottereau-svgs/sample-svg-maps-from-cottereau/`. That directory is **gitignored** because the files are large (multi‑MB); place the SVGs there locally after clone.

Install Python deps:

`pip install -r time-map/scripts/convert-cottereau-svgs/requirements-svg.txt`

David uses virtualenv so `workon time-map`

Then:

`python3 time-map/scripts/convert-cottereau-svgs/extract_svg_civilizations.py`

GeoJSON output is written to `app/data/civilizations-from-cottereau/` (e.g. `2500_BC_civilizations.geojson`).
