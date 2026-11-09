"""Créations graphiques de la collection (impressions, broderies, motifs) — en SVG vectoriel.

Chaque fonction renvoie (inner_svg, (w, h)) dessiné à l'origine, à l'échelle 1 px = 1 mm.
"""
import math

import brand as B


def departures(ink=B.CREMA, accent=None):
    """« Departures » : tableau d'affichage à palettes, cinq villes, un seul statut : ON TIME."""
    accent = accent or ink
    rows = [("08:40", "MILANO", "FC 001", "A1", "ON TIME"), ("11:15", "LONDON", "FC 014", "B3", "ON TIME"),
            ("14:30", "MONACO", "FC 026", "A4", "BOARDING"), ("17:05", "PARIS", "FC 038", "C2", "ON TIME"),
            ("21:50", "DUBAI", "FC 055", "B1", "ON TIME")]
    W, rh = 300.0, 30.0
    cols = [(0, 52), (60, 112), (180, 50), (236, 22)]
    out = [f'<text x="0" y="12" font-family="Mona Sans" font-stretch="125%" font-weight="600" font-size="11" '
           f'letter-spacing="3.4" fill="{ink}">DEPARTURES</text>',
           f'<text x="{W}" y="12" text-anchor="end" font-family="Geist Mono" font-size="9" fill="{ink}" '
           f'opacity=".8">FUORICLASSE · SERIES A</text>',
           f'<rect x="0" y="20" width="{W}" height="0.8" fill="{ink}"/>']
    y = 30
    for t, city, code, gate, st in rows:
        # cellules à palettes : chaque caractère dans sa case, coupée en deux
        def flap(x, txt, n, w=9.6):
            g = []
            for i in range(n):
                cx = x + i * (w + 1.4)
                g.append(f'<rect x="{cx:.1f}" y="{y}" width="{w}" height="{rh - 8}" rx="1" fill="none" stroke="{ink}" stroke-width=".6" opacity=".55"/>'
                         f'<line x1="{cx:.1f}" y1="{y + (rh - 8) / 2:.1f}" x2="{cx + w:.1f}" y2="{y + (rh - 8) / 2:.1f}" stroke="{ink}" stroke-width=".5" opacity=".55"/>')
                if i < len(txt):
                    g.append(f'<text x="{cx + w / 2:.1f}" y="{y + rh - 13:.1f}" text-anchor="middle" font-family="Geist Mono" '
                             f'font-weight="500" font-size="12" fill="{ink}">{txt[i]}</text>')
            return "".join(g)
        out.append(flap(0, t.replace(":", ""), 4))
        out.append(flap(52, city, 7))
        out.append(flap(136, code.replace(" ", ""), 5))
        st_col = accent if st == "BOARDING" else ink
        out.append(f'<text x="{W}" y="{y + rh - 13:.1f}" text-anchor="end" font-family="Mona Sans" font-stretch="125%" '
                   f'font-weight="600" font-size="8.5" letter-spacing="2" fill="{st_col}">{st}</text>')
        y += rh
    out.append(f'<rect x="0" y="{y + 2}" width="{W}" height="0.8" fill="{ink}"/>')
    out.append(f'<text x="0" y="{y + 16}" font-family="Geist Mono" font-size="8.5" fill="{ink}" opacity=".8">'
               f'ALL FLIGHTS OPERATED BY THOSE WHO SEE FURTHER</text>')
    return "".join(out), (W, y + 20)


