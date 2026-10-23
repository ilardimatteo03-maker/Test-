"""Sections de l'espace client et du programme de fidélité : schémas, assemblage et modèles de page.

Chaque section = corps/_tete.liquid + corps/<nom>.liquid + schéma ci-dessous. Ne modifie aucun fichier existant du thème.
"""
import json
import re
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent / "theme_premium"))
from communs import sel, chk, txt, rng, hdr, para, taille_titre, communs, STYLES_BOUTON  # noqa: E402

THEME = ICI.parents[1] / "14_theme-shopify-premium" / "theme"

ICONES = json.loads((ICI.parent / "theme_premium" / "icones.json").read_text()) + [
    {"value": v, "label": l} for v, l in [
        ("profil", "Profil"), ("cadeau", "Cadeau"), ("carte", "Carte de fidélité"), ("historique", "Historique"),
        ("reglages", "Réglages"), ("tableau", "Tableau de bord"), ("niveau", "Niveau"), ("cloche", "Notification"),
        ("qr", "QR code"), ("deconnexion", "Déconnexion")]
]
assert len({i["value"] for i in ICONES}) == len(ICONES)


def icone(defaut, id="icone", label="Icône"):
    assert any(i["value"] == defaut for i in ICONES), defaut
    return {"type": "select", "id": id, "label": label, "options": ICONES, "default": defaut}


def ancre(defaut):
    return txt("ancre", "Identifiant de la section (ancre)", defaut,
               info=f"Sert de cible à la navigation : #{defaut}. Lettres, chiffres et tirets.")


def cible(id, label, defaut, info="Ancre de cette page (ex. #reserver) ou adresse (ex. /pages/contact)."):
    return txt(id, label, defaut, info=info)


def tete(surtitre, titre, texte=None):
    s = [txt("surtitre", "Surtitre", surtitre), {"type": "inline_richtext", "id": "titre", "label": "Titre", "default": titre}]
    s.append({"type": "textarea", "id": "texte", "label": "Texte", **({"default": texte} if texte else {})})
    return s


STYLES = [x for x in STYLES_BOUTON]
COMMUNS = dict(fond_image=False, bordures=False)

SECTIONS = {}


def section(nom, titre_schema, settings, blocks=None, presets=None, max_blocks=None, **extra):
    s = {"name": titre_schema, "tag": "div", "class": "section-ec", "settings": settings}
    if blocks:
        s["blocks"] = blocks
    if max_blocks:
        s["max_blocks"] = max_blocks
    s["presets"] = presets or [{"name": titre_schema}]
    s.update(extra)
    ids = [x["id"] for x in settings if "id" in x]
    assert len(ids) == len(set(ids)), nom
    assert len(ids) <= 40, (nom, len(ids))
    assert len(titre_schema) <= 25, titre_schema
    SECTIONS[nom] = s


# ── Accès (visiteur non connecté) ──
section("ec-acces", "Mon espace : accès", [
    para("Visible uniquement par les visiteurs non connectés. La connexion est celle de Shopify (code envoyé par e-mail)."),
    txt("surtitre", "Surtitre", "Espace client"),
    {"type": "inline_richtext", "id": "titre", "label": "Titre", "default": "Votre espace <em>Arte Club</em>."},
    {"type": "textarea", "id": "texte", "label": "Texte",
     "default": "Votre carte de fidélité, vos points, vos rendez-vous et l'historique de vos prestations, réunis au même endroit."},
    txt("bouton_connexion", "Bouton de connexion", "Se connecter"),
    sel("style_connexion", "Style du bouton de connexion", STYLES, "primary"),
    txt("bouton_inscription", "Bouton d'inscription", "Créer un compte", info="Vide = bouton masqué."),
    txt("mention", "Mention sous les boutons", "Connexion par un code envoyé à votre adresse e-mail : aucun mot de passe à retenir."),
    chk("afficher_carte", "Afficher une carte d'exemple", True),
    taille_titre(),
] + communs(fond_image=True, bordures=False), blocks=[
    {"type": "avantage", "name": "Avantage", "settings": [icone("carte"), txt("titre", "Titre", "Votre carte de fidélité"),
                                                           {"type": "textarea", "id": "texte", "label": "Texte"}]},
], max_blocks=6, presets=[{"name": "Mon espace : accès", "blocks": [
    {"type": "avantage", "settings": {"icone": "carte", "titre": "Votre carte de fidélité", "texte": "Des points à chaque prestation et un niveau qui progresse avec vous."}},
    {"type": "avantage", "settings": {"icone": "rendez-vous", "titre": "Vos rendez-vous", "texte": "Demandez un créneau et retrouvez vos rendez-vous à venir."}},
    {"type": "avantage", "settings": {"icone": "historique", "titre": "Votre historique", "texte": "Toutes vos prestations, au même endroit."}},
]}])

