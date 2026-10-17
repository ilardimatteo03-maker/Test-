"""Prototype du site vitrine (page d'accueil) — HTML/CSS/JS sans dépendance,
polices auto-hébergées en WOFF2 (conforme RGPD), images embarquées."""
import shutil
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image

from build_icons import LINEA, SERVICES, UTILITY
from kit import A, B, G, N, ROOT, TR, V, logo_svg
from textes import AVIS, METHODE, PITCH_LONG, PRESTATIONS, SIGNATURE

OUT = ROOT / "10_site-web"
ASSETS = OUT / "assets"
REND = ROOT / "06_photographie" / "rendus-3d"

IMAGES = {
    "hero": ("rendu-01-hero-studio-2400x1200.jpg", 2400), "capot": ("rendu-07-capot-lames-de-lumiere-1080x1350.jpg", 1080),
    "avant": ("rendu-04-epaule-avant-1080x1350.jpg", 1080), "apres": ("rendu-03-epaule-apres-1080x1350.jpg", 1080),
    "jante": ("rendu-05-jante-1080x1350.jpg", 1080), "phare": ("rendu-06-phare-argento-1080x1350.jpg", 1080),
    "verde": ("rendu-08-verde-trois-quarts-arriere-1800x1350.jpg", 1800), "bianco": ("rendu-09-bianco-trois-quarts-arriere-1800x1350.jpg", 1800),
    "profil": ("rendu-02-profil-2400x1000.jpg", 2400),
}


def icon(name, size=32, stroke="currentColor"):
    body = SERVICES[name][0] + LINEA if name in SERVICES else UTILITY[name][0]
    return (f'<svg class="ico" viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="{stroke}" '
            f'stroke-width="1.5" stroke-linecap="square" aria-hidden="true">{body}</svg>')


FONT_FACES = """
@font-face{font-family:'Bodoni Moda';src:url('assets/fonts/BodoniModa.woff2') format('woff2');font-weight:400 900;font-style:normal;font-display:swap}
@font-face{font-family:'Bodoni Moda';src:url('assets/fonts/BodoniModa-Italic.woff2') format('woff2');font-weight:400 900;font-style:italic;font-display:swap}
@font-face{font-family:'Archivo';src:url('assets/fonts/Archivo.woff2') format('woff2');font-weight:100 900;font-stretch:62% 125%;font-style:normal;font-display:swap}
@font-face{font-family:'DM Mono';src:url('assets/fonts/DMMono-Regular.woff2') format('woff2');font-weight:400;font-display:swap}
@font-face{font-family:'DM Mono';src:url('assets/fonts/DMMono-Light.woff2') format('woff2');font-weight:300;font-display:swap}
"""


def page(fonts_block):
    svc = "".join(f"""
        <li class="svc">
          <span class="svc-n mono">{p['n']}</span>
          {icon(p['icone'], 34)}
          <div class="svc-t"><h3>{p['nom']}</h3><p>{p['desc']}</p></div>
          <p class="svc-d mono"><span>{p['duree']}</span><span>{p['prix']}</span></p>
        </li>""" for p in PRESTATIONS)
    meth = "".join(f'<li><span class="mono">{i + 1:02d}</span><h3>{t}</h3><p>{d}</p></li>' for i, (t, d) in enumerate(METHODE))
    works = [("jante", "0151", "Jantes, étriers et vitrage", "Berline, noir"), ("verde", "0149", "Correction 2 étapes · Céramique 5 ans", "Coupé GT, Verde"),
             ("phare", "0148", "Correction 1 étape · Céramique 2 ans", "Coupé, argent"), ("bianco", "0147", "Correction 2 étapes · Céramique 5 ans", "Coupé GT, Bianco perla")]
    gal = "".join(f"""<figure class="work w{i}"><img src="assets/img/{k}.jpg" alt="Véhicule {c.lower()} après intervention — rendu d'intention" loading="lazy">
        <figcaption><span class="opera"><i>Opera</i><span class="mono">N° {n}</span></span><span class="mono cap">{c} · {s}</span></figcaption></figure>"""
                  for i, (k, n, s, c) in enumerate(works))
    avis = "".join(f'<blockquote><p>« {q} »</p><footer><b>{n}</b><span class="mono">{c}</span></footer></blockquote>' for n, c, q in AVIS)
    opts = "".join(f"<option>{p['nom']}</option>" for p in PRESTATIONS)
    return f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Arte Automobili — Atelier de detailing automobile</title>
