import xml.etree.ElementTree as ET
import re
from collections import defaultdict
from pathlib import Path

SVG_PATH = Path(__file__).parent / "sample-svg-maps-from-cottereau" / "2500 BC.svg"


def local_tag(el):
    return el.tag.split("}")[-1] if "}" in el.tag else el.tag


def parse_styles(style_text):
    class_to_fill = {}
    rule_pattern = re.compile(r"([^{]+)\{([^}]+)\}")
    for m in rule_pattern.finditer(style_text):
        for selector in m.group(1).strip().split(","):
            class_name = selector.strip().lstrip(".")
            fill_match = re.search(r"fill:\s*(#[0-9a-fA-F]{3,6})", m.group(2))
            if fill_match:
                class_to_fill[class_name] = fill_match.group(1).lower()
    return class_to_fill


def build_parent_map(root):
    p = {}
    for el in root.iter():
        for ch in el:
            p[ch] = el
    return p


def main():
    tree = ET.parse(SVG_PATH)
    root = tree.getroot()
    style = root.find(".//{http://www.w3.org/2000/svg}style")
    if style is None:
        for el in root.iter():
            if local_tag(el) == "style":
                style = el
                break
    class_to_fill = parse_styles(style.text)

    pmap = build_parent_map(root)
    old_world = {"Middle_east", "East_Asia", "Europe", "Africa", "Carribeans"}

    stats = defaultdict(lambda: {"max_d": 0, "n": 0, "gids": set()})

    for el in root.iter():
        t = local_tag(el)
        if t not in ("path", "polygon", "rect"):
            continue
        cls = el.get("class", "")
        if not cls:
            continue
        classes = cls.split()
        fill = None
        for c in classes:
            if c in class_to_fill:
                fill = class_to_fill[c]
        if not fill:
            continue
        cur = pmap.get(el)
        gids = []
        while cur is not None:
            i = cur.get("id")
            if i:
                gids.append(i)
            cur = pmap.get(cur)
        if not any(g in old_world for g in gids):
            continue
        dlen = 0
        if t == "path":
            dlen = len(el.get("d", ""))
        elif t == "polygon":
            dlen = len(el.get("points", ""))
        if dlen < 100:
            continue
        stats[fill]["max_d"] = max(stats[fill]["max_d"], dlen)
        stats[fill]["n"] += 1
        for g in gids:
            if g in old_world:
                stats[fill]["gids"].add(g)

    print("Saturated colors with path/polygon data length >= 100 in old-world groups:\n")
    for fill in sorted(stats.keys(), key=lambda f: -stats[f]["max_d"])[:30]:
        s = stats[fill]
        if s["max_d"] < 500:
            continue
        print(f"{fill}  max_subpath_len~{s['max_d']}  n={s['n']}  in={s['gids']}")


if __name__ == "__main__":
    main()
