"""Maquette du site e-commerce FUORICLASSE : HTML/CSS/JS statique, autonome (dossier 11_site-ecommerce/site).

Pages : accueil, collection filtrable, 17 fiches produit, La Maison, panier. Les images viennent des
visuels produits et des rendus 3D d'intention ; les polices sont converties en WOFF2.
"""
import json
import shutil

from fontTools.ttLib import TTFont
from PIL import Image

import brand as B
import collection as CO
import kit as K
import textes as TX

OUT = K.ROOT / "11_site-ecommerce"
SITE = OUT / "site"
A = SITE / "assets"


def assets():
    if SITE.exists():
        shutil.rmtree(SITE)
    (A / "img" / "produits").mkdir(parents=True)
    (A / "fonts").mkdir(parents=True)
    for f in ["Playfair[opsz,wdth,wght].ttf", "Playfair-Italic[opsz,wdth,wght].ttf", "MonaSans[wdth,wght].ttf", "GeistMono[wght].ttf"]:
        t = TTFont(K.FONTS / f)
        t.flavor = "woff2"
        t.save(A / "fonts" / f.replace(".ttf", ".woff2").replace("[", "-").replace("]", "").replace(",", "-"))
    prod = K.ROOT / "05_collection" / "produits"
    for p in CO.P:
        for c in p["colors"]:
            for v in ["front"] + (["back"] if "back" in p else []):
                n = CO.img_name(p, c, v)
                Image.open(prod / f"{n}.jpg").resize((800, 1000), Image.LANCZOS).save(A / "img" / "produits" / f"{n}.jpg", quality=82, optimize=True)
    for src, dst, w in [(K.ROOT / "06_photographie/rendus-3d/lieu-01-penthouse-heure-bleue.jpg", "hero-penthouse.jpg", 2000),
                        (K.ROOT / "06_photographie/rendus-3d/lieu-03-salle-du-conseil.jpg", "salle-du-conseil.jpg", 1400),
                        (K.ROOT / "06_photographie/rendus-3d/lieu-04-rooftop.jpg", "rooftop.jpg", 1600),
                        (K.ROOT / "06_photographie/rendus-3d/lieu-02-bureau-panoramique.jpg", "bureau.jpg", 1400),
                        (K.ROOT / "06_photographie/rendus-3d/lieu-05-gt-devant-facade.jpg", "gt-facade.jpg", 1400),
                        (K.ROOT / "07_packaging/rendus-3d/packaging-01-ensemble.jpg", "packaging.jpg", 1400),
                        (K.ROOT / "05_collection/produits/details/a01-broderie-mot-symbole.jpg", "detail-broderie.jpg", 1000),
                        (K.ROOT / "05_collection/produits/details/a14-tableau-departures.jpg", "detail-departures.jpg", 1000),
                        (K.ROOT / "05_collection/produits/details/a17-jacquard-gessato.jpg", "detail-gessato.jpg", 1000)]:
        im = Image.open(src)
        im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(A / "img" / dst, quality=82, optimize=True)
    for name in ["wordmark", "monogram", "key"]:
        (A / f"fc-{name}.svg").write_text(B.logo_svg(name, fill="currentColor"))
    shutil.copy(K.ROOT / "02_logo/icones/favicon.svg", A / "favicon.svg")


