"""Éléments du guide : préparation des images, diagrammes vectoriels (construction,
zone de protection, positionnement, principe du reflet, grille, arborescence)."""
import json
import subprocess
from html import escape
from pathlib import Path

from PIL import Image
from shapely import affinity

import logo
from build_icons import LINEA, SERVICES, UTILITY
from kit import A, B, G, N, ROOT, TR, V, logo_svg
from mark import to_path

GUIDE = ROOT / "00_guide"
ASSETS = GUIDE / "assets"

# (source relative à ROOT, nom dans assets, largeur max)
ASSET_LIST = [
    ("01_strategie/pistes/piste-1-luxury-heritage.png", "piste-1.jpg", 1200),
    ("01_strategie/pistes/piste-2-modern-performance.png", "piste-2.jpg", 1200),
    ("01_strategie/pistes/piste-3-italian-atelier.png", "piste-3.jpg", 1200),
    ("05_univers-graphique/planche-icones.png", "icones.png", 1500),
    ("02_logo/icones/avatar-reseaux-1080.png", "avatar.png", 400),
    ("09_vehicule-textile-atelier/vehicule-marquage.png", "vehicule.jpg", 1600),
    ("09_vehicule-textile-atelier/tenues-atelier.png", "tenues.jpg", 1600),
    ("09_vehicule-textile-atelier/enseigne-facade.png", "facade.jpg", 1600),
    ("09_vehicule-textile-atelier/signaletique-accueil-etiquettes.png", "signaletique.jpg", 1600),
    ("09_vehicule-textile-atelier/affiche-prestations-a2.png", "affiche.jpg", 700),
    ("09_vehicule-textile-atelier/papeterie-mise-en-situation.png", "papeterie.jpg", 1600),
    ("08_papeterie/autocollants/autocollant-rond-60mm.png", "sticker-rond.png", 400),
    ("08_papeterie/autocollants/vitrophanie-ceramique-70x24mm.png", "vitrophanie.png", 700),
    ("08_papeterie/autocollants/autocollant-rectangle-90x22mm.png", "sticker-rect.png", 700),
    ("08_papeterie/documents/signature-email.png", "signature-email.png", 700),
    ("10_site-web/apercus/accueil-desktop-hero.jpg", "site-hero.jpg", 1440),
    ("10_site-web/apercus/accueil-mobile-hero.jpg", "site-mobile.jpg", 500),
    ("10_site-web/apercus/accueil-desktop-pleine-page.jpg", "site-full.jpg", 720),
]
RENDERS = {
    "hero": "rendu-01-hero-studio-2400x1200.jpg", "profil": "rendu-02-profil-2400x1000.jpg",
    "apres": "rendu-03-epaule-apres-1080x1350.jpg", "avant": "rendu-04-epaule-avant-1080x1350.jpg",
    "jante": "rendu-05-jante-1080x1350.jpg", "phare": "rendu-06-phare-argento-1080x1350.jpg",
    "capot": "rendu-07-capot-lames-de-lumiere-1080x1350.jpg", "verde": "rendu-08-verde-trois-quarts-arriere-1800x1350.jpg",
    "bianco": "rendu-09-bianco-trois-quarts-arriere-1800x1350.jpg", "face": "rendu-10-face-1080x1350.jpg",
}
SOCIAL = ["01-presentation-marque", "02-avant-apres", "03-prestation", "04-gros-plan-finition", "05-resultat-client",
          "06-avis-client", "07-conseil-entretien", "08-produits", "09-promotion", "10-lancement", "11-premium-minimal",
          "12-story", "14-couverture-reel", "15-couverture-facebook", "16-image-partage-og",
          "13-une-prestations", "13-une-avant-apres", "13-une-avis", "13-une-atelier", "13-une-conseils", "13-une-contact"]