<meta name="description" content="Correction de vernis, protection céramique et soin de l'habitacle. Atelier de detailing sur rendez-vous, une voiture à la fois.">
<meta property="og:title" content="Arte Automobili — L'arte del riflesso">
<meta property="og:image" content="assets/img/og.jpg">
<meta name="theme-color" content="{N}">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
{fonts_block}
<style>
/* Mise en page : grille 12 colonnes, marges latérales larges ; la Linea sépare l'image (au-dessus) de l'information (en dessous). */
:root{{
  --nero:{N};--bianco:{B};--verde:{V};--verdaccio:{G};--argento:{A};--travertino:{TR};
  --serif:'Bodoni Moda',Didot,'Bodoni 72','Times New Roman',serif;
  --sans:Archivo,'Helvetica Neue',Arial,sans-serif;
  --mono:'DM Mono',ui-monospace,Menlo,monospace;
  --gut:max(20px,env(safe-area-inset-left,0px));--gutr:max(20px,env(safe-area-inset-right,0px));
  --pad:clamp(20px,5vw,72px);--max:1440px;
  color-scheme:dark;
}}
*{{box-sizing:border-box}}
html{{scroll-behavior:smooth}}
body{{margin:0;background:var(--nero);color:var(--bianco);font:400 17px/1.65 var(--sans);-webkit-font-smoothing:antialiased}}
img{{max-width:100%;display:block}}
a{{color:inherit}}
:focus-visible{{outline:1.5px solid var(--bianco);outline-offset:3px}}
.wrap{{max-width:var(--max);margin:0 auto;padding-left:max(var(--pad),env(safe-area-inset-left,0px));padding-right:max(var(--pad),env(safe-area-inset-right,0px))}}
.label{{font:600 12px/1.2 var(--sans);font-stretch:125%;letter-spacing:.22em;text-transform:uppercase;color:var(--argento)}}
.mono{{font-family:var(--mono);letter-spacing:.04em}}
h1,h2,h3{{font-family:var(--serif);font-weight:400;margin:0;text-wrap:balance}}
h2{{font-size:clamp(34px,4.6vw,64px);line-height:1.06}}
h2 i,h1 i{{font-style:italic}}
.linea{{border:0;border-top:1px solid var(--argento);margin:0}}
.btn{{display:inline-flex;align-items:center;gap:14px;padding:16px 26px;font:600 13px/1 var(--sans);font-stretch:125%;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;border:1px solid var(--bianco);transition:background .25s,color .25s}}
.btn-p{{background:var(--bianco);color:var(--nero)}}
.btn-p:hover{{background:transparent;color:var(--bianco)}}
.btn-s{{color:var(--bianco)}}
.btn-s:hover{{background:var(--bianco);color:var(--nero)}}
.btn svg{{width:18px;height:18px}}
/* En-tête */
.top{{position:fixed;inset:0 0 auto;z-index:20;padding-top:env(safe-area-inset-top,0px);transition:background .3s}}
.top.solid{{background:rgba(13,15,14,.92);backdrop-filter:blur(8px);border-bottom:1px solid rgba(142,149,146,.25)}}
.top .wrap{{display:flex;align-items:center;justify-content:space-between;height:84px;gap:24px}}
.top .logo svg{{height:38px;width:auto}}
.nav{{display:flex;gap:34px;align-items:center}}
.nav a{{font:600 12px/1 var(--sans);font-stretch:125%;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;color:var(--bianco);opacity:.85}}
.nav a:hover{{opacity:1}}
.nav .btn{{padding:12px 18px;opacity:1}}
.nav a.btn-p{{color:var(--nero)}}.nav a.btn-p:hover{{color:var(--bianco)}}
.burger{{display:none;background:none;border:0;color:var(--bianco);padding:10px;cursor:pointer}}
/* Héros */
.hero{{padding:0;position:relative;min-height:min(92vh,920px);display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden}}
.hero>img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:72% 50%}}
.hero::before{{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(13,15,14,.92) 18%,rgba(13,15,14,.25) 58%,rgba(13,15,14,0) 80%),linear-gradient(0deg,rgba(13,15,14,.9),rgba(13,15,14,0) 40%)}}
.hero .wrap{{position:relative;width:100%;padding-bottom:56px}}
.hero h1{{font-size:clamp(46px,7.4vw,112px);line-height:1;max-width:11ch;margin:22px 0 26px}}
.hero p.sub{{max-width:46ch;font-size:clamp(17px,1.4vw,20px);opacity:.85;margin:0 0 36px}}
.cta{{display:flex;flex-wrap:wrap;gap:14px}}
.hero-foot{{position:relative;border-top:1px solid var(--argento)}}
.hero-foot .wrap{{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;padding-top:18px;padding-bottom:18px;font-size:12px;color:var(--argento);text-transform:uppercase}}
/* Sections */
section{{padding:clamp(80px,11vw,160px) 0}}
.head{{display:grid;grid-template-columns:repeat(12,1fr);gap:24px;align-items:end;margin-bottom:56px}}
.head .label{{grid-column:1/-1}}
.head h2{{grid-column:1/8}}
.head p{{grid-column:9/13;margin:0;opacity:.78;max-width:42ch}}
.svcs{{list-style:none;margin:0;padding:0;border-top:1px solid var(--verdaccio)}}
.svc{{display:grid;grid-template-columns:56px 56px 1fr 220px;gap:28px;align-items:start;padding:30px 0;border-bottom:1px solid var(--verdaccio)}}
.svc-n{{font-size:13px;color:var(--argento);padding-top:6px}}
.svc .ico{{color:var(--bianco)}}
.svc h3{{font-size:clamp(24px,2.2vw,32px);line-height:1.1;margin-bottom:8px}}
.svc-t{{min-width:0}}
.svc-t p{{margin:0;max-width:62ch;opacity:.75}}
.svc-d{{display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin:4px 0 0;font-size:13px;text-transform:uppercase}}
.svc-d span:first-child{{color:var(--argento)}}
.method{{background:var(--verdaccio)}}
.steps{{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:32px;border-top:1px solid var(--argento);padding-top:32px}}
.steps span{{color:var(--argento);font-size:13px}}
.steps h3{{font-size:30px;margin:12px 0 10px}}
.steps p{{margin:0;opacity:.78;font-size:16px}}
/* Avant / après */
.ba{{position:relative;--pos:50%;aspect-ratio:16/9;overflow:hidden;background:#000;max-width:100%}}
.ba img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 38%}}
.ba .after{{position:absolute;inset:0;clip-path:inset(0 0 0 var(--pos))}}
.ba .bar{{position:absolute;top:0;bottom:0;left:var(--pos);width:1px;background:var(--bianco);pointer-events:none}}
.ba .knob{{position:absolute;top:50%;left:var(--pos);transform:translate(-50%,-50%);width:54px;height:54px;border:1px solid var(--bianco);background:rgba(13,15,14,.6);display:grid;place-items:center;pointer-events:none}}
.ba input{{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:ew-resize;margin:0}}
.ba .tag{{position:absolute;top:22px;font-size:12px;color:var(--bianco)}}
.ba .t1{{left:24px}}.ba .t2{{right:24px}}
.ba-cap{{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:16px;font-size:12px;color:var(--argento);text-transform:uppercase}}
/* Réalisations */
.works{{display:grid;grid-template-columns:repeat(12,1fr);gap:24px}}
.work{{margin:0;min-width:0}}
.work img{{width:100%;aspect-ratio:4/5;object-fit:cover}}
.w0{{grid-column:1/5}}.w1{{grid-column:5/13}}.w1 img,.w3 img{{aspect-ratio:4/3}}.w2{{grid-column:1/6}}.w3{{grid-column:6/13}}
.work figcaption{{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding-top:14px;border-top:1px solid var(--verdaccio);margin-top:14px;flex-wrap:wrap}}
.opera i{{font-family:var(--serif);font-size:26px}}.opera .mono{{margin-left:10px;font-size:14px}}
.work .cap{{font-size:12px;color:var(--argento);text-transform:uppercase}}
/* Atelier */
.atelier .grid{{display:grid;grid-template-columns:repeat(12,1fr);gap:24px;align-items:center}}
.atelier figure{{grid-column:1/6;margin:0}}
.atelier figure img{{aspect-ratio:4/5;object-fit:cover;width:100%}}
.atelier .txt{{grid-column:7/13}}
.atelier .txt p{{opacity:.82;max-width:60ch}}
/* Avis */
.avis{{background:var(--verde)}}
.quotes{{display:grid;grid-template-columns:repeat(3,1fr);gap:48px;border-top:1px solid rgba(238,237,231,.4);padding-top:40px}}
blockquote{{margin:0}}
blockquote p{{font:italic 400 clamp(22px,2vw,28px)/1.3 var(--serif);margin:0 0 24px}}
blockquote footer b{{display:block;font-weight:500}}
blockquote footer span{{font-size:12px;text-transform:uppercase;opacity:.75}}
/* Devis */
.devis .grid{{display:grid;grid-template-columns:repeat(12,1fr);gap:24px}}
.devis .intro{{grid-column:1/5}}
.devis form{{grid-column:6/13;display:grid;grid-template-columns:1fr 1fr;gap:22px 24px}}
.field{{display:flex;flex-direction:column;gap:8px;min-width:0}}
.field.full{{grid-column:1/-1}}
.field label{{font:600 11px/1 var(--sans);font-stretch:125%;letter-spacing:.2em;text-transform:uppercase;color:var(--argento)}}
.field input,.field select,.field textarea{{background:transparent;border:0;border-bottom:1px solid var(--argento);color:var(--bianco);font:400 17px/1.4 var(--sans);padding:10px 0;border-radius:0}}
.field select option{{background:var(--nero)}}
.field input:focus,.field select:focus,.field textarea:focus{{outline:none;border-bottom-color:var(--bianco)}}
.field textarea{{min-height:110px;resize:vertical}}
.form-foot{{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}}
.form-foot small{{color:var(--argento);font-size:13px;max-width:44ch}}
.ok{{grid-column:1/-1;border:1px solid var(--argento);padding:18px 20px}}
.contact-list{{list-style:none;padding:0;margin:36px 0 0;display:grid;gap:18px}}
.contact-list li{{display:flex;gap:14px;align-items:flex-start}}
.contact-list .ico{{flex:none;color:var(--argento)}}
/* Pied de page */
.foot{{border-top:1px solid var(--argento);padding:64px 0 calc(40px + env(safe-area-inset-bottom,0px))}}
.foot .grid{{display:grid;grid-template-columns:repeat(12,1fr);gap:24px}}
.foot .brand{{grid-column:1/5}}.foot .brand svg{{height:110px;width:auto}}
.foot .brand p{{font:italic 400 20px var(--serif);color:var(--argento);margin:22px 0 0}}
.foot nav{{grid-column:span 2;display:flex;flex-direction:column;gap:10px;font-size:15px}}
.foot nav a{{text-decoration:none;opacity:.8}}.foot nav a:hover{{opacity:1}}
.foot nav .label{{margin-bottom:8px}}
.legal{{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-top:64px;padding-top:20px;border-top:1px solid var(--verdaccio);font-size:12px;color:var(--argento);text-transform:uppercase}}
.note-proto{{font:12px/1.5 var(--mono);color:var(--argento);text-align:center;padding:12px var(--gut);border-top:1px solid var(--verdaccio)}}
/* Responsive */
@media (max-width:1080px){{
  .head h2{{grid-column:1/-1}}.head p{{grid-column:1/-1}}
  .svc{{grid-template-columns:40px 1fr;gap:12px 18px}}
  .svc .ico{{grid-column:2;grid-row:1}}.svc-n{{grid-row:1}}
  .svc-t{{grid-column:1/-1}}.svc-d{{grid-column:1/-1;flex-direction:row;justify-content:space-between;align-items:center}}
  .steps{{grid-template-columns:1fr 1fr}}
  .quotes{{grid-template-columns:1fr}}
  .atelier figure,.atelier .txt,.devis .intro,.devis form{{grid-column:1/-1}}
  .foot .brand{{grid-column:1/-1}}.foot nav{{grid-column:span 6}}
}}
@media (max-width:820px){{
  .nav{{position:fixed;inset:84px 0 auto;flex-direction:column;align-items:flex-start;gap:24px;padding:28px var(--pad) 36px;background:var(--nero);border-bottom:1px solid var(--verdaccio);transform:translateY(-130%);transition:transform .35s}}
  .nav.open{{transform:none}}
  .burger{{display:block}}
  .works{{grid-template-columns:1fr}}.w0,.w1,.w2,.w3{{grid-column:1/-1}}
  .devis form{{grid-template-columns:1fr}}
  .ba{{aspect-ratio:4/5}}
  .hero h1{{max-width:none}}
}}
@media (prefers-reduced-motion:reduce){{*{{transition:none!important;scroll-behavior:auto!important}}}}
</style>
</head>
<body>
<header class="top" id="top">
  <div class="wrap">
    <a class="logo" href="#" aria-label="Arte Automobili — accueil">{logo_svg("logo-principal", B)}</a>
    <button class="burger" id="burger" aria-expanded="false" aria-controls="nav" aria-label="Ouvrir le menu">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8h18M3 16h18"/></svg></button>
    <nav class="nav" id="nav" aria-label="Navigation principale">
      <a href="#prestations">Prestations</a><a href="#methode">Méthode</a><a href="#realisations">Réalisations</a><a href="#atelier">L'atelier</a>
      <a class="btn btn-p" href="#devis">Demander un devis</a>
    </nav>
  </div>
