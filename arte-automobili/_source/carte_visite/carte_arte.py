"""Carte de visite d'Arte Automobili d'après le design fourni (Canva, 3,5 × 2 po), recomposée au format 85 × 55 mm.

Le design original est conservé dans 19_carte-de-visite/design-original/ (1050 × 600 px à 300 ppp). Chaque élément
y a été mesuré au pixel près puis reconstruit en vectoriel :
  - « ARTE » et le monogramme (version simplifiée) : tracés du logo de la marque ;
  - « AUTOMOBILI » : Archivo (police de la marque), largeur 120, graisse 550, interlettrage calé sur l'original ;
  - slogan et coordonnées : Montserrat Regular, sans interlettrage, comme dans Canva ;
  - photo : extraite de l'original, agrandie juste ce qu'il faut pour couvrir les fonds perdus.
Les éléments gardent leur taille réelle ; la composition est recentrée sur le nouveau format.

    python3 carte_arte.py            # PDF d'impression + aperçus
    python3 carte_arte.py controle   # même rendu au format d'origine, pour le comparer à l'original
"""
import base64
import io
import json
import re
import subprocess
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent))
from glyphs import _kern, font  # noqa: E402
from kit import ROOT, _lockups  # noqa: E402

SORTIE = ROOT / "19_carte-de-visite"
ORIGINAL = SORTIE / "design-original"
K = 25.4 / 300                  # 1 px de l'original en mm
OW, OH = 1050, 600              # format de l'original en px
NERO, BIANCO, GRIS = "#0D0F0E", "#EEEDE7", "#E2E4E4"
MONT = TTFont(ICI / "polices" / "Montserrat-Regular.ttf")
ARCH = font("archivo", wght=550, wdth=120)

FACE1 = [  # textes Montserrat : (texte, taille, ligne de base, centre d'encre horizontal), en px de l'original
    ("DETAILING AUTOMOBILE PREMIUM À DOMICILE", 33.4, 180.0, 520.5),
    ("+32492534230", 27.4, 436.0, 528.5),
    ("arteautomobili@gmail.com", 27.4, 476.7, 524.0),
    ("www.arteautomobili.be", 27.4, 517.3, 524.0),
    ("à La Louvière et les alentours", 27.4, 558.0, 521.5),
]


def glyphes(f, texte, interlettre=0.0):
    """Tracé du texte en unités de police (y vers le haut) : liste de (nom, x), avance totale."""
    cmap, hm = f.getBestCmap(), f["hmtx"]
    noms = [cmap[ord(c)] for c in texte]
    out, x = [], 0.0
    for i, g in enumerate(noms):
        out.append((g, x))
        x += hm[g][0]
        if i < len(noms) - 1:
            x += _kern(f, g, noms[i + 1]) + interlettre
    return out, x


def encre(f, texte, interlettre=0.0):
    gs = f.getGlyphSet()
    p = BoundsPen(gs)
    for g, x in glyphes(f, texte, interlettre)[0]:
        gs[g].draw(TransformPen(p, (1, 0, 0, 1, x, 0)))
    return p.bounds  # xmin, ymin, xmax, ymax


def chemin(f, texte, echelle, x, y, interlettre=0.0, couleur=GRIS):
    """Texte vectorisé : (x, y) = origine de la ligne de base, en mm ; échelle en mm par unité de police."""
    gs = f.getGlyphSet()
    pen = SVGPathPen(gs)
    for g, gx in glyphes(f, texte, interlettre)[0]:
        gs[g].draw(TransformPen(pen, (echelle, 0, 0, -echelle, x + gx * echelle, y)))
    return f'<path fill="{couleur}" d="{pen.getCommands()}"/>'


def logo_chemins(cle, indices=None):
    paths, box = _lockups()[cle]
    paths = [p for i, p in enumerate(paths) if indices is None or i in indices]
    return "".join(paths), box


