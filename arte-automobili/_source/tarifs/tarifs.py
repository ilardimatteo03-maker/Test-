"""Grille tarifaire A4 (PDF) Arte Automobili : version blanche, minimale.

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


def page():
    """Version unique, blanche et minimale : logo, titre, prestations, deux colonnes de prix."""
    logo = svg("logo-principal-nero.svg", 38)
    lignes = "".join(f"""
      <tr><td class="nom">{nom}</td><td class="prix">{euros(ttc)}</td><td class="prix">{euros(htva(ttc))}</td></tr>"""
                     for _, nom, _, ttc, _ in PRESTATIONS)
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Tarifs — Arte Automobili</title>
<style>
@font-face{{font-family:'Bodoni Moda';src:url('../03_typographie/polices/BodoniModa%5Bopsz,wght%5D.ttf') format('truetype');font-weight:400 900;font-style:normal}}
@font-face{{font-family:'Bodoni Moda';src:url('../03_typographie/polices/BodoniModa-Italic%5Bopsz,wght%5D.ttf') format('truetype');font-weight:400 900;font-style:italic}}
@font-face{{font-family:'Archivo';src:url('../03_typographie/polices/Archivo%5Bwdth,wght%5D.ttf') format('truetype');font-weight:100 900;font-stretch:62% 125%}}
@font-face{{font-family:'DM Mono';src:url('../03_typographie/polices/DMMono-Light.ttf') format('truetype');font-weight:300}}
@font-face{{font-family:'DM Mono';src:url('../03_typographie/polices/DMMono-Regular.ttf') format('truetype');font-weight:400}}
@page{{size:A4;margin:0}}
*{{box-sizing:border-box}}
html,body{{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
body{{font-family:Archivo,Arial,sans-serif;color:#0D0F0E}}
.page{{position:relative;width:210mm;height:297mm;overflow:hidden;background:#fff;padding:20mm 22mm}}
h1{{margin:58mm 0 16mm;font:400 44pt/1 'Bodoni Moda',Didot,serif}}
h1 i,.nom i{{font-style:italic}}
table{{width:100%;border-collapse:collapse}}
th{{padding:0 0 4mm;text-align:right;font:600 6.8pt/1.4 Archivo,sans-serif;font-stretch:125%;letter-spacing:.22em;text-transform:uppercase;border-bottom:.6pt solid #0D0F0E}}
th small{{display:block;font:400 6.6pt/1.4 'DM Mono',monospace;letter-spacing:.06em;color:#5E6461}}
td{{padding:6.5mm 0;border-bottom:.5pt solid #D6D3CA;vertical-align:baseline}}
td.nom{{font:400 17pt/1.2 'Bodoni Moda',serif}}
td.prix{{width:42mm;text-align:right;font:300 14pt/1 'DM Mono',monospace;font-variant-numeric:tabular-nums;letter-spacing:.02em}}
.devis{{display:flex;justify-content:space-between;align-items:baseline;margin-top:10mm;font-size:9pt;color:#5E6461}}
.devis .mono{{font:400 9pt/1 'DM Mono',monospace;letter-spacing:.04em;color:#0D0F0E}}
</style></head><body>
<section class="page">
  {logo}
  <h1>Tarifs<i>.</i></h1>
  <table>
    <thead><tr><th></th><th>Particuliers<small>TVAC</small></th><th>Professionnels<small>HTVA</small></th></tr></thead>
    <tbody>{lignes}
    </tbody>
  </table>
  <p class="devis"><span>Flottes et services professionnels</span><span class="mono">Sur devis</span></p>
</section>
</body></html>"""


if __name__ == "__main__":
    SORTIE.mkdir(parents=True, exist_ok=True)
    (SORTIE / "tarifs-arte-automobili.html").write_text(page())
    print("Prix professionnels HTVA :", ", ".join(f"{n.replace('<i>', '').replace('</i>', '')} {euros(t)} → {euros(htva(t))}" for _, n, _, t, _ in PRESTATIONS))
