"""Boutique Shopify : visuels produits (2000 × 2000), catalogue CSV d'import, copie des
polices, logos et visuels dans le thème, puis archive ZIP prête à importer.
Usage : python3 _source/build_boutique.py"""
import csv
import json
import shutil
import subprocess
import zipfile
from pathlib import Path

from PIL import Image

from drawings import bottle
from kit import A, B, G, N, ROOT, TR, V, font_css, linea, logo_g, rect, text

OUT = ROOT / "12_boutique-shopify"
THEME = OUT / "theme"
IMG = OUT / "images-produits"
S = 2000  # côté des visuels produits

PRODUITS = [
    dict(handle="shampoing-ph-neutre-n01", titre="Shampoing pH neutre N° 01", type="Gamme atelier", tags="gamme-atelier,lavage",
         variantes=[("1 L", "24.00", "AA-01-1000", 1100), ("500 mL", "16.00", "AA-01-500", 560)],
         desc="<p>Le shampoing de nos lavages d'entretien. pH neutre, sans cire ni silicone de remplissage : il nettoie sans attaquer les protections céramiques et polymères.</p><p><strong>Dosage</strong> : 30 mL pour 10 L d'eau, méthode des deux seaux.</p>",
         img=dict(name="Shampoing", sub="pH neutre · 1 L", ref="N° 01")),
    dict(handle="decontaminant-ferreux-n04", titre="Décontaminant ferreux N° 04", type="Gamme atelier", tags="gamme-atelier,decontamination",
         variantes=[("500 mL", "22.00", "AA-04-500", 600)],
         desc="<p>Dissout les particules de fer incrustées dans le vernis et sur les jantes. Vire au violet au contact des contaminants : on voit ce qu'il retire.</p><p><strong>Usage</strong> : sur surface froide, temps de pose 3 à 5 minutes, rinçage abondant.</p>",
         img=dict(name="Décontaminant", sub="Ferreux · 500 mL", ref="N° 04", body=B, label=N, ink=B, cap="#1a1d1c")),
    dict(handle="finition-rapide-n05", titre="Finition rapide N° 05", type="Gamme atelier", tags="gamme-atelier,finition",
         variantes=[("500 mL", "21.00", "AA-05-500", 560)],
         desc="<p>Entre deux lavages, retire poussières et traces d'eau et ravive la brillance. Compatible céramique.</p><p><strong>Usage</strong> : pulvériser sur un panneau, essuyer avec une microfibre propre.</p>",
         img=dict(name="Finition rapide", sub="Brillance · 500 mL", ref="N° 05", body=G)),
    dict(handle="nettoyant-cuir-n07", titre="Nettoyant cuir N° 07", type="Gamme atelier", tags="gamme-atelier,habitacle",
         variantes=[("500 mL", "19.00", "AA-07-500", 560)],
         desc="<p>Nettoie le cuir lisse sans le dessécher. pH 5,5, proche de celui du cuir, fini mat d'origine.</p><p><strong>Usage</strong> : appliquer à la brosse douce, essuyer, laisser sécher avant nutrition.</p>",
         img=dict(name="Nettoyant cuir", sub="pH 5,5 · 500 mL", ref="N° 07")),
    dict(handle="entretien-ceramique-n09", titre="Entretien céramique N° 09", type="Gamme atelier", tags="gamme-atelier,protection",
         variantes=[("250 mL", "29.00", "AA-09-250", 320)],
         desc="<p>Recharge l'effet perlant d'une protection céramique. À utiliser tous les deux à trois mois après un lavage.</p><p><strong>Usage</strong> : sur panneau propre et sec, une pulvérisation, étaler puis lustrer.</p>",
         img=dict(name="Céramique", sub="Entretien · 250 mL", ref="N° 09", body=V)),
    dict(handle="microfibres-atelier-lot-3", titre="Microfibres d'atelier, lot de 3", type="Accessoires", tags="accessoires",
         variantes=[("Lot de 3", "29.00", "AA-MF-3", 450)],
         desc="<p>Les microfibres de l'atelier : 40 × 40 cm, 500 g/m², bords sans couture pour ne pas marquer le vernis. Une pour le séchage, une pour les finitions, une pour les vitres.</p>",
         img=None),
    dict(handle="coffret-essenziale", titre="Coffret Essenziale", type="Coffrets", tags="cadeaux,coffret",
         variantes=[("Coffret", "59.00", "AA-COF-ESS", 1800)],
         desc="<p>L'entretien de l'atelier à la maison : Shampoing N° 01 (1 L), Finition rapide N° 05 (500 mL) et deux microfibres d'atelier, dans un coffret noir numéroté.</p>",
         img=None),
]
CARTE_CADEAU = dict(handle="carte-cadeau", titre="Carte cadeau Arte Automobili", valeurs=["50.00", "100.00", "250.00", "500.00"],
                    desc="<p>Valable sur toutes les prestations de l'atelier et sur la boutique. Envoyée par e-mail, utilisable pendant un an.</p>")