CSS = """
@font-face{font-family:'Playfair';src:url(fonts/Playfair-opsz-wdth-wght.woff2) format('woff2');font-weight:300 900;font-stretch:87.5% 112.5%;font-display:swap}
@font-face{font-family:'Playfair';src:url(fonts/Playfair-Italic-opsz-wdth-wght.woff2) format('woff2');font-weight:300 900;font-style:italic;font-stretch:87.5% 112.5%;font-display:swap}
@font-face{font-family:'Mona Sans';src:url(fonts/MonaSans-wdth-wght.woff2) format('woff2');font-weight:200 900;font-stretch:75% 125%;font-display:swap}
@font-face{font-family:'Geist Mono';src:url(fonts/GeistMono-wght.woff2) format('woff2');font-weight:100 900;font-display:swap}
:root{--nero:#0E0D0C;--crema:#EFE9DE;--grafite:#3A3B3D;--talpa:#8B7F72;--cioccolato:#3D2A21;--blu:#141B2A;--barolo:#5E1B27;--pietra:#D9D1C3;--crema-2:#E4DCCD;
--serif:'Playfair',Georgia,serif;--sans:'Mona Sans','Helvetica Neue',Arial,sans-serif;--mono:'Geist Mono',ui-monospace,monospace;--pad:clamp(16px,4vw,56px)}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
html,body{overflow-x:clip}
body{background:var(--crema);color:var(--nero);font-family:var(--sans);font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.lab{font-family:var(--sans);font-stretch:125%;font-weight:500;font-size:11px;letter-spacing:.3em;text-transform:uppercase}
.mono{font-family:var(--mono);font-size:12px;letter-spacing:.04em;text-transform:uppercase}
.serif{font-family:var(--serif);font-variation-settings:'opsz' 900;font-weight:400;letter-spacing:-.01em}
.serif i,.serif em{font-style:italic}
.wide{font-family:var(--serif);font-stretch:112.5%;font-variation-settings:'opsz' 30;font-weight:440;letter-spacing:.12em;text-transform:uppercase}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:16px 28px;background:var(--nero);color:var(--crema);font-family:var(--sans);font-stretch:125%;font-weight:500;font-size:11px;letter-spacing:.3em;text-transform:uppercase;transition:background .2s}
.btn:hover{background:var(--barolo)}
.btn.ghost{background:transparent;color:inherit;border:1px solid currentColor}
.btn.ghost:hover{background:var(--nero);color:var(--crema)}
:focus-visible{outline:2px solid var(--barolo);outline-offset:3px}
/* bandeau + en-tête */
.bar{background:var(--nero);color:var(--crema);text-align:center;padding:9px var(--pad);font-family:var(--mono);font-size:11px;letter-spacing:.08em}
header.top{position:sticky;top:0;z-index:20;background:rgba(239,233,222,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--crema-2)}
.nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:18px var(--pad)}
.nav ul{display:flex;gap:22px;list-style:none;white-space:nowrap}
.nav ul.lab,.nav .right.lab{font-size:10.5px;letter-spacing:.2em}
.nav .logo{display:block;width:clamp(150px,16vw,220px);line-height:0}
.nav .right{display:flex;justify-content:flex-end;gap:22px;align-items:center}
.nav .burger{display:none}
.bagcount{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:9px;background:var(--barolo);color:var(--crema);font-size:10px;margin-left:6px;letter-spacing:0}
@media(max-width:1180px){.nav ul,.nav .right .hide-m{display:none}.nav .burger{display:block}.nav{grid-template-columns:auto 1fr auto}.nav .logo{margin:0 auto}}
/* héros */
.hero{position:relative;height:min(88vh,860px);min-height:520px;color:var(--crema);overflow:hidden}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:62% center}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,13,12,.2),rgba(14,13,12,0) 35%,rgba(14,13,12,.72))}
.hero .in{position:absolute;left:var(--pad);right:var(--pad);bottom:clamp(32px,7vh,72px);z-index:2;display:flex;justify-content:space-between;align-items:flex-end;gap:30px;flex-wrap:wrap}
.hero h1{font-size:clamp(64px,10vw,152px);line-height:.92}
.hero .tag{position:absolute;right:var(--pad);top:22px;z-index:2;font-family:var(--mono);font-size:10px;opacity:.55}
.hero .btn{background:var(--crema);color:var(--nero)}
.hero .btn:hover{background:var(--barolo);color:var(--crema)}
/* sections */
section{padding:clamp(56px,9vw,120px) var(--pad)}
.head{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;margin-bottom:clamp(28px,4vw,48px);flex-wrap:wrap}
.head h2{font-size:clamp(40px,5vw,72px);line-height:1}
.head p{max-width:520px;color:var(--grafite)}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(10px,1.4vw,20px)}
@media(max-width:1100px){.grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:760px){.grid{grid-template-columns:repeat(2,1fr)}}
.card{display:block}
.card .im{position:relative;background:var(--pietra);aspect-ratio:4/5;overflow:hidden}
.card .im img{width:100%;height:100%;object-fit:cover;transition:opacity .35s,transform .6s}
.card .im img.alt{position:absolute;inset:0;opacity:0}
.card:hover .im img.alt{opacity:1}
.card:hover .im img{transform:scale(1.02)}
.card .meta{display:flex;justify-content:space-between;gap:12px;padding:12px 2px 0}
.card .nm{font-family:var(--serif);font-stretch:112.5%;font-variation-settings:'opsz' 30;font-weight:440;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
.card .pr{font-family:var(--mono);font-size:12px}
.card .sw{display:flex;gap:5px;padding:8px 2px 0}
.card .sw i{width:10px;height:10px;border:1px solid rgba(0,0,0,.18)}
.card .badge{position:absolute;left:10px;top:10px;background:var(--crema);padding:5px 8px;font-family:var(--mono);font-size:10px}
.fam{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(10px,1.4vw,20px)}
@media(max-width:860px){.fam{grid-template-columns:1fr}}
.fam a{position:relative;display:block;aspect-ratio:3/4;overflow:hidden;color:var(--crema)}
.fam a img{width:100%;height:100%;object-fit:cover;transition:transform .8s}
.fam a:hover img{transform:scale(1.03)}
.fam a .t{position:absolute;left:24px;right:24px;bottom:24px;z-index:2}
.fam a::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,13,12,0) 45%,rgba(14,13,12,.75))}
.fam .t h3{font-size:clamp(32px,3vw,44px);line-height:1}
.dark{background:var(--nero);color:var(--crema)}
.dark .head p{color:rgba(239,233,222,.7)}
.hours{display:grid;grid-template-columns:repeat(5,1fr);border-top:1px solid rgba(239,233,222,.2)}
@media(max-width:900px){.hours{grid-template-columns:1fr 1fr}}
.hours div{padding:26px 20px 20px 0;border-bottom:1px solid rgba(239,233,222,.2)}
.hours b{display:block;font-family:var(--mono);font-weight:400;font-size:clamp(34px,3.6vw,52px);color:#b55a6a;letter-spacing:-.02em}
.hours span{font-family:var(--serif);font-style:italic;font-size:20px}
.split{display:grid;grid-template-columns:1fr 1fr;min-height:640px}
@media(max-width:860px){.split{grid-template-columns:1fr}}
.split .im{background-size:cover;background-position:center;min-height:380px}
.split .tx{padding:clamp(40px,6vw,90px);display:flex;flex-direction:column;justify-content:center;gap:22px}
.split .tx h2{font-size:clamp(40px,4.6vw,68px);line-height:1}
.manif{text-align:center;padding:clamp(80px,12vw,160px) var(--pad)}
.manif p{font-family:var(--serif);font-variation-settings:'opsz' 900;font-size:clamp(22px,2.6vw,36px);line-height:1.35;max-width:980px;margin:0 auto}
.news{display:flex;gap:10px;max-width:520px;margin-top:10px}
.news input{flex:1;background:transparent;border:0;border-bottom:1px solid currentColor;padding:12px 0;font:inherit;color:inherit}
footer{background:var(--nero);color:var(--crema);padding:clamp(56px,7vw,90px) var(--pad) 30px}
.fcols{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px}
@media(max-width:860px){.fcols{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.fcols>div:first-child{grid-column:1/-1}.fcols svg{max-width:200px;height:auto}}
footer ul{list-style:none;display:grid;gap:8px;font-size:14px;opacity:.85}
.fbot{display:flex;justify-content:space-between;margin-top:60px;padding-top:20px;border-top:1px solid rgba(239,233,222,.15);font-family:var(--mono);font-size:11px;opacity:.6;flex-wrap:wrap;gap:12px}
/* collection */
.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px}
.chip{border:1px solid var(--nero);padding:10px 16px;font-family:var(--sans);font-stretch:125%;font-size:10.5px;letter-spacing:.24em;text-transform:uppercase}
.chip[aria-pressed=true]{background:var(--nero);color:var(--crema)}
.crumbs{font-family:var(--mono);font-size:11px;color:var(--talpa);padding:18px var(--pad) 0}
/* fiche produit */
.pdp{display:grid;grid-template-columns:1.25fr 1fr;gap:clamp(24px,4vw,64px);padding:24px var(--pad) 80px}
@media(max-width:900px){.pdp{grid-template-columns:1fr}}
.gal{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.gal .im{background:var(--pietra);aspect-ratio:4/5;overflow:hidden}
.gal .im img{width:100%;height:100%;object-fit:cover}
.gal .im.wide{grid-column:1/-1;aspect-ratio:16/10}
@media(max-width:900px){.gal{grid-template-columns:1fr;grid-auto-flow:column;grid-auto-columns:88%;overflow-x:auto;scroll-snap-type:x mandatory}.gal .im{scroll-snap-align:start}.gal .im.wide{grid-column:auto;aspect-ratio:4/5}}
.buy{position:sticky;top:100px;align-self:start;display:flex;flex-direction:column;gap:22px}
.buy h1{font-size:clamp(26px,2.4vw,34px)}
.buy .price{font-family:var(--mono);font-size:16px}
.opts{display:flex;gap:10px;flex-wrap:wrap}
.opts button.c{width:34px;height:34px;border:1px solid rgba(0,0,0,.2);outline-offset:3px}
.opts button.c[aria-pressed=true]{outline:1px solid var(--nero)}
.opts button.s{min-width:52px;padding:11px 0;border:1px solid var(--crema-2);font-family:var(--mono);font-size:12px}
.opts button.s[aria-pressed=true]{border-color:var(--nero);background:var(--nero);color:var(--crema)}
details{border-top:1px solid var(--crema-2);padding:16px 0}
details:last-of-type{border-bottom:1px solid var(--crema-2)}
summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;font-family:var(--sans);font-stretch:125%;font-size:11px;letter-spacing:.24em;text-transform:uppercase}
summary::after{content:"+"}details[open] summary::after{content:"–"}
details p{margin-top:12px;color:var(--grafite);font-size:14px}
.note{font-size:13px;color:var(--grafite);display:flex;gap:10px;align-items:center}
/* tiroir panier */
.drawer{position:fixed;top:0;right:0;bottom:0;width:min(420px,100%);background:var(--crema);z-index:50;transform:translateX(100%);transition:transform .35s,visibility .35s;display:flex;flex-direction:column;visibility:hidden}
.drawer.open{transform:none;visibility:visible;box-shadow:-20px 0 60px rgba(0,0,0,.15)}
.drawer .dh{display:flex;justify-content:space-between;padding:22px 24px;border-bottom:1px solid var(--crema-2)}
.drawer .items{flex:1;overflow:auto;padding:20px 24px;display:grid;gap:16px;align-content:start}
.drawer .it{display:grid;grid-template-columns:80px 1fr auto;gap:14px;font-size:13px}
.drawer .it img{background:var(--pietra)}
.drawer .df{padding:22px 24px;border-top:1px solid var(--crema-2);display:grid;gap:14px}
.veil{position:fixed;inset:0;background:rgba(14,13,12,.35);z-index:40;opacity:0;pointer-events:none;transition:opacity .3s}
.veil.open{opacity:1;pointer-events:auto}
.intent{font-family:var(--mono);font-size:10px;opacity:.5}
"""

