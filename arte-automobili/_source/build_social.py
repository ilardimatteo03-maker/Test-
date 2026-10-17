"""Gabarits réseaux sociaux — SVG à texte vivant (éditables) + aperçus PNG.
Principe du reflet : la Linea à 61,8 % de la hauteur ; l'image au-dessus,
l'information en dessous. Marges 72 px (zone sûre de la grille 3:4 d'Instagram)."""
import json
import subprocess
from pathlib import Path

from drawings import bottle
from kit import A, B, G, N, ROOT, TR, V, font_css, linea, logo_g, opera, rect, text

OUT = ROOT / "07_reseaux-sociaux"
SVG_DIR = OUT / "gabarits-svg"
PNG_DIR = OUT / "apercus-png"
IMG = "../../06_photographie/rendus-3d/"
R = {
    "hero": "rendu-01-hero-studio-2400x1200.jpg", "profil": "rendu-02-profil-2400x1000.jpg",
    "apres": "rendu-03-epaule-apres-1080x1350.jpg", "avant": "rendu-04-epaule-avant-1080x1350.jpg",
    "jante": "rendu-05-jante-1080x1350.jpg", "phare": "rendu-06-phare-argento-1080x1350.jpg",
    "capot": "rendu-07-capot-lames-de-lumiere-1080x1350.jpg", "verde": "rendu-08-verde-trois-quarts-arriere-1800x1350.jpg",
    "bianco": "rendu-09-bianco-trois-quarts-arriere-1800x1350.jpg", "face": "rendu-10-face-1080x1350.jpg",
}
M = 72  # marge


def image(key, x, y, w, h, align="xMidYMid", cid=None):
    clip = f' clip-path="url(#{cid})"' if cid else ""
    return (f'<image href="{IMG}{R[key]}" x="{x}" y="{y}" width="{w}" height="{h}" '
            f'preserveAspectRatio="{align} slice"{clip}/>')


def doc(w, h, body, bg=N, defs=""):
    grad = ('<linearGradient id="fade-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0D0F0E" stop-opacity="0"/>'
            '<stop offset="1" stop-color="#0D0F0E" stop-opacity=".92"/></linearGradient>'
            '<linearGradient id="fade-t" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#0D0F0E" stop-opacity="0"/>'
            '<stop offset="1" stop-color="#0D0F0E" stop-opacity=".75"/></linearGradient>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            f'viewBox="0 0 {w} {h}" width="{w}" height="{h}"><defs>{grad}{defs}</defs>'
            f'{rect(0, 0, w, h, bg)}{body}</svg>')


def eyebrow(x, y, s, fill=A, anchor="start", size=21):
    return text(x, y, s, size, "archivo", 600, fill, ls=0.24, stretch=125, anchor=anchor, upper=True)


def mono(x, y, s, fill=A, size=21, anchor="start", opacity=1.0):
    return text(x, y, s, size, "mono", 400, fill, ls=0.06, anchor=anchor, opacity=opacity, upper=True)


def signature(w, h, fill=B, y=None):
    """Monogramme simplifié en pied de page, aligné à droite sur la marge."""
    return logo_g("monogramme-simplifie", w - M, (y or h - M), height=64, fill=fill, anchor="br")


# ---------------------------------------------------------------- 4:5 — 1080 × 1350
W, H = 1080, 1350
LY = round(H * 0.618)  # 834


def t01_presentation():
    b = [image("verde", 0, 0, W, LY, "xMidYMid"), linea(0, LY, W, A, 1.5),
         eyebrow(M, LY + 74, "Arte Automobili — atelier de detailing"),
         text(M, LY + 178, [[("L'arte del ", False), ("riflesso.", True)]], 80, "bodoni", 400, B),
         text(M, LY + 252, ["Correction de vernis, protection céramique, soin de l'habitacle.",
                            "Chaque automobile traitée comme une pièce unique."], 25, "archivo", 400, B, lh=1.5, opacity=0.82),
         mono(M, H - M, "Sur rendez-vous · atelier privé"), signature(W, H)]
    return doc(W, H, "".join(b))


