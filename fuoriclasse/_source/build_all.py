"""Régénère toute l'identité FUORICLASSE, dans l'ordre des dépendances.

Prérequis : Python 3.12+, fonttools, brotli, Pillow ; Node 18+ avec Playwright (Chromium) ;
`npm install` dans ce dossier (three.js pour les rendus 3D). Accès réseau au premier lancement
pour le modèle 3D de voiture (Khronos, CC BY 4.0).

Usage : python3 build_all.py            (tout)
        python3 build_all.py --sans-3d  (garde les rendus 3D existants)
"""
import sys
import time

import build_3d
import build_campaign
import build_collection
import build_docs
import build_fondations
import build_logos
import build_moodboard
import build_packaging
import build_site
import build_social
import build_textes

STEPS = [
    ("Logos", build_logos.build),
    ("Palette et typographie", build_fondations.build),
    ("Collection — visuels produits", lambda: build_collection.build(images=True)),
    ("Rendus 3D", None),
    ("Packaging à plat", build_packaging.build),
    ("Planches d'inspiration", build_moodboard.build),
    ("Campagnes et photographie", build_campaign.build),
    ("Réseaux sociaux", build_social.build),
    ("Site e-commerce", build_site.build),
    ("Textes de marque", build_textes.build),
    ("Présentation et guide", build_docs.build),
]

if __name__ == "__main__":
    t0 = time.time()
    for name, fn in STEPS:
        if name == "Rendus 3D":
            if "--sans-3d" in sys.argv:
                continue
            fn = build_3d.build
        print(f"\n== {name}")
        fn()
    print(f"\nTerminé en {time.time() - t0:.0f} s.")
