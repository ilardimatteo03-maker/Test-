"""Stories Instagram « Tarifs » et « Options » (1080 × 1920 px), version minimale sur fond Nero, comme le site.

Les prestations, les options supplémentaires et les prix TTC viennent de _source/documents/donnees.json. Le contenu
reste hors des zones couvertes par l'interface d'Instagram (250 px en haut, 340 px en bas).
Sorties : 17_tarifs/story-instagram-tarifs.png et 17_tarifs/story-instagram-options.png
"""
import json
import re
import subprocess
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]  # dossier arte-automobili
SORTIE = BASE / "17_tarifs"
D = json.loads((BASE / "_source" / "documents" / "donnees.json").read_text())
LOGO = BASE / "14_theme-shopify-premium" / "theme" / "assets" / "logo-principal-bianco.svg"
SW, SH, HAUT, BAS = 1080, 1920, 250, 340


def prix(x):
    if x["prix_tvac"] is None:
        return "Sur devis"
    return f"{x['prix_tvac']:g} €".replace(".", ",")


def page(titre, elements):
    logo = re.sub(r"<title>.*?</title>", "", LOGO.read_text())
    logo = re.sub(r'\swidth="[^"]+"\s+height="[^"]+"', ' width="300"', logo, count=1)
    lignes = "".join(f'<li><span class="nom">{x["nom"]}</span><span class="prix">{prix(x)}</span></li>'
                     for x in elements)
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
@font-face{{font-family:'Bodoni Moda';src:url('../03_typographie/polices/BodoniModa%5Bopsz,wght%5D.ttf') format('truetype');font-weight:400 900;font-style:normal}}
@font-face{{font-family:'Bodoni Moda';src:url('../03_typographie/polices/BodoniModa-Italic%5Bopsz,wght%5D.ttf') format('truetype');font-weight:400 900;font-style:italic}}
@font-face{{font-family:'Archivo';src:url('../03_typographie/polices/Archivo%5Bwdth,wght%5D.ttf') format('truetype');font-weight:100 900;font-stretch:62% 125%}}
@font-face{{font-family:'DM Mono';src:url('../03_typographie/polices/DMMono-Light.ttf') format('truetype');font-weight:300}}
@font-face{{font-family:'DM Mono';src:url('../03_typographie/polices/DMMono-Regular.ttf') format('truetype');font-weight:400}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:{SW}px;height:{SH}px;background:#0D0F0E;color:#EEEDE7}}
main{{position:absolute;inset:{HAUT}px 96px {BAS}px;display:flex;flex-direction:column}}
.logo{{display:flex;justify-content:center;padding-top:40px}}
.logo svg{{display:block}}
h1{{margin:150px 0 28px;font:400 136px/1 'Bodoni Moda',Didot,serif}}
h1 i{{font-style:italic}}
.ttc{{display:flex;justify-content:flex-end;padding-bottom:22px;border-bottom:1.5px solid #EEEDE7;
      font:600 19px/1 Archivo,sans-serif;font-stretch:125%;letter-spacing:.24em;text-transform:uppercase;color:#8E9592}}
ul{{list-style:none}}
li{{display:flex;justify-content:space-between;align-items:baseline;gap:32px;padding:36px 0 34px;border-bottom:1px solid rgba(238,237,231,.16)}}
.nom{{font:400 44px/1.1 'Bodoni Moda',serif;white-space:nowrap}}
.prix{{flex:none;font:300 42px/1 'DM Mono',monospace;letter-spacing:.02em}}
footer{{margin-top:auto;text-align:center;font:400 26px/1 'DM Mono',monospace;letter-spacing:.06em;color:#8E9592}}
</style></head><body><main>
  <div class="logo">{logo}</div>
  <h1>{titre}<i>.</i></h1>
  <p class="ttc">Prix TTC</p>
  <ul>{lignes}</ul>
  <footer>{D["entreprise"]["site"]}</footer>
</main></body></html>"""


STORIES = [("tarifs", "Tarifs", D["prestations"]), ("options", "Options", D["supplements"])]

if __name__ == "__main__":
    jobs, temp = [], []
    for nom, titre, elements in STORIES:
        html = SORTIE / f"_story-{nom}.html"
        html.write_text(page(titre, elements))
        temp.append(html)
        jobs.append({"in": str(html), "out": str(SORTIE / f"story-instagram-{nom}.png"), "w": SW, "h": SH})
    jf = SORTIE / "_jobs.json"
    jf.write_text(json.dumps(jobs))
    try:
        subprocess.run(["node", str(BASE / "_source" / "render.mjs"), str(jf)], check=True, stdout=subprocess.DEVNULL)
    finally:
        for f in temp + [jf]:
            f.unlink()
    for nom, titre, elements in STORIES:
        print(f"story {nom} :", ", ".join(f"{x['nom']} {prix(x)}" for x in elements))
