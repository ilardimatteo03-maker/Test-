"""Système de logos Arte Automobili — toutes les déclinaisons sont dérivées de
paramètres uniques, puis exportées en tracés SVG purs (aucune police requise)."""
from shapely import affinity
from shapely.geometry import box
from shapely.ops import unary_union

from glyphs import font, ink_bounds, metrics, text_path
from mark import letter_a, letter_e, letter_r, letter_t, reflection, striate, to_path

PHI = (1 + 5 ** 0.5) / 2

# ---------------------------------------------------------------- monogramme
# Unité de construction : h = hauteur du A (100). Tout le reste en découle.
M = dict(h=100.0, w=74.0, thin=3.7, thick=13.2, bar=0.30, k=0.42,
         cuts=[(0.06, 0.016), (0.13, 0.026), (0.21, 0.038)])


def monogram(h=100.0, simplified=False, line=True, overshoot=0.012, level=None):
    """Monogramme. level : 'full' (≥ 120 px / 25 mm), 'simplified' (32–120 px,
    déliés renforcés, reflet à une seule lame), 'micro' (< 32 px : A + Linea).
    Origine : apex du A en (0,0) ; la Linea est posée à y = h."""
    level = level or ("simplified" if simplified else "full")
    s = h / M["h"]
    w, thin, thick = M["w"] * s, M["thin"] * s, M["thick"] * s
    if level == "simplified":
        thin, thick = thin * 1.75, thick * 1.12
    elif level == "micro":
        thin, thick = thin * 2.6, thick * 1.3
    base = h
    hh = h * (1 + overshoot)
    a = letter_a(0, base, hh, w, thin, thick, base - h * M["bar"], thin)
    lt = thin
    src = letter_a(0, base, hh, w, thin, thick, -1e6, 0)
    gap = 2 * lt if level == "full" else 1.6 * lt
    k = M["k"]
    r = reflection(src, base, gap, k)
    if level == "full":
        r = striate(r, base + gap, [(y * h, t * h) for y, t in M["cuts"]])
    elif level == "simplified":
        r = striate(r, base + gap, [(0.15 * h, 0.06 * h)])
    else:
        r = None
    half = w * PHI / 2 if level != "micro" else w * 0.62
    lin = box(-half, base, half, base + lt) if line else None
    bottom = base + gap + k * h if r is not None else base + lt
    return {"a": a, "r": r, "linea": lin, "w": w, "half": half, "lt": lt, "bottom": bottom}


def mono_union(g):
    return unary_union([x for x in (g["a"], g["r"], g["linea"]) if x is not None])


# ---------------------------------------------------------------- lettrage
ARTE = dict(thick=0.132, thin=0.037, track=0.205, wa=0.74, wr=0.56, wt=0.62, we=0.48,
            space=(0.74, 0.86, 0.80))


def arte(H=100.0, x=0.0, top=0.0):
    """Lettrage ARTE dessiné (contraste didone, sans empattement)."""
    p = ARTE
    th, tn, tr = p["thick"] * H, p["thin"] * H, p["track"] * H
    parts, cx = [], x
    wa = p["wa"] * H
    parts.append(letter_a(cx + wa / 2, top + H, H * 1.012, wa, tn, th, top + H * 0.70, tn))
    cx += wa + tr * p["space"][0]
    wr = p["wr"] * H
    parts.append(letter_r(cx, top, H, wr, th, tn, bowl_thick=th * 0.84))
    cx += wr + tr * p["space"][1]
    wt = p["wt"] * H
    parts.append(letter_t(cx, top, H, wt, th, tn))
    cx += wt + tr * p["space"][2]
    we = p["we"] * H
    parts.append(letter_e(cx, top, H, we, th, tn))
    cx += we
    g = unary_union(parts)
    return g, cx - x


SUB = dict(wght=500, wdth=125)


def automobili(width, cap, x=0.0, baseline=0.0, text="AUTOMOBILI"):
    """AUTOMOBILI en Archivo Expanded, justifié à l'encre sur `width`."""
    f = font("archivo", **SUB)
    m = metrics(f)
    size = cap / m["cap"] * m["upm"]
    x0, x1 = ink_bounds(f, text, size, 0)
    n = len(text) - 1
    tr = (width - (x1 - x0)) / n / size
    x0, _ = ink_bounds(f, text, size, tr)
    d, _ = text_path(f, text, size, x - x0, baseline, tr)
    return d


def tracked(text, cap, tracking, x=0.0, baseline=0.0, wght=500, wdth=125):
    """Ligne de texte Archivo vectorisée avec interlettrage fixe (em)."""
    f = font("archivo", wght=wght, wdth=wdth)
    m = metrics(f)
    size = cap / m["cap"] * m["upm"]
    x0, x1 = ink_bounds(f, text, size, tracking)
    d, _ = text_path(f, text, size, x - x0, baseline, tracking)
    return d, x1 - x0


# ---------------------------------------------------------------- compositions
def _svg(paths, vb, title, fill="#0D0F0E", bg=None, extra=""):
    from html import escape
    title = escape(title)
    x, y, w, h = vb
    body = "".join(paths)
    bgr = f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.2f} {y:.2f} {w:.2f} {h:.2f}" '
            f'width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{bgr}{extra}<g fill="{fill}" fill-rule="evenodd">{body}</g></svg>')


