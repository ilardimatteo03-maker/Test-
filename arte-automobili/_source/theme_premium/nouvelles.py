"""Nouvelles sections de la bibliothèque : corps Liquid (dossier nouvelles/) + schémas."""
import json
from pathlib import Path

from communs import (RATIOS, STYLES_BOUTON, bloc_bouton, bloc_espace, bloc_liste, bloc_surtitre, bloc_texte, bloc_titre,
                     blocs_contenu, chk, communs, hdr, para, rng, sel, taille_titre, txt)

ICI = Path(__file__).parent
ICONES = json.load(open(ICI / "icones.json"))
RATIOS_SANS_AUTO = [r for r in RATIOS if r[0] != "auto"]


def entete(surtitre="", titre="", texte=None):
    s = [txt("surtitre", "Surtitre", surtitre), {"type": "inline_richtext", "id": "titre", "label": "Titre", "default": titre} if titre else {"type": "inline_richtext", "id": "titre", "label": "Titre"}]
    r = {"type": "richtext", "id": "texte", "label": "Texte d'introduction"}
    if texte: r["default"] = texte
    return s + [r]


def colonnes(d=3, m=1, maxd=4, maxm=2):
    return [rng("colonnes_d", "Colonnes sur ordinateur", 1, maxd, 1, d), rng("colonnes_m", "Colonnes sur mobile", 1, maxm, 1, m)]


def schema(name, settings, blocks=None, presets=None, max_blocks=None, **extra):
    s = {"name": name, "tag": "div", "class": "section-bibliotheque", "settings": settings}
    if blocks: s["blocks"] = blocks
    if max_blocks: s["max_blocks"] = max_blocks
    if presets: s["presets"] = presets
    s.update(extra)
    return s


SECTIONS = {}

SECTIONS["image-texte"] = schema("Texte avec image", [
    {"type": "image_picker", "id": "image", "label": "Image"},
    txt("alt", "Description de l'image (accessibilité)"),
    {"type": "video", "id": "video", "label": "Vidéo à la place de l'image (facultative)"},
    sel("position_image", "Position de l'image", [("gauche", "À gauche"), ("droite", "À droite")], "gauche"),
    rng("largeur_image", "Largeur de l'image", 30, 70, 5, 50, "%"),
    sel("ratio", "Format de l'image", RATIOS, "4 / 5"),
    sel("alignement_vertical", "Alignement vertical du texte", [("haut", "En haut"), ("centre", "Au centre"), ("bas", "En bas")], "centre"),
    chk("image_mobile_premier", "Sur mobile, afficher l'image avant le texte", True),
    taille_titre(),
] + communs(alignement=True), blocs_contenu(), [
    {"name": "Texte avec image", "blocks": [{"type": "surtitre", "settings": {"texte": "Savoir-faire"}}, {"type": "titre", "settings": {"texte": "Le soin du <em>détail</em>."}}, {"type": "texte"}, {"type": "bouton", "settings": {"texte": "Découvrir nos services"}}]},
    {"name": "Présentation de l'entreprise (texte et image)", "settings": {"position_image": "droite"}, "blocks": [{"type": "surtitre", "settings": {"texte": "Arte Automobili"}}, {"type": "titre", "settings": {"texte": "Notre <em>histoire</em>."}}, {"type": "texte", "settings": {"texte": "<p>Racontez ici l'origine de votre atelier, votre parcours et ce qui vous anime.</p>"}}, {"type": "liste", "settings": {"elements": "Précision\nSoin\nExigence"}}]},
], max_blocks=12)