# ── Bienvenue ──
section("ec-bienvenue", "Mon espace : bienvenue", [
    sel("salutation_mode", "Salutation", [("fixe", "Toujours la même"), ("heure", "Selon l'heure de la journée")], "fixe"),
    txt("salutation", "Salutation", "Benvenuto,", info="Suivie du prénom du client : « Benvenuto, Matteo. »"),
    txt("salutation_matin", "Salutation le matin (5 h – 12 h)", "Buongiorno,", visible_if="{{ section.settings.salutation_mode == 'heure' }}"),
    txt("salutation_soir", "Salutation le soir (18 h – 5 h)", "Buonasera,", visible_if="{{ section.settings.salutation_mode == 'heure' }}"),
    txt("phrase", "Phrase d'accueil", "Votre véhicule mérite l'excellence."),
    taille_titre(),
    hdr("Informations affichées"),
    chk("afficher_niveau", "Niveau de fidélité", True),
    chk("afficher_points", "Points disponibles", True),
    chk("afficher_rdv", "Prochain rendez-vous", True),
    chk("afficher_message", "Message personnel du client", True,
        info="Texte saisi dans le métachamp arte.message de la fiche client (ex. « Votre bonus anniversaire est disponible »)."),
    hdr("Notification pour tous les clients"),
    txt("notification", "Texte", info="Vide = aucune notification. Ex. : « Fermeture exceptionnelle le 1er novembre »."),
    {"type": "url", "id": "notification_lien", "label": "Lien (facultatif)"},
    txt("notification_lien_texte", "Texte du lien", "En savoir plus"),
    hdr("Boutons"),
    txt("bouton_1", "Bouton principal", "Prendre rendez-vous"),
    cible("cible_1", "Cible du bouton principal", "#reserver"),
    sel("style_1", "Style du bouton principal", STYLES, "primary"),
    txt("bouton_2", "Bouton secondaire", "Ma carte de fidélité"),
    cible("cible_2", "Cible du bouton secondaire", "#fidelite"),
    sel("style_2", "Style du bouton secondaire", STYLES, "secondary"),
] + communs(fond_image=True, bordures=False))

# ── Navigation ──
section("ec-navigation", "Mon espace : navigation", [
    para("Chaque rubrique pointe vers une section de la page (ancre, ex. #fidelite) ou vers une autre page."),
    txt("titre", "Titre", "Mon espace"),
    sel("style_ordinateur", "Sur ordinateur", [("laterale", "Colonne latérale"), ("onglets", "Onglets sous l'en-tête")], "laterale"),
    rng("largeur_laterale", "Largeur de la colonne latérale", 200, 320, 4, 248, "px", visible_if="{{ section.settings.style_ordinateur == 'laterale' }}"),
    sel("style_mobile", "Sur mobile et tablette", [("barre", "Barre d'onglets en bas de l'écran"), ("onglets", "Onglets défilants sous l'en-tête")], "barre",
        info="Barre en bas : seules les rubriques cochées « Dans la barre mobile » y figurent (4 ou 5 conseillées)."),
    chk("afficher_icones", "Afficher les icônes", True),
] + communs(fond_image=False, largeur=False, espacement=False, bordures=False), blocks=[
    {"type": "rubrique", "name": "Rubrique", "settings": [
        txt("libelle", "Libellé", "Rubrique"),
        txt("libelle_mobile", "Libellé court (barre mobile)", info="Vide = libellé complet. Un mot conseillé : Aperçu, Carte, Réserver…"), icone("tableau"),
        cible("cible", "Cible", "#apercu"),
        chk("mobile", "Dans la barre mobile", False)]},
], max_blocks=10, presets=[{"name": "Mon espace : navigation", "blocks": [
    {"type": "rubrique", "settings": {"libelle": "Vue d'ensemble", "libelle_mobile": "Aperçu", "icone": "tableau", "cible": "#apercu", "mobile": True}},
    {"type": "rubrique", "settings": {"libelle": "Ma fidélité", "libelle_mobile": "Carte", "icone": "carte", "cible": "#fidelite", "mobile": True}},
    {"type": "rubrique", "settings": {"libelle": "Prendre rendez-vous", "libelle_mobile": "Réserver", "icone": "rendez-vous", "cible": "#reserver", "mobile": True}},
    {"type": "rubrique", "settings": {"libelle": "Mes rendez-vous", "icone": "horaires", "cible": "#rendez-vous", "mobile": False}},
    {"type": "rubrique", "settings": {"libelle": "Mes prestations", "icone": "historique", "cible": "#prestations", "mobile": False}},
    {"type": "rubrique", "settings": {"libelle": "Mes récompenses", "icone": "cadeau", "cible": "#recompenses", "mobile": False}},
    {"type": "rubrique", "settings": {"libelle": "Mon profil", "libelle_mobile": "Profil", "icone": "profil", "cible": "#profil", "mobile": True}},
    {"type": "rubrique", "settings": {"libelle": "Paramètres", "icone": "reglages", "cible": "#parametres", "mobile": False}},
]}], **{"class": "section-ec section-ec-nav"})

