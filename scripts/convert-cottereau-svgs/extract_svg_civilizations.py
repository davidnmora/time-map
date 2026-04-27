from __future__ import annotations

import csv
import json
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from svg.path import parse_path

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent

SVG_PATH = Path(__file__).parent / "sample-svg-maps-from-cottereau" / "2500 BC.svg"
GCP_POINTS_PATH = Path(__file__).parent / "2500_BC_qgis_polynomial3.points"
OUTPUT_GJ = (
    _REPO_ROOT
    / "app"
    / "data"
    / "civilizations-from-cottereau"
    / "2500_BC_civilizations.json"
)

LON_DEG_EAST = 180.0
LON_DEG_WEST = -180.0
LAT_DEG_NORTH = 90.0
LAT_DEG_SOUTH = -90.0

GCP_POLYNOMIAL_DEGREE = 3
QGIS_RASTER_TO_SVG_SCALE = 0.5

CIVILIZATION_FILLS: dict[str, str] = {
    "#f8d655": "Nile",
    "#fbd7ad": "Northern_Levant_Anatolia",
    "#e4a6a3": "Central_Mesopotamia",
    "#1a4786": "Lower_Mesopotamia",
    "#3f88c5": "Indus",
    "#4eb965": "Eastern_Persian_Gulf",
    "#e73853": "Mesopotamia_pink_tones",
    "#265c85": "Dark_blue_Aegean",
    "#d8d13e": "Andes_yellow_green",
}

GEO_CONTAINERS = frozenset(
    {
        "South_America",
        "North_America",
        "Africa",
        "Europe",
        "Middle_east",
        "East_Asia",
        "Carribeans",
    }
)


def geo_subtree_ids(chain: list[str]) -> list[str]:
    return [g for g in chain if g in GEO_CONTAINERS]


MIN_SVG_SHOELACE_AREA = 0.0001
PATH_STEPS_PER_SEGMENT = 14


def parse_styles(style_text: str) -> dict[str, str]:
    class_to_fill: dict[str, str] = {}
    for m in re.finditer(r"([^{]+)\{([^}]+)\}", style_text):
        body = m.group(2)
        fill_match = re.search(r"fill:\s*(#[0-9a-fA-F]{3,6})", body)
        if not fill_match:
            continue
        color = fill_match.group(1).lower()
        for selector in m.group(1).strip().split(","):
            class_to_fill[selector.strip().lstrip(".")] = color
    return class_to_fill


def local_tag(el: ET.Element) -> str:
    return el.tag.split("}")[-1] if "}" in el.tag else el.tag


def build_parent_map(root: ET.Element) -> dict[ET.Element, ET.Element | None]:
    p: dict[ET.Element, ET.Element | None] = {}
    for el in root.iter():
        for ch in el:
            p[ch] = el
    return p


def resolve_fill(classes: list[str], class_to_fill: dict[str, str]) -> str | None:
    for c in classes:
        if c in class_to_fill:
            return class_to_fill[c]
    return None


def group_chain_ids(el: ET.Element, pmap: dict[ET.Element, ET.Element | None]) -> list[str]:
    o: list[str] = []
    cur: ET.Element | None = pmap.get(el)
    while cur is not None:
        i = cur.get("id")
        if i:
            o.append(i)
        cur = pmap.get(cur)
    return o


@dataclass(frozen=True)
class GcpPoint:
    svg_x: float
    svg_y: float
    lon: float
    lat: float


@dataclass(frozen=True)
class PolynomialGeoTransform:
    degree: int
    view_w: float
    view_h: float
    lon_coefficients: np.ndarray
    lat_coefficients: np.ndarray

    def svg_to_lonlat(self, sx: float, sy: float) -> tuple[float, float]:
        terms = polynomial_terms(
            normalize_svg_x(sx, self.view_w),
            normalize_svg_y(sy, self.view_h),
            self.degree,
        )
        lon = float(terms @ self.lon_coefficients)
        lat = float(terms @ self.lat_coefficients)
        return round(lon, 6), round(max(LAT_DEG_SOUTH, min(LAT_DEG_NORTH, lat)), 6)


def normalize_svg_x(sx: float, view_w: float) -> float:
    return (sx - view_w / 2.0) / view_w


def normalize_svg_y(sy: float, view_h: float) -> float:
    return (sy - view_h / 2.0) / view_h


def polynomial_terms(x: float, y: float, degree: int) -> np.ndarray:
    return np.array(
        [x**i * y**j for total in range(degree + 1) for i in range(total + 1) for j in [total - i]],
        dtype=float,
    )