def studio(body, label=None):
    """Fond de studio Nero, Linea au nombre d'or, objet posé dessus."""
    ly = S * 0.72
    defs = ('<radialGradient id="st" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#262B29"/>'
            '<stop offset=".6" stop-color="#141716"/><stop offset="1" stop-color="#0B0C0C"/></radialGradient>'
            '<radialGradient id="om" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".7"/>'
            '<stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>')
    out = [f'<rect width="{S}" height="{S}" fill="url(#st)"/>', linea(0, ly, S, A, 2, 0.5),
           f'<ellipse cx="{S / 2}" cy="{ly + 6}" rx="{S * 0.32}" ry="40" fill="url(#om)"/>', body]
    if label:
        out.append(text(110, S - 110, label, 34, "mono", 400, A, ls=0.06, upper=True))
    out.append(logo_g("monogramme-simplifie", S - 110, S - 95, height=90, fill=B, anchor="br"))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}">'
            f'<defs>{defs}</defs>{"".join(out)}</svg>')


def microfibres():
    ly = S * 0.72
    out = []
    for i, (c, w) in enumerate([(G, 1200), ("#1F2422", 1160), (N, 1120)]):
        y = ly - 150 * (i + 1)
        x = S / 2 - w / 2
        out.append(rect(x, y, w, 146, c) + rect(x, y, w, 3, "#ffffff", 0.07) + rect(x + 24, y + 70, w - 48, 1.5, "#ffffff", 0.05))
    out.append(rect(S / 2 - 160, ly - 450, 320, 450, B))
    out.append(logo_g("monogramme", S / 2, ly - 400, height=150, fill=N, anchor="tc"))
    out.append(text(S / 2, ly - 170, "MICROFIBRES", 26, "archivo", 600, N, ls=0.2, stretch=125, anchor="middle"))
    out.append(text(S / 2, ly - 120, "40 × 40 · 500 G/M²", 24, "mono", 400, N, anchor="middle"))
    return studio("".join(out), "Microfibres d'atelier · 40 × 40 cm · lot de 3")


def coffret():
    ly = S * 0.72
    w, h = 1300, 380
    x = S / 2 - w / 2
    out = [rect(x, ly - h, w, h, N), rect(x, ly - h, w, 3, "#ffffff", 0.08),
           logo_g("logo-principal", x + 90, ly - h / 2, height=150, fill=B, anchor="cl"),
           text(x + w - 90, ly - h / 2 + 12, "N° 0001", 40, "mono", 300, A, anchor="end")]
    out.append(bottle(S / 2 - 260, ly - h - 10, 640, name="Shampoing", sub="pH neutre · 1 L", ref="N° 01"))
    out.append(bottle(S / 2 + 240, ly - h - 10, 560, body=G, name="Finition rapide", sub="Brillance · 500 mL", ref="N° 05"))
    return studio("".join(out), "Coffret Essenziale")


def carte_cadeau():
    ly = S * 0.72
    w, h = 1200, 760
    x, y = S / 2 - w / 2, ly - h - 60
    out = [rect(x + 30, y + 40, w, h, "#000", 0.45), rect(x, y, w, h, V),
           text(x + 80, y + 150, "Carte cadeau", 64, "bodoni", 400, B, italic=True),
           linea(x, y + h * 0.618, x + w, B, 2, 0.5),
           logo_g("logo-principal", x + 80, y + h - 90, height=120, fill=B, anchor="bl"),
           text(x + w - 80, y + h - 96, "50 · 100 · 250 · 500 €", 34, "mono", 400, B, anchor="end", opacity=0.8)]
    return studio("".join(out), "Valable sur l'atelier et la boutique")


def flacon(p):
    o = dict(p["img"])
    return studio(bottle(S / 2, S * 0.72, 1150, **o), f'{p["titre"]}')


def render_images():
    IMG.mkdir(parents=True, exist_ok=True)
    svgs = {p["handle"]: flacon(p) for p in PRODUITS if p["img"]}
    svgs["microfibres-atelier-lot-3"] = microfibres()
    svgs["coffret-essenziale"] = coffret()
    svgs["carte-cadeau"] = carte_cadeau()
    jobs = []
    for h, svg in svgs.items():
        page = IMG / f"_tmp_{h}.html"
        page.write_text(f"<!doctype html><meta charset=utf-8><style>{font_css('../../03_typographie/polices')}"
                        f"html,body{{margin:0}}svg{{display:block}}</style>{svg}")
        jobs.append({"in": str(page), "out": str(IMG / f"{h}.png"), "w": S, "h": S})
    jf = IMG / "_jobs.json"
    jf.write_text(json.dumps(jobs))
    subprocess.run(["node", str(ROOT / "_source" / "render.mjs"), str(jf)], check=True, stdout=subprocess.DEVNULL)
    for j in jobs:
        Path(j["in"]).unlink()
        png = Path(j["out"])
        Image.open(png).convert("RGB").save(png.with_suffix(".jpg"), quality=88, optimize=True, progressive=True)
        png.unlink()
    jf.unlink()


