"""Packaging et étiquetage : fichiers à plat en millimètres (SVG) + planches d'aperçu.

Les SVG utilisent l'unité mm (viewBox = format fini). Logos vectorisés ; les textes courants
sont en Mona Sans / Geist Mono (polices du dossier 03_typographie à installer chez l'imprimeur,
ou à vectoriser à l'export).
"""
import brand as B
import fx
import kit as K

OUT = K.ROOT / "07_packaging"
N, C, BA, T, GR = B.NERO, B.CREMA, B.BAROLO, B.TALPA, B.GRAFITE


def mm_svg(w, h, inner, defs="", bleed=0):
    """Format fini w × h mm ; avec bleed (fonds perdus), le premier aplat est prolongé dans la marge."""
    import re
    if bleed:
        m = re.match(r'<rect width="[\d.]+" height="[\d.]+" fill="([^"]+)"/>', inner)
        if m:
            inner = (f'<rect x="{-bleed}" y="{-bleed}" width="{w + 2 * bleed}" height="{h + 2 * bleed}" fill="{m.group(1)}"/>'
                     + inner[m.end():])
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w + 2 * bleed}mm" height="{h + 2 * bleed}mm" '
            f'viewBox="{-bleed} {-bleed} {w + 2 * bleed} {h + 2 * bleed}"><defs>{defs}</defs>{inner}</svg>')


def txt(x, y, s, size, fill, family="Mona Sans", anchor="middle", ls=0, weight=400, stretch=None, italic=False, extra=""):
    st = f' font-stretch="{stretch}"' if stretch else ""
    it = ' font-style="italic"' if italic else ""
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{family}" font-size="{size}" font-weight="{weight}"'
            f'{st}{it} letter-spacing="{ls}" fill="{fill}" {extra}>{s}</text>')


