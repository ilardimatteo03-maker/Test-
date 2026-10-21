"""Réglages du thème (config/settings_schema.json) : ajouts au schéma existant.

Règle : aucun identifiant existant n'est renommé, retiré ni changé de type ; on ajoute des réglages
dont les valeurs par défaut reproduisent exactement le rendu actuel."""


def rng(id, label, mn, mx, step, default, unit=None, info=None, visible_if=None):
    s = {"type": "range", "id": id, "label": label, "min": mn, "max": mx, "step": step, "default": default}
    if unit: s["unit"] = unit
    if info: s["info"] = info
    if visible_if: s["visible_if"] = visible_if
    assert (mx - mn) / step <= 101, id
    assert abs(((default - mn) / step) - round((default - mn) / step)) < 1e-9, id
    return s


def sel(id, label, options, default, info=None, visible_if=None):
    s = {"type": "select", "id": id, "label": label, "options": [{"value": v, "label": l} for v, l in options], "default": default}
    if info: s["info"] = info
    if visible_if: s["visible_if"] = visible_if
    return s


def chk(id, label, default, info=None):
    s = {"type": "checkbox", "id": id, "label": label, "default": default}
    if info: s["info"] = info
    return s


def col(id, label, default=None, info=None):
    s = {"type": "color", "id": id, "label": label}
    if default: s["default"] = default
    if info: s["info"] = info
    return s


def hdr(t): return {"type": "header", "content": t}
def para(t): return {"type": "paragraph", "content": t}


POIDS = [("300", "Léger"), ("400", "Normal"), ("500", "Moyen"), ("600", "Demi-gras"), ("700", "Gras")]
POLICE_UI = [("elargi", "Archivo élargi (marque)"), ("texte", "Police des paragraphes"), ("titres", "Police des titres")]
SI_TITRES_SHOPIFY = "{{ settings.police_titres_source == 'shopify' }}"
SI_TEXTE_SHOPIFY = "{{ settings.police_texte_source == 'shopify' }}"

IDENTITE_AJOUTS = [
    hdr("Logos"),
    para("Sans logo téléversé, le thème utilise le logo vectoriel Arte Automobili fourni."),
    {"type": "image_picker", "id": "logo", "label": "Logo principal (pour fonds sombres)"},
    {"type": "image_picker", "id": "logo_sombre", "label": "Logo pour fonds clairs", "info": "Utilisé quand l'en-tête a un fond clair."},
    {"type": "image_picker", "id": "logo_mobile", "label": "Logo sur mobile (facultatif)"},
    {"type": "image_picker", "id": "logo_secondaire", "label": "Logo secondaire (pied de page)", "info": "Sans image, le logo vertical fourni."},
    rng("logo_largeur_d", "Largeur du logo sur ordinateur", 77, 277, 2, 127, "px"),
]

COULEURS_LIBELLES = {
    "color_nero": "Fond général — Nero Vite",
    "color_bianco": "Texte principal — Bianco Sangiovanni",
    "color_verde": "Couleur d'accentuation — Verde Verona",
    "color_verdaccio": "Fond des surfaces et cartes — Verdaccio",
    "color_argento": "Texte secondaire — Argento",
}
COULEURS_AJOUTS = [
    col("color_travertino", "Couleur secondaire claire — Travertino", "#D6D3CA", "Mentions, fonds clairs."),
    hdr("Liens et filets"),
    col("couleur_liens", "Liens", "#EEEDE7"),
    col("couleur_survol", "Liens et menus au survol", "#EEEDE7"),
    col("couleur_bordures", "Bordures et filets", "#8E9592"),
    hdr("Boutons"),
    col("btn1_fond", "Bouton principal — fond", "#EEEDE7"),
    col("btn1_texte", "Bouton principal — texte", "#0D0F0E"),
    col("btn1_bordure", "Bouton principal — bordure", "#EEEDE7"),
    col("btn2_texte", "Bouton secondaire — texte", "#EEEDE7"),
    col("btn2_bordure", "Bouton secondaire — bordure", "#EEEDE7"),
    para("Sur les sections claires (palettes Bianco ou Travertino), les couleurs des boutons et des textes s'inversent automatiquement."),
]