def prepare_assets():
    ASSETS.mkdir(parents=True, exist_ok=True)

    def save(src, dst, w):
        im = Image.open(src)
        has_alpha = im.mode in ("RGBA", "LA") and dst.endswith(".png")
        im = im.convert("RGBA" if has_alpha else "RGB")
        if im.width > w:
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        if dst.endswith(".jpg"):
            im.save(ASSETS / dst, quality=84, optimize=True, progressive=True)
        else:
            im.save(ASSETS / dst, optimize=True)

    for src, dst, w in ASSET_LIST:
        save(ROOT / src, dst, w)
    for k, f in RENDERS.items():
        save(ROOT / "06_photographie/rendus-3d" / f, f"r-{k}.jpg", 1400)
    for s in SOCIAL:
        w = 900 if s.startswith(("15", "16")) else (380 if s.startswith(("12", "13", "14")) else 540)
        save(ROOT / "07_reseaux-sociaux/apercus-png" / f"{s}.png", f"s-{s}.jpg", w)
    # pages de documents PDF → images
    tmp = GUIDE / "_pdf"
    tmp.mkdir(exist_ok=True)
    docs = ROOT / "08_papeterie" / "documents"
    for pdf, stem, r in [("devis-exemple.pdf", "devis", 70), ("facture-exemple.pdf", "facture", 70),
                         ("carte-des-prestations-a4.pdf", "brochure", 60), ("presentation-commerciale-16x9.pdf", "deck", 36)]:
        subprocess.run(["pdftoppm", "-r", str(r), "-jpeg", "-jpegopt", "quality=85", str(docs / pdf), str(tmp / stem)], check=True)
    for f in sorted(tmp.glob("*.jpg")):
        name = f.name.replace("-0", "-").replace("-0", "-")
        f.rename(ASSETS / f"d-{name}")
    tmp.rmdir()
    for name, src in [("en-tete", "08_papeterie/en-tete/papier-en-tete-a4-exemple.png")]:
        save(ROOT / src, f"{name}.jpg", 800)


# ---------------------------------------------------------------- diagrammes
def _mono_paths(h=100):
    g = logo.monogram(h)
    return g, "".join(f'<path d="{to_path(g[k])}"/>' for k in ("a", "r", "linea"))


