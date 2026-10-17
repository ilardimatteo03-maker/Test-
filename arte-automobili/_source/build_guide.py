"""Guide de marque Arte Automobili — « Il Libro dell'Arte ».
Une seule source HTML : lecture écran (responsive) et PDF 16:9 (1600 × 900 px par page).
Usage : python3 _source/build_guide.py [--artifact]"""
import json
import subprocess
import sys
from html import escape
from pathlib import Path

import logo
from guide_parts import (ASSETS, GUIDE, alignment_svg, clearspace_svg, construction_svg, grid_svg, icon_inline, palette,
                         positioning_svg, prepare_assets, reflet_svg, sitemap_svg)
from kit import A, B, G, GOOGLE_FONTS, N, ROOT, TR, V, font_css, logo_svg
from textes import (AVIS, BIO_INSTAGRAM, LANCEMENT, METHODE, PITCH_COURT, PITCH_LONG, PRESTATIONS, SIGNATURE,
                    SIGNATURE_NOTE, SLOGANS, TITRES, TON, VOCABULAIRE)

ARTIFACT = "--artifact" in sys.argv
VERSION = "1.0 · octobre 2026"

CSS = """
/* Livre 16:9 : pages de 1600 × 900 px à l'impression ; flux continu et responsive à l'écran.
   Couleurs et voix typographiques = celles de la marque (le guide applique ce qu'il décrit). */
:root{--nero:#0D0F0E;--bianco:#EEEDE7;--verde:#1F3D35;--verdaccio:#262B29;--argento:#8E9592;--travertino:#D6D3CA;
--serif:'Bodoni Moda',Didot,'Times New Roman',serif;--sans:Archivo,'Helvetica Neue',Arial,sans-serif;--mono:'DM Mono',ui-monospace,Menlo,monospace;color-scheme:dark}
*{box-sizing:border-box}
html{background:var(--nero)}
body{margin:0;background:var(--nero);color:var(--nero);font:400 16px/1.6 var(--sans);-webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact}
img{max-width:100%;display:block}
.page{position:relative;background:var(--bianco);color:var(--nero);max-width:1600px;margin:0 auto;padding-block:clamp(56px,7vw,96px);padding-left:max(clamp(20px,6vw,96px),env(safe-area-inset-left,0px));padding-right:max(clamp(20px,6vw,96px),env(safe-area-inset-right,0px));overflow:hidden}
.page+.page{border-top:1px solid rgba(142,149,146,.25)}
.dark{background:var(--nero);color:var(--bianco)}
.verde{background:var(--verde);color:var(--bianco)}
.gris{background:var(--verdaccio);color:var(--bianco)}
.run{display:flex;justify-content:space-between;gap:16px;font:600 11px/1 var(--sans);font-stretch:125%;letter-spacing:.22em;text-transform:uppercase;color:var(--argento);margin-bottom:40px}
.run .pn{font-family:var(--mono);font-weight:400;letter-spacing:.06em}
.foot{display:none}
h1,h2,h3,h4{font-family:var(--serif);font-weight:400;margin:0;text-wrap:balance}
h1{font-size:clamp(48px,7vw,112px);line-height:1}
h2{font-size:clamp(34px,3.6vw,54px);line-height:1.06;margin-bottom:24px}
h3{font-size:clamp(22px,1.8vw,28px);line-height:1.15;margin-bottom:10px}
h4{font:600 12px/1.3 var(--sans);font-stretch:125%;letter-spacing:.2em;text-transform:uppercase;color:var(--argento);margin:0 0 8px}
i,em{font-style:italic}
h1 i,h2 i,h3 i{font-family:var(--serif)}
p{margin:0 0 12px;max-width:68ch}
.lead{font-size:clamp(17px,1.35vw,20px);line-height:1.55}
.small{font-size:13.5px;line-height:1.5}
.mono{font-family:var(--mono);letter-spacing:.03em}
.label{font:600 11.5px/1.3 var(--sans);font-stretch:125%;letter-spacing:.22em;text-transform:uppercase;color:var(--argento)}
.muted{opacity:.72}
.g{display:grid;gap:clamp(20px,2.6vw,40px)}
.g2{grid-template-columns:repeat(2,minmax(0,1fr))}.g3{grid-template-columns:repeat(3,minmax(0,1fr))}
.g4{grid-template-columns:repeat(4,minmax(0,1fr))}.g5{grid-template-columns:repeat(5,minmax(0,1fr))}.g6{grid-template-columns:repeat(6,minmax(0,1fr))}
.g-7-5{grid-template-columns:minmax(0,7fr) minmax(0,5fr)}.g-5-7{grid-template-columns:minmax(0,5fr) minmax(0,7fr)}.g-4-8{grid-template-columns:minmax(0,4fr) minmax(0,8fr)}.g-8-4{grid-template-columns:minmax(0,8fr) minmax(0,4fr)}
.ac{align-items:center}.ae{align-items:end}
.rule{border:0;border-top:1px solid currentColor;opacity:.35;margin:20px 0}
.linea{border-top:1px solid var(--argento)}
.dia{width:100%;height:auto;display:block}
.fig{margin:0}.fig img{width:100%;height:auto}
.fig figcaption{font:400 12px/1.4 var(--mono);color:var(--argento);margin-top:10px;letter-spacing:.03em}
ul.l{list-style:none;padding:0;margin:0}ul.l li{padding:8px 0;border-top:1px solid rgba(142,149,146,.35);font-size:15px;line-height:1.45}
ul.l li:last-child{border-bottom:1px solid rgba(142,149,146,.35)}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font:600 10.5px/1.2 var(--sans);font-stretch:125%;letter-spacing:.18em;text-transform:uppercase;color:var(--argento);padding:0 10px 10px 0;border-bottom:1px solid currentColor}
td{padding:9px 10px 9px 0;border-bottom:1px solid rgba(142,149,146,.35);vertical-align:top;line-height:1.4}
td.m{font-family:var(--mono);font-size:13px;white-space:nowrap}
.tw{overflow-x:auto;max-width:100%}
.tile{display:flex;flex-direction:column;justify-content:space-between;padding:22px;min-height:200px}
.tile .lg{flex:1;display:grid;place-items:center;padding:16px 0}
.tile .lg svg{max-width:100%;height:auto}
.tile .cap{font:400 11.5px/1.4 var(--mono);letter-spacing:.03em}
.sw{display:flex;flex-direction:column;justify-content:space-between;padding:26px;min-height:340px}
.sw .nm{font:400 34px/1.05 var(--serif)}
.sw dl{display:grid;grid-template-columns:70px 1fr;gap:4px 10px;margin:0;font:400 12.5px/1.45 var(--mono)}
.sw dt{opacity:.65}.sw dd{margin:0}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:currentColor;margin-right:4px;opacity:.2}.dot.on{opacity:1}
.ok,.ko{font:600 11px/1 var(--sans);font-stretch:125%;letter-spacing:.18em;text-transform:uppercase}
.ok{color:#2e6b55}.ko{color:#a3392f}.dark .ok,.verde .ok{color:#9cc5b2}.dark .ko{color:#e08a7f}
.no{position:relative;background:#E4E1D9;padding:18px;min-height:190px;display:flex;flex-direction:column}
.no .lg{flex:1;display:grid;place-items:center;overflow:hidden;padding:10px}
.no .x{position:absolute;top:12px;right:14px;color:#a3392f;font:400 22px/1 var(--mono)}
.no .cap{font:400 12px/1.4 var(--mono);margin-top:8px}
.thumbs{display:grid;gap:14px}
.thumbs img{width:100%;height:auto}
.phone{width:min(330px,100%);margin:0 auto;border:10px solid #050606;border-radius:44px;background:var(--nero);color:var(--bianco);padding:22px 12px 16px;box-shadow:0 30px 60px rgba(0,0,0,.35)}
.phone .ph-h{display:flex;gap:14px;align-items:center;padding:0 6px 12px}
.phone .ph-h img{width:64px;height:64px;border-radius:50%}
.phone .ph-h b{font:600 14px var(--sans);display:block}
.phone .ph-bio{font:400 11.5px/1.45 var(--sans);white-space:pre-line;padding:0 6px 12px;opacity:.9}
.phone .ph-hl{display:flex;gap:10px;padding:0 6px 12px}
.phone .ph-hl img{width:44px;height:44px;border-radius:50%;object-fit:cover;border:1px solid #333}
.phone .ph-g{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.phone .ph-g img{width:100%;aspect-ratio:3/4;object-fit:cover}
.tree{font:400 13px/1.62 var(--mono);white-space:pre;margin:0;overflow-x:auto}
.bigq{font:italic 400 clamp(30px,3.2vw,48px)/1.2 var(--serif)}
.chap .num{font:300 clamp(80px,12vw,180px)/.9 var(--mono);color:var(--argento);letter-spacing:-.02em}
.chap h1{margin:24px 0 0}
.chap .intro{max-width:56ch;margin-top:28px}
.stripes{height:56px;background:repeating-linear-gradient(180deg,currentColor 0 6px,transparent 6px 10px,currentColor 10px 14px,transparent 14px 20px,currentColor 20px 22px,transparent 22px 30px)}
@media (max-width:900px){
  .g2,.g3,.g4,.g5,.g6,.g-7-5,.g-5-7,.g-4-8,.g-8-4{grid-template-columns:minmax(0,1fr)}
  .g4.keep,.g5.keep,.g6.keep,.g3.keep{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sw{min-height:260px}
  .toc{columns:1!important}
  .tw table{min-width:640px}
}
@media print{
  @page{size:1600px 900px;margin:0}
  html,body{background:none}
  .page{width:1600px;height:900px;max-width:none;margin:0;padding:84px 96px 72px;break-after:page;border:0!important}
  .run{position:absolute;top:40px;left:96px;right:96px;margin:0}
  .foot{display:flex;position:absolute;bottom:30px;left:96px;right:96px;justify-content:space-between;align-items:center;font:400 10.5px/1 var(--mono);color:var(--argento);letter-spacing:.04em}
  .foot svg{height:16px;width:auto}
  .page{display:flex;flex-direction:column;justify-content:center}
  h1{font-size:112px}h2{font-size:58px}h3{font-size:29px}.lead{font-size:22px}
  p{font-size:18px}.small{font-size:15.5px}h4{font-size:12.5px}.label{font-size:12.5px}
  table{font-size:16px}td.m{font-size:14.5px}ul.l li{font-size:17px}
  .tile .cap,.no .cap{font-size:13px}.sw dl{font-size:13.5px}.fig figcaption{font-size:13px}
  .chap .num{font-size:180px}
  .phone{width:290px;padding:16px 10px 12px;border-width:8px}.phone .ph-g img{aspect-ratio:4/5}.phone .ph-bio{font-size:10.5px}
}
"""