SECTIONS["grille-services"] = schema("Grille de services", entete("Prestations", "Nos <em>services</em>.") + [
    hdr("Cartes"), *colonnes(3, 1),
    sel("ratio", "Format des images", RATIOS_SANS_AUTO, "4 / 3"),
    sel("style_carte", "Style des cartes", [("epure", "Épuré"), ("encadre", "Encadré"), ("surface", "Sur fond Verdaccio")], "epure"),
    chk("afficher_images", "Afficher les photos", True), chk("afficher_description", "Afficher la description", True),
    chk("afficher_duree", "Afficher la durée (si renseignée)", True), chk("afficher_inclus", "Afficher les prestations incluses (si renseignées)", True),
    chk("masquer_prix", "Masquer tous les prix", False), chk("afficher_bouton", "Afficher le bouton de chaque carte", True),
    {"type": "select", "id": "style_bouton", "label": "Style des boutons", "options": [{"value": v, "label": l} for v, l in STYLES_BOUTON], "default": "secondary"},
    {"type": "textarea", "id": "note", "label": "Note sous la grille"},
    taille_titre(),
] + communs(alignement=True), [
    {"type": "service", "name": "Service", "settings": [
        sel("source", "Contenu", [("1", "Prestation 1 des réglages"), ("2", "Prestation 2 des réglages"), ("3", "Prestation 3 des réglages"), ("4", "Prestation 4 des réglages"), ("perso", "Service personnalisé ci-dessous")], "1",
            info="Les prestations 1 à 4 se modifient dans Réglages du thème › Prestations et tarifs."),
        chk("mise_en_avant", "Mettre en avant (discrètement)", False), txt("mention", "Mention de mise en avant", "Formule complète"),
        hdr("Service personnalisé"),
        txt("nom", "Nom", "Nouveau service", visible_if="{{ block.settings.source == 'perso' }}"),
        txt("prix", "Prix affiché", "Sur devis", visible_if="{{ block.settings.source == 'perso' }}"),
        {"type": "textarea", "id": "description", "label": "Description", "visible_if": "{{ block.settings.source == 'perso' }}"},
        txt("duree", "Durée indicative", visible_if="{{ block.settings.source == 'perso' }}"),
        {"type": "textarea", "id": "inclus", "label": "Prestations incluses (une par ligne)", "visible_if": "{{ block.settings.source == 'perso' }}"},
        {"type": "image_picker", "id": "image", "label": "Photo", "visible_if": "{{ block.settings.source == 'perso' }}"},
        txt("bouton", "Texte du bouton", "Demander un devis", visible_if="{{ block.settings.source == 'perso' }}"),
        {"type": "url", "id": "lien", "label": "Lien du bouton (vide = page Contact)", "visible_if": "{{ block.settings.source == 'perso' }}"},
    ]}], [
    {"name": "Grille de services", "blocks": [{"type": "service", "settings": {"source": "1"}}, {"type": "service", "settings": {"source": "2"}}, {"type": "service", "settings": {"source": "3", "mise_en_avant": True}}, {"type": "service", "settings": {"source": "4"}}], "settings": {"colonnes_d": 4}},
    {"name": "Nos services", "blocks": [{"type": "service", "settings": {"source": "1"}}, {"type": "service", "settings": {"source": "2"}}, {"type": "service", "settings": {"source": "3", "mise_en_avant": True}}]},
], max_blocks=12)

carte_icone = {"type": "carte", "name": "Élément", "settings": [
    sel("icone", "Icône", [(o["value"], o["label"]) for o in ICONES], "inspection-lumiere"),
    {"type": "image_picker", "id": "image", "label": "…ou image (remplace l'icône)"},
    txt("titre", "Titre", "Précision"), {"type": "textarea", "id": "texte", "label": "Texte", "default": "Une méthode rigoureuse, appliquée à chaque surface."},
    {"type": "url", "id": "lien", "label": "Lien (facultatif)"}]}
SECTIONS["cartes-icones"] = schema("Cartes avec icônes", entete("Engagements", "Ce qui nous <em>distingue</em>.") + [
    hdr("Disposition"),
    sel("disposition", "Style", [("cartes", "Cartes"), ("liste", "Liste d'avantages"), ("ligne", "Icône à côté du texte")], "cartes"),
    *colonnes(3, 1), rng("taille_icone", "Taille des icônes", 20, 64, 2, 32, "px"), taille_titre(),
] + communs(alignement=True), [carte_icone], [
    {"name": "Cartes avec icônes", "blocks": [
        {"type": "carte", "settings": {"icone": "inspection-lumiere", "titre": "Précision", "texte": "Une méthode rigoureuse, appliquée à chaque surface."}},
        {"type": "carte", "settings": {"icone": "goutte", "titre": "Soin", "texte": "Des gestes attentifs, respectueux de chaque matériau."}},
        {"type": "carte", "settings": {"icone": "eclat", "titre": "Exigence", "texte": "Le même niveau d'attention, quel que soit le véhicule."}}]},
    {"name": "Liste d'avantages", "settings": {"disposition": "liste", "colonnes_d": 2, "titre": "Pourquoi nous <em>choisir</em>."}, "blocks": [
        {"type": "carte", "settings": {"icone": "rendez-vous", "titre": "Sur rendez-vous", "texte": "Un créneau réservé pour votre véhicule."}},
        {"type": "carte", "settings": {"icone": "devis", "titre": "Tarifs affichés", "texte": "Des prix clairs, annoncés à l'avance."}},
        {"type": "carte", "settings": {"icone": "interieur", "titre": "Intérieur et extérieur", "texte": "Des formules séparées ou combinées."}},
        {"type": "carte", "settings": {"icone": "voiture", "titre": "Particuliers et professionnels", "texte": "Des solutions adaptées, y compris pour les flottes."}}]},
], max_blocks=12)

