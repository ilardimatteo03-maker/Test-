"""SERIES A — première collection FUORICLASSE : données de toutes les pièces.

Une seule source pour les visuels produits, les fiches, le site et le guide.
"""
import artwork as A
import brand as B
from garments import shade

N, C, GR, T, CH, BL, BA = B.NERO, B.CREMA, B.GRAFITE, B.TALPA, B.CIOCC, B.BLU, B.BAROLO

FAMILIES = {
    "signature": ("Signature", "Firma", "Le vestiaire de base, signé d'un logo discret : brodé ton sur ton, petit, à sa place."),
    "business": ("Business Culture", "Cultura d'impresa",
                 "Des pièces nées de l'univers de ceux qui construisent : la salle du conseil, le plan d'architecte, "
                 "le costume rayé, la ville vue du 31ᵉ étage."),
    "statement": ("Statement", "Dichiarazione",
                  "Des créations graphiques originales, plus audacieuses — jamais un slogan, toujours une référence "
                  "que l'on comprend quand on en fait partie."),
}

COLOR_NAMES = {N: "Nero", C: "Crema", GR: "Grafite", T: "Talpa", CH: "Cioccolato", BL: "Blu Notte", BA: "Barolo"}
COLOR_CODES = {N: "NE", C: "CR", GR: "GR", T: "TA", CH: "CI", BL: "BN", BA: "BA"}


def tone(c, f=0.12):
    """Fil ton sur ton : légèrement plus clair sur fond foncé, plus foncé sur fond clair."""
    from garments import lum
    return shade(c, f if lum(c) < 0.3 else -f * 1.4)


P = []


def piece(**kw):
    P.append(kw)
    return kw


# ------------------------------------------------------------------ SIGNATURE
piece(ref="A01", slug="firma-tee", name="Firma Tee", family="signature", cat="T-shirt premium", kind="tee",
      fabric="jersey", price=110, colors=[C, N, BL],
      material="Jersey compact 100 % coton Supima, 230 g/m², retors, teint en pièce", fit="Coupe droite, épaules naturelles, longueur hanche",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="Mot-symbole Ricamo brodé, 70 mm, centre poitrine à 19 cm sous l'épaule — fil ton sur ton",
      details="Bord-côte 1×1 de 18 mm au col, bande de propreté imprimée Gessato, étiquette tissée Nero à la nuque.",
      logos=lambda c: [{"lk": "wordmark-ricamo", "x": 500, "y": 300, "w": 74, "fill": tone(c, .3), "fx": "emb", "relief": 1.0}])

piece(ref="A02", slug="firma-oversize-tee", name="Firma Oversize Tee", family="signature", cat="T-shirt oversize",
      kind="oversize", fabric="jersey", price=130, colors=[T, N, C],
      material="Jersey lourd 100 % coton peigné, 300 g/m², pré-rétréci, finition sablée", fit="Boxy, épaules tombantes, manches au coude",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="Monogramme FC brodé 25 mm, centre poitrine. Dos : « Out of class. Never out of place. » sérigraphié 80 mm sous la nuque",
      details="Col bord-côte de 22 mm, double surpiqûre, fentes côté invisibles.",
      logos=lambda c: [{"lk": "monogram", "x": 500, "y": 300, "h": 24, "fill": tone(c, .35), "fx": "emb"}],
      back=lambda c: {"arts": [{"art": A.out_of_class(tone(c, .45)), "x": 500, "y": 200, "w": 100, "fx": "print"}]})

piece(ref="A03", slug="firma-hoodie", name="Firma Hoodie", family="signature", cat="Hoodie", kind="hoodie",
      fabric="molleton", price=240, colors=[N, CH, C],
      material="Molleton gratté 100 % coton peigné, 480 g/m², envers brossé", fit="Regular, emmanchures basses, poche kangourou",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="Mot-symbole Ricamo brodé 90 mm, centre poitrine, fil ton sur ton mat",
      details="Capuche doublée deux épaisseurs, cordons plats en coton, embouts laiton brossé gravés de la Chiave, bord-côte 2×2.",
      logos=lambda c: [{"lk": "wordmark-ricamo", "x": 500, "y": 330, "w": 96, "fill": tone(c, .2), "fx": "emb", "relief": 1.1}])

