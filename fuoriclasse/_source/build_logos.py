"""Logos FUORICLASSE : SVG, PNG, PDF, icônes, planches des propositions, broderies."""
import shutil

import brand as B
import fx
import kit as K

OUT = K.ROOT / "02_logo"

VERSIONS = {  # nom de fichier → lockup
    "logo-principal": "wordmark",
    "logo-ricamo": "wordmark-ricamo",
    "monogramme": "monogram",
    "chiave": "key",
    "chiave-ricamo": "key-ricamo",
    "logo-vertical": "vertical",
    "logo-horizontal": "horizontal",
    "signature": "signature",
}
COLORS = {"nero": B.NERO, "crema": B.CREMA, "barolo": B.BAROLO, "noir-100": "#000000", "blanc-100": "#FFFFFF"}


def export_files():
    for d in ("svg", "png", "pdf", "icones"):
        shutil.rmtree(OUT / d, ignore_errors=True)
    jobs = []
    for fname, lk in VERSIONS.items():
        for cname, col in COLORS.items():
            svg = B.logo_svg(lk, fill=col, title=f"FUORICLASSE — {fname}")
            K.write(OUT / "svg" / f"fc-{fname}-{cname}.svg", svg)
        # PNG transparents et PDF vectoriels pour les couleurs de marque
        ar = B.aspect(lk)
        for cname in ("nero", "crema", "barolo"):
            col = COLORS[cname]
            if ar > 2.2:
                W = 3000
                H = round(W / ar)
            else:
                H = 1600
                W = round(H * ar)
            pad = 0.0
            html = K.page(f'<div style="width:{W}px;height:{H}px">{B.logo_svg(lk, fill=col, width=W)}</div>',
                          w=W, h=H, css="html,body{background:transparent}")
            src = K.write(K.TMP / "logos" / f"{fname}-{cname}.html", html)
            jobs.append({"in": src, "out": OUT / "png" / f"fc-{fname}-{cname}-{W}px.png", "w": W, "h": H,
                         "transparent": True})
            # PDF : 1 px = 1/96 in ; on fixe la largeur à 200 mm (100 mm pour monogramme et clé)
            wmm = 200 if ar > 2.2 else 100
            hmm = wmm / ar
            pdf_html = K.page(f'<div style="width:{wmm}mm;height:{hmm}mm">{B.logo_svg(lk, fill=col, width=wmm * 96 / 25.4)}</div>',
                              css=f"@page{{size:{wmm}mm {hmm:.3f}mm;margin:0}}html,body{{background:transparent}}")
            srcp = K.write(K.TMP / "logos" / f"{fname}-{cname}-pdf.html", pdf_html)
            jobs.append({"in": srcp, "out": OUT / "pdf" / f"fc-{fname}-{cname}.pdf", "w": 800, "h": 600,
                         "pdf": {"width": f"{wmm}mm", "height": f"{hmm:.3f}mm"}})
    # icônes
    ic = OUT / "icones"
    ic.mkdir(parents=True, exist_ok=True)

    def icon_svg(size, lk, fg, bg, scale=0.56, round_=0.0):
        _, (vw, vh) = B.lockup(lk)
        w = size * scale
        h = w * vh / vw
        if h > size * scale * 0.7:
            h = size * scale * 0.7
            w = h * vw / vh
        rx = f' rx="{size * round_:.1f}"' if round_ else ""
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">'
                f'<rect width="{size}" height="{size}" fill="{bg}"{rx}/>'
                f'{B.logo_g(lk, size / 2 + (size * 0.035 if lk.startswith("key") else 0), size / 2, width=w, fill=fg, anchor="cc")}</svg>')

    K.write(ic / "favicon.svg", icon_svg(64, "key-ricamo", B.CREMA, B.NERO, scale=0.78, round_=0.0))
    variants = [
        ("avatar-reseaux-chiave-1080", 1080, "key", B.CREMA, B.NERO, 0.5, 0),
        ("avatar-reseaux-monogramme-1080", 1080, "monogram", B.NERO, B.CREMA, 0.46, 0),
        ("avatar-reseaux-monogramme-barolo-1080", 1080, "monogram", B.CREMA, B.BAROLO, 0.46, 0),
        ("app-icon-512", 512, "key-ricamo", B.CREMA, B.NERO, 0.6, 0),
        ("apple-touch-icon-180", 180, "key-ricamo", B.CREMA, B.NERO, 0.62, 0),
        ("favicon-32", 32, "key-ricamo", B.CREMA, B.NERO, 0.86, 0),
        ("favicon-16", 16, "key-ricamo", B.CREMA, B.NERO, 0.9, 0),
    ]
    for name, size, lk, fg, bg, sc, r in variants:
        svg = icon_svg(size, lk, fg, bg, sc, r)
        K.write(ic / f"{name}.svg", svg)
        src = K.write(K.TMP / "logos" / f"icon-{name}.html", K.page(svg, w=size, h=size))
        jobs.append({"in": src, "out": ic / f"{name}.png", "w": size, "h": size})
    return jobs