SECTIONS["realisations"] = schema("Galerie de réalisations", entete("Réalisations", "Nos <em>réalisations</em>.") + [
    para("Montrez uniquement des véhicules réellement traités, avec l'accord de leurs propriétaires."),
    hdr("Grille"), *colonnes(3, 1), sel("ratio", "Format des images", RATIOS_SANS_AUTO, "4 / 5"),
    sel("legende", "Légendes", [("dessous", "Sous l'image"), ("dessus", "Sur l'image, au survol"), ("aucune", "Masquées")], "dessous"),
    chk("agrandir", "Agrandir l'image au clic", True), taille_titre(),
] + communs(alignement=True), [{"type": "realisation", "name": "Réalisation", "settings": [
    {"type": "image_picker", "id": "image", "label": "Photo"}, txt("titre", "Véhicule ou titre", "Modèle du véhicule"),
    txt("prestation", "Prestation réalisée", "Lavage intérieur + extérieur"), {"type": "textarea", "id": "texte", "label": "Texte (facultatif)"},
    {"type": "url", "id": "lien", "label": "Lien (facultatif)"}, txt("lien_texte", "Texte du lien", "Voir")]}],
    [{"name": "Galerie de réalisations", "blocks": [{"type": "realisation"}, {"type": "realisation"}, {"type": "realisation"}]}], max_blocks=24)

SECTIONS["avant-apres"] = schema("Avant / après", entete("Avant / après", "La différence se <em>voit</em>.") + [
    para("Faites glisser le curseur pour comparer. Utilisez deux photos prises sous le même angle et le même éclairage."),
    txt("libelle_avant", "Libellé « avant »", "Avant"), txt("libelle_apres", "Libellé « après »", "Après"),
    *colonnes(1, 1, 3, 1), sel("ratio", "Format des images", RATIOS_SANS_AUTO, "3 / 2"), taille_titre(),
] + communs(alignement=True), [{"type": "comparaison", "name": "Comparaison", "settings": [
    {"type": "image_picker", "id": "image_avant", "label": "Photo avant"}, txt("alt_avant", "Description de la photo avant"),
    {"type": "image_picker", "id": "image_apres", "label": "Photo après"}, txt("alt_apres", "Description de la photo après"),
    rng("position", "Position de départ du curseur", 10, 90, 5, 50, "%"), txt("legende", "Légende (facultative)")]}],
    [{"name": "Avant / après", "blocks": [{"type": "comparaison"}]}], max_blocks=6)

SECTIONS["galerie"] = schema("Galerie d'images", entete("", "") + [
    hdr("Grille"), *colonnes(3, 2), sel("ratio", "Format des images", RATIOS_SANS_AUTO, "1 / 1"),
    rng("espacement", "Espacement entre les images", 0, 40, 2, 8, "px"),
    chk("mosaique", "Mosaïque : les images « larges » occupent deux colonnes", False),
    chk("afficher_legendes", "Afficher les légendes", False), taille_titre(),
] + communs(alignement=True), [{"type": "image", "name": "Image", "settings": [
    {"type": "image_picker", "id": "image", "label": "Image"}, txt("legende", "Légende / description"),
    {"type": "url", "id": "lien", "label": "Lien (facultatif)"}, chk("large", "Image large (mosaïque)", False)]}],
    [{"name": "Galerie d'images", "blocks": [{"type": "image"}, {"type": "image"}, {"type": "image"}, {"type": "image"}, {"type": "image"}, {"type": "image"}]}], max_blocks=30)

