"""Construction géométrique du monogramme « Il Riflesso » : un A et son reflet
de part et d'autre de la Linea (la surface de la carrosserie)."""
import math

from shapely import affinity
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union


def _leg(p, q, width, side):
    """Jambage : bande de largeur `width` collée au bord extérieur p→q."""
    return LineString([p, q]).buffer(width * side, single_sided=True, cap_style=2, join_style=2)


def letter_a(cx, base, h, w, thin, thick, bar_y, bar_t):
    """A didone sans empattement : jambage gauche fin, droit épais, apex pointu,
    pieds coupés à l'horizontale sur la ligne de base."""
    apex = (cx, base - h)
    left = (cx - w / 2, base)
    right = (cx + w / 2, base)
    # on prolonge un peu les jambages vers le bas puis on coupe net sur la base
    ext = 0.25
    l2 = (left[0] - (apex[0] - left[0]) * ext, base + h * ext)
    r2 = (right[0] + (right[0] - apex[0]) * ext, base + h * ext)
    lleg = _leg(apex, l2, thin, -1)
    rleg = _leg(apex, r2, thick, 1)
    tri = Polygon([apex, left, right])
    bar = box(cx - w, bar_y - bar_t / 2, cx + w, bar_y + bar_t / 2).intersection(tri)
    a = unary_union([lleg, rleg, bar])
    # on rogne sur le triangle extérieur : apex parfaitement pointu, pieds nets
    return a.intersection(tri)


def reflection(shape, base, gap, k):
    """Reflet : symétrie verticale autour de la base, compression k, décalé de gap."""
    r = affinity.scale(shape, xfact=1, yfact=-k, origin=(0, base))
    return affinity.translate(r, 0, gap)


def striate(shape, top, cuts):
    """Découpe le reflet par des bandes horizontales (les « lames de lumière »).
    cuts = [(y_rel, épaisseur), ...] mesurés depuis `top`."""
    for y, t in cuts:
        shape = shape.difference(box(-1e4, top + y, 1e4, top + y + t))
    return shape


def to_path(geom, prec=3):
    """Géométrie shapely → attribut d SVG (evenodd)."""
    polys = getattr(geom, "geoms", [geom])
    out = []
    f = f"{{:.{prec}f}}"
    for p in polys:
        if p.is_empty:
            continue
        for ring in [p.exterior, *p.interiors]:
            pts = list(ring.coords)[:-1]
            out.append("M" + " L".join(f"{f.format(x)} {f.format(y)}" for x, y in pts) + " Z")
    return " ".join(out)


# --- Lettrage sur mesure « ARTE » : même logique de contraste que le monogramme
# (pleins verticaux / diagonales descendantes, déliés horizontaux / montantes).

def _ellipse(cx, cy, rx, ry, n=96):
    return Polygon([(cx + rx * math.cos(2 * math.pi * i / n), cy + ry * math.sin(2 * math.pi * i / n)) for i in range(n)])


def letter_r(x, top, H, w, thick, thin, bowl=0.53, leg_x=0.42, bowl_thick=None):
    bt = bowl_thick or thick * 0.92
    base = top + H
    yb = top + H * bowl            # bas de la panse
    ry = (yb - top) / 2
    rx = min(ry * 1.05, w * 0.55)
    bx = x + w - rx                # centre horizontal de l'arrondi
    outer = unary_union([box(x, top, bx, yb), _ellipse(bx, top + ry, rx, ry)])
    inner = unary_union([box(x + thick, top + thin, bx, yb - thin),
                         _ellipse(bx, top + ry, max(rx - bt, 1), ry - thin)])
    bowl_shape = outer.difference(inner)
    # on ne garde que la moitié droite de l'ellipse au-delà de bx
    bowl_shape = bowl_shape.intersection(box(x, top, x + w + 1, yb))
    stem = box(x, top, x + thick, base)
    p = (x + w * leg_x, yb - thin)
    q = (x + w * 1.02, base)
    ext = 0.4
    q2 = (q[0] + (q[0] - p[0]) * ext, q[1] + (q[1] - p[1]) * ext)
    p2 = (p[0] - (q[0] - p[0]) * ext, p[1] - (q[1] - p[1]) * ext)
    leg = LineString([p2, q2]).buffer(thick * 0.5, cap_style=2).intersection(box(x, yb - thin, x + w * 1.4, base))
    leg = leg.difference(box(x - 1, top, x + w * 2, yb - thin))
    return unary_union([stem, bowl_shape, leg])


def letter_t(x, top, H, w, thick, thin):
    cx = x + w / 2
    return unary_union([box(x, top, x + w, top + thin), box(cx - thick / 2, top, cx + thick / 2, top + H)])


def letter_e(x, top, H, w, thick, thin, mid=0.5):
    base = top + H
    ym = top + H * mid
    return unary_union([
        box(x, top, x + thick, base),
        box(x, top, x + w * 0.96, top + thin),
        box(x, ym - thin / 2, x + w * 0.84, ym + thin / 2),
        box(x, base - thin, x + w, base),
    ])
