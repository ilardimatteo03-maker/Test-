"""Sections existantes : nouveau corps Liquid (balisage d'origine conservé pour les valeurs par défaut)
et schéma = réglages existants recopiés tels quels + nouveaux réglages + mise en forme commune."""
import json
from pathlib import Path

from communs import (RATIOS, STYLES_BOUTON, chk, communs, ecrire_schema, hdr, para, rng, schema_de, sel, taille_titre, txt)

ICI = Path(__file__).parent
STYLES_SIMPLES = [s for s in STYLES_BOUTON if s[0] != "defaut"]
POSITIONS = [("droite", "À droite"), ("centre", "Au centre"), ("gauche", "À gauche")]


def ajouts():
    return {
        "hero": [
            {"type": "url", "id": "lien_1", "label": "Lien du bouton principal", "info": "Vide = page Services."},
            sel("style_1", "Style du bouton principal", STYLES_SIMPLES, "primary"),
            {"type": "url", "id": "lien_2", "label": "Lien du bouton secondaire", "info": "Vide = page Contact."},
            sel("style_2", "Style du bouton secondaire", STYLES_SIMPLES, "secondary"),
            hdr("Image ou vidéo"),
            sel("type_media", "Arrière-plan", [("image", "Image"), ("video", "Vidéo")], "image"),
            {"type": "video", "id": "video", "label": "Vidéo hébergée sur Shopify", "info": "Lecture automatique, sans son, en boucle.", "visible_if": "{{ section.settings.type_media == 'video' }}"},
            {"type": "video_url", "id": "video_url", "label": "…ou lien YouTube / Vimeo", "accept": ["youtube", "vimeo"], "visible_if": "{{ section.settings.type_media == 'video' }}"},
            {"type": "image_picker", "id": "image_mobile", "label": "Image pour mobile (facultative)", "info": "Format portrait conseillé."},
            sel("position_image", "Cadrage de l'image sur ordinateur", POSITIONS, "droite"),
            sel("position_image_mobile", "Cadrage de l'image sur mobile", POSITIONS, "droite"),
            hdr("Mise en page"),
            sel("hauteur", "Hauteur", [("plein", "Plein écran"), ("grand", "Grande"), ("moyen", "Moyenne"), ("adapte", "Adaptée au contenu")], "plein"),
            sel("disposition", "Composition", [("linea", "Linea à 61,8 % (signature)"), ("bas", "Contenu en bas"), ("centre", "Contenu centré")], "linea"),
            sel("alignement_texte", "Alignement du texte", [("gauche", "À gauche"), ("centre", "Centré")], "gauche"),
            rng("intensite_ombre", "Intensité de l'ombrage sur l'image", 0, 100, 5, 100, "%"),
            rng("largeur_titre", "Largeur maximale du titre", 6, 24, 1, 11, "car", info="En nombre de caractères par ligne."),
            taille_titre(),
            chk("afficher_reflet", "Reflet du titre (Il Riflesso)", True),
            chk("afficher_linea", "Afficher la Linea", True),
            chk("afficher_lame", "Lame de lumière à l'ouverture", True),
        ],
        "cartes-services": [
            hdr("Cartes"),
            rng("colonnes_d", "Colonnes sur ordinateur", 2, 4, 1, 3),
            rng("colonnes_m", "Colonnes sur mobile", 1, 2, 1, 1),
            sel("ratio", "Format des images", [r for r in RATIOS if r[0] != "auto"], "4 / 5"),
            sel("ratio_m", "Format des images sur mobile", [("defaut", "Paysage 4:3 (par défaut)")] + [r for r in RATIOS if r[0] != "auto"], "defaut"),
            chk("afficher_prix", "Afficher les prix", True),
            chk("afficher_duree", "Afficher la durée indicative", False),
            chk("afficher_lien", "Afficher « Voir la prestation »", True),
            chk("penombre", "Pénombre : les autres cartes s'estompent au survol", True),
            chk("afficher_pied", "Afficher la ligne sous les cartes", True),
            taille_titre(),
        ],
        "approche": [
            txt("bouton_texte", "Texte du bouton (facultatif)"),
            {"type": "url", "id": "bouton_lien", "label": "Lien du bouton"},
            sel("bouton_style", "Style du bouton", STYLES_BOUTON, "defaut"),
            hdr("Mise en page"),
            sel("position_image", "Position de l'image", [("droite", "À droite"), ("gauche", "À gauche")], "droite"),
            sel("ratio", "Format de l'image", RATIOS[:-1], "4 / 5"),
            chk("image_mobile_premier", "Sur mobile, afficher l'image avant le texte", False),
            taille_titre(),
        ],
        "bandeau": [
            {"type": "url", "id": "bouton_lien", "label": "Lien du bouton", "info": "Vide = page Contact."},
            sel("bouton_style", "Style du bouton", STYLES_BOUTON, "primary"),
            chk("afficher_fleche", "Flèche dans le bouton", True),
            txt("surtitre", "Surtitre (facultatif)"),
            {"type": "textarea", "id": "texte", "label": "Texte (facultatif)"},
            hdr("Second bouton (facultatif)"),
            txt("bouton2_texte", "Texte"),
            {"type": "url", "id": "bouton2_lien", "label": "Lien"},
            sel("bouton2_style", "Style", STYLES_BOUTON, "secondary"),
            hdr("Mise en page"),
            sel("disposition", "Disposition", [("cote", "Titre et bouton côte à côte"), ("centre", "Centrée")], "cote"),
            taille_titre(),
        ],
        "main-services": [
            hdr("Présentation des prestations"),
            sel("disposition", "Disposition", [("lignes", "Lignes alternées"), ("grille", "Grille de deux colonnes"), ("compacte", "Liste compacte")], "lignes"),
            sel("ratio", "Format des images", RATIOS[:-1], "16 / 10"),
            chk("afficher_images", "Afficher les photos", True),
            chk("afficher_numeros", "Afficher les numéros (N° 01…)", True),
            chk("afficher_duree", "Afficher la durée indicative (si renseignée)", True),
            chk("afficher_inclus", "Afficher les prestations incluses (si renseignées)", True),
            para("Prix « Sur devis » ou masqué, durée, prestations incluses, visibilité : Réglages du thème › Prestations et tarifs."),
            taille_titre(),
        ],
        "presentation": [
            {"type": "url", "id": "bouton_lien", "label": "Lien du bouton", "info": "Vide = page Services."},
            sel("bouton_style", "Style du bouton", STYLES_BOUTON, "primary"),
            hdr("Mise en page"),
            sel("position_image", "Position de l'image", [("gauche", "À gauche"), ("droite", "À droite")], "gauche"),
            sel("ratio", "Format de l'image", RATIOS[:-1], "4 / 5"),
            sel("balise_titre", "Niveau du titre", [("h1", "H1 (titre de la page)"), ("h2", "H2 (section secondaire)")], "h1"),
            taille_titre(),
        ],
        "main-contact": [
            hdr("Champs du formulaire"),
            txt("libelle_nom", "Libellé du nom", "Nom et prénom"),
            txt("libelle_email", "Libellé de l'e-mail", "Adresse e-mail"),
            chk("afficher_telephone", "Téléphone", True),
            chk("telephone_requis", "Téléphone obligatoire", False),
            chk("afficher_service", "Motif de la demande", True),
            txt("libelle_service", "Libellé du motif", "Service souhaité"),
            txt("placeholder_service", "Texte du choix vide", "Choisir un service"),
            {"type": "textarea", "id": "motifs", "label": "Motifs proposés (un par ligne)", "info": "Vide = les prestations des réglages du thème."},
            chk("service_requis", "Motif obligatoire", True),
            chk("afficher_vehicule", "Marque et modèle", True),
            chk("afficher_date", "Date souhaitée", True),
            chk("afficher_message", "Message", True),
            chk("message_requis", "Message obligatoire", False),
            chk("afficher_consentement", "Case de consentement (recommandée, RGPD)", True),
            txt("bouton_texte", "Texte du bouton", "Envoyer la demande"),
            sel("bouton_style", "Style du bouton", STYLES_BOUTON, "primary"),
            hdr("Informations affichées"),
            chk("afficher_coordonnees", "Coordonnées", True),
            chk("afficher_horaires", "Horaires", True),
            chk("afficher_reseaux", "Réseaux sociaux", True),
            sel("balise_titre", "Niveau du titre", [("h1", "H1 (page Contact)"), ("h2", "H2 (formulaire ajouté à une autre page)")], "h1"),
            taille_titre(),
        ],
    }