SECTIONS["video"] = schema("Vidéo", [
    {"type": "video", "id": "video", "label": "Vidéo hébergée sur Shopify"},
    {"type": "video_url", "id": "video_url", "label": "…ou lien YouTube / Vimeo", "accept": ["youtube", "vimeo"]},
    {"type": "image_picker", "id": "image", "label": "Image de couverture"},
    txt("titre_video", "Titre de la vidéo (accessibilité)", "Arte Automobili"),
    chk("lecture_auto", "Lecture automatique sans son, en boucle", True, info="Sinon, un bouton lecture s'affiche."),
    hdr("Mise en page"),
    sel("disposition", "Disposition", [("plein", "Plein écran"), ("gauche", "Vidéo à gauche, texte à droite"), ("droite", "Vidéo à droite, texte à gauche")], "plein"),
    rng("hauteur", "Hauteur en plein écran", 40, 100, 5, 80, "%", info="En pourcentage de la hauteur de l'écran."),
    sel("ratio", "Format (vidéo avec texte)", RATIOS, "16 / 9"),
    rng("voile", "Voile sombre sur la vidéo", 0, 90, 5, 35, "%"),
    sel("position_contenu", "Position du texte (plein écran)", [("centre", "Au centre"), ("bas-gauche", "En bas à gauche"), ("bas-centre", "En bas au centre")], "bas-gauche"),
    taille_titre(),
] + communs(fond_image=False, alignement=True), blocs_contenu("Prendre rendez-vous"), [
    {"name": "Vidéo plein écran", "blocks": [{"type": "titre", "settings": {"texte": "L'art du <em>détail</em>.", "taille": "h1"}}]},
    {"name": "Vidéo avec texte", "settings": {"disposition": "gauche", "lecture_auto": False}, "blocks": [{"type": "surtitre", "settings": {"texte": "En images"}}, {"type": "titre", "settings": {"texte": "Un rituel <em>précis</em>."}}, {"type": "texte"}, {"type": "bouton"}]},
], max_blocks=8)

SECTIONS["defilant"] = schema("Bandeau défilant", [
    txt("libelle", "Nom du bandeau (accessibilité)", "Engagements"),
    sel("taille", "Taille du texte", [("petit", "Petite (capitales)"), ("grand", "Grande (Bodoni)")], "grand"),
    rng("vitesse", "Durée d'un tour", 10, 80, 2, 36, "s"),
    chk("inverse", "Défiler vers la droite", False),
    sel("separateur", "Séparateur", [("losange", "Losange"), ("monogramme", "Monogramme"), ("point", "Point"), ("filet", "Filet"), ("aucun", "Aucun")], "losange"),
    rng("espacement", "Hauteur intérieure", 8, 80, 4, 32, "px"),
] + communs(largeur=False, fond_image=False), [{"type": "texte", "name": "Texte", "settings": [txt("texte", "Texte", "Précision"), {"type": "url", "id": "lien", "label": "Lien (facultatif)"}]}],
    [{"name": "Bandeau défilant", "settings": {"bordure_haut": True, "bordure_bas": True}, "blocks": [{"type": "texte", "settings": {"texte": "Précision"}}, {"type": "texte", "settings": {"texte": "Soin"}}, {"type": "texte", "settings": {"texte": "Exigence"}}, {"type": "texte", "settings": {"texte": "Lavage intérieur et extérieur"}}]}], max_blocks=12)

temoin = {"type": "temoignage", "name": "Témoignage", "settings": [
    {"type": "textarea", "id": "citation", "label": "Citation", "default": "[Citation exacte d'un client, avec son accord]"},
    txt("auteur", "Nom", "[Prénom N.]"), txt("detail", "Précision (véhicule, ville…)", "[Véhicule]"),
    rng("note", "Note sur 5 (0 = aucune)", 0, 5, 1, 5), {"type": "image_picker", "id": "photo", "label": "Photo (facultative)"}]}
