"""SERIES A : visuels produits (face, dos, détails), planches et fiches produits PDF."""
import brand as B
import collection as CO
import garments as GM
import kit as K

OUT = K.ROOT / "05_collection"
IMG = OUT / "produits"


def product_svg(p, c, view="front", w=1000, h=1250, bg=None, pid=None, **kw):
    pid = pid or f"p{p['ref']}{CO.COLOR_CODES[c]}{view[0]}"
    logos = p["logos"](c) if view == "front" else []
    arts = p.get("arts", lambda c: [])(c) if view == "front" else p["back"](c).get("arts", [])
    if view == "back" and p["kind"] == "oversize":
        logos = []
    pattern = p["pattern"](c, pid + "pat") if "pattern" in p else None
    trim = p["trim"](c) if "trim" in p else None
    return GM.render(p["kind"], c, view=view, fabric=p["fabric"], logos=logos, arts=arts, pid=pid, pattern=pattern,
                     trim=trim, w=w, h=h, bg=bg, label=(view == "front"), **kw)


def crop_svg(svg, x, y, cw, ch, out_w):
    """Recadre un SVG 1000 × 1250 (zoom détail)."""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{out_w}" height="{out_w * ch / cw:.0f}" viewBox="{x} {y} {cw} {ch}">'
            f'{svg}</svg>')


def product_images():
    jobs = []
    for p in CO.P:
        for c in p["colors"]:
            views = ["front"] + (["back"] if "back" in p else [])
            for v in views:
                svg = product_svg(p, c, v)
                name = CO.img_name(p, c, v)
                src = K.write(K.TMP / "prod" / f"{name}.html", K.svg_page(svg, 1000, 1250))
                jobs.append({"in": src, "out": IMG / f"{name}.jpg", "w": 1000, "h": 1250, "quality": 88})
    # détails (zoom)
    # (centre en coordonnées de la géométrie, taille du cadre en unités de pièce)
    details = [("A01", B.CREMA, "front", (500, 300, 240, 160), "broderie-mot-symbole"),
               ("A04", B.BLU, "front", (500, 240, 240, 200), "monogramme-et-col"),
               ("A07", B.BLU, "front", (500, 150, 220, 220), "tirette-chiave"),
               ("A14", B.BLU, "back", (500, 640, 420, 300), "tableau-departures"),
               ("A09", B.CREMA, "back", (500, 480, 400, 300), "plan-attico"),
               ("A05", B.NERO, "front", (480, 560, 380, 300), "casquette-monogramme"),
               ("A17", B.BLU, "front", (430, 620, 340, 300), "jacquard-gessato"),
               ("A16", B.BAROLO, "front", (500, 430, 400, 300), "fuori-classe-relief")]
    for ref, c, v, (x, y, cw, ch), nm in details:
        p = CO.by_ref(ref)
        M, sc = GM.canvas_map(p["kind"])
        X, Y = M(x, y)
        cw, ch = cw * sc, ch * sc
        x, y = X - cw / 2, Y - ch / 2
        svg = crop_svg(product_svg(p, c, v, pid=f"d{ref}"), x, y, cw, ch, 1200)
        hh = round(1200 * ch / cw)
        src = K.write(K.TMP / "prod" / f"detail-{ref}.html", K.svg_page(svg, 1200, hh))
        jobs.append({"in": src, "out": IMG / "details" / f"{ref.lower()}-{nm}.jpg", "w": 1200, "h": hh, "quality": 90})
    return jobs


def uri(path):
    return path.as_uri()


SHEET_CSS = """
.pg{width:1600px;height:1000px;position:relative;overflow:hidden;background:var(--crema)}
.k{font-family:'Geist Mono';font-size:11px;letter-spacing:.1em;color:var(--talpa);text-transform:uppercase}
.grid{display:grid;gap:0}
.cell{position:relative;background:var(--pietra)}
.cell img{width:100%;display:block}
.cap{position:absolute;left:14px;right:14px;bottom:12px;display:flex;justify-content:space-between;align-items:baseline}
.cap b{font-family:'Playfair';font-stretch:112.5%;font-variation-settings:'opsz' 30;font-weight:440;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase}
.cap span{font-family:'Geist Mono';font-size:10.5px;color:var(--grafite)}
"""