JS = """
const KEY='fc-bag';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return []}};
const save=b=>{try{localStorage.setItem(KEY,JSON.stringify(b))}catch(e){}};
let bag=load();
const eur=n=>'€ '+n.toLocaleString('fr-BE');
function renderBag(){
  document.querySelectorAll('[data-bagcount]').forEach(e=>e.textContent=bag.reduce((a,i)=>a+i.q,0));
  const box=document.querySelector('.drawer .items'); if(!box) return;
  box.innerHTML=bag.length?bag.map((i,k)=>`<div class="it"><img src="${i.img}" alt=""><div><div class="wide" style="font-size:11px">${i.name}</div><div class="mono" style="color:var(--talpa);margin-top:4px">${i.color} · ${i.size}</div><button class="mono" data-rm="${k}" style="margin-top:8px;text-decoration:underline">Retirer</button></div><div class="mono">${eur(i.price*i.q)}</div></div>`).join(''):'<p style="color:var(--grafite)">Votre sélection est vide.</p>';
  const t=document.querySelector('[data-total]'); if(t) t.textContent=eur(bag.reduce((a,i)=>a+i.price*i.q,0));
  box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{bag.splice(+b.dataset.rm,1);save(bag);renderBag();});
}
function openBag(o){document.querySelector('.drawer').classList.toggle('open',o);document.querySelector('.veil').classList.toggle('open',o);}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-openbag]')){e.preventDefault();openBag(true);}
  if(e.target.closest('[data-closebag]')||e.target.classList.contains('veil'))openBag(false);
  const f=e.target.closest('[data-filter]');
  if(f){document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',x===f));
    document.querySelectorAll('.grid .card').forEach(c=>c.style.display=(f.dataset.filter==='all'||c.dataset.fam===f.dataset.filter)?'':'none');}
});
const P=window.PRODUCT;
if(P){
  let color=P.colors[0], size=null;
  const main=document.querySelectorAll('[data-main]');
  document.querySelectorAll('button.c').forEach(b=>b.onclick=()=>{color=P.colors[+b.dataset.i];
    document.querySelectorAll('button.c').forEach(x=>x.setAttribute('aria-pressed',x===b));
    document.querySelector('[data-colorname]').textContent=color.name;
    main.forEach((m,k)=>{const src=k===0?color.front:(color.back||null); if(src) m.src=src;});});
  document.querySelectorAll('button.s').forEach(b=>b.onclick=()=>{size=b.textContent;document.querySelectorAll('button.s').forEach(x=>x.setAttribute('aria-pressed',x===b));
    document.querySelector('[data-add]').textContent='Ajouter au panier';});
  document.querySelector('[data-add]').onclick=()=>{
    if(!size){document.querySelector('[data-add]').textContent='Choisissez une taille';return;}
    bag.push({name:P.name,price:P.price,color:color.name,size,q:1,img:new URL(color.front,location.href).href});save(bag);renderBag();openBag(true);};
}
renderBag();
"""