SECTIONS["temoignages"] = schema("Témoignages et avis", entete("Témoignages", "Ils nous ont <em>confié</em> leur véhicule.") + [
    para("Publiez uniquement de vrais avis, avec l'accord de leurs auteurs. Les textes entre crochets sont des exemples à remplacer."),
    sel("disposition", "Disposition", [("grille", "Grille"), ("une", "Une citation mise en avant")], "grille"),
    *colonnes(3, 1), chk("afficher_etoiles", "Afficher les étoiles", False),
    txt("note_globale", "Note globale (facultative)", info="Ex. « 4,9/5 sur Google ». À recopier exactement depuis la source."),
    {"type": "url", "id": "source_lien", "label": "Lien vers la source des avis"}, txt("source_texte", "Texte du lien", "Voir tous les avis"),
    taille_titre(),
] + communs(alignement=True), [temoin], [
    {"name": "Témoignages clients", "blocks": [{"type": "temoignage"}, {"type": "temoignage"}, {"type": "temoignage"}]},
    {"name": "Avis clients", "settings": {"surtitre": "Avis", "titre": "Ce qu'en disent nos <em>clients</em>.", "afficher_etoiles": True}, "blocks": [{"type": "temoignage"}, {"type": "temoignage"}, {"type": "temoignage"}]},
], max_blocks=12)

SECTIONS["faq"] = schema("Questions fréquentes", entete("Questions fréquentes", "Vos <em>questions</em>.") + [
    sel("disposition", "Disposition", [("cote", "Titre à gauche, questions à droite"), ("pile", "Titre au-dessus")], "cote"),
    chk("un_seul", "Une seule réponse ouverte à la fois", True), chk("premier_ouvert", "Première réponse ouverte", False),
    chk("donnees_structurees", "Données structurées pour Google (FAQ)", True), taille_titre(),
] + communs(alignement=True), [{"type": "question", "name": "Question", "settings": [
    txt("question", "Question", "Combien de temps dure une prestation ?"),
    {"type": "richtext", "id": "reponse", "label": "Réponse", "default": "<p>Indiquez ici une réponse exacte et vérifiée.</p>"}]}],
    [{"name": "Questions fréquentes", "blocks": [
        {"type": "question", "settings": {"question": "Comment prendre rendez-vous ?", "reponse": "<p>Remplissez le formulaire de la page Contact en précisant la prestation souhaitée : nous revenons vers vous pour fixer un créneau.</p>"}},
        {"type": "question", "settings": {"question": "Proposez-vous des tarifs pour les professionnels ?", "reponse": "<p>Oui, les prestations pour les professionnels et les flottes de véhicules sont établies sur devis.</p>"}},
        {"type": "question", "settings": {"question": "Que comprend la formule intérieur + extérieur ?", "reponse": "<p>Elle réunit le lavage intérieur et le lavage extérieur. Les modalités sont confirmées lors de la réservation.</p>"}}]}], max_blocks=30)

SECTIONS["chiffres"] = schema("Chiffres clés", entete("", "") + [
    para("N'affichez que des chiffres exacts et vérifiables."),
    *colonnes(4, 2, 6, 2), chk("compteur", "Animer les chiffres à l'apparition", True), taille_titre(),
] + communs(alignement=True), [{"type": "chiffre", "name": "Chiffre", "settings": [
    txt("valeur", "Valeur", "100", info="Nombre seul, ex. 100 ou 4,9."), txt("prefixe", "Avant le nombre (facultatif)"), txt("suffixe", "Après le nombre (facultatif)", "%"),
    txt("libelle", "Libellé", "[Libellé à compléter]"), txt("detail", "Précision (facultative)")]}],
    [{"name": "Chiffres clés", "blocks": [{"type": "chiffre"}, {"type": "chiffre"}, {"type": "chiffre"}]}], max_blocks=8)

