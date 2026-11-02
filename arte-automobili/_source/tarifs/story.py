"""Story Instagram « Tarifs » (1080 × 1920 px), version minimale sur fond Nero, comme le site.

Les prestations et les prix TTC viennent de _source/documents/donnees.json. Le contenu reste hors des zones
couvertes par l'interface d'Instagram (250 px en haut, 340 px en bas). Sortie : 17_tarifs/story-instagram-tarifs.png
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


def page():
    logo = re.sub(r"<title>.*?</title>", "", LOGO.read_text())
    logo = re.sub(r'\swidth="[^"]+"\s+height="[^"]+"', ' width="300"', logo, count=1)
    lignes = "".join(f'<li><span class="nom">{x["nom"]}</span><span class="prix">{prix(x)}</span></li>'
                     for x in D["prestations"])
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
h1{{margin:auto 0 28px;font:400 136px/1 'Bodoni Moda',Didot,serif}}
h1 i{{font-style:italic}}
.ttc{{display:flex;justify-content:flex-end;padding-bottom:22px;border-bottom:1.5px solid #EEEDE7;
      font:600 19px/1 Archivo,sans-serif;font-stretch:125%;letter-spacing:.24em;text-transform:uppercase;color:#8E9592}}
ul{{list-style:none}}
li{{display:flex;justify-content:space-between;align-items:baseline;gap:32px;padding:40px 0 38px;border-bottom:1px solid rgba(238,237,231,.16)}}
.nom{{font:400 50px/1.1 'Bodoni Moda',serif}}
.prix{{flex:none;font:300 42px/1 'DM Mono',monospace;letter-spacing:.02em}}
footer{{margin-top:auto;text-align:center;font:400 26px/1 'DM Mono',monospace;letter-spacing:.06em;color:#8E9592}}
</style></head><body><main>
  <div class="logo">{logo}</div>
  <h1>Tarifs<i>.</i></h1>
  <p class="ttc">Prix TTC</p>
  <ul>{lignes}</ul>
  <footer>{D["entreprise"]["site"]}</footer>
</main></body></html>"""


if __name__ == "__main__":
    html = SORTIE / "_story.html"
    html.write_text(page())
    jobs = SORTIE / "_jobs.json"
    jobs.write_text(json.dumps([{"in": str(html), "out": str(SORTIE / "story-instagram-tarifs.png"), "w": SW, "h": SH}]))
    try:
        subprocess.run(["node", str(BASE / "_source" / "render.mjs"), str(jobs)], check=True, stdout=subprocess.DEVNULL)
    finally:
        html.unlink()
        jobs.unlink()
    print("story ok :", ", ".join(f"{x['nom']} {prix(x)}" for x in D["prestations"]))