# ---------------------------------------------------------------- planches
BOARD_CSS = """
.board{position:relative;width:1600px;height:1000px;background:var(--crema);display:grid;grid-template-columns:520px 1fr;overflow:hidden}
.side{padding:64px 56px;display:flex;flex-direction:column;gap:22px;border-right:1px solid var(--crema-2)}
.num{font-family:'Geist Mono';font-size:12px;letter-spacing:.12em;color:var(--talpa)}
h1{font-family:'Playfair';font-variation-settings:'opsz' 900;font-weight:400;font-size:64px;line-height:1;letter-spacing:-.01em}
h1 em{font-style:italic}
.side p{font-size:15px;line-height:1.6;color:#2b2926}
.pc{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:auto;font-size:13px;line-height:1.5}
.pc b{display:block;font-family:'Mona Sans';font-stretch:125%;font-weight:600;font-size:10px;letter-spacing:.28em;text-transform:uppercase;margin-bottom:6px}
.rec{position:absolute;top:28px;right:28px;background:var(--barolo);color:var(--crema);padding:8px 14px;font-family:'Mona Sans';font-stretch:125%;font-size:10px;letter-spacing:.3em;font-weight:600}
.main{display:grid;grid-template-rows:1fr 300px}
.hero{display:flex;align-items:center;justify-content:center}
.row{display:grid;grid-template-columns:repeat(4,1fr)}
.tile{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.cap{position:absolute;left:16px;bottom:12px;font-family:'Geist Mono';font-size:10px;letter-spacing:.08em;opacity:.7}
"""


def _label_svg(lk, fg, bg, w=200, h=84):
    """Étiquette tissée pliée (vue de face) avec le logo."""
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs>{fx.fabric("lb" + lk, "twill", 4, 1.2)}'
            f'{fx.soft_shadow("ls", 8, 6, .25)}</defs><g filter="url(#ls)"><g filter="url(#lb{lk})">'
            f'<rect x="0" y="0" width="{w}" height="{h}" fill="{bg}"/></g>'
            f'<line x1="10" y1="0" x2="10" y2="{h}" stroke="{fg}" stroke-opacity=".25" stroke-dasharray="3 3"/>'
            f'<line x1="{w - 10}" y1="0" x2="{w - 10}" y2="{h}" stroke="{fg}" stroke-opacity=".25" stroke-dasharray="3 3"/>'
            f'{B.logo_g(lk, w / 2, h / 2, width=w * 0.62, fill=fg, anchor="cc")}</g></svg>')


