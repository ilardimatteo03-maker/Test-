"""Réglages communs des sections et définitions de blocs réutilisables (schémas Shopify)."""
import json
import re

PALETTES = [("defaut", "Fond général du site"), ("nero", "Nero (sombre)"), ("verdaccio", "Verdaccio (gris profond)"),
            ("verde", "Verde (vert de marque)"), ("bianco", "Bianco (clair)"), ("travertino", "Travertino (clair chaud)"),
            ("perso", "Personnalisées")]
STYLES_BOUTON = [("defaut", "Style par défaut du thème"), ("primary", "Plein"), ("secondary", "Contour"), ("minimal", "Minimaliste"),
                 ("fleche", "Texte avec flèche"), ("premium", "Premium automobile")]
RATIOS = [("4 / 5", "Portrait 4:5"), ("3 / 4", "Portrait 3:4"), ("1 / 1", "Carré"), ("4 / 3", "Paysage 4:3"),
          ("3 / 2", "Paysage 3:2"), ("16 / 10", "Paysage 16:10"), ("16 / 9", "Panoramique 16:9"), ("auto", "Format d'origine")]
ESPACES = [("defaut", "Par défaut"), ("aucun", "Aucun"), ("petit", "Petit"), ("moyen", "Moyen"), ("grand", "Grand"), ("tres-grand", "Très grand")]
SI_PERSO = "{{ section.settings.palette == 'perso' }}"


def opts(lst): return [{"value": v, "label": l} for v, l in lst]
def sel(id, label, lst, default, **kw): return {"type": "select", "id": id, "label": label, "options": opts(lst), "default": default, **kw}
def chk(id, label, default, **kw): return {"type": "checkbox", "id": id, "label": label, "default": default, **kw}
def txt(id, label, default=None, **kw):
    s = {"type": "text", "id": id, "label": label, **kw}
    if default is not None: s["default"] = default
    return s
def rng(id, label, mn, mx, step, default, unit=None, **kw):
    assert (mx - mn) / step <= 101 and abs(((default - mn) / step) - round((default - mn) / step)) < 1e-9, id
    s = {"type": "range", "id": id, "label": label, "min": mn, "max": mx, "step": step, "default": default, **kw}
    if unit: s["unit"] = unit
    return s
def hdr(t): return {"type": "header", "content": t}
def para(t): return {"type": "paragraph", "content": t}


def taille_titre():
    return sel("taille_titre", "Taille du titre", [("defaut", "Par défaut"), ("s", "Petite"), ("m", "Moyenne"), ("l", "Grande"), ("xl", "Très grande")], "defaut")


def communs(palette="defaut", fond_image=True, largeur=True, espacement=True, bordures=True, alignement=False):
    s = [hdr("Mise en forme de la section"), sel("palette", "Couleurs de la section", PALETTES, palette),
         {"type": "color", "id": "couleur_fond", "label": "Fond personnalisé", "visible_if": SI_PERSO},
         {"type": "color", "id": "couleur_texte", "label": "Texte personnalisé", "visible_if": SI_PERSO},
         {"type": "color", "id": "couleur_accent", "label": "Accent personnalisé", "visible_if": SI_PERSO}]
    if fond_image:
        s += [{"type": "image_picker", "id": "fond_image", "label": "Image d'arrière-plan (facultative)"},
              rng("fond_voile", "Voile sur l'image d'arrière-plan", 0, 90, 5, 60, "%")]
    if largeur:
        s.append(sel("largeur", "Largeur du contenu", [("contenu", "Largeur du thème"), ("large", "Large"), ("pleine", "Pleine largeur"), ("bord", "Bord à bord (sans marges)")], "contenu"))
    if alignement:
        s += [{"type": "text_alignment", "id": "alignement", "label": "Alignement du texte", "default": "left"},
              sel("alignement_mobile", "Alignement sur mobile", [("auto", "Comme sur ordinateur"), ("left", "À gauche"), ("center", "Centré")], "auto")]
    if espacement:
        s += [sel("espace_haut", "Espacement en haut", ESPACES, "defaut"), sel("espace_bas", "Espacement en bas", ESPACES, "defaut"),
              sel("espace_mobile", "Espacements sur mobile", [("auto", "Proportionnels"), ("aucun", "Aucun"), ("petit", "Petits"), ("moyen", "Moyens"), ("grand", "Grands")], "auto")]
    if bordures:
        s += [chk("bordure_haut", "Filet en haut", False), chk("bordure_bas", "Filet en bas", False)]
    s += [hdr("Visibilité"), chk("afficher_ordinateur", "Afficher sur ordinateur et tablette", True), chk("afficher_mobile", "Afficher sur mobile", True)]
    return s