piece(ref="A04", slug="firma-crewneck", name="Firma Crewneck", family="signature", cat="Crewneck", kind="crew",
      fabric="molleton", price=210, colors=[BL, GR, C],
      material="Molleton bouclette 100 % coton, 420 g/m²", fit="Regular, manches raglan",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="Monogramme FC brodé 32 mm, centre poitrine, fil Crema",
      details="Col, poignets et bas en bord-côte 2×2 de 70 mm, empiècement en V sous le col.",
      logos=lambda c: [{"lk": "monogram", "x": 500, "y": 300, "h": 32, "fill": C if c != C else T, "fx": "emb"}])

piece(ref="A05", slug="firma-cap", name="Firma Cap", family="signature", cat="Casquette", kind="cap", fabric="twill",
      price=85, colors=[N, C, CH, BA],
      material="Sergé de coton lavé, 6 panneaux non structurés", fit="Visière incurvée, taille unique",
      made="Fabriquée en Italie (recommandé)",
      logo="Monogramme FC brodé 45 mm en relief, panneau avant",
      details="Œillets brodés, sangle arrière en cuir avec boucle laiton gravée « FUORICLASSE », bande de propreté Gessato.",
      logos=lambda c: [{"lk": "monogram", "x": 470, "y": 548, "h": 66, "fill": C if c not in (C,) else N, "fx": "emb", "relief": 1.8}])

# ------------------------------------------------------------------ BUSINESS CULTURE
piece(ref="A06", slug="consiglio-polo", name="Consiglio Polo", family="business", cat="Polo", kind="polo",
      fabric="maille", price=260, colors=[CH, C, BL],
      material="Maille fine 70 % coton, 30 % soie, jauge 14", fit="Ajusté, col Riviera ouvert, bas bord-côte",
      made="Tricoté en Italie (recommandé)",
      logo="Chiave brodée 18 mm, poitrine gauche, fil ton sur ton",
      details="Col cranté sans boutons, maille côtelée aux poignets et au bas. La pièce du conseil d'administration — et du dîner qui suit.",
      logos=lambda c: [{"lk": "key-ricamo", "x": 574, "y": 386, "w": 34, "fill": tone(c, .3), "fx": "emb"}])

piece(ref="A07", slug="attico-zip-jacket", name="Attico Zip Jacket", family="business", cat="Veste zippée", kind="zip",
      fabric="laine", price=420, colors=[BL, N],
      material="Laine technique 92 % laine mérinos, 8 % élasthanne, 340 g/m²", fit="Près du corps, col cheminée",
      made="Tissu italien, confection au Portugal (recommandé)",
      logo="Tirette de zip en laiton brossé en forme de Chiave ; mot-symbole Ricamo brodé 40 mm à la nuque",
      details="Zip deux sens en laiton, poches passepoilées zippées, poignets bord-côte laine. Se porte sous un manteau ou à la place d'une veste.",
      logos=lambda c: [])

piece(ref="A08", slug="gessato-jogger", name="Gessato Jogger", family="business", cat="Pantalon de jogging", kind="jogger",
      fabric="molleton", price=210, colors=[GR, BL],
      material="Molleton jacquard 100 % coton, 400 g/m², rayure tennis Gessato tissée", fit="Tailored : pli repassé, jambe fuselée, bas resserré",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="Chiave brodée 20 mm sur la hanche gauche ; la rayure qui sort du rang tient lieu de logo",
      details="Ceinture côtelée avec cordon plat et embouts laiton, poches italiennes, poche arrière passepoilée. Le pantalon de costume, en molleton.",
      logos=lambda c: [{"lk": "key-ricamo", "x": 612, "y": 268, "w": 40, "fill": tone(c, .35), "fx": "emb"}],
      pattern=lambda c, pid: (B.gessato_pattern(pid, pitch=11, line=1.1, bg=c, ink=C, opacity=.32, out=9), f"url(#{pid})"))

