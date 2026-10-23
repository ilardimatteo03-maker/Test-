"""Ajoute le groupe « Programme de fidélité » aux réglages du thème (ajout seul, idempotent)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "theme_premium"))
from communs import sel, txt, hdr, para  # noqa: E402

THEME = Path(__file__).resolve().parents[2] / "14_theme-shopify-premium" / "theme"

NIVEAUX = [  # nom, seuil (prestations), fond, texte
    ("Bianco", None, "#EEEDE7", "#0D0F0E"),
    ("Argento", 3, "#8E9592", "#0D0F0E"),
    ("Verde", 6, "#1F3D35", "#EEEDE7"),
    ("Nero", 10, "#0D0F0E", "#EEEDE7"),
]


def groupe():
    s = [
        para("Le programme fonctionne sans application. Vous gérez les points dans la fiche de chaque client "
             "(Clients › fiche › Métachamps) ou automatiquement avec Shopify Flow. Le thème affiche ces données dans l'espace client. "
             "Guide complet : README de l'espace client."),
        txt("fid_nom", "Nom du programme", "Arte Club"),
        txt("fid_points_nom", "Nom des points", "points", info="Au pluriel, en minuscules. Ex. : points, crédits, miles."),
        hdr("Niveaux"),
        sel("fid_base", "Le niveau dépend de", [
            ("prestations", "Nombre de prestations (commandes Shopify)"),
            ("montant", "Montant total dépensé (commandes Shopify)"),
            ("points_cumules", "Points cumulés (métachamp arte.points_cumules)"),
        ], "prestations",
            info="Calculé par Shopify à l'affichage, jamais dans le navigateur. Un niveau saisi dans le métachamp arte.niveau a priorité."),
    ]
    for i, (nom, seuil, fond, texte) in enumerate(NIVEAUX, 1):
        s.append(hdr(f"Niveau {i}"))
        s.append(txt(f"fid_n{i}_nom", "Nom", nom))
        if seuil is not None:
            s.append({"type": "number", "id": f"fid_n{i}_seuil", "label": "À partir de", "default": seuil,
                      "info": "Selon le critère choisi : nombre de prestations, euros ou points."})
        s.append({"type": "color", "id": f"fid_n{i}_fond", "label": "Couleur de la carte", "default": fond})
        s.append({"type": "color", "id": f"fid_n{i}_texte", "label": "Couleur du texte de la carte", "default": texte})
    s.append(para("Les valeurs proposées (3, 6 et 10 prestations) sont des exemples : adaptez-les à votre programme."))
    return {"name": "Programme de fidélité", "settings": s}


def patch(schema):
    if any(g.get("name") == "Programme de fidélité" for g in schema):
        return schema
    i = next((k for k, g in enumerate(schema) if str(g.get("name", "")).startswith("Aide")), len(schema))
    schema.insert(i, groupe())
    return schema


if __name__ == "__main__":
    f = THEME / "config" / "settings_schema.json"
    sch = patch(json.loads(f.read_text()))
    f.write_text(json.dumps(sch, ensure_ascii=False, indent=2) + "\n")
    print("réglages :", sum(len([x for x in g.get("settings", []) if "id" in x]) for g in sch))