def proposal_boards():
    props = [
        ("01", "Sartoriale", "wordmark", True,
         "Capitales à empattements larges, dessinées à partir de Playfair (axe d'optique), interlettrage de 14 %. "
         "Le mot-symbole parle la langue des maisons italiennes et de la presse de mode : un tailleur, pas un slogan.",
         "Deux masters : <i>Display</i> au-delà de 40 mm, <i>Ricamo</i> (empattements renforcés) pour la broderie et les petites tailles.",
         "Intemporel. Se brode, se tisse, se grave. Tient sur une étiquette comme sur une façade.",
         "Plus classique que « street » : la modernité vient du symbole, du motif et des pièces Statement."),
        ("02", "Architettonico", "archi", False,
         "Grotesque étendue (Mona Sans, largeur 125 %), capitales très espacées. Le registre de l'architecture "
         "contemporaine, des halls d'hôtel et de la signalétique.",
         "Lisible de loin, très efficace en digital et en grand format.",
         "Impact, modernité, lecture immédiate.",
         "Registre déjà très occupé par le streetwear premium : moins distinctif, moins « luxe »."),
        ("03", "Doppia Firma", "firma", False,
         "<i>Fuori</i> en italique, CLASSE en capitales étendues. Le contraste dit le nom : la liberté de sortir du rang, "
         "la structure de ceux qui construisent.",
         "Gardée comme style éditorial des titres (italique + capitales), pas comme logo.",
         "Mémorable, éditorial, très magazine.",
         "Deux familles dans un logo : fragile en broderie et sous 30 mm."),
    ]
    jobs = []
    for num, name, lk, rec, txt, note, pro, con in props:
        hero = B.logo_svg(lk, fill=B.NERO, width=820)
        tiles = [
            (B.NERO, B.logo_svg(lk, fill=B.CREMA, width=190), "SUR NERO ASSOLUTO", B.CREMA),
            (B.BAROLO, B.logo_svg(lk, fill=B.CREMA, width=190), "SUR BAROLO", B.CREMA),
            (B.PIETRA, _label_svg(lk if lk != "wordmark" else "wordmark-ricamo", B.CREMA, B.NERO), "ÉTIQUETTE TISSÉE", B.NERO),
            (B.CREMA_2, "<div style='display:flex;flex-direction:column;gap:14px;align-items:center'>"
                        f"{B.logo_svg(lk if lk != 'wordmark' else 'wordmark-ricamo', fill=B.NERO, width=180)}"
                        f"{B.logo_svg(lk if lk != 'wordmark' else 'wordmark-ricamo', fill=B.NERO, width=110)}"
                        f"{B.logo_svg(lk if lk != 'wordmark' else 'wordmark-ricamo', fill=B.NERO, width=70)}</div>",
             "PETITES TAILLES", B.NERO),
        ]
        row = "".join(f'<div class="tile" style="background:{bg}">{inner}<span class="cap" style="color:{c}">{cap}</span></div>'
                      for bg, inner, cap, c in tiles)
        title = name if num != "03" else "Doppia <em>Firma</em>"
        body = f"""<div class="board">
<div class="side"><div class="num">PROPOSITION {num} / 03 — MOT-SYMBOLE</div><h1>{title}</h1>
<p>{txt}</p><p style="color:var(--grafite)">{note}</p>
<div class="pc"><div><b>Forces</b>{pro}</div><div><b>Limites</b>{con}</div></div></div>
<div class="main"><div class="hero">{hero}</div><div class="row">{row}</div></div>
{'<div class="rec">RECOMMANDÉE</div>' if rec else ''}</div>"""
        src = K.write(K.TMP / "logos" / f"prop-{num}.html", K.page(body, css=BOARD_CSS, w=1600, h=1000))
        jobs.append({"in": src, "out": OUT / "propositions" / f"proposition-{num}-{name.lower().replace(' ', '-')}.png",
                     "w": 1600, "h": 1000, "scale": 1.5})
    return jobs


def construction_board():
    """Monogramme et symbole : construction et sens."""
    import math
    dk, bk = B.key()
    # schéma : le C ouvert + le F couché
    kd = B.KEY
    r, sw, L = kd["r"], kd["sw"], kd["L"]
    s = 2.6
    cx, cy = 300, 330
    a = math.radians(kd["gap"])
    guides = (f'<g stroke="{B.BAROLO}" stroke-width="1" fill="none" stroke-dasharray="4 4">'
              f'<circle cx="{cx}" cy="{cy}" r="{r * s}"/>'
              f'<line x1="{cx}" y1="{cy - 150}" x2="{cx}" y2="{cy + 150}"/>'
              f'<line x1="{cx - 170}" y1="{cy}" x2="{cx + L * s + 40}" y2="{cy}"/>'
              f'<line x1="{cx}" y1="{cy}" x2="{cx + 190 * math.cos(a)}" y2="{cy - 190 * math.sin(a)}"/>'
              f'<line x1="{cx}" y1="{cy}" x2="{cx + 190 * math.cos(a)}" y2="{cy + 190 * math.sin(a)}"/></g>'
              f'<text x="{cx + 150}" y="{cy - 92}" font-family="Geist Mono" font-size="11" fill="{B.BAROLO}">40°</text>'
              f'<text x="{cx - 160}" y="{cy - 140}" font-family="Geist Mono" font-size="11" fill="{B.BAROLO}">C — LA CLASSE</text>'
              f'<text x="{cx + L * s - 150}" y="{cy + 100}" font-family="Geist Mono" font-size="11" fill="{B.BAROLO}">F COUCHÉ — LE PANNETON</text>')
    key_big = f'<g transform="translate({cx} {cy}) scale({s})" fill="{B.NERO}"><path d="{dk}"/></g>'
    f_letter = B.logo_svg("monogram", fill=B.NERO, height=300)
    body = f"""<div style="width:1600px;height:1000px;display:grid;grid-template-columns:1fr 1fr;background:var(--crema)">
<div style="position:relative;border-right:1px solid var(--crema-2)">
 <div style="position:absolute;left:56px;top:56px" class="num">MONOGRAMME — « ARCHITRAVE »</div>
 <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">{f_letter}</div>
 <div style="position:absolute;left:56px;right:56px;bottom:56px;font-size:15px;line-height:1.6">
 <h2 class="serif" style="font-size:40px;line-height:1.05;margin-bottom:14px">Le F couvre le C, <i>et le dépasse.</i></h2>
 Le bras du F s'allonge comme une architrave au-dessus du C — la classe — puis va au-delà.
 Lu en une seconde, compris en deux : être <i>au-dessus</i> de la norme, sans la renier.</div></div>
<div style="position:relative">
 <div style="position:absolute;left:56px;top:56px" class="num">SYMBOLE — « LA CHIAVE »</div>
 <svg width="800" height="640" style="position:absolute;left:0;top:40px">{guides}{key_big}</svg>
 <div style="position:absolute;left:56px;right:56px;bottom:56px;font-size:15px;line-height:1.6">
 <h2 class="serif" style="font-size:40px;line-height:1.05;margin-bottom:14px">Un C ouvert. Un F qui en sort. <i>Une clé.</i></h2>
 L'anneau est un C ouvert de 2 × 40° ; la tige part de son centre et sort par l'ouverture ; les deux dents sont les bras d'un F couché.
 FUORI + CLASSE, en un seul trait : la clé d'une culture, pas un symbole de richesse.</div></div></div>"""
    css = ".num{font-family:'Geist Mono';font-size:12px;letter-spacing:.12em;color:var(--talpa)}"
    src = K.write(K.TMP / "logos" / "construction.html", K.page(body, css=css, w=1600, h=1000))
    return [{"in": src, "out": OUT / "planches" / "monogramme-et-symbole-construction.png", "w": 1600, "h": 1000, "scale": 1.5}]


