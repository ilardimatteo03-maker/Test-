"""Couvertures des stories « À la une » d'Instagram : Affiliation, Tarifs, Horaires.

Même règle que le jeu d'icônes de la marque (_source/build_icons.py) : grille de 24, trait fin, extrémités carrées,
angles vifs, aucun remplissage. Icône Bianco centrée sur fond Nero, comme les couvertures « À la une » du gabarit
07_reseaux-sociaux (même échelle, même trait). Format story 1080 × 1920 : Instagram ne garde que le cercle central.
Sorties : 21_instagram-a-la-une/une-<nom>.png et apercu-a-la-une.png
"""
import json
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]  # dossier arte-automobili
sys.path.insert(0, str(BASE / "_source"))
from build_icons import UTILITY  # noqa: E402

SORTIE = BASE / "21_instagram-a-la-une"
SW, SH, ECHELLE = 1080, 1920, 14
NERO, BIANCO = "#0D0F0E", "#EEEDE7"

ICONES = {  # nom de fichier, libellé Instagram, tracé sur la grille de 24
    # le « % » de la commission partenaire
    "affiliation": ("Affiliation", '<path d="M18.5 4 5.5 20"/><circle cx="7.6" cy="7.4" r="2.6"/><circle cx="16.4" cy="16.6" r="2.6"/>'),
    # une étiquette de prix, posée en biais, avec son œillet
    "tarifs": ("Tarifs", '<path d="M12.5 3.5h8v8L11 21l-8-8z"/><circle cx="16.75" cy="7.25" r="1.35"/>'),
    "horaires": ("Horaires", UTILITY["horaires"][0]),
}


def icone(trace, taille):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="{taille}" height="{taille}" fill="none" '
            f'stroke="{BIANCO}" stroke-width="1.25" stroke-linecap="square" stroke-linejoin="miter">{trace}</svg>')


def couverture(trace):
    return (f"<!doctype html><meta charset=utf-8><style>*{{margin:0}}html,body{{width:{SW}px;height:{SH}px;background:{NERO}}}"
            f"body{{display:flex;align-items:center;justify-content:center}}svg{{display:block}}</style>{icone(trace, 24 * ECHELLE)}")


def apercu():
    """La rangée « À la une » telle qu'elle apparaîtra sur le profil (fond clair d'Instagram)."""
    bulles = "".join(f"""<figure><div class="rond">{icone(trace, 56)}</div><figcaption>{libelle}</figcaption></figure>"""
                     for libelle, trace in ICONES.values())
    return f"""<!doctype html><meta charset=utf-8><style>
*{{margin:0;box-sizing:border-box}}html,body{{width:1200px;height:420px;background:#fff}}
body{{display:flex;gap:56px;align-items:center;justify-content:center;font:400 30px/1 -apple-system,'Helvetica Neue',Arial,sans-serif;color:#111}}
figure{{display:flex;flex-direction:column;align-items:center;gap:22px}}
.rond{{width:190px;height:190px;border-radius:50%;border:8px solid #DBDEE3;padding:8px;background:#fff}}
.rond svg{{width:100%;height:100%;border-radius:50%;background:{NERO};padding:44px}}
</style>{bulles}"""


if __name__ == "__main__":
    SORTIE.mkdir(exist_ok=True)
    pages = [(f"une-{nom}.png", couverture(trace), SW, SH) for nom, (_, trace) in ICONES.items()]
    pages.append(("apercu-a-la-une.png", apercu(), 1200, 420))
    jobs, temp = [], []
    for nom, html, w, h in pages:
        f = SORTIE / f"_{nom}.html"
        f.write_text(html)
        temp.append(f)
        jobs.append({"in": str(f), "out": str(SORTIE / nom), "w": w, "h": h})
    jf = SORTIE / "_jobs.json"
    jf.write_text(json.dumps(jobs))
    try:
        subprocess.run(["node", str(BASE / "_source" / "render.mjs"), str(jf)], check=True, stdout=subprocess.DEVNULL)
    finally:
        for f in temp + [jf]:
            f.unlink()
    print("couvertures :", ", ".join(ICONES))
