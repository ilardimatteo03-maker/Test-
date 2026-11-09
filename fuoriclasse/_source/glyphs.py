"""Vectorisation du lettrage FUORICLASSE.

Convertit un texte en tracés SVG à partir des polices OFL du dossier
03_typographie/polices (instances statiques extraites des polices variables).
Une fois exportés, les logos ne dépendent plus d'aucune police.
"""
from functools import lru_cache
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONTS = Path(__file__).resolve().parent.parent / "03_typographie" / "polices"
FILES = {
    "serif": "Playfair[opsz,wdth,wght].ttf",
    "serif-italic": "Playfair-Italic[opsz,wdth,wght].ttf",
    "sans": "MonaSans[wdth,wght].ttf",
    "sans-italic": "MonaSans-Italic[wdth,wght].ttf",
    "mono": "GeistMono[wght].ttf",
    "wide": "Playfair[opsz,wdth,wght].ttf",
}


@lru_cache(maxsize=None)
def font(name, **axes):
    f = TTFont(FONTS / FILES[name])
    if axes and "fvar" in f:
        f = instancer.instantiateVariableFont(f, axes, inplace=False)
    return f


def _kern(f, left, right):
    """Crénage GPOS (paires simples, formats 1 et 2) — suffisant pour les capitales."""
    if "GPOS" not in f:
        return 0
    gpos = f["GPOS"].table
    for lookup in gpos.LookupList.Lookup:
        if lookup.LookupType not in (2, 9):
            continue
        for st in lookup.SubTable:
            if lookup.LookupType == 9:
                if st.ExtensionLookupType != 2:
                    continue
                st = st.ExtSubTable
            cov = st.Coverage.glyphs
            if left not in cov:
                continue
            if st.Format == 1:
                ps = st.PairSet[cov.index(left)]
                for rec in ps.PairValueRecord:
                    if rec.SecondGlyph == right and rec.Value1 is not None:
                        return getattr(rec.Value1, "XAdvance", 0) or 0
            elif st.Format == 2:
                c1 = st.ClassDef1.classDefs.get(left, 0)
                c2 = st.ClassDef2.classDefs.get(right, 0)
                rec = st.Class1Record[c1].Class2Record[c2]
                if rec.Value1 is not None:
                    v = getattr(rec.Value1, "XAdvance", 0) or 0
                    if v:
                        return v
    return 0


def metrics(f):
    os2 = f["OS/2"]
    return {"upm": f["head"].unitsPerEm, "cap": os2.sCapHeight or 0, "xh": os2.sxHeight or 0}


def cap_height(f, size):
    """Hauteur de capitale mesurée sur le H (plus fiable que l'OS/2)."""
    gs = f.getGlyphSet()
    bp = BoundsPen(gs)
    gs[f.getBestCmap()[ord("H")]].draw(bp)
    return bp.bounds[3] * size / f["head"].unitsPerEm


def glyph_path(f, char, size, x=0.0, y=0.0):
    """Tracé d'un seul caractère, posé sur la ligne de base y. Retourne (d, avance)."""
    gs = f.getGlyphSet()
    g = f.getBestCmap()[ord(char)]
    s = size / f["head"].unitsPerEm
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, y)))
    return pen.getCommands(), f["hmtx"][g][0] * s


def glyph_bounds(f, char, size):
    gs = f.getGlyphSet()
    bp = BoundsPen(gs)
    gs[f.getBestCmap()[ord(char)]].draw(bp)
    s = size / f["head"].unitsPerEm
    a, b, c, d = bp.bounds
    return a * s, -d * s, c * s, -b * s  # xmin, ymin (haut), xmax, ymax (bas) en coordonnées SVG


def text_path(f, text, size, x=0.0, y=0.0, tracking=0.0, adjust=None, kern=True):
    """(d, largeur) : tracé SVG du texte posé sur la ligne de base y.
    size = taille d'un em ; tracking en em ; adjust = {index: em} corrections optiques
    appliquées après le caractère d'index donné."""
    cmap = f.getBestCmap()
    gs = f.getGlyphSet()
    hmtx = f["hmtx"]
    upm = f["head"].unitsPerEm
    s = size / upm
    adjust = adjust or {}
    names = [cmap[ord(c)] for c in text]
    pen = SVGPathPen(gs)
    cx = 0.0
    for i, g in enumerate(names):
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x + cx * s, y)))
        cx += hmtx[g][0]
        if i < len(names) - 1:
            if kern:
                cx += _kern(f, g, names[i + 1])
            cx += (tracking + adjust.get(i, 0)) * upm
    return pen.getCommands(), cx * s


def ink_bounds(f, text, size, tracking=0.0, adjust=None, kern=True):
    """Boîte d'encre réelle (xmin, xmax) du texte, pour un centrage optique."""
    cmap = f.getBestCmap()
    gs = f.getGlyphSet()
    hmtx = f["hmtx"]
    upm = f["head"].unitsPerEm
    adjust = adjust or {}
    names = [cmap[ord(c)] for c in text]
    xmin = xmax = None
    cx = 0.0
    for i, g in enumerate(names):
        bp = BoundsPen(gs)
        gs[g].draw(bp)
        if bp.bounds:
            a, _, b, _ = bp.bounds
            xmin = cx + a if xmin is None else min(xmin, cx + a)
            xmax = cx + b if xmax is None else max(xmax, cx + b)
        cx += hmtx[g][0]
        if i < len(names) - 1:
            cx += (_kern(f, g, names[i + 1]) if kern else 0) + (tracking + adjust.get(i, 0)) * upm
    s = size / upm
    return xmin * s, xmax * s


def centered(f, text, size, cx, y, tracking=0.0, adjust=None, kern=True):
    """Tracé centré optiquement sur cx (sur l'encre, pas sur les avances)."""
    a, b = ink_bounds(f, text, size, tracking, adjust, kern)
    return text_path(f, text, size, cx - (a + b) / 2, y, tracking, adjust, kern)[0]