def P(d, fill=None):
    return f'<path d="{d}"{f" fill=" + chr(34) + fill + chr(34) if fill else ""}/>'


def sub_baseline(H):
    """Ligne de base d'AUTOMOBILI = pointe du reflet d'un monogramme de hauteur H :
    tout le système s'aligne sur la même grille."""
    return H * (1 + 2 * M["thin"] / M["h"] + M["k"])


def wordmark_block(H=100.0):
    """ARTE / AUTOMOBILI empilés — renvoie (paths, largeur, hauteur totale)."""
    g, W = arte(H)
    cap2 = H * 0.205
    base2 = sub_baseline(H)
    d2 = automobili(W, cap2, 0, base2)
    return [to_path(g), d2], W, base2


def lockups(H=100.0, accent=None):
    """Toutes les compositions. accent = couleur de la Linea (None = monochrome)."""
    out = {}
    lin_attr = accent

    # Monogramme
    g = monogram(140)
    mx = g["half"]
    top = -140 * 0.012
    bot = g["bottom"]
    mpaths = [P(to_path(g["a"])), P(to_path(g["r"])), P(to_path(g["linea"]), lin_attr)]
    pad = 0
    out["monogramme"] = (mpaths, (-mx - pad, top - pad, 2 * (mx + pad), bot - top + 2 * pad))

    gs = monogram(140, level="simplified")
    mx2 = gs["half"]
    out["monogramme-simplifie"] = ([P(to_path(gs["a"])), P(to_path(gs["r"])), P(to_path(gs["linea"]), lin_attr)],
                                   (-mx2, top, 2 * mx2, gs["bottom"] - top))
    gm = monogram(140, level="micro")
    mx3 = gm["half"]
    out["monogramme-micro"] = ([P(to_path(gm["a"])), P(to_path(gm["linea"]), lin_attr)],
                               (-mx3, top, 2 * mx3, gm["bottom"] - top))

    # Logo secondaire : lettrage seul
    wb, W, Hb = wordmark_block(H)
    out["logo-secondaire"] = ([P(d) for d in wb], (0, -H * 0.02, W, Hb + H * 0.02))

    # Version verticale : monogramme au-dessus du lettrage
    mh = H * 1.30
    gv = monogram(mh)
    gap = H * 0.62
    mono_bottom = mh + 2 * gv["lt"] + mh * M["k"]
    oy = mono_bottom + gap
    paths = [P(to_path(affinity.translate(gv[k], W / 2, 0)), lin_attr if k == "linea" else None)
             for k in ("a", "r", "linea")]
    paths += [f'<g transform="translate(0 {oy:.2f})">' + "".join(P(d) for d in wb) + "</g>"]
    left = min(0, W / 2 - gv["half"])
    right = max(W, W / 2 + gv["half"])
    out["logo-vertical"] = (paths, (left, -mh * 0.012, right - left, oy + Hb + mh * 0.012))

    # Logo principal (horizontal) : apex = capitale, Linea = base d'ARTE,
    # pointe du reflet = base d'AUTOMOBILI.
    gh = monogram(H)
    dx = gh["half"]
    space = H * 0.70
    wx = 2 * dx + space
    paths = [P(to_path(affinity.translate(gh[k], dx, 0)), lin_attr if k == "linea" else None)
             for k in ("a", "r", "linea")]
    paths += [f'<g transform="translate({wx:.2f} 0)">' + "".join(P(d) for d in wb) + "</g>"]
    topy = -H * 0.012
    out["logo-principal"] = (paths, (0, topy, wx + W, Hb - topy))

    # Version horizontale une ligne : monogramme + ARTE AUTOMOBILI
    g1, W1 = arte(H)
    cap2 = H * 0.36
    d_auto, w_auto = tracked("AUTOMOBILI", cap2, 0.32, 0, H)
    mh3 = H * 1.42
    g3 = monogram(mh3)
    dx3 = g3["half"]
    sp1 = H * 0.75
    xa = 2 * dx3 + sp1
    sp2 = H * 0.42
    paths = [P(to_path(affinity.translate(g3[k], dx3, H - mh3)), lin_attr if k == "linea" else None)
             for k in ("a", "r", "linea")]
    paths += [P(to_path(affinity.translate(g1, xa, 0))),
              f'<g transform="translate({xa + W1 + sp2:.2f} 0)">{P(d_auto)}</g>']
    topy = H - mh3 * 1.012
    boty = H + 2 * g3["lt"] + mh3 * M["k"]
    out["logo-horizontal"] = (paths, (0, topy, xa + W1 + sp2 + w_auto, boty - topy))

    # Signature typographique
    d_sig1 = to_path(arte(H)[0])
    d_auto2, w_auto2 = tracked("AUTOMOBILI", cap2, 0.32, 0, H)
    out["signature"] = ([P(d_sig1), f'<g transform="translate({W1 + sp2:.2f} 0)">{P(d_auto2)}</g>'],
                        (0, -H * 0.02, W1 + sp2 + w_auto2, H * 1.04))
    return out