def construction_svg():
    """Construction du monogramme, annotée."""
    h = 300
    g, paths = _mono_paths(h)
    w, half, lt = g["w"], g["half"], g["lt"]
    k = logo.M["k"]
    ox, oy = 340, 70
    lines = []

    def hl(y, x1, x2, lab, side="r"):
        lines.append(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{V}" stroke-width="1" stroke-dasharray="4 4"/>')
        if lab:
            tx = x2 + 10 if side == "r" else x1 - 10
            anc = "start" if side == "r" else "end"
            lines.append(f'<text x="{tx}" y="{y + 4}" font-family="DM Mono" font-size="13" fill="{G}" text-anchor="{anc}">{lab}</text>')

    def vl(x, y1, y2):
        lines.append(f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2}" stroke="{V}" stroke-width="1" stroke-dasharray="4 4"/>')

    X = lambda v: ox + v
    Y = lambda v: oy + v
    hl(Y(0), X(-half - 40), X(half + 40), "apex · h = 1", "r")
    hl(Y(h * (1 - logo.M["bar"])), X(-half - 40), X(half + 40), "barre · 0,30 h", "r")
    hl(Y(h), X(-half - 40), X(half + 40), "Linea · base", "r")
    hl(Y(h + 2 * lt + k * h), X(-half - 40), X(half + 40), "reflet · 0,42 h", "r")
    for y_rel, t in logo.M["cuts"]:
        yy = Y(h + 2 * lt + y_rel * h)
        lines.append(f'<line x1="{X(-half - 40)}" y1="{yy}" x2="{X(-half - 8)}" y2="{yy}" stroke="{A}" stroke-width="1"/>')
    vl(X(-w / 2), Y(-20), Y(h + 150))
    vl(X(w / 2), Y(-20), Y(h + 150))
    vl(X(-half), Y(h - 30), Y(h + 150))
    vl(X(half), Y(h - 30), Y(h + 150))
    # cotes
    def dim(x1, x2, y, lab):
        lines.append(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{N}" stroke-width="1"/>'
                     f'<line x1="{x1}" y1="{y - 5}" x2="{x1}" y2="{y + 5}" stroke="{N}"/><line x1="{x2}" y1="{y - 5}" x2="{x2}" y2="{y + 5}" stroke="{N}"/>'
                     f'<text x="{(x1 + x2) / 2}" y="{y + 20}" font-family="DM Mono" font-size="13" fill="{N}" text-anchor="middle">{lab}</text>')
    dim(X(-w / 2), X(w / 2), Y(h + 172), "base du A · 0,74 h")
    dim(X(-half), X(half), Y(h + 216), "Linea · φ × base du A")
    lines.append(f'<text x="{X(-half - 50)}" y="{Y(h * .5)}" font-family="DM Mono" font-size="13" fill="{G}" text-anchor="end">délié 0,037 h</text>')
    lines.append(f'<text x="{X(half + 50)}" y="{Y(h * .5) + 40}" font-family="DM Mono" font-size="13" fill="{G}">plein 0,132 h</text>')
    lines.append(f'<text x="{X(-half - 50)}" y="{Y(h + 2 * lt + 30)}" font-family="DM Mono" font-size="13" fill="{G}" text-anchor="end">3 lames de lumière</text>')
    return (f'<svg viewBox="0 0 760 640" class="dia" role="img" aria-label="Construction du monogramme">'
            f'<g transform="translate({ox} {oy})" fill="{N}" fill-opacity=".9">{paths}</g>{"".join(lines)}</svg>')


def alignment_svg():
    """Alignements du logo principal."""
    paths, (vx, vy, vw, vh) = logo.lockups(100)["logo-principal"]
    s = 2.6
    W = vw * s + 300
    H = vh * s + 80
    ox, oy = 30, 40
    y_cap = oy + (0 - vy) * s
    y_base = oy + (100 - vy) * s
    y_sub = oy + (logo.sub_baseline(100) - vy) * s
    lines = ""
    for y, lab in [(y_cap, "capitale = apex"), (y_base, "ligne de base = Linea"), (y_sub, "base AUTOMOBILI = pointe du reflet")]:
        lines += (f'<line x1="0" y1="{y:.1f}" x2="{vw * s + 50:.1f}" y2="{y:.1f}" stroke="{V}" stroke-dasharray="4 4"/>'
                  f'<text x="{vw * s + 60:.1f}" y="{y + 4:.1f}" font-family="DM Mono" font-size="13" fill="{G}">{lab}</text>')
    return (f'<svg viewBox="0 0 {W:.0f} {H:.0f}" class="dia" role="img" aria-label="Alignements du logo principal">'
            f'<g transform="translate({ox} {oy}) scale({s}) translate({-vx} {-vy})" fill="{N}" fill-rule="evenodd">{"".join(paths)}</g>{lines}</svg>')


def clearspace_svg(key="logo-principal", s=2.0):
    """Zone de protection : R = hauteur du reflet (0,42 h du monogramme)."""
    paths, (vx, vy, vw, vh) = logo.lockups(100)[key]
    R = logo.M["k"] * 100 * (1.42 if key == "logo-principal" else 1.0)
    R = logo.M["k"] * 100
    pad = R
    W, H = (vw + 2 * pad) * s + 40, (vh + 2 * pad) * s + 40
    o = 20
    body = (f'<rect x="{o}" y="{o}" width="{(vw + 2 * pad) * s:.1f}" height="{(vh + 2 * pad) * s:.1f}" fill="none" stroke="{V}" stroke-dasharray="5 5"/>'
            f'<rect x="{o + pad * s:.1f}" y="{o + pad * s:.1f}" width="{vw * s:.1f}" height="{vh * s:.1f}" fill="none" stroke="{A}" stroke-width=".8"/>')
    for (x, y) in [(o, o), (o + (vw + pad) * s, o), (o, o + (vh + pad) * s), (o + (vw + pad) * s, o + (vh + pad) * s)]:
        body += (f'<rect x="{x:.1f}" y="{y:.1f}" width="{pad * s:.1f}" height="{pad * s:.1f}" fill="{V}" fill-opacity=".12"/>'
                 f'<text x="{x + pad * s / 2:.1f}" y="{y + pad * s / 2 + 5:.1f}" text-anchor="middle" font-family="DM Mono" font-size="14" fill="{V}">R</text>')
    body += f'<g transform="translate({o + pad * s:.1f} {o + pad * s:.1f}) scale({s}) translate({-vx} {-vy})" fill="{N}" fill-rule="evenodd">{"".join(paths)}</g>'
    return f'<svg viewBox="0 0 {W:.0f} {H:.0f}" class="dia" role="img" aria-label="Zone de protection">{body}</svg>'


def positioning_svg():
    W, H = 900, 640
    cx, cy = W / 2, H / 2
    items = [("Garage tuning", 150, 470, A), ("Car wash premium", 300, 560, A), ("Detailer « noir & or »", 230, 230, A),
             ("Concessions et constructeurs", 600, 520, A), ("Carrossiers d'antan", 690, 140, A)]
    out = [f'<rect x="40" y="40" width="{W - 80}" height="{H - 80}" fill="none" stroke="{TR}"/>',
           f'<line x1="40" y1="{cy}" x2="{W - 40}" y2="{cy}" stroke="{G}" stroke-width="1"/>',
           f'<line x1="{cx}" y1="40" x2="{cx}" y2="{H - 40}" stroke="{G}" stroke-width="1"/>']
    for x, y, t, anc in [(52, cy - 12, "DÉMONSTRATIF", "start"), (W - 52, cy - 12, "RETENU", "end"),
                         (cx + 12, 62, "ARTISANAL · CULTUREL", "start"), (cx + 12, H - 52, "INDUSTRIEL · TECHNIQUE", "start")]:
        out.append(f'<text x="{x}" y="{y}" text-anchor="{anc}" font-family="Archivo" font-stretch="125%" font-weight="600" font-size="12" letter-spacing="2.6" fill="{G}">{t}</text>')
    for t, x, y, c in items:
        out.append(f'<circle cx="{x}" cy="{y}" r="7" fill="{c}"/><text x="{x + 14}" y="{y + 5}" font-family="DM Mono" font-size="14" fill="{G}">{escape(t)}</text>')
    ax, ay = 640, 250
    out.append(f'<circle cx="{ax}" cy="{ay}" r="46" fill="{V}" fill-opacity=".14"/><circle cx="{ax}" cy="{ay}" r="9" fill="{V}"/>'
               f'<text x="{ax + 18}" y="{ay - 14}" font-family="Bodoni Moda" font-size="24" fill="{N}">Arte Automobili</text>'
               f'<text x="{ax + 18}" y="{ay + 10}" font-family="DM Mono" font-size="13" fill="{G}">retenu, culturel, précis</text>')
    return f'<svg viewBox="0 0 {W} {H}" class="dia" role="img" aria-label="Carte de positionnement">{"".join(out)}</svg>'


def reflet_svg():
    """Principe du reflet sur un format 4:5."""
    W, H = 360, 450
    ly = H * 0.618
    g, paths = _mono_paths(100)
    return (f'<svg viewBox="-10 -10 {W + 230} {H + 20}" class="dia" role="img" aria-label="Principe du reflet">'
            f'<rect x="0" y="0" width="{W}" height="{H}" fill="{N}"/>'
            f'<rect x="0" y="0" width="{W}" height="{ly}" fill="url(#rg)"/>'
            f'<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2f2d"/><stop offset="1" stop-color="#121514"/></linearGradient></defs>'
            f'<line x1="0" y1="{ly}" x2="{W}" y2="{ly}" stroke="{A}" stroke-width="1.5"/>'
            f'<text x="24" y="40" font-family="Archivo" font-stretch="125%" font-weight="600" font-size="11" letter-spacing="2.4" fill="{A}">IMAGE · L\'OBJET</text>'
            f'<rect x="24" y="{ly + 30}" width="140" height="5" fill="{A}"/><rect x="24" y="{ly + 50}" width="240" height="16" fill="{B}" fill-opacity=".85"/>'
            f'<rect x="24" y="{ly + 82}" width="280" height="4" fill="{B}" fill-opacity=".4"/><rect x="24" y="{ly + 94}" width="250" height="4" fill="{B}" fill-opacity=".4"/>'
            f'<text x="24" y="{H - 22}" font-family="Archivo" font-stretch="125%" font-weight="600" font-size="11" letter-spacing="2.4" fill="{A}">INFORMATION · LE REFLET</text>'
            f'<line x1="{W + 14}" y1="0" x2="{W + 14}" y2="{ly}" stroke="{G}"/><text x="{W + 24}" y="{ly / 2}" font-family="DM Mono" font-size="13" fill="{G}">61,8 %</text>'
            f'<line x1="{W + 14}" y1="{ly}" x2="{W + 14}" y2="{H}" stroke="{G}"/><text x="{W + 24}" y="{ly + (H - ly) / 2}" font-family="DM Mono" font-size="13" fill="{G}">38,2 %</text>'
            f'<g transform="translate({W + 150} {ly - 100 * 0.62}) scale(0.62)" fill="{N}">{paths}</g></svg>')


def grid_svg():
    W, H = 800, 450
    m = 60
    cw = (W - 2 * m - 11 * 16) / 12
    cols = "".join(f'<rect x="{m + i * (cw + 16):.1f}" y="0" width="{cw:.1f}" height="{H}" fill="{V}" fill-opacity=".08"/>' for i in range(12))
    ly = H * 0.618
    return (f'<svg viewBox="0 -24 {W} {H + 48}" class="dia" role="img" aria-label="Grille 12 colonnes">'
            f'<rect x="0" y="0" width="{W}" height="{H}" fill="none" stroke="{TR}"/>{cols}'
            f'<line x1="0" y1="{ly}" x2="{W}" y2="{ly}" stroke="{N}" stroke-width="1.2"/>'
            f'<rect x="{m}" y="60" width="{cw * 7 + 16 * 6:.1f}" height="{ly - 100:.1f}" fill="{N}" fill-opacity=".12"/>'
            f'<rect x="{m}" y="{ly + 30}" width="{cw * 4 + 48:.1f}" height="10" fill="{N}" fill-opacity=".5"/>'
            f'<rect x="{m}" y="{ly + 54}" width="{cw * 5 + 64:.1f}" height="5" fill="{N}" fill-opacity=".25"/>'
            f'<rect x="{m}" y="{ly + 66}" width="{cw * 5:.1f}" height="5" fill="{N}" fill-opacity=".25"/>'
            f'<text x="{m}" y="-8" font-family="DM Mono" font-size="12" fill="{G}">marge = 1/12 de la largeur</text>'
            f'<text x="{W - m}" y="-8" text-anchor="end" font-family="DM Mono" font-size="12" fill="{G}">12 colonnes · gouttière 16 px (écran) / 4 mm (print)</text>'
            f'<text x="{W - m}" y="{H + 20}" text-anchor="end" font-family="DM Mono" font-size="12" fill="{G}">≥ 40 % de vide par composition</text></svg>')


def sitemap_svg():
    nodes = [("Accueil", 400, 40)]
    kids = ["Prestations", "L'atelier", "Réalisations", "Avis", "Devis et contact"]
    out = [f'<rect x="330" y="20" width="140" height="44" fill="{N}"/><text x="400" y="48" text-anchor="middle" font-family="Archivo" font-size="15" fill="{B}">Accueil</text>']
    for i, kname in enumerate(kids):
        x = 30 + i * 158
        out.append(f'<line x1="400" y1="64" x2="400" y2="100" stroke="{G}"/><line x1="{x + 65}" y1="100" x2="{x + 65}" y2="124" stroke="{G}"/>')
        out.append(f'<rect x="{x}" y="124" width="130" height="44" fill="none" stroke="{N}"/><text x="{x + 65}" y="151" text-anchor="middle" font-family="Archivo" font-size="14" fill="{N}">{escape(kname)}</text>')
    out.append(f'<line x1="95" y1="100" x2="727" y2="100" stroke="{G}"/>')
    subs = {0: ["Lavage", "Décontamination", "Correction", "Céramique", "Habitacle", "Jantes · vitrage"],
            2: ["Opera N° — fiches", "Avant / après"], 4: ["Formulaire", "Accès · horaires"]}
    for i, items in subs.items():
        x = 30 + i * 158
        for j, s in enumerate(items):
            y = 196 + j * 30
            out.append(f'<line x1="{x + 10}" y1="{y - 18}" x2="{x + 10}" y2="{y - 4}" stroke="{TR}"/><text x="{x + 20}" y="{y}" font-family="DM Mono" font-size="12" fill="{G}">{escape(s)}</text>')
    out.append(f'<text x="30" y="400" font-family="DM Mono" font-size="12" fill="{G}">+ Mentions légales · Confidentialité · page 404 aux couleurs de la marque</text>')
    return f'<svg viewBox="0 0 800 410" class="dia" role="img" aria-label="Arborescence du site">{"".join(out)}</svg>'


def icon_inline(name, size=28, color=N):
    body = SERVICES[name][0] + LINEA if name in SERVICES else UTILITY[name][0]
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="{color}" stroke-width="1.5" '
            f'stroke-linecap="square" aria-hidden="true">{body}</svg>')


def palette():
    return json.loads((ROOT / "04_couleurs" / "palette.json").read_text())