class Book:
    def __init__(self):
        self.pages = []
        self.chapters = []

    def add(self, html, theme="", run="", cls=""):
        self.pages.append((html, theme, run, cls))

    def chapter(self, num, title, intro, theme="dark"):
        self.chapters.append((num, title, len(self.pages) + 1))
        self.add(f"""<div class="chap g g-5-7 ae" style="min-height:min(640px,60vh)">
          <div><div class="num">{num}</div></div>
          <div><h1>{title}</h1><p class="lead intro muted">{intro}</p></div></div>""", theme, f"{num} — {strip(title)}", "chapter")

    def render(self, fonts_block):
        out = []
        for i, (html, theme, run, cls) in enumerate(self.pages, 1):
            fill = B if theme in ("dark", "verde", "gris") else N
            runbar = f'<div class="run"><span>{run}</span><span class="pn">{i:02d}</span></div>' if run else ""
            foot = (f'<div class="foot"><span>Arte Automobili — Il Libro dell\'Arte · guide de marque {VERSION}</span>'
                    f'{logo_svg("monogramme-micro", fill, height=16)}</div>') if i > 1 else ""
            out.append(f'<section class="page {theme} {cls}" id="p{i}">{runbar}{html}{foot}</section>')
        head = f"""<title>Guide Arte Automobili</title>
<meta name="claude:viewport-fit-sides" content="cover">
{fonts_block}
<style>{CSS}</style>"""
        return head, "".join(out)


def strip(s):
    import re
    return re.sub(r"<[^>]+>", "", s)


def ls(key, fill=N, h=None, w=None):
    return logo_svg(key, fill, height=h, width=w)


def img(src, alt, cap=None, style=""):
    c = f"<figcaption>{cap}</figcaption>" if cap else ""
    return f'<figure class="fig"><img src="assets/{src}" alt="{escape(alt)}" style="{style}">{c}</figure>'


def dots(n, total=5):
    return "".join(f'<span class="dot{" on" if i < n else ""}"></span>' for i in range(total))


