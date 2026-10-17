"""Vectorisation du lettrage : convertit un texte en tracés SVG (aucune dépendance
aux polices une fois le logo exporté). Utilise les polices variables OFL du dossier
03_typographie/polices et en extrait des instances statiques."""
from functools import lru_cache
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONTS = Path(__file__).resolve().parent.parent / "03_typographie" / "polices"
FILES = {
    "bodoni": "BodoniModa[opsz,wght].ttf",
    "bodoni-italic": "BodoniModa-Italic[opsz,wght].ttf",
    "archivo": "Archivo[wdth,wght].ttf",
    "dmmono": "DMMono-Regular.ttf",
}


@lru_cache(maxsize=None)
def font(name, **axes):
    f = TTFont(FONTS / FILES[name])
    if axes and "fvar" in f:
        f = instancer.instantiateVariableFont(f, axes, inplace=False)
    return f


def _kern(f, left, right):
    """Crénage GPOS (paires simples, format 1/2) — suffisant pour les capitales."""
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
    return {
        "upm": f["head"].unitsPerEm,
        "cap": getattr(os2, "sCapHeight", 0) or 0,
        "xh": getattr(os2, "sxHeight", 0) or 0,
    }


def text_path(f, text, size, x=0.0, y=0.0, tracking=0.0, adjust=None, kern=True):
    """Retourne (d, largeur) : tracé SVG du texte posé sur la ligne de base y.
    size = taille en unités SVG pour 1 em ; tracking en em ; adjust = {index: em}
    pour des corrections optiques manuelles après le caractère d'index donné."""
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
        tp = TransformPen(pen, (s, 0, 0, -s, x + cx * s, y))
        gs[g].draw(tp)
        cx += hmtx[g][0]
        if i < len(names) - 1:
            if kern:
                cx += _kern(f, g, names[i + 1])
            cx += (tracking + adjust.get(i, 0)) * upm
    return pen.getCommands(), cx * s


def ink_bounds(f, text, size, tracking=0.0, adjust=None):
    """Boîte d'encre réelle (xmin, xmax) du texte — sert à centrer optiquement."""
    from fontTools.pens.boundsPen import BoundsPen

    cmap = f.getBestCmap()
    gs = f.getGlyphSet()
    hmtx = f["hmtx"]
    upm = f["head"].unitsPerEm
    adjust = adjust or {}
    names = [cmap[ord(c)] for c in text]
    xmin, xmax = None, None
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
            cx += _kern(f, g, names[i + 1]) + (tracking + adjust.get(i, 0)) * upm
    s = size / upm
    return xmin * s, xmax * s