def carte(W, H, BL):
    """Deux faces en SVG (mm). W × H = format fini ; BL = fonds perdus. La composition de l'original est recentrée."""
    DX, DY = (W - OW * K) / 2, (H - OH * K) / 2
    X = lambda px: px * K + DX  # noqa: E731
    Y = lambda px: px * K + DY  # noqa: E731
    cadre = lambda corps: (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '  # noqa: E731
                           f'viewBox="{-BL} {-BL} {W + 2 * BL} {H + 2 * BL}" width="{W + 2 * BL}mm" height="{H + 2 * BL}mm">'
                           f'<rect x="{-BL}" y="{-BL}" width="{W + 2 * BL}" height="{H + 2 * BL}" fill="{NERO}"/>{corps}</svg>')

    # ---- face 1 : logo, slogan, coordonnées
    upm = MONT["head"].unitsPerEm
    c = ""
    arte, _ = logo_chemins("logo-secondaire", {0})           # « ARTE » seul : encre x 0–289,2 ; y −1,2–100
    s = 240 * K / 289.2                                      # encre de l'original : x 154–394, y 45–129 px
    c += f'<g fill="{BIANCO}" fill-rule="evenodd" transform="translate({X(154):.3f} {Y(45) + 1.2 * s:.3f}) scale({s:.6f})">{arte}</g>'
    xmin, ymin, xmax, ymax = encre(ARCH, "AUTOMOBILI")       # « AUTOMOBILI » : encre x 429–897, y 98–129 px
    e = 31 * K / (ymax - ymin)
    n = len("AUTOMOBILI") - 1
    inter = ((468 * K / e) - (xmax - xmin)) / n
    c += chemin(ARCH, "AUTOMOBILI", e, X(429) - xmin * e, Y(129) + ymin * e, inter, BIANCO)
    for texte, taille, base, centre in FACE1:
        e = taille * K / upm
        xmin, _, xmax, _ = encre(MONT, texte)
        c += chemin(MONT, texte, e, X(centre) - (xmin + xmax) / 2 * e, Y(base), 0.0, GRIS)
    face1 = cadre(c)

    # ---- face 2 : photo à gauche, dégradé noir → Nero, monogramme à droite
    S = (H + 2 * BL) / (OH * K)                              # agrandissement de la photo pour couvrir les fonds perdus
    photo = Image.open(ORIGINAL / "face-2-photo-monogramme.png").convert("RGB").crop((0, 0, 450, OH))
    photo = photo.resize((photo.width * 2, photo.height * 2), Image.LANCZOS)
    buf = io.BytesIO()
    photo.save(buf, "JPEG", quality=94, subsampling=0)
    pw = 450 * K * S
    d0, d1 = W - (OW - 620) * K, W - (OW - 810) * K          # dégradé de l'original, ancré au bord droit
    c = (f'<defs><linearGradient id="fondu" x1="{d0:.3f}" x2="{d1:.3f}" y1="0" y2="0" gradientUnits="userSpaceOnUse">'
         f'<stop offset="0" stop-color="#000000"/><stop offset="1" stop-color="{NERO}"/></linearGradient></defs>'
         f'<rect x="{-BL}" y="{-BL}" width="{d1 + BL:.3f}" height="{H + 2 * BL}" fill="url(#fondu)"/>'
         f'<rect x="{-BL}" y="{-BL}" width="{d0 + BL:.3f}" height="{H + 2 * BL}" fill="#000000"/>'
         f'<image x="{-BL}" y="{-BL}" width="{pw:.3f}" height="{H + 2 * BL}" preserveAspectRatio="none" '
         f'xlink:href="data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"/>')
    mono, (vx, vy, vw, vh) = logo_chemins("monogramme-simplifie")
    s = 417 * K / vh                                         # hauteur de l'original : y 93–510 px, centre x 816,5 px
    cx, cy = W - (OW - 816.5) * K, H / 2 + 1.5 * K
    c += (f'<g fill="{BIANCO}" fill-rule="evenodd" transform="translate({cx - vw * s / 2:.3f} {cy - vh * s / 2:.3f}) '
          f'scale({s:.6f}) translate({-vx:.3f} {-vy:.3f})">{mono}</g>')
    return face1, cadre(c)


def rendre(faces, pdf, apercus, W, H, BL):
    """PDF (une page par face) et aperçus PNG à 300 ppp au format fini, via Chromium."""
    w, h = W + 2 * BL, H + 2 * BL
    temp, jobs = [], []
    html = SORTIE / "_pdf.html"
    html.write_text(f"<!doctype html><meta charset=utf-8><style>@page{{size:{w}mm {h}mm;margin:0}}html,body{{margin:0}}"
                    f"section{{width:{w}mm;height:{h}mm;overflow:hidden;break-after:page}}svg{{display:block}}</style>"
                    + "".join(f"<section>{f}</section>" for f in faces))
    temp.append(html)
    if pdf:
        jobs.append({"in": str(html), "out": str(pdf), "w": 800, "h": 600, "pdf": {"width": f"{w}mm", "height": f"{h}mm"}})
    for f, out in zip(faces, apercus):  # aperçu au format fini (fonds perdus rognés)
        px_w, px_h = round(W / K), round(H / K)
        s = re.sub(r'viewBox="[^"]+" width="[^"]+" height="[^"]+"', f'viewBox="0 0 {W} {H}" width="{px_w}" height="{px_h}"', f, count=1)
        p = SORTIE / f"_png-{out.stem}.html"
        p.write_text(f"<!doctype html><meta charset=utf-8><style>html,body{{margin:0}}svg{{display:block}}</style>{s}")
        temp.append(p)
        jobs.append({"in": str(p), "out": str(out), "w": px_w, "h": px_h})
    jf = SORTIE / "_jobs.json"
    jf.write_text(json.dumps(jobs))
    try:
        subprocess.run(["node", str(ROOT / "_source" / "render.mjs"), str(jf)], check=True, stdout=subprocess.DEVNULL)
    finally:
        for f in temp + [jf]:
            f.unlink()


if __name__ == "__main__":
    if sys.argv[1:] == ["controle"]:
        W, H = OW * K, OH * K
        rendre(carte(W, H, 0), None, [SORTIE / "_controle-face-1.png", SORTIE / "_controle-face-2.png"], W, H, 0)
    else:
        W, H, BL = 85.0, 55.0, 3.0
        faces = carte(W, H, BL)
        (SORTIE / "carte-arte-face-1.svg").write_text(faces[0])
        (SORTIE / "carte-arte-face-2.svg").write_text(faces[1])
        rendre(faces, SORTIE / "carte-de-visite-arte-automobili-85x55-fonds-perdus-3mm.pdf",
               [SORTIE / "apercu-face-1.png", SORTIE / "apercu-face-2.png"], W, H, BL)
        print("carte 85 × 55 mm prête")