def designs():
    D = {}
    # --- étiquettes tissées (pliées en boucle, fil damassé)
    D["etiquettes/etiquette-principale-60x20"] = mm_svg(60, 20,
        f'<rect width="60" height="20" fill="{N}"/>{B.logo_g("wordmark-ricamo", 30, 10, width=40, fill=C, anchor="cc")}'
        f'<line x1="3" y1="0" x2="3" y2="20" stroke="{C}" stroke-opacity=".2" stroke-width=".2" stroke-dasharray=".6 .6"/>'
        f'<line x1="57" y1="0" x2="57" y2="20" stroke="{C}" stroke-opacity=".2" stroke-width=".2" stroke-dasharray=".6 .6"/>')
    for sz in ("S", "M", "L"):
        D[f"etiquettes/etiquette-taille-{sz}-20x20"] = mm_svg(20, 20,
            f'<rect width="20" height="20" fill="{N}"/>{txt(10, 12.6, sz, 8, C, "Playfair", ls=0)}'
            f'{txt(10, 17, "SERIES A", 1.6, C, "Mona Sans", ls=.5, stretch="125%", weight=500)}')
    D["etiquettes/etiquette-composition-30x80"] = mm_svg(30, 80,
        f'<rect width="30" height="80" fill="{C}"/>{B.logo_g("key-ricamo", 15, 8, width=12, fill=N, anchor="cc")}'
        + "".join(txt(3.5, 18 + i * 4.2, s, 1.75, N, "Geist Mono", "start") for i, s in enumerate(
            ["FC-A03-HD-NE", "", "100 % COTON", "100 % COTTON", "100 % COTONE", "", "MOLLETON 480 G/M²", "",
             "LAVER À 30 °C, À L'ENVERS", "NE PAS SÉCHER EN MACHINE", "REPASSER À L'ENVERS", "", "FABRIQUÉ AU [PAYS]",
             "SERIES A · MMXXVI"])))
    D["etiquettes/tab-de-manche-chiave-40x14"] = mm_svg(40, 14,
        f'<rect width="40" height="14" rx="1" fill="{BA}"/>{B.logo_g("key-ricamo", 20, 7, width=20, fill=C, anchor="cc")}')
    D["etiquettes/bande-de-proprete-gessato-200x10"] = mm_svg(200, 10,
        B.gessato_rect("gs", 0, 0, 200, 10, pitch=2.6, line=.3, bg=N, ink=C, opacity=.7, out=9, height=10))
    # --- hangtag 50 × 90 (recto / verso)
    hole = f'<circle cx="25" cy="8" r="2.2" fill="#fff" stroke="{T}" stroke-width=".2"/>'
    D["hangtags/hangtag-recto-50x90"] = mm_svg(50, 90,
        f'<rect width="50" height="90" fill="{N}"/>{hole}{B.logo_g("monogram", 25, 38, height=16, fill=C, anchor="cc")}'
        f'{B.logo_g("wordmark-ricamo", 25, 78, width=30, fill=C, anchor="cc")}', bleed=0)
    D["hangtags/hangtag-verso-50x90"] = mm_svg(50, 90,
        f'<rect width="50" height="90" fill="{C}"/>{hole}'
        f'{txt(6, 22, "FIRMA HOODIE", 3.2, N, "Playfair", "start", ls=.5, stretch="112.5%")}'
        f'{txt(6, 27, "Series A — Signature", 2.4, GR, "Playfair", "start", italic=True)}'
        + "".join(txt(6, 38 + i * 4, s, 2.1, N, "Geist Mono", "start") for i, s in enumerate(
            ["RÉF.   FC-A03-HD-NE", "TAILLE M", "MATIÈRE 100 % COTON", "        480 G/M²", "N°     0347 / 1000"]))
        + f'<line x1="6" y1="62" x2="44" y2="62" stroke="{T}" stroke-width=".2"/>'
        f'{txt(6, 69, "Out of class.", 3, BA, "Playfair", "start", italic=True)}{txt(6, 73.5, "Never out of place.", 3, BA, "Playfair", "start", italic=True)}'
        f'{txt(6, 84, "FUORICLASSE.COM", 1.9, T, "Mona Sans", "start", ls=.6, stretch="125%", weight=500)}')
    # --- carte de remerciement 150 × 100
    D["cartes/carte-remerciement-recto-150x100"] = mm_svg(150, 100,
        f'<rect width="150" height="100" fill="{C}"/>{txt(75, 46, "Grazie.", 20, BA, "Playfair", italic=True)}'
        f'{txt(75, 60, "WELCOME TO THE NEW GENERATION OF SUCCESS", 2.6, N, "Mona Sans", ls=1.1, stretch="125%", weight=500)}'
        f'{B.logo_g("key", 75, 84, width=16, fill=N, anchor="cc")}', bleed=3)
    D["cartes/carte-remerciement-verso-150x100"] = mm_svg(150, 100,
        f'<rect width="150" height="100" fill="{N}"/>'
        f'{txt(14, 24, "Cher membre,", 5, C, "Playfair", "start", italic=True)}'
        + "".join(txt(14, 36 + i * 6.2, s, 3.3, C, "Mona Sans", "start", extra='opacity=".85"') for i, s in enumerate(
            ["Cette pièce a été coupée pour ceux qui construisent :", "la réunion du matin, le vol du soir, le dîner qui décide.",
             "Portez-la longtemps. Elle est faite pour ça.", ""]))
        + f'{txt(14, 78, "L’équipe FUORICLASSE", 3.3, T, "Playfair", "start", italic=True)}'
        f'{B.logo_g("monogram", 136, 86, height=8, fill=C, anchor="br")}', bleed=3)
    # --- autocollants
    D["stickers/sticker-sceau-chiave-40mm"] = mm_svg(40, 40,
        f'<circle cx="20" cy="20" r="20" fill="{BA}"/>{B.logo_g("key-ricamo", 20.6, 20, width=22, fill=C, anchor="cc")}')
    D["stickers/sticker-sceau-monogramme-40mm"] = mm_svg(40, 40,
        f'<circle cx="20" cy="20" r="20" fill="{N}"/><circle cx="20" cy="20" r="17.5" fill="none" stroke="{C}" stroke-width=".25"/>'
        f'{B.logo_g("monogram", 20, 20, height=11, fill=C, anchor="cc")}')
    D["stickers/sticker-bande-60x20"] = mm_svg(60, 20,
        f'<rect width="60" height="20" fill="{C}"/>{B.logo_g("wordmark-ricamo", 30, 8.5, width=40, fill=N, anchor="cc")}'
        f'{txt(30, 15.6, "SERIES A · N° 0347 / 1000", 1.9, BA, "Geist Mono")}')
    # --- papier de soie (raccord 100 × 100 mm)
    D["boites/papier-de-soie-gessato-raccord"] = mm_svg(126, 201.6,
        B.gessato_rect("ps", 0, 0, 126, 201.6, pitch=7, line=.35, bg=C, ink=T, opacity=.8, out=9))
    # --- couvercle de boîte 440 × 330 (vue de dessus) + gabarit simplifié
    D["boites/couvercle-dessus-440x330"] = mm_svg(440, 330,
        f'<rect width="440" height="330" fill="{N}"/>{B.logo_g("wordmark", 220, 165, width=264, fill="#1d1c1a", anchor="cc")}'
        f'{txt(220, 316, "VERNIS SÉLECTIF MAT/BRILLANT SUR LE MOT-SYMBOLE — PAPIER NOIR TEINTÉ MASSE 1,2 MM CONTRECOLLÉ", 4, "#3a3836", "Geist Mono")}', bleed=3)
    W, D_, Hh = 440, 330, 110
    dl = (f'<rect x="{Hh}" y="{Hh}" width="{W}" height="{D_}" fill="{BA}" stroke="{N}" stroke-width=".6"/>'
          f'<rect x="{Hh}" y="0" width="{W}" height="{Hh}" fill="{N}" stroke="{C}" stroke-width=".6"/>'
          f'<rect x="{Hh}" y="{Hh + D_}" width="{W}" height="{Hh}" fill="{N}" stroke="{C}" stroke-width=".6"/>'
          f'<rect x="0" y="{Hh}" width="{Hh}" height="{D_}" fill="{N}" stroke="{C}" stroke-width=".6"/>'
          f'<rect x="{Hh + W}" y="{Hh}" width="{Hh}" height="{D_}" fill="{N}" stroke="{C}" stroke-width=".6"/>'
          f'{txt(Hh + W / 2, Hh + D_ / 2, "FOND INTÉRIEUR BAROLO", 9, C, "Mona Sans", ls=3, stretch="125%", weight=500)}'
          f'{txt(Hh + W / 2, Hh + D_ / 2 + 14, "440 × 330 × 110 MM — CARTON GRIS 1,5 MM, PAPIER NOIR À L’EXTÉRIEUR", 5, C, "Geist Mono")}'
          f'{B.logo_g("key", Hh + W / 2, Hh + D_ + Hh / 2, width=60, fill="#1d1c1a", anchor="cc")}')
        # fond de boîte : quatre parois de 110 mm dépliées
    D["boites/fond-gabarit-deplie"] = mm_svg(W + 2 * Hh, D_ + 2 * Hh, dl)
    # --- sac shopping 340 × 420 × 130 (face) et pochette d'expédition 360 × 460
    D["sacs/sac-shopping-face-340x420"] = mm_svg(340, 420,
        f'<rect width="340" height="420" fill="{C}"/>{B.logo_g("wordmark", 170, 210, width=210, fill=N, anchor="cc")}'
        f'<circle cx="120" cy="30" r="4" fill="none" stroke="{T}" stroke-width=".5"/><circle cx="220" cy="30" r="4" fill="none" stroke="{T}" stroke-width=".5"/>'
        f'{txt(170, 404, "ANSES EN RUBAN DE COTON BAROLO — PAPIER CRÈME 210 G NON COUCHÉ", 4, T, "Geist Mono")}', bleed=3)
    D["sacs/sac-shopping-soufflet-130x420"] = mm_svg(130, 420,
        f'<rect width="130" height="420" fill="{C}"/>{B.logo_g("key", 65, 344, width=64, fill=BA, anchor="cc")}', bleed=3)
    D["sacs/pochette-expedition-360x460"] = mm_svg(360, 460,
        f'<rect width="360" height="460" fill="#131313"/>{B.logo_g("key", 180, 216, width=250, fill="#1e1e1e", anchor="cc")}'
        f'{B.logo_g("wordmark-ricamo", 180, 396, width=180, fill=C, anchor="cc")}'
        f'{txt(180, 424, "HANDLE WITH AMBITION · SERIES A", 6, C, "Geist Mono", extra=chr(32) + "opacity=" + chr(34) + ".55" + chr(34))}'
        f'<rect x="0" y="0" width="360" height="40" fill="#0b0b0b"/>{txt(180, 26, "BANDE ADHÉSIVE REFERMABLE — POLYÉTHYLÈNE 80 % RECYCLÉ, ENCRE CRÈME", 5.5, "#4a4a4a", "Geist Mono")}')
    D["sacs/ruban-barolo-25mm"] = mm_svg(300, 25,
        f'<rect width="300" height="25" fill="{BA}"/>' + "".join(
            f'{B.logo_g("wordmark-ricamo", 50 + i * 100, 12.5, width=60, fill=C, anchor="cc")}' for i in range(3)))
    return D