def header(rel):
    return f"""<div class="bar">Livraison offerte dès € 250 · Retours sous 30 jours · Series A — 1000 exemplaires numérotés par pièce</div>
<header class="top"><nav class="nav" aria-label="Navigation principale">
<button class="burger lab" aria-label="Menu">Menu</button>
<ul class="lab"><li><a href="{rel}collezione.html">Collezione</a></li><li><a href="{rel}collezione.html#signature">Signature</a></li>
<li><a href="{rel}collezione.html#business">Business</a></li><li><a href="{rel}collezione.html#statement">Statement</a></li></ul>
<a class="logo" href="{rel}index.html" aria-label="FUORICLASSE — accueil">{B.logo_svg("wordmark", fill="currentColor", width=220)}</a>
<div class="right lab"><a class="hide-m" href="{rel}la-maison.html">La Maison</a><a class="hide-m" href="#">Compte</a>
<a href="#" data-openbag>Panier<span class="bagcount" data-bagcount>0</span></a></div></nav></header>"""


def footer(rel):
    return f"""<footer><div class="fcols">
<div><div style="width:260px;line-height:0">{B.logo_svg("wordmark", fill="currentColor", width=260)}</div>
<p class="serif" style="font-size:26px;margin:26px 0 8px"><i>Out of class. Never out of place.</i></p>
<form class="news" onsubmit="event.preventDefault();this.querySelector('button').textContent='Merci ✓'"><label class="lab" for="nl" style="position:absolute;left:-9999px">E-mail</label>
<input id="nl" type="email" placeholder="Votre e-mail — lettre aux membres" required><button class="btn">S'inscrire</button></form></div>
<div><div class="lab" style="margin-bottom:14px;opacity:.6">Collezione</div><ul><li><a href="{rel}collezione.html">Series A</a></li><li><a href="{rel}collezione.html#signature">Signature</a></li><li><a href="{rel}collezione.html#business">Business</a></li><li><a href="{rel}collezione.html#statement">Statement</a></li></ul></div>
<div><div class="lab" style="margin-bottom:14px;opacity:.6">La Maison</div><ul><li><a href="{rel}la-maison.html">Histoire</a></li><li><a href="{rel}la-maison.html#codice">Il Codice</a></li><li><a href="#">Journal</a></li><li><a href="#">Carrières</a></li></ul></div>
<div><div class="lab" style="margin-bottom:14px;opacity:.6">Service</div><ul><li><a href="#">Livraison & retours</a></li><li><a href="#">Guide des tailles</a></li><li><a href="#">Entretien</a></li><li><a href="#">Contact</a></li></ul></div></div>
<div class="fbot"><span>© MMXXVI FUORICLASSE — [raison sociale à compléter]</span><span>MILANO · LONDON · MONACO · PARIS · DUBAI</span><span>Maquette — visuels d'intention</span></div></footer>
<div class="veil"></div><aside class="drawer" aria-label="Panier"><div class="dh"><span class="lab">Votre sélection</span><button class="lab" data-closebag>Fermer</button></div>
<div class="items"></div><div class="df"><div style="display:flex;justify-content:space-between"><span class="lab">Total</span><span class="mono" data-total>€ 0</span></div>
<a class="btn" href="{rel}panier.html">Commander</a><span class="note">Livré dans la boîte Series A, papier de soie Gessato et carte numérotée.</span></div></aside>
<script src="{rel}assets/app.js"></script>"""


