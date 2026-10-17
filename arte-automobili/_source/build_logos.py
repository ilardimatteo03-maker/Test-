"""Exporte le système de logos : SVG (tracés purs), PDF vectoriels, PNG transparents,
icônes d'application et avatar réseaux sociaux.
Usage : python3 _source/build_logos.py"""
import io
from pathlib import Path

import cairosvg
from PIL import Image

import logo

ROOT = Path(__file__).resolve().parent.parent / "02_logo"

COLORS = {
    "nero": ("#0D0F0E", "Nero Vite — pour fonds clairs"),
    "bianco": ("#EEEDE7", "Bianco Sangiovanni — pour fonds sombres"),
    "verde": ("#1F3D35", "Verde Verona — couleur sur fond clair"),
    "noir-100": ("#000000", "Monochrome noir 100 %"),
    "blanc-100": ("#FFFFFF", "Monochrome blanc 100 %"),
}

NAMES = {
    "logo-principal": "Logo principal (horizontal)",
    "logo-vertical": "Version verticale",
    "logo-horizontal": "Version horizontale une ligne",
    "logo-secondaire": "Logo secondaire — lettrage",
    "monogramme": "Monogramme Il Riflesso",
    "monogramme-simplifie": "Monogramme simplifié (32–96 px)",
    "monogramme-micro": "Monogramme micro (< 32 px)",
    "signature": "Signature typographique",
}

PNG_WIDTHS = {"default": (1200, 3600), "mono": (512, 2048)}


def svg_for(key, color, bg=None, pad=0.0):
    paths, vb = logo.lockups(100)[key]
    x, y, w, h = vb
    p = max(w, h) * pad
    return logo._svg(paths, (x - p, y - p, w + 2 * p, h + 2 * p), f"Arte Automobili — {NAMES[key]}",
                     fill=color, bg=bg)


def main():
    for sub in ("svg", "pdf", "png", "icones"):
        (ROOT / sub).mkdir(parents=True, exist_ok=True)
    count = 0
    for key in NAMES:
        for cname, (hexv, _) in COLORS.items():
            svg = svg_for(key, hexv)
            stem = f"aa-{key}-{cname}"
            (ROOT / "svg" / f"{stem}.svg").write_text(svg)
            if cname in ("nero", "bianco", "noir-100", "blanc-100") and not key.startswith("monogramme-"):
                cairosvg.svg2pdf(bytestring=svg.encode(), write_to=str(ROOT / "pdf" / f"{stem}.pdf"))
            widths = PNG_WIDTHS["mono" if key.startswith("monogramme") else "default"]
            for wpx in widths:
                padded = svg_for(key, hexv, pad=0.03)
                cairosvg.svg2png(bytestring=padded.encode(), write_to=str(ROOT / "png" / f"{stem}-{wpx}px.png"),
                                 output_width=wpx)
            count += 1
    icons()
    print(f"{count} variantes exportées")


def _square(key, size, fg, bg, scale, dy=0.0):
    """Monogramme centré optiquement dans un carré."""
    paths, vb = logo.lockups(100)[key]
    x, y, w, h = vb
    S = h / scale
    cx, cy = x + w / 2, y + h / 2 + dy * h
    vbx = (cx - S / 2, cy - S / 2, S, S)
    svg = logo._svg(paths, vbx, "Arte Automobili", fill=fg, bg=bg)
    return svg, cairosvg.svg2png(bytestring=svg.encode(), output_width=size, output_height=size)


def icons():
    nero, bianco = COLORS["nero"][0], COLORS["bianco"][0]
    out = ROOT / "icones"
    # Avatar Instagram / Facebook / TikTok : 1080 px, recadrage rond sûr (monogramme ≤ 52 % de hauteur)
    svg, png = _square("monogramme-simplifie", 1080, bianco, nero, 0.50, dy=-0.02)
    (out / "avatar-reseaux-1080.png").write_bytes(png)
    (out / "avatar-reseaux.svg").write_text(svg)
    svg, png = _square("monogramme-simplifie", 1080, nero, bianco, 0.50, dy=-0.02)
    (out / "avatar-reseaux-clair-1080.png").write_bytes(png)
    # Icônes web
    for size, name, key, sc in [(180, "apple-touch-icon.png", "monogramme-simplifie", 0.62),
                                (192, "android-chrome-192.png", "monogramme-simplifie", 0.58),
                                (512, "android-chrome-512.png", "monogramme-simplifie", 0.58)]:
        _, png = _square(key, size, bianco, nero, sc)
        (out / name).write_bytes(png)
    svg, _ = _square("monogramme-micro", 64, bianco, nero, 0.78)
    (out / "favicon.svg").write_text(svg)
    frames = []
    for s in (16, 32, 48):
        _, png = _square("monogramme-micro", s, bianco, nero, 0.80)
        frames.append(Image.open(io.BytesIO(png)).convert("RGBA"))
    frames[-1].save(out / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=frames[:-1])
    for s in (16, 32):
        _, png = _square("monogramme-micro", s, bianco, nero, 0.80)
        (out / f"favicon-{s}.png").write_bytes(png)


if __name__ == "__main__":
    main()