# ── blocs réutilisables ──
def bloc_bouton(defaut="Prendre rendez-vous"):
    return {"type": "bouton", "name": "Bouton", "settings": [
        txt("texte", "Texte", defaut), {"type": "url", "id": "lien", "label": "Lien"},
        sel("style", "Style", STYLES_BOUTON, "defaut"),
        sel("taille", "Taille", [("petit", "Petite"), ("moyen", "Moyenne"), ("grand", "Grande")], "moyen"),
        sel("icone", "Icône", [("aucune", "Aucune"), ("fleche", "Flèche"), ("rendez-vous", "Calendrier"), ("telephone", "Téléphone"), ("email", "E-mail"), ("localisation", "Adresse")], "aucune"),
        chk("pleine_largeur", "Pleine largeur", False), chk("nouvel_onglet", "Ouvrir dans un nouvel onglet", False),
        hdr("Couleurs du bouton (facultatives)"),
        {"type": "color", "id": "fond", "label": "Fond"}, {"type": "color", "id": "couleur", "label": "Texte"}, {"type": "color", "id": "bordure", "label": "Bordure"},
        sel("rayon", "Arrondi", [("theme", "Celui du thème"), ("0", "Angles vifs"), ("6", "Léger"), ("16", "Prononcé"), ("999", "Pilule")], "theme")]}


def bloc_surtitre(defaut="Surtitre"):
    return {"type": "surtitre", "name": "Surtitre", "settings": [txt("texte", "Texte", defaut)]}


def bloc_titre(defaut="Un titre <em>élégant</em>."):
    return {"type": "titre", "name": "Titre", "settings": [
        {"type": "inline_richtext", "id": "texte", "label": "Texte", "default": defaut, "info": "Mettez un mot en italique pour l'accentuer."},
        sel("taille", "Taille", [("h1", "Très grande (H1)"), ("h2", "Grande (H2)"), ("h3", "Moyenne (H3)"), ("h4", "Petite (H4)")], "h2"),
        sel("balise", "Niveau de titre (référencement)", [("h2", "H2"), ("h3", "H3"), ("h1", "H1 (une seule fois par page)")], "h2")]}


def bloc_texte(defaut="<p>Décrivez ici votre savoir-faire en quelques phrases.</p>"):
    return {"type": "texte", "name": "Texte", "settings": [
        {"type": "richtext", "id": "texte", "label": "Texte", "default": defaut},
        sel("taille", "Taille", [("petit", "Petite"), ("normal", "Normale"), ("grand", "Grande")], "normal")]}


def bloc_liste():
    return {"type": "liste", "name": "Liste à puces", "settings": [
        {"type": "textarea", "id": "elements", "label": "Éléments (un par ligne)", "default": "Premier point\nDeuxième point\nTroisième point"},
        sel("puce", "Puce", [("coche", "Coche"), ("tiret", "Tiret"), ("numero", "Numéro")], "coche")]}


def bloc_espace():
    return {"type": "espace", "name": "Espace", "settings": [rng("hauteur", "Hauteur", 0, 120, 4, 24, "px")]}


def blocs_contenu(bouton="Prendre rendez-vous"):
    return [bloc_surtitre(), bloc_titre(), bloc_texte(), bloc_liste(), bloc_bouton(bouton), bloc_espace()]


def schema_de(src):
    m = re.search(r"{%\s*schema\s*%}(.*?){%\s*endschema\s*%}", src, re.S)
    return json.loads(m.group(1)), m


def ecrire_schema(src, schema):
    _, m = schema_de(src)
    return src[:m.start(1)] + "\n" + json.dumps(schema, ensure_ascii=False, indent=2) + "\n" + src[m.end(1):]