def doc(title, body, rel="", desc="FUORICLASSE — The new generation of success.", extra=""):
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{title}</title><meta name="description" content="{desc}"><link rel="icon" href="{rel}assets/favicon.svg">'
            f'<link rel="stylesheet" href="{rel}assets/style.css">{extra}</head><body>{header(rel)}<main>{body}</main>{footer(rel)}</body></html>')


def img(p, c, v="front", rel=""):
    return f"{rel}assets/img/produits/{CO.img_name(p, c, v)}.jpg"


def card(p, rel=""):
    c0 = p["colors"][0]
    alt_src = img(p, c0, "back", rel) if "back" in p else (img(p, p["colors"][1], "front", rel) if len(p["colors"]) > 1 else img(p, c0, "front", rel))
    sw = "".join(f'<i style="background:{c}" title="{CO.COLOR_NAMES[c]}"></i>' for c in p["colors"])
    badge = '<span class="badge">Nouveau</span>' if p["family"] == "statement" else ""
    return (f'<a class="card" data-fam="{p["family"]}" href="{rel}prodotto/{p["slug"]}.html"><div class="im">{badge}'
            f'<img src="{img(p, c0, rel=rel)}" alt="{p["name"]}, {CO.COLOR_NAMES[c0]}" loading="lazy"><img class="alt" src="{alt_src}" alt="" loading="lazy"></div>'
            f'<div class="meta"><span class="nm">{p["name"]}</span><span class="pr">€ {p["price"]:,}</span></div><div class="sw">{sw}</div></a>')