COLS = ["Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags", "Published", "Option1 Name", "Option1 Value",
        "Variant SKU", "Variant Grams", "Variant Inventory Tracker", "Variant Inventory Qty", "Variant Inventory Policy",
        "Variant Fulfillment Service", "Variant Price", "Variant Requires Shipping", "Variant Taxable", "Image Src",
        "Image Position", "Image Alt Text", "Gift Card", "SEO Title", "SEO Description", "Status"]


def catalogue():
    rows = []
    for p in PRODUITS:
        for i, (val, prix, sku, g) in enumerate(p["variantes"]):
            first = i == 0
            rows.append({
                "Handle": p["handle"], "Title": p["titre"] if first else "", "Body (HTML)": p["desc"] if first else "",
                "Vendor": "Arte Automobili" if first else "", "Type": p["type"] if first else "", "Tags": p["tags"] if first else "",
                "Published": "FALSE" if first else "", "Option1 Name": "Format" if first else "", "Option1 Value": val,
                "Variant SKU": sku, "Variant Grams": g, "Variant Inventory Tracker": "shopify", "Variant Inventory Qty": 0,
                "Variant Inventory Policy": "deny", "Variant Fulfillment Service": "manual", "Variant Price": prix,
                "Variant Requires Shipping": "TRUE", "Variant Taxable": "TRUE", "Image Src": "", "Image Position": "",
                "Image Alt Text": p["titre"] if first else "", "Gift Card": "FALSE" if first else "",
                "SEO Title": f"{p['titre']} — Arte Automobili" if first else "",
                "SEO Description": "" , "Status": "draft" if first else ""})
    c = CARTE_CADEAU
    for i, v in enumerate(c["valeurs"]):
        first = i == 0
        rows.append({"Handle": c["handle"], "Title": c["titre"] if first else "", "Body (HTML)": c["desc"] if first else "",
                     "Vendor": "Arte Automobili" if first else "", "Type": "Carte cadeau" if first else "",
                     "Tags": "cadeaux" if first else "", "Published": "FALSE" if first else "",
                     "Option1 Name": "Montant" if first else "", "Option1 Value": f"{int(float(v))} €", "Variant SKU": "",
                     "Variant Grams": 0, "Variant Inventory Tracker": "", "Variant Inventory Qty": "",
                     "Variant Inventory Policy": "deny", "Variant Fulfillment Service": "manual", "Variant Price": v,
                     "Variant Requires Shipping": "FALSE", "Variant Taxable": "FALSE", "Image Src": "", "Image Position": "",
                     "Image Alt Text": c["titre"] if first else "", "Gift Card": "TRUE" if first else "",
                     "SEO Title": "", "SEO Description": "", "Status": "draft" if first else ""})
    with open(OUT / "produits-shopify.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLS)
        w.writeheader()
        w.writerows(rows)
    return len(rows)


def theme_assets():
    a = THEME / "assets"
    a.mkdir(parents=True, exist_ok=True)
    for f in (ROOT / "10_site-web" / "src" / "assets" / "fonts").glob("*.woff2"):
        shutil.copy(f, a / f.name)
    for src, dst in [("aa-logo-principal-bianco.svg", "logo-principal-bianco.svg"), ("aa-logo-vertical-bianco.svg", "logo-vertical-bianco.svg"),
                     ("aa-monogramme-simplifie-bianco.svg", "monogramme-bianco.svg")]:
        shutil.copy(ROOT / "02_logo" / "svg" / src, a / dst)
    shutil.copy(ROOT / "02_logo" / "icones" / "favicon.svg", a / "favicon.svg")
    for src, dst, w in [("rendu-01-hero-studio-2400x1200.jpg", "hero.jpg", 2400), ("rendu-07-capot-lames-de-lumiere-1080x1350.jpg", "capot.jpg", 1080),
                        ("rendu-12-bianco-capot-1600x1000.jpg", "bianco-capot.jpg", 1600)]:
        im = Image.open(ROOT / "06_photographie" / "rendus-3d" / src).convert("RGB")
        im.thumbnail((w, w))
        im.save(a / dst, quality=82, optimize=True, progressive=True)


def archive():
    z = OUT / "arte-automobili-theme.zip"
    if z.exists():
        z.unlink()
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(THEME.rglob("*")):
            if f.is_file():
                zf.write(f, f.relative_to(THEME))
    return z


def main():
    render_images()
    n = catalogue()
    theme_assets()
    z = archive()
    print(f"{n} lignes de catalogue · thème : {z.name} ({z.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