</header>

<main>
  <section class="hero" aria-label="Présentation">
    <img src="assets/img/hero.jpg" alt="Coupé noir en studio, reflets de lames de lumière sur la carrosserie (rendu d'intention)" width="2400" height="1200" fetchpriority="high">
    <div class="wrap">
      <p class="label">Atelier de detailing automobile</p>
      <h1>Le reflet <i>du premier jour.</i></h1>
      <p class="sub">Correction de vernis, protection céramique et soin de l'habitacle. À la main, une voiture à la fois, sous une lumière qui ne laisse rien passer.</p>
      <div class="cta">
        <a class="btn btn-p" href="#devis">Demander un devis {icon('fleche', 18)}</a>
        <a class="btn btn-s" href="#realisations">Voir les réalisations</a>
      </div>
    </div>
    <div class="hero-foot"><div class="wrap mono"><span>Sur rendez-vous · [Ville]</span><span>Devis après inspection</span><span>{SIGNATURE}</span></div></div>
  </section>

  <section id="prestations">
    <div class="wrap">
      <div class="head"><p class="label">Prestations</p><h2>Six savoir-faire, <i>un seul protocole.</i></h2>
        <p>Chaque prestation commence par une inspection sous lumière d'atelier. Les tarifs dépendent du gabarit et de l'état du véhicule.</p></div>
      <ul class="svcs">{svc}</ul>
    </div>
  </section>

  <section class="method" id="methode">
    <div class="wrap">
      <div class="head"><p class="label">La méthode</p><h2>Quatre temps, <i>aucun raccourci.</i></h2></div>
      <ol class="steps">{meth}</ol>
    </div>
  </section>

  <section id="avant-apres">
    <div class="wrap">
      <div class="head"><p class="label">Avant / après</p><h2>Même lumière, <i>même angle.</i></h2>
        <p>Faites glisser le curseur. À gauche, un vernis voilé par les lavages automatiques ; à droite, le même panneau après une correction en deux étapes.</p></div>
      <div class="ba" id="ba">
        <img src="assets/img/avant.jpg" alt="Avant : vernis terne, reflets flous" loading="lazy">
        <div class="after"><img src="assets/img/apres.jpg" alt="Après : vernis corrigé, reflets nets" loading="lazy"></div>
        <span class="tag t1 label">Avant</span><span class="tag t2 label">Après</span>
        <span class="bar"></span><span class="knob"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EEEDE7" stroke-width="1.5"><path d="m9 6-6 6 6 6M15 6l6 6-6 6"/></svg></span>
        <input type="range" id="ba-range" min="0" max="100" value="50" aria-label="Comparer avant et après">
      </div>
      <p class="ba-cap mono"><span>Opera N° 0052</span><span>Correction 2 étapes · 12 h d'atelier</span></p>
    </div>
  </section>

  <section id="realisations">
    <div class="wrap">
      <div class="head"><p class="label">Réalisations</p><h2>Chaque voiture <i>a son numéro.</i></h2>
        <p>À la restitution, chaque véhicule reçoit son numéro d'Opera et la fiche détaillée de ses interventions.</p></div>
      <div class="works">{gal}</div>
    </div>
  </section>

  <section class="atelier" id="atelier">
    <div class="wrap grid">
      <figure><img src="assets/img/capot.jpg" alt="Capot noir sous les lames de lumière de l'atelier (rendu d'intention)" loading="lazy"></figure>
      <div class="txt"><p class="label">L'atelier</p><h2 style="margin:18px 0 28px">Une automobile se juge <i>à son reflet.</i></h2>
        {''.join(f'<p>{x}</p>' for x in PITCH_LONG)}</div>
    </div>
  </section>

  <section class="avis" id="avis">
    <div class="wrap">
      <div class="head"><p class="label" style="color:{B};opacity:.75">Avis clients</p><h2>Ils en parlent <i>mieux que nous.</i></h2></div>
      <div class="quotes">{avis}</div>
    </div>
  </section>

  <section class="devis" id="devis">
    <div class="wrap grid">
      <div class="intro"><p class="label">Devis et rendez-vous</p><h2 style="margin:18px 0 22px">Parlons <i>de votre voiture.</i></h2>
        <p style="opacity:.8">Décrivez le véhicule et ce que vous souhaitez. Nous vous rappelons pour fixer une inspection ; le devis définitif est établi sur place.</p>
        <ul class="contact-list mono">
          <li>{icon('telephone', 22)}<span>+33 6 00 00 00 00</span></li>
          <li>{icon('email', 22)}<span>contact@arteautomobili.fr</span></li>
          <li>{icon('localisation', 22)}<span>[Adresse de l'atelier]<br>Sur rendez-vous, du lundi au samedi</span></li>
        </ul></div>
      <form id="form" novalidate>
        <div class="field"><label for="f-nom">Nom</label><input id="f-nom" name="nom" autocomplete="name" required></div>
        <div class="field"><label for="f-tel">Téléphone</label><input id="f-tel" name="tel" type="tel" autocomplete="tel" required></div>
        <div class="field"><label for="f-mail">E-mail</label><input id="f-mail" name="mail" type="email" autocomplete="email"></div>
        <div class="field"><label for="f-veh">Véhicule</label><input id="f-veh" name="vehicule" placeholder="Marque, modèle, année"></div>
        <div class="field"><label for="f-svc">Prestation</label><select id="f-svc" name="prestation"><option>Je ne sais pas encore</option>{opts}</select></div>
        <div class="field"><label for="f-date">Période souhaitée</label><input id="f-date" name="periode" placeholder="Ex. : semaine du 21 octobre"></div>
        <div class="field full"><label for="f-msg">Message</label><textarea id="f-msg" name="message" placeholder="État du véhicule, attentes, contraintes"></textarea></div>
        <div class="form-foot"><small>Vos données servent uniquement à vous recontacter au sujet de votre demande.</small>
          <button class="btn btn-p" type="submit">Envoyer la demande {icon('fleche', 18)}</button></div>
        <p class="ok" id="ok" hidden>Merci. Votre demande est enregistrée sur cette page de démonstration ; sur le site en ligne, elle sera transmise à l'atelier.</p>
      </form>
    </div>
  </section>
</main>

<footer class="foot">
  <div class="wrap">
    <div class="grid">
      <div class="brand">{logo_svg("logo-vertical", B)}<p>{SIGNATURE}</p></div>
      <nav aria-label="Prestations"><span class="label">Prestations</span>{''.join(f'<a href="#prestations">{p["nom"]}</a>' for p in PRESTATIONS[:4])}</nav>
      <nav aria-label="Atelier"><span class="label">Atelier</span><a href="#methode">Méthode</a><a href="#realisations">Réalisations</a><a href="#avis">Avis</a><a href="#atelier">L'atelier</a></nav>
      <nav aria-label="Contact"><span class="label">Contact</span><a href="#devis">Demander un devis</a><a href="#devis">+33 6 00 00 00 00</a><a href="#">Instagram</a></nav>
    </div>
    <div class="legal mono"><span>© 2026 Arte Automobili</span><span><a href="#">Mentions légales</a> · <a href="#">Confidentialité</a></span></div>
  </div>
</footer>
<p class="note-proto">Prototype · les visuels sont des rendus 3D d'intention, à remplacer par les photographies de l'atelier.</p>

<script>
const top_=document.getElementById('top');
const onScroll=()=>top_.classList.toggle('solid',scrollY>40);onScroll();addEventListener('scroll',onScroll,{{passive:true}});
const burger=document.getElementById('burger'),nav=document.getElementById('nav');
burger.addEventListener('click',()=>{{const o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o);}});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{{nav.classList.remove('open');burger.setAttribute('aria-expanded',false);}}));
const ba=document.getElementById('ba'),r=document.getElementById('ba-range');
r.addEventListener('input',()=>ba.style.setProperty('--pos',r.value+'%'));
document.getElementById('form').addEventListener('submit',e=>{{e.preventDefault();const f=e.target;
  if(!f.nom.value.trim()||!f.tel.value.trim()){{(f.nom.value.trim()?f.tel:f.nom).focus();return;}}
  document.getElementById('ok').hidden=false;}});