piece(ref="A09", slug="pianta-tee", name="Pianta Tee", family="business", cat="T-shirt oversize", kind="oversize",
      fabric="jersey", price=140, colors=[C, N],
      material="Jersey lourd 100 % coton peigné, 300 g/m²", fit="Boxy, épaules tombantes",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="Devant : mot-symbole 60 mm sérigraphié. Dos : plan d'architecte d'un attico milanais, sérigraphie 1 couleur, 300 mm",
      details="Le plan d'un penthouse au 31ᵉ étage : salle de réunion, studio, terrasse. On construit d'abord sur papier.",
      logos=lambda c: [{"lk": "wordmark-ricamo", "x": 500, "y": 300, "w": 64, "fill": T if c == C else GR, "fx": "print"}],
      back=lambda c: {"arts": [{"art": A.floor_plan(T if c == C else shade(GR, .2)), "x": 500, "y": 300, "w": 300, "fx": "print"}]})

piece(ref="A10", slug="quota-crewneck", name="Quota Crewneck", family="business", cat="Crewneck", kind="crew",
      fabric="molleton", price=220, colors=[C, GR],
      material="Molleton bouclette 100 % coton, 420 g/m²", fit="Regular, manches raglan",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="Coordonnées de Milan, Londres, Monaco, Paris et Dubaï brodées au point de chaînette, 120 mm, poitrine gauche",
      details="Cinq villes, cinq bureaux possibles. Brodé fil Barolo sur Crema, fil Crema sur Grafite.",
      logos=lambda c: [],
      arts=lambda c: [{"art": A.coordinates(BA if c == C else C), "x": 590, "y": 290, "w": 116, "fx": "emb"}])

piece(ref="A11", slug="riviera-short", name="Riviera Short", family="business", cat="Short", kind="short",
      fabric="molleton", price=150, colors=[C, T, N],
      material="Molleton léger 100 % coton, 340 g/m²", fit="Tailored, pli repassé, longueur genou − 8 cm",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="Chiave brodée 18 mm, bas de jambe gauche",
      details="Ceinture côtelée, cordon plat, poches italiennes, poche arrière passepoilée. Du yacht-club au bureau du vendredi.",
      logos=lambda c: [{"lk": "key-ricamo", "x": 640, "y": 600, "w": 36, "fill": tone(c, .35), "fx": "emb"}])

piece(ref="A12", slug="fondatore-bomber", name="Fondatore Bomber", family="business", cat="Veste lifestyle", kind="bomber",
      fabric="daim", price=1190, colors=[CH, N],
      material="Daim de chèvre velours, doublure satin Barolo imprimée Gessato, bord-côte laine mérinos",
      fit="Blouson court, épaules naturelles", made="Tannerie et confection en Italie (recommandé)",
      logo="Chiave brodée Barolo sur la doublure, poche intérieure ; tirette Chiave en laiton",
      details="La veste du fondateur : rien à l'extérieur, tout à l'intérieur. Poches passepoilées, zip laiton deux sens.",
      logos=lambda c: [], trim=lambda c: shade(c, -.25))

# ------------------------------------------------------------------ STATEMENT
piece(ref="A13", slug="series-a-tee", name="Series A Tee", family="statement", cat="T-shirt oversize", kind="oversize",
      fabric="jersey", price=140, colors=[C, N],
      material="Jersey lourd 100 % coton peigné, 300 g/m²", fit="Boxy, épaules tombantes",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="« Series A » en italique de titrage, sérigraphie Barolo 260 mm, poitrine",
      details="Le nom de la première collection — et du premier tour de financement. Ceux qui savent, savent.",
      logos=lambda c: [],
      arts=lambda c: [{"art": A.series_a(BA if c == C else C, T if c == C else shade(GR, .3)), "x": 500, "y": 278, "w": 260, "fx": "print"}])