def boards():
    jobs = []
    # planche générale : 17 pièces
    cells = ""
    for p in CO.P:
        c = p["colors"][0]
        cells += (f'<div class="cell"><img src="{uri(IMG / (CO.img_name(p, c) + ".jpg"))}">'
                  f'<div class="cap"><b>{p["name"]}</b><span>{p["ref"]}</span></div></div>')
    cells += (f'<div class="cell" style="background:var(--nero);display:flex;flex-direction:column;justify-content:center;padding:26px;color:var(--crema)">'
              f'<div class="k" style="color:var(--talpa)">FUORICLASSE</div><div class="serif" style="font-size:44px;line-height:1;margin:10px 0 12px">Series <i>A</i></div>'
              f'<div style="font-size:13px;opacity:.8">17 pièces · 3 familles<br>Collezione 01 — MMXXVI</div></div>')
    body = (f'<div class="pg" style="width:2000px;height:1250px"><div class="grid" style="grid-template-columns:repeat(6,1fr);">'
            f'{cells}</div></div>')
    src = K.write(K.TMP / "coll" / "overview.html", K.page(body, css=SHEET_CSS, w=2000, h=1250))
    jobs.append({"in": src, "out": OUT / "planche-collection-series-a.jpg", "w": 2000, "h": 1250, "scale": 1.25, "quality": 90})
    # une planche par famille
    for fam, (fname, fit, ftxt) in CO.FAMILIES.items():
        ps = [p for p in CO.P if p["family"] == fam]
        tiles = ""
        for p in ps:
            sw = "".join(f'<i style="background:{c}"></i>' for c in p["colors"])
            tiles += (f'<div class="cell"><img src="{uri(IMG / (CO.img_name(p, p["colors"][0]) + ".jpg"))}">'
                      f'<div class="cap" style="flex-direction:column;gap:4px"><div style="display:flex;justify-content:space-between;width:100%">'
                      f'<b>{p["name"]}</b><span>€ {p["price"]:,}</span></div>'
                      f'<div style="display:flex;justify-content:space-between;width:100%"><span>{p["cat"]}</span>'
                      f'<span class="sw">{sw}</span></div></div></div>')
        n = len(ps)
        cols = n if n <= 6 else 6
        body = (f'<div class="pg" style="display:grid;grid-template-rows:auto 1fr">'
                f'<div style="padding:44px 56px 26px;display:flex;justify-content:space-between;align-items:flex-end;gap:60px">'
                f'<div><div class="k">Series A · Famille</div><h1 class="serif" style="font-size:64px;line-height:1;margin-top:10px">{fname} <i style="color:var(--talpa)">— {fit}</i></h1></div>'
                f'<p style="max-width:520px;font-size:14px;color:var(--grafite)">{ftxt}</p></div>'
                f'<div class="grid" style="grid-template-columns:repeat({cols},1fr);align-self:{"end" if n > 5 else "center"};{"" if n > 5 else "padding:0 56px;gap:14px"}">{tiles}</div></div>')
        css = SHEET_CSS + ".sw i{display:inline-block;width:11px;height:11px;margin-left:4px;border:1px solid rgba(0,0,0,.15)}"
        src = K.write(K.TMP / "coll" / f"fam-{fam}.html", K.page(body, css=css, w=1600, h=1000))
        jobs.append({"in": src, "out": OUT / f"famille-{fam}.jpg", "w": 1600, "h": 1000, "scale": 1.5, "quality": 90})
    return jobs