</script>
</body>
</html>
"""


def main():
    (ASSETS / "img").mkdir(parents=True, exist_ok=True)
    (ASSETS / "fonts").mkdir(parents=True, exist_ok=True)
    for k, (f, w) in IMAGES.items():
        im = Image.open(REND / f).convert("RGB")
        if im.width > w:
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        im.save(ASSETS / "img" / f"{k}.jpg", quality=84, optimize=True, progressive=True)
    shutil.copy(ROOT / "07_reseaux-sociaux/apercus-png/16-image-partage-og.png", ASSETS / "img" / "og.png")
    Image.open(ASSETS / "img" / "og.png").convert("RGB").save(ASSETS / "img" / "og.jpg", quality=86)
    (ASSETS / "img" / "og.png").unlink()
    shutil.copy(ROOT / "02_logo/icones/favicon.svg", ASSETS / "favicon.svg")
    shutil.copy(ROOT / "02_logo/icones/apple-touch-icon.png", ASSETS / "apple-touch-icon.png")
    src = ROOT / "03_typographie" / "polices"
    for s, d in [("BodoniModa[opsz,wght].ttf", "BodoniModa"), ("BodoniModa-Italic[opsz,wght].ttf", "BodoniModa-Italic"),
                 ("Archivo[wdth,wght].ttf", "Archivo"), ("DMMono-Regular.ttf", "DMMono-Regular"), ("DMMono-Light.ttf", "DMMono-Light")]:
        f = TTFont(src / s)
        f.flavor = "woff2"
        f.save(ASSETS / "fonts" / f"{d}.woff2")
    (OUT / "index.html").write_text(page(f"<style>{FONT_FACES}</style>"))
    screenshots()
    print("site ok")


def screenshots():
    """Aperçus du prototype (ordinateur et mobile) utilisés par le guide."""
    import json
    import subprocess
    ap = OUT / "apercus"
    ap.mkdir(exist_ok=True)
    tmp_d, tmp_m = ap / "_desktop.png", ap / "_mobile.png"
    jobs = [{"in": str(OUT / "index.html"), "out": str(tmp_d), "w": 1440, "h": 900, "fullsize": True},
            {"in": str(OUT / "index.html"), "out": str(tmp_m), "w": 390, "h": 844, "fullsize": True, "scale": 2}]
    jf = ap / "_jobs.json"
    jf.write_text(json.dumps(jobs))
    subprocess.run(["node", str(ROOT / "_source" / "render.mjs"), str(jf)], check=True, stdout=subprocess.DEVNULL)
    jf.unlink()
    d = Image.open(tmp_d).convert("RGB")
    d.save(ap / "accueil-desktop-pleine-page.jpg", quality=82)
    d.crop((0, 0, 1440, 900)).save(ap / "accueil-desktop-hero.jpg", quality=88)
    m = Image.open(tmp_m).convert("RGB")
    m.save(ap / "accueil-mobile-pleine-page.jpg", quality=80)
    m.crop((0, 0, 780, 1688)).save(ap / "accueil-mobile-hero.jpg", quality=88)
    tmp_d.unlink()
    tmp_m.unlink()


if __name__ == "__main__":
    main()