# ── Vue d'ensemble ──
DONNEES = [("points", "Points disponibles"), ("niveau", "Niveau de fidélité"), ("progression", "Progression vers le niveau suivant"),
           ("rdv", "Prochain rendez-vous"), ("prestations", "Prestations réalisées"), ("carte", "Carte de fidélité"),
           ("libre", "Texte libre (avantage, information…)")]
section("ec-apercu", "Mon espace : synthèse", [
    ancre("apercu"),
] + tete("Vue d'ensemble", "En un coup d'<em>œil</em>.") + [
    rng("colonnes", "Colonnes sur ordinateur", 2, 4, 1, 3),
    rng("colonnes_m", "Colonnes sur mobile", 1, 2, 1, 1),
] + communs(**COMMUNS), blocks=[
    {"type": "tuile", "name": "Carte de synthèse", "settings": [
        sel("donnee", "Information affichée", DONNEES, "points"),
        txt("titre", "Titre", "Mes points"), icone("etoile"),
        {"type": "textarea", "id": "texte", "label": "Description (facultative)"},
        txt("vide", "Texte s'il n'y a pas encore de donnée", info="Ex. : « Aucun rendez-vous prévu »."),
        txt("lien_texte", "Texte du lien"), cible("cible", "Cible du lien", None),
        sel("apparence", "Apparence", [("contour", "Contour"), ("plein", "Fond de surface"), ("accent", "Vert de marque")], "contour")]},
], max_blocks=9, presets=[{"name": "Mon espace : synthèse", "blocks": [
    {"type": "tuile", "settings": {"donnee": "points", "titre": "Mes points", "icone": "etoile", "texte": "Disponibles sur votre carte.", "lien_texte": "Voir l'historique", "cible": "#historique", "apparence": "contour"}},
    {"type": "tuile", "settings": {"donnee": "progression", "titre": "Prochain niveau", "icone": "niveau", "vide": "Vous avez atteint le niveau le plus élevé.", "lien_texte": "Les avantages par niveau", "cible": "/pages/fidelite", "apparence": "contour"}},
    {"type": "tuile", "settings": {"donnee": "rdv", "titre": "Prochain rendez-vous", "icone": "rendez-vous", "vide": "Aucun rendez-vous prévu pour le moment.", "lien_texte": "Prendre rendez-vous", "cible": "#reserver", "apparence": "plein"}},
    {"type": "tuile", "settings": {"donnee": "prestations", "titre": "Mes prestations", "icone": "historique", "vide": "Votre première prestation apparaîtra ici.", "lien_texte": "Voir l'historique", "cible": "#prestations", "apparence": "contour"}},
    {"type": "tuile", "settings": {"donnee": "carte", "titre": "Ma carte de fidélité", "icone": "carte", "texte": "À présenter lors de chaque visite à l'atelier.", "lien_texte": "Afficher ma carte", "cible": "#fidelite", "apparence": "accent"}},
    {"type": "tuile", "settings": {"donnee": "libre", "titre": "Mes avantages", "icone": "cadeau", "texte": "Échangez vos points contre des avantages réservés aux membres.", "lien_texte": "Voir les récompenses", "cible": "#recompenses", "apparence": "contour"}},
]}])