def t02_avant_apres():
    half = H / 2
    defs = (f'<clipPath id="c-top"><rect x="0" y="0" width="{W}" height="{half - 1}"/></clipPath>'
            f'<clipPath id="c-bot"><rect x="0" y="{half + 1}" width="{W}" height="{half}"/></clipPath>')
    # même cadrage pour les deux états : on montre la même zone de l'image (y 230 → 905)
    b = [f'<image href="{IMG}{R["avant"]}" x="0" y="-230" width="{W}" height="{H}" clip-path="url(#c-top)"/>',
         f'<image href="{IMG}{R["apres"]}" x="0" y="{half - 230}" width="{W}" height="{H}" clip-path="url(#c-bot)"/>',
         rect(0, 0, W, 190, "url(#fade-t)"), rect(0, half, W, 160, "url(#fade-t)"),
         linea(0, half, W, B, 2),
         eyebrow(M, 92, "Avant", B), mono(W - M, 92, "Vernis voilé · hologrammes", B, anchor="end", opacity=0.75),
         eyebrow(M, half + 92, "Après", B), mono(W - M, half + 92, "Correction 2 étapes", B, anchor="end", opacity=0.75),
         rect(0, H - 170, W, 170, "url(#fade-b)"),
         mono(M, H - M, "Opera N° 0052 — même lumière, même angle", B), signature(W, H)]
    return doc(W, H, "".join(b), defs=defs)


def t03_prestation():
    b = [image("capot", 0, 0, W, LY, "xMidYMax"), linea(0, LY, W, A, 1.5),
         eyebrow(M, LY + 74, "Prestation 03 / 06"),
         text(M, LY + 172, "Correction de vernis", 76, "bodoni", 400, B),
         text(M, LY + 240, ["Élimination des micro-rayures et des hologrammes,",
                            "en une à trois étapes, pour retrouver un reflet net."], 25, "archivo", 400, B, lh=1.5, opacity=0.82),
         linea(M, H - 118, W - M, G, 1.5),
         mono(M, H - M, "Durée 8–16 h"), mono(W / 2, H - M, "Dès 490 €", anchor="middle"),
         mono(W - M, H - M, "Sur devis", anchor="end")]
    return doc(W, H, "".join(b))


def t04_gros_plan():
    b = [image("jante", 0, 0, W, H), rect(0, H - 260, W, 260, "url(#fade-b)"),
         linea(M, H - 168, W - M, B, 1, 0.55),
         mono(M, H - M, "Étrier · jante · pneu — décontaminés à la main", B), signature(W, H)]
    return doc(W, H, "".join(b))


def t05_resultat():
    rows = [("Véhicule", "Coupé GT · Bianco perla"), ("Prestations", "Correction 2 étapes · Céramique 5 ans"),
            ("Durée", "3 jours à l'atelier")]
    b = [image("bianco", 0, 0, W, LY, "xMidYMid"), linea(0, LY, W, A, 1.5),
         eyebrow(M, LY + 74, "Résultat client"),
         opera(M, LY + 170, "0147", 76, B, A)]
    for i, (k, v) in enumerate(rows):
        y = LY + 252 + i * 48
        b += [mono(M, y, k, A), text(M + 250, y, v, 24, "archivo", 400, B, opacity=0.9)]
    b.append(signature(W, H))
    return doc(W, H, "".join(b))