def build():
    pal = palette()
    C = {c["id"]: c for c in pal["couleurs"]}
    bk = Book()

    # ------------------------------------------------------------ couverture
    bk.add(f"""<div style="position:relative;min-height:min(732px,80vh)">
      <div class="g g-5-7" style="align-items:end;min-height:inherit">
        <div style="display:flex;align-items:flex-end;justify-content:center">{ls("monogramme", B, h=430)}</div>
        <div style="padding-bottom:40px"><p class="label">Arte Automobili</p>
          <h1 style="margin:18px 0 22px">Il Libro <i>dell'Arte</i></h1>
          <p class="lead muted">Guide d'identité visuelle — stratégie, logo, couleurs, typographie, univers graphique, photographie, réseaux sociaux, supports et ton de voix.</p>
          <p class="mono small" style="color:{A};margin-top:28px">VERSION {VERSION.upper()}</p></div>
      </div></div>""", "dark")

    # sommaire (rempli plus bas)
    bk.add("__TOC__", "", "Sommaire")

    bk.add(f"""<div class="g g-7-5">
      <div><h2>Pourquoi <i>« Il Libro dell'Arte »</i></h2>
      <p class="lead">Vers 1400, le peintre florentin Cennino Cennini écrit <i>Il Libro dell'Arte</i>, un manuel d'atelier : préparer une surface, broyer un pigment, poser un vernis, polir. En italien ancien, <i>arte</i> désigne d'abord un métier maîtrisé ; les corporations de Florence s'appelaient les <i>Arti</i>.</p>
      <p class="lead">Arte Automobili reprend ce sens. Le soin d'une carrosserie relève du même ordre de savoir : une surface, des produits, une lumière, une main. Ce guide est le manuel de la marque. Il fixe ce qui ne bouge pas, pour qu'elle reste reconnaissable dans dix ans comme demain.</p></div>
      <div><h4>Comment lire ce guide</h4><ul class="l">
        <li><b>Doit / ne doit pas</b> — règles impératives.</li>
        <li><b>Recommandé</b> — bonne pratique, adaptable avec discernement.</li>
        <li><b>En cas de doute</b>, la sobriété l'emporte : moins d'éléments, plus d'espace.</li>
        <li>Les fichiers cités se trouvent dans le dossier <span class="mono">arte-automobili/</span> (voir chapitre 14).</li>
        <li>Les visuels de voiture sont des <b>rendus 3D d'intention</b>, à remplacer par les photographies de l'atelier.</li></ul></div></div>""", "", "Préambule")

    # ------------------------------------------------------------ 01 analyse
    bk.chapter("01", "Analyse <i>du marché</i>", "Ce que montrent les acteurs du detailing, ce que cherche une clientèle exigeante, et la place libre entre les deux.")
    arche = [("Le garage tuning", "Néons, flammes, italiques agressives, rouge et noir.", "Puissance, vitesse.", "Confond soin et préparation ; repousse la clientèle exigeante."),
             ("Le car wash premium", "Bleu, gouttes, mousse, silhouettes de voiture.", "Propreté, rapidité.", "Parle de commodité ; ne justifie pas un tarif premium."),
             ("Le detailer « noir & or »", "Blasons, couronnes, lettres dorées, avant/après saturés.", "Luxe ostentatoire.", "Code saturé : sur Instagram, tous se ressemblent. Le doré fait bon marché."),
             ("Les codes constructeurs", "Écussons, animaux héraldiques, chrome.", "Appartenance à une marque.", "Confusion et risque juridique : un atelier ne fabrique pas de voitures.")]
    cols = "".join(f"""<div><h3>{n}</h3><h4 style="margin-top:16px">Codes</h4><p class="small">{c}</p><h4>Message</h4><p class="small">{m}</p>
      <h4>Limite</h4><p class="small">{l}</p></div>""" for n, c, m, l in arche)
    bk.add(f"""<h2>Quatre familles de codes, <i>aucune ne parle de méthode.</i></h2>
      <div class="g g4 keep" style="margin-top:28px">{cols}</div>
      <hr class="rule"><p class="lead"><b>Ce que recherche le client premium :</b> des preuves plutôt que des promesses, un interlocuteur qui explique, un délai et un prix tenus, du respect pour sa voiture, et quelqu'un qui s'en souvient à la visite suivante.</p>""", "", "01 — Analyse")
    bk.add(f"""<div class="g g-7-5 ac"><div>{positioning_svg()}</div>
      <div><h2>Un territoire <i>libre.</i></h2><p class="lead">Le detailing s'exprime presque entièrement dans le registre démonstratif. Le territoire retenu et culturel, celui des carrossiers italiens et des maisons de luxe, n'y est occupé par personne.</p>
      <p>Arte Automobili s'y installe, avec un atout que ces références n'ont pas : la précision technique d'un atelier moderne. Le positionnement tient en trois mots : <b>retenu, culturel, précis</b>.</p>
      <p class="small muted">Carte qualitative, établie à partir des codes visuels observés ; elle ne mesure pas des parts de marché.</p></div></div>""", "", "01 — Analyse")
    cl = [("Drapeau italien partout", "L'italianité passe par la typographie, les noms et la langue."), ("Flammes, éclairs, fumée", "L'énergie vient du rythme et de la Linea."),
          ("Couronnes, blasons, lauriers", "Le luxe se dit par l'espace et la retenue."), ("Ailes et écussons", "Le monogramme reste typographique, jamais héraldique."),
          ("Gouttes d'eau, bulles, mousse", "On montre le résultat (le reflet), pas le produit."), ("Or brillant, chrome 3D", "Aplats mats ; métal seulement en dorure argent sobre."),
          ("Silhouettes de voitures de course", "La voiture apparaît en photographie, jamais en pictogramme."), ("Avant/après sur-saturés", "Même lumière, même angle, aucun filtre."),
          ("Italiques « vitesse »", "Les capitales droites et espacées portent la sportivité.")]
    bk.add(f"""<h2>Ce que la marque <i>ne fera jamais.</i></h2><div class="g g3" style="margin-top:28px">
      {''.join(f'<div style="border-top:1px solid {A};padding-top:14px"><p style="font:400 22px/1.2 var(--serif);margin-bottom:8px">{a}</p><p class="small muted">{b}</p></div>' for a, b in cl)}</div>""", "dark", "01 — Analyse")

    # ------------------------------------------------------------ 02 stratégie
    bk.chapter("02", "Stratégie <i>de marque</i>", "La plateforme qui guide chaque décision : ce que fait Arte Automobili, pour qui, et ce qu'il promet.")
    bk.add(f"""<div class="g g-5-7">
      <div><h4>Mission</h4><p class="bigq" style="margin-bottom:28px">Rendre à chaque automobile le reflet que son designer avait imaginé.</p>
        <h4>Promesse</h4><p class="lead">Un protocole écrit, un résultat contrôlé sous lumière, une voiture à la fois.</p>
        <h4 style="margin-top:20px">Vision</h4><p>Devenir la référence du detailing d'auteur dans sa région, reconnue pour sa méthode autant que pour ses résultats.</p></div>
      <div><h4>Valeurs</h4><div class="g g2" style="margin-bottom:28px">
        <div><h3>Précision</h3><p class="small">On mesure avant d'agir : épaisseur de vernis, état de chaque panneau.</p></div>
        <div><h3>Patience</h3><p class="small">Le temps nécessaire, jamais moins. Une seule voiture à la fois.</p></div>
        <div><h3>Transparence</h3><p class="small">Devis détaillé, fiche de restitution, prix tenus.</p></div>
        <div><h3>Culture automobile</h3><p class="small">Respect du dessin, de l'histoire et de la mécanique de chaque modèle.</p></div></div>
        <h4>Personnalité</h4><p class="lead">Élégante · précise · passionnée · accessible · confiante · discrète</p></div></div>""", "", "02 — Stratégie")
    bk.add(f"""<div class="g g-7-5 ac"><div><p class="label">Territoire créatif</p><h2 style="margin-top:14px">Il Riflesso — <i>le reflet comme preuve.</i></h2>
      <p class="lead">Dans les studios de style, une carrosserie se juge à ses lignes de reflet : maquettes inspectées sous des rampes lumineuses, surfaces analysées en « zébrures » sur ordinateur. Quand la surface est juste, la lumière coule sans rupture. Quand le vernis est voilé de micro-rayures, la ligne se brise.</p>
      <p class="lead">Le detailer rend ces lignes à nouveau visibles. Arte Automobili fait de ce moment son territoire : le reflet, à la fois ce que le client voit en premier et la preuve d'un travail bien fait.</p></div>
      <div>{img("r-capot.jpg", "Capot sous les lames de lumière", "Lames de lumière sur un capot noir — rendu d'intention")}</div></div>""", "dark", "02 — Stratégie")
    forces = [("Luxe", "domine", 60, "Espace, retenue, noir profond, peu d'éléments, matières mates, prix assumés."),
              ("Italianité", "donne du caractère", 25, "Le lettrage didone, la Linea, les noms de couleurs tirés des pigments italiens, l'italien dans la signature, Bodoni en titrage."),
              ("Sportivité", "apporte l'énergie", 15, "Archivo Expanded en capitales espacées, le rythme des lames de lumière, les données en DM Mono, des cadrages tendus.")]
    bar = "".join(f'<div style="flex:{p};background:{c};color:{t};padding:14px 16px;font:400 12px var(--mono)">{n} {p} %</div>'
                  for (n, _, p, _), c, t in zip(forces, [N, V, A], [B, B, N]))
    bk.add(f"""<h2>Trois forces, <i>dosées.</i></h2><p class="lead">La règle du brief, traduite en proportions : le luxe domine, l'italianité donne du caractère, la sportivité apporte l'énergie.</p>
      <div style="display:flex;margin:28px 0 36px">{bar}</div>
      <div class="g g3">{''.join(f'<div><h3>{n} <i>{v}</i></h3><p>{d}</p></div>' for n, v, _, d in forces)}</div>""", "", "02 — Stratégie")
    pers = [("Le passionné", "Sportive, youngtimer ou GT du week-end.", "Connaît le vocabulaire, compare les méthodes, partage ses voitures.", "Montrer le protocole, les étapes, la lumière d'inspection."),
            ("L'exigeant du quotidien", "Berline, break ou SUV premium : BMW, Audi RS, Mercedes-AMG, Porsche Macan.", "Peu de temps, veut un résultat net et un interlocuteur fiable.", "Montrer la clarté : devis, délai, collecte, restitution."),
            ("Le collectionneur", "Véhicules rares ou anciens, Ferrari, Lamborghini, Maserati.", "Attend discrétion, traçabilité et respect des matériaux d'origine.", "Montrer la fiche Opera, le suivi, la retenue.")]
    bk.add(f"""<h2>Pour qui, <i>sans exclure personne.</i></h2><p class="lead">La marque séduit les propriétaires de voitures premium sans paraître réservée aux supercars : la même méthode s'applique à une citadine soignée.</p>
      <div class="g g3" style="margin-top:28px">{''.join(f'<div style="border-top:1px solid {N};padding-top:16px"><h3>{a}</h3><p class="small"><b>{b}</b></p><h4 style="margin-top:14px">Attentes</h4><p class="small">{c}</p><h4>Ce que la marque montre</h4><p class="small">{d}</p></div>' for a, b, c, d in pers)}</div>""", "", "02 — Stratégie")

    # ------------------------------------------------------------ 03 pistes
    bk.chapter("03", "Trois pistes <i>créatives</i>", "Trois directions distinctes ont été dessinées et comparées. Une seule est développée ; les deux autres expliquent pourquoi.")
    pistes = [
        ("piste-1.jpg", "Piste 1 — Luxury Heritage", "Il Sigillo", "dark",
         "La plaque de carrossier rivetée sur les flancs des voitures italiennes des années 1950 et 1960.",
         "Deux A entrelacés en Bodoni dans un octogone allongé : le sceau de l'atelier.", "Bodoni Moda, capitales espacées.",
         "Emblème fermé, centré, double filet.", "Nero et champagne.",
         "Luxe immédiatement lisible, caractère patrimonial, superbe en dorure.",
         "Proche des écussons constructeurs et du « noir & or » des detailers. Déliés trop fins pour la broderie et les petits formats. Risque de faire ancien."),
        ("piste-2.jpg", "Piste 2 — Modern Performance", "La Traiettoria", "gris",
         "La trajectoire idéale d'un virage, tracée d'un seul geste.",
         "Deux A monolignes inclinés, réunis par une barre continue qui file vers l'avant.", "Archivo Expanded gras, incliné.",
         "Horizontale, dynamique, orientée vers la droite.", "Grafite et Rosso.",
         "Moderne, énergique, très lisible, facile à animer.",
         "Le double chevron se lit « M ». Codes du sport automobile, voire du tuning. L'inclinaison et le rouge vieillissent vite. Peu de luxe."),
        ("piste-3.jpg", "Piste 3 — Italian Atelier", "Il Riflesso", "",
         "Le reflet, preuve d'un vernis parfait et lieu du travail du detailer.",
         "Un A et son reflet de part et d'autre de la Linea. A + reflet = AA : Arte Automobili.",
         "Lettrage ARTE dessiné (contraste didone, sans empattement) et AUTOMOBILI en Archivo Expanded.",
         "Alignements stricts : apex, ligne de base, pointe du reflet.", "Nero, Bianco Sangiovanni, Verde Verona.",
         "Idée propre au métier, monogramme mémorisable, sobre et durable, fonctionne en une couleur.",
         "Le reflet strié demande une version simplifiée sous 96 px. Deux voix typographiques à discipliner."),
    ]
    for src, t, sub, theme, concept, sym, typo, comp, col, pro, con in pistes:
        bk.add(f"""<div class="g g-7-5 ac"><div>{img(src, t)}</div>
          <div><p class="label">{t}</p><h2 style="margin-top:12px"><i>{sub}</i></h2>
          <table><tr><td style="width:120px"><h4>Concept</h4></td><td>{concept}</td></tr><tr><td><h4>Symbole</h4></td><td>{sym}</td></tr>
          <tr><td><h4>Typographie</h4></td><td>{typo}</td></tr><tr><td><h4>Composition</h4></td><td>{comp}</td></tr><tr><td><h4>Couleurs</h4></td><td>{col}</td></tr>
          <tr><td><span class="ok">Atouts</span></td><td>{pro}</td></tr><tr><td><span class="ko">Limites</span></td><td>{con}</td></tr></table></div></div>""", theme, "03 — Pistes")
    crit = [("Distinction dans le secteur", 2, 3, 5), ("Luxe perçu", 5, 2, 4), ("Italianité", 4, 2, 4), ("Énergie", 1, 5, 3),
            ("Lisibilité en petit", 2, 5, 4), ("Reproduction (broderie, vinyle)", 2, 4, 4), ("Durabilité", 4, 2, 5), ("Lien avec le métier", 2, 2, 5)]
    rows = "".join(f'<tr><td>{c}</td><td>{dots(a)}</td><td>{dots(b)}</td><td>{dots(d)}</td></tr>' for c, a, b, d in crit)
    tot = [sum(x[i] for x in crit) for i in (1, 2, 3)]
    bk.add(f"""<div class="g g-7-5"><div><h2>Recommandation : <i>Il Riflesso.</i></h2><div class="tw"><table>
      <tr><th>Critère</th><th>1 · Sigillo</th><th>2 · Traiettoria</th><th>3 · Riflesso</th></tr>{rows}
      <tr><td><b>Total / 40</b></td><td class="m">{tot[0]}</td><td class="m">{tot[1]}</td><td class="m"><b>{tot[2]}</b></td></tr></table></div></div>
      <div><p class="lead" style="margin-top:6px">La piste 3 est la seule dont l'idée naît du métier lui-même. Elle n'imite ni un constructeur ni un joaillier, et reste lisible en une couleur, en broderie comme en vinyle.</p>
      <p>Elle emprunte à la piste 2 sa géométrie construite (proportions fixes, nombre d'or) et à la piste 1 son sérieux patrimonial (contraste didone, références italiennes), sans leurs clichés.</p>
      <p class="small muted">Notes de 1 à 5 attribuées par la direction artistique au regard du brief.</p></div></div>""", "", "03 — Pistes")

    # ------------------------------------------------------------ 04 logo
    bk.chapter("04", "Le logo", "Un A et son reflet. Le système complet, ses versions et ses règles d'usage.")
    bk.add(f"""<div class="g g-5-7 ac"><div style="display:grid;place-items:center">{ls("monogramme", B, h=520)}</div>
      <div><h2>Un A <i>et son reflet.</i></h2>
      <div class="g g3" style="margin-top:20px">
        <div><h4>Le A</h4><p class="small">Dessiné comme au pinceau : plein à droite, délié à gauche. Le contraste rappelle la lumière et l'ombre sur une aile.</p></div>
        <div><h4>La Linea</h4><p class="small">La surface du vernis. Sa longueur vaut φ fois la base du A. Elle devient le fil conducteur de toute l'identité.</p></div>
        <div><h4>Le reflet</h4><p class="small">Le A renversé, raccourci, traversé de trois lames de lumière comme sous les rampes LED de l'atelier.</p></div></div>
      <p class="lead" style="margin-top:24px">A + son reflet = AA. Le monogramme écrit Arte Automobili sans jamais l'épeler.</p></div></div>""", "dark", "04 — Logo")
    bk.add(f"""<div class="g g-7-5 ac"><div>{construction_svg()}</div>
      <div><h2>Construction</h2><p class="lead">Toutes les dimensions dérivent de la hauteur du A (h). Aucune cote n'est arbitraire.</p>
      <ul class="l"><li>Base du A : 0,74 h · barre à 0,30 h de la base</li><li>Plein 0,132 h · délié 0,037 h (rapport 3,6 : 1)</li>
      <li>Linea : φ × base du A, épaisseur d'un délié</li><li>Reflet : 0,42 h, à deux déliés sous la Linea</li>
      <li>Lames : trois coupes de 0,016 h, 0,026 h et 0,038 h, de plus en plus larges vers la pointe</li><li>Apex en léger dépassement optique (+1,2 %)</li></ul></div></div>""", "", "04 — Logo")
    bk.add(f"""<div class="g g-7-5 ac"><div>{alignment_svg()}</div>
      <div><h2>Le lettrage</h2><p><b>ARTE</b> est dessiné sur mesure avec la logique du monogramme : pleins verticaux et diagonales descendantes, déliés horizontaux, aucune empattement. C'est un dessin, pas une police : il n'est jamais recomposé au clavier.</p>
      <p><b>AUTOMOBILI</b> est composé en Archivo Expanded Medium, justifié à l'encre sur la largeur exacte d'ARTE. Les deux voix disent le nom de la marque : l'art (contraste, geste) et l'automobile (largeur, précision).</p>
      <p>Dans le logo principal, l'apex du monogramme touche la capitale d'ARTE, la Linea tombe sur sa ligne de base, la pointe du reflet sur celle d'AUTOMOBILI.</p></div></div>""", "", "04 — Logo")
    sysd = [("logo-principal", "Logo principal", "Usage par défaut : site, documents, véhicule, enseigne.", 330),
            ("logo-vertical", "Version verticale", "Formats carrés et verticaux : carte, panneau, affiche, textile dos.", 210),
            ("logo-horizontal", "Version horizontale", "Bandeaux très larges : enseigne étroite, pied de page, autocollant.", 400),
            ("logo-secondaire", "Logo secondaire", "Lettrage seul, quand le monogramme figure déjà sur le support.", 220),
            ("monogramme", "Monogramme", "Signe autonome : avatar, broderie, autocollant, sceau.", 120),
            ("signature", "Signature typographique", "Mention discrète : nuque d'un t-shirt, gravure, crédit.", 330)]
    tiles = "".join(f'<div class="tile" style="background:#E4E1D9;min-height:0;padding:18px 22px"><div class="lg" style="height:150px;padding:0">{ls(k, N, w=w * 0.82)}</div><div><p style="font:400 21px var(--serif);margin:0 0 4px">{n}</p><p class="cap muted">{d}</p></div></div>'
                    for k, n, d, w in sysd)
    bk.add(f"""<h2>Le système <i>de logos</i></h2><div class="g g3" style="margin-top:8px">{tiles}</div>""", "", "04 — Logo")
    lv = [("monogramme", "Complet", "≥ 96 px · ≥ 20 mm", "Trois lames de lumière."), ("monogramme-simplifie", "Simplifié", "32 – 96 px · 8 – 20 mm", "Déliés renforcés, une lame. Avatar, broderie < 60 mm."),
          ("monogramme-micro", "Micro", "< 32 px · < 8 mm", "A et Linea seuls. Favicon, tampon, gravure fine.")]
    bk.add(f"""<h2>Le monogramme <i>en trois niveaux</i></h2><p class="lead">Un logo qui reste lisible doit savoir se simplifier. Chaque niveau a son seuil.</p>
      <div class="g g-8-4" style="margin-top:20px"><div class="g g3">{''.join(f'<div class="tile" style="background:{G}"><div class="lg">{ls(k, B, h=200)}</div><div><p style="font:400 22px var(--serif);margin:0">{n}</p><p class="cap" style="color:{A}">{s}</p><p class="cap muted">{d}</p></div></div>' for k, n, s, d in lv)}</div>
      <div style="display:flex;flex-direction:column;gap:20px;justify-content:center;align-items:center"><img src="assets/avatar.png" alt="Avatar réseaux sociaux" style="width:200px;border-radius:50%"><p class="cap mono small" style="color:{A};text-align:center">Avatar Instagram · Facebook · TikTok<br>1080 × 1080, recadrage rond sûr</p>
      <div style="display:flex;gap:16px;align-items:end">{''.join(f'<div style="width:{s}px;height:{s}px;background:{N};display:grid;place-items:center;border:1px solid #333">{ls("monogramme-micro", B, h=s * .75)}</div>' for s in (16, 32, 48))}</div><p class="cap mono small" style="color:{A}">Favicon 16 · 32 · 48 px</p></div></div>""", "dark", "04 — Logo")
    cv = [(B, N, "nero", "Fonds clairs — Nero Vite"), (N, B, "bianco", "Fonds sombres — Bianco Sangiovanni"), (B, V, "verde", "Couleur — Verde Verona sur clair"),
          (V, B, "bianco", "Sur Verde — Bianco Sangiovanni"), ("#FFFFFF", "#000000", "noir-100", "Monochrome noir 100 %"), ("#000000", "#FFFFFF", "blanc-100", "Monochrome blanc 100 %")]
    bk.add(f"""<h2>Versions <i>couleur</i></h2><p class="lead">Le logo s'imprime toujours en une seule couleur. Six combinaisons sont autorisées ; les fichiers portent le suffixe indiqué.</p>
      <div class="g g3" style="margin-top:16px">{''.join(f'<div class="tile" style="background:{bg};color:{fg};min-height:180px;border:1px solid rgba(0,0,0,.08)"><div class="lg">{ls("logo-principal", fg, w=300)}</div><p class="cap">{n} · <span class="mono">-{s}</span></p></div>' for bg, fg, s, n in cv)}</div>""", "", "04 — Logo")
    bk.add(f"""<div class="g g-7-5"><div><h2>Zone de protection</h2><p class="lead">Unité R = hauteur du reflet du monogramme. Aucun texte, bord ou image ne pénètre dans la zone de R autour du logo.</p>{clearspace_svg()}</div>
      <div><h2>Tailles minimales</h2><div class="tw"><table><tr><th>Version</th><th>Impression</th><th>Écran</th></tr>
      <tr><td>Logo principal</td><td class="m">40 mm</td><td class="m">160 px</td></tr><tr><td>Version verticale</td><td class="m">25 mm</td><td class="m">100 px</td></tr>
      <tr><td>Version horizontale</td><td class="m">50 mm</td><td class="m">200 px</td></tr><tr><td>Logo secondaire</td><td class="m">25 mm</td><td class="m">100 px</td></tr>
      <tr><td>Monogramme complet</td><td class="m">20 mm haut</td><td class="m">96 px</td></tr><tr><td>Monogramme simplifié</td><td class="m">8 – 20 mm</td><td class="m">32 – 96 px</td></tr>
      <tr><td>Monogramme micro</td><td class="m">&lt; 8 mm</td><td class="m">&lt; 32 px</td></tr><tr><td>Broderie</td><td class="m">simplifié ≥ 40 mm</td><td class="m">—</td></tr></table></div>
      <p class="small muted" style="margin-top:12px">Largeurs, sauf mention « haut ». En dessous de ces tailles, passer à la version inférieure.</p></div></div>""", "", "04 — Logo")
    don = [("transform:scaleX(1.4);transform-origin:center", N, "small", "Déformer ou étirer"), ("transform:rotate(-12deg)", N, "", "Incliner ou faire pivoter"),
           ("", "#B3262B", "", "Changer les couleurs"), ("filter:drop-shadow(0 0 6px #f5c66b) drop-shadow(3px 4px 2px rgba(0,0,0,.6))", "#C2AB80", "", "Ajouter ombre, lueur, dégradé"),
           ("", "none", "stroke", "Le réduire à un contour"), ("", N, "recompose", "Recomposer les éléments"),
           ("", N, "lowc", "Placer sans contraste"), ("", B, "photo", "Poser sur une zone chargée")]
    tiles = []
    for st, fill, mode, cap in don:
        if mode == "stroke":
            lg = ls("logo-principal", "none", w=240).replace('fill="none"', f'fill="none" stroke="{N}" stroke-width="1.5"')
            bg = "#E4E1D9"
        elif mode == "recompose":
            lg = f'<div style="display:flex;align-items:center;gap:14px">{ls("logo-secondaire", N, w=140)}{ls("monogramme", N, h=90)}</div>'
            bg = "#E4E1D9"
        elif mode == "lowc":
            lg = ls("logo-principal", N, w=240)
            bg = G
        elif mode == "photo":
            lg = ls("logo-principal", B, w=240)
            bg = f"url(assets/r-phare.jpg) center 40%/cover"
        else:
            lg = f'<div style="{st}">{ls("logo-principal", fill, w=180 if mode == "small" else 240)}</div>'
            bg = "#E4E1D9"
        tiles.append(f'<div class="no" style="background:{bg}"><span class="x">×</span><div class="lg">{lg}</div><p class="cap" style="{"color:" + B if mode in ("lowc", "photo") else ""}">{cap}</p></div>')
    bk.add(f"""<h2>Usages <i>interdits</i></h2><div class="g g4 keep" style="margin-top:8px">{''.join(tiles)}</div>
      <p class="small muted" style="margin-top:18px">Ne jamais redessiner, recomposer au clavier, animer en rotation, ni associer le logo à un autre emblème. Toujours partir des fichiers fournis.</p>""", "", "04 — Logo")
    bk.add(f"""<div class="g g2">
      <div><div style="position:relative">{img("r-hero.jpg", "Logo sur photographie, zone sombre")}<div style="position:absolute;left:5%;top:9%">{ls("logo-principal", B, w=230)}</div></div>
        <p class="ok" style="margin-top:12px">Oui</p><p class="small">Version Bianco dans une zone sombre et calme de l'image, alignée sur la grille, zone de protection respectée.</p></div>
      <div><div style="position:relative">{img("r-bianco.jpg", "Logo sur photographie, zone claire")}<div style="position:absolute;left:30%;top:46%">{ls("logo-principal", B, w=230)}</div></div>
        <p class="ko" style="margin-top:12px">Non</p><p class="small">Logo clair sur carrosserie claire, posé sur le sujet. Ne jamais compenser par une ombre portée : choisir une autre image ou une autre zone.</p></div></div>
      <ul class="l" style="margin-top:20px"><li>Le logo n'est jamais posé sur la voiture elle-même dans une photo. Il vit dans le vide de l'image ou sous la Linea.</li><li>Un voile Nero dégradé (opacité ≤ 85 %) est autorisé pour garantir le contraste.</li></ul>""", "dark", "04 — Logo")
    bk.add(f"""<h2>Impression <i>et numérique</i></h2><div class="tw"><table>
      <tr><th>Usage</th><th>Fichier</th><th>Technique recommandée</th></tr>
      <tr><td>Site, e-mail, présentations</td><td class="m">SVG · PNG 1200 px</td><td>SVG en priorité ; PNG transparent pour les outils qui l'exigent.</td></tr>
      <tr><td>Réseaux sociaux</td><td class="m">PNG · avatar 1080</td><td>Gabarits fournis ; monogramme simplifié dans les petits formats.</td></tr>
      <tr><td>Imprimerie (offset, numérique)</td><td class="m">PDF vectoriel</td><td>Couleurs en CMJN fournis ou Pantone indicatif ; polices vectorisées dans les logos.</td></tr>
      <tr><td>Cartes et papeterie premium</td><td class="m">PDF vectoriel</td><td>Marquage à chaud ivoire mat ou argent, gaufrage à sec, sérigraphie ivoire sur papier teinté.</td></tr>
      <tr><td>Textile</td><td class="m">PDF · SVG</td><td>Broderie (version simplifiée sous 60 mm), jamais de flocage brillant.</td></tr>
      <tr><td>Véhicule, vitrine</td><td class="m">SVG · PDF</td><td>Vinyle coulé mat découpé ; vitrophanie pour l'intérieur du vitrage.</td></tr>
      <tr><td>Enseigne</td><td class="m">PDF à l'échelle</td><td>Lettres boîtiers laquées Bianco, halo blanc chaud 3 000 K.</td></tr>
      <tr><td>Gravure, tampon</td><td class="m">SVG micro</td><td>Monogramme micro ou simplifié selon la taille.</td></tr></table></div>""", "", "04 — Logo")

    # ------------------------------------------------------------ 05 couleurs
    bk.chapter("05", "Couleurs", "Une palette tirée des pigments des ateliers italiens : trois couleurs principales, trois de soutien, un seul accent.")

    def swatch(c, big=True):
        dark = c["id"] in ("nero-vite", "verde-verona", "verdaccio")
        fg = B if dark else N
        cm = "/".join(str(v) for v in c["cmjn"])
        extra = f'<dt>Aplat</dt><dd>{"/".join(str(v) for v in c["aplat_cmjn"])}</dd>' if c.get("aplat_cmjn") else ""
        return (f'<div class="sw" style="background:{c["hex"]};color:{fg};border:1px solid rgba(0,0,0,.08)"><div><p class="nm">{c["nom"]}</p>'
                f'<p class="small" style="opacity:.8;margin-top:10px">{c["origine"]}</p></div><div>'
                f'<p class="small" style="margin-bottom:14px">{c["role"]}</p><dl><dt>HEX</dt><dd>{c["hex"]}</dd><dt>RVB</dt><dd>{" ".join(str(v) for v in c["rgb"])}</dd>'
                f'<dt>CMJN</dt><dd>{cm}</dd>{extra}<dt>Pantone</dt><dd>{c["pantone"]}</dd></dl></div></div>')
    bk.add(f"""<h2>Palette <i>principale</i></h2><div class="g g3" style="margin-top:8px">{''.join(swatch(C[k]) for k in ("nero-vite", "bianco-sangiovanni", "verde-verona"))}</div>
      <p class="small muted" style="margin-top:14px">CMJN : constructions ISO Coated v2 à valider sur épreuve. Pantone : références indicatives à confirmer sur nuancier physique.</p>""", "", "05 — Couleurs")
    prop = pal["proportions"]
    colors = {"Nero Vite": N, "Verdaccio": G, "Bianco Sangiovanni": B, "Verde Verona": V, "Argento": A, "Travertino": TR}
    bar = "".join(f'<div style="flex:{v};background:{colors[k]};min-height:90px;border:1px solid rgba(0,0,0,.06)"></div>' for k, v in prop.items())
    leg = "".join(f'<span class="mono small">{k} {v} %</span>' for k, v in prop.items())
    bk.add(f"""<h2>Palette <i>secondaire</i></h2><div class="g g3" style="margin-top:8px">{''.join(swatch(C[k]) for k in ("verdaccio", "argento", "travertino"))}</div>
      <h4 style="margin-top:26px">Proportions dans l'ensemble des supports</h4><div style="display:flex">{bar}</div><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:8px">{leg}</div>""", "", "05 — Couleurs")
    cands = [("Rosso scuro", "#5E1A1D", B, "Le réflexe italien, mais celui de tout le monde : Ferrari, Alfa Romeo, la moitié des detailers. Évoque aussi le vin.", "Écarté"),
             ("Champagne", N, "#C2AB80", "Le code « noir & or » le plus saturé du secteur. Exige une dorure coûteuse pour ne pas paraître bon marché.", "Écarté"),
             ("Terra di Siena", N, "#B4623A", "Chaleureux et très italien, mais un brun-orangé évoque la rouille : un contresens sur une carrosserie.", "Écarté"),
             ("Verde Verona", V, B, "Rare dans le detailing, profond, durable. Associé au soin et à la fraîcheur, sans connotation négative. Imprime et brode facilement.", "Retenu")]
    cards = "".join(f"""<div><div class="tile" style="background:{bg};min-height:250px;border:1px solid #2a2f2d"><div class="lg">{ls("logo-vertical", fg, h=150)}</div></div>
      <p style="font:400 22px var(--serif);margin:14px 0 4px">{n}</p><p class="{'ok' if v == 'Retenu' else 'ko'}" style="margin-bottom:8px">{v}</p><p class="small muted">{d}</p></div>""" for n, bg, fg, d, v in cands)
    bk.add(f"""<h2>Choisir l'accent, <i>pas par réflexe.</i></h2><div class="g g4 keep" style="margin-top:8px">{cards}</div>""", "dark", "05 — Couleurs")
    combos = [(B, N, "Bianco / Nero"), (B, V, "Bianco / Verde"), (B, G, "Bianco / Verdaccio"), (A, N, "Argento / Nero"), (N, B, "Nero / Bianco"),
              (V, B, "Verde / Bianco"), (N, TR, "Nero / Travertino"), (V, N, "Verde / Nero"), (A, B, "Argento / Bianco")]

    def ratio(a, b):
        for p in pal["contrastes"]:
            if p["texte"] == [k for k, v in colors.items() if v == a][0] and p["fond"] == [k for k, v in colors.items() if v == b][0]:
                return p["ratio"], p["niveau"]
        return 0, ""
    ct = ""
    for fg, bg, n in combos:
        r, lv_ = ratio(fg, bg)
        ok = r >= 4.5
        ct += (f'<div style="background:{bg};color:{fg};padding:16px 18px;border:1px solid rgba(0,0,0,.08)"><p style="font:400 24px/1.1 var(--serif);margin:0 0 6px">Aa — {n}</p>'
               f'<p class="mono small" style="margin:0">{r:.2f} : 1 · {lv_}</p></div>')
    bk.add(f"""<div class="g g-7-5"><div><h2>Contrastes <i>et combinaisons</i></h2><div class="g g3" style="gap:10px">{ct}</div></div>
      <div><h4>Règles</h4><ul class="l"><li>Texte courant : ratio ≥ 4,5 : 1 (WCAG AA). Ivoire sur Nero, Verde ou Verdaccio ; Nero sur Bianco ou Travertino.</li>
      <li>Argento réservé aux textes secondaires sur fonds sombres, jamais sur fond clair.</li>
      <li>Verde sur Nero (1,6 : 1) : uniquement en aplats juxtaposés, jamais en texte ni en filet fin.</li>
      <li>Une seule couleur d'accent par composition. Jamais Verde et une autre couleur vive.</li>
      <li>Les couleurs fonctionnelles du site (erreur, succès) restent hors identité et discrètes.</li></ul></div></div>""", "", "05 — Couleurs")

    # ------------------------------------------------------------ 06 typographie
    bk.chapter("06", "Typographie", "Trois voix, chacune à sa place : l'italienne pour titrer, la technique pour informer, la mécanique pour les chiffres.")
    bk.add(f"""<div class="g g3">
      <div><p class="label">Titres · voix éditoriale</p><p style="font:400 96px/1 var(--serif);margin:18px 0 8px">Aa</p><h3>Bodoni Moda</h3>
        <p class="small">Didone dessinée d'après Giambattista Bodoni, typographe de Parme, aux portes de la Motor Valley. Titres en bas de casse, italique pour les mots italiens et l'emphase.</p>
        <p class="mono small muted">400 · 500 · italique 400 — Google Fonts · licence OFL</p></div>
      <div><p class="label">Texte · voix technique</p><p style="font:400 96px/1 var(--sans);margin:18px 0 8px">Aa</p><h3>Archivo <span style="font-stretch:125%;font-weight:600;font-family:var(--sans);font-size:.7em;letter-spacing:.18em">EXPANDED</span></h3>
        <p class="small">Grotesque à axe de largeur. Largeur normale pour le texte courant ; Expanded en capitales espacées pour les surtitres, la navigation et les boutons : la touche sportive.</p>
        <p class="mono small muted">400 · 500 · 600 · largeur 100 et 125 % — Google Fonts · OFL</p></div>
      <div><p class="label">Données · voix mécanique</p><p style="font:400 96px/1 var(--mono);margin:18px 0 8px">Aa</p><h3>DM Mono</h3>
        <p class="small">Chasse fixe pour les tarifs, durées, références, numéros d'Opera et fiches techniques. Les chiffres s'alignent comme sur un instrument.</p>
        <p class="mono small muted">300 · 400 · 500 — Google Fonts · OFL</p></div></div>
      <hr class="rule"><p style="font:400 30px/1.25 var(--serif);margin:0">Le reflet <i>du premier jour.</i> <span style="font:600 13px var(--sans);font-stretch:125%;letter-spacing:.22em;margin-left:18px">CORRECTION DE VERNIS</span> <span class="mono" style="font-size:16px;margin-left:18px">DÈS 490 € · 8–16 H</span></p>""", "", "06 — Typographie")
    scale = [("Titre 1", "Bodoni Moda 400", "64–112 px", "48–72 pt", "−0,01 em", "Bas de casse"), ("Titre 2", "Bodoni Moda 400", "34–54 px", "28–36 pt", "0", "Bas de casse"),
             ("Titre 3", "Bodoni Moda 400", "22–28 px", "14–18 pt", "0", "Bas de casse"), ("Surtitre", "Archivo Expanded 600", "11–13 px", "6–7 pt", "+0,22 em", "CAPITALES"),
             ("Bouton, menu", "Archivo Expanded 600", "12–13 px", "7 pt", "+0,18 em", "CAPITALES"), ("Texte courant", "Archivo 400", "16–18 px / 1,6", "9,5–10,5 pt / 1,45", "0", "Phrase"),
             ("Légende", "Archivo 400", "13–14 px", "7,5–8 pt", "0", "Phrase"), ("Données, tarifs", "DM Mono 400", "12–16 px", "6,5–9 pt", "+0,04 em", "CAPITALES ou chiffres")]
    bk.add(f"""<h2>Hiérarchie</h2><div class="tw"><table><tr><th>Niveau</th><th>Police</th><th>Écran</th><th>Imprimé</th><th>Interlettrage</th><th>Casse</th></tr>
      {''.join(f'<tr><td>{a}</td><td>{b}</td><td class="m">{c}</td><td class="m">{d}</td><td class="m">{e}</td><td>{f}</td></tr>' for a, b, c, d, e, f in scale)}</table></div>
      <div class="g g3" style="margin-top:22px"><p class="small"><b>Jamais</b> de Bodoni sous 18 px à l'écran ni sous 9 pt en impression : ses déliés disparaissent.</p>
      <p class="small"><b>Jamais</b> plus de deux tailles de titre sur une même composition. Le contraste naît de l'écart, pas du nombre.</p>
      <p class="small"><b>Substitution</b> si les polices manquent (bureautique) : Didot ou Georgia, Arial, Consolas.</p></div>""", "", "06 — Typographie")

    # ------------------------------------------------------------ 07 univers graphique
    bk.chapter("07", "Univers <i>graphique</i>", "Une composition Arte Automobili doit se reconnaître sans logo : par sa Linea, son espace, ses lames de lumière et ses chiffres.")
    bk.add(f"""<div class="g g-5-7 ac"><div>{reflet_svg()}</div>
      <div><h2>La Linea et le <i>principe du reflet</i></h2><p class="lead">Ce que fait le monogramme, chaque mise en page le fait aussi : la Linea partage le format au nombre d'or. Au-dessus, l'objet : l'image, l'émotion. En dessous, le reflet : l'information.</p>
      <ul class="l"><li>Filet de 1 px à l'écran, 0,25 pt en impression, en Argento sur sombre et Nero sur clair.</li><li>Position : 61,8 % de la hauteur. Sur les documents administratifs, sous l'en-tête.</li>
      <li>Toujours horizontale, de bord à bord ou alignée sur les marges ; jamais courbe, jamais oblique.</li><li>Une seule Linea par composition.</li></ul></div></div>""", "", "07 — Univers graphique")
    bk.add(f"""<h2>Motifs <i>et rituels</i></h2><div class="g g3" style="margin-top:12px">
      <div><h4>Lames de lumière</h4><div class="stripes" style="color:{B};margin:14px 0 18px"></div><p class="small">Bandes horizontales de plus en plus espacées, issues du reflet du monogramme. Séparateur, bord de carte, ruban adhésif, motion d'ouverture. Jamais en fond plein.</p></div>
      <div><h4>Fiche technique</h4><div style="border:1px solid {A};padding:16px;margin:14px 0 18px;font:400 12px/1.8 var(--mono);color:{B}">VÉHICULE ······· COUPÉ GT<br>VERNIS ········· 118–124 µm<br>CORRECTION ····· 2 ÉTAPES · 12 H<br>PROTECTION ····· CÉRAMIQUE 5 ANS</div>
        <p class="small">Les données s'écrivent en DM Mono, alignées, avec des points de conduite : la précision d'un relevé d'atelier.</p></div>
      <div><h4>Numérotation Opera</h4><p style="margin:14px 0 18px"><span style="font:italic 400 56px var(--serif)">Opera</span><span class="mono" style="font-size:26px;margin-left:14px">N° 0147</span></p>
        <p class="small">Chaque voiture restituée reçoit un numéro à quatre chiffres, conservé d'une visite à l'autre. Il signe les publications de résultats, la carte de remerciement, la facture et la vitrophanie.</p></div></div>""", "dark", "07 — Univers graphique")
    bk.add(f"""<div class="g g-7-5 ac"><div>{grid_svg()}</div>
      <div><h2>Grille <i>et espace</i></h2><ul class="l"><li>12 colonnes, marges égales à 1/12 de la largeur.</li><li>Textes alignés à gauche ; le centrage est réservé aux moments cérémoniels (carte, enseigne, lancement).</li>
      <li>Au moins 40 % de vide dans chaque composition. Le vide est un matériau, pas une perte.</li><li>Pas de cadres arrondis, pas d'ombres portées, pas de cartes empilées : des aplats et des filets.</li>
      <li>Angles vifs partout, comme les coupes du monogramme.</li></ul></div></div>""", "", "07 — Univers graphique")
    bk.add(f"""<div class="g g-7-5 ac"><div>{img("icones.png", "Jeu d'icônes Arte Automobili")}</div>
      <div><h2>Iconographie</h2><p class="lead">Dix-huit icônes dessinées pour la marque, fournies en SVG Nero et Bianco.</p>
      <ul class="l"><li>Grille 24 px, trait 1,5 px, extrémités carrées, angles vifs, aucun remplissage.</li><li>Les icônes de prestation reposent sur la Linea : l'objet au-dessus, la surface en dessous.</li>
      <li>Une icône accompagne un mot, elle ne le remplace pas.</li><li>Pas d'emoji dans les supports de la marque ; sur les réseaux, un seul au maximum en fin de légende.</li></ul></div></div>""", "dark", "07 — Univers graphique")

    # ------------------------------------------------------------ 08 photographie
    bk.chapter("08", "Photographie", "La photographie prouve le travail. Elle se fait sous une lumière maîtrisée, sans artifice, comme une inspection.")
    bk.add(f"""<div class="g g-5-7"><div><h2>Ambiance</h2><ul class="l"><li>Studio sombre et propre ; fonds Nero ou béton gris, jamais un parking.</li>
      <li>Lumière en lames (rampes LED) qui dessine des lignes nettes sur la carrosserie.</li><li>Reflets profonds, noirs denses, hautes lumières non brûlées.</li>
      <li>Gros plans : arêtes, phares, jantes, étriers, coutures de cuir, gouttes sur céramique.</li><li>Une voiture à la fois ; aucun personnage mis en scène, des mains au travail tout au plus.</li>
      <li>Toutes gammes de véhicules : la méthode compte plus que le modèle.</li></ul>
      <p class="small muted" style="margin-top:14px">Images de cette planche : rendus 3D d'intention (modèle « Car Concept », Khronos Group, CC BY 4.0).</p></div>
      <div class="thumbs" style="grid-template-columns:repeat(3,1fr)">{''.join(f'<img src="assets/r-{k}.jpg" alt="Rendu d intention {k}" style="aspect-ratio:4/5;object-fit:cover">' for k in ("capot", "jante", "phare", "apres", "face", "verde"))}</div></div>""", "dark", "08 — Photographie")
    spec = [("Colorimétrie", "Neutre, légèrement froide dans les ombres ; aucune dominante orange ou cyan."), ("Température", "5 200 – 5 600 K ; lumière d'atelier constante d'une séance à l'autre."),
            ("Contraste", "Élevé mais doux dans les noirs : on lit toujours la forme dans l'ombre."), ("Saturation", "−5 à −15 % ; les peintures gardent leur teinte réelle."),
            ("Ombres et reflets", "Les lames de lumière sont nettes ; aucune lumière parasite ni reflet du photographe."), ("Cadrage", "Tendu, horizontal ou 4:5 ; capot et lignes en diagonale, horizon droit."),
            ("Profondeur de champ", "Détails au 85–135 mm, f/2,8 – f/4 ; véhicule entier à f/8 – f/11."), ("Retouche", "Poussières et défauts du sol uniquement ; jamais la carrosserie.")]
    bk.add(f"""<div class="g g-7-5"><div><h2>Traitement</h2><div class="tw"><table>{''.join(f'<tr><td style="width:190px"><h4 style="margin:0">{a}</h4></td><td>{b}</td></tr>' for a, b in spec)}</table></div></div>
      <div><h2>À éviter</h2><ul class="l"><li>Filtres Instagram, HDR, vignettage lourd.</li><li>Couleurs artificielles, néons, éclairages RGB.</li><li>Saturation poussée « pour l'avant/après ».</li>
      <li>Lumière de parking, flash direct, contre-jour non maîtrisé.</li><li>Fonds de rue, poubelles, autres voitures.</li><li>Effets de vitesse, flou de mouvement, fumée.</li><li>Avant/après avec un angle ou une lumière différents : c'est tromper le client.</li></ul></div></div>""", "", "08 — Photographie")

    # ------------------------------------------------------------ 09 réseaux sociaux
    bk.chapter("09", "Réseaux <i>sociaux</i>", "Un fil qui se reconnaît d'un coup d'œil : même Linea, mêmes voix, même lumière. Instagram, Facebook et TikTok partagent les gabarits.")
    fmts = [("Instagram — publication", "1080 × 1350 (4:5)", "Grille du profil en 3:4 : garder 40 px de marge latérale ; vérifier si l'import 1080 × 1440 convient mieux."),
            ("Instagram / Facebook — Story", "1080 × 1920 (9:16)", "Éviter 250 px en haut et 340 px en bas (interface, réponse, sticker)."),
            ("Reels / TikTok", "1080 × 1920 (9:16)", "Couverture : titre dans la zone centrale 4:5 ; TikTok masque aussi la bande droite (≈ 120 px)."),
            ("Stories à la une", "1080 × 1920", "Seul le cercle central compte (≈ 400 px de diamètre au centre)."),
            ("Facebook — couverture", "1640 × 624", "Affichée en 820 × 312 sur ordinateur et rognée sur mobile : logo dans le tiers gauche central."),
            ("Avatar (tous réseaux)", "1080 × 1080", "Recadrage rond ; monogramme simplifié ≤ 52 % de la hauteur."),
            ("Partage de lien (site)", "1200 × 630", "Image Open Graph du site.")]
    bk.add(f"""<div class="g g-7-5"><div><h2>Formats</h2><div class="tw"><table><tr><th>Support</th><th>Dimensions</th><th>Zone sûre / à vérifier</th></tr>
      {''.join(f'<tr><td>{a}</td><td class="m">{b}</td><td class="small">{c}</td></tr>' for a, b, c in fmts)}</table></div>
      <p class="small muted" style="margin-top:12px">Les plateformes modifient régulièrement leurs formats : contrôler ces valeurs dans les aides officielles avant chaque nouvelle série de gabarits.</p></div>
      <div><h4>Règles du fil</h4><ul class="l"><li>La Linea à 61,8 %, toujours à la même hauteur.</li><li>Un surtitre, un titre, deux lignes de texte au maximum.</li><li>Alterner : image pleine, image + information, typographique.</li>
      <li>Un aplat Verde au plus toutes les six publications.</li><li>Le monogramme simplifié signe en bas à droite, rien d'autre.</li><li>Gabarits : SVG à texte modifiable dans <span class="mono">07_reseaux-sociaux/</span>.</li></ul></div></div>""", "", "09 — Réseaux sociaux")
    feed = ["01-presentation-marque", "02-avant-apres", "03-prestation", "04-gros-plan-finition", "05-resultat-client", "06-avis-client",
            "07-conseil-entretien", "08-produits", "09-promotion", "10-lancement", "11-premium-minimal"]
    names = ["Présentation", "Avant / après", "Prestation", "Gros plan", "Résultat client", "Avis client", "Conseil d'entretien", "Produits", "Promotion", "Lancement", "Premium, peu de texte"]
    bk.add(f"""<h2>Gabarits <i>du fil</i></h2><div class="thumbs g6 keep" style="grid-template-columns:repeat(6,1fr)">{''.join(f'<figure class="fig"><img src="assets/s-{f}.jpg" alt="{n}"><figcaption>{n}</figcaption></figure>' for f, n in zip(feed, names))}
      <div style="display:flex;align-items:center"><p class="small muted">11 gabarits 4:5, SVG à texte vivant et images liées. Les rendus 3D sont à remplacer par les photos de l'atelier.</p></div></div>""", "dark", "09 — Réseaux sociaux")
    grid_imgs = ["10-lancement", "05-resultat-client", "11-premium-minimal", "06-avis-client", "04-gros-plan-finition", "03-prestation",
                 "02-avant-apres", "09-promotion", "01-presentation-marque", "08-produits", "07-conseil-entretien", "05-resultat-client"]
    hl = "".join(f'<img src="assets/s-13-une-{k}.jpg" alt="{k}">' for k in ("prestations", "avant-apres", "avis", "atelier", "conseils"))
    bk.add(f"""<div class="g g-5-7 ac"><div><div class="phone"><div class="ph-h"><img src="assets/avatar.png" alt="Avatar"><div><b>arteautomobili</b><span class="mono" style="font-size:10px;opacity:.7">ATELIER DE DETAILING</span></div></div>
      <div class="ph-bio">{escape(BIO_INSTAGRAM)}</div><div class="ph-hl">{hl}</div><div class="ph-g">{''.join(f'<img src="assets/s-{k}.jpg" alt="">' for k in grid_imgs)}</div></div></div>
      <div><h2>Le profil, <i>vu de loin.</i></h2><p class="lead">À l'échelle de la grille, la marque se reconnaît à trois signes : la Linea à la même hauteur, le noir dominant, l'aplat vert ponctuel.</p>
      <ul class="l"><li>Bio de 125 caractères, sans emoji décoratif.</li><li>Stories à la une : icônes de la marque sur Nero, mêmes traits que le site.</li><li>Épingler : présentation, avant/après, avis.</li><li>Facebook et TikTok reprennent le même avatar et les mêmes couvertures.</li></ul></div></div>""", "", "09 — Réseaux sociaux")
    bk.add(f"""<div class="g g-4-8"><div><h2>Stories, Reels, <i>bannières</i></h2><ul class="l"><li>Story : information sous la Linea, zone sticker réservée.</li><li>Couverture de Reel : titre centré dans la zone 4:5, monogramme en haut.</li>
      <li>À la une : six icônes, une par rubrique.</li><li>Couverture Facebook et image de partage : logo principal à gauche, voiture à droite.</li></ul></div>
      <div class="g" style="grid-template-columns:repeat(3,1fr) 2.2fr;gap:14px">{img("s-12-story.jpg", "Story", "Story")}{img("s-14-couverture-reel.jpg", "Reel", "Couverture de Reel")}
      <div class="thumbs" style="grid-template-columns:1fr 1fr;align-content:start">{''.join(f'<img src="assets/s-13-une-{k}.jpg" alt="" style="border-radius:50%;aspect-ratio:1;object-fit:cover">' for k in ("prestations", "avant-apres", "avis", "atelier", "conseils", "contact"))}</div>
      <div class="thumbs">{img("s-15-couverture-facebook.jpg", "Couverture Facebook", "Couverture Facebook")}{img("s-16-image-partage-og.jpg", "Image de partage", "Image de partage du site")}</div></div></div>""", "dark", "09 — Réseaux sociaux")

    # ------------------------------------------------------------ 10 papeterie
    bk.chapter("10", "Papeterie <i>et documents</i>", "Des supports qui disent l'organisation et le sérieux, du premier contact à la restitution de la voiture.")
    bk.add(f"""<div class="g g-8-4 ac"><div>{img("papeterie.jpg", "Cartes de visite et carte de remerciement")}</div>
      <div><h2>Cartes</h2><h4>Carte de visite · 85 × 55 mm</h4><p class="small">Recto Nero : monogramme seul, centré, marquage à chaud ivoire mat (21 mm). Verso Verde : lettrage, nom en Bodoni 11 pt, Linea, coordonnées en DM Mono 6,2 pt. Duplex contre-collé 2 × 300 g, papier teinté dans la masse.</p>
      <h4 style="margin-top:16px">Carte de remerciement · A6</h4><p class="small">Glissée dans la voiture à la restitution : « Grazie. » au recto ; au verso, numéro d'Opera, prestations, date du prochain contrôle et un mot manuscrit.</p>
      <p class="small muted">Fichiers d'impression : <span class="mono">08_papeterie/</span> (PDF avec 3 mm de fonds perdus).</p></div></div>""", "dark", "10 — Papeterie")
    bk.add(f"""<div class="g g-4-8"><div><h2>Documents <i>administratifs</i></h2><ul class="l"><li>Fond blanc, texte Nero : lisibles à l'impression bureautique.</li><li>Logo principal 11,5 mm de haut, en haut à gauche, à 20 mm des bords.</li>
      <li>La Linea sépare l'en-tête du contenu ; un filet ferme le pied de page légal.</li><li>Devis et factures : tableau à filets fins, chiffres en DM Mono, total TTC en Bodoni.</li>
      <li>Modèles HTML modifiables (totaux recalculés) et papier à en-tête Word fournis.</li><li>Mentions légales à faire valider par l'expert-comptable.</li></ul></div>
      <div class="g g3" style="gap:18px">{img("en-tete.jpg", "Papier à en-tête", "Papier à en-tête A4")}{img("d-devis-1.jpg", "Devis", "Devis")}{img("d-facture-1.jpg", "Facture", "Facture")}</div></div>""", "", "10 — Papeterie")
    bk.add(f"""<h2 style="margin-bottom:12px">Supports <i>commerciaux</i></h2><div class="g g-8-4"><div class="thumbs" style="grid-template-columns:repeat(4,1fr)">{''.join(f'<img src="assets/d-deck-{i}.jpg" alt="Diapositive {i}">' for i in range(1, 9))}</div>
      <div><p class="small"><b>Présentation commerciale</b> — huit pages 16:9 : atelier, méthode, prestations, avant/après, rituel Opera, avis, contact.</p></div></div>
      <div class="g g-8-4" style="margin-top:6px"><div class="g g3" style="gap:18px">{img("d-brochure-1.jpg", "Carte des prestations, page 1")}{img("d-brochure-2.jpg", "Carte des prestations, page 2")}<div>{img("signature-email.png", "Signature e-mail")}</div></div>
      <div><p class="small"><b>Carte des prestations</b> A4 recto verso, avec trois formules : Essenziale, Completo, Opera.</p><p class="small"><b>Signature e-mail</b> en tableau HTML compatible avec les messageries.</p></div></div>""", "", "10 — Papeterie")

    # ------------------------------------------------------------ 11 véhicule, textile, atelier
    bk.chapter("11", "Véhicule, textile, <i>atelier</i>", "Dans la rue, sur les épaules et sur la façade : la marque se montre peu, mais toujours juste.")
    bk.add(f"""<div class="g g-8-4 ac"><div>{img("vehicule.jpg", "Marquage du fourgon")}</div><div><p class="small"><b>Discret</b> : logo principal en Bianco, environ 850 mm de large, sur le panneau latéral entre les ouvrants. Jamais de covering intégral ni de photo de voiture sur le fourgon.</p>
      <p class="small"><b>Lisible</b> : une seule ligne d'activité en Archivo Expanded et l'adresse du site. Pas de numéro de téléphone géant.</p><p class="small"><b>Fourgon Verdaccio ou noir</b>, vinyle coulé mat ; même marquage des deux côtés, monogramme et site sur la porte arrière.</p></div></div>""", "", "11 — Véhicule")
    bk.add(f"""<div class="g g-8-4 ac"><div>{img("tenues.jpg", "Tenues d'atelier")}</div><div><p class="small"><b>Broderie</b> uniquement : monogramme simplifié 50–55 mm au cœur, en fil écru ou ton sur ton. Version complète réservée au dos de la veste (≥ 200 mm).</p>
      <p class="small"><b>Couleurs</b> : Nero et Verdaccio pour les pièces, Verde pour les détails (ganse, liseré, étiquette tissée).</p><p class="small"><b>Matières</b> mates et techniques ; jamais de flocage brillant, de sponsor ni de texte dans le dos hors signature.</p></div></div>""", "", "11 — Textile")
    bk.add(f"""<div class="g g-8-4 ac"><div>{img("facade.jpg", "Enseigne de l'atelier")}</div><div><p class="small"><b>Bandeau Nero</b>, lettres boîtiers aluminium laqué Bianco, rétroéclairage en halo blanc chaud 3 000 K : la nuit, le logo se lit comme un reflet.</p>
      <p class="small"><b>Taille</b> : le logo n'occupe pas plus de 60 % de la largeur du bandeau ; zone de protection respectée sur la hauteur.</p><p class="small"><b>Plaque d'entrée</b> Verde 300 × 300 mm : monogramme et « Sur rendez-vous ».</p></div></div>""", "", "11 — Atelier")
    bk.add(f"""<div class="g g-8-4 ac"><div>{img("signaletique.jpg", "Signalétique et étiquettes")}</div><div><p class="small"><b>Signalétique</b> : Dibond 3 mm laqué mat, titre en Bodoni, mention en Archivo Expanded, Linea au nombre d'or, flèches du jeu d'icônes.</p>
      <p class="small"><b>Panneau d'accueil</b> Verde 1 000 × 600 mm : « Benvenuti. », une phrase d'accueil, les quatre temps de la méthode.</p><p class="small"><b>Étiquettes produits</b> 80 × 100 mm, papier synthétique résistant aux solvants, numérotées comme des références d'atelier.</p></div></div>""", "", "11 — Atelier")
    bk.add(f"""<div class="g g-4-8"><div>{img("affiche.jpg", "Affiche des prestations A2")}</div>
      <div><h2>Affiche, autocollants, <i>vitrophanie</i></h2><p class="small"><b>Affiche A2</b> des prestations pour l'accueil : image au-dessus, six prestations, tarifs indicatifs en DM Mono.</p>
      <div class="g g2 ac" style="margin-top:20px"><div style="display:grid;place-items:center">{img("sticker-rond.png", "Autocollant rond", style="width:180px")}</div><p class="small"><b>Autocollant rond</b> 60 mm : monogramme complet sur Nero, pour les colis, boîtes et pochettes de clés.</p>
      <div>{img("vitrophanie.png", "Vitrophanie céramique")}</div><p class="small"><b>Vitrophanie</b> 70 × 24 mm, posée à l'intérieur du pare-brise après une céramique : date, numéro d'Opera, prochain entretien. Retirable sans trace.</p>
      <div>{img("sticker-rect.png", "Autocollant rectangulaire")}</div><p class="small"><b>Autocollant rectangulaire</b> 90 × 22 mm : version horizontale pour le matériel et les cartons.</p></div></div></div>""", "dark", "11 — Atelier")

    # ------------------------------------------------------------ 12 site
    bk.chapter("12", "Site <i>vitrine</i>", "Un site qui vend un service, pas un catalogue de voitures : comprendre, faire confiance, demander un devis.")
    bk.add(f"""<div class="g g-7-5"><div>{sitemap_svg()}</div><div><h2>Architecture</h2><h4>Page d'accueil, dans l'ordre</h4><ul class="l">
      <li><b>Héros</b> : « Le reflet du premier jour. », une phrase, deux boutons (devis, réalisations), grande image.</li><li><b>Prestations</b> : six lignes, durée et prix indicatif.</li>
      <li><b>Méthode</b> : quatre temps.</li><li><b>Avant / après</b> : comparateur interactif.</li><li><b>Réalisations</b> : fiches Opera.</li><li><b>L'atelier</b>, <b>avis</b>, <b>devis</b>, <b>pied de page</b>.</li></ul></div></div>""", "", "12 — Site")
    bk.add(f"""<div class="g g-8-4"><div>{img("site-hero.jpg", "Page d'accueil — ordinateur", "Prototype fonctionnel : 10_site-web/index.html")}</div>
      <div style="display:flex;gap:18px">{img("site-mobile.jpg", "Page d'accueil — mobile", "Mobile", style="max-height:520px;width:auto")}</div></div>
      <div class="g g4 keep" style="margin-top:22px"><p class="small"><b>Boutons</b> : rectangles à angles vifs, Archivo Expanded 600 en capitales ; principal plein Bianco, secondaire en contour. Une flèche, jamais d'icône décorative.</p>
      <p class="small"><b>Formulaire</b> : champs soulignés, libellés en surtitre ; nom et téléphone suffisent pour envoyer.</p>
      <p class="small"><b>Pied de page</b> : logo vertical, signature en italique, trois colonnes de liens, mentions légales.</p><p class="small"><b>Technique</b> : polices auto-hébergées (RGPD), images compressées, aucune dépendance.</p></div>""", "dark", "12 — Site")

    # ------------------------------------------------------------ 13 ton de voix
    bk.chapter("13", "Ton <i>de voix</i>", "Parler comme on travaille : avec précision, sans hausser la voix.")
    bk.add(f"""<h2>Personnalité <i>rédactionnelle</i></h2><div class="tw"><table><tr><th>Trait</th><th>Ce que cela veut dire</th><th>On écrit</th><th>On n'écrit pas</th></tr>
      {''.join(f'<tr><td><b>{a}</b></td><td class="small">{b}</td><td style="font-family:var(--serif);font-size:17px">{c}</td><td class="small muted"><s>{d}</s></td></tr>' for a, b, c, d in TON)}</table></div>
      <div class="g g2" style="margin-top:20px"><div><h4>On dit</h4><p class="small">{' · '.join(VOCABULAIRE['on dit'])}</p></div><div><h4>On évite</h4><p class="small">{' · '.join(VOCABULAIRE['on évite'])}</p></div></div>""", "", "13 — Ton de voix")
    bk.add(f"""<div class="g g-5-7"><div><p class="label">Signature principale</p><p style="font:italic 400 clamp(48px,5vw,84px)/1.05 var(--serif);margin:18px 0 22px">{SIGNATURE}</p><p>{SIGNATURE_NOTE}</p></div>
      <div><h4>Cinq alternatives</h4><ul class="l">{''.join(f'<li><span style="font:400 24px var(--serif)">{s}</span> <span class="mono small" style="color:{A};margin-left:8px">{l}</span><br><span class="small muted">{d}</span></li>' for s, l, d in SLOGANS)}</ul></div></div>""", "dark", "13 — Ton de voix")
    bk.add(f"""<div class="g g-7-5"><div><h4>Présentation longue</h4>{''.join(f'<p>{p}</p>' for p in PITCH_LONG)}</div>
      <div><h4>Présentation courte</h4><p class="lead">{PITCH_COURT}</p><h4 style="margin-top:24px">Biographie Instagram</h4><p class="mono" style="white-space:pre-line;font-size:14px;border-left:1px solid {N};padding-left:14px">{escape(BIO_INSTAGRAM)}</p>
      <p class="small muted">125 caractères sur 150 autorisés.</p></div></div>""", "", "13 — Ton de voix")
    bk.add(f"""<div class="g g-5-7"><div><h4>Texte de lancement</h4><p style="font:italic 400 34px var(--serif);margin-bottom:12px">{LANCEMENT[0]}</p>{''.join(f'<p>{p}</p>' for p in LANCEMENT[1:])}</div>
      <div><h4>Titres de publications</h4><ul class="l">{''.join(f'<li style="font:400 19px/1.3 var(--serif)">{t}</li>' for t in TITRES)}</ul></div></div>""", "", "13 — Ton de voix")
    bk.add(f"""<h2>Descriptions <i>des prestations</i></h2><div class="g g3">{''.join(f'<div style="border-top:1px solid {N};padding-top:14px"><div style="display:flex;justify-content:space-between;align-items:center">{icon_inline(p["icone"], 30)}<span class="mono small">{p["n"]}</span></div><h3 style="margin-top:12px">{p["nom"]}</h3><p class="small">{p["desc"]}</p><p class="mono small" style="display:flex;justify-content:space-between"><span>{p["duree"].upper()}</span><span>{p["prix"].upper()}</span></p></div>' for p in PRESTATIONS)}</div>
      <p class="small muted" style="margin-top:12px">Tarifs indicatifs proposés par la direction artistique pour les maquettes : à fixer par l'entreprise.</p>""", "", "13 — Ton de voix")

    # ------------------------------------------------------------ 14 livrables
    bk.chapter("14", "Livrables <i>et cohérence</i>", "Où trouver chaque fichier, et comment garder la marque intacte dans le temps.")
    tree = """arte-automobili/
├── 00_guide/            Ce guide : HTML et PDF
├── 01_strategie/        Planches des trois pistes
├── 02_logo/
│   ├── svg/             40 fichiers vectoriels (8 versions × 5 couleurs)
│   ├── pdf/             Logos vectoriels pour l'imprimeur
│   ├── png/             PNG transparents 1200 / 3600 px
│   └── icones/          Avatar, favicon, icônes d'application
├── 03_typographie/      Polices OFL et licences
├── 04_couleurs/         palette.json · .css · .ase · .gpl
├── 05_univers-graphique/ Icônes SVG, planche
├── 06_photographie/     Rendus 3D d'intention, crédits
├── 07_reseaux-sociaux/  Gabarits SVG modifiables, aperçus PNG
├── 08_papeterie/        Cartes, en-tête, autocollants, devis, facture,
│                        présentation, carte des prestations, signature
├── 09_vehicule-textile-atelier/  Maquettes de principe
├── 10_site-web/         Prototype du site (index.html)
├── 11_ton-de-voix/      Textes prêts à copier (Markdown)
└── _source/             Scripts qui régénèrent tous les fichiers"""
    bk.add(f"""<div class="g g-7-5"><div><h2>Organisation <i>des fichiers</i></h2><pre class="tree">{escape(tree)}</pre></div>
      <div><h4>Nommage</h4><p class="small"><span class="mono">aa-[version]-[couleur].[format]</span>, par exemple <span class="mono">aa-logo-principal-bianco.svg</span>. Couleurs : nero, bianco, verde, noir-100, blanc-100.</p>
      <h4 style="margin-top:18px">Ce qui est final</h4><p class="small">Logos vectoriels, palette, polices, icônes, gabarits, fichiers d'impression de la papeterie.</p>
      <h4 style="margin-top:18px">Ce qui reste à produire</h4><p class="small">Photographies de l'atelier, coordonnées réelles, mentions légales, tarifs définitifs, plans du véhicule et de la façade pour les fichiers de production.</p></div></div>""", "", "14 — Livrables")
    bk.add(f"""<div class="g g2"><div><h2>Préserver <i>la cohérence</i></h2><ul class="l"><li><b>Un garant</b> de la marque valide chaque nouveau support avant impression ou publication.</li>
      <li><b>Toujours partir des fichiers fournis</b> : ne jamais recréer un logo à partir d'une capture d'écran.</li><li><b>Une révision par an</b> : relire le guide, mettre à jour les formats des réseaux, archiver les versions.</li>
      <li><b>Les prestataires</b> (imprimeur, brodeur, poseur, développeur) reçoivent ce guide et les fichiers sources.</li><li><b>Toute évolution</b> du logo passe par une nouvelle version du guide, jamais par une retouche locale.</li></ul></div>
      <div><h4>Avant de publier, vérifier</h4><ul class="l"><li>La bonne version du logo pour la taille et le fond.</li><li>La zone de protection.</li><li>Une seule Linea, à 61,8 %.</li><li>Les trois voix typographiques, chacune à sa place.</li>
      <li>Au plus une couleur d'accent.</li><li>Une photo nette, sans filtre, même lumière pour un avant/après.</li><li>Un texte court, précis, sans superlatif.</li></ul></div></div>""", "", "14 — Livrables")
    bk.add(f"""<div style="min-height:min(700px,70vh);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:40px">
      {ls("logo-vertical", B, h=300)}<p style="font:italic 400 30px var(--serif);color:{A}">{SIGNATURE}</p></div>""", "dark")

    # sommaire
    toc = "".join(f'<li style="display:flex;justify-content:space-between;gap:20px;align-items:baseline"><span><span class="mono" style="color:{A};margin-right:18px">{n}</span><span style="font:400 24px var(--serif)">{t}</span></span><span class="mono small">{p:02d}</span></li>'
                  for n, t, p in bk.chapters)
    html0, theme0, run0, cls0 = bk.pages[1]
    bk.pages[1] = (f'<div class="g g-4-8"><div><h2>Sommaire</h2><p class="lead muted">Quatorze chapitres, de la stratégie aux fichiers.</p></div><ul class="l toc" style="columns:2;column-gap:48px">{toc}</ul></div>',
                   theme0, run0, cls0)
    return bk