SECTIONS["etapes"] = schema("Étapes de prestation", entete("Déroulement", "Comment se passe une <em>prestation</em>.") + [
    sel("disposition", "Disposition", [("horizontale", "En ligne"), ("verticale", "Liste verticale")], "horizontale"),
    sel("numerotation", "Repère de chaque étape", [("chiffres", "01, 02, 03…"), ("romain", "I, II, III…"), ("icone", "Icône")], "chiffres"),
    *colonnes(4, 1, 6, 2), taille_titre(),
] + communs(alignement=True), [{"type": "etape", "name": "Étape", "settings": [
    txt("titre", "Titre", "Prise de rendez-vous"), {"type": "textarea", "id": "texte", "label": "Texte", "default": "Vous choisissez la prestation et le créneau qui vous conviennent."},
    sel("icone", "Icône (si repère « icône »)", [(o["value"], o["label"]) for o in ICONES], "rendez-vous")]}],
    [{"name": "Étapes de prestation", "blocks": [
        {"type": "etape", "settings": {"titre": "Demande", "texte": "Vous décrivez votre véhicule et la prestation souhaitée.", "icone": "devis"}},
        {"type": "etape", "settings": {"titre": "Rendez-vous", "texte": "Nous confirmons ensemble le créneau et les modalités.", "icone": "rendez-vous"}},
        {"type": "etape", "settings": {"titre": "Prestation", "texte": "Votre véhicule est traité avec méthode et attention.", "icone": "inspection-lumiere"}},
        {"type": "etape", "settings": {"titre": "Restitution", "texte": "Vous retrouvez un véhicule propre et soigné.", "icone": "cle"}}]}], max_blocks=8)

SECTIONS["coordonnees"] = schema("Coordonnées et horaires", entete("Nous trouver", "Coordonnées et <em>horaires</em>.") + [
    para("Les coordonnées viennent de Réglages du thème › Coordonnées. Ajoutez un bloc par ligne d'horaires."),
    sel("disposition", "Disposition", [("colonnes", "Deux colonnes"), ("carte", "Encadré Verde (carte de contact)")], "colonnes"),
    txt("titre_horaires", "Titre des horaires", "Horaires"),
    chk("afficher_boutons", "Boutons Appeler / Écrire", True), txt("bouton_appeler", "Texte du bouton d'appel", "Appeler"), txt("bouton_ecrire", "Texte du bouton e-mail", "Écrire"),
    chk("afficher_reseaux", "Réseaux sociaux", True), taille_titre(),
] + communs(alignement=False), [{"type": "horaire", "name": "Ligne d'horaires", "settings": [txt("jours", "Jours", "Lundi – vendredi"), txt("heures", "Heures", "[Horaires à compléter]")]}],
    [{"name": "Coordonnées et horaires", "blocks": [{"type": "horaire"}]}, {"name": "Carte de contact", "settings": {"disposition": "carte", "titre": "Parlons de votre <em>véhicule</em>."}}], max_blocks=10)

SECTIONS["carte-localisation"] = schema("Carte et localisation", entete("Accès", "Nous <em>trouver</em>.") + [
    txt("adresse", "Adresse affichée sur la carte", info="Vide = adresse des Réglages du thème."),
    chk("afficher_adresse", "Afficher l'adresse en texte", True), txt("bouton_itineraire", "Texte du bouton d'itinéraire", "Itinéraire"),
    rng("zoom", "Niveau de zoom", 8, 19, 1, 15), rng("hauteur", "Hauteur de la carte", 240, 720, 20, 440, "px"),
    sel("disposition", "Disposition", [("cote", "Texte à côté de la carte"), ("pile", "Texte au-dessus"), ("carte", "Carte seule")], "cote"),
    chk("chargement_clic", "Charger la carte seulement au clic (recommandé, RGPD)", True, info="Google Maps dépose des cookies : le visiteur choisit de l'afficher."),
    txt("texte_consentement", "Texte avant chargement", "La carte est fournie par Google Maps."),
    {"type": "image_picker", "id": "image", "label": "Image de fond avant chargement (facultative)"},
    taille_titre(),
] + communs(alignement=False), None, [{"name": "Carte et localisation"}])

SECTIONS["reseaux-sociaux"] = schema("Réseaux sociaux", entete("", "Suivez-<em>nous</em>.") + [
    para("Les liens viennent de Réglages du thème › Réseaux sociaux."),
    sel("style", "Affichage", [("icones", "Icônes"), ("texte", "Icônes et noms")], "texte"), rng("taille", "Taille des icônes", 18, 48, 2, 24, "px"),
] + communs(alignement=True), None, [{"name": "Réseaux sociaux", "settings": {"alignement": "center"}}])