def floor_plan(ink=B.TALPA, sw=1.0):
    """« Pianta » : plan d'architecte d'un attico (penthouse) — la pièce Business Culture."""
    W, H = 300.0, 210.0
    L = []
    wall = lambda x1, y1, x2, y2, t=4: L.append(
        f'<rect x="{min(x1, x2) - (t / 2 if x1 == x2 else 0):.1f}" y="{min(y1, y2) - (t / 2 if y1 == y2 else 0):.1f}" '
        f'width="{abs(x2 - x1) or t:.1f}" height="{abs(y2 - y1) or t:.1f}" fill="{ink}"/>')
    # murs extérieurs
    wall(0, 0, 220, 0); wall(0, 0, 0, 160); wall(0, 160, 300, 160); wall(220, 0, 220, 60)
    # baie vitrée vers la terrasse (double trait)
    L.append(f'<line x1="220" y1="60" x2="220" y2="160" stroke="{ink}" stroke-width="{sw}"/>'
             f'<line x1="224" y1="60" x2="224" y2="160" stroke="{ink}" stroke-width="{sw}"/>')
    # terrasse
    L.append(f'<rect x="224" y="20" width="76" height="140" fill="none" stroke="{ink}" stroke-width="{sw}" stroke-dasharray="3 2"/>')
    # cloisons
    wall(90, 0, 90, 70, 2.5); wall(0, 90, 60, 90, 2.5); wall(90, 110, 90, 160, 2.5); wall(150, 0, 150, 50, 2.5)
    # portes (arcs)
    for x, y, r, a0, a1 in [(90, 70, 22, 90, 180), (60, 90, 22, 0, 90), (150, 50, 20, 90, 180)]:
        p0 = (x + r * math.cos(math.radians(a0)), y + r * math.sin(math.radians(a0)))
        p1 = (x + r * math.cos(math.radians(a1)), y + r * math.sin(math.radians(a1)))
        L.append(f'<path d="M{x} {y}L{p0[0]:.1f} {p0[1]:.1f}A{r} {r} 0 0 1 {p1[0]:.1f} {p1[1]:.1f}" fill="none" stroke="{ink}" stroke-width="{sw * .7}"/>')
    # mobilier : table de conférence, canapé, bureau, lit
    L.append(f'<rect x="112" y="92" width="80" height="34" rx="2" fill="none" stroke="{ink}" stroke-width="{sw}"/>')
    for i in range(4):
        L.append(f'<circle cx="{124 + i * 19}" cy="86" r="4" fill="none" stroke="{ink}" stroke-width="{sw * .7}"/>'
                 f'<circle cx="{124 + i * 19}" cy="132" r="4" fill="none" stroke="{ink}" stroke-width="{sw * .7}"/>')
    L.append(f'<rect x="12" y="104" width="12" height="44" fill="none" stroke="{ink}" stroke-width="{sw}"/>'
             f'<rect x="24" y="104" width="30" height="44" fill="none" stroke="{ink}" stroke-width="{sw * .6}"/>')
    L.append(f'<rect x="104" y="12" width="36" height="16" fill="none" stroke="{ink}" stroke-width="{sw}"/>'
             f'<circle cx="122" cy="38" r="5" fill="none" stroke="{ink}" stroke-width="{sw * .7}"/>')
    L.append(f'<rect x="14" y="14" width="44" height="56" fill="none" stroke="{ink}" stroke-width="{sw}"/>'
             f'<line x1="14" y1="28" x2="58" y2="28" stroke="{ink}" stroke-width="{sw * .6}"/>')
    # transats sur la terrasse
    for y in (40, 90):
        L.append(f'<rect x="250" y="{y}" width="34" height="14" rx="3" fill="none" stroke="{ink}" stroke-width="{sw * .8}"/>')
    # étiquettes
    lab = lambda x, y, t: L.append(f'<text x="{x}" y="{y}" font-family="Geist Mono" font-size="6.2" letter-spacing=".6" fill="{ink}">{t}</text>')
    lab(98, 150, "SALA RIUNIONI"); lab(16, 84, "CAMERA"); lab(100, 46, "STUDIO"); lab(232, 150, "TERRAZZA")
    lab(160, 30, "INGRESSO")
    # cotes
    L.append(f'<line x1="0" y1="176" x2="300" y2="176" stroke="{ink}" stroke-width=".5"/>'
             f'<line x1="0" y1="172" x2="0" y2="180" stroke="{ink}" stroke-width=".5"/><line x1="300" y1="172" x2="300" y2="180" stroke="{ink}" stroke-width=".5"/>')
    lab(122, 188, "24.60 M")
    L.append(f'<text x="0" y="206" font-family="Mona Sans" font-stretch="125%" font-weight="600" font-size="8" letter-spacing="2.4" fill="{ink}">'
             f'ATTICO · PIANO 31 · MILANO</text>'
             f'<text x="300" y="206" text-anchor="end" font-family="Geist Mono" font-size="7" fill="{ink}">SCALA 1:100</text>')
    # flèche nord
    L.append(f'<g transform="translate(286 186)"><circle r="7" fill="none" stroke="{ink}" stroke-width=".6"/>'
             f'<path d="M0 -6L2.5 3L0 1.5L-2.5 3Z" fill="{ink}"/></g>')
    return "".join(L), (W, H)