TYPOGRAPHIES = {"name": "Typographies", "settings": [
    hdr("Polices"),
    para("« Polices de la marque » : Bodoni Moda, Archivo et DM Mono, hébergées avec le thème. Choisissez « Bibliothèque Shopify » pour utiliser une autre police."),
    sel("police_titres_source", "Police des titres", [("marque", "Bodoni Moda (marque)"), ("shopify", "Bibliothèque Shopify")], "marque"),
    {"type": "font_picker", "id": "police_titres", "label": "Police des titres (bibliothèque Shopify)", "default": "assistant_n4", "visible_if": SI_TITRES_SHOPIFY},
    sel("police_texte_source", "Police des paragraphes", [("marque", "Archivo (marque)"), ("shopify", "Bibliothèque Shopify")], "marque"),
    {"type": "font_picker", "id": "police_texte", "label": "Police des paragraphes (bibliothèque Shopify)", "default": "assistant_n4", "visible_if": SI_TEXTE_SHOPIFY},
    sel("police_boutons", "Police des boutons", POLICE_UI, "elargi"),
    sel("police_menus", "Police des menus", POLICE_UI, "elargi"),
    sel("police_chiffres", "Police des prix et chiffres", [("mono", "DM Mono (marque)"), ("texte", "Police des paragraphes")], "mono"),
    hdr("Titres"),
    sel("titres_poids", "Graisse des titres", POIDS[1:], "400"),
    rng("titres_interlignage", "Interlignage des titres", 80, 140, 2, 100, "%"),
    rng("titres_espacement", "Espacement des lettres des titres", -5, 10, 0.5, -0.5, "%", "En pourcentage de la taille du texte."),
    chk("titres_majuscules", "Titres en majuscules", False),
    {"type": "text_alignment", "id": "titres_alignement", "label": "Alignement des en-têtes de section", "default": "left"},
    hdr("Taille des titres sur ordinateur"),
    para("Les tailles sur mobile se règlent dans « Mobile et tablette »."),
    rng("h1_d", "Titre 1 (H1)", 40, 160, 2, 104, "px"),
    rng("h2_d", "Titre 2 (H2)", 24, 100, 2, 58, "px"),
    rng("h3_d", "Titre 3 (H3)", 16, 60, 1, 30, "px"),
    rng("h4_d", "Titre 4 (H4)", 14, 44, 1, 24, "px"),
    rng("h5_d", "Titre 5 (H5)", 12, 32, 1, 19, "px"),
    rng("h6_d", "Titre 6 (H6)", 11, 26, 1, 15, "px"),
    hdr("Paragraphes"),
    rng("texte_taille_d", "Taille des paragraphes", 14, 22, 1, 17, "px"),
    sel("texte_poids", "Graisse des paragraphes", POIDS[:3], "400"),
    rng("texte_interlignage", "Interlignage des paragraphes", 120, 200, 5, 160, "%"),
]}

MISE_EN_PAGE = {"name": "Mise en page", "settings": [
    rng("largeur_max", "Largeur maximale du contenu", 960, 1920, 20, 1440, "px"),
    rng("marge_d", "Marges latérales", 16, 120, 4, 72, "px"),
    rng("espacement_d", "Espacement vertical entre les sections", 40, 240, 8, 160, "px"),
    sel("densite", "Densité de la mise en page", [("compacte", "Compacte"), ("standard", "Standard"), ("aeree", "Aérée")], "standard",
        "Agit sur tous les espacements verticaux."),
    hdr("Formes"),
    rng("rayon", "Arrondi des images, cartes et encadrés", 0, 24, 1, 0, "px", "0 = angles vifs, signature de la marque."),
    rng("bordure_ep", "Épaisseur des bordures et filets", 1, 3, 1, 1, "px"),
    rng("gouttiere_d", "Espacement entre les cartes", 8, 64, 2, 28, "px"),
]}

BOUTONS = {"name": "Boutons", "settings": [
    sel("btn_style_defaut", "Style par défaut des nouveaux boutons", [("primary", "Plein"), ("secondary", "Contour"), ("minimal", "Minimaliste"), ("fleche", "Texte avec flèche"), ("premium", "Premium automobile")], "primary"),
    rng("btn_rayon", "Arrondi des boutons", 0, 40, 1, 0, "px"),
    rng("btn_hauteur", "Hauteur", 36, 64, 1, 50, "px"),
    rng("btn_padding", "Espacement intérieur horizontal", 12, 48, 1, 26, "px"),
    rng("btn_taille", "Taille du texte", 10, 18, 0.5, 12.5, "px"),
    sel("btn_poids", "Graisse du texte", POIDS[1:], "600"),
    rng("btn_espacement", "Espacement des lettres", 0, 30, 1, 18, "%"),
    chk("btn_majuscules", "Texte en majuscules", True),
    sel("btn_survol", "Effet au survol", [("inverser", "Inversion plein / contour"), ("attenuer", "Léger fondu"), ("lame", "Lame de lumière"), ("aucun", "Aucun")], "inverser"),
]}

ANIMATIONS = {"name": "Animations", "settings": [
    chk("anim_actives", "Activer les animations", True, "Toujours désactivées pour les visiteurs qui ont demandé à réduire les animations."),
    sel("anim_apparition", "Apparition des éléments au défilement", [("aucune", "Aucune"), ("fondu", "Fondu"), ("montee", "Fondu et montée"), ("zoom", "Fondu et léger zoom")], "montee"),
    sel("anim_vitesse", "Vitesse", [("lente", "Lente"), ("normale", "Normale"), ("rapide", "Rapide")], "normale"),
    sel("anim_images", "Images au survol", [("zoom", "Léger zoom"), ("aucun", "Aucun effet")], "zoom"),
    chk("anim_lame", "Lame de lumière sur les images au survol", True),
]}