def system_board():
    """Planche du système : toutes les versions, fonds de marque."""
    cells = [
        ("logo-principal", "wordmark", B.CREMA, B.NERO, 0.62),
        ("logo-principal", "wordmark", B.NERO, B.CREMA, 0.62),
        ("signature", "signature", B.BLU, B.CREMA, 0.62),
        ("logo-vertical", "vertical", B.CREMA_2, B.NERO, 0.42),
        ("monogramme", "monogram", B.BAROLO, B.CREMA, 0.30),
        ("chiave", "key", B.NERO, B.CREMA, 0.38),
        ("logo-horizontal", "horizontal", B.TALPA, B.CREMA, 0.66),
        ("monogramme", "monogram", B.CREMA, B.NERO, 0.30),
        ("chiave", "key", B.CIOCC, B.CREMA, 0.38),
    ]
    tiles = ""
    for name, lk, bg, fg, sc in cells:
        tiles += (f'<div style="position:relative;background:{bg};display:flex;align-items:center;justify-content:center">'
                  f'{B.logo_svg(lk, fill=fg, width=int(520 * sc))}'
                  f'<span style="position:absolute;left:18px;bottom:14px;font-family:Geist Mono;font-size:10px;letter-spacing:.1em;color:{fg};opacity:.6">'
                  f'fc-{name}</span></div>')
    body = f'<div style="width:1600px;height:1000px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr)">{tiles}</div>'
    src = K.write(K.TMP / "logos" / "systeme.html", K.page(body, w=1600, h=1000))
    return [{"in": src, "out": OUT / "planches" / "systeme-de-logos.png", "w": 1600, "h": 1000, "scale": 1.5}]