def home():
    feat = [CO.by_ref(r) for r in ["A03", "A07", "A14", "A12", "A06", "A16", "A08", "A05"]]
    hours = "".join(f'<div><b>{t.split(" — ")[0]}</b><span>{t.split(" — ")[1]}</span></div>' for t in TX.CAMPAGNES[2]["titres"])
    fams = [("signature", "Signature", "Firma", "img/produits/" + CO.img_name(CO.by_ref("A03"), B.NERO) + ".jpg"),
            ("business", "Business Culture", "Cultura d'impresa", "img/salle-du-conseil.jpg"),
            ("statement", "Statement", "Dichiarazione", "img/produits/" + CO.img_name(CO.by_ref("A16"), B.BAROLO) + ".jpg")]
    famh = "".join(f'<a href="collezione.html#{k}"><img src="assets/{im}" alt="" loading="lazy"><div class="t"><div class="lab" style="opacity:.8">{it}</div>'
                   f'<h3 class="serif">{n}</h3></div></a>' for k, n, it, im in fams)
    body = f"""
<section class="hero" style="padding:0"><img src="assets/img/hero-penthouse.jpg" alt="Penthouse à l'heure bleue (image d'intention)">
<span class="tag">Visuel d'intention — rendu 3D</span>
<div class="in"><div><div class="lab" style="margin-bottom:18px">Series A — Collezione 01</div><h1 class="serif">Out of<br><i>class.</i></h1></div>
<div style="max-width:380px"><p class="serif" style="font-size:26px;line-height:1.2;margin-bottom:22px"><i>Never out of place.</i></p><a class="btn" href="collezione.html">Découvrir la collection</a></div></div></section>
<section><div class="head"><h2 class="serif">Series <i>A</i></h2><p>Dix-sept pièces, trois familles, mille exemplaires numérotés de chacune. Le premier tour de table d'une marque qui habille ceux qui construisent.</p></div>
<div class="grid">{"".join(card(p) for p in feat)}</div><div style="text-align:center;margin-top:44px"><a class="btn ghost" href="collezione.html">Voir les 17 pièces</a></div></section>
<section style="padding-top:0"><div class="fam">{famh}</div></section>
<section class="dark"><div class="head"><h2 class="serif">Office <i>hours.</i></h2><p>Office hours are whenever the work is. Une journée de fondatrice ou de fondateur, une pièce pour chaque heure.</p></div>
<div class="hours">{hours}</div></section>
<div class="split"><div class="im" style="background-image:url(assets/img/detail-broderie.jpg)" role="img" aria-label="Broderie ton sur ton"></div>
<div class="tx"><div class="lab" style="color:var(--talpa)">The Quiet Class</div><h2 class="serif">Success doesn't <i>raise its voice.</i></h2>
<p style="color:var(--grafite);max-width:460px">Un mot-symbole brodé ton sur ton, 70 mm, à sa place. Reconnu à un mètre, pas à dix. C'est tout le propos.</p><a class="btn ghost" style="align-self:flex-start" href="collezione.html#signature">Les pièces Signature</a></div></div>
<section class="manif"><div class="lab" style="color:var(--talpa);margin-bottom:28px">Manifesto</div><p>{"<br>".join(TX.MANIFESTE[1:7])}</p>
<p style="margin-top:28px"><i>Out of class. Never out of place.</i></p></section>
<div class="split"><div class="tx" style="background:var(--nero);color:var(--crema)"><div class="lab" style="opacity:.6">L'arrivée</div><h2 class="serif">Livré comme <i>une clé.</i></h2>
<p style="opacity:.8;max-width:460px">Boîte noire mate, mot-symbole en vernis sélectif, papier de soie Gessato, sceau Barolo et carte numérotée. Chaque commande Series A porte son numéro sur mille.</p></div>
<div class="im" style="background-image:url(assets/img/packaging.jpg)" role="img" aria-label="Packaging (rendu 3D)"></div></div>
<section class="dark" style="position:relative;min-height:560px;background:url(assets/img/rooftop.jpg) center/cover"><div style="position:absolute;inset:0;background:rgba(14,13,12,.45)"></div>
<div style="position:relative;max-width:640px"><div class="lab">Departures</div><h2 class="serif" style="font-size:clamp(48px,6vw,96px);line-height:.95;margin:18px 0 22px">First to <i>board.</i></h2>
<p style="opacity:.85">Milano, London, Monaco, Paris, Dubai — tous à l'heure. La capsule voyage arrive avec le Departures Hoodie.</p>
<a class="btn" style="margin-top:26px;background:var(--crema);color:var(--nero)" href="prodotto/departures-hoodie.html">Departures Hoodie</a></div></section>"""
    return doc("FUORICLASSE — The new generation of success", body)