def t06_avis():
    b = [eyebrow(M, M + 30, "Ils en parlent", A),
         text(M, 420, [[("« Elle n'avait pas ce reflet", True)], [("le jour où je l'ai achetée. »", True)]],
              60, "bodoni", 400, B, lh=1.18),
         linea(0, LY, W, A, 1.5),
         eyebrow(M, LY + 74, "Avis client"),
         text(M, LY + 150, "Julien M.", 40, "bodoni", 400, B),
         text(M, LY + 198, "Break sportif, gris graphite · Correction + céramique", 24, "archivo", 400, B, opacity=0.75),
         mono(M, H - M, "Avis Google · 5 / 5"), signature(W, H)]
    return doc(W, H, "".join(b), bg=G)


def t07_conseil():
    steps = [("01", "Panneaux froids : le produit ne sèche pas."), ("02", "Deux seaux, un gant propre par zone."),
             ("03", "Séchage par tamponnage, microfibre dédiée.")]
    from build_icons import SERVICES, LINEA as IL
    icon = (f'<g transform="translate({W - M - 96} {M + 4}) scale(4)" fill="none" stroke="{N}" stroke-width="1.5" '
            f'stroke-linecap="square">{SERVICES["lavage-exterieur"][0]}{IL}</g>')
    b = [eyebrow(M, M + 30, "Conseil d'entretien N° 07", V), icon,
         text(M, 420, ["Laver à l'ombre,", [("jamais en plein soleil.", True)]], 72, "bodoni", 400, N, lh=1.12),
         text(M, 600, ["Un panneau chaud fait sécher l'eau et le shampoing avant",
                       "le rinçage : ce sont ces traces qui ternissent le vernis."], 25, "archivo", 400, N, lh=1.5, opacity=0.78),
         linea(0, LY, W, N, 1.5)]
    for i, (n, s) in enumerate(steps):
        y = LY + 90 + i * 70
        b += [mono(M, y, n, V, size=24), text(M + 80, y, s, 27, "archivo", 400, N)]
    b.append(signature(W, H, fill=N))
    return doc(W, H, "".join(b), bg=B)


def t08_produits():
    b = [rect(0, 0, W, LY, G),
         bottle(W / 2 - 150, LY - 70, 560, name="Shampoing", sub="pH neutre · 1 L", ref="N° 01"),
         bottle(W / 2 + 150, LY - 70, 560, body=B, label=N, ink=B, name="Décontaminant", sub="Ferreux · 500 mL",
                ref="N° 04", cap="#1a1d1c"),
         linea(0, LY, W, A, 1.5),
         eyebrow(M, LY + 74, "Nos produits"),
         text(M, LY + 168, "Choisis, pas empilés.", 72, "bodoni", 400, B),
         text(M, LY + 236, ["Des formules au pH maîtrisé, compatibles avec les",
                            "protections céramiques. Aucun silicone de remplissage."], 25, "archivo", 400, B, lh=1.5, opacity=0.82),
         mono(M, H - M, "Gamme atelier · usage professionnel"), signature(W, H)]
    return doc(W, H, "".join(b))


def t09_promotion():
    b = [eyebrow(M, M + 30, "Offre de saison", B),
         text(M, 470, ["Préparer", [("l'hiver.", True)]], 120, "bodoni", 400, B, lh=1.02),
         linea(0, LY, W, B, 1.5, 0.6),
         text(M, LY + 100, ["Décontamination, protection des jantes", "et traitement du vitrage."], 30, "archivo", 400, B, lh=1.4),
         text(M, LY + 268, "−15 %", 64, "mono", 300, B),
         mono(M + 250, LY + 258, "Jusqu'au 30.11.2026", B),
         mono(M, H - M, "Sur rendez-vous · offre non cumulable", B, size=18, opacity=0.7),
         signature(W, H)]
    return doc(W, H, "".join(b), bg=V)


