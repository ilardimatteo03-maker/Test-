"""Stories Instagram du programme partenaires (affiliation réservée aux professionnels), 1080 × 1920 px.

Quatre stories qui se suivent, dans le style de la série tarifs : fond Nero, titres et textes en Archivo (la police
lisible de la marque, celle du « AUTOMOBILI » du logo), chiffres en DM Mono.
Taux et base de commission, coordonnées et site viennent de _source/documents/donnees.json. Le contenu reste hors
des zones couvertes par l'interface d'Instagram (250 px en haut, 340 px en bas).
Sorties : 20_programme-partenaires/story-partenaires-<n>-<nom>.png
"""
import json
import re
import subprocess
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]  # dossier arte-automobili
SORTIE = BASE / "20_programme-partenaires"
D = json.loads((BASE / "_source" / "documents" / "donnees.json").read_text())
X, A = D["entreprise"], D["affiliation"]
LOGO = BASE / "14_theme-shopify-premium" / "theme" / "assets" / "logo-principal-bianco.svg"
SW, SH, HAUT, BAS = 1080, 1920, 250, 340
PCT = f"{A['commission_pct']:g}"


def page(corps, pied=True):
    logo = re.sub(r"<title>.*?</title>", "", LOGO.read_text())
    logo = re.sub(r'\swidth="[^"]+"\s+height="[^"]+"', ' width="300"', logo, count=1)
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
.contenu{{margin:auto 0}}
.eyebrow{{font:600 19px/1 Archivo,sans-serif;font-stretch:125%;letter-spacing:.24em;text-transform:uppercase;color:#8E9592;margin-bottom:40px}}
h1{{font:500 108px/1.05 Archivo,sans-serif;font-stretch:112%;letter-spacing:-.015em}}
h1 i,.chiffre i{{font-style:normal}}
.texte{{margin-top:44px;font:400 44px/1.36 Archivo,sans-serif}}
.texte strong{{font-weight:600}}
.insecable{{white-space:nowrap}}
.chiffre{{font:500 {400 if len(PCT) < 2 else 350}px/.92 Archivo,sans-serif;font-stretch:112%;letter-spacing:-.03em;margin-left:-14px}}
.exemple{{margin-top:56px;padding-top:30px;border-top:1.5px solid #EEEDE7;display:flex;justify-content:space-between;
         font:300 34px/1 'DM Mono',monospace;letter-spacing:.02em}}
.exemple span:first-child{{color:#8E9592}}
ol{{list-style:none;margin-top:48px;border-top:1.5px solid #EEEDE7}}
li{{display:flex;gap:44px;align-items:baseline;padding:40px 0 38px;border-bottom:1px solid rgba(238,237,231,.16)}}
li .n{{flex:none;font:300 34px/1 'DM Mono',monospace;color:#8E9592}}
li .t{{font:400 44px/1.3 Archivo,sans-serif}}
.contact{{margin-top:56px;border-top:1.5px solid #EEEDE7}}
.contact p{{padding:34px 0 32px;border-bottom:1px solid rgba(238,237,231,.16);font:300 40px/1 'DM Mono',monospace;letter-spacing:.02em}}
footer{{text-align:center;font:400 26px/1 'DM Mono',monospace;letter-spacing:.06em;color:#8E9592}}
</style></head><body><main>
  <div class="logo">{logo}</div>
  <div class="contenu">{corps}</div>
  {f'<footer>{X["site"]}</footer>' if pied else ''}
</main></body></html>"""


STORIES = [
    ("1-couverture", page(f"""
    <p class="eyebrow">{A['nom']}</p>
    <h1>Recommandez<i>.</i><br>Gagnez<i>.</i></h1>
    <p class="texte">Le programme d'affiliation réservé aux professionnels.</p>""")),
    ("2-commission", page(f"""
    <p class="eyebrow">Votre commission</p>
    <p class="chiffre">{PCT}<i>&#8239;%</i></p>
    <p class="texte">sur le chiffre d'affaires hors&nbsp;TVA des clients que vous nous apportez. <strong>Réglée {A['versement']}.</strong></p>
    <p class="exemple"><span>Exemple</span><span>1&#8239;000&nbsp;€ HTVA → {10 * A['commission_pct']:g}&nbsp;€</span></p>""")),
    ("3-fonctionnement", page(f"""
    <p class="eyebrow">Comment ça marche</p>
    <h1>En quatre temps<i>.</i></h1>
    <ol>
      <li><span class="n">01</span><span class="t">Vous vous inscrivez au programme.</span></li>
      <li><span class="n">02</span><span class="t">Vous nous recommandez à un client.</span></li>
      <li><span class="n">03</span><span class="t">Nous réalisons la prestation.</span></li>
      <li><span class="n">04</span><span class="t">Vous touchez {PCT}&nbsp;% du montant hors&nbsp;TVA, {A['versement']}.</span></li>
    </ol>""")),
    ("4-contact", page(f"""
    <p class="eyebrow">Réservé aux professionnels</p>
    <h1>Devenez<br>partenaire<i>.</i></h1>
    <p class="texte"><strong>Inscription obligatoire avant toute recommandation.</strong> Pour vous inscrire ou pour plus d'informations, contactez-nous par <span class="insecable">e-mail</span> ou par téléphone.</p>
    <div class="contact"><p>{X['email']}</p><p>{X['telephone']}</p></div>""")),
]

if __name__ == "__main__":
    SORTIE.mkdir(exist_ok=True)
    jobs, temp = [], []
    for nom, contenu in STORIES:
        html = SORTIE / f"_story-{nom}.html"
        html.write_text(contenu)
        temp.append(html)
        jobs.append({"in": str(html), "out": str(SORTIE / f"story-partenaires-{nom}.png"), "w": SW, "h": SH})
    jf = SORTIE / "_jobs.json"
    jf.write_text(json.dumps(jobs))
    try:
        subprocess.run(["node", str(BASE / "_source" / "render.mjs"), str(jf)], check=True, stdout=subprocess.DEVNULL)
    finally:
        for f in temp + [jf]:
            f.unlink()
    print("stories partenaires :", ", ".join(n for n, _ in STORIES))