piece(ref="A14", slug="departures-hoodie", name="Departures Hoodie", family="statement", cat="Hoodie", kind="hoodie",
      fabric="molleton", price=260, colors=[BL, N],
      material="Molleton gratté 100 % coton peigné, 480 g/m²", fit="Regular, emmanchures basses",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="Devant : Chiave brodée 30 mm. Dos : tableau des départs à palettes, sérigraphie haute densité, 300 mm",
      details="Milano, London, Monaco, Paris, Dubai : tous à l'heure. Le statut BOARDING est imprimé en Barolo.",
      logos=lambda c: [{"lk": "key-ricamo", "x": 500, "y": 320, "w": 44, "fill": C, "fx": "emb"}],
      back=lambda c: {"arts": [{"art": A.departures(C, shade(BA, .35)), "x": 500, "y": 470, "w": 300, "fx": "print"}]})

piece(ref="A15", slug="chiave-tee", name="Chiave Tee", family="statement", cat="T-shirt oversize", kind="oversize",
      fabric="jersey", price=150, colors=[N, C],
      material="Jersey lourd 100 % coton peigné, 300 g/m²", fit="Boxy, épaules tombantes",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="Devant : Chiave 30 mm. Dos : Chiave 320 mm en impression gonflante ton sur ton",
      details="La clé, en grand, mais ton sur ton : elle se voit à la lumière rasante. Un signe de reconnaissance.",
      logos=lambda c: [{"lk": "key-ricamo", "x": 500, "y": 300, "w": 44, "fill": tone(c, .3), "fx": "emb"}],
      back=lambda c: {"arts": [{"art": A.key_big(tone(c, .12)), "x": 500, "y": 380, "w": 320, "fx": "puff"}]})

piece(ref="A16", slug="fuori-classe-crewneck", name="Fuori / Classe Crewneck", family="statement", cat="Crewneck",
      kind="crew", fabric="molleton", price=240, colors=[BA, N],
      material="Molleton bouclette 100 % coton, 420 g/m²", fit="Regular, manches raglan",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="FUORI / CLASSE sur deux lignes, broderie relief Crema 240 mm, poitrine",
      details="La seule pièce où le nom parle fort : la couleur signature, la typographie en majesté.",
      logos=lambda c: [],
      arts=lambda c: [{"art": A.wordmark_stack(C), "x": 500, "y": 300, "w": 230, "fx": "emb"}])

piece(ref="A17", slug="gessato-hoodie", name="Gessato Hoodie", family="statement", cat="Hoodie", kind="hoodie",
      fabric="molleton", price=280, colors=[BL, N],
      material="Molleton jacquard 100 % coton, 480 g/m², rayure tennis Gessato tissée", fit="Regular",
      made="Tricoté et confectionné au Portugal (recommandé)",
      logo="Le motif est la signature : une rayure sur neuf fait un pas de côté. Monogramme brodé 25 mm à la manche",
      details="Le costume rayé du banquier, réécrit en molleton — avec une rayure qui refuse de rester dans le rang.",
      logos=lambda c: [],
      pattern=lambda c, pid: (B.gessato_pattern(pid, pitch=13, line=1.3, bg=c, ink=C, opacity=.42, out=9), f"url(#{pid})"))


def by_ref(ref):
    return next(p for p in P if p["ref"] == ref)


def sku(p, c):
    return f"FC-{p['ref']}-{COLOR_CODES[c]}"


def img_name(p, c, view="front"):
    return f"{p['ref'].lower()}-{p['slug']}-{COLOR_NAMES[c].lower().replace(' ', '-')}{'' if view == 'front' else '-dos'}"