def series_a(ink=B.BAROLO, sub=None):
    """« Series A » : le nom de la première collection, en italique de titrage — le clin d'œil
    aux fondateurs (le premier tour de financement)."""
    sub = sub or ink
    return (f'<text x="150" y="70" text-anchor="middle" font-family="Playfair" font-style="italic" '
            f'font-size="92" style="font-variation-settings:\'opsz\' 900" fill="{ink}">Series A</text>'
            f'<text x="150" y="98" text-anchor="middle" font-family="Mona Sans" font-stretch="125%" font-weight="500" '
            f'font-size="8.5" letter-spacing="3.6" fill="{sub}">FUORICLASSE · FIRST ROUND · MMXXVI</text>'), (300, 104)


def coordinates(ink=B.CREMA):
    """« Quota » : les coordonnées des cinq villes, en colonne."""
    L = []
    for i, (c, la, lo) in enumerate(B.CITIES):
        y = 10 + i * 13
        L.append(f'<text x="0" y="{y}" font-family="Geist Mono" font-weight="500" font-size="8.6" fill="{ink}">{c}</text>'
                 f'<text x="150" y="{y}" text-anchor="end" font-family="Geist Mono" font-size="8.6" fill="{ink}">{la}  {lo}</text>')
    return "".join(L), (150, 70)


def out_of_class(ink=B.CREMA):
    """Signature de dos : la promesse en deux lignes, petite, sous la nuque."""
    return (f'<text x="60" y="12" text-anchor="middle" font-family="Playfair" font-style="italic" font-size="13" '
            f'style="font-variation-settings:\'opsz\' 200" fill="{ink}">Out of class.</text>'
            f'<text x="60" y="27" text-anchor="middle" font-family="Playfair" font-style="italic" font-size="13" '
            f'style="font-variation-settings:\'opsz\' 200" fill="{ink}">Never out of place.</text>'), (120, 30)


def key_big(ink=B.CREMA, outline=False, sw=2.0):
    d, (x, y, w, h) = B.key()
    if outline:
        return f'<path transform="translate({-x} {-y})" d="{d}" fill="none" stroke="{ink}" stroke-width="{sw}"/>', (w, h)
    return f'<path transform="translate({-x} {-y})" d="{d}" fill="{ink}"/>', (w, h)


def wordmark_stack(ink=B.CREMA):
    """FUORI / CLASSE sur deux lignes, en très grand — la pièce Statement typographique."""
    import glyphs as G
    f = G.font("wide", **B.F_WORD)
    capr = G.cap_height(f, 1000) / 1000
    size = 60 / capr
    d1, _ = G.text_path(f, "FUORI", size, 0, 60, tracking=0.12)
    a1, b1 = G.ink_bounds(f, "FUORI", size, tracking=0.12)
    d2, _ = G.text_path(f, "CLASSE", size, 0, 150, tracking=0.12)
    a2, b2 = G.ink_bounds(f, "CLASSE", size, tracking=0.12)
    W = max(b1 - a1, b2 - a2)
    return (f'<path transform="translate({(W - (b1 - a1)) / 2 - a1:.2f} 0)" d="{d1}" fill="{ink}"/>'
            f'<path transform="translate({(W - (b2 - a2)) / 2 - a2:.2f} 0)" d="{d2}" fill="{ink}"/>'), (W, 152)


def place(art, x, y, w, anchor="tc"):
    """Place une création (inner, (aw, ah)) à la largeur w ; anchor t/c + l/c."""
    inner, (aw, ah) = art
    s = w / aw
    h = ah * s
    ox = {"l": 0, "c": -w / 2, "r": -w}[anchor[1]]
    oy = {"t": 0, "c": -h / 2, "b": -h}[anchor[0]]
    return f'<g transform="translate({x + ox:.2f} {y + oy:.2f}) scale({s:.4f})">{inner}</g>'