# ── Carte de fidélité ──
SI_PERSO = "{{ section.settings.fond == 'perso' }}"
SI_IMAGE = "{{ section.settings.fond == 'image' }}"
SI_PERSO_IMAGE = "{{ section.settings.fond != 'niveau' }}"
section("ec-carte", "Mon espace : carte", [
    ancre("fidelite"),
] + tete("Ma fidélité", "Votre carte <em>Arte Club</em>.") + [
    hdr("Apparence de la carte"),
    sel("format", "Format", [("horizontal", "Horizontal (carte bancaire)"), ("vertical", "Vertical (carte de portefeuille)")], "horizontal"),
    sel("fond", "Fond", [("niveau", "Couleur du niveau du client"), ("perso", "Couleur ou dégradé personnalisé"), ("image", "Image")], "niveau",
        info="Couleurs des niveaux : Réglages du thème › Programme de fidélité."),
    {"type": "color_background", "id": "degrade", "label": "Dégradé", "default": "linear-gradient(135deg, #1F3D35 0%, #0D0F0E 100%)", "visible_if": SI_PERSO},
    {"type": "image_picker", "id": "image", "label": "Image de fond", "visible_if": SI_IMAGE},
    {"type": "color", "id": "carte_texte", "label": "Couleur du texte de la carte", "default": "#EEEDE7", "visible_if": SI_PERSO_IMAGE},
    sel("motif", "Motif", [("aucun", "Aucun"), ("linea", "Linea (filet de lumière)"), ("monogramme", "Monogramme en filigrane"), ("linea_monogramme", "Linea et monogramme")], "linea_monogramme"),
    chk("reflet", "Reflet lumineux au survol", True),
    rng("rayon", "Arrondi des angles", 0, 32, 2, 18, "px"),
    sel("ombre", "Relief", [("aucune", "Aucun"), ("douce", "Ombre douce"), ("profonde", "Ombre profonde"), ("filet", "Filet fin")], "douce"),
    sel("police_points", "Police du solde", [("mono", "Chiffres (DM Mono)"), ("serif", "Titres (Bodoni)"), ("sans", "Texte (Archivo)")], "mono"),
    hdr("Logo"),
    sel("logo", "Logo", [("monogramme", "Monogramme"), ("principal", "Logo horizontal"), ("vertical", "Logo vertical"), ("televerse", "Logo téléversé (Identité visuelle)"), ("aucun", "Aucun")], "monogramme"),
    rng("logo_taille", "Taille du logo", 50, 160, 5, 100, "%"),
    sel("logo_position", "Position du logo", [("gauche", "À gauche"), ("droite", "À droite")], "gauche"),
    hdr("Informations sur la carte"),
    chk("afficher_programme", "Nom du programme", True), chk("afficher_niveau", "Niveau", True),
    chk("afficher_points", "Solde de points", True), chk("afficher_nom", "Nom du client", True),
    chk("afficher_id", "Numéro de carte", True),
    hdr("À côté de la carte"),
    chk("afficher_details", "Niveau et progression", True),
    txt("message_progression", "Message de progression", "Encore [reste] avant le niveau [niveau].", info="[reste] et [niveau] sont remplacés automatiquement."),
    txt("message_max", "Message au niveau le plus élevé", "Vous avez atteint le niveau le plus élevé. Merci de votre fidélité."),
    hdr("QR code"),
    sel("qr", "QR code", [("bouton", "Bouton « Présenter ma carte » (QR en grand)"), ("carte", "Sur la carte"), ("aucun", "Aucun")], "bouton",
        info="Le code ouvre la fiche du client dans votre administration Shopify : seul un membre de l'équipe connecté peut le lire."),
    txt("bouton_presenter", "Texte du bouton", "Présenter ma carte"),
    txt("qr_texte", "Texte d'aide", "Présentez ce code à l'atelier : nous retrouvons votre fiche et vos points en un instant."),
] + communs(**COMMUNS))

# ── Historique des points ──
section("ec-historique-points", "Mon espace : points", [
    ancre("historique"),
] + tete("Ma fidélité", "Historique des <em>points</em>.") + [
    rng("nombre", "Opérations affichées avant « Voir tout »", 3, 30, 1, 6),
    chk("afficher_solde", "Afficher le solde après chaque opération", True),
    txt("libelle_tout", "Texte du lien « Voir tout »", "Voir tout l'historique"),
    txt("vide", "Texte s'il n'y a aucune opération", "Aucune opération pour le moment : vos points apparaîtront ici après votre première prestation."),
    para("Les opérations viennent du métachamp arte.historique_points de la fiche client (une ligne par opération : date | libellé | points | solde)."),
] + communs(**COMMUNS))