def embroidery_board():
    """Logos brodés sur échantillons de tissu (rendus) et versions micro."""
    W, H = 1600, 1000
    sw = [
        ("Broderie ton sur ton", B.NERO, "#1d1b19", "wordmark-ricamo", "molleton", 0.62, "Hoodie Nero · fil Nero mat, 60 mm"),
        ("Broderie crème", B.BLU, B.CREMA, "monogram", "molleton", 0.3, "Crewneck Blu Notte · monogramme 32 mm"),
        ("Fil Barolo", B.CREMA, B.BAROLO, "key-ricamo", "pique", 0.42, "Polo Crema · Chiave 18 mm"),
        ("Broderie ton sur ton", B.CIOCC, "#4b372d", "monogram", "twill", 0.3, "Casquette Cioccolato · 45 mm"),
        ("Broderie crème", B.GRAFITE, B.CREMA, "wordmark-ricamo", "jersey", 0.62, "T-shirt Grafite · 50 mm"),
        ("Fil Ottone", B.NERO, B.OTTONE, "key-ricamo", "twill", 0.42, "Casquette Nero · Chiave 22 mm"),
    ]
    cw, ch = W / 3, H / 2
    parts, defs = [], []
    for i, (lab, bg, thread, lk, kind, sc, cap) in enumerate(sw):
        x, y = (i % 3) * cw, (i // 3) * ch
        defs.append(fx.fabric(f"f{i}", kind, seed=i + 3, strength=1.2))
        defs.append(fx.embroidery(f"e{i}", height=2.4 if lk.startswith("word") else 3.0, seed=i + 9))
        defs.append(f'<radialGradient id="v{i}" cx=".45" cy=".4" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".10"/>'
                    f'<stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>')
        parts.append(f'<g transform="translate({x} {y})"><rect width="{cw}" height="{ch}" fill="{bg}" filter="url(#f{i})"/>'
                     f'<rect width="{cw}" height="{ch}" fill="url(#v{i})"/>'
                     f'<g filter="url(#e{i})">{B.logo_g(lk, cw / 2, ch / 2 - 8, width=cw * sc, fill=thread, anchor="cc")}</g>'
                     f'<text x="22" y="{ch - 40}" font-family="Mona Sans" font-stretch="125%" font-size="10" letter-spacing="3" '
                     f'fill="{B.CREMA if bg != B.CREMA else B.NERO}" opacity=".85">{lab.upper()}</text>'
                     f'<text x="22" y="{ch - 22}" font-family="Geist Mono" font-size="11" fill="{B.CREMA if bg != B.CREMA else B.NERO}" opacity=".6">{cap}</text></g>')
    svg = K.svg_doc("".join(parts), W, H, defs="".join(defs))
    src = K.write(K.TMP / "logos" / "broderies.html", K.svg_page(svg, W, H))
    # micro logos : tailles minimales
    micro = ""
    sizes = [("logo-ricamo", "wordmark-ricamo", [60, 40, 30, 25], "mm de large"),
             ("monogramme", "monogram", [30, 20, 12, 8], "mm de haut"),
             ("chiave-ricamo", "key-ricamo", [30, 18, 10, 6], "mm de large")]
    px = 3.78  # px par mm à 96 dpi
    for name, lk, vals, unit in sizes:
        cells = ""
        for v in vals:
            if unit.endswith("large"):
                el = B.logo_svg(lk, fill=B.NERO, width=v * px * 2.2)
            else:
                el = B.logo_svg(lk, fill=B.NERO, height=v * px * 2.2)
            cells += (f'<div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;justify-content:flex-end">{el}'
                      f'<span class="mono" style="font-size:11px;color:var(--talpa)">{v} {unit}</span></div>')
        micro += (f'<div style="display:grid;grid-template-columns:220px repeat(4,1fr);align-items:end;gap:24px;padding:34px 0;border-bottom:1px solid var(--crema-2)">'
                  f'<div class="lab">fc-{name}</div>{cells}</div>')
    body2 = (f'<div style="width:1600px;height:1000px;padding:64px 72px;background:var(--crema)">'
             f'<div class="lab" style="color:var(--talpa)">Tailles minimales — échelle 2,2 : 1</div>'
             f'<h1 class="serif" style="font-size:56px;margin:14px 0 18px">Petites pièces, <i>grande tenue.</i></h1>'
             f'<p style="max-width:900px;font-size:15px;color:var(--grafite)">Sous 40 mm, le mot-symbole passe au master <b>Ricamo</b> '
             f'(empattements renforcés, interlettrage ouvert). Sous 25 mm, on brode le monogramme ; sous 12 mm, la Chiave seule — '
             f'tirette de zip, rivet, bouton, languette de manche.</p>{micro}</div>')
    src2 = K.write(K.TMP / "logos" / "micro.html", K.page(body2, w=1600, h=1000))
    return [{"in": src, "out": OUT / "broderie" / "logos-brodes-echantillons.png", "w": W, "h": H, "scale": 1.5},
            {"in": src2, "out": OUT / "broderie" / "tailles-minimales.png", "w": 1600, "h": 1000, "scale": 1.5}]


def build():
    jobs = export_files() + proposal_boards() + construction_board() + system_board() + embroidery_board()
    K.render(jobs)
    # favicon.ico (16 + 32)
    from PIL import Image
    ic = OUT / "icones"
    im = Image.open(ic / "favicon-32.png")
    im.save(ic / "favicon.ico", sizes=[(16, 16), (32, 32)])


if __name__ == "__main__":
    build()
