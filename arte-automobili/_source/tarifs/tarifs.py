"""Grille tarifaire A4 (PDF) Arte Automobili : version écran (Nero) et version impression (claire).

Prix particuliers TTC relevés sur le site ; prix professionnels hors TVA = TTC / 1,21 (TVA belge 21 %),
arrondis au centime. Sortie : 17_tarifs/*.html et *.pdf.
"""
import re
import subprocess
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]  # dossier arte-automobili
SORTIE = BASE / "17_tarifs"
ASSETS = BASE / "14_theme-shopify-premium" / "theme" / "assets"
TVA = Decimal("1.21")

PRESTATIONS = [  # libellé, nom, durée, prix TTC, mise en avant
    ("Intérieur", "Lavage intérieur", "1 h", 45, False),
    ("Extérieur", "Lavage extérieur", "45 min", 40, False),
    ("Formule complète", "Lavage intérieur <i>+</i> extérieur", "1 h 45", 75, False),
    ("Formule premium", "Pack <i>ARTE</i>", "3 h", 135, True),
]
PRO = "Solutions de nettoyage automobile adaptées aux besoins des professionnels et des flottes de véhicules."


def euros(v):
    v = Decimal(v)
    if v == v.to_integral_value():
        return f"{int(v)} €"
    return f"{v.quantize(Decimal('0.01'), ROUND_HALF_UP)}".replace(".", ",") + " €"


def htva(ttc):
    return (Decimal(ttc) / TVA).quantize(Decimal("0.01"), ROUND_HALF_UP)


def svg(nom, hauteur, couleur=None):
    s = (ASSETS / nom).read_text()
    s = re.sub(r"<title>.*?</title>", "", s)
    s = re.sub(r'\swidth="[^"]+"\s+height="[^"]+"', f' height="{hauteur}"', s, count=1)
    if couleur:
        s = s.replace("#EEEDE7", couleur)
    return s