# ── Demande de rendez-vous ──
section("ec-reservation", "Mon espace : réservation", [
    ancre("reserver"),
    txt("surtitre", "Surtitre", "Rendez-vous"),
    {"type": "inline_richtext", "id": "titre", "label": "Titre", "default": "Demander un <em>rendez-vous</em>."},
    {"type": "richtext", "id": "introduction", "label": "Introduction",
     "default": "<p>Choisissez votre prestation et vos disponibilités : nous vous confirmons le créneau par e-mail ou par téléphone.</p>"},
    txt("note", "Note", "Il s'agit d'une demande : votre rendez-vous est confirmé par notre équipe."),
    {"type": "richtext", "id": "conditions", "label": "Conditions",
     "default": "<p>Paiement sur place. Modification ou annulation gratuite jusqu'à 24 heures avant le rendez-vous.</p>"},
    sel("disposition", "Disposition", [("cote", "Texte à gauche, formulaire à droite"), ("seul", "Texte au-dessus du formulaire")], "cote"),
    hdr("Prestations"),
    para("Noms, prix et durées : Réglages du thème › Prestations et tarifs."),
    chk("afficher_prix", "Afficher les prix", True), chk("afficher_duree", "Afficher les durées", True),
    chk("afficher_pro", "Proposer la prestation professionnelle (sur devis)", True),
    hdr("Champs du formulaire"),
    chk("champ_date", "Date souhaitée (obligatoire)", True), chk("champ_date2", "Autre date possible", True),
    chk("champ_moment", "Moment de la journée", True),
    {"type": "textarea", "id": "moments", "label": "Moments proposés (un par ligne)", "default": "Matin\nAprès-midi\nIndifférent"},
    chk("champ_telephone", "Téléphone", True),
    chk("champ_vehicule", "Véhicule (véhicules enregistrés, marque et modèle)", True),
    chk("champ_type", "Type de véhicule", True),
    {"type": "textarea", "id": "types", "label": "Types proposés (un par ligne)", "default": "Citadine\nBerline\nBreak\nSUV\nCoupé ou cabriolet\nUtilitaire"},
    chk("champ_plaque", "Immatriculation", False), chk("champ_message", "Demandes particulières", True),
    chk("consentement", "Case d'accord (recommandée)", True),
    txt("texte_consentement", "Texte de la case d'accord", "J'accepte les conditions de rendez-vous et l'utilisation de ces informations pour organiser ma prestation."),
    hdr("Envoi"),
    txt("bouton", "Texte du bouton", "Envoyer ma demande"), sel("style_bouton", "Style du bouton", STYLES, "primary"),
    txt("confirmation_titre", "Titre de confirmation", "Demande envoyée."),
    txt("confirmation_texte", "Texte de confirmation", "Merci. Nous revenons vers vous rapidement pour confirmer votre rendez-vous."),
] + communs(**COMMUNS))

# ── Mes rendez-vous ──
section("ec-rendez-vous", "Mon espace : rendez-vous", [
    ancre("rendez-vous"),
] + tete("Rendez-vous", "Mes <em>rendez-vous</em>.") + [
    para("Les rendez-vous viennent du métachamp arte.rendez_vous de la fiche client (une ligne par rendez-vous : AAAA-MM-JJ HH:MM | prestation | statut | véhicule)."),
    txt("vide", "Texte s'il n'y a aucun rendez-vous à venir", "Aucun rendez-vous à venir."),
    txt("bouton_vide", "Bouton", "Prendre rendez-vous"),
    cible("cible_vide", "Cible du bouton", "#reserver"),
    chk("afficher_passes", "Afficher les rendez-vous passés", True),
    txt("titre_passes", "Titre des rendez-vous passés", "Rendez-vous passés"),
    rng("nombre_passes", "Rendez-vous passés affichés", 1, 10, 1, 3),
    txt("aide", "Aide à la modification", "Pour modifier ou annuler un rendez-vous, contactez-nous au moins 24 heures à l'avance."),
    chk("afficher_contacts", "Afficher téléphone, WhatsApp et e-mail", True, info="Coordonnées : Réglages du thème."),
] + communs(**COMMUNS))