def export():
    D = designs()
    for name, svg in D.items():
        K.write(OUT / "fichiers-impression" / f"{name}.svg", svg)
    return D


def board(D):
    """Planche à plat : toute la papeterie de marque sur un fond Pietra."""
    def tile(name, scale, x, y, rot=0, shadow=True):
        svg = D[name]
        import re
        w = float(re.search(r'width="([\d.]+)mm"', svg).group(1))
        h = float(re.search(r'height="([\d.]+)mm"', svg).group(1))
        sw, sh = w * scale, h * scale
        svg2 = svg.replace(f'width="{w:g}mm" height="{h:g}mm"', f'width="{sw}" height="{sh}"', 1)
        if svg2 == svg:
            svg2 = re.sub(r'width="[\d.]+mm" height="[\d.]+mm"', f'width="{sw}" height="{sh}"', svg, count=1)
        sh_css = "box-shadow:0 18px 40px rgba(40,30,20,.22),0 2px 6px rgba(40,30,20,.18);" if shadow else ""
        return (f'<div style="position:absolute;left:{x}px;top:{y}px;width:{sw}px;height:{sh}px;transform:rotate({rot}deg);'
                f'{sh_css}line-height:0">{svg2}</div>')
    s = 2.6
    items = [
        tile("cartes/carte-remerciement-recto-150x100", s, 70, 90, -4),
        tile("cartes/carte-remerciement-verso-150x100", s, 470, 70, 3),
        tile("hangtags/hangtag-recto-50x90", s * 1.25, 900, 80, -6),
        tile("hangtags/hangtag-verso-50x90", s * 1.25, 1080, 90, 4),
        tile("etiquettes/etiquette-principale-60x20", s * 1.6, 1290, 120, 0),
        tile("etiquettes/etiquette-taille-M-20x20", s * 1.6, 1290, 210, 0),
        tile("etiquettes/etiquette-taille-L-20x20", s * 1.6, 1380, 210, 0),
        tile("etiquettes/tab-de-manche-chiave-40x14", s * 1.6, 1290, 300, 0),
        tile("etiquettes/etiquette-composition-30x80", s * 1.25, 1470, 330, 5),
        tile("stickers/sticker-sceau-chiave-40mm", s * 1.2, 120, 500, 0, False),
        tile("stickers/sticker-sceau-monogramme-40mm", s * 1.2, 270, 520, 0, False),
        tile("stickers/sticker-bande-60x20", s * 1.4, 420, 560, -3),
        tile("sacs/ruban-barolo-25mm", s * 0.9, 120, 720, 0, False),
        tile("etiquettes/bande-de-proprete-gessato-200x10", s * 1.0, 120, 820, 0, False),
        tile("boites/papier-de-soie-gessato-raccord", s * 0.9, 760, 470, -2),
        tile("sacs/pochette-expedition-360x460", s * 0.5, 1130, 560, 6),
    ]
    body = (f'<div style="position:relative;width:1600px;height:1000px;background:var(--pietra);overflow:hidden" class="grain">'
            f'{"".join(items)}<div style="position:absolute;left:120px;bottom:44px">'
            f'<div class="lab" style="color:var(--grafite)">Packaging & étiquetage — à plat</div>'
            f'<div class="serif" style="font-size:40px;margin-top:6px">Chaque détail <i>signe.</i></div></div></div>')
    src = K.write(K.TMP / "pack" / "board.html", K.page(body, w=1600, h=1000))
    # planche d'étiquettes en gros plan (tissage)
    lab_defs = fx.fabric("tw", "twill", 6, 1.6) + fx.soft_shadow("ss", 10, 8, .3)
    def woven(name, x, y, w):
        import re
        svg = D[name]
        mw = float(re.search(r'width="([\d.]+)mm"', svg).group(1))
        mh = float(re.search(r'height="([\d.]+)mm"', svg).group(1))
        inner = re.sub(r"^<svg[^>]*>", "", svg)[:-6]
        s2 = w / mw
        return f'<g transform="translate({x} {y}) scale({s2})" filter="url(#ss)"><g filter="url(#tw)">{inner}</g></g>'
    svg = K.svg_doc(woven("etiquettes/etiquette-principale-60x20", 120, 160, 760)
                    + woven("etiquettes/tab-de-manche-chiave-40x14", 980, 190, 480)
                    + woven("etiquettes/etiquette-taille-M-20x20", 1000, 520, 200)
                    + woven("etiquettes/etiquette-taille-S-20x20", 1240, 520, 200)
                    + woven("etiquettes/bande-de-proprete-gessato-200x10", 120, 520, 760)
                    + woven("stickers/sticker-bande-60x20", 120, 700, 600),
                    1600, 1000, bg=B.PIETRA, defs=lab_defs)
    src2 = K.write(K.TMP / "pack" / "labels.html", K.svg_page(svg, 1600, 1000))
    return [{"in": src, "out": OUT / "planche-packaging-a-plat.jpg", "w": 1600, "h": 1000, "scale": 1.5, "quality": 90},
            {"in": src2, "out": OUT / "etiquettes-tissees-gros-plan.jpg", "w": 1600, "h": 1000, "scale": 1.5, "quality": 90}]


def build():
    D = export()
    K.render(board(D))


if __name__ == "__main__":
    build()
