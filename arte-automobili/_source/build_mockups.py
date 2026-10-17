"""Maquettes d'application : cartes de visite en situation, véhicule utilitaire,
tenues (dessins à plat avant/dos), signalétique d'atelier, affiche, étiquettes.
Les maquettes sont des représentations de principe, pas des fichiers de production."""
import json
import subprocess
from pathlib import Path

from drawings import bottle, van
from kit import A, B, G, N, ROOT, TR, V, font_css, linea, logo_g, logo_svg, opera, rect, text
from textes import PRESTATIONS

OUT = ROOT / "09_vehicule-textile-atelier"


def doc(w, h, body, bg=TR, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<defs>{defs}</defs>{rect(0, 0, w, h, bg)}{body}</svg>')


def label(x, y, s, fill=N, anchor="start", size=15):
    return text(x, y, s, size, "archivo", 600, fill, ls=0.22, stretch=125, upper=True, anchor=anchor)


def note(x, y, s, fill=G, anchor="start", size=15, opacity=0.8):
    return text(x, y, s, size, "mono", 400, fill, anchor=anchor, opacity=opacity)


def dim(x1, y, x2, s, fill=G):
    """Cote horizontale façon dessin technique."""
    return (rect(x1, y, x2 - x1, 1, fill) + rect(x1, y - 6, 1, 12, fill) + rect(x2 - 1, y - 6, 1, 12, fill)
            + note((x1 + x2) / 2, y - 10, s, fill, anchor="middle", size=13))


# ---------------------------------------------------------------- véhicule
def vehicle():
    W, H = 2400, 1300
    L = 1700
    x0, gy = 300, 900
    body = [label(120, 120, "Marquage véhicule — fourgon Verdaccio, lettrage Bianco"),
            note(120, 152, "Vinyle coulé mat · découpe à la forme · aucun aplat, aucun dégradé, aucune photo"),
            rect(0, gy, W, 3, G, 0.5),
            van(x0, gy, L)]
    Hv = L * 0.43
    lw = Hv * 0.11 * (459 / 149)
    body += [dim(x0 + L * 0.43, gy + 90, x0 + L * 0.43 + lw, f"Logo principal ≈ {round(5900 * lw / L, -1):.0f} × {round(5900 * Hv * 0.11 / L, -1):.0f} mm"),
             note(x0 + L * 0.43, gy + 140, "Panneau latéral, entre les ouvrants · zone de protection respectée · même marquage côté droit"),
             dim(x0, gy + 210, x0 + L, "Longueur hors tout ≈ 5 900 mm (gabarit à reprendre sur plan constructeur)")]
    # vue arrière simplifiée
    rx, rw, rh = 2060, 230, Hv * 0.93
    body += [rect(rx, gy - rh, rw, rh - 40, G), rect(rx + rw / 2 - 0.7, gy - rh + 10, 1.4, rh - 60, "#000", 0.5),
             rect(rx + 14, gy - rh + 26, rw / 2 - 26, rh * 0.32, "#0b0d0c"), rect(rx + rw / 2 + 12, gy - rh + 26, rw / 2 - 26, rh * 0.32, "#0b0d0c"),
             rect(rx - 6, gy - 70, rw + 12, 30, "#111"),
             rect(rx + 20, gy - 40, 40, 40, "#060707"), rect(rx + rw - 60, gy - 40, 40, 40, "#060707"),
             logo_g("monogramme", rx + rw * 0.25, gy - rh * 0.42, height=56, fill=B, anchor="cc"),
             text(rx + rw * 0.75, gy - rh * 0.40, "arteautomobili.fr", 10, "mono", 400, B, anchor="middle", opacity=0.85),
             note(rx + rw / 2, gy + 60, "Vue arrière", anchor="middle", size=13)]
    return doc(W, H, "".join(body), bg="#E4E1D9")


# ---------------------------------------------------------------- textile
def tshirt_path(x, y, s):
    """T-shirt à plat, vue de face (s = échelle ; largeur ≈ 520 s)."""
    p = [(0, 40), (95, 0), (150, 0), (175, 22), (205, 32), (235, 22), (260, 0), (315, 0), (410, 40), (470, 170),
         (385, 205), (360, 160), (360, 540), (50, 540), (50, 160), (25, 205), (-60, 170)]
    return "M" + " L".join(f"{x + px * s:.1f} {y + py * s:.1f}" for px, py in p) + " Z"


def jacket_path(x, y, s):
    p = [(0, 40), (95, 0), (150, -6), (260, -6), (315, 0), (410, 40), (470, 520), (418, 532), (362, 200), (362, 560),
         (48, 560), (48, 200), (-8, 532), (-60, 520)]
    return "M" + " L".join(f"{x + px * s:.1f} {y + py * s:.1f}" for px, py in p) + " Z"


def garment(kind, x, y, s, color, back=False):
    out = []
    path = jacket_path(x, y, s) if kind == "veste" else tshirt_path(x, y, s)
    out.append(f'<path d="{path}" fill="{color}"/>')
    cx = x + 205 * s
    if kind in ("polo", "tshirt"):
        # encolure
        if kind == "tshirt":
            out.append(f'<path d="M{x + 150 * s:.1f} {y:.1f} Q{cx:.1f} {y + (12 if back else 62) * s:.1f} {x + 260 * s:.1f} {y:.1f}" '
                       f'fill="none" stroke="#000" stroke-opacity=".45" stroke-width="{3 * s:.1f}"/>')
        else:
            # col polo + patte de boutonnage (ganse Verde à l'intérieur du col)
            out.append(f'<path d="M{x + 150 * s:.1f} {y:.1f} L{cx - 4 * s:.1f} {y + 70 * s:.1f} L{x + 175 * s:.1f} {y + 75 * s:.1f} Z" fill="#000" fill-opacity=".25"/>')
            out.append(f'<path d="M{x + 260 * s:.1f} {y:.1f} L{cx + 4 * s:.1f} {y + 70 * s:.1f} L{x + 235 * s:.1f} {y + 75 * s:.1f} Z" fill="#000" fill-opacity=".25"/>')
            if not back:
                out.append(rect(cx - 11 * s, y + 40 * s, 22 * s, 95 * s, "#000", 0.22))
                for i in range(2):
                    out.append(f'<circle cx="{cx:.1f}" cy="{y + (70 + i * 38) * s:.1f}" r="{3.2 * s:.1f}" fill="{B}" fill-opacity=".6"/>')
            out.append(rect(x + 150 * s, y - 4 * s, 110 * s, 6 * s, V))
    if kind == "veste":
        out.append(rect(cx - 1.5 * s, y + 20 * s, 3 * s, 520 * s, "#000", 0.45) if not back else "")
        out.append(f'<path d="M{x + 140 * s:.1f} {y - 6 * s:.1f} L{x + 270 * s:.1f} {y - 6 * s:.1f} L{x + 262 * s:.1f} {y + 40 * s:.1f} L{x + 148 * s:.1f} {y + 40 * s:.1f} Z" fill="#000" fill-opacity=".3"/>')
        out.append(rect(x + 50 * s, y + 500 * s, 310 * s, 40 * s, "#000", 0.18))
    # marquage
    if not back:
        if kind == "tablier":
            pass
        else:
            out.append(logo_g("monogramme-simplifie", x + 300 * s, y + 130 * s, height=58 * s, fill=B if color != B else N, anchor="tc"))
    else:
        if kind in ("tshirt", "veste"):
            out.append(logo_g("signature", cx, y + 70 * s, width=150 * s, fill=B, anchor="tc"))
        if kind == "veste":
            out.append(logo_g("monogramme", cx, y + 200 * s, height=120 * s, fill=B, anchor="tc"))
    return "".join(out)


def apron(x, y, s, color=N):
    p = [(60, 0), (200, 0), (200, 110), (300, 170), (300, 560), (-40, 560), (-40, 170), (60, 110)]
    path = "M" + " L".join(f"{x + px * s:.1f} {y + py * s:.1f}" for px, py in p) + " Z"
    out = [f'<path d="{path}" fill="{color}"/>']
    # sangles cuir croisées
    out.append(f'<path d="M{x + 60 * s:.1f} {y:.1f} L{x - 10 * s:.1f} {y - 90 * s:.1f}" stroke="#5a3d2b" stroke-width="{9 * s:.1f}"/>')
    out.append(f'<path d="M{x + 200 * s:.1f} {y:.1f} L{x + 270 * s:.1f} {y - 90 * s:.1f}" stroke="#5a3d2b" stroke-width="{9 * s:.1f}"/>')
    out.append(f'<path d="M{x - 40 * s:.1f} {y + 190 * s:.1f} L{x - 110 * s:.1f} {y + 200 * s:.1f}" stroke="#5a3d2b" stroke-width="{9 * s:.1f}"/>')
    out.append(f'<path d="M{x + 300 * s:.1f} {y + 190 * s:.1f} L{x + 370 * s:.1f} {y + 200 * s:.1f}" stroke="#5a3d2b" stroke-width="{9 * s:.1f}"/>')
    # poches
    out.append(rect(x + 0 * s, y + 300 * s, 260 * s, 110 * s, "#000", 0.22))
    out.append(rect(x + 129 * s, y + 300 * s, 2 * s, 110 * s, "#000", 0.4))
    out.append(rect(x - 40 * s, y + 520 * s, 340 * s, 6 * s, V))
    out.append(logo_g("monogramme-simplifie", x + 130 * s, y + 160 * s, height=80 * s, fill=B, anchor="tc"))
    return "".join(out)


def textile():
    W, H = 2400, 1500
    body = [label(120, 120, "Tenues d'atelier — broderie ton sur ton ou Bianco, jamais de flocage brillant"),
            note(120, 152, "Dessins à plat de principe · tailles de marquage données pour un vêtement taille M")]
    s = 0.62
    cols = [("polo", N, "Polo piqué Nero", "Monogramme brodé 55 mm · ganse Verde sous le col"),
            ("tshirt", G, "T-shirt Verdaccio", "Monogramme 55 mm · signature 120 mm sous la nuque"),
            ("veste", N, "Veste de detailing", "Softshell déperlante · monogramme 200 mm au dos")]
    for i, (k, c, name, spec) in enumerate(cols):
        x = 170 + i * 760
        body.append(garment(k, x, 330, s, c))
        body.append(garment(k, x + 330, 330, s * 0.62, c, back=True))
        body.append(note(x + 330 + 205 * s * 0.62, 330 + 560 * s * 0.62 + 30, "Dos", anchor="middle", size=13))
        body.append(label(x - 30, 760, name, size=16))
        body.append(note(x - 30, 792, spec, size=14))
    # tablier
    body.append(apron(400, 1010, 0.62))
    body.append(label(170, 1430, "Tablier d'atelier", size=16))
    body.append(note(170, 1462, "Toile enduite Nero · sangles cuir · liseré Verde · monogramme 50 mm", size=14))
    # palette de fils
    sw = [(N, "Nero Vite", "Fil polyester noir profond"), (B, "Bianco Sangiovanni", "Fil écru, jamais blanc optique"),
          (V, "Verde Verona", "Ganse, liseré, étiquette tissée"), (A, "Argento", "Broderie ton sur ton (option)")]
    body.append(label(1080, 1050, "Fils et finitions", size=16))
    for i, (c, n, d) in enumerate(sw):
        y = 1100 + i * 80
        body += [rect(1080, y, 56, 56, c), note(1160, y + 24, n.upper(), N, size=14, opacity=1), note(1160, y + 48, d, size=13)]
    return doc(W, H, "".join(body), bg="#E4E1D9")


# ---------------------------------------------------------------- atelier : façade et enseigne
def facade():
    W, H = 2400, 1400
    gy = 1180
    body = [label(120, 120, "Enseigne d'atelier — façade"), note(120, 152, "Lettres boîtiers aluminium laqué Bianco, rétroéclairage en halo blanc chaud 3 000 K sur bandeau Nero")]
    body += [rect(0, gy, W, H - gy, "#bdb9b0"), rect(260, 300, 1880, gy - 300, "#cfcbc2")]
    # bandeau
    body += [rect(260, 300, 1880, 210, N)]
    body.append(f'<filter id="halo" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>')
    body.append(f'<g filter="url(#halo)" opacity=".55">{logo_g("logo-horizontal", 1200, 405, height=118, fill="#fff3dc", anchor="cc")}</g>')
    body.append(logo_g("logo-horizontal", 1200, 405, height=118, fill=B, anchor="cc"))
    # portes d'atelier et entrée
    body += [rect(360, 600, 980, gy - 600, "#262B29"), rect(1460, 640, 300, gy - 640, "#1b1f1d"), rect(1840, 640, 220, 300, "#1b1f1d")]
    for i in range(1, 9):
        body.append(rect(360, 600 + i * (gy - 600) / 9, 980, 2, "#000", 0.35))
    body.append(rect(1480, 660, 260, gy - 680, "#0b0d0c"))
    # plaque d'entrée
    body += [rect(1800, 980, 140, 140, V), logo_g("monogramme-simplifie", 1870, 1010, height=46, fill=B, anchor="tc"),
             text(1870, 1100, "SUR RENDEZ-VOUS", 7.5, "archivo", 600, B, ls=0.12, stretch=125, anchor="middle")]
    body += [dim(260, gy + 60, 2140, "Bandeau 6 000 × 700 mm (à adapter à la façade)"),
             dim(760, 560, 1640, "Logo : 60 % de la largeur du bandeau maximum"),
             note(1870, gy + 120, "Plaque Verde 300 × 300 mm", anchor="middle", size=13)]
    return doc(W, H, "".join(body), bg="#d8d5cd")


def signage():
    W, H = 2400, 1300
    body = [label(120, 120, "Signalétique intérieure"), note(120, 152, "Dibond 3 mm laqué mat · texte en Archivo Expanded · flèches du jeu d'icônes · fixation invisible")]
    signs = [("Accueil", "Benvenuti", "fleche", N, B), ("Atelier", "Accès réservé", None, G, B),
             ("Zone de restitution", "Inspection sous lumière", "fleche", N, B), ("Bureau", "Devis et rendez-vous", None, B, N)]
    from build_icons import UTILITY
    for i, (t, sub, ico, bg, fg) in enumerate(signs):
        x, y, w, h = 120 + i * 560, 260, 500, 300
        body += [rect(x, y, w, h, bg), linea(x, y + h * 0.618, x + w, fg, 1.5, 0.5),
                 text(x + 36, y + h * 0.618 - 30, t, 44, "bodoni", 400, fg),
                 text(x + 36, y + h * 0.618 + 54, sub, 15, "archivo", 600, fg, ls=0.2, stretch=125, upper=True, opacity=0.75)]
        if ico:
            body.append(f'<g transform="translate({x + w - 84} {y + 36}) scale(2)" fill="none" stroke="{fg}" stroke-width="1.5" stroke-linecap="square">{UTILITY[ico][0]}</g>')
    # panneau d'accueil
    x, y, w, h = 120, 640, 1000, 600
    body += [rect(x, y, w, h, V), logo_g("logo-vertical", x + w / 2, y + 60, height=200, fill=B, anchor="tc"),
             linea(x, y + 340, x + w, B, 1.5, 0.5),
             text(x + w / 2, y + 420, [[("Benvenuti.", True)]], 44, "bodoni", 400, B, anchor="middle"),
             text(x + w / 2, y + 470, "Votre voiture est entre de bonnes mains. Café et wifi à votre disposition.", 17, "archivo", 400, B,
                  anchor="middle", opacity=0.85),
             text(x + w / 2, y + 540, "INSPECTION · PROTOCOLE · EXÉCUTION · RESTITUTION", 14, "mono", 400, B, anchor="middle", opacity=0.75),
             label(x, y + h + 36, "Panneau d'accueil 1 000 × 600 mm", size=14)]
    # étiquettes produits
    body.append(rect(1240, 640, 1040, 600, G))
    body.append(bottle(1420, 1180, 470, name="Shampoing", sub="pH neutre · 1 L", ref="N° 01"))
    body.append(bottle(1660, 1180, 470, body=B, label=N, ink=B, name="Décontaminant", sub="Ferreux · 500 mL", ref="N° 04", cap="#1a1d1c"))
    body.append(bottle(1900, 1180, 470, name="Nettoyant cuir", sub="pH 5,5 · 500 mL", ref="N° 07"))
    body.append(bottle(2120, 1180, 470, body=V, name="Céramique", sub="Entretien · 250 mL", ref="N° 09"))
    body.append(label(1240, 1276, "Étiquettes produits 80 × 100 mm · papier synthétique", size=14))
    return doc(W, H, "".join(body), bg="#E4E1D9")


def poster():
    """Affiche A2 des prestations (420 × 594 mm), composée à 1 px = 0,5 mm."""
    W, H = 840, 1188
    ly = round(H * 0.382)
    body = [f'<image href="../06_photographie/rendus-3d/rendu-07-capot-lames-de-lumiere-1080x1350.jpg" x="0" y="0" width="{W}" height="{ly}" preserveAspectRatio="xMidYMid slice"/>',
            linea(0, ly, W, A, 1.2), logo_g("logo-principal", 48, 48, height=46, fill=B),
            text(48, ly + 86, [[("Prestations", False)]], 52, "bodoni", 400, B),
            text(W - 48, ly + 86, "TARIFS INDICATIFS TTC", 11, "mono", 400, A, anchor="end")]
    from build_icons import SERVICES, LINEA as IL
    for i, p in enumerate(PRESTATIONS):
        y = ly + 140 + i * 90
        body += [linea(48, y - 26, W - 48, G, 1),
                 f'<g transform="translate(48 {y - 12}) scale(1.6)" fill="none" stroke="{B}" stroke-width="1.5" stroke-linecap="square">{SERVICES[p["icone"]][0]}{IL}</g>',
                 text(110, y + 10, p["nom"], 26, "bodoni", 400, B),
                 text(110, y + 38, p["court"], 12.5, "archivo", 400, B, opacity=0.7),
                 text(W - 48, y + 10, p["prix"].upper(), 15, "mono", 400, B, anchor="end"),
                 text(W - 48, y + 38, p["duree"].upper(), 12, "mono", 400, A, anchor="end")]
    body += [linea(48, H - 74, W - 48, G, 1), text(48, H - 44, "SUR RENDEZ-VOUS · DEVIS APRÈS INSPECTION", 12, "mono", 400, A),
             logo_g("monogramme-simplifie", W - 48, H - 36, height=36, fill=B, anchor="br")]
    return doc(W, H, "".join(body), bg=N)


def cards_scene():
    """Cartes de visite en situation (HTML/CSS 3D) — rendu PNG."""
    rec = (ROOT / "08_papeterie/carte-de-visite/carte-recto.svg").read_text()
    ver = (ROOT / "08_papeterie/carte-de-visite/carte-verso.svg").read_text()
    th_r = (ROOT / "08_papeterie/carte-remerciement/carte-remerciement-recto.svg").read_text()
    th_v = (ROOT / "08_papeterie/carte-remerciement/carte-remerciement-verso.svg").read_text()
    def crop(svg, w, h):  # retire les fonds perdus pour la mise en scène
        import re
        svg = re.sub(r'viewBox="[^"]+"', f'viewBox="0 0 {w} {h}"', svg, count=1)
        return re.sub(r'width="[^"]+mm" height="[^"]+mm"', 'width="100%" height="100%"', svg, count=1)
    return f"""<!doctype html><meta charset=utf-8><style>{font_css('../03_typographie/polices')}
html,body{{margin:0;width:2400px;height:1500px;overflow:hidden}}
body{{background:radial-gradient(ellipse at 40% 35%,#2b302e 0%,#141716 55%,#0b0c0c 100%)}}
.c{{position:absolute;box-shadow:0 30px 60px rgba(0,0,0,.55),0 6px 14px rgba(0,0,0,.45)}}
.c svg{{display:block}}
.grain{{position:absolute;inset:0;background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.012) 0 1px,transparent 1px 3px);mix-blend-mode:screen}}
.lbl{{position:absolute;left:120px;bottom:90px;font:600 18px Archivo;font-stretch:125%;letter-spacing:.22em;color:#8E9592;text-transform:uppercase}}
</style><div class="grain"></div>
<div class="c" style="left:330px;top:300px;width:850px;height:550px;transform:rotate(-8deg)">{crop(rec, 85, 55)}</div>
<div class="c" style="left:860px;top:560px;width:850px;height:550px;transform:rotate(5deg)">{crop(ver, 85, 55)}</div>
<div class="c" style="left:1500px;top:180px;width:740px;height:525px;transform:rotate(9deg)">{crop(th_r, 148, 105)}</div>
<div class="c" style="left:1620px;top:820px;width:740px;height:525px;transform:rotate(-4deg)">{crop(th_v, 148, 105)}</div>
<p class="lbl">Carte de visite 85 × 55 mm · carte de remerciement A6</p>"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    svgs = {"vehicule-marquage": vehicle(), "tenues-atelier": textile(), "enseigne-facade": facade(),
            "signaletique-accueil-etiquettes": signage(), "affiche-prestations-a2": poster()}
    jobs = []
    for name, svg in svgs.items():
        (OUT / f"{name}.svg").write_text(svg)
        w = int(svg.split('width="')[1].split('"')[0]); h = int(svg.split('height="')[1].split('"')[0])
        page = OUT / f"_tmp_{name}.html"
        page.write_text(f"<!doctype html><meta charset=utf-8><style>{font_css('../03_typographie/polices')}html,body{{margin:0}}svg{{display:block}}</style>{svg}")
        sc = 2 if name.startswith("affiche") else 1
        jobs.append({"in": str(page), "out": str(OUT / f"{name}.png"), "w": w, "h": h, "scale": sc})
    page = OUT / "_tmp_cartes.html"
    page.write_text(cards_scene())
    jobs.append({"in": str(page), "out": str(OUT / "papeterie-mise-en-situation.png"), "w": 2400, "h": 1500})
    jf = OUT / "_jobs.json"
    jf.write_text(json.dumps(jobs))
    subprocess.run(["node", str(ROOT / "_source" / "render.mjs"), str(jf)], check=True, stdout=subprocess.DEVNULL)
    for j in jobs:
        Path(j["in"]).unlink()
    jf.unlink()
    print("maquettes ok")


if __name__ == "__main__":
    main()
