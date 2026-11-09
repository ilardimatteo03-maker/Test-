"""Rendus 3D (three.js) : images d'intention des lieux de campagne et du packaging.

Sert le dossier fuoriclasse/ en HTTP local (modules ES + modèle glTF), puis capture chaque plan.
Le modèle de voiture (Khronos « Car Concept », CC BY 4.0) est téléchargé dans _source/.build/assets/.
"""
import contextlib
import functools
import http.server
import json
import socketserver
import threading
import urllib.request

import brand as B
import kit as K

ASSETS = K.TMP / "assets"
CAR = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CarConcept/glTF-Binary/CarConcept.glb"

SHOTS = [  # plan, dossier de sortie, nom, largeur, hauteur
    ("penthouse", "06_photographie/rendus-3d", "lieu-01-penthouse-heure-bleue", 2400, 1500),
    ("bureau", "06_photographie/rendus-3d", "lieu-02-bureau-panoramique", 2400, 1500),
    ("conference", "06_photographie/rendus-3d", "lieu-03-salle-du-conseil", 2400, 1500),
    ("rooftop", "06_photographie/rendus-3d", "lieu-04-rooftop", 2400, 1500),
    ("auto", "06_photographie/rendus-3d", "lieu-05-gt-devant-facade", 2400, 1500),
    ("pack-hero", "07_packaging/rendus-3d", "packaging-01-ensemble", 2400, 1600),
    ("pack-box", "07_packaging/rendus-3d", "packaging-02-boite-ouverte", 2000, 2000),
    ("pack-bag", "07_packaging/rendus-3d", "packaging-03-sac-et-pochette", 2400, 1600),
]


def assets():
    ASSETS.mkdir(parents=True, exist_ok=True)
    car = ASSETS / "CarConcept.glb"
    if not car.exists():
        urllib.request.urlretrieve(CAR, car)
    import glyphs  # noqa: F401 (polices chargées par brand)
    marks = {}
    for n, fn in [("wordmark", lambda: B.wordmark()), ("wordmark-ricamo", lambda: B.wordmark("ricamo")),
                  ("monogram", B.monogram), ("key", B.key), ("key-ricamo", lambda: B.key(**B.KEY_RICAMO))]:
        d, box = fn()
        marks[n] = {"d": d, "box": box}
    (ASSETS / "marks.json").write_text(json.dumps({"marks": marks, "colors": {n: h for n, h, *_ in B.PALETTE},
                                                   "ottone": B.OTTONE, "pietra": B.PIETRA}))


@contextlib.contextmanager
def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Quiet, directory=str(K.ROOT))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
        port = httpd.server_address[1]
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        try:
            yield f"http://127.0.0.1:{port}"
        finally:
            httpd.shutdown()


def build(only=None):
    assets()
    jobs = []
    with serve() as base:
        for shot, folder, name, w, h in SHOTS:
            if only and shot not in only:
                continue
            # rendu à la moitié de la définition, puis échelle 2 (anticrénelage et netteté)
            jobs.append({"url": f"{base}/_source/studio-3d/studio.html?shot={shot}&w={w // 2}&h={h // 2}",
                         "in": "x", "out": K.ROOT / folder / f"{name}.jpg", "w": w // 2, "h": h // 2, "scale": 2,
                         "wait": "window.__done === true", "quality": 90})
            if shot.startswith("pack"):
                jobs[-1]["url"] += "&exp=0.82"
        K.render(jobs)


if __name__ == "__main__":
    import sys
    build(sys.argv[1:] or None)
