"""Palette officielle : JSON, CSS, ASE (Adobe), GPL (GIMP/Inkscape/Affinity) et
matrice de contrastes WCAG calculée."""
import json
import struct
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "04_couleurs"

# CMJN : constructions d'impression recommandées (ISO Coated v2 / FOGRA39),
# à valider sur épreuve par l'imprimeur. Pantone : références les plus proches,
# indicatives, à confirmer sur nuancier physique.
PALETTE = [
    dict(id="nero-vite", nom="Nero Vite", groupe="principale", hex="#0D0F0E",
         cmjn=(75, 65, 65, 85), aplat_cmjn=(60, 40, 40, 100), pantone="Neutral Black C",
         origine="Noir de vigne — pigment décrit par Cennino Cennini dans Il Libro dell'Arte (vers 1400).",
         role="Couleur dominante. Fond des supports premium, de la photographie et du digital."),
    dict(id="bianco-sangiovanni", nom="Bianco Sangiovanni", groupe="principale", hex="#EEEDE7",
         cmjn=(4, 3, 7, 0), aplat_cmjn=None, pantone="Teinte papier (blanc naturel) — pas d'encre",
         origine="Blanc de chaux de la tradition des fresquistes italiens.",
         role="Texte et logo sur fonds sombres ; fond des documents administratifs."),
    dict(id="verde-verona", nom="Verde Verona", groupe="principale", hex="#1F3D35",
         cmjn=(84, 45, 68, 48), aplat_cmjn=None, pantone="5535 C (indicatif)",
         origine="Terre verte de Vérone, pigment historique des peintres italiens, approfondie.",
         role="Couleur signature. Aplats, cartes, enseigne, moments de marque. Jamais en filet fin sur noir."),
    dict(id="verdaccio", nom="Verdaccio", groupe="secondaire", hex="#262B29",
         cmjn=(72, 58, 62, 62), aplat_cmjn=None, pantone="447 C (indicatif)",
         origine="Sous-couche gris-vert des peintres de la Renaissance.",
         role="Anthracite de structure : surfaces secondaires, cartes UI, textile, véhicule."),
    dict(id="argento", nom="Argento", groupe="secondaire", hex="#8E9592",
         cmjn=(45, 32, 37, 8), aplat_cmjn=None, pantone="Cool Gray 8 C · métallisé : 877 C / dorure argent",
         origine="Feuille d'argent — la lumière métallique de la carrosserie.",
         role="Texte secondaire sur fond sombre, filets, données techniques, dorure à chaud."),
    dict(id="travertino", nom="Travertino", groupe="secondaire", hex="#D6D3CA",
         cmjn=(15, 12, 18, 0), aplat_cmjn=None, pantone="7527 C (indicatif)",
         origine="Pierre romaine des façades et des sols d'atelier.",
         role="Fonds clairs secondaires, séparateurs sur ivoire, états désactivés."),
]


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lum(h):
    def ch(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def verdict(r):
    if r >= 7:
        return "AAA"
    if r >= 4.5:
        return "AA"
    if r >= 3:
        return "AA grands textes"
    return "décoratif seulement"


def ase(colors):
    """Adobe Swatch Exchange v1.0, couleurs RGB globales."""
    blocks = b""
    for c in colors:
        name = (c["nom"] + "\0").encode("utf-16-be")
        r, g, b = (v / 255 for v in rgb(c["hex"]))
        body = struct.pack(">H", len(name) // 2) + name + b"RGB " + struct.pack(">fff", r, g, b) + struct.pack(">H", 0)
        blocks += struct.pack(">HI", 0x0001, len(body)) + body
    return b"ASEF" + struct.pack(">HHI", 1, 0, len(colors)) + blocks


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for c in PALETTE:
        c["rgb"] = rgb(c["hex"])
    pairs = []
    for fg in PALETTE:
        for bg in PALETTE:
            if fg is bg:
                continue
            r = contrast(fg["hex"], bg["hex"])
            pairs.append(dict(texte=fg["nom"], fond=bg["nom"], ratio=round(r, 2), niveau=verdict(r)))
    data = dict(marque="Arte Automobili", version="1.0", couleurs=PALETTE, contrastes=pairs,
                proportions={"Nero Vite": 55, "Verdaccio": 15, "Bianco Sangiovanni": 18,
                             "Verde Verona": 8, "Argento": 3, "Travertino": 1})
    (OUT / "palette.json").write_text(json.dumps(data, ensure_ascii=False, indent=2))
    css = [":root {", "  /* Arte Automobili — palette officielle v1.0 */"]
    for c in PALETTE:
        css.append(f"  --aa-{c['id']}: {c['hex']};  /* {c['nom']} — rgb{c['rgb']} */")
    css.append("}")
    (OUT / "palette.css").write_text("\n".join(css) + "\n")
    (OUT / "palette.ase").write_bytes(ase(PALETTE))
    gpl = ["GIMP Palette", "Name: Arte Automobili", "Columns: 6", "#"]
    gpl += [f"{c['rgb'][0]:3d} {c['rgb'][1]:3d} {c['rgb'][2]:3d}\t{c['nom']}" for c in PALETTE]
    (OUT / "palette.gpl").write_text("\n".join(gpl) + "\n")
    for p in pairs:
        if p["texte"] in ("Bianco Sangiovanni", "Argento", "Nero Vite", "Verde Verona") and \
                p["fond"] in ("Nero Vite", "Verde Verona", "Bianco Sangiovanni", "Verdaccio", "Travertino"):
            print(f"{p['texte']:20s} sur {p['fond']:20s} {p['ratio']:5.2f}  {p['niveau']}")


if __name__ == "__main__":
    main()