# ── Mes prestations ──
section("ec-prestations", "Mon espace : prestations", [
    ancre("prestations"),
] + tete("Historique", "Mes <em>prestations</em>.") + [
    para("Liste des commandes du client. Après chaque prestation payée sur place, créez une commande dans Commandes › Créer une commande."),
    rng("par_page", "Prestations par page", 3, 24, 1, 8),
    chk("afficher_montant", "Montant", True), chk("afficher_statut", "Statut du paiement", True),
    chk("afficher_detail", "Lien vers le détail de la commande", True),
    txt("bouton_reserver", "Bouton « Réserver à nouveau »", "Réserver à nouveau", info="Vide = bouton masqué. Présélectionne la même prestation."),
    cible("cible_reserver", "Cible du bouton", "#reserver"),
    txt("vide", "Texte s'il n'y a aucune prestation", "Vos prestations apparaîtront ici après votre premier passage à l'atelier."),
] + communs(**COMMUNS))

# ── Récompenses ──
section("ec-recompenses", "Récompenses de fidélité", [
    ancre("recompenses"),
] + tete("Récompenses", "Vos <em>avantages</em>.") + [
    rng("colonnes", "Colonnes sur ordinateur", 2, 4, 1, 3),
    chk("afficher_etat", "Indiquer au client connecté si la récompense est disponible", True),
    txt("libelle_disponible", "Libellé « disponible »", "Disponible"),
    txt("message_manque", "Message s'il manque des points", "Encore [reste] [points]", info="[reste] et [points] sont remplacés automatiquement."),
    txt("mention", "Mention", "Pour utiliser une récompense, présentez votre carte lors de votre prochaine visite : nous déduisons les points de votre solde."),
    para("Les paliers proposés (100, 250 et 500 points) sont des exemples à adapter. Les points sont déduits par vos soins dans la fiche client."),
] + communs(**COMMUNS), blocks=[
    {"type": "recompense", "name": "Récompense", "settings": [
        {"type": "number", "id": "points", "label": "Points nécessaires", "default": 100},
        txt("titre", "Titre", "Avantage fidélité"),
        {"type": "textarea", "id": "texte", "label": "Description"},
        txt("condition", "Condition (facultative)", info="Ex. : « Valable sur rendez-vous, non cumulable »."),
        icone("cadeau")]},
], max_blocks=12, presets=[{"name": "Récompenses de fidélité", "blocks": [
    {"type": "recompense", "settings": {"points": 100, "titre": "Avantage fidélité", "texte": "Désodorisation de l'habitacle offerte lors de votre prochaine prestation.", "icone": "cadeau"}},
    {"type": "recompense", "settings": {"points": 250, "titre": "Réduction sur une prestation", "texte": "15 € de réduction sur la prestation de votre choix.", "icone": "etoile"}},
    {"type": "recompense", "settings": {"points": 500, "titre": "Avantage premium", "texte": "Un lavage intérieur offert.", "condition": "Sur rendez-vous.", "icone": "eclat"}},
]}])

# ── Profil et paramètres ──
section("ec-profil", "Mon espace : profil", [
    ancre("profil"),
] + tete("Mon profil", "Profil et <em>paramètres</em>.") + [
    rng("colonnes", "Colonnes sur ordinateur", 1, 3, 1, 2),
    para("Les informations personnelles, adresses et préférences se modifient dans les pages de compte sécurisées de Shopify."),
] + communs(**COMMUNS), blocks=[
    {"type": "infos", "name": "Mes informations", "limit": 1, "settings": [
        txt("titre", "Titre", "Mes informations"), txt("bouton", "Lien", "Modifier mes informations"), txt("ancre", "Ancre (facultative)")]},
    {"type": "communication", "name": "Communications", "limit": 1, "settings": [
        txt("titre", "Titre", "Communications"),
        txt("texte_oui", "Texte si le client est abonné", "Vous recevez nos nouvelles et offres réservées aux membres par e-mail."),
        txt("texte_non", "Texte si le client n'est pas abonné", "Vous ne recevez pas nos e-mails d'information."),
        txt("bouton", "Lien", "Gérer mes préférences"), txt("ancre", "Ancre", "parametres")]},
    {"type": "garage", "name": "Mon garage", "limit": 1, "settings": [
        txt("titre", "Titre", "Mon garage"),
        txt("vide", "Texte sans véhicule", "Aucun véhicule enregistré pour le moment."),
        {"type": "textarea", "id": "texte", "label": "Texte", "default": "Un nouveau véhicule ? Indiquez-le dans votre prochaine demande de rendez-vous : nous l'ajoutons à votre garage."},
        txt("ancre", "Ancre (facultative)", "garage")]},
    {"type": "compte", "name": "Mon compte Shopify", "limit": 1, "settings": [
        txt("titre", "Titre", "Mon compte"), txt("lien_commandes", "Lien commandes", "Mes commandes"),
        txt("lien_adresses", "Lien adresses", "Mes adresses"), txt("lien_profil", "Lien profil", "Mon profil"),
        txt("ancre", "Ancre (facultative)")]},
    {"type": "lien", "name": "Lien personnalisé", "settings": [
        icone("devis"), txt("titre", "Titre", "Besoin d'aide ?"),
        {"type": "textarea", "id": "texte", "label": "Texte"}, txt("bouton", "Texte du lien", "Nous contacter"),
        {"type": "url", "id": "lien", "label": "Lien"}, txt("ancre", "Ancre (facultative)")]},
    {"type": "deconnexion", "name": "Déconnexion", "limit": 1, "settings": [
        txt("titre", "Titre", "Déconnexion"), {"type": "textarea", "id": "texte", "label": "Texte"},
        txt("bouton", "Lien", "Se déconnecter"), txt("ancre", "Ancre (facultative)")]},
], max_blocks=8, presets=[{"name": "Mon espace : profil", "blocks": [
    {"type": "infos"}, {"type": "communication"}, {"type": "garage"}, {"type": "compte"}, {"type": "deconnexion"},
]}])

