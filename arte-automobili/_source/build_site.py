"""Site vitrine Arte Automobili (10_site-web) — projet Eleventy.

Ce script prépare les ressources de marque du site, construit le site et produit les aperçus.
Les fichiers déjà présents dans 10_site-web/src ne sont jamais écrasés : une photo remplacée
par le client reste en place quand on relance la chaîne de production.
Pour seulement modifier le site, il suffit de travailler dans 10_site-web/ (voir son README)."""
import json
import shutil
import subprocess
from pathlib import Path

from fontTools import subset
from PIL import Image

from kit import ROOT

SITE = ROOT / "10_site-web"
SRC = SITE / "src"
REND = ROOT / "06_photographie" / "rendus-3d"

# Image du site ← rendu 3D provisoire (à remplacer par de vraies photos, même nom de fichier)
IMAGES = {
    "accueil-hero.jpg": "rendu-17-site-hero-2400x1350.jpg",
    "service-interieur.jpg": "rendu-15-interieur-2000x1250.jpg",
    "service-exterieur.jpg": "rendu-07-capot-lames-de-lumiere-1080x1350.jpg",
    "service-complet.jpg": "rendu-18-bianco-entier-1200x1500.jpg",
    "service-professionnels.jpg": "rendu-16-flotte-2000x1250.jpg",
    "accueil-approche.jpg": "rendu-05-jante-1080x1350.jpg",
    "presentation.jpg": "rendu-14-bianco-phare-1080x1350.jpg",
}
FONTS = [("BodoniModa[opsz,wght].ttf", "BodoniModa"), ("BodoniModa-Italic[opsz,wght].ttf", "BodoniModa-Italic"),
         ("Archivo[wdth,wght].ttf", "Archivo"), ("DMMono-Regular.ttf", "DMMono-Regular"), ("DMMono-Light.ttf", "DMMono-Light")]
LATIN = [*range(0x20, 0x7F), *range(0xA0, 0x100), 0x131, 0x152, 0x153, 0x2BB, 0x2BC, 0x2C6, 0x2DA, 0x2DC,
         *range(0x2000, 0x2070), 0x2074, 0x20AC, 0x2122, 0x2191, 0x2193, 0x2192, 0x2212, 0x2215, 0xFEFF, 0xFFFD]
LOGOS = ["aa-logo-principal-bianco.svg", "aa-logo-vertical-bianco.svg"]
ICONS = ["favicon.svg", "favicon.ico", "apple-touch-icon.png", "android-chrome-192.png", "android-chrome-512.png"]


def copy_new(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists():
        shutil.copy(src, dst)


def assets():
    for name, rendu in IMAGES.items():
        dst = SRC / "images" / name
        if not dst.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            Image.open(REND / rendu).convert("RGB").save(dst, quality=92, optimize=True)
    for s, d in FONTS:
        dst = SRC / "assets" / "fonts" / f"{d}.woff2"
        if not dst.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            # sous-ensemble latin (plage « latin » de Google Fonts) : axes variables conservés
            opts = subset.Options()
            opts.flavor, opts.layout_features = "woff2", ["*"]
            f = subset.load_font(ROOT / "03_typographie" / "polices" / s, opts)
            sub = subset.Subsetter(opts)
            sub.populate(unicodes=LATIN)
            sub.subset(f)
            subset.save_font(f, dst, opts)
    for f in LOGOS:
        copy_new(ROOT / "02_logo" / "svg" / f, SRC / "assets" / "logo" / f.replace("aa-", ""))
    for f in ICONS:
        copy_new(ROOT / "02_logo" / "icones" / f, SRC / f)
    og = SRC / "assets" / "partage.jpg"
    if not og.exists():
        og_image(og)


def og_image(dst):
    """Image d'aperçu de partage 1200 × 630 : le coupé dans la pénombre, le logo dans l'ombre."""
    im = Image.open(REND / IMAGES["accueil-hero.jpg"]).convert("RGB")
    w, h = 1200, 630
    s = max(w / im.width, h / im.height) * 1.12
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x = round((im.width - w) * 0.86)
    im = im.crop((x, round((im.height - h) * 0.5), x + w, round((im.height - h) * 0.5) + h))
    logo = Image.open(ROOT / "02_logo" / "png" / "aa-logo-principal-bianco-1200px.png").convert("RGBA")
    lw = 360
    logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
    im.paste(logo, (72, h - 72 - logo.height), logo)
    im.save(dst, quality=86, optimize=True, progressive=True)


def build():
    if not (SITE / "node_modules").exists():
        subprocess.run(["npm", "ci", "--no-audit", "--no-fund"], cwd=SITE, check=True)
    subprocess.run(["npm", "run", "build"], cwd=SITE, check=True)


def screenshots():
    """Aperçus ordinateur et mobile de chaque page (le guide de marque réutilise ceux de l'accueil)."""
    import socket
    import time
    ap = SITE / "apercus"
    ap.mkdir(exist_ok=True)
    for old in ap.glob("*.jpg"):
        old.unlink()
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    srv = subprocess.Popen(["python3", "-m", "http.server", str(port), "--bind", "127.0.0.1"], cwd=SITE / "_site",
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    pages = {"accueil": "", "services": "services/", "presentation": "presentation/", "contact": "contact/"}
    jobs = []
    css = ".header { position: absolute; }"  # capture pleine page : l'en-tête fixe n'apparaît qu'une fois
    for name, path in pages.items():
        url = f"http://127.0.0.1:{port}/{path}"
        jobs += [{"url": url, "in": name, "out": str(ap / f"_{name}-d.png"), "w": 1440, "h": 900, "full": True, "scroll": True, "css": css},
                 {"url": url, "in": name, "out": str(ap / f"_{name}-m.png"), "w": 390, "h": 844, "full": True, "scroll": True, "scale": 2, "css": css}]
    jf = ap / "_jobs.json"
    jf.write_text(json.dumps(jobs))
    try:
        subprocess.run(["node", str(ROOT / "_source" / "render.mjs"), str(jf)], check=True, stdout=subprocess.DEVNULL)
    finally:
        srv.terminate()
        jf.unlink()
    for name in pages:
        d = Image.open(ap / f"_{name}-d.png").convert("RGB")
        d.save(ap / f"{name}-desktop-pleine-page.jpg", quality=82)
        d.crop((0, 0, 1440, 900)).save(ap / f"{name}-desktop-hero.jpg", quality=88)
        m = Image.open(ap / f"_{name}-m.png").convert("RGB")
        m.save(ap / f"{name}-mobile-pleine-page.jpg", quality=80)
        m.crop((0, 0, 780, 1688)).save(ap / f"{name}-mobile-hero.jpg", quality=88)
        (ap / f"_{name}-d.png").unlink()
        (ap / f"_{name}-m.png").unlink()


def main():
    assets()
    build()
    screenshots()
    print("site ok")


if __name__ == "__main__":
    main()
