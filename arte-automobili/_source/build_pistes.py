"""Planches d'exploration des trois pistes de logo (niveau esquisse avancée).
Les pistes 1 et 2 ne sont pas développées : elles servent à argumenter le choix."""
from pathlib import Path

import cairosvg
from shapely import affinity
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

import logo
from glyphs import font, ink_bounds, metrics, text_path
from mark import to_path

OUT = Path(__file__).resolve().parent.parent / "01_strategie" / "pistes"
W, H = 1200, 800


def centered_text(fname, text, cap, cx, baseline, tracking=0.0, **axes):
    f = font(fname, **axes)
    m = metrics(f)
    size = cap / m["cap"] * m["upm"]
    x0, x1 = ink_bounds(f, text, size, tracking)
    d, _ = text_path(f, text, size, cx - (x1 - x0) / 2 - x0, baseline, tracking)
    return d, x1 - x0


def board(bg, body, label, sub, fg_label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<rect width="{W}" height="{H}" fill="{bg}"/>{body}'
            f'<text x="48" y="{H - 64}" font-family="Archivo" font-stretch="125%" font-weight="600" '
            f'font-size="15" letter-spacing="3" fill="{fg_label}">{label}</text>'
            f'<text x="48" y="{H - 40}" font-family="DM Mono" font-size="13" fill="{fg_label}" '
            f'opacity=".7">{sub}</text></svg>')


def piste1():
    """Il Sigillo — plaque de carrossier, Bodoni, noir & champagne."""
    gold, bg = "#C2AB80", "#0D0F0E"
    cx, cy, pw, ph = W / 2, 330, 520, 300
    c = 46
    oct_ = Polygon([(cx - pw / 2 + c, cy - ph / 2), (cx + pw / 2 - c, cy - ph / 2), (cx + pw / 2, cy - ph / 2 + c),
                    (cx + pw / 2, cy + ph / 2 - c), (cx + pw / 2 - c, cy + ph / 2), (cx - pw / 2 + c, cy + ph / 2),
                    (cx - pw / 2, cy + ph / 2 - c), (cx - pw / 2, cy - ph / 2 + c)])
    ring1 = oct_.difference(oct_.buffer(-2.2, join_style=2))
    inner = oct_.buffer(-14, join_style=2)
    ring2 = inner.difference(inner.buffer(-1.1, join_style=2))
    # monogramme AA entrelacé en Bodoni
    f = font("bodoni", wght=500, opsz=96)
    m = metrics(f)
    cap = 120
    size = cap / m["cap"] * m["upm"]
    dA1, w1 = text_path(f, "A", size, cx - 92, cy + 30)
    dA2, _ = text_path(f, "A", size, cx - 20, cy + 30)
    d_name, _ = centered_text("bodoni", "ARTE AUTOMOBILI", 17, cx, cy + 96, 0.32, wght=500, opsz=24)
    d_sub, _ = centered_text("bodoni", "ATELIER DE DETAILING", 9, cx, cy + 120, 0.5, wght=400, opsz=11)
    rule = box(cx - 70, cy + 58, cx + 70, cy + 59)
    body = (f'<g fill="{gold}" fill-rule="evenodd"><path d="{to_path(ring1)}"/><path d="{to_path(ring2)}"/>'
            f'<path d="{dA1}"/><path d="{dA2}" opacity=".78"/><path d="{to_path(rule)}"/>'
            f'<path d="{d_name}"/><path d="{d_sub}"/></g>')
    return board(bg, body, "PISTE 1 — LUXURY HERITAGE · « IL SIGILLO »",
                 "Plaque de carrossier · Bodoni Moda · Nero + Champagne", "#8E9592")


def piste2():
    """La Traiettoria — monogramme monoligne incliné, Archivo Expanded, graphite & rosso."""
    bg, fg, red = "#262B29", "#EEEDE7", "#B3262B"
    cx, cy = W / 2, 300
    sw = 15
    h, w = 120, 92
    def lam(x0):
        return LineString([(x0, cy + h / 2), (x0 + w / 2, cy - h / 2), (x0 + w, cy + h / 2)]).buffer(
            sw / 2, cap_style=2, join_style=2, mitre_limit=8)
    l1, l2 = lam(cx - w - 6), lam(cx + 6 - 12)
    mono = unary_union([l1, l2]).intersection(box(0, cy - h / 2 - 40, W, cy + h / 2))
    bar = box(cx - w + 18, cy + 16, cx + w + 120, cy + 16 + sw * 0.7)
    bar = bar.difference(unary_union([l1, l2]).buffer(5))
    mono = affinity.skew(mono, xs=-12, origin=(cx, cy + h / 2))
    bar = affinity.skew(bar, xs=-12, origin=(cx, cy + h / 2))
    f = font("archivo", wght=760, wdth=125)
    # faux italique par inclinaison géométrique des tracés (Archivo Italic existe aussi)
    d_name, wn = centered_text("archivo", "ARTE AUTOMOBILI", 30, cx, cy + 150, 0.06, wght=760, wdth=125)
    d_sub, _ = centered_text("archivo", "PERFORMANCE DETAILING", 11, cx, cy + 182, 0.42, wght=500, wdth=125)
    body = (f'<g fill-rule="evenodd"><path fill="{fg}" d="{to_path(mono)}"/><path fill="{red}" d="{to_path(bar)}"/>'
            f'<g transform="translate({cx} {cy + 150}) skewX(-10) translate({-cx} {-(cy + 150)})"><path fill="{fg}" d="{d_name}"/></g>'
            f'<path fill="#8E9592" d="{d_sub}"/></g>')
    return board(bg, body, "PISTE 2 — MODERN PERFORMANCE · « LA TRAIETTORIA »",
                 "Monoligne incliné · Archivo Expanded · Grafite + Rosso", "#8E9592")


def piste3():
    """Il Riflesso — piste retenue."""
    bg, fg = "#EEEDE7", "#0D0F0E"
    paths, vb = logo.lockups(100)["logo-vertical"]
    sc = 300 / vb[3]
    tx = W / 2 - (vb[0] + vb[2] / 2) * sc
    ty = 150 - vb[1] * sc
    body = f'<g fill="{fg}" fill-rule="evenodd" transform="translate({tx:.2f} {ty:.2f}) scale({sc:.4f})">{"".join(paths)}</g>'
    return board(bg, body, "PISTE 3 — ITALIAN ATELIER · « IL RIFLESSO » — RETENUE",
                 "Monogramme A + reflet · lettrage dessiné + Archivo Expanded · Nero, Bianco, Verde", "#262B29")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [("piste-1-luxury-heritage", piste1), ("piste-2-modern-performance", piste2),
                     ("piste-3-italian-atelier", piste3)]:
        svg = fn()
        (OUT / f"{name}.svg").write_text(svg)
        cairosvg.svg2png(bytestring=svg.encode(), write_to=str(OUT / f"{name}.png"), output_width=W)
    print("ok")


if __name__ == "__main__":
    main()
