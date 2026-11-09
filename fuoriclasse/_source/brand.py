"""FUORICLASSE — cœur de l'identité : palette, marques vectorielles, motif.

Toutes les marques sont des tracés purs (aucune police requise une fois exportées).
Coordonnées SVG : y vers le bas. Chaque marque renvoie (d, (x, y, w, h)) où d est
un tracé à remplir en `fill-rule="nonzero"` et (x, y, w, h) sa boîte d'encre.
"""
import math
from functools import lru_cache

from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

import glyphs as G

# ---------------------------------------------------------------- palette
# name, hex, rôle, CMJN indicatif (à valider sur épreuve), RVB calculé
PALETTE = [
    ("Nero Assoluto", "#0E0D0C", "Noir profond — fond principal, texte", (0, 10, 15, 97)),
    ("Crema", "#EFE9DE", "Blanc crème — fond principal, texte inversé", (0, 2, 7, 6)),
    ("Grafite", "#3A3B3D", "Gris graphite — textes secondaires, textile", (5, 0, 0, 82)),
    ("Talpa", "#8B7F72", "Taupe — matières, fonds doux, textile", (0, 9, 18, 45)),
    ("Cioccolato", "#3D2A21", "Chocolat — textile, cuir, packaging", (0, 31, 46, 76)),
    ("Blu Notte", "#141B2A", "Bleu nuit — textile, soirée, digital", (52, 36, 0, 84)),
    ("Barolo", "#5E1B27", "Couleur signature — détails, doublures, rubans", (0, 71, 59, 63)),
]
HEX = {n: h for n, h, *_ in PALETTE}
NERO, CREMA, GRAFITE, TALPA, CIOCC, BLU, BAROLO = (HEX[k] for k in
    ("Nero Assoluto", "Crema", "Grafite", "Talpa", "Cioccolato", "Blu Notte", "Barolo"))
# couleurs de support (non identitaires)
OTTONE = "#A8916A"      # laiton brossé : métal des accessoires, dorure à chaud
PIETRA = "#D9D1C3"      # travertin : fonds photo, packaging intérieur
CREMA_2 = "#E4DCCD"     # crème ombrée : séparateurs sur fond Crema
NERO_2 = "#1A1917"      # noir levé : cartes sur fond Nero

# ---------------------------------------------------------------- polices
F_WORD = dict(opsz=30, wdth=112.5, wght=420)     # mot-symbole, master Display
F_WORD_S = dict(opsz=6, wdth=112.5, wght=470)    # master Ricamo : broderie et petites tailles
F_MONO = dict(opsz=20, wdth=112.5, wght=440)     # monogramme


def _box(x0, y0, x1, y1):
    return (x0, y0, x1 - x0, y1 - y0)


# ---------------------------------------------------------------- mot-symbole
WORD = "FUORICLASSE"
WORD_TRACK = 0.14
WORD_ADJ = {6: -0.045, 3: -0.01}   # L→A resserré, R→I légèrement


@lru_cache(maxsize=None)
def wordmark(cut="display", cap=100.0):
    """Mot-symbole FUORICLASSE ; cap = hauteur de capitale en unités SVG.
    cut : 'display' (grandes tailles) ou 'ricamo' (broderie, < 40 mm de large)."""
    axes = F_WORD if cut == "display" else F_WORD_S
    f = G.font("wide", **axes)
    size = cap / (G.cap_height(f, 1000) / 1000)
    tr = WORD_TRACK if cut == "display" else WORD_TRACK + 0.03
    d, _ = G.text_path(f, WORD, size, 0, 0, tracking=tr, adjust=WORD_ADJ)
    a, b = G.ink_bounds(f, WORD, size, tracking=tr, adjust=WORD_ADJ)
    # pas de jambage sous la ligne : légère tolérance pour les arrondis (O, C, S)
    return d, _box(a, -cap * 1.012, b, cap * 0.012)


# ---------------------------------------------------------------- propositions alternatives
@lru_cache(maxsize=None)
def wordmark_archi(cap=100.0):
    """Proposition 2 « Architettonico » : grotesque étendue Mona Sans."""
    f = G.font("sans", wdth=125, wght=540)
    size = cap / (G.cap_height(f, 1000) / 1000)
    d, _ = G.text_path(f, WORD, size, 0, 0, tracking=0.2)
    a, b = G.ink_bounds(f, WORD, size, tracking=0.2)
    return d, _box(a, -cap * 1.01, b, cap * 0.01)