MOBILE = {"name": "Mobile et tablette", "settings": [
    para("Réglages appliqués aux écrans de moins de 760 px de large. Les tablettes reçoivent des valeurs intermédiaires calculées automatiquement."),
    hdr("Mise en page"),
    rng("marge_m", "Marges latérales", 12, 40, 2, 20, "px"),
    rng("espacement_m", "Espacement vertical entre les sections", 24, 160, 8, 88, "px"),
    rng("gouttiere_m", "Espacement entre les cartes", 8, 40, 2, 16, "px"),
    rng("logo_largeur_m", "Largeur du logo", 50, 200, 2, 102, "px"),
    hdr("Taille des titres"),
    rng("h1_m", "Titre 1 (H1)", 28, 80, 2, 46, "px"),
    rng("h2_m", "Titre 2 (H2)", 20, 60, 2, 32, "px"),
    rng("h3_m", "Titre 3 (H3)", 15, 40, 1, 22, "px"),
    rng("h4_m", "Titre 4 (H4)", 13, 32, 1, 20, "px"),
    rng("h5_m", "Titre 5 (H5)", 12, 26, 1, 17, "px"),
    rng("h6_m", "Titre 6 (H6)", 11, 22, 1, 14, "px"),
    rng("texte_taille_m", "Taille des paragraphes", 14, 20, 1, 17, "px"),
    hdr("Animations"),
    chk("anim_mobile", "Animations sur mobile", True),
]}

RESEAUX_AJOUTS = [{"type": "url", "id": "youtube", "label": "YouTube"}, {"type": "url", "id": "whatsapp", "label": "WhatsApp (lien wa.me)"}]


def prestation_ajouts(i):
    return [
        sel(f"p{i}_prix_mode", "Affichage du prix", [("afficher", "Afficher le prix"), ("devis", "Remplacer par « Sur devis »"), ("masquer", "Masquer le prix")], "afficher"),
        {"type": "text", "id": f"p{i}_duree", "label": "Durée indicative (facultative)", "info": "Ex. « Environ 2 h ». Vide = non affichée."},
        {"type": "textarea", "id": f"p{i}_inclus", "label": "Prestations incluses (facultatif)", "info": "Une ligne par élément. Vide = non affiché."},
        chk(f"p{i}_visible", "Afficher sur la page Services", True),
    ]


AIDE = {"name": "Aide : pages et sections", "settings": [
    para("Pour ajouter une section : ouvrez une page dans l'éditeur, puis « Ajouter une section ». Chaque section peut être masquée (icône œil), dupliquée, déplacée ou supprimée."),
    para("Modèles de page fournis : « services », « presentation », « contact », « histoire » (présentation complète) et « lancement » (page Coming Soon sans en-tête). Attribuez-les depuis Boutique en ligne › Pages."),
    para("Page Coming Soon de toute la boutique : activez la protection par mot de passe (Boutique en ligne › Préférences). La page mot de passe utilise alors la section « Page de lancement » : mise en scène « Sobre » (page actuelle) ou « Cinématographique » (plein écran)."),
]}


def patch(schema):
    groupes = {g["name"]: g for g in schema}
    ids = {s.get("id") for g in schema for s in g.get("settings", []) if s.get("id")}

    def ajouter(groupe, reglages, apres=None):
        nouveaux = [s for s in reglages if s.get("id") not in ids or s["type"] in ("header", "paragraph")]
        if not [s for s in nouveaux if s.get("id")]:
            return  # déjà appliqué
        lst = groupe["settings"]
        pos = len(lst) if apres is None else next(i for i, s in enumerate(lst) if s.get("id") == apres) + 1
        lst[pos:pos] = nouveaux
        ids.update(s.get("id") for s in nouveaux if s.get("id"))

    ident = groupes.get("Identité") or groupes["Identité visuelle"]
    ident["name"] = "Identité visuelle"
    ajouter(ident, IDENTITE_AJOUTS)
    coul = groupes["Couleurs"]
    for s in coul["settings"]:
        if s.get("id") in COULEURS_LIBELLES:
            s["label"] = COULEURS_LIBELLES[s["id"]]
    ajouter(coul, COULEURS_AJOUTS)
    ajouter(groupes["Réseaux sociaux"], RESEAUX_AJOUTS)
    presta = groupes["Prestations et tarifs"]
    for i in range(1, 5):
        ajouter(presta, prestation_ajouts(i), apres=f"p{i}_accueil")
    noms = [g["name"] for g in schema]
    for g in (TYPOGRAPHIES, MISE_EN_PAGE, BOUTONS, ANIMATIONS, MOBILE, AIDE):
        if g["name"] not in noms:
            schema.append(g)
    # ordre des groupes dans l'éditeur
    ordre = ["theme_info", "Identité visuelle", "Couleurs", "Typographies", "Mise en page", "Boutons", "Animations",
             "Mobile et tablette", "Coordonnées", "Réseaux sociaux", "Prestations et tarifs", "Aide : pages et sections"]
    schema.sort(key=lambda g: ordre.index(g["name"]) if g["name"] in ordre else 99)
    schema[0]["theme_name"] = "Arte Automobili — Vitrine"
    schema[0]["theme_version"] = "2.0.0"
    return schema