def main():
    if not ARTIFACT:
        prepare_assets()
    bk = build()
    if ARTIFACT:
        fonts = (f'<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
                 f'<link rel="stylesheet" href="{GOOGLE_FONTS}">')
        out = Path(sys.argv[sys.argv.index("--artifact") + 1]) if len(sys.argv) > sys.argv.index("--artifact") + 1 else GUIDE / "_artifact.html"
    else:
        fonts = f"<style>{font_css('../03_typographie/polices')}</style>"
        out = GUIDE / "guide-de-marque.html"
    head, body = bk.render(fonts)
    if ARTIFACT:
        html = head + body
    else:
        html = ('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
                '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
                f"{head}</head><body>{body}</body></html>")
    out.write_text(html)
    print(len(bk.pages), "pages →", out.name)
    if not ARTIFACT:
        jf = GUIDE / "_jobs.json"
        jf.write_text(json.dumps([{"in": str(out), "out": str(GUIDE / "Arte-Automobili_Guide-de-marque_v1.0.pdf"),
                                   "w": 1600, "h": 900, "pdf": {"width": "1600px", "height": "900px"}}]))
        subprocess.run(["node", str(ROOT / "_source" / "render.mjs"), str(jf)], check=True, stdout=subprocess.DEVNULL)
        jf.unlink()


if __name__ == "__main__":
    main()