# ── Niveaux (page du programme) ──
section("fid-niveaux", "Programme : niveaux", [
    ancre("niveaux"),
] + tete("Niveaux", "Quatre niveaux, une même <em>exigence</em>.",
         "Votre niveau évolue avec vos visites et vous ouvre des attentions réservées aux membres.") + [
    para("Noms, seuils et couleurs des niveaux : Réglages du thème › Programme de fidélité."),
    txt("libelle_seuil_1", "Seuil du premier niveau", "Dès la création de votre compte"),
    txt("modele_seuil", "Seuil des niveaux suivants", "Dès [seuil] [unite]", info="[seuil] et [unite] sont remplacés automatiquement."),
    chk("afficher_actuel", "Signaler son niveau au client connecté", True),
    txt("libelle_actuel", "Libellé", "Votre niveau"),
] + communs(**COMMUNS), blocks=[
    {"type": "avantage", "name": "Avantage", "settings": [
        sel("niveau", "Niveau", [("1", "Niveau 1"), ("2", "Niveau 2"), ("3", "Niveau 3"), ("4", "Niveau 4")], "1"),
        txt("texte", "Avantage", "Carte de fidélité digitale"), icone("coche")]},
], max_blocks=24, presets=[{"name": "Programme : niveaux", "blocks": [
    {"type": "avantage", "settings": {"niveau": "1", "texte": "Carte de fidélité digitale"}},
    {"type": "avantage", "settings": {"niveau": "1", "texte": "Points sur chaque prestation"}},
    {"type": "avantage", "settings": {"niveau": "2", "texte": "Tous les avantages Bianco"}},
    {"type": "avantage", "settings": {"niveau": "2", "texte": "Bonus de points à chaque visite"}},
    {"type": "avantage", "settings": {"niveau": "3", "texte": "Tous les avantages Argento"}},
    {"type": "avantage", "settings": {"niveau": "3", "texte": "Créneaux prioritaires"}},
    {"type": "avantage", "settings": {"niveau": "4", "texte": "Tous les avantages Verde"}},
    {"type": "avantage", "settings": {"niveau": "4", "texte": "Attention personnalisée à chaque visite"}},
]}])


def preset_en_section(nom, sid, **reglages):
    """Section de modèle JSON construite depuis le preset (blocs compris)."""
    p = SECTIONS[nom]["presets"][0]
    sec = {"type": nom, "settings": dict(p.get("settings", {}), **reglages)}
    if p.get("blocks"):
        sec["blocks"] = {f"{sid}_{i + 1}": b for i, b in enumerate(p["blocks"])}
        sec["block_order"] = list(sec["blocks"])
    return sec


def modele_espace():
    ordre = [("acces", "ec-acces"), ("navigation", "ec-navigation"), ("bienvenue", "ec-bienvenue"), ("apercu", "ec-apercu"),
             ("carte", "ec-carte"), ("historique", "ec-historique-points"), ("reserver", "ec-reservation"),
             ("rendez_vous", "ec-rendez-vous"), ("prestations", "ec-prestations"), ("recompenses", "ec-recompenses"),
             ("profil", "ec-profil")]
    return {"sections": {sid: preset_en_section(nom, sid) for sid, nom in ordre}, "order": [sid for sid, _ in ordre]}


