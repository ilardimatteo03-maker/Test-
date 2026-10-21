"""Régénère toute l'identité dans l'ordre des dépendances.
Usage (depuis la racine du dépôt) : python3 arte-automobili/_source/build_all.py
Pré-requis : Python 3.11+ avec fonttools, brotli, shapely, cairosvg, Pillow, python-docx ;
Node 18+ avec Playwright (Chromium) ; poppler-utils (pdftoppm).
Les rendus 3D (06_photographie) se régénèrent à part : voir README.md, section « Rendus 3D »."""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
STEPS = ["build_logos", "build_pistes", "build_palette", "build_icons", "build_motifs", "build_social",
         "build_papeterie", "build_documents", "build_mockups", "build_site", "build_site_shopify", "build_textes", "build_guide"]

for step in STEPS:
    print(f"→ {step}")
    subprocess.run([sys.executable, str(HERE / f"{step}.py")], cwd=HERE, check=True)
print("Identité régénérée.")