@lru_cache(maxsize=None)
def wordmark_firma(cap=100.0):
    """Proposition 3 « Doppia Firma » : Fuori en italique + CLASSE en capitales étendues."""
    fi = G.font("serif-italic", opsz=60, wdth=100, wght=400)
    fs = G.font("sans", wdth=125, wght=560)
    s_cap = cap * 0.62
    size_i = cap / (G.cap_height(fi, 1000) / 1000)
    size_s = s_cap / (G.cap_height(fs, 1000) / 1000)
    d1, w1 = G.text_path(fi, "Fuori", size_i, 0, 0)
    a1, b1 = G.ink_bounds(fi, "Fuori", size_i)
    gap = cap * 0.2
    d2, _ = G.text_path(fs, "CLASSE", size_s, b1 + gap, 0, tracking=0.16)
    a2, b2 = G.ink_bounds(fs, "CLASSE", size_s, tracking=0.16)
    return d1 + d2, _box(a1, -cap * 1.05, b1 + gap + b2, cap * 0.25)


# ---------------------------------------------------------------- monogramme FC « Architrave »
def _stretch_F(f, size, delta):
    """Tracé du F dont seul le bras supérieur est allongé de `delta` (unités SVG).
    Les points du bras supérieur (à droite du fût, au-dessus de 68 % de la capitale)
    sont décalés vers la droite : la terminaison et son empattement restent intacts."""
    gs = f.getGlyphSet()
    g = f.getBestCmap()[ord("F")]
    upm = f["head"].unitsPerEm
    capu = G.cap_height(f, upm)
    rec = RecordingPen()
    gs[g].draw(rec)
    du = delta * upm / size

    s = size / upm
    pen = SVGPathPen(None)
    tp = TransformPen(pen, (s, 0, 0, -s, 0, 0))
    # seul le contour qui porte la ligne de capitale (fût + bras supérieur) est modifié
    contours, cur = [], []
    for op, pts in rec.value:
        cur.append((op, pts))
        if op in ("closePath", "endPath"):
            contours.append(cur)
            cur = []
    top = max(range(len(contours)), key=lambda i: max((p[1] for _, pts in contours[i] for p in pts), default=0))
    # bord droit du fût, mesuré sur ce contour : plus petite abscisse à droite de l'axe, à mi-hauteur
    xs = [p[0] for _, pts in contours[top] for p in pts]
    mid = (min(xs) + max(xs)) * 0.32
    stem_r = min(p[0] for _, pts in contours[top] for p in pts if capu * 0.3 < p[1] < capu * 0.9 and p[0] > mid)

    def mv(p):
        x, y = p
        if x > stem_r + 8 and y > capu * 0.55:
            return (x + du, y)
        return p

    for i, c in enumerate(contours):
        for op, pts in c:
            getattr(tp, op)(*[(mv(p) if i == top else p) for p in pts])
    return pen.getCommands()


@lru_cache(maxsize=None)
def monogram(cap=100.0):
    """FC : le bras du F couvre le C et le dépasse — « au-delà de la classe »."""
    f = G.font("wide", **F_MONO)
    size = cap / (G.cap_height(f, 1000) / 1000)
    fb = G.glyph_bounds(f, "F", size)
    cs = size * 0.80
    cb = G.glyph_bounds(f, "C", cs)
    cx = fb[2] - cap * 0.075 - cb[0]           # le C se glisse sous le bras médian
    c_right = cx + cb[2]
    over = cap * 0.13                           # dépassement du bras au-delà du C
    delta = c_right + over - fb[2]
    dF = _stretch_F(f, size, delta)
    dC, _ = G.glyph_path(f, "C", cs, cx, 0)
    return dF + dC, _box(fb[0], -cap * 1.0, c_right + over, cb[3])


# ---------------------------------------------------------------- symbole « La Chiave »
KEY = dict(r=50.0, sw=8.0, L=140.0, gap=40.0, t1=0.62, t2=0.44, step=0.5)
KEY_RICAMO = dict(r=50.0, sw=11.0, L=136.0, gap=42.0, t1=0.66, t2=0.48, step=0.52)


