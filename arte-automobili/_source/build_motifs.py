"""Motifs secondaires : lames de lumière, trame répétable, cadre de fiche technique, Linea."""
from kit import A, B, G, N, ROOT, TR, V, text

OUT = ROOT / "05_univers-graphique" / "motifs"

# rythme des lames : (épaisseur, espace) — issu des coupes du reflet du monogramme
RYTHME = [(6, 4), (4, 6), (2.5, 8), (1.5, 11)]


def lames(w, h, color, bg=None, vertical=False):
    y, out = 0.0, []
    while y < h:
        for t, gap in RYTHME:
            out.append(f'<rect x="0" y="{y:.2f}" width="{w}" height="{t}" fill="{color}"/>')
            y += t + gap
    body = "".join(out)
    bgr = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{bgr}'
            f'<defs><clipPath id="c"><rect width="{w}" height="{h}"/></clipPath></defs><g clip-path="url(#c)">{body}</g></svg>')


def trame(color, bg):
    """Tuile 120 × 120 répétable : quatre lames décalées, pour ruban adhésif, papier de soie, intérieur d'enveloppe."""
    s, out = 120, []
    for row in range(4):
        y = row * 30
        x0 = (row % 2) * 60
        for i, (t, gap) in enumerate(RYTHME):
            out.append(f'<rect x="{x0}" y="{y + sum(a + b for a, b in RYTHME[:i]):.2f}" width="60" height="{t}" fill="{color}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s} {s}" width="{s}" height="{s}">'
            f'<rect width="{s}" height="{s}" fill="{bg}"/>{"".join(out)}</svg>')


def fiche(color=N, bg=B):
    w, h = 600, 340
    m = 18
    marks = ""
    for x, y, dx, dy in [(m, m, 1, 1), (w - m, m, -1, 1), (m, h - m, 1, -1), (w - m, h - m, -1, -1)]:
        marks += f'<path d="M{x} {y + dy * 22}V{y}H{x + dx * 22}" fill="none" stroke="{color}" stroke-width="1"/>'
    rows = [("VÉHICULE", "COUPÉ GT"), ("VERNIS", "118–124 µm"), ("CORRECTION", "2 ÉTAPES · 12 H"), ("PROTECTION", "CÉRAMIQUE 5 ANS")]
    body = ""
    for i, (k, v) in enumerate(rows):
        y = 96 + i * 52
        body += text(60, y, k, 15, "mono", 400, color, ls=0.06, opacity=0.65)
        body += f'<line x1="200" y1="{y - 4}" x2="{w - 230}" y2="{y - 4}" stroke="{color}" stroke-dasharray="1 5" stroke-opacity=".5"/>'
        body += text(w - 60, y, v, 15, "mono", 400, color, ls=0.06, anchor="end")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<rect width="{w}" height="{h}" fill="{bg}"/>{marks}{body}'
            f'{text(60, 300, "Opera N° 0147", 14, "mono", 400, color, ls=0.06, opacity=0.65)}</svg>')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = {
        "lames-de-lumiere-bianco.svg": lames(1200, 64, B), "lames-de-lumiere-nero.svg": lames(1200, 64, N),
        "trame-lames-nero-sur-verde.svg": trame(N, V), "trame-lames-bianco-sur-nero.svg": trame(B, N),
        "fiche-technique-cadre.svg": fiche(), "fiche-technique-cadre-sombre.svg": fiche(B, N),
        "linea-1200.svg": f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 2" width="1200" height="2"><rect width="1200" height="1" fill="{A}"/></svg>',
    }
    for k, v in files.items():
        (OUT / k).write_text(v)
    print(len(files), "motifs")


if __name__ == "__main__":
    main()