def plp():
    chips = ('<button class="chip" data-filter="all" aria-pressed="true">Tout · 17</button>'
             + "".join(f'<button class="chip" data-filter="{k}" aria-pressed="false">{v[0]} · {sum(1 for p in CO.P if p["family"] == k)}</button>'
                       for k, v in CO.FAMILIES.items()))
    body = (f'<div class="crumbs">Accueil / Collezione / Series A</div><section style="padding-top:28px">'
            f'<div class="head"><h2 class="serif">Series <i>A</i> — Collezione 01</h2><p>Signature, Business Culture, Statement. Tissés et confectionnés en Europe, numérotés sur mille.</p></div>'
            f'<div class="filters" role="group" aria-label="Filtrer par famille">{chips}</div>'
            f'<div class="grid">{"".join(card(p) for p in CO.P)}</div></section>'
            '<script>const h=location.hash.slice(1);if(h){addEventListener("DOMContentLoaded",()=>{const b=document.querySelector(`[data-filter="${h}"]`);b&&b.click();});}</script>')
    return doc("Collezione — Series A · FUORICLASSE", body)


def pdp(p):
    rel = "../"
    c0 = p["colors"][0]
    colors = [{"name": CO.COLOR_NAMES[c], "hex": c, "front": img(p, c, rel=rel), "back": img(p, c, "back", rel) if "back" in p else None}
              for c in p["colors"]]
    second = img(p, c0, "back", rel) if "back" in p else (img(p, p["colors"][1], rel=rel) if len(p["colors"]) > 1 else img(p, c0, rel=rel))
    det = {"A01": "detail-broderie.jpg", "A14": "detail-departures.jpg", "A17": "detail-gessato.jpg", "A08": "detail-gessato.jpg"}.get(p["ref"], "packaging.jpg")
    gal = (f'<div class="im"><img data-main src="{img(p, c0, rel=rel)}" alt="{p["name"]} — face"></div>'
           f'<div class="im"><img data-main src="{second}" alt="{p["name"]} — {"dos" if "back" in p else "coloris"}"></div>'
           f'<div class="im wide"><img src="{rel}assets/img/{det}" alt="Détail" loading="lazy"></div>')
    cbtn = "".join(f'<button class="c" data-i="{i}" style="background:{c["hex"]}" aria-pressed="{str(i == 0).lower()}" aria-label="{c["name"]}"></button>'
                   for i, c in enumerate(colors))
    sizes = ["Unique"] if p["kind"] == "cap" else ["XS", "S", "M", "L", "XL", "XXL"]
    sbtn = "".join(f'<button class="s" aria-pressed="false">{s}</button>' for s in sizes)
    fam = CO.FAMILIES[p["family"]]
    rec = [q for q in CO.P if q["family"] == p["family"] and q["ref"] != p["ref"]][:4]
    body = f"""<div class="crumbs"><a href="../index.html">Accueil</a> / <a href="../collezione.html">Collezione</a> / {fam[0]} / {p["name"]}</div>
<div class="pdp"><div class="gal">{gal}</div>
<div class="buy"><div class="mono" style="color:var(--talpa)">{p["ref"]} · {fam[0]} — <i style="text-transform:none">{fam[1]}</i></div>
<h1 class="wide">{p["name"]}</h1><div class="serif" style="font-size:22px;color:var(--grafite);margin-top:-12px"><i>{p["cat"]}</i></div>
<div class="price">€ {p["price"]:,} <span style="font-size:11px;color:var(--talpa)">TVAC</span></div>
<div><div class="lab" style="margin-bottom:12px">Coloris — <span data-colorname>{colors[0]["name"]}</span></div><div class="opts">{cbtn}</div></div>
<div><div class="lab" style="margin-bottom:12px;display:flex;justify-content:space-between">Taille <a href="#" style="text-decoration:underline;letter-spacing:.1em">Guide des tailles</a></div><div class="opts">{sbtn}</div></div>
<button class="btn" data-add style="width:100%;padding:20px">Ajouter au panier</button>
<div class="note">{B.logo_svg("key", fill="currentColor", width=26)} <span>Exemplaire numéroté sur 1000 · livré dans la boîte Series A</span></div>
<div><details open><summary>Matière & coupe</summary><p>{p["material"]}.<br>{p["fit"]}.</p></details>
<details><summary>Logo & finitions</summary><p>{p["logo"]}.<br>{p["details"]}</p></details>
<details><summary>Fabrication & entretien</summary><p>{p["made"]}. Laver à 30 °C à l'envers, ne pas sécher en machine, repasser à l'envers.</p></details>
<details><summary>Livraison & retours</summary><p>Livraison offerte dès € 250 en 2 à 4 jours ouvrés. Retours gratuits sous 30 jours.</p></details></div></div></div>
<section style="padding-top:20px"><div class="head"><h2 class="serif" style="font-size:clamp(32px,3.4vw,48px)">Dans la même <i>famille.</i></h2></div>
<div class="grid">{"".join(card(q, rel) for q in rec)}</div></section>
<script>window.PRODUCT={json.dumps({"name": p["name"], "price": p["price"], "colors": colors})};</script>"""
    return doc(f"{p['name']} — FUORICLASSE", body, rel=rel, desc=f"{p['name']} — {p['cat']}. {p['material']}.")


