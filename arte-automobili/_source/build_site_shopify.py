"""Thème Shopify « vitrine » (13_site-shopify) : le site de 10_site-web porté en thème Online Store 2.0.

Les fichiers Liquid et JSON de 13_site-shopify/theme sont la source ; ce script y ajoute les ressources
partagées avec le site Eleventy (feuille de style, polices, logos, visuels redimensionnés), puis produit le zip."""
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image

from kit import ROOT

SITE = ROOT / "10_site-web" / "src"
OUT = ROOT / "13_site-shopify"
ASSETS = OUT / "theme" / "assets"

# visuel → largeurs produites (la plus grande ne dépasse pas l'original)
IMAGES = {"accueil-hero": (1200, 2400), "service-interieur": (800, 1600), "service-exterieur": (800, 1080),
          "service-complet": (800, 1200), "service-professionnels": (800, 1600), "accueil-approche": (800, 1080),
          "presentation": (800, 1080)}

# Compléments propres à Shopify : pages de politiques, recherche, mot de passe, comptes clients
SHOPIFY_CSS = """
/* ── Compléments Shopify ──────────────────────────────────────────────── */
.reseaux:empty { display: none; }
.rte a { text-underline-offset: 3px; }
.rte p, .rte li { color: rgba(238, 237, 231, .86); }
.shopify-policy__container { max-width: 76ch !important; margin: 0 auto; padding: calc(var(--header) + clamp(56px, 8vw, 112px)) var(--pad) clamp(88px, 11vw, 160px); }
.shopify-policy__title h1 { font-size: clamp(40px, 5vw, 72px); margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid var(--argento); }
.shopify-policy__body h2, .shopify-policy__body h3 { margin: 40px 0 14px; font-size: clamp(22px, 2vw, 28px); }
.shopify-challenge__container { padding-top: calc(var(--header) + 64px); padding-bottom: 96px; }
.liste-simple { margin: 32px 0; padding: 0; list-style: none; border-top: 1px solid var(--verdaccio); }
.liste-simple li { padding: 14px 0; border-bottom: 1px solid var(--verdaccio); }
.liste-simple a { text-decoration: none; }
.recherche { max-width: 520px; margin-top: 32px; }
.entete--seule .prose { margin-top: 24px; }
.entete--seule > .actions { margin-top: 40px; }
.mot-de-passe { padding-top: clamp(64px, 10vw, 140px); }
.mot-de-passe__logo { height: 80px; width: auto; margin-bottom: 40px; }
.mot-de-passe__form { max-width: 420px; margin-top: 40px; }
.mot-de-passe__form .btn { margin-top: 12px; align-self: flex-start; }
.mot-de-passe__form input { width: 100%; min-height: 48px; background: transparent; border: 0; border-bottom: 1px solid var(--argento); color: var(--bianco); font: 400 17px/1.4 var(--sans); }
/* pages de compte client (si activées) */
.section--tight { padding-block: calc(var(--header) + 48px) 96px; }
.page-head { padding-block: 0 32px; margin-bottom: 32px; border-bottom: 1px solid var(--argento); }
.h2 { font-size: clamp(32px, 4vw, 58px); line-height: 1.06; }
.link { font: 600 12px/1 var(--sans); font-stretch: 125%; letter-spacing: .2em; text-transform: uppercase; text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 6px; }
.notice--error { border-color: var(--erreur); color: var(--erreur); }
.form > .notice--erreur { margin-bottom: 32px; }
.muted { opacity: .78; }
.field input[type="password"] { width: 100%; min-height: 48px; padding: 10px 0; background: transparent; border: 0; border-bottom: 1px solid var(--argento); color: var(--bianco); font: 400 17px/1.4 var(--sans); }
"""


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    css = (SITE / "assets" / "css" / "site.css").read_text()
    css = re.sub(r"^@font-face \{[^\n]*\}\n", "", css, flags=re.M)  # déclarées dans layout/theme.liquid
    css = css.replace("/* Arte Automobili — site vitrine.", "/* Arte Automobili — thème Shopify vitrine (feuille générée depuis 10_site-web).")
    (ASSETS / "base.css").write_text(css + SHOPIFY_CSS)
    for f in (SITE / "assets" / "fonts").glob("*.woff2"):
        shutil.copy(f, ASSETS / f.name)
    shutil.copy(SITE / "assets" / "logo" / "logo-principal-bianco.svg", ASSETS)
    shutil.copy(SITE / "assets" / "logo" / "logo-vertical-bianco.svg", ASSETS)
    shutil.copy(ROOT / "02_logo" / "svg" / "aa-monogramme-bianco.svg", ASSETS / "monogramme-bianco.svg")
    shutil.copy(SITE / "favicon.svg", ASSETS)
    shutil.copy(SITE / "assets" / "partage.jpg", ASSETS)
    for name, widths in IMAGES.items():
        im = Image.open(SITE / "images" / f"{name}.jpg").convert("RGB")
        for w in widths:
            r = im if im.width == w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            r.save(ASSETS / f"{name}-{w}.jpg", quality=82, optimize=True, progressive=True)
    z = OUT / "arte-automobili-vitrine-theme.zip"
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted((OUT / "theme").rglob("*")):
            if f.is_file():
                zf.write(f, f.relative_to(OUT / "theme"))
    print(f"thème vitrine ok → {z.name} ({z.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