def fiches():
    """Fiches produits : une page 16:10 par pièce (PDF + aperçus)."""
    pages = []
    # couverture
    pages.append(f'''<section class="pg" style="background:var(--nero);color:var(--crema);display:flex;flex-direction:column;justify-content:space-between;padding:64px">
<div style="display:flex;justify-content:space-between">{B.logo_svg("wordmark", fill=B.CREMA, height=18)}<span class="k" style="color:var(--talpa)">Fiches produits · V1.0</span></div>
<div><div class="k" style="color:var(--talpa)">Collezione 01 — MMXXVI</div>
<h1 class="serif" style="font-size:180px;line-height:.9;margin-top:18px">Series <i>A</i></h1>
<p style="max-width:620px;font-size:17px;line-height:1.6;opacity:.85;margin-top:26px">Dix-sept pièces, trois familles. Le premier tour de table d'une marque qui habille ceux qui construisent :
Signature, Business Culture, Statement.</p></div>
<div style="display:flex;gap:40px" class="k">{"".join(f"<span style='color:var(--crema)'>{v[0]}</span>" for v in CO.FAMILIES.values())}</div></section>''')
    for p in CO.P:
        c0 = p["colors"][0]
        fam = CO.FAMILIES[p["family"]]
        imgs = f'<div class="im"><img src="{uri(IMG / (CO.img_name(p, c0) + ".jpg"))}"></div>'
        if "back" in p:
            imgs += f'<div class="im"><img src="{uri(IMG / (CO.img_name(p, c0, "back") + ".jpg"))}"><span class="k vl">Dos</span></div>'
        else:
            c1 = p["colors"][1] if len(p["colors"]) > 1 else c0
            imgs += f'<div class="im"><img src="{uri(IMG / (CO.img_name(p, c1) + ".jpg"))}"><span class="k vl">{CO.COLOR_NAMES[c1]}</span></div>'
        sw = "".join(f'<div class="swc"><i style="background:{c}"></i><span>{CO.COLOR_NAMES[c]}<br><em>{CO.sku(p, c)}</em></span></div>'
                     for c in p["colors"])
        rows = [("Matière", p["material"]), ("Coupe", p["fit"]), ("Logo & placement", p["logo"]),
                ("Finitions", p["details"]), ("Fabrication", p["made"])]
        tbl = "".join(f'<div class="rk">{a}</div><div class="rv">{b}</div>' for a, b in rows)
        pages.append(f'''<section class="pg prod">
<div class="imgs">{imgs}</div>
<div class="info"><div class="k">{p["ref"]} · {fam[0]} — {fam[1]}</div>
<h2 class="wide" style="font-size:30px;margin:16px 0 4px">{p["name"]}</h2>
<div class="serif it" style="font-size:22px;color:var(--grafite)">{p["cat"]}</div>
<div class="price mono">€ {p["price"]:,} <span>TVAC · prix public conseillé</span></div>
<div class="tbl">{tbl}</div>
<div class="k" style="margin:22px 0 10px">Coloris</div><div class="sws">{sw}</div></div></section>''')
    css = SHEET_CSS + """
section.pg{page-break-after:always}
.prod{display:grid;grid-template-columns:1000px 600px}
.imgs{display:grid;grid-template-columns:1fr 1fr;height:1000px;background:var(--pietra)}
.im{position:relative;height:1000px;overflow:hidden}.im img{width:100%;height:100%;object-fit:cover}
.vl{position:absolute;left:16px;top:16px}
.info{padding:56px 52px;display:flex;flex-direction:column}
.price{font-size:18px;margin:22px 0 26px}.price span{font-size:11px;color:var(--talpa);margin-left:8px}
.tbl{display:grid;grid-template-columns:150px 1fr;border-top:1px solid var(--crema-2)}
.rk,.rv{padding:11px 0;border-bottom:1px solid var(--crema-2);font-size:13px;line-height:1.5}
.rk{font-family:'Mona Sans';font-stretch:125%;font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--talpa);padding-top:14px}
.sws{display:flex;gap:18px;flex-wrap:wrap}.swc{display:flex;gap:10px;align-items:center;font-size:12px;line-height:1.3}
.swc i{width:34px;height:34px;border:1px solid rgba(0,0,0,.12)}.swc em{font-style:normal;font-family:'Geist Mono';font-size:10px;color:var(--talpa)}
@page{size:1600px 1000px;margin:0}
"""
    html = K.page("".join(pages), css=css)
    src = K.write(K.TMP / "coll" / "fiches.html", html)
    jobs = [{"in": src, "out": OUT / "SERIES-A_fiches-produits.pdf", "w": 1600, "h": 1000,
             "pdf": {"width": "1600px", "height": "1000px"}}]
    # aperçus PNG de quelques fiches
    for i, ref in enumerate(["A03", "A08", "A14"]):
        k = [p["ref"] for p in CO.P].index(ref) + 1
        one = K.page(pages[k], css=css, w=1600, h=1000)
        s = K.write(K.TMP / "coll" / f"fiche-{ref}.html", one)
        jobs.append({"in": s, "out": OUT / "apercus-fiches" / f"fiche-{ref.lower()}.jpg", "w": 1600, "h": 1000, "quality": 88})
    return jobs


CUTS = [("A07", B.BLU, "front"), ("A14", B.BLU, "back"), ("A16", B.BAROLO, "front"), ("A03", B.NERO, "front"),
        ("A12", B.CIOCC, "front"), ("A05", B.NERO, "front"), ("A13", B.CREMA, "front"), ("A08", B.GRAFITE, "front"),
        ("A06", B.CIOCC, "front"), ("A17", B.BLU, "front"), ("A02", B.TALPA, "front"), ("A09", B.CREMA, "back"),
        ("A15", B.NERO, "back"), ("A01", B.CREMA, "front"), ("A04", B.BLU, "front"), ("A11", B.CREMA, "front")]


def cutouts():
    """Détourages PNG transparents (pour les mises en page de campagne, réseaux, site)."""
    jobs = []
    for ref, c, v in CUTS:
        p = CO.by_ref(ref)
        svg = product_svg(p, c, v, pid=f"x{ref}{v[0]}", transparent=True)
        name = CO.img_name(p, c, v)
        src = K.write(K.TMP / "cut" / f"{name}.html", K.page(f'<div style="width:1000px;height:1250px">{svg}</div>', w=1000, h=1250,
                                                               css="html,body{background:transparent}"))
        jobs.append({"in": src, "out": OUT / "detourages" / f"{name}.png", "w": 1000, "h": 1250, "transparent": True})
    return jobs


def build(images=True):
    if images:
        K.render(product_images() + cutouts())
    K.render(boards() + fiches())


if __name__ == "__main__":
    import sys
    build(images="--no-images" not in sys.argv)