SECTIONS["logos"] = schema("Logos de partenaires", entete("", "") + [
    *colonnes(5, 3, 8, 4), rng("hauteur", "Hauteur maximale des logos", 24, 120, 4, 48, "px"),
    chk("niveaux_gris", "Logos en niveaux de gris (couleur au survol)", True),
] + communs(alignement=True), [{"type": "logo", "name": "Logo", "settings": [{"type": "image_picker", "id": "image", "label": "Logo"}, txt("nom", "Nom du partenaire"), {"type": "url", "id": "lien", "label": "Lien (facultatif)"}]}],
    [{"name": "Logos de partenaires", "blocks": [{"type": "logo"}, {"type": "logo"}, {"type": "logo"}, {"type": "logo"}, {"type": "logo"}]}], max_blocks=20)

SECTIONS["separateur"] = schema("Séparateur", [
    sel("style", "Style", [("filet", "Filet fin"), ("monogramme", "Filet et monogramme"), ("lame", "Lame de lumière"), ("court", "Filet court centré")], "filet"),
    chk("pleine_largeur", "Pleine largeur", False),
    rng("espacement", "Espace au-dessus et au-dessous (ordinateur)", 0, 160, 4, 48, "px"), rng("espacement_m", "Espace au-dessus et au-dessous (mobile)", 0, 120, 4, 32, "px"),
] + communs(largeur=False, fond_image=False, espacement=False, bordures=False), None, [{"name": "Séparateur"}])

SECTIONS["espace"] = schema("Espacement", [
    rng("hauteur", "Hauteur sur ordinateur", 0, 240, 4, 64, "px"), rng("hauteur_m", "Hauteur sur mobile", 0, 160, 4, 40, "px"),
] + communs(largeur=False, fond_image=False, espacement=False, bordures=False), None, [{"name": "Espacement"}])

SECTIONS["liquid-personnalise"] = schema("Code personnalisé", [
    para("Réservé aux modifications avancées. Un code incorrect peut casser l'affichage de la page."),
    {"type": "liquid", "id": "code", "label": "Code HTML ou Liquid"},
    chk("conteneur", "Limiter à la largeur du thème", True), chk("marges", "Ajouter l'espacement vertical des sections", True),
] + communs(fond_image=False, espacement=False), None, [{"name": "Code HTML ou Liquid personnalisé"}])

