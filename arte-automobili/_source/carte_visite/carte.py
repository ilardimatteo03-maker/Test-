"""Carte de visite Arte Automobili, 85 × 55 mm, version blanche minimale (comme les devis et la grille tarifaire).

Une carte par personne de « equipe » dans _source/documents/donnees.json. PDF recto-verso avec 3 mm de fonds perdus,
texte vectorisé (aucune police à installer chez l'imprimeur), aperçus PNG au format fini.

    python3 carte.py
"""
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from glyphs import font, text_path  # noqa: E402
from kit import ROOT, logo_g  # noqa: E402

SORTIE = ROOT / "19_carte-de-visite"
D = json.loads((ROOT / "_source" / "documents" / "donnees.json").read_text())
CW, CH, BL = 85.0, 55.0, 3.0  # format fini et fonds perdus, en mm
M = 6.5                        # marge intérieure (zone de sécurité ≥ 5 mm)
PT = 0.3528                    # 1 pt en mm
NERO, GRIS, TRAIT = "#0D0F0E", "#5E6461", "#D6D3CA"
POLICES = {"bodoni": font("bodoni", wght=400, opsz=12), "mono": font("dmmono"),
           "archivo": font("archivo", wght=600, wdth=125)}


def trace(t, x, y, taille_pt, police, couleur=NERO, fin=False, interlettre=0.0):
    """Texte vectorisé posé sur la ligne de base y ; fin=True aligne à droite sur x."""
    d, w = text_path(POLICES[police], t, taille_pt * PT, tracking=interlettre)
    if fin:
        x -= w
    return f'<path transform="translate({x:.3f} {y:.3f})" fill="{couleur}" d="{d}"/>'


def svg(corps, fond_perdu=True):
    b = BL if fond_perdu else 0
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-b} {-b} {CW + 2 * b} {CH + 2 * b}" '
            f'width="{CW + 2 * b}mm" height="{CH + 2 * b}mm"><rect x="{-BL}" y="{-BL}" width="{CW + 2 * BL}" '
            f'height="{CH + 2 * BL}" fill="#FFFFFF"/>{corps}</svg>')


def recto():
    return logo_g("logo-principal", CW / 2, CH / 2, width=40, fill=NERO, anchor="cc")


def verso(p):
    x = D["entreprise"]
    tel = p.get("telephone") or x["telephone"]
    mail = p.get("email") or x["email"]
    c = logo_g("monogramme", CW - M, M + 0.5, height=8, fill=NERO, anchor="tr")
    c += trace(p["nom"], M, 15.5, 12, "bodoni")
    if p.get("fonction"):
        c += trace(p["fonction"].upper(), M, 20.5, 5.4, "archivo", GRIS, interlettre=0.22)
    ligne = CH * 0.618  # même proportion que la carte d'origine
    c += f'<rect x="{M}" y="{ligne - 0.1:.2f}" width="{CW - 2 * M}" height="0.2" fill="{TRAIT}"/>'
    pas, y0, t = 6.4 * PT * 1.65, ligne + 7.2, 6.4
    for i, s in enumerate([tel, mail]):
        c += trace(s, M, y0 + i * pas, t, "mono")
    for i, s in enumerate([x["site"], x["rue"], f"{x['code_postal']} {x['ville']}"]):
        c += trace(s, CW - M, y0 + i * pas, t, "mono", fin=True)
    return c


def slug(t):
    t = re.sub(r"[^\w]+", "-", t.lower()).strip("-")
    return t.translate(str.maketrans("àâäéèêëîïôöùûüç", "aaaeeeeiioouuuc")) or "carte"


def main():
    SORTIE.mkdir(exist_ok=True)
    jobs, temp = [], []
    for p in D["equipe"]:
        nom = slug(p["nom"])
        pages = [svg(recto()), svg(verso(p))]
        (SORTIE / f"carte-{nom}-recto.svg").write_text(pages[0])
        (SORTIE / f"carte-{nom}-verso.svg").write_text(pages[1])
        w, h = CW + 2 * BL, CH + 2 * BL
        html = SORTIE / f"_pdf-{nom}.html"
        html.write_text(f"<!doctype html><meta charset=utf-8><style>@page{{size:{w}mm {h}mm;margin:0}}html,body{{margin:0}}"
                        f"section{{width:{w}mm;height:{h}mm;overflow:hidden;break-after:page}}svg{{display:block}}</style>"
                        + "".join(f"<section>{s}</section>" for s in pages))
        temp.append(html)
        jobs.append({"in": str(html), "out": str(SORTIE / f"carte-de-visite-{nom}-85x55-fonds-perdus-3mm.pdf"),
                     "w": 800, "h": 600, "pdf": {"width": f"{w}mm", "height": f"{h}mm"}})
        for face, corps in (("recto", recto()), ("verso", verso(p))):  # aperçus au format fini, sans fonds perdus
            s = svg(corps, fond_perdu=False).replace(f'width="{CW}mm" height="{CH}mm"', 'width="1700" height="1100"')
            html = SORTIE / f"_png-{nom}-{face}.html"
            html.write_text(f"<!doctype html><meta charset=utf-8><style>html,body{{margin:0}}svg{{display:block}}</style>{s}")
            temp.append(html)
            jobs.append({"in": str(html), "out": str(SORTIE / f"apercu-{nom}-{face}.png"), "w": 1700, "h": 1100})
    jf = SORTIE / "_jobs.json"
    jf.write_text(json.dumps(jobs))
    try:
        subprocess.run(["node", str(ROOT / "_source" / "render.mjs"), str(jf)], check=True, stdout=subprocess.DEVNULL)
    finally:
        for f in temp + [jf]:
            f.unlink()
    print("cartes :", ", ".join(p["nom"] for p in D["equipe"]))


if __name__ == "__main__":
    main()
