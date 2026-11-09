"""Planche d'inspiration « Modern Wealth Culture » : lieux, matières, objets, attitudes.

Aucune image de banque : lieux = rendus 3D du studio, matières = textures générées,
objets = dessins vectoriels. Tout est propre à FUORICLASSE.
"""
import math

import brand as B
import fx
import kit as K

OUT = K.ROOT / "01_inspiration"
R3 = K.ROOT / "06_photographie" / "rendus-3d"


def swatch(kind, w=400, h=400):
    """Échantillons de matières en SVG (filtres)."""
    d, body = "", ""
    if kind == "travertin":
        d = (f'<filter id="m" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="4" seed="3"/>'
             f'<feColorMatrix values="0 0 0 0 .84  0 0 0 0 .80  0 0 0 0 .73  0 0 0 -1.1 1"/></filter>'
             f'<filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.05 0.6" numOctaves="2" seed="9"/>'
             f'<feColorMatrix values="0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .3  0 0 0 -6 3.2"/></filter>')
        body = f'<rect width="{w}" height="{h}" fill="#d9cfbf"/><rect width="{w}" height="{h}" filter="url(#m)"/><rect width="{w}" height="{h}" filter="url(#p)" opacity=".5"/>'
    elif kind == "laiton":
        d = (f'<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d6847"/><stop offset=".45" stop-color="#c9b083"/>'
             f'<stop offset=".55" stop-color="#e2cfa4"/><stop offset="1" stop-color="#8a734e"/></linearGradient>'
             f'<filter id="m" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.002 1.2" numOctaves="2" seed="4"/>'
             f'<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .6 -.1"/></filter>')
        body = f'<rect width="{w}" height="{h}" fill="url(#g)"/><rect width="{w}" height="{h}" filter="url(#m)"/>'
    elif kind == "marbre":
        d = (f'<filter id="m" x="0" y="0" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency="0.006 0.012" numOctaves="5" seed="12"/>'
             f'<feColorMatrix values="0 0 0 0 .86  0 0 0 0 .84  0 0 0 0 .80  -9 0 0 0 1.25"/></filter>')
        body = f'<rect width="{w}" height="{h}" fill="#121110"/><rect width="{w}" height="{h}" filter="url(#m)" opacity=".75"/>'
    elif kind == "noyer":
        d = (f'<filter id="m" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.002 0.06" numOctaves="4" seed="5" result="t"/>'
             f'<feDisplacementMap in="SourceGraphic" in2="t" scale="40"/></filter>')
        lines = "".join(f'<rect x="-20" y="{i * 6}" width="{w + 40}" height="{3 + (i * 7) % 4}" fill="#2f1d13" opacity=".{3 + i % 5}"/>' for i in range(h // 6 + 4))
        body = f'<rect width="{w}" height="{h}" fill="#5a3b28"/><g filter="url(#m)">{lines}</g>'
    elif kind in ("daim", "cachemire", "cuir"):
        col, fab = {"daim": (B.CIOCC, "daim"), "cachemire": (B.TALPA, "maille"), "cuir": (B.BAROLO, "laine")}[kind]
        d = fx.fabric("m", fab, seed=6, strength=1.6)
        body = f'<rect width="{w}" height="{h}" fill="{col}" filter="url(#m)"/>'
        if kind == "cuir":
            d += fx.tonal_emboss("e", 1.2, .12, .35)
            body += f'<g filter="url(#e)"><path d="M{w * .15} {h * .9}C{w * .4} {h * .7} {w * .6} {h * .62} {w * 1.1} {h * .58}" stroke="{B.BAROLO}" stroke-width="2" stroke-dasharray="7 5" fill="none"/></g>'
    elif kind == "gessato":
        d = B.gessato_pattern("gp", pitch=16, line=1.5, bg=B.BLU, ink=B.CREMA, opacity=.5) + fx.fabric("m", "laine", 3, 1.4)
        body = f'<g filter="url(#m)"><rect width="{w}" height="{h}" fill="url(#gp)"/></g>'
    return K.svg_doc(body, w, h, defs=d)


def watch(w=400, h=400):
    """Montre habillée sans marque : cadran crème, aiguilles feuille, 08:40 (le vol pour Milan)."""
    cx, cy, r = w / 2, h / 2, w * 0.36
    ticks = ""
    for i in range(60):
        a = math.radians(i * 6 - 90)
        r1 = r * (0.86 if i % 5 == 0 else 0.92)
        sw = 2.4 if i % 5 == 0 else 0.8
        ticks += (f'<line x1="{cx + r1 * math.cos(a):.1f}" y1="{cy + r1 * math.sin(a):.1f}" x2="{cx + r * 0.96 * math.cos(a):.1f}" '
                  f'y2="{cy + r * 0.96 * math.sin(a):.1f}" stroke="{B.NERO}" stroke-width="{sw}"/>')
    def hand(deg, L, wd, col=B.NERO):
        a = math.radians(deg - 90)
        x2, y2 = cx + L * math.cos(a), cy + L * math.sin(a)
        p = math.radians(deg)
        ox, oy = wd * math.cos(p), wd * math.sin(p)
        return f'<path d="M{cx - ox:.1f} {cy - oy:.1f}L{x2:.1f} {y2:.1f}L{cx + ox:.1f} {cy + oy:.1f}Z" fill="{col}"/>'
    defs = (f'<radialGradient id="dial" cx=".4" cy=".35"><stop offset="0" stop-color="#f6f1e7"/><stop offset="1" stop-color="#d8cfbf"/></radialGradient>'
            f'<linearGradient id="case" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe3c5"/><stop offset=".5" stop-color="#a8916a"/><stop offset="1" stop-color="#6e5a3c"/></linearGradient>'
            + fx.soft_shadow("s", 14, 12, .45, "#000"))
    body = (f'<rect width="{w}" height="{h}" fill="{B.CIOCC}"/>'
            f'<rect x="{cx - r * 0.55}" y="0" width="{r * 1.1}" height="{h}" fill="#2a1b14"/>'
            f'<g filter="url(#s)"><circle cx="{cx}" cy="{cy}" r="{r * 1.12}" fill="url(#case)"/><circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#dial)"/></g>'
            f'{ticks}{hand(240, r * 0.55, 3.2)}{hand(48, r * 0.8, 2.2)}<line x1="{cx}" y1="{cy + r * .2}" x2="{cx}" y2="{cy - r * .86}" stroke="{B.BAROLO}" stroke-width="1"/>'
            f'<circle cx="{cx}" cy="{cy}" r="4" fill="{B.NERO}"/><rect x="{cx + r * 1.1}" y="{cy - 8}" width="14" height="16" rx="3" fill="url(#case)"/>')
    return K.svg_doc(body, w, h, defs=defs)


def boarding(w=600, h=400):
    """Carte d'embarquement — première classe, Milano → Dubai (sans compagnie réelle)."""
    m = lambda x, y, s, size=12, col=B.NERO, anchor="start", weight=400: (
        f'<text x="{x}" y="{y}" font-family="Geist Mono" font-size="{size}" font-weight="{weight}" fill="{col}" text-anchor="{anchor}">{s}</text>')
    body = (f'<rect width="{w}" height="{h}" fill="{B.BLU}"/>'
            f'<g transform="translate(60 70) rotate(-4)"><rect width="480" height="250" rx="6" fill="{B.CREMA}"/>'
            f'<rect x="360" width="120" height="250" fill="{B.CREMA_2}"/><line x1="360" y1="10" x2="360" y2="240" stroke="{B.TALPA}" stroke-dasharray="3 3"/>'
            f'<text x="24" y="40" font-family="Mona Sans" font-stretch="125%" font-weight="600" font-size="11" letter-spacing="3" fill="{B.NERO}">BOARDING PASS · FIRST</text>'
            f'{m(24, 110, "MXP", 40, B.NERO, weight=500)}{m(150, 110, "DXB", 40, B.NERO, weight=500)}'
            f'<path d="M108 98h28m-6-5l6 5-6 5" stroke="{B.BAROLO}" fill="none" stroke-width="1.5"/>'
            f'{m(24, 130, "MILANO", 10, B.TALPA)}{m(150, 130, "DUBAI", 10, B.TALPA)}'
            f'{m(24, 175, "SEAT", 9, B.TALPA)}{m(24, 194, "1A", 18)}{m(100, 175, "DEPARTS", 9, B.TALPA)}{m(100, 194, "21:50", 18)}'
            f'{m(200, 175, "GATE", 9, B.TALPA)}{m(200, 194, "B1", 18)}'
            f'{m(24, 230, "PASSENGER · THE NEW GENERATION", 9, B.GRAFITE)}'
            f'{m(380, 60, "FC 055", 12)}{m(380, 90, "1A", 22)}'
            + "".join(f'<rect x="{380 + i * 4.2}" y="150" width="{1 + (i * 7) % 3}" height="70" fill="{B.NERO}"/>' for i in range(20))
            + '</g>')
    return K.svg_doc(body, w, h)


def espresso(w=400, h=400):
    cx, cy = w / 2, h / 2
    defs = (f'<radialGradient id="cr" cx=".45" cy=".42"><stop offset="0" stop-color="#c79a63"/><stop offset=".6" stop-color="#8a5a33"/><stop offset="1" stop-color="#3b2416"/></radialGradient>'
            + fx.soft_shadow("s", 10, 8, .35, "#000"))
    mar = swatch("marbre", w, h)
    inner = mar[mar.index("<rect"):mar.rindex("</svg>")]
    defs += mar[mar.index("<defs>") + 6:mar.index("</defs>")]
    body = (f'{inner}<g filter="url(#s)"><circle cx="{cx}" cy="{cy}" r="120" fill="#f4efe6"/></g>'
            f'<circle cx="{cx}" cy="{cy}" r="112" fill="none" stroke="#e4ddd0" stroke-width="2"/>'
            f'<g filter="url(#s)"><circle cx="{cx}" cy="{cy}" r="62" fill="#f7f3eb"/><rect x="{cx + 56}" y="{cy - 10}" width="34" height="20" rx="10" fill="#f7f3eb"/></g>'
            f'<circle cx="{cx}" cy="{cy}" r="50" fill="url(#cr)"/>'
            f'<rect x="{cx - 128}" y="{cy + 70}" width="14" height="70" rx="2" fill="{B.OTTONE}" transform="rotate(-30 {cx} {cy})"/>')
    return K.svg_doc(body, w, h, defs=defs)


def keycard(w=400, h=400):
    body = (f'<rect width="{w}" height="{h}" fill="{B.PIETRA}"/>'
            f'<g transform="translate(80 110) rotate(-8)"><rect width="250" height="158" rx="10" fill="{B.NERO}"/>'
            f'<text x="24" y="44" font-family="Playfair" font-style="italic" font-size="26" fill="{B.CREMA}">Suite 3101</text>'
            f'<text x="24" y="132" font-family="Geist Mono" font-size="10" fill="{B.TALPA}">ATTICO · PIANO 31 · CHECK-OUT 12:00</text>'
            f'{B.logo_g("key", 214, 120, width=34, fill=B.CREMA, anchor="cc")}</g>'
            f'<g transform="translate(150 230) rotate(6)" filter="url(#s)"><rect width="200" height="120" rx="3" fill="{B.CREMA}"/>'
            f'<text x="20" y="40" font-family="Mona Sans" font-stretch="125%" font-weight="600" font-size="9" letter-spacing="3" fill="{B.NERO}">MENU DEGUSTAZIONE</text>'
            f'<text x="20" y="66" font-family="Playfair" font-style="italic" font-size="13" fill="{B.GRAFITE}">Risotto, oro e zafferano</text>'
            f'<text x="20" y="86" font-family="Playfair" font-style="italic" font-size="13" fill="{B.GRAFITE}">Barolo 2016</text></g>')
    return K.svg_doc(body, w, h, defs=fx.soft_shadow("s", 8, 8, .25))


def skyline_line(w=600, h=400):
    """Façade contemporaine en trait — l'architecture comme référence."""
    lines = []
    for i in range(13):
        x = 40 + i * 40
        lines.append(f'<line x1="{x}" y1="40" x2="{x}" y2="{h - 40}" stroke="{B.NERO}" stroke-width="{2.4 if i % 4 == 0 else .8}"/>')
    for j in range(9):
        y = 40 + j * 40
        lines.append(f'<line x1="40" y1="{y}" x2="{w - 40}" y2="{y}" stroke="{B.NERO}" stroke-width="{2.4 if j % 4 == 0 else .8}"/>')
    lines.append(f'<rect x="{40 + 7 * 40}" y="{40 + 2 * 40}" width="40" height="40" fill="{B.BAROLO}"/>')
    return K.svg_doc("".join(lines), w, h, bg=B.CREMA)


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    img = lambda p: f'<img src="{p.as_uri()}" style="width:100%;height:100%;object-fit:cover;display:block">'
    SVG_ATTR = '<svg preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%" '

    counter = [0]

    def svg(s):
        counter[0] += 1
        s = K.uniq(s, f"u{counter[0]}")
        return '<div class="sv">' + s.replace("<svg ", SVG_ATTR, 1) + "</div>"
    P = K.ROOT / "05_collection" / "produits"
    tiles = [
        ("a", img(R3 / "lieu-01-penthouse-heure-bleue.jpg"), "Lieux — l'attico, heure bleue"),
        ("b", svg(swatch("gessato")), "Rayure tennis, laine"),
        ("c", svg(watch()), "Le temps, sans logo"),
        ("d", img(R3 / "lieu-05-gt-devant-facade.jpg"), "La GT, flash direct"),
        ("e", svg(swatch("travertin")), "Travertin"),
        ("f", svg(swatch("daim")), "Daim"),
        ("g", svg(boarding()), "MXP → DXB, siège 1A"),
        ("h", img(R3 / "lieu-03-salle-du-conseil.jpg"), "La salle du conseil"),
        ("i", svg(swatch("laiton")), "Laiton brossé"),
        ("j", svg(espresso()), "Ristretto, marbre noir"),
        ("k", img(K.ROOT / "05_collection" / "produits" / "details" / "a04-monogramme-et-col.jpg"), "Broderie, col côtelé"),
        ("l", svg(swatch("cachemire")), "Cachemire"),
        ("m", svg(keycard()), "Suite 3101"),
        ("n", img(R3 / "lieu-04-rooftop.jpg"), "Rooftop"),
        ("o", svg(skyline_line()), "Trame d'architecte"),
        ("p", svg(swatch("cuir")), "Cuir Barolo"),
    ]
    cells = "".join(f'<figure class="t {k}">{c}<figcaption>{cap}</figcaption></figure>' for k, c, cap in tiles)
    css = """
.mb{width:2400px;height:1500px;display:grid;grid-template-columns:repeat(12,1fr);grid-template-rows:repeat(8,1fr);gap:10px;padding:10px;background:var(--crema)}
.t{position:relative;overflow:hidden;margin:0;background:var(--pietra)}
.sv{width:100%;height:100%;line-height:0}
figcaption{position:absolute;left:12px;bottom:10px;font-family:'Geist Mono';font-size:11px;letter-spacing:.06em;color:#fff;mix-blend-mode:difference;opacity:.9}
.a{grid-column:1/6;grid-row:1/5}.b{grid-column:6/8;grid-row:1/3}.c{grid-column:8/10;grid-row:1/3}
.title{grid-column:10/13;grid-row:1/4;background:var(--nero);color:var(--crema);padding:34px;display:flex;flex-direction:column;justify-content:space-between}
.d{grid-column:6/10;grid-row:3/6}.e{grid-column:10/11;grid-row:4/6}.f{grid-column:11/12;grid-row:4/6}.g{grid-column:12/13;grid-row:4/6}
.h{grid-column:1/4;grid-row:5/9}.i{grid-column:4/5;grid-row:5/7}.j{grid-column:5/6;grid-row:5/7}.k{grid-column:6/8;grid-row:6/9}
.l{grid-column:4/6;grid-row:7/9}.m{grid-column:8/10;grid-row:6/9}.n{grid-column:10/13;grid-row:6/9}
.o{display:none}.p{display:none}
.words{font-family:'Playfair';font-variation-settings:'opsz' 900;font-size:58px;line-height:.98}
"""
    title = (f'<div class="t title"><div class="lab" style="color:var(--talpa)">Planche d\'inspiration · 01</div>'
             f'<div class="words">Modern<br><i>Wealth</i><br>Culture.</div>'
             f'<div style="font-size:14px;line-height:1.55;opacity:.85">Suggérer la réussite, jamais l\'afficher. '
             f'Des lieux où l\'on travaille et où l\'on reçoit, des matières qui vieillissent bien, des objets choisis — '
             f'aucun billet, aucun slogan.<br><br><span class="mono" style="font-size:11px;color:var(--talpa)">MILANO · LONDON · MONACO · PARIS · DUBAI</span></div></div>')
    body = f'<div class="mb">{cells.replace("<figure class=\"t c\">", title + "<figure class=\"t c\">", 1)}</div>'
    src = K.write(K.TMP / "mood" / "moodboard.html", K.page(body, css=css, w=2400, h=1500))
    # deuxième planche : matières seules
    mats = ["gessato", "travertin", "laiton", "marbre", "noyer", "daim", "cachemire", "cuir"]
    names = {"gessato": "Rayure tennis — laine", "travertin": "Travertin romain", "laiton": "Laiton brossé", "marbre": "Nero Marquina",
             "noyer": "Noyer", "daim": "Daim de chèvre", "cachemire": "Maille cachemire", "cuir": "Cuir pleine fleur Barolo"}
    cells2 = "".join(f'<figure class="t">{svg(swatch(m))}<figcaption>{names[m]}</figcaption></figure>' for m in mats)
    body2 = (f'<div style="width:2400px;height:1500px;background:var(--crema);padding:70px 80px;display:grid;grid-template-rows:auto 1fr;gap:40px">'
             f'<div style="display:flex;justify-content:space-between;align-items:flex-end"><div><div class="lab" style="color:var(--talpa)">Planche d\'inspiration · 02</div>'
             f'<h1 class="serif" style="font-size:84px;line-height:1;margin-top:14px">Matières <i>qui durent.</i></h1></div>'
             f'<p style="max-width:720px;font-size:18px;color:var(--grafite)">La richesse se lit au toucher : une laine rayée de banquier, un travertin de hall d\'hôtel, '
             f'le laiton d\'une poignée de porte, le daim d\'une veste qui a vingt ans. Ces matières dictent la palette, les finitions et le packaging.</p></div>'
             f'<div style="display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;gap:14px">{cells2}</div></div>')
    src2 = K.write(K.TMP / "mood" / "matieres.html", K.page(body2, css=css, w=2400, h=1500))
    K.render([{"in": src, "out": OUT / "planche-inspiration-modern-wealth-culture.jpg", "w": 2400, "h": 1500, "quality": 90},
              {"in": src2, "out": OUT / "planche-matieres.jpg", "w": 2400, "h": 1500, "quality": 90}])
    # objets seuls, réutilisables (SVG vectoriels)
    for name, sv in [("objet-montre", watch()), ("objet-carte-embarquement", boarding()),
                     ("objet-ristretto", espresso()), ("objet-cle-de-suite", keycard())]:
        K.write(OUT / "objets" / f"{name}.svg", sv)


if __name__ == "__main__":
    build()