def modele_fidelite():
    secs = {
        "banniere": {"type": "hero", "settings": {
            "titre": "Le programme <em>Arte Club</em>.",
            "texte": "Des points à chaque prestation, des avantages réservés aux membres.",
            "bouton_1": "Rejoindre le club", "lien_1": "/pages/espace-client", "bouton_2": "", "hauteur": "moyen", "afficher_lame": False}},
        "etapes": {"type": "etapes", "settings": {"surtitre": "Comment ça marche", "titre": "Trois étapes, sans <em>application</em>."},
                   "blocks": {
                       "e1": {"type": "etape", "settings": {"titre": "Créez votre compte", "texte": "En quelques secondes, avec votre adresse e-mail.", "icone": "devis"}},
                       "e2": {"type": "etape", "settings": {"titre": "Profitez de vos prestations", "texte": "Chaque prestation vous rapporte des points, ajoutés à votre carte.", "icone": "etoile"}},
                       "e3": {"type": "etape", "settings": {"titre": "Échangez vos points", "texte": "Présentez votre carte à l'atelier pour profiter de vos récompenses.", "icone": "coche"}}},
                   "block_order": ["e1", "e2", "e3"]},
        "niveaux": preset_en_section("fid-niveaux", "niveaux"),
        "recompenses": preset_en_section("ec-recompenses", "recompenses"),
        "faq": {"type": "faq", "settings": {"surtitre": "Questions fréquentes", "titre": "Le programme en <em>détail</em>."},
                "blocks": {
                    "q1": {"type": "question", "settings": {"question": "Comment gagner des points ?", "reponse": "<p>Après chaque prestation, les points correspondants sont ajoutés à votre carte. Le détail de chaque opération apparaît dans votre espace client.</p>"}},
                    "q2": {"type": "question", "settings": {"question": "Comment utiliser une récompense ?", "reponse": "<p>Présentez votre carte lors de votre prochaine visite : nous déduisons les points de votre solde et appliquons l'avantage.</p>"}},
                    "q3": {"type": "question", "settings": {"question": "Mes points expirent-ils ?", "reponse": "<p>Précisez ici votre politique d'expiration des points.</p>"}},
                    "q4": {"type": "question", "settings": {"question": "Faut-il télécharger une application ?", "reponse": "<p>Non. Votre carte est accessible depuis votre espace client, sur ordinateur comme sur téléphone.</p>"}}},
                "block_order": ["q1", "q2", "q3", "q4"]},
        "bandeau": {"type": "bandeau", "settings": {"titre": "Rejoignez le club.", "bouton": "Accéder à mon espace", "bouton_lien": "/pages/espace-client"}},
    }
    return {"sections": secs, "order": list(secs)}


def tete(corps):
    """Lecture des données et variables communes, limitées à celles que le corps utilise."""
    lignes = ["{%- capture ec -%}{% render 'ec-donnees' %}{%- endcapture -%}", "{%- liquid",
              "  assign d = ec | split: '§§'", "  assign s = section.settings"]
    if re.search(r"\bdemo\b", corps):
        lignes += ["  assign demo = false", "  if d[0] == 'demo'", "    assign demo = true", "  endif"]
    if re.search(r"\bancre\b", corps):
        lignes.append("  assign ancre = s.ancre | default: section.id | handleize")
    if "titre_id" in corps:
        lignes.append("  assign titre_id = 'ec-titre-' | append: section.id")
    return "\n".join(lignes + ["-%}"])


def typo(x):
    if isinstance(x, dict):
        return {k: typo(v) for k, v in x.items()}
    if isinstance(x, list):
        return [typo(v) for v in x]
    if isinstance(x, str) and not x.startswith("{{"):
        return re.sub(r" ([;!?])", "\u202f\\1", re.sub(r" :(?=\s|$)", "\u00a0:", x))
    return x


def generer():
    for nom, sch in SECTIONS.items():
        corps = (ICI / "corps" / f"{nom}.liquid").read_text().rstrip()
        (THEME / "sections" / f"{nom}.liquid").write_text(
            tete(corps) + "\n" + corps + "\n\n{% schema %}\n" + json.dumps(typo(sch), ensure_ascii=False, indent=2) + "\n{% endschema %}\n")
    for f, m in (("page.espace-client.json", modele_espace()), ("page.fidelite.json", modele_fidelite())):
        (THEME / "templates" / f).write_text(json.dumps(typo(m), ensure_ascii=False, indent=2) + "\n")
    print(len(SECTIONS), "sections, 2 modèles")


if __name__ == "__main__":
    generer()