def key(scale=1.0, **kw):
    """La Chiave : un C ouvert (la classe) d'où sort un F couché, qui devient une clé.
    Origine au centre de l'anneau. Retourne (d, box)."""
    p = dict(KEY, **kw)
    r, sw, L = p["r"] * scale, p["sw"] * scale, p["L"] * scale
    a = math.radians(p["gap"])
    R, Ri, h = r + sw / 2, r - sw / 2, sw / 2
    ca, sa = math.cos(a), math.sin(a)
    ring = (f"M{R*ca:.3f} {-R*sa:.3f}A{R:.3f} {R:.3f} 0 1 0 {R*ca:.3f} {R*sa:.3f}"
            f"L{Ri*ca:.3f} {Ri*sa:.3f}A{Ri:.3f} {Ri:.3f} 0 1 1 {Ri*ca:.3f} {-Ri*sa:.3f}Z")
    T1, T2 = p["t1"] * r, p["t2"] * r
    xt = L - sw - p["step"] * r
    pts = [(0, -h), (L, -h), (L, T1), (L - sw, T1), (L - sw, h), (xt + sw, h), (xt + sw, T2),
           (xt, T2), (xt, h), (0, h)]
    blade = "M" + "L".join(f"{x:.3f} {y:.3f}" for x, y in pts) + "Z"
    return ring + blade, _box(-R, -R, L, R)


# ---------------------------------------------------------------- lockups
def _place(d, box, x, y, s):
    bx, by, bw, bh = box
    return f'<path transform="translate({x:.3f} {y:.3f}) scale({s:.5f}) translate({-bx:.3f} {-by:.3f})" d="{d}"/>'


LOCKUPS = ["wordmark", "wordmark-ricamo", "monogram", "key", "key-ricamo", "vertical", "horizontal",
           "signature", "archi", "firma"]


@lru_cache(maxsize=None)
def lockup(name):
    """Assemble les versions du logo. Retourne (inner_svg, (vw, vh)) avec viewBox 0 0 vw vh."""
    if name in ("wordmark", "wordmark-ricamo"):
        d, b = wordmark("display" if name == "wordmark" else "ricamo")
        return _place(d, b, 0, 0, 1), (b[2], b[3])
    if name == "monogram":
        d, b = monogram()
        return _place(d, b, 0, 0, 1), (b[2], b[3])
    if name in ("key", "key-ricamo"):
        d, b = key() if name == "key" else key(**KEY_RICAMO)
        return _place(d, b, 0, 0, 1), (b[2], b[3])
    if name in ("archi", "firma"):
        d, b = wordmark_archi() if name == "archi" else wordmark_firma()
        return _place(d, b, 0, 0, 1), (b[2], b[3])
    if name == "vertical":
        # clé au-dessus du mot-symbole
        dw, bw = wordmark()
        dk, bk = key()
        kw = bw[2] * 0.30
        ks = kw / bk[2]
        gap = bw[3] * 0.95
        W = bw[2]
        H = bk[3] * ks + gap + bw[3]
        g = _place(dk, bk, (W - kw) / 2, 0, ks) + _place(dw, bw, 0, bk[3] * ks + gap, 1)
        return g, (W, H)
    if name == "horizontal":
        dw, bw = wordmark()
        dk, bk = key()
        ks = bw[3] * 1.9 / bk[3]
        gap = bw[3] * 1.3
        kh = bk[3] * ks
        W = bk[2] * ks + gap + bw[2]
        g = _place(dk, bk, 0, 0, ks) + _place(dw, bw, bk[2] * ks + gap, (kh - bw[3]) / 2, 1)
        return g, (W, kh)
    if name == "signature":
        # mot-symbole + ligne de signature « THE NEW GENERATION OF SUCCESS »
        dw, bw = wordmark()
        f = G.font("sans", wdth=125, wght=480)
        cap = bw[3] * 0.24
        size = cap / (G.cap_height(f, 1000) / 1000)
        txt = "THE NEW GENERATION OF SUCCESS"
        a, b = G.ink_bounds(f, txt, size, tracking=0.32)
        sc = bw[2] / (b - a)
        tr = 0.32
        # ajuste l'interlettrage pour aligner la signature sur la largeur du mot-symbole
        for _ in range(12):
            a, b = G.ink_bounds(f, txt, size, tracking=tr)
            tr += (bw[2] - (b - a)) / (len(txt) - 1) / size
        d2, _ = G.text_path(f, txt, size, 0, 0, tracking=tr)
        a, b = G.ink_bounds(f, txt, size, tracking=tr)
        gap = bw[3] * 0.62
        rule_y = bw[3] + gap * 0.5
        g = _place(dw, bw, 0, 0, 1)
        g += f'<path transform="translate({-a:.3f} {bw[3] + gap + cap:.3f})" d="{d2}"/>'
        return g, (bw[2], bw[3] + gap + cap)
    if name == "monogram-key":
        dm, bm = monogram()
        dk, bk = key()
        ks = bm[3] * 0.62 / bk[3]
        gap = bm[3] * 0.55
        W = bm[2] + gap + bk[2] * ks
        g = _place(dm, bm, 0, 0, 1) + _place(dk, bk, bm[2] + gap, (bm[3] - bk[3] * ks) / 2, ks)
        return g, (W, bm[3])
    raise KeyError(name)