def maison():
    cod = "".join(f'<div style="border-top:1px solid var(--crema-2);padding-top:18px"><div class="lab" style="color:var(--talpa)">{en}</div>'
                  f'<h3 class="serif" style="font-size:40px;margin:6px 0 10px"><i>{it}</i></h3><p style="color:var(--grafite)">{tx}</p></div>'
                  for it, en, tx in TX.PHILOSOPHIE)
    story = "".join(f"<p>{t.replace('*', '')}</p>" for t in TX.NOM["texte"] + TX.STORY["texte"])
    body = f"""<section class="hero" style="padding:0;height:min(70vh,700px)"><img src="assets/img/bureau.jpg" alt="Bureau panoramique (image d'intention)">
<span class="tag">Visuel d'intention — rendu 3D</span><div class="in"><h1 class="serif">La <i>Maison.</i></h1></div></section>
<section><div style="display:grid;grid-template-columns:1fr 1.3fr;gap:clamp(30px,6vw,100px)" class="mx">
<div><div class="lab" style="color:var(--talpa)">Fuoriclasse, n. m.</div><h2 class="serif" style="font-size:clamp(40px,4.6vw,68px);line-height:1;margin-top:16px">Celui qu'aucune catégorie <i>ne contient.</i></h2></div>
<div style="display:grid;gap:18px;font-size:17px;line-height:1.7;color:var(--grafite)">{story}</div></div></section>
<section class="dark" id="codice"><div class="head"><h2 class="serif">Il <i>Codice.</i></h2><p>Quatre principes, pour les vêtements comme pour ceux qui les portent.</p></div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:30px" class="cod">{cod.replace("var(--grafite)", "rgba(239,233,222,.75)").replace("var(--crema-2)", "rgba(239,233,222,.2)")}</div></section>
<style>@media(max-width:860px){{.mx,.cod{{grid-template-columns:1fr!important}}}}</style>"""
    return doc("La Maison — FUORICLASSE", body)


def panier():
    body = """<div class="crumbs">Accueil / Panier</div><section style="padding-top:28px;max-width:900px;margin:0 auto">
<h2 class="serif" style="font-size:56px;margin-bottom:30px">Votre <i>sélection.</i></h2>
<div class="drawer-static" style="display:grid;gap:20px"><p style="color:var(--grafite)">Ouvrez le panier depuis l'en-tête pour voir vos pièces. Cette maquette ne traite aucun paiement :
le tunnel de commande sera branché sur la plateforme choisie (Shopify recommandé, cf. README).</p>
<a class="btn" href="collezione.html" style="justify-self:start">Continuer mes achats</a></div></section>"""
    return doc("Panier — FUORICLASSE", body)


def shots():
    pages = [("accueil-desktop", "index.html", 1440, 900, True), ("accueil-mobile", "index.html", 390, 844, True),
             ("collection-desktop", "collezione.html", 1440, 900, True), ("fiche-produit-desktop", "prodotto/firma-hoodie.html", 1440, 900, False),
             ("fiche-produit-departures-desktop", "prodotto/departures-hoodie.html", 1440, 900, False),
             ("fiche-produit-mobile", "prodotto/attico-zip-jacket.html", 390, 844, True), ("la-maison-desktop", "la-maison.html", 1440, 900, True)]
    jobs = []
    for name, page, w, h, full in pages:
        jobs.append({"in": SITE / page, "out": OUT / "apercus" / f"{name}.jpg", "w": w, "h": h, "scale": 2 if w < 500 else 1,
                     "fullsize": full, "quality": 82})
    return jobs


def build():
    assets()
    (A / "style.css").write_text(CSS)
    (A / "app.js").write_text(JS)
    K.write(SITE / "index.html", home())
    K.write(SITE / "collezione.html", plp())
    K.write(SITE / "la-maison.html", maison())
    K.write(SITE / "panier.html", panier())
    for p in CO.P:
        K.write(SITE / "prodotto" / f"{p['slug']}.html", pdp(p))
    K.render(shots())


if __name__ == "__main__":
    build()