def t10_lancement():
    # le monogramme se tient sur la Linea de la page : son reflet tombe dans la zone d'information
    from logo import monogram
    g = monogram(100)
    s = 420 / 100  # hauteur du A = 420 px
    cx = W / 2
    paths = logo_g("monogramme", cx, LY - 420 * 1.012, height=None, width=g["half"] * 2 * s, fill=B, anchor="tc")
    b = [paths, linea(0, LY + 420 * 0.037 / 2, W, B, 420 * 0.037),
         eyebrow(M, M + 30, "Apertura", A),
         text(W - M, M + 30, "03.11.2026", 21, "mono", 400, A, ls=0.06, anchor="end"),
         text(cx, H - 168, [[("L'atelier ouvre ses portes.", True)]], 46, "bodoni", 400, B, anchor="middle"),
         eyebrow(cx, H - M, "Arte Automobili — sur rendez-vous", A, anchor="middle")]
    return doc(W, H, "".join(b))


def t11_premium():
    b = [image("capot", 0, 0, W, H, "xMidYMid"), rect(0, H - 220, W, 220, "url(#fade-b)"),
         text(M, H - M, [[("Linea di luce.", True)]], 34, "bodoni", 400, B), signature(W, H)]
    return doc(W, H, "".join(b))


# ---------------------------------------------------------------- 9:16 — 1080 × 1920
SW, SH = 1080, 1920
SLY = round(SH * 0.618)  # 1187
SAFE_T, SAFE_B = 250, 340  # zones d'interface à éviter (haut / bas)


def t12_story():
    b = [image("phare", 0, 0, SW, SLY, "xMidYMid"), rect(0, 0, SW, 330, "url(#fade-t)"),
         eyebrow(M, SAFE_T + 10, "Cette semaine à l'atelier", B),
         linea(0, SLY, SW, A, 1.5),
         text(M, SLY + 104, "Trois créneaux libres.", 70, "bodoni", 400, B)]
    slots = [("Mar 21", "Correction"), ("Jeu 23", "Céramique"), ("Sam 25", "Habitacle")]
    for i, (d, s) in enumerate(slots):
        x = M + i * 320
        b += [linea(x, SLY + 152, x + 280, G, 1.5), mono(x, SLY + 196, d, B, size=26), text(x, SLY + 236, s, 26, "archivo", 400, A)]
    b += [rect(M, SH - SAFE_B - 104, SW - 2 * M, 92, "none", extra=f' stroke="{A}" stroke-width="1.5" stroke-dasharray="6 8"'),
          mono(SW / 2, SH - SAFE_B - 50, "Zone du sticker « lien »", A, anchor="middle", size=18)]
    return doc(SW, SH, "".join(b))


def t13_highlights():
    from build_icons import SERVICES, UTILITY, LINEA as IL
    covers = [("prestations", SERVICES["correction-vernis"][0] + IL, "Prestations"),
              ("avant-apres", SERVICES["inspection-lumiere"][0] + IL, "Avant / Après"),
              ("avis", '<path d="M5 6h14v9H10l-4 3.5V15H5z"/>', "Avis"),
              ("atelier", SERVICES["protection-ceramique"][0] + IL, "Atelier"),
              ("conseils", SERVICES["lavage-exterieur"][0] + IL, "Conseils"),
              ("contact", UTILITY["rendez-vous"][0], "Rendez-vous")]
    out = {}
    for slug, body, _ in covers:
        icon = (f'<g transform="translate({SW / 2 - 168} {SH / 2 - 168}) scale(14)" fill="none" stroke="{B}" '
                f'stroke-width="1.25" stroke-linecap="square" stroke-linejoin="miter">{body}</g>')
        out[f"13-une-{slug}"] = doc(SW, SH, icon)
    return out, covers


def t14_reel():
    b = [image("face", 0, 0, SW, SH, "xMidYMid"), rect(0, SH - 900, SW, 900, "url(#fade-b)"),
         eyebrow(SW / 2, 1290, "Épisode 03", B, anchor="middle"),
         text(SW / 2, 1400, "Correction de vernis", 78, "bodoni", 400, B, anchor="middle"),
         text(SW / 2, 1460, "Du voile au miroir, en 90 secondes.", 28, "archivo", 400, B, anchor="middle", opacity=0.8),
         logo_g("monogramme-simplifie", SW / 2, SAFE_T, height=72, fill=B, anchor="tc")]
    return doc(SW, SH, "".join(b))