def logo_g(name, x, y, height=None, width=None, fill=NERO, anchor="tl", extra=""):
    """Logo vectoriel à insérer dans un SVG. anchor : t/c/b + l/c/r."""
    inner, (vw, vh) = lockup(name)
    s = height / vh if height else width / vw
    w, h = vw * s, vh * s
    ox = {"l": 0, "c": -w / 2, "r": -w}[anchor[1]]
    oy = {"t": 0, "c": -h / 2, "b": -h}[anchor[0]]
    return f'<g fill="{fill}" transform="translate({x + ox:.3f} {y + oy:.3f}) scale({s:.6f})" {extra}>{inner}</g>'


def logo_svg(name, fill=NERO, height=None, width=None, pad=0.0, bg=None, cls="", title="FUORICLASSE"):
    """Logo en balise <svg> autonome (fichier ou HTML). pad en fraction de la hauteur."""
    inner, (vw, vh) = lockup(name)
    p = vh * pad
    W, H = vw + 2 * p, vh + 2 * p
    size = ""
    if height:
        size = f' height="{height}" width="{height * W / H:.2f}"'
    elif width:
        size = f' width="{width}" height="{width * H / W:.2f}"'
    rect = f'<rect width="{W:.3f}" height="{H:.3f}" fill="{bg}"/>' if bg else ""
    c = f' class="{cls}"' if cls else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.3f} {H:.3f}"{size}{c} role="img" '
            f'aria-label="{title}"><title>{title}</title>{rect}<g fill="{fill}" transform="translate({p:.3f} {p:.3f})">{inner}</g></svg>')


def aspect(name):
    _, (vw, vh) = lockup(name)
    return vw / vh


# ---------------------------------------------------------------- motif « Il Gessato »
def gessato_pattern(pid, pitch=14.0, line=1.0, bg=BLU, ink=CREMA, out=9, opacity=0.55, height=None,
                    jog=None, transform=""):
    """<pattern> SVG du Gessato : une rayure tennis dont une rayure sur `out` fait un pas
    de côté (un demi-pas) sur une courte longueur, puis reprend son rang. Raccord demi-chute."""
    W = pitch * out
    H = height or W * 1.6
    jl = jog or H * 0.22
    els = [f'<rect width="{2 * W:.2f}" height="{H:.2f}" fill="{bg}"/>'] if bg else []

    def ln(x1, y1, x2, y2):
        return (f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{ink}" '
                f'stroke-width="{line:.2f}" opacity="{opacity}"/>')

    for half in (0, 1):
        y1 = H * 0.18 + half * H * 0.5
        for i in range(out):
            x = half * W + i * pitch + pitch / 2
            if i == out // 2:
                xo = x + pitch * 0.5
                els.append(ln(x, 0, x, y1) + ln(xo, y1, xo, y1 + jl) + ln(x, y1 + jl, x, H))
            else:
                els.append(ln(x, 0, x, H))
    tr = f' patternTransform="{transform}"' if transform else ""
    return (f'<pattern id="{pid}" width="{2 * W:.2f}" height="{H:.2f}" patternUnits="userSpaceOnUse"{tr}>'
            f'{"".join(els)}</pattern>')


def gessato_rect(pid, x, y, w, h, **kw):
    """Rectangle rempli du Gessato (defs incluses)."""
    return f'<defs>{gessato_pattern(pid, **kw)}</defs><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#{pid})"/>'


# ---------------------------------------------------------------- textes de marque
NAME = "FUORICLASSE"
CONCEPT = "THE NEW GENERATION OF SUCCESS"
AESTHETIC = "MODERN WEALTH CULTURE"
TAGLINE = "Out of class. Never out of place."
TAGLINE_IT = "Fuori classe. Mai fuori luogo."
TAGLINE_FR = "Hors classe. Jamais hors de propos."
COLLECTION = "SERIES A"
EST = "MMXXVI"
CITIES = [("MILANO", "45.4642 N", "9.1900 E"), ("LONDON", "51.5072 N", "0.1276 W"),
          ("MONACO", "43.7384 N", "7.4246 E"), ("PARIS", "48.8566 N", "2.3522 E"),
          ("DUBAI", "25.2048 N", "55.2708 E")]