def qgis_source_to_svg(source_x: float, source_y: float) -> tuple[float, float]:
    return source_x * QGIS_RASTER_TO_SVG_SCALE, -source_y * QGIS_RASTER_TO_SVG_SCALE


def qgis_row_to_gcp_point(row: dict[str, str]) -> GcpPoint:
    svg_x, svg_y = qgis_source_to_svg(float(row["sourceX"]), float(row["sourceY"]))
    return GcpPoint(
        svg_x=svg_x,
        svg_y=svg_y,
        lon=float(row["mapX"]),
        lat=float(row["mapY"]),
    )


def parse_qgis_gcps(path: Path) -> list[GcpPoint]:
    with open(path, newline="", encoding="utf-8") as f:
        rows = csv.DictReader(line for line in f if not line.startswith("#"))
        points = [qgis_row_to_gcp_point(row) for row in rows if row.get("enable") == "1"]
    min_points = (GCP_POLYNOMIAL_DEGREE + 1) * (GCP_POLYNOMIAL_DEGREE + 2) // 2
    if len(points) < min_points:
        raise SystemExit(
            f"Polynomial degree {GCP_POLYNOMIAL_DEGREE} needs at least {min_points} enabled GCPs; got {len(points)}"
        )
    return points


def build_geo_transform(view_w: float, view_h: float) -> PolynomialGeoTransform:
    points = parse_qgis_gcps(GCP_POINTS_PATH)
    matrix = np.vstack(
        [
            polynomial_terms(
                normalize_svg_x(point.svg_x, view_w),
                normalize_svg_y(point.svg_y, view_h),
                GCP_POLYNOMIAL_DEGREE,
            )
            for point in points
        ]
    )
    lon_values = np.array([point.lon for point in points], dtype=float)
    lat_values = np.array([point.lat for point in points], dtype=float)
    lon_coefficients, *_ = np.linalg.lstsq(matrix, lon_values, rcond=None)
    lat_coefficients, *_ = np.linalg.lstsq(matrix, lat_values, rcond=None)
    return PolynomialGeoTransform(
        degree=GCP_POLYNOMIAL_DEGREE,
        view_w=view_w,
        view_h=view_h,
        lon_coefficients=lon_coefficients,
        lat_coefficients=lat_coefficients,
    )


def shoelace_area(ring: list[tuple[float, float]]) -> float:
    if len(ring) < 3:
        return 0.0
    s = 0.0
    for i in range(len(ring) - 1):
        s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
    return 0.5 * abs(s)


def dedupe_consecutive(pts: list[tuple[float, float]], eps: float = 0.2) -> list[tuple[float, float]]:
    if not pts:
        return []
    o = [pts[0]]
    for p in pts[1:]:
        if abs(p[0] - o[-1][0]) < eps and abs(p[1] - o[-1][1]) < eps:
            continue
        o.append(p)
    if len(o) > 1 and abs(o[0][0] - o[-1][0]) < eps and abs(o[0][1] - o[-1][1]) < eps:
        o = o[:-1]
    return o


def path_d_to_ring(d: str) -> list[tuple[float, float]] | None:
    d = d.strip()
    if not d:
        return None
    try:
        pth = parse_path(d)
    except Exception:
        return None
    pts: list[tuple[float, float]] = []
    for seg in pth:
        for i in range(PATH_STEPS_PER_SEGMENT + 1):
            t = i / float(PATH_STEPS_PER_SEGMENT)
            z = seg.point(t)
            pts.append((z.real, z.imag))
    pts = dedupe_consecutive(pts, eps=0.3)
    if len(pts) < 3:
        return None
    if abs(pts[0][0] - pts[-1][0]) > 0.1 or abs(pts[0][1] - pts[-1][1]) > 0.1:
        pts = [*pts, pts[0]]
    if shoelace_area(pts) < MIN_SVG_SHOELACE_AREA:
        return None
    return pts


def points_attr_to_ring(points: str) -> list[tuple[float, float]] | None:
    nums = [float(x) for x in points.replace(",", " ").split() if x.strip()]
    if len(nums) < 6:
        return None
    pairs = [(nums[i], nums[i + 1]) for i in range(0, len(nums) - 1, 2)]
    pairs = dedupe_consecutive(pairs, eps=0.2)
    if len(pairs) < 3:
        return None
    if abs(pairs[0][0] - pairs[-1][0]) > 0.1 or abs(pairs[0][1] - pairs[-1][1]) > 0.1:
        pairs = [*pairs, pairs[0]]
    if shoelace_area(pairs) < MIN_SVG_SHOELACE_AREA:
        return None
    return pairs