# ---------------------------------------------------------------- Bannières
def t15_facebook():
    w, h = 1640, 624
    b = [image("profil", 0, 0, w, h, "xMaxYMid"), rect(0, 0, w, h, "url(#fade-l)"),
         logo_g("logo-principal", 120, h / 2 - 10, height=118, fill=B, anchor="cl"),
         text(122, h / 2 + 108, [[("L'arte del riflesso.", True)]], 34, "bodoni", 400, B, opacity=0.85),
         linea(0, h - 1, w, A, 2)]
    defs = ('<linearGradient id="fade-l" x1="0" y1="0" x2="1" y2="0"><stop offset=".3" stop-color="#0D0F0E" stop-opacity=".92"/>'
            '<stop offset=".62" stop-color="#0D0F0E" stop-opacity="0"/></linearGradient>')
    return doc(w, h, "".join(b), defs=defs)


def t16_og():
    w, h = 1200, 630
    b = [image("hero", 0, 0, w, h, "xMaxYMid"), rect(0, 0, w, h, "url(#fade-l)"),
         logo_g("logo-principal", 80, 92, height=86, fill=B),
         text(80, h - 210, ["Detailing automobile", [("d'auteur.", True)]], 58, "bodoni", 400, B, lh=1.1),
         mono(80, h - 64, "Correction · céramique · habitacle")]
    defs = ('<linearGradient id="fade-l" x1="0" y1="0" x2="1" y2="0"><stop offset=".25" stop-color="#0D0F0E" stop-opacity=".9"/>'
            '<stop offset=".7" stop-color="#0D0F0E" stop-opacity="0"/></linearGradient>')
    return doc(w, h, "".join(b), defs=defs)


def main():
    SVG_DIR.mkdir(parents=True, exist_ok=True)
    PNG_DIR.mkdir(parents=True, exist_ok=True)
    files = {
        "01-presentation-marque": t01_presentation(), "02-avant-apres": t02_avant_apres(),
        "03-prestation": t03_prestation(), "04-gros-plan-finition": t04_gros_plan(),
        "05-resultat-client": t05_resultat(), "06-avis-client": t06_avis(),
        "07-conseil-entretien": t07_conseil(), "08-produits": t08_produits(),
        "09-promotion": t09_promotion(), "10-lancement": t10_lancement(),
        "11-premium-minimal": t11_premium(), "12-story": t12_story(),
        "14-couverture-reel": t14_reel(), "15-couverture-facebook": t15_facebook(), "16-image-partage-og": t16_og(),
    }
    hl, _ = t13_highlights()
    files.update(hl)
    jobs = []
    for name, svg in files.items():
        (SVG_DIR / f"{name}.svg").write_text(svg)
        w = int(svg.split('width="')[1].split('"')[0])
        h = int(svg.split('height="')[1].split('"')[0])
        page = SVG_DIR / f"_apercu-{name}.html"
        page.write_text(f"<!doctype html><meta charset=utf-8><style>{font_css('../../03_typographie/polices')}"
                        f"html,body{{margin:0;background:#000}}svg{{display:block}}</style>{svg}")
        jobs.append({"in": str(page), "out": str(PNG_DIR / f"{name}.png"), "w": w, "h": h})
    jf = SVG_DIR / "_jobs.json"
    jf.write_text(json.dumps(jobs))
    subprocess.run(["node", str(ROOT / "_source" / "render.mjs"), str(jf)], check=True, stdout=subprocess.DEVNULL)
    for j in jobs:
        Path(j["in"]).unlink()
    jf.unlink()
    print(len(files), "gabarits")


if __name__ == "__main__":
    main()
