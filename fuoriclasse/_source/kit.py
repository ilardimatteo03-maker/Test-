"""Briques communes : chemins, CSS des polices et de la palette, pages HTML, rendu Chromium."""
import json
import subprocess
from html import escape
from pathlib import Path

import brand as B

SRC = Path(__file__).resolve().parent
ROOT = SRC.parent
FONTS = ROOT / "03_typographie" / "polices"
TMP = SRC / ".build"          # fichiers intermédiaires (ignorés par git)
TMP.mkdir(exist_ok=True)


def font_css(base=None):
    """@font-face vers les polices du dépôt. base = URL ou chemin relatif du dossier polices."""
    b = (base or FONTS.as_uri()).rstrip("/")
    return f"""
@font-face{{font-family:'Playfair';src:url('{b}/Playfair%5Bopsz,wdth,wght%5D.ttf') format('truetype');font-weight:300 900;font-stretch:87.5% 112.5%;font-style:normal}}
@font-face{{font-family:'Playfair';src:url('{b}/Playfair-Italic%5Bopsz,wdth,wght%5D.ttf') format('truetype');font-weight:300 900;font-stretch:87.5% 112.5%;font-style:italic}}
@font-face{{font-family:'Mona Sans';src:url('{b}/MonaSans%5Bwdth,wght%5D.ttf') format('truetype');font-weight:200 900;font-stretch:75% 125%;font-style:normal}}
@font-face{{font-family:'Mona Sans';src:url('{b}/MonaSans-Italic%5Bwdth,wght%5D.ttf') format('truetype');font-weight:200 900;font-stretch:75% 125%;font-style:italic}}
@font-face{{font-family:'Geist Mono';src:url('{b}/GeistMono%5Bwght%5D.ttf') format('truetype');font-weight:100 900}}
"""


def palette_css():
    v = {"--nero": B.NERO, "--crema": B.CREMA, "--grafite": B.GRAFITE, "--talpa": B.TALPA,
         "--cioccolato": B.CIOCC, "--blu-notte": B.BLU, "--barolo": B.BAROLO, "--ottone": B.OTTONE,
         "--pietra": B.PIETRA, "--crema-2": B.CREMA_2, "--nero-2": B.NERO_2}
    return ":root{" + ";".join(f"{k}:{c}" for k, c in v.items()) + "}"


BASE_CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--crema);color:var(--nero);-webkit-font-smoothing:antialiased}
body{font-family:'Mona Sans',system-ui,sans-serif;font-size:16px;line-height:1.55}
.serif{font-family:'Playfair',Georgia,serif;font-variation-settings:'opsz' 900;font-weight:400;letter-spacing:-.005em}
.it{font-style:italic}
.wide{font-family:'Playfair',serif;font-stretch:112.5%;font-variation-settings:'opsz' 30;font-weight:420;letter-spacing:.14em;text-transform:uppercase}
.lab{font-family:'Mona Sans',sans-serif;font-stretch:125%;font-weight:500;font-size:11px;letter-spacing:.32em;text-transform:uppercase}
.mono{font-family:'Geist Mono',ui-monospace,monospace;letter-spacing:.02em}
.grain::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.10;mix-blend-mode:multiply;
 background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")}
"""


def page(body, css="", title="FUORICLASSE", w=None, h=None, bg=None, fonts_base=None, head=""):
    size = ""
    if w and h:
        size = f"html,body{{width:{w}px;height:{h}px;overflow:hidden}}"
    bgc = f"html,body{{background:{bg}}}" if bg else ""
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>{escape(title)}</title>'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f"<style>{font_css(fonts_base)}{palette_css()}{BASE_CSS}{size}{bgc}{css}</style>{head}</head>"
            f"<body>{body}</body></html>")


def write(path, text):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def render(jobs):
    """jobs : liste de dicts {in, out, w, h, scale?, pdf?, fullsize?, jpg?}."""
    if not jobs:
        return
    jf = TMP / "jobs.json"
    jf.write_text(json.dumps([{k: (str(v) if isinstance(v, Path) else v) for k, v in j.items()} for j in jobs]))
    subprocess.run(["node", str(SRC / "render.mjs"), str(jf)], check=True)


def svg_doc(inner, w, h, bg=None, defs=""):
    r = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            f'width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs>{defs}</defs>{r}{inner}</svg>')


def svg_page(svg, w, h, bg=None):
    """Enveloppe un SVG dans une page HTML (pour le rendu PNG avec les polices)."""
    return page(f'<div style="width:{w}px;height:{h}px">{svg}</div>', w=w, h=h, bg=bg)


def esc(s):
    return escape(str(s))


def uniq(svg, prefix):
    """Préfixe tous les id d'un SVG (et leurs références) pour l'insérer à côté d'autres SVG."""
    import re
    ids = set(re.findall(r'id="([^"]+)"', svg))
    for i in sorted(ids, key=len, reverse=True):
        svg = svg.replace(f'id="{i}"', f'id="{prefix}{i}"').replace(f"url(#{i})", f"url(#{prefix}{i})")
        svg = svg.replace(f'href="#{i}"', f'href="#{prefix}{i}"')
    return svg