def page(clair=False):
    fond, texte, ligne = ("#FFFFFF", "#0D0F0E", "#D6D3CA") if clair else ("#0D0F0E", "#EEEDE7", "rgba(142,149,146,.45)")
    second = "#5E6461" if clair else "#8E9592"
    logo = svg("logo-principal-nero.svg" if clair else "logo-principal-bianco.svg", 40)
    mono = svg("monogramme-bianco.svg", 300, "#0D0F0E" if clair else None)
    lignes = ""
    for i, (lib, nom, duree, ttc, avant) in enumerate(PRESTATIONS, 1):
        lignes += f"""
      <tr class="{'avant' if avant else ''}">
        <td class="presta"><span class="eyebrow">{lib}</span><span class="nom">{nom}</span></td>
        <td class="mono duree">{duree}</td>
        <td class="mono prix">{euros(ttc)}</td>
        <td class="mono prix pro">{euros(htva(ttc))}</td>
      </tr>"""
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Tarifs — Arte Automobili</title>
<style>
@font-face{{font-family:'Bodoni Moda';src:url('../03_typographie/polices/BodoniModa%5Bopsz,wght%5D.ttf') format('truetype');font-weight:400 900;font-style:normal}}
@font-face{{font-family:'Bodoni Moda';src:url('../03_typographie/polices/BodoniModa-Italic%5Bopsz,wght%5D.ttf') format('truetype');font-weight:400 900;font-style:italic}}
@font-face{{font-family:'Archivo';src:url('../03_typographie/polices/Archivo%5Bwdth,wght%5D.ttf') format('truetype');font-weight:100 900;font-stretch:62% 125%}}
@font-face{{font-family:'DM Mono';src:url('../03_typographie/polices/DMMono-Light.ttf') format('truetype');font-weight:300}}
@font-face{{font-family:'DM Mono';src:url('../03_typographie/polices/DMMono-Regular.ttf') format('truetype');font-weight:400}}
@font-face{{font-family:'DM Mono';src:url('../03_typographie/polices/DMMono-Medium.ttf') format('truetype');font-weight:500}}
@page{{size:A4;margin:0}}
*{{box-sizing:border-box}}
html,body{{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
body{{font-family:Archivo,Arial,sans-serif;color:{texte}}}
.page{{position:relative;width:210mm;height:297mm;overflow:hidden;background:{fond};padding:16mm 18mm 14mm}}
.eyebrow{{display:block;font:600 6.8pt/1.3 Archivo,sans-serif;font-stretch:125%;letter-spacing:.22em;text-transform:uppercase;color:{second}}}
.mono{{font-family:'DM Mono',monospace;letter-spacing:.03em;font-variant-numeric:tabular-nums}}
.filigrane{{position:absolute;right:-30mm;bottom:-46mm;width:118mm;opacity:{'.04' if clair else '.045'};pointer-events:none}}
.filigrane svg{{width:100%;height:auto}}
header{{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:6mm;border-bottom:.6pt solid {texte}}}
header .ed{{text-align:right}}
header .ed .mono{{display:block;margin-top:1.6mm;font-size:8pt}}
.intro{{margin:10mm 0 8mm}}
h1{{margin:3mm 0 5mm;font:400 34pt/1.02 'Bodoni Moda',Didot,serif}}
h1 i,.nom i{{font-style:italic}}
.lead{{max-width:132mm;margin:0;font-size:10pt;line-height:1.6;opacity:.86}}
table{{width:100%;border-collapse:collapse}}
thead th{{padding:0 0 3.4mm 4mm;text-align:right;vertical-align:bottom;border-bottom:.6pt solid {texte}}}
thead th:first-child{{text-align:left;padding-left:0}}
thead th .eyebrow{{color:{texte}}}
thead th small{{display:block;margin-top:1.2mm;font:400 6.6pt/1.3 'DM Mono',monospace;letter-spacing:.06em;color:{second};text-transform:uppercase}}
tbody td{{padding:5.4mm 0;border-bottom:.5pt solid {ligne};vertical-align:middle}}
td.presta .eyebrow{{margin-bottom:1.8mm}}
td.presta .nom{{font:400 17pt/1.15 'Bodoni Moda',serif}}
td.duree{{width:18mm;text-align:right;font-size:9pt;color:{second}}}
td.prix{{width:34mm;text-align:right;font-size:14pt;font-weight:300}}
td.pro{{width:40mm}}
tr.avant td{{background:#1F3D35;color:#EEEDE7;border-bottom:0}}
tr.avant td:first-child{{padding-left:5mm}} tr.avant td:last-child{{padding-right:5mm}}
tr.avant .eyebrow,tr.avant td.duree{{color:rgba(238,237,231,.72)}}
.pro-bloc{{display:flex;justify-content:space-between;align-items:center;gap:10mm;margin-top:7mm;padding:5.5mm 6mm;border:.6pt solid {ligne}}}
.pro-bloc h2{{margin:1.6mm 0 1.8mm;font:400 15pt/1.2 'Bodoni Moda',serif}}
.pro-bloc p{{margin:0;max-width:105mm;font-size:8.6pt;line-height:1.55;opacity:.84}}
.pro-bloc .devis{{flex:none;text-align:right}}
.pro-bloc .devis .mono{{display:block;font-size:14pt;font-weight:300}}
.notes{{margin:7mm 0 0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:2.6mm 10mm;font:400 7.4pt/1.5 'DM Mono',monospace;color:{second}}}
.notes li{{padding-left:3.4mm;position:relative}}
.notes li::before{{content:"";position:absolute;left:0;top:.62em;width:1.6mm;border-top:.6pt solid currentColor}}
footer{{position:absolute;left:18mm;right:18mm;bottom:14mm;display:flex;justify-content:space-between;align-items:flex-end;padding-top:5mm;border-top:.6pt solid {ligne}}}
footer .sig{{font:italic 400 13pt/1 'Bodoni Moda',serif}}
footer .mono{{font-size:7pt;color:{second};letter-spacing:.08em;text-transform:uppercase}}
</style></head><body>
<section class="page">
  <div class="filigrane" aria-hidden="true">{mono}</div>
  <header>
    <div>{logo}</div>
    <div class="ed"><span class="eyebrow">Grille tarifaire</span><span class="mono">Octobre 2026</span></div>
  </header>
  <div class="intro">
    <span class="eyebrow">Particuliers et professionnels</span>
    <h1>Tarifs des <i>prestations</i>.</h1>
    <p class="lead">Lavage intérieur, extérieur ou complet, sur rendez-vous. Particuliers&nbsp;: prix TVA comprise. Professionnels&nbsp;: prix hors TVA.</p>
  </div>
  <table>
    <thead><tr>
      <th><span class="eyebrow">Prestation</span></th>
      <th><span class="eyebrow">Durée</span></th>
      <th><span class="eyebrow">Particuliers</span><small>TVAC</small></th>
      <th><span class="eyebrow">Professionnels</span><small>HTVA</small></th>
    </tr></thead>
    <tbody>{lignes}
    </tbody>
  </table>
  <div class="pro-bloc">
    <div><span class="eyebrow">Professionnels et flottes</span><h2>Services pour les <i>professionnels</i></h2><p>{PRO}</p></div>
    <div class="devis"><span class="mono">Sur devis</span><span class="eyebrow">Après inspection</span></div>
  </div>
  <ul class="notes">
    <li>Particuliers&nbsp;: prix TVA comprise (TVA belge de 21&nbsp;%).</li>
    <li>Professionnels&nbsp;: prix hors TVA, TVA de 21&nbsp;% en sus, facture au nom de l'entreprise.</li>
    <li>Sur rendez-vous, paiement sur place.</li>
    <li>Durées indicatives, selon le gabarit et l'état du véhicule.</li>
  </ul>
  <footer>
    <span class="sig">L'arte del riflesso.</span>
    <span class="mono">Arte Automobili · Detailing automobile</span>
  </footer>
</section>
</body></html>"""


if __name__ == "__main__":
    SORTIE.mkdir(parents=True, exist_ok=True)
    for nom, clair in (("tarifs-arte-automobili", False), ("tarifs-arte-automobili-impression", True)):
        (SORTIE / f"{nom}.html").write_text(page(clair))
    print("Prix professionnels HTVA :", ", ".join(f"{n.replace('<i>', '').replace('</i>', '')} {euros(t)} → {euros(htva(t))}" for _, n, _, t, _ in PRESTATIONS))