STYLES_SANS_DEFAUT = [s for s in STYLES_BOUTON if s[0] != "defaut"]
SI_CINEMA = "{{ section.settings.mise_en_scene == 'cinema' }}"
CINEMA = {
    "mise_en_scene": "cinema", "logo_style": "vertical", "type_fond": "image", "lame": True,
    "surtitre": "Ouverture prochaine", "titre": "L'art du détail <em>arrive</em>.", "afficher_linea": True,
    "texte": "Arte Automobili ouvre bientôt. Laissez-nous votre adresse : nous vous préviendrons dès l'ouverture.",
    "liste_attente": True, "afficher_reseaux": True, "position": "centre",
}
SECTIONS["main-password"] = schema("Page de lancement", [
    para("Affichée sur la page mot de passe de la boutique et sur le modèle de page « lancement »."),
    sel("mise_en_scene", "Mise en scène", [("sobre", "Sobre (page mot de passe d'origine)"), ("cinema", "Cinématographique (plein écran)")], "sobre",
        info="Sobre : la mise en page d'origine, sur le fond du site. Cinématographique : image ou vidéo plein écran, contenu centré."),
    hdr("Logo"),
    sel("logo_style", "Logo", [("monogramme", "Monogramme"), ("vertical", "Logo vertical"), ("principal", "Logo horizontal"), ("image", "Logo téléversé (Identité visuelle)"), ("aucun", "Aucun")], "monogramme"),
    rng("logo_largeur", "Largeur du logo", 40, 320, 4, 120, "px", info="Sans effet sur le monogramme en mise en scène sobre."),
    hdr("Arrière-plan (cinématographique)"),
    sel("type_fond", "Type de fond", [("image", "Image"), ("video", "Vidéo"), ("uni", "Couleur unie (palette)"), ("degrade", "Dégradé")], "image", visible_if=SI_CINEMA),
    {"type": "image_picker", "id": "image", "label": "Image", "info": "Vide = visuel du thème.", "visible_if": SI_CINEMA},
    {"type": "video", "id": "video", "label": "Vidéo hébergée sur Shopify", "visible_if": SI_CINEMA},
    {"type": "video_url", "id": "video_url", "label": "…ou lien YouTube / Vimeo", "accept": ["youtube", "vimeo"], "visible_if": SI_CINEMA},
    {"type": "color_background", "id": "degrade", "label": "Dégradé", "default": "linear-gradient(160deg, #1F3D35 0%, #0D0F0E 72%)", "visible_if": SI_CINEMA},
    rng("voile", "Voile sombre sur l'image ou la vidéo", 0, 90, 5, 55, "%", visible_if=SI_CINEMA),
    chk("lame", "Lame de lumière à l'ouverture", False, visible_if=SI_CINEMA),
    hdr("Textes"),
    txt("surtitre", "Surtitre", "Bientôt"),
    {"type": "inline_richtext", "id": "titre", "label": "Titre", "default": "Le site ouvre <em>bientôt</em>."},
    chk("afficher_linea", "Afficher la Linea sous le titre", False),
    {"type": "textarea", "id": "texte", "label": "Texte", "info": "Vide = message saisi dans Boutique en ligne › Préférences › Protection par mot de passe."},
    txt("date_affichee", "Date de lancement affichée (facultative)", info="Texte libre, ex. « Ouverture le 1er décembre »."),
    hdr("Compte à rebours"),
    chk("compte_a_rebours", "Afficher un compte à rebours", False),
    txt("date", "Date et heure de lancement", info="Format AAAA-MM-JJ HH:MM, ex. 2026-12-01 10:00."),
    sel("fuseau", "Fuseau horaire", [("Europe/Brussels", "Bruxelles"), ("Europe/Paris", "Paris"), ("Europe/Luxembourg", "Luxembourg"), ("Europe/Zurich", "Zurich"), ("America/Montreal", "Montréal")], "Europe/Brussels"),
    txt("libelles", "Libellés des unités", "jours, heures, minutes, secondes", info="Quatre mots séparés par des virgules."),
    txt("message_fin", "Message à l'échéance", "C'est le grand jour."),
    hdr("Liste d'attente"),
    chk("liste_attente", "Formulaire d'inscription", False),
    para("Les adresses sont enregistrées dans Clients (accord marketing), avec le tag ci-dessous."),
    txt("invitation", "Texte d'invitation", "Soyez prévenu de l'ouverture."),
    txt("bouton", "Texte du bouton", "Me prévenir"),
    sel("style_bouton", "Style du bouton", STYLES_SANS_DEFAUT, "primary"),
    txt("confirmation", "Message de confirmation", "Merci. Vous serez parmi les premiers informés."),
    txt("mention", "Mention sous le champ", "Votre adresse sert uniquement à vous prévenir. Désinscription en un clic."),
    txt("tags", "Tag client", "liste-attente"),
    hdr("Informations"),
    chk("afficher_reseaux", "Réseaux sociaux", False), chk("afficher_coordonnees", "Téléphone et e-mail (Réglages du thème)", False),
    chk("acces_mdp", "Accès par mot de passe (page mot de passe)", True), txt("libelle_acces", "Libellé de l'accès", "Accès réservé"),
    hdr("Mise en page (cinématographique)"),
    sel("position", "Position du contenu", [("centre", "Centré"), ("bas-gauche", "En bas à gauche"), ("gauche", "À gauche, centré verticalement")], "centre", visible_if=SI_CINEMA),
    rng("largeur_contenu", "Largeur du contenu", 400, 960, 20, 640, "px", visible_if=SI_CINEMA),
    taille_titre(),
] + communs(fond_image=False, largeur=False, espacement=False, bordures=False), None,
    [{"name": "Page de lancement", "settings": CINEMA}])


def generer(theme):
    for nom, sch in SECTIONS.items():
        corps = (ICI / "nouvelles" / f"{nom}.liquid").read_text().rstrip()
        f = theme / "sections" / f"{nom}.liquid"
        f.write_text(corps + "\n\n{% schema %}\n" + json.dumps(sch, ensure_ascii=False, indent=2) + "\n{% endschema %}\n")
    print(len(SECTIONS), "sections écrites")


if __name__ == "__main__":
    generer(Path("/home/user/Test-/arte-automobili/14_theme-shopify-premium/theme"))
