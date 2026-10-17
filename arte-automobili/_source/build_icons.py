"""Jeu d'icônes Arte Automobili — grille 24 px, trait 1,5 px, extrémités carrées,
angles vifs, aucun remplissage. Les icônes de prestation sont posées sur la Linea
(filet de 1 px à y = 20,5) : l'objet au-dessus, la surface en dessous."""
from pathlib import Path

import cairosvg

OUT = Path(__file__).resolve().parent.parent / "05_univers-graphique" / "icones"
LINEA = '<path d="M2 20.5H22" stroke-width="1"/>'

SERVICES = {
    "lavage-exterieur": ('<path d="M12 3.5C12 3.5 6.5 9.6 6.5 13.1a5.5 5.5 0 0 0 11 0C17.5 9.6 12 3.5 12 3.5Z"/>'
                         '<path d="M9.4 13.6a2.6 2.6 0 0 0 2.6 2.4"/>', "Lavage extérieur"),
    "decontamination": ('<path d="M5 10h14v7H5z"/><path d="M8 6.5v.01M12 5v.01M16 6.5v.01M10 3.5v.01M14.5 3.8v.01" stroke-width="1.9" stroke-linecap="round"/>',
                        "Décontamination"),
    "correction-vernis": ('<circle cx="12" cy="11.5" r="6.2"/><circle cx="12" cy="11.5" r="2.2"/>'
                          '<path d="M17.8 3.6a9.4 9.4 0 0 1 2.6 4.6"/><path d="M20.9 5.6l-.5 2.6-2.6-.6"/>',
                          "Correction de vernis"),
    "protection-ceramique": ('<path d="M3 18c3-4.2 6-6 9-6s6 1.8 9 6"/>'
                             '<circle cx="8" cy="8.2" r="1.3"/><circle cx="12" cy="6" r="1.6"/><circle cx="16" cy="8.2" r="1.3"/>',
                             "Protection céramique"),
    "interieur": ('<path d="M7 3.5h3.2l1.6 9h5.4a1.8 1.8 0 0 1 1.8 1.8V17H8.6z"/><path d="M10 17v3.5M16.5 17v3.5"/>',
                  "Habitacle"),
    "cuir": ('<path d="M4.5 5h15v12h-15z"/><path d="M7 7.5h10v7H7z" stroke-width="1" stroke-dasharray="1.6 1.4"/>',
             "Soin du cuir"),
    "jantes": ('<circle cx="12" cy="12.25" r="7.5"/><circle cx="12" cy="12.25" r="4.9" stroke-width="1"/><circle cx="12" cy="12.25" r="1.3"/>'
               '<path d="M12 10.95V7.35M13.24 11.85l3.42-1.11M12.76 13.3l2.12 2.92M11.24 13.3l-2.12 2.92M10.76 11.85l-3.42-1.11" stroke-width="1"/>',
               "Jantes et étriers"),
    "vitrage": ('<path d="M4 17 7.2 6h9.6L20 17z"/><path d="M12 16.5 15 9.5"/>', "Vitrage"),
    "moteur": ('<path d="M8 3.5h8v6H8z"/><path d="M8 5.5h8" stroke-width="1"/><path d="M12 9.5v5"/><circle cx="12" cy="16.6" r="2.1"/>',
               "Compartiment moteur"),
    "inspection-lumiere": ('<path d="M4 4h16v2.5H4z"/><path d="M7 9.5 5.5 15M12 9.5V16M17 9.5l1.5 5.5" stroke-width="1"/>',
                           "Contrôle sous lumière"),
}

UTILITY = {
    "rendez-vous": ('<path d="M4 6h16v14H4z"/><path d="M4 10h16"/><path d="M8 3.5V7.5M16 3.5V7.5"/><path d="M14 13.5h3v3h-3z" stroke-width="1"/>',
                    "Rendez-vous"),
    "horaires": ('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.4 2.1"/>', "Horaires"),
    "devis": ('<path d="M6 3.5h8.5l3.5 3.5v13.5H6z"/><path d="M14.5 3.5V7H18"/><path d="M9 11h6M9 14h6M9 17h3.5" stroke-width="1"/>',
              "Devis"),
    "localisation": ('<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
                     "Adresse"),
    "telephone": ('<path d="M7.5 3h9v18h-9z"/><path d="M11 18h2" stroke-width="1"/>', "Téléphone"),
    "email": ('<path d="M3.5 6h17v12h-17z"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>', "E-mail"),
    "collecte-livraison": ('<circle cx="7.5" cy="12" r="3.5"/><path d="M11 12h9.5M17.5 12v3M20.5 12v2.2"/>',
                           "Collecte et livraison"),
    "fleche": ('<path d="M4 12h15.5"/><path d="m14.5 7 5 5-5 5"/>', "Flèche"),
}


def svg(body, linea, title, color="#0D0F0E"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" '
            f'stroke="{color}" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" role="img" '
            f'aria-label="{title}"><title>{title}</title>{body}{LINEA if linea else ""}</svg>')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    allicons = [(k, v, True) for k, v in SERVICES.items()] + [(k, v, False) for k, v in UTILITY.items()]
    for name, (body, title), linea in allicons:
        (OUT / f"icone-{name}.svg").write_text(svg(body, linea, title))
        (OUT / f"icone-{name}-bianco.svg").write_text(svg(body, linea, title, "#EEEDE7"))
    # planche
    cols, cell = 6, 150
    rows = (len(allicons) + cols - 1) // cols
    parts = []
    for i, (name, (body, title), linea) in enumerate(allicons):
        x, y = (i % cols) * cell, (i // cols) * cell
        parts.append(f'<g transform="translate({x + 39} {y + 26}) scale(3)" fill="none" stroke="#EEEDE7" stroke-width="1.5" '
                     f'stroke-linecap="square" stroke-linejoin="miter">{body}{LINEA if linea else ""}</g>'
                     f'<text x="{x + 75}" y="{y + 128}" text-anchor="middle" font-family="DM Mono" font-size="11" '
                     f'fill="#8E9592">{title}</text>')
    W, H = cols * cell, rows * cell
    sheet = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
             f'<rect width="{W}" height="{H}" fill="#0D0F0E"/>{"".join(parts)}</svg>')
    (OUT.parent / "planche-icones.svg").write_text(sheet)
    cairosvg.svg2png(bytestring=sheet.encode(), write_to=str(OUT.parent / "planche-icones.png"), output_width=W * 2)
    print(len(allicons), "icônes")


if __name__ == "__main__":
    main()