OPTIONS_COMMUNS = {
    "hero": dict(fond_image=False, espacement=False),
    "cartes-services": dict(alignement=True),
    "approche": {},
    "bandeau": dict(palette="verde"),
    "main-services": dict(fond_image=False),
    "presentation": dict(fond_image=False),
    "main-contact": dict(fond_image=False),
}
PRESETS = {
    "main-contact": [{"name": "Formulaire de contact", "settings": {"balise_titre": "h2"}}],
    "main-services": [{"name": "Services et tarifs (liste détaillée)"}],
    "presentation": [{"name": "Présentation de l'entreprise", "settings": {"balise_titre": "h2"}, "blocks": [{"type": "valeur"}, {"type": "valeur", "settings": {"titre": "Soin", "texte": "Des gestes attentifs, respectueux de chaque matériau."}}, {"type": "valeur", "settings": {"titre": "Exigence", "texte": "Le même niveau d'attention, quel que soit le véhicule."}}]}],
    "bandeau": [{"name": "Bandeau final"},
                {"name": "Appel à l'action", "settings": {"titre": "Prêt à redonner l'éclat du premier jour\u202f?", "disposition": "centre", "palette": "verdaccio"}},
                {"name": "Bannière de prise de rendez-vous", "settings": {"surtitre": "Rendez-vous", "titre": "Réservez votre créneau.", "texte": "Choisissez votre prestation, nous confirmons rapidement.", "bouton": "Prendre rendez-vous"}},
                {"name": "Bandeau promotionnel", "settings": {"titre": "Offre du moment", "texte": "Décrivez ici votre offre.", "palette": "bianco", "bouton": "En profiter"}}],
}


def appliquer(theme):
    for nom, nouveaux in ajouts().items():
        f = theme / "sections" / f"{nom}.liquid"
        src = f.read_text()
        schema, _ = schema_de(src)
        ids = [x.get("id") for x in schema["settings"] if x.get("id")]
        if "afficher_ordinateur" in ids:
            continue  # déjà appliqué
        schema["settings"] = schema["settings"] + nouveaux + communs(**OPTIONS_COMMUNS[nom])
        if nom in PRESETS:
            schema["presets"] = PRESETS[nom] if nom != "bandeau" else PRESETS[nom]
        corps = (ICI / "corps" / f"{nom}.liquid").read_text()
        nouveau = corps.rstrip() + "\n\n{% schema %}\n{}\n{% endschema %}\n"
        f.write_text(ecrire_schema(nouveau, schema))
        print("✓", nom, len(ids), "→", len([x for x in schema["settings"] if x.get("id")]), "réglages")


if __name__ == "__main__":
    appliquer(Path("/home/user/Test-/arte-automobili/14_theme-shopify-premium/theme"))
