"""Briques communes aux gabarits : couleurs, polices, logos en ligne, textes SVG."""
from functools import lru_cache
from html import escape
from pathlib import Path

import logo

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "03_typographie" / "polices"

N, B, V = "#0D0F0E", "#EEEDE7", "#1F3D35"
G, A, TR = "#262B29", "#8E9592", "#D6D3CA"
PHI = 0.618


def font_css(base):
    """@font-face vers les polices du dépôt ; `base` = chemin relatif ou URL du dossier polices."""
    b = base.rstrip("/")
    return f"""
@font-face{{font-family:'Bodoni Moda';src:url('{b}/BodoniModa%5Bopsz,wght%5D.ttf') format('truetype');font-weight:400 900;font-style:normal}}
@font-face{{font-family:'Bodoni Moda';src:url('{b}/BodoniModa-Italic%5Bopsz,wght%5D.ttf') format('truetype');font-weight:400 900;font-style:italic}}
@font-face{{font-family:'Archivo';src:url('{b}/Archivo%5Bwdth,wght%5D.ttf') format('truetype');font-weight:100 900;font-stretch:62% 125%;font-style:normal}}
@font-face{{font-family:'Archivo';src:url('{b}/Archivo-Italic%5Bwdth,wght%5D.ttf') format('truetype');font-weight:100 900;font-stretch:62% 125%;font-style:italic}}
@font-face{{font-family:'DM Mono';src:url('{b}/DMMono-Light.ttf') format('truetype');font-weight:300}}
@font-face{{font-family:'DM Mono';src:url('{b}/DMMono-Regular.ttf') format('truetype');font-weight:400}}
@font-face{{font-family:'DM Mono';src:url('{b}/DMMono-Medium.ttf') format('truetype');font-weight:500}}
"""


GOOGLE_FONTS = ("https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900"
                "&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900"
                "&family=DM+Mono:wght@300;400;500&display=swap")


@lru_cache(maxsize=None)
def _lockups():
    return logo.lockups(100)


def logo_box(key):
    return _lockups()[key][1]


def logo_g(key, x, y, height=None, width=None, fill=B, anchor="tl"):
    """Logo vectoriel en ligne. anchor : tl, tc, tr, bl, bc, br, cc (point de référence)."""
    paths, (vx, vy, vw, vh) = _lockups()[key]
    s = height / vh if height else width / vw
    w, h = vw * s, vh * s
    ox = {"l": 0, "c": -w / 2, "r": -w}[anchor[1]]
    oy = {"t": 0, "c": -h / 2, "b": -h}[anchor[0]]
    return (f'<g fill="{fill}" fill-rule="evenodd" transform="translate({x + ox:.2f} {y + oy:.2f}) '
            f'scale({s:.5f}) translate({-vx:.2f} {-vy:.2f})">{"".join(paths)}</g>')


def logo_svg(key, fill=N, height=None, width=None, cls=""):
    """Logo en balise <svg> autonome (pour HTML)."""
    paths, (vx, vy, vw, vh) = _lockups()[key]
    size = ""
    if height:
        size = f' height="{height}" width="{height * vw / vh:.1f}"'
    elif width:
        size = f' width="{width}" height="{width * vh / vw:.1f}"'
    c = f' class="{cls}"' if cls else ""
    return (f'<svg{c} xmlns="http://www.w3.org/2000/svg" viewBox="{vx:.2f} {vy:.2f} {vw:.2f} {vh:.2f}"{size} '
            f'role="img" aria-label="Arte Automobili"><g fill="{fill}" fill-rule="evenodd">{"".join(paths)}</g></svg>')


FAMILY = {"bodoni": "Bodoni Moda", "archivo": "Archivo", "mono": "DM Mono"}


def text(x, y, lines, size, fam="archivo", weight=400, fill=B, ls=0.0, italic=False, anchor="start",
         stretch=100, lh=1.25, opacity=1.0, upper=False):
    """Texte SVG vivant (éditable). `lines` : str ou liste ; une ligne peut être une liste
    de segments (texte, italique?) pour mélanger romain et italique."""
    if isinstance(lines, str):
        lines = [lines]
    style = f"font-stretch:{stretch}%;" if stretch != 100 else ""
    out = [f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FAMILY[fam]}" font-size="{size}" font-weight="{weight}" '
           f'fill="{fill}" letter-spacing="{ls * size:.2f}" text-anchor="{anchor}"'
           f'{" font-style=" + chr(34) + "italic" + chr(34) if italic else ""}'
           f'{" opacity=" + chr(34) + str(opacity) + chr(34) if opacity != 1 else ""}'
           f'{" style=" + chr(34) + style + chr(34) if style else ""}>']
    for i, line in enumerate(lines):
        dy = 0 if i == 0 else size * lh
        segs = line if isinstance(line, list) else [(line or "\u00a0", None)]
        first = True
        for seg, it in segs:
            seg = seg.upper() if upper else seg
            attr = ""
            if first:
                attr += f' x="{x:.1f}" dy="{dy:.1f}"'
                first = False
            if it is not None:
                attr += f' font-style="{"italic" if it else "normal"}"'
            out.append(f"<tspan{attr}>{escape(seg)}</tspan>")
    out.append("</text>")
    return "".join(out)


def rect(x, y, w, h, fill, opacity=1.0, extra=""):
    op = f' opacity="{opacity}"' if opacity != 1 else ""
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}"{op}{extra}/>'


def linea(x1, y, x2, color=A, w=1.5, opacity=1.0):
    return rect(x1, y - w / 2, x2 - x1, w, color, opacity)


def text_width(s, size, fam="bodoni", italic=False, weight=400, stretch=100):
    """Largeur d'avance d'un texte (mesurée sur la police réelle) — pour composer des lignes mixtes."""
    from glyphs import font, text_path
    if fam == "bodoni":
        f = font("bodoni-italic" if italic else "bodoni", wght=weight, opsz=min(max(size, 6), 96))
    elif fam == "archivo":
        f = font("archivo", wght=weight, wdth=stretch)
    else:
        f = font("dmmono")
    return text_path(f, s, size)[1]


def opera(x, y, num, size, fill=B, mono_fill=None, anchor="start"):
    """Bloc « Opera N° 0147 » : Bodoni italique + numéro en DM Mono (rituel de numérotation)."""
    w1 = text_width("Opera", size, "bodoni", italic=True)
    gap = size * 0.32
    ms = size * 0.52
    w2 = text_width(f"N° {num}", ms, "mono") + ms * 0.06 * (len(num) + 2)
    total = w1 + gap + w2
    x0 = {"start": x, "middle": x - total / 2, "end": x - total}[anchor]
    return (text(x0, y, "Opera", size, "bodoni", 400, fill, italic=True)
            + text(x0 + w1 + gap, y, f"N° {num}", ms, "mono", 400, mono_fill or fill, ls=0.06))