def rect_to_ring(x: float, y: float, w: float, h: float) -> list[tuple[float, float]]:
    return [(x, y), (x + w, y), (x + w, y + h), (x, y + h), (x, y)]


def ring_to_geojson_coords(
    ring: list[tuple[float, float]],
    geo_transform: PolynomialGeoTransform,
) -> list[list[float]]:
    if ring[0] == ring[-1]:
        r = ring
    else:
        r = [*ring, ring[0]]
    return [
        list(geo_transform.svg_to_lonlat(x, y)) for x, y in r
    ]


def parse_svg_viewbox(svg_root: ET.Element) -> tuple[float, float]:
    raw = (svg_root.get("viewBox") or "").strip()
    if not raw:
        raise SystemExit("Root <svg> has no viewBox")
    parts = raw.replace(",", " ").split()
    if len(parts) < 4:
        raise SystemExit("viewBox must have at least 4 values")
    w, h = float(parts[2]), float(parts[3])
    if w <= 0 or h <= 0:
        raise SystemExit("viewBox width/height must be positive")
    return w, h


def main() -> None:
    tree = ET.parse(SVG_PATH)
    r = tree.getroot()
    view_w, view_h = parse_svg_viewbox(r)
    geo_transform = build_geo_transform(view_w, view_h)
    style_el = None
    for el in r.iter():
        if local_tag(el) == "style":
            style_el = el
            break
    if style_el is None or not style_el.text:
        raise SystemExit("No <style> block found")
    class_to_fill = parse_styles(style_el.text)
    allowed_fills = set(CIVILIZATION_FILLS.keys())
    pmap = build_parent_map(r)

    features: list[dict] = []
    for el in r.iter():
        t = local_tag(el)
        if t not in ("path", "polygon", "rect"):
            continue
        cls_list = (el.get("class") or "").split()
        fill = resolve_fill(cls_list, class_to_fill)
        if not fill or fill not in allowed_fills:
            continue

        chain = group_chain_ids(el, pmap)
        ring: list[tuple[float, float]] | None = None
        if t == "path":
            ring = path_d_to_ring(el.get("d", ""))
        elif t == "polygon":
            ring = points_attr_to_ring(el.get("points", ""))
        else:
            try:
                x, y, w, h = (
                    float(el.get("x", "0")),
                    float(el.get("y", "0")),
                    float(el.get("width", "0")),
                    float(el.get("height", "0")),
                )
            except ValueError:
                x, y, w, h = 0, 0, 0, 0
            if w <= 0 or h <= 0:
                continue
            ring = rect_to_ring(x, y, w, h)

        if not ring:
            continue

        label = CIVILIZATION_FILLS[fill]
        gcoords = ring_to_geojson_coords(ring, geo_transform)
        fe = {
            "type": "Feature",
            "properties": {
                "fill": fill,
                "label_hint": label,
                "svg_layer_ids": geo_subtree_ids(chain),
                "svg_class": " ".join(cls_list),
            },
            "geometry": {"type": "Polygon", "coordinates": [gcoords]},
        }
        features.append(fe)

    fc = {
        "type": "FeatureCollection",
        "name": "2500 BC civilizations (from Cottereau SVG)",
        "proj_note": (
            "Coordinates are fitted from QGIS WGS84 GCPs with a degree-3 polynomial transform. "
            "QGIS raster source coordinates are converted back to SVG coordinates with "
            "svg_x = sourceX * 0.5 and svg_y = -sourceY * 0.5 before fitting."
        ),
        "viewBox": {"width": view_w, "height": view_h},
        "qgisGcpPoints": GCP_POINTS_PATH.name,
        "qgisPolynomialDegree": GCP_POLYNOMIAL_DEGREE,
        "qgisRasterToSvgScale": QGIS_RASTER_TO_SVG_SCALE,
        "extent": {
            "lon_west": LON_DEG_WEST,
            "lon_east": LON_DEG_EAST,
            "lat_north": LAT_DEG_NORTH,
            "lat_south": LAT_DEG_SOUTH,
        },
        "features": features,
    }
    OUTPUT_GJ.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_GJ, "w", encoding="utf-8") as f:
        json.dump(fc, f, indent=2)

    by_fill: dict[str, int] = {}
    for fe in features:
        f = fe["properties"]["fill"]
        by_fill[f] = by_fill.get(f, 0) + 1
    print(f"Wrote {len(features)} features to {OUTPUT_GJ}")
    for fill in sorted(by_fill, key=by_fill.get, reverse=True):
        print(f"  {fill} ({CIVILIZATION_FILLS[fill]}): {by_fill[fill]}")


if __name__ == "__main__":
    main()
