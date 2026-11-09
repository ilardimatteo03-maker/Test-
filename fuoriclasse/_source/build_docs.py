"""Présentation de la direction artistique (00_presentation) et guide de marque (12_guide-de-marque).

Deux documents 16:9 (1600 × 900 px) en PDF, construits avec les visuels déjà générés.
"""
import brand as B
import collection as CO
import garments as GM
import kit as K
import textes as TX

R = K.ROOT
DATE = "Novembre 2026"


def u(p):
    """URI d'une image ; les PNG lourds sont convertis en JPG pour alléger les PDF."""
    path = (R / p) if isinstance(p, str) else p
    if path.suffix == ".png" and "icones" not in str(path):
        from PIL import Image
        dst = K.TMP / "docs-img" / (path.parent.name + "-" + path.stem + ".jpg")
        if not dst.exists() or dst.stat().st_mtime < path.stat().st_mtime:
            dst.parent.mkdir(parents=True, exist_ok=True)
            im = Image.open(path)
            if im.mode in ("RGBA", "LA"):
                bg = Image.new("RGB", im.size, B.CREMA)
                bg.paste(im, mask=im.split()[-1])
                im = bg
            im.convert("RGB").save(dst, quality=86)
        path = dst
    return path.as_uri()


CSS = """
@page{size:1600px 900px;margin:0}
section.s{position:relative;width:1600px;height:900px;overflow:hidden;background:var(--crema);color:var(--nero);page-break-after:always}
section.s.dark{background:var(--nero);color:var(--crema)}
.hd{position:absolute;left:56px;right:56px;top:34px;display:flex;justify-content:space-between;font-family:'Geist Mono';font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.55;z-index:5}
.ttl{position:absolute;left:56px;top:84px;right:56px;display:flex;justify-content:space-between;align-items:flex-end;gap:40px;z-index:4}
.ttl h2{font-family:'Playfair';font-variation-settings:'opsz' 900;font-weight:400;font-size:52px;line-height:1}
.ttl h2 i{font-style:italic}
.ttl p{max-width:560px;font-size:14px;line-height:1.55;opacity:.8}
.body{position:absolute;left:56px;right:56px;top:190px;bottom:56px}
.full{position:absolute;inset:0;background-size:cover;background-position:center}
.fit{position:absolute;left:56px;right:56px;top:180px;bottom:44px;background-size:contain;background-repeat:no-repeat;background-position:center}
.cap{position:absolute;left:56px;bottom:22px;font-family:'Geist Mono';font-size:10.5px;opacity:.55}
.k{font-family:'Geist Mono';font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--talpa)}
.big{font-family:'Playfair';font-variation-settings:'opsz' 900;font-weight:400;line-height:.95}
.big i{font-style:italic}
.cols{display:grid;gap:34px}
.card{border-top:1px solid var(--crema-2);padding-top:14px}
.dark .card{border-color:rgba(239,233,222,.18)}
.card h3{font-family:'Playfair';font-variation-settings:'opsz' 600;font-weight:400;font-size:28px;line-height:1.05;margin-bottom:8px}
.card p,.card li{font-size:13.5px;line-height:1.55;opacity:.85}
.img{background-size:cover;background-position:center;background-color:var(--pietra)}
table.t{width:100%;border-collapse:collapse;font-size:13px}
table.t td,table.t th{padding:10px 12px 10px 0;border-bottom:1px solid var(--crema-2);text-align:left;vertical-align:top}
table.t th{font-family:'Mona Sans';font-stretch:125%;font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--talpa);font-weight:500}
.mk{position:absolute;width:24px;height:24px;border-radius:50%;background:var(--barolo);color:var(--crema);font-family:'Geist Mono';font-size:13px;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);box-shadow:0 0 0 4px rgba(239,233,222,.6)}
.no{position:relative;background:#fff6;display:flex;align-items:center;justify-content:center;overflow:hidden}
.no::after{content:"";position:absolute;inset:0;background:linear-gradient(to top right,transparent calc(50% - 1px),var(--barolo) 50%,transparent calc(50% + 1px));opacity:.7}
.no span{position:absolute;left:12px;bottom:10px;font-family:'Geist Mono';font-size:10.5px;color:var(--barolo)}
"""


class Deck:
    def __init__(self, name):
        self.name, self.pages = name, []

    def add(self, inner, dark=False, section="", header=True):
        n = len(self.pages) + 1
        hd = (f'<div class="hd"><span>FUORICLASSE — {self.name}</span><span>{section}</span><span>{n:02d}</span></div>'
              if n > 1 and header else "")
        self.pages.append(f'<section class="s{" dark" if dark else ""}">{hd}{inner}</section>')

    def title(self, h, p="", section="", dark=False, inner=""):
        self.add(f'<div class="ttl"><h2>{h}</h2>{f"<p>{p}</p>" if p else ""}</div>{inner}', dark, section)

    def image(self, h, img, p="", section="", dark=False, contain=True, cap=""):
        cls = "fit" if contain else "full"
        self.title(h, p, section, dark, f'<div class="{cls}" style="background-image:url({u(img)})"></div>'
                   + (f'<div class="cap">{cap}</div>' if cap else ""))

    def full(self, img, section="", dark=False, bg=None, pos="center", cap=""):
        """Planche pleine page, sans en-tête ; contenue (bandes latérales) si elle n'est pas en 16:9."""
        from PIL import Image
        path = (R / img) if isinstance(img, str) else img
        w, h = Image.open(path).size
        size = "cover" if abs(w / h - 16 / 9) < 0.08 else "contain"
        bgc = bg or (B.NERO if dark else B.CREMA)
        self.add(f'<div class="full" style="background-image:url({u(img)});background-size:{size};background-position:{pos};background-repeat:no-repeat;background-color:{bgc}"></div>'
                 + (f'<div class="cap">{cap}</div>' if cap else ""), dark, section, header=False)

    def html(self):
        return K.page("".join(self.pages), css=CSS)


def cover(d, title, sub):
    d.add(f'<div style="position:absolute;inset:0;opacity:.16">{K.svg_doc(B.gessato_rect("cv" + title[:3], 0, 0, 1600, 900, pitch=24, line=1.4, bg="none", ink=B.CREMA, opacity=.6), 1600, 900)}</div>'
          f'<div style="position:absolute;left:96px;top:96px">{B.logo_svg("key", fill=B.CREMA, width=110)}</div>'
          f'<div style="position:absolute;left:96px;right:96px;top:300px">{B.logo_svg("wordmark", fill=B.CREMA, width=1000)}'
          f'<div class="big" style="font-size:64px;margin-top:56px">{title}</div>'
          f'<div style="font-size:16px;opacity:.75;margin-top:16px">{sub}</div></div>'
          f'<div style="position:absolute;left:96px;right:96px;bottom:70px;display:flex;justify-content:space-between" class="k">'
          f'<span style="color:var(--crema);opacity:.7">The new generation of success</span><span style="color:var(--crema);opacity:.7">V1.0 · {DATE}</span></div>', dark=True)


def chapter(d, n, title, line):
    d.add(f'<div style="position:absolute;left:96px;bottom:110px"><div class="k" style="color:var(--talpa)">Chapitre {n}</div>'
          f'<div class="big" style="font-size:120px;margin-top:20px">{title}</div><div style="font-size:18px;opacity:.7;margin-top:22px;max-width:760px">{line}</div></div>'
          f'<div style="position:absolute;right:96px;top:96px">{B.logo_svg("monogram", fill=B.CREMA, height=60)}</div>', dark=True, section=title)


# ======================================================================== présentation
def presentation():
    d = Deck("Direction artistique")
    cover(d, "Direction artistique <i>complète.</i>", "Positionnement, identité, collection Series A, packaging, campagnes, digital.")
    toc = [("01", "Positionnement & histoire"), ("02", "Modern Wealth Culture — inspiration"), ("03", "Identité graphique"),
           ("04", "Collection Series A"), ("05", "Étiquettes & packaging"), ("06", "Campagnes & photographie"),
           ("07", "Identité digitale"), ("08", "Prochaines étapes")]
    d.title("Sommaire", "", "Sommaire", inner='<div class="body cols" style="grid-template-columns:1fr 1fr;align-content:start;gap:0 60px">' + "".join(
        f'<div class="card" style="display:flex;gap:26px;align-items:baseline;padding:22px 0"><span class="k">{n}</span><span class="big" style="font-size:40px">{t}</span></div>' for n, t in toc) + "</div>")
    chapter(d, "01", "Positionnement", "Modern Luxury / Entrepreneurial Streetwear — THE NEW GENERATION OF SUCCESS.")
    d.title("Une maison de mode pour <i>ceux qui construisent.</i>", "FUORICLASSE habille une génération qui fonde, investit, voyage et reçoit. "
            "Elle suggère la réussite par la coupe, la matière et le détail — jamais par l'étalage.", "Positionnement",
            inner='<div class="body cols" style="grid-template-columns:repeat(3,1fr)">'
            '<div class="card"><h3>Positionnement</h3><p>Modern Luxury / Entrepreneurial Streetwear. Le confort et les codes du streetwear européen premium, la tenue et les matières de la mode de luxe discrète.</p></div>'
            '<div class="card"><h3>Pour qui</h3><p>22–34 ans. Fondatrices et fondateurs, jeunes investisseurs, créatifs, étudiants des grandes écoles, sportifs reconvertis. Milan, Londres, Monaco, Paris, Dubaï — et partout où ils ouvrent un bureau.</p></div>'
            '<div class="card"><h3>Prix publics conseillés</h3><p>T-shirts € 110–150 · Crewnecks € 210–240 · Hoodies € 240–280 · Polo maille € 260 · Veste zippée € 420 · Blouson daim € 1 190. Le territoire de Represent, Cole Buxton, Fear of God — avec la tenue d\'une maison italienne.</p></div>'
            '<div class="card"><h3>FUORICLASSE est</h3><ul style="padding-left:16px"><li>sobre, précis, international</li><li>une marque de mode et de lifestyle</li><li>une culture que l\'on rejoint</li></ul></div>'
            '<div class="card"><h3>FUORICLASSE n\'est pas</h3><ul style="padding-left:16px"><li>une marque de motivation</li><li>un logo géant, des billets, des liasses</li><li>du coaching ou du développement personnel</li></ul></div>'
            '<div class="card"><h3>La promesse</h3><p class="big" style="font-size:30px;opacity:1"><i>Out of class.<br>Never out of place.</i></p></div></div>')
    d.title("Fuori · <i>classe.</i>", "", "Le nom", inner=
            f'<div class="body" style="display:grid;grid-template-columns:1.1fr 1fr;gap:70px"><div class="big" style="font-size:150px;line-height:.9">fuori<br><i>classe</i></div>'
            f'<div style="font-size:16px;line-height:1.65;display:grid;gap:16px;align-content:start">{"".join("<p>" + t.replace("*", "") + "</p>" for t in TX.NOM["texte"])}'
            f'<p class="k" style="margin-top:10px">fuori = dehors · classe = la classe · fuoriclasse = hors catégorie, le champion</p></div></div>')
    d.title("L'histoire", "", "Brand story", inner='<div class="body" style="display:grid;grid-template-columns:1fr 1fr;gap:70px">'
            f'<div style="font-size:16px;line-height:1.65;display:grid;gap:16px;align-content:start">{"".join("<p>" + t + "</p>" for t in TX.STORY["texte"])}</div>'
            '<div class="cols" style="grid-template-columns:1fr 1fr;gap:26px;align-content:start">' + "".join(
                f'<div class="card"><div class="k">{fr}</div><h3><i>{it}</i></h3><p>{tx}</p></div>' for it, fr, tx in TX.PHILOSOPHIE) + "</div></div>")
    d.title("Il Codice", "Quatre principes qui décident des matières, des coupes, et de ce que la marque refuse.", "Philosophie", dark=True,
            inner='<div class="body cols" style="grid-template-columns:repeat(4,1fr);align-content:end">' + "".join(
                f'<div class="card"><div class="big" style="font-size:54px"><i>{it}</i></div><div class="k" style="margin:10px 0">{fr}</div><p>{tx}</p></div>' for it, fr, tx in TX.PHILOSOPHIE) + "</div>")
    chapter(d, "02", "Modern Wealth Culture", "Quiet luxury, mode contemporaine, vie de jeune entrepreneur, streetwear européen premium, culture d'entreprise moderne.")
    codes = [("Quiet Luxury", "Matières nobles, logos ton sur ton, silence."), ("Contemporary Fashion", "Coupes actuelles, volumes boxy, presse de mode."),
             ("Young Entrepreneur Lifestyle", "Le bureau, l'avion, le dîner : une journée, une tenue."), ("Premium European Streetwear", "Molletons lourds, bords-côtes, fabrication européenne."),
             ("Modern Business Culture", "Term sheets, salles du conseil, plans d'architecte, rayures de banquier.")]
    d.title("Cinq codes, <i>un mélange.</i>", "Suffisamment élégant pour un rendez-vous professionnel, suffisamment moderne pour le quotidien. "
            "Milan pour la coupe, Londres pour l'attitude, Monaco pour la lumière, Paris pour le goût, Dubaï pour l'ambition.", "Esthétique",
            inner='<div class="body cols" style="grid-template-columns:repeat(5,1fr);align-content:end">' + "".join(
                f'<div class="card"><div class="k">0{i + 1}</div><h3>{a}</h3><p>{b}</p></div>' for i, (a, b) in enumerate(codes)) + "</div>")
    d.full("01_inspiration/planche-inspiration-modern-wealth-culture.jpg", section="Planche d'inspiration")
    d.full("01_inspiration/planche-matieres.jpg", section="Matières")
    chapter(d, "03", "Identité graphique", "Un mot-symbole de tailleur, un monogramme qui dépasse, une clé, une rayure qui sort du rang.")
    d.title("Trois propositions <i>de logo.</i>", "La 01 est recommandée : elle se brode, se tisse et se grave sans perdre sa voix. "
            "La 03 survit comme style éditorial des titres ; la 02 comme typographie des surtitres.", "Logos — propositions",
            inner='<div class="body" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;top:200px">' + "".join(
                f'<div class="img" style="background-image:url({u("02_logo/propositions/" + f)});background-size:contain;background-repeat:no-repeat"></div>'
                for f in ["proposition-01-sartoriale.png", "proposition-02-architettonico.png", "proposition-03-doppia-firma.png"]) + "</div>")
    d.full("02_logo/propositions/proposition-01-sartoriale.png", section="Logo — Sartoriale")
    d.full("02_logo/planches/monogramme-et-symbole-construction.png", section="Monogramme & symbole")
    d.full("02_logo/planches/systeme-de-logos.png", section="Système")
    d.full("02_logo/broderie/logos-brodes-echantillons.png", section="Logos brodés")
    d.full("02_logo/broderie/tailles-minimales.png", section="Petites pièces")
    gs = K.svg_doc(B.gessato_rect("pg", 0, 0, 700, 560, pitch=20, line=1.6, bg=B.BLU, ink=B.CREMA, opacity=.55), 700, 560)
    d.title("Il Gessato — <i>la signature graphique.</i>", "La rayure tennis du costume de banquier, dont une rayure sur neuf fait un pas de côté, "
            "puis reprend son rang. Un motif propriétaire pour les jacquards, doublures, papiers de soie, rubans et écrans.", "Signature graphique",
            inner=f'<div class="body" style="display:grid;grid-template-columns:700px 1fr;gap:60px"><div style="line-height:0">{gs}</div>'
                  f'<div style="display:grid;align-content:space-between"><div>{B.logo_svg("signature", fill=B.NERO, width=640)}'
                  f'<p class="k" style="margin-top:22px">Signature de marque : mot-symbole + THE NEW GENERATION OF SUCCESS</p></div>'
                  f'<div class="cols" style="grid-template-columns:1fr 1fr;gap:20px"><div class="card"><h3>Construction</h3><p>Pas régulier, 9 rayures par module, la 5ᵉ décalée d\'un demi-pas sur 22 % de la hauteur. Raccord demi-chute.</p></div>'
                  f'<div class="card"><h3>Usages</h3><p>Jacquard (Gessato Jogger, Hoodie), doublure du bomber, bande de propreté, papier de soie, fonds digitaux.</p></div></div></div></div>')
    d.full("04_couleurs/planche-palette.png", section="Palette")
    d.full("04_couleurs/accords-de-couleurs.png", section="Accords")
    d.full("03_typographie/planche-typographie.png", section="Typographie")
    d.full("03_typographie/hierarchie-typographique.png", section="Hiérarchie", dark=True)
    chapter(d, "04", "Series A", "Collezione 01 — dix-sept pièces, trois familles, mille exemplaires numérotés par pièce.")
    d.full("05_collection/planche-collection-series-a.jpg", section="Collection")
    for fam in CO.FAMILIES:
        d.full(f"05_collection/famille-{fam}.jpg", section=CO.FAMILIES[fam][0])
    dets = ["a01-broderie-mot-symbole", "a04-monogramme-et-col", "a07-tirette-chiave", "a05-casquette-monogramme",
            "a14-tableau-departures", "a09-plan-attico", "a17-jacquard-gessato", "a16-fuori-classe-relief"]
    d.title("Le détail <i>signe.</i>", "Broderies ton sur ton, tirette Chiave en laiton, sérigraphie haute densité, jacquard Gessato, broderie relief.", "Détails",
            inner='<div class="body" style="display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;gap:10px">' + "".join(
                f'<div class="img" style="background-image:url({u("05_collection/produits/details/" + x + ".jpg")})"></div>' for x in dets) + "</div>")
    d.full("05_collection/apercus-fiches/fiche-a03.jpg", section="Fiche produit")
    d.full("05_collection/apercus-fiches/fiche-a08.jpg", section="Fiche produit")
    chapter(d, "05", "Packaging", "Boîte noire mate, papier de soie Gessato, sceau Barolo : on ouvre une clé.")
    d.full("07_packaging/rendus-3d/packaging-01-ensemble.jpg", section="Packaging", bg=B.PIETRA, cap="Rendu 3D d'intention")
    d.title("L'ouverture, <i>en trois temps.</i>", "Couvercle noir, vernis sélectif ; papier de soie Gessato scellé d'une Chiave Barolo ; carte « Grazie. » et numéro de série.",
            "Packaging", inner=f'<div class="body" style="display:grid;grid-template-columns:1fr 1.5fr;gap:12px">'
            f'<div class="img" style="background-image:url({u("07_packaging/rendus-3d/packaging-02-boite-ouverte.jpg")})"></div>'
            f'<div class="img" style="background-image:url({u("07_packaging/rendus-3d/packaging-03-sac-et-pochette.jpg")})"></div></div>')
    d.full("07_packaging/planche-packaging-a-plat.jpg", section="Papeterie à plat")
    d.full("07_packaging/etiquettes-tissees-gros-plan.jpg", section="Étiquettes tissées")
    chapter(d, "06", "Campagnes", "Out of Class · The Quiet Class · Office Hours · Departures · Series A.")
    d.full("08_campagne/concepts-de-campagne.jpg", section="Concepts")
    pist = "".join(f'<tr><td class="big" style="font-size:22px;width:280px">{a}</td><td>{b}</td></tr>' for a, b in TX.PISTES_CLIENT)
    d.title("Les pistes du brief, <i>tranchées.</i>", "", "Campagnes", inner=f'<div class="body"><table class="t">{pist}</table></div>')
    d.title("Out of Class — <i>lancement.</i>", "Affiches 120 × 176 : le lieu, puis deux pièces fortes. La même phrase, trois façons de la dire.", "Lancement",
            inner='<div class="body" style="display:grid;grid-template-columns:repeat(3,1fr) 1.15fr;gap:12px;top:180px">' + "".join(
                f'<div class="img" style="background-image:url({u("08_campagne/lancement/" + f)});background-size:contain;background-repeat:no-repeat"></div>'
                for f in ["affiche-01-out-of-class-120x176.jpg", "affiche-02-first-to-board-120x176.jpg", "affiche-03-never-out-of-place-120x176.jpg",
                          "manifeste-no-ordinary-class.jpg"]) + "</div>")
    d.full("08_campagne/lancement/affichage-4x3-rooftop.jpg", section="Affichage 4 × 3", dark=True)
    d.full("08_campagne/lancement/double-page-magazine-460x300.jpg", section="Double page presse")
    bans = ["banniere-300x250.jpg", "banniere-160x600.jpg", "banniere-300x600.jpg", "pub-sociale-feed-office-hours-1080x1350.jpg", "pub-sociale-story-out-of-class-1080x1920.jpg"]
    d.title("Bannières <i>& publicités sociales.</i>", "IAB 300 × 250, 160 × 600, 300 × 600, 728 × 90, 970 × 250, 320 × 100 ; feed 4:5 et story 9:16.", "Digital",
            inner='<div class="body" style="display:grid;grid-template-columns:1fr .5fr .55fr 1fr .78fr;gap:14px;align-items:center">' + "".join(
                f'<img src="{u("08_campagne/lancement/" + f)}" style="width:100%;display:block">' for f in bans) + "</div>")
    d.full("08_campagne/film-30s-storyboard.jpg", section="Film 30 s")
    d.full("06_photographie/direction-photographique.jpg", section="Direction photo")
    d.full("06_photographie/liste-de-plans-1.jpg", section="Liste de plans")
    d.full("06_photographie/liste-de-plans-2.jpg", section="Liste de plans")
    chapter(d, "07", "Digital", "Instagram, stories, TikTok, site e-commerce.")
    d.title("Instagram — <i>la grille.</i>", "Un damier clair / foncé, une couleur signature au centre, quatre piliers : produit, culture, communauté, campagne.", "Instagram",
            inner=f'<div class="body" style="display:grid;grid-template-columns:1fr 330px;gap:30px;top:180px">'
                  f'<div class="img" style="background-image:url({u("09_reseaux-sociaux/grille-instagram-12-publications.jpg")});background-position:center 30%"></div>'
                  f'<div class="img" style="background-image:url({u("09_reseaux-sociaux/profil-instagram-telephone.png")});background-position:top;border-radius:26px;border:8px solid #111"></div></div>')
    sts = ["story-01-compte-a-rebours-j-3", "story-02-compte-a-rebours-j-2", "story-03-compte-a-rebours-j-1", "story-04-lancement-now-live",
           "story-05-produit", "story-06-question-aux-fondateurs"]
    d.title("Stories <i>de lancement.</i>", "J-3, J-2, J-1, ouverture ; puis produit et rendez-vous hebdomadaire avec les fondateurs.", "Stories",
            inner='<div class="body" style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;align-items:start">' + "".join(
                f'<img src="{u("09_reseaux-sociaux/stories/" + s + ".jpg")}" style="width:100%">' for s in sts) + "</div>")
    d.full("09_reseaux-sociaux/univers-instagram.jpg", section="Univers Instagram")
    d.full("09_reseaux-sociaux/direction-tiktok.jpg", section="TikTok")
    d.title("Le site, <i>une maison de mode.</i>", "Accueil, collection filtrable, 17 fiches produit, La Maison, panier. HTML autonome, prêt à être porté sur Shopify.", "E-commerce",
            inner=f'<div class="body" style="display:grid;grid-template-columns:1.6fr 1fr .42fr;gap:18px;top:180px">'
                  f'<div class="img" style="background-image:url({u("11_site-ecommerce/apercus/accueil-desktop.jpg")});background-position:top"></div>'
                  f'<div class="img" style="background-image:url({u("11_site-ecommerce/apercus/fiche-produit-desktop.jpg")});background-position:left top"></div>'
                  f'<div class="img" style="background-image:url({u("11_site-ecommerce/apercus/accueil-mobile.jpg")});background-position:top;border-radius:18px;border:6px solid #111"></div></div>')
    d.full("11_site-ecommerce/apercus/fiche-produit-departures-desktop.jpg", section="Fiche produit", pos="top")
    chapter(d, "08", "Et maintenant", "De la direction artistique au premier drop.")
    steps = [("Protéger", "Recherche d'antériorité FUORICLASSE (EUIPO, OMPI, Italie), dépôt du nom, du monogramme et de la Chiave en classes 25, 18, 35. Réserver domaine et comptes sociaux."),
             ("Prototyper", "Sourcing jersey/molleton (Portugal), maille et laine (Italie) ; prototypes des 17 pièces ; validation des grammages et des broderies sur échantillons."),
             ("Photographier", "Casting, repérages (bureaux, hôtel, rooftop, voiture), séance de 2 jours d'après la liste de plans ; remplacer tous les rendus 3D d'intention."),
             ("Lancer", "Site sur Shopify d'après la maquette, séquence J-3 → ouverture, lettre aux premiers membres, événement privé Series A.")]
    d.title("Prochaines <i>étapes.</i>", "", "Feuille de route", inner='<div class="body cols" style="grid-template-columns:repeat(4,1fr);align-content:end">' + "".join(
        f'<div class="card"><div class="k">0{i + 1}</div><h3>{a}</h3><p>{b}</p></div>' for i, (a, b) in enumerate(steps)) + "</div>")
    d.add(f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px">'
          f'{B.logo_svg("key", fill=B.CREMA, width=160)}<div class="big" style="font-size:72px;text-align:center">Out of class.<br><i>Never out of place.</i></div>'
          f'{B.logo_svg("wordmark", fill=B.CREMA, width=360)}</div>', dark=True)
    return d


# ======================================================================== guide de marque
def guide():
    d = Deck("Guide de marque")
    cover(d, "Guide de <i>marque.</i>", "Les règles d'usage de l'identité FUORICLASSE : logo, couleurs, typographie, textile, packaging, image, ton.")
    toc = ["Plateforme de marque", "Logo et versions", "Zone de protection et tailles minimales", "Usages interdits", "Couleurs",
           "Typographie", "Il Gessato", "Application textile", "Broderie et impression", "Étiquetage et packaging", "Photographie",
           "Ton de voix", "Réseaux sociaux", "Digital", "Fichiers"]
    d.title("Sommaire", "", "Sommaire", inner='<div class="body cols" style="grid-template-columns:1fr 1fr 1fr;gap:0 50px;align-content:start">' + "".join(
        f'<div class="card" style="display:flex;gap:20px;align-items:baseline;padding:16px 0"><span class="k">{i + 1:02d}</span><span class="big" style="font-size:26px">{t}</span></div>'
        for i, t in enumerate(toc)) + "</div>")
    plat = [("Concept", "THE NEW GENERATION OF SUCCESS"), ("Esthétique", "MODERN WEALTH CULTURE"),
            ("Positionnement", "Modern Luxury / Entrepreneurial Streetwear"), ("Promesse", "Out of class. Never out of place."),
            ("Valeurs — Il Codice", "Ambizione · Disciplina · Indipendenza · Eccellenza"),
            ("Personnalité", "Sobre, précise, complice, internationale"), ("Première collection", "SERIES A — Collezione 01, 17 pièces, 3 familles"),
            ("Ce qu'elle refuse", "Les slogans de motivation, les symboles d'argent affichés, le vocabulaire du coaching")]
    d.title("Plateforme <i>de marque.</i>", "", "01 · Plateforme", inner='<div class="body"><table class="t">' + "".join(
        f'<tr><th style="width:280px">{a}</th><td class="big" style="font-size:24px">{b}</td></tr>' for a, b in plat) + "</table></div>")
    vers = [("wordmark", "Logo principal — Display", "Au-delà de 40 mm. Façades, packaging, digital."),
            ("wordmark-ricamo", "Logo principal — Ricamo", "Broderie, tissage, et sous 40 mm."),
            ("vertical", "Version verticale", "Formats carrés, couvertures, sceaux."),
            ("horizontal", "Version horizontale", "Bandeaux, signatures d'e-mail, en-têtes."),
            ("monogram", "Monogramme FC", "Poitrine, casquette, hangtag, avatar."),
            ("key", "Symbole Chiave", "Tirettes, rivets, tabs, favicon, sceaux.")]
    d.title("Logo <i>et versions.</i>", "Huit versions, cinq couleurs, en SVG, PDF et PNG : dossier 02_logo. Le logo principal reste prioritaire.", "02 · Logo",
            inner='<div class="body" style="display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;gap:12px">' + "".join(
                f'<div style="background:#fff7;position:relative;display:flex;align-items:center;justify-content:center">'
                f'{B.logo_svg(lk, fill=B.NERO, width=(300 if lk.startswith("word") or lk == "horizontal" else 150 if lk == "vertical" else 110))}'
                f'<div style="position:absolute;left:16px;bottom:12px;right:16px"><div class="k" style="color:var(--nero)">{t}</div><div style="font-size:12px;color:var(--grafite)">{x}</div></div></div>'
                for lk, t, x in vers) + "</div>")
    # zone de protection
    _, (vw, vh) = B.lockup("wordmark")
    W0 = 760
    h0 = W0 * vh / vw
    cl = (f'<div style="position:relative;width:{W0 + 2 * h0}px;height:{3 * h0}px;border:1px dashed var(--barolo)">'
          f'<div style="position:absolute;left:{h0}px;top:{h0}px">{B.logo_svg("wordmark", fill=B.NERO, width=W0)}</div>'
          f'<div style="position:absolute;left:{h0}px;top:{h0}px;width:{W0}px;height:{h0}px;outline:1px solid rgba(94,27,39,.3)"></div>'
          f'<div style="position:absolute;left:0;top:{h0}px;width:{h0}px;height:{h0}px;background:rgba(94,27,39,.12);display:flex;align-items:center;justify-content:center" class="k">X</div>'
          f'<div style="position:absolute;left:{h0}px;top:0;width:{h0}px;height:{h0}px;background:rgba(94,27,39,.12);display:flex;align-items:center;justify-content:center" class="k">X</div></div>')
    mins = [("Logo principal Display", "40 mm / 160 px"), ("Logo Ricamo (brodé)", "25 mm de large"), ("Monogramme", "8 mm de haut / 24 px"),
            ("Chiave", "6 mm de large / 16 px"), ("Signature (avec ligne)", "60 mm / 240 px")]
    d.title("Zone de protection <i>et tailles minimales.</i>", "X = hauteur de capitale du mot-symbole. Rien ne s'approche à moins de X ; deux X au-dessus d'un bord de page.", "03 · Protection",
            inner=f'<div class="body" style="display:grid;grid-template-columns:1.4fr 1fr;gap:60px;align-items:center"><div style="display:flex;justify-content:center">{cl}</div>'
                  '<table class="t">' + "".join(f'<tr><td>{a}</td><td class="mono">{b}</td></tr>' for a, b in mins) + "</table></div>")
    # usages interdits
    wm = lambda st="", fill=B.NERO: f'<div style="{st}">{B.logo_svg("wordmark", fill=fill, width=300)}</div>'
    gs = K.svg_doc(B.gessato_rect("no1", 0, 0, 400, 200, pitch=12, line=1.2, bg=B.BLU, ink=B.CREMA, opacity=.7), 400, 200)
    donts = [(wm("transform:scaleX(1.45)"), "Déformer"), (wm("transform:rotate(-12deg)"), "Pivoter"),
             (wm("filter:drop-shadow(4px 6px 3px rgba(0,0,0,.5))"), "Ajouter une ombre"),
             (wm(fill="#C9A227"), "Dorer ou changer de couleur"), (f'<div style="position:absolute;inset:0;line-height:0">{gs}</div>' + wm("position:relative", B.CREMA), "Poser sur le Gessato"),
             ('<div class="wide" style="font-family:Arial;font-weight:700;font-size:34px;letter-spacing:.02em">FUORICLASSE</div>', "Recomposer dans une autre police"),
             ('<div style="display:flex;gap:16px;align-items:center">' + B.logo_svg("monogram", fill=B.NERO, height=60) + B.logo_svg("wordmark", fill=B.NERO, width=240) + "</div>", "Inventer un assemblage"),
             ('<div class="big" style="font-size:38px">Never give up. <i>FUORICLASSE</i></div>', "Associer à un slogan de motivation")]
    d.title("Usages <i>interdits.</i>", "", "04 · Interdits", inner='<div class="body" style="display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;gap:12px">' + "".join(
        f'<div class="no">{c}<span>{t}</span></div>' for c, t in donts) + "</div>")
    # couleurs
    rows = "".join(f'<tr><td><i style="display:inline-block;width:26px;height:26px;background:{hx};vertical-align:middle;border:1px solid rgba(0,0,0,.1)"></i></td>'
                   f'<td class="big" style="font-size:22px">{n}</td><td class="mono">{hx}</td><td class="mono">{" ".join(str(int(hx[i:i + 2], 16)) for i in (1, 3, 5))}</td>'
                   f'<td class="mono">{" ".join(map(str, cm))}</td><td>{ro}</td></tr>' for n, hx, ro, cm in B.PALETTE)
    d.title("Couleurs", "CMJN indicatifs pour papier couché, à valider sur épreuve. Textile : faire teindre d'après un nuancier physique (TCX), à partir des HEX. "
            "Barolo ne dépasse jamais 5 % d'une surface.", "05 · Couleurs",
            inner=f'<div class="body"><table class="t"><tr><th></th><th>Nom</th><th>HEX</th><th>RVB</th><th>CMJN</th><th>Rôle</th></tr>{rows}</table>'
                  f'<p class="k" style="margin-top:18px">Couleurs de support : Ottone {B.OTTONE} (métal, dorure — jamais en aplat) · Pietra {B.PIETRA} · Crema ombrée {B.CREMA_2} · Nero levé {B.NERO_2}</p></div>')
    d.full("04_couleurs/accords-de-couleurs.png", section="05 · Accords autorisés")
    rules = [("Trois familles, trois rôles", "Playfair pour les titres et les noms de pièces ; Mona Sans pour le texte et les surtitres ; Geist Mono pour les données."),
             ("Italique = accent", "Une seule partie italique par titre, en fin de phrase : « Out of <i>class.</i> »"),
             ("Surtitres", "Mona Sans chasse 125 %, graisse 500, capitales, interlettrage 30–32 %. Jamais en gras."),
             ("Codes", "Références, prix, tailles, heures, coordonnées : toujours en Geist Mono capitales."),
             ("Remplacement", "Hors polices : Georgia (titres), Helvetica Neue / Arial (texte), Menlo (codes)."),
             ("Licence", "Les trois familles sont sous licence OFL : usage commercial, web et impression libres.")]
    d.title("Typographie", "", "06 · Typographie", inner='<div class="body" style="display:grid;grid-template-columns:1.2fr 1fr;gap:50px">'
            f'<div class="img" style="background-image:url({u("03_typographie/hierarchie-typographique.png")})"></div>'
            '<div class="cols" style="grid-template-columns:1fr 1fr;gap:18px 26px;align-content:start">' + "".join(
                f'<div class="card"><h3 style="font-size:22px">{a}</h3><p>{b}</p></div>' for a, b in rules) + "</div></div>")
    g1 = K.svg_doc(B.gessato_rect("gg1", 0, 0, 340, 420, pitch=18, line=1.4, bg=B.BLU, ink=B.CREMA, opacity=.6), 340, 420)
    g2 = K.svg_doc(B.gessato_rect("gg2", 0, 0, 340, 420, pitch=12, line=1, bg=B.CREMA, ink=B.TALPA, opacity=.9), 340, 420)
    g3 = K.svg_doc(B.gessato_rect("gg3", 0, 0, 340, 420, pitch=10, line=.9, bg=B.GRAFITE, ink=B.CREMA, opacity=.35), 340, 420)
    d.title("Il Gessato", "Fichier source : brand.gessato_pattern() — pas, épaisseur, couleurs et opacité réglables ; le décalage reste d'un demi-pas.", "07 · Gessato",
            inner=f'<div class="body" style="display:grid;grid-template-columns:repeat(3,340px) 1fr;gap:20px">'
                  f'<div style="line-height:0">{g1}<div class="k" style="margin-top:10px">Blu Notte / Crema 55 %</div></div>'
                  f'<div style="line-height:0">{g2}<div class="k" style="margin-top:10px">Crema / Talpa — papier de soie</div></div>'
                  f'<div style="line-height:0">{g3}<div class="k" style="margin-top:10px">Grafite / Crema 35 % — jacquard</div></div>'
                  '<div class="cols" style="gap:18px;align-content:start"><div class="card"><h3>Toujours</h3><p>Rayures verticales, pas constant, une rayure sur neuf décalée. Deux couleurs de la palette, contraste doux.</p></div>'
                  '<div class="card"><h3>Jamais</h3><p>En diagonale, en couleurs vives, sous un logo, ou avec plusieurs rayures décalées par module.</p></div></div></div>')
    # application textile : repères sur l'oversize face et dos
    Mo, sco = GM.canvas_map("oversize")
    pts_f = [("A", Mo(500, 305)), ("B", Mo(596, 318)), ("C", Mo(500, 158))]
    pts_b = [("D", Mo(500, 205)), ("E", Mo(500, 420)), ("F", Mo(220, 470))]
    mk = lambda pts: "".join(f'<div class="mk" style="left:{x / 10:.1f}%;top:{y / 12.5:.1f}%">{l}</div>' for l, (x, y) in pts)
    pl = [("A", "Centre poitrine", "Mot-symbole Ricamo 50–90 mm, ou monogramme 25–32 mm, à 18–20 cm sous l'épaule."),
          ("B", "Poitrine gauche", "Chiave 18–30 mm ou coordonnées Quota."), ("C", "Nuque intérieure", "Étiquette tissée principale 60 × 20 mm + taille."),
          ("D", "Dos, sous la nuque", "Signature « Out of class. » 80–100 mm, à 6 cm du col."),
          ("E", "Dos grand format", "Pièces Statement uniquement : 260–320 mm, centré."), ("F", "Bas de manche / ourlet", "Tab Chiave 40 × 14 mm, cousu dans la couture.")]
    d.title("Application <i>textile.</i>", "Un seul logo visible de face. Les pièces Signature n'en portent jamais deux.", "08 · Textile",
            inner=f'<div class="body" style="display:grid;grid-template-columns:330px 330px 1fr;gap:24px">'
                  f'<div style="position:relative;aspect-ratio:4/5;background:url({u("05_collection/produits/a02-firma-oversize-tee-talpa.jpg")}) center/cover">{mk(pts_f)}</div>'
                  f'<div style="position:relative;aspect-ratio:4/5;background:url({u("05_collection/produits/a02-firma-oversize-tee-talpa-dos.jpg")}) center/cover">{mk(pts_b)}</div>'
                  '<table class="t">' + "".join(f'<tr><td class="mono" style="color:var(--barolo);width:30px">{a}</td><td style="width:170px"><b>{b}</b></td><td>{c}</td></tr>' for a, b, c in pl) + "</table></div>")
    spec = [("Broderie au point plat", "Mot-symbole Ricamo, monogramme. Fil viscose mat ou coton mercerisé. Densité 4,5–5 points/mm. Entoilage déchirable."),
            ("Broderie ton sur ton", "Fil 1 à 2 tons au-dessus ou en dessous du tissu. Jamais de fil métallique brillant."),
            ("Broderie relief", "Fuori / Classe Crewneck : rembourrage mousse 2 mm, satin dense."),
            ("Point de chaînette", "Coordonnées Quota : fil Barolo ou Crema, 1 brin."),
            ("Sérigraphie", "Encre à l'eau pour le ton sur ton ; haute densité pour Departures ; gonflante (puff) pour Chiave Tee."),
            ("Jacquard", "Gessato tissé, pas de 4–6 mm, contraste maximal 40 %."),
            ("Métal", "Laiton brossé (Ottone) : tirettes Chiave, embouts de cordon gravés, boucle de casquette. Pas de chromé.")]
    d.title("Broderie <i>et impression.</i>", "Fichiers brodeur : 02_logo/svg/fc-logo-ricamo-*.svg, fc-monogramme-*.svg, fc-chiave-ricamo-*.svg.", "09 · Techniques",
            inner=f'<div class="body" style="display:grid;grid-template-columns:1fr 1fr;gap:40px"><table class="t">' + "".join(
                f'<tr><td style="width:190px"><b>{a}</b></td><td>{b}</td></tr>' for a, b in spec) + "</table>"
                  f'<div class="img" style="background-image:url({u("02_logo/broderie/logos-brodes-echantillons.png")});background-size:contain;background-repeat:no-repeat;background-color:transparent"></div></div>')
    pk = [("Boîte", "440 × 330 × 110 mm, carton gris 1,5 mm, papier noir teinté masse ; couvercle : mot-symbole en vernis sélectif ; fond Barolo."),
          ("Papier de soie", "Crema, Gessato Talpa ; scellé par l'autocollant Chiave Barolo Ø 40 mm."),
          ("Carte", "150 × 100 mm, 600 g, recto Crema « Grazie. », verso Nero lettre aux membres."),
          ("Hangtag", "50 × 90 mm, noir/crème, cordon Barolo, numéro de série."),
          ("Étiquettes", "Principale 60 × 20 tissée Nero/Crema ; taille 20 × 20 ; composition 30 × 80 ; tab de manche 40 × 14 Barolo."),
          ("Sacs", "Shopping 340 × 420 × 130, papier crème 210 g, anses ruban Barolo ; pochette d'expédition 360 × 460, polyéthylène recyclé noir.")]
    d.title("Étiquetage <i>et packaging.</i>", "Fichiers à plat en millimètres : 07_packaging/fichiers-impression (fonds perdus 3 mm sur les cartes et sacs).", "10 · Packaging",
            inner=f'<div class="body" style="display:grid;grid-template-columns:1fr 1.15fr;gap:40px"><table class="t">' + "".join(
                f'<tr><td style="width:130px"><b>{a}</b></td><td>{b}</td></tr>' for a, b in pk) + "</table>"
                  f'<div class="img" style="background-image:url({u("07_packaging/planche-packaging-a-plat.jpg")})"></div></div>')
    d.title("Photographie", "", "11 · Image", inner='<div class="body" style="display:grid;grid-template-columns:1fr 1.1fr;gap:40px">'
            '<div class="cols" style="grid-template-columns:1fr 1fr;gap:18px 26px;align-content:start">' + "".join(
                f'<div class="card"><h3 style="font-size:22px">{a}</h3><p>{b}</p></div>' for a, b in TX.PHOTO_REGLES) + "</div>"
            f'<div class="img" style="background-image:url({u("06_photographie/rendus-3d/lieu-05-gt-devant-facade.jpg")})"></div></div>')
    ton = "".join(f'<tr><td style="color:var(--barolo);text-decoration:line-through">{a}</td><td class="big" style="font-size:20px">{b}</td></tr>' for a, b in TX.TON["exemples"])
    d.title("Ton <i>de voix.</i>", "Anglais pour les campagnes, italien pour les noms, français (ou la langue du client) pour le service.", "12 · Ton",
            inner='<div class="body" style="display:grid;grid-template-columns:1fr 1.2fr;gap:50px"><div class="cols" style="gap:18px;align-content:start">'
            f'<div class="card"><h3>Nous sommes</h3><ul style="padding-left:16px">{"".join("<li>" + x + "</li>" for x in TX.TON["on_est"])}</ul></div>'
            f'<div class="card"><h3>Nous évitons</h3><ul style="padding-left:16px">{"".join("<li>" + x + "</li>" for x in TX.TON["on_evite"])}</ul></div></div>'
            f'<table class="t"><tr><th>Pas ceci</th><th>Mais cela</th></tr>{ton}</table></div>')
    srules = [("Damier", "Alterner clair et foncé ; jamais deux images de lieu côte à côte."), ("Barolo", "Une publication Barolo par rangée de trois au maximum."),
              ("Logo", "Mot-symbole petit, en haut ou en bas ; jamais au centre d'une photo."), ("Texte", "Une phrase par visuel, en Playfair ; l'heure ou la référence en Geist Mono."),
              ("Stories", "Zones de sécurité : 250 px en haut, 340 px en bas."), ("Avatar", "Chiave Crema sur Nero (02_logo/icones/avatar-reseaux-chiave-1080.png).")]
    d.title("Réseaux <i>sociaux.</i>", "Gabarits : 09_reseaux-sociaux (publications 1080 × 1350, stories 1080 × 1920, à la une, bannières de profils, TikTok).", "13 · Réseaux",
            inner=f'<div class="body" style="display:grid;grid-template-columns:1fr 1.25fr;gap:40px"><div class="cols" style="grid-template-columns:1fr 1fr;gap:18px 26px;align-content:start">' + "".join(
                f'<div class="card"><h3 style="font-size:22px">{a}</h3><p>{b}</p></div>' for a, b in srules) + "</div>"
                  f'<div class="img" style="background-image:url({u("09_reseaux-sociaux/grille-instagram-12-publications.jpg")});background-position:center 20%"></div></div>')
    ui = ('<div style="display:grid;gap:22px;align-content:start"><div style="display:flex;gap:12px;flex-wrap:wrap">'
          '<span class="lab" style="background:var(--nero);color:var(--crema);padding:16px 26px">Ajouter au panier</span>'
          '<span class="lab" style="border:1px solid var(--nero);padding:15px 26px">Guide des tailles</span>'
          '<span class="lab" style="background:var(--barolo);color:var(--crema);padding:16px 26px">Survol</span></div>'
          '<table class="t"><tr><td><b>Fond</b></td><td>Crema ; sections sombres Nero ; images sur Pietra.</td></tr>'
          '<tr><td><b>Boutons</b></td><td>Rectangulaires, sans arrondi ; Nero, survol Barolo.</td></tr>'
          '<tr><td><b>Cartes produit</b></td><td>Image 4:5 sur Pietra, nom en Playfair large, prix en Geist Mono, pastilles de coloris.</td></tr>'
          '<tr><td><b>Mouvement</b></td><td>Fondus de 200–350 ms, survol qui révèle le dos ; aucun effet rebond.</td></tr>'
          '<tr><td><b>Accessibilité</b></td><td>Contraste AA, focus visible Barolo, textes alternatifs, cibles ≥ 44 px.</td></tr></table></div>')
    d.title("Digital", "Maquette complète : 11_site-ecommerce/site (HTML autonome). CSS de la palette et de la typographie : 04_couleurs, 03_typographie.", "14 · Digital",
            inner=f'<div class="body" style="display:grid;grid-template-columns:1fr 1.25fr;gap:40px">{ui}'
                  f'<div class="img" style="background-image:url({u("11_site-ecommerce/apercus/collection-desktop.jpg")});background-position:top"></div></div>')
    files = [("Imprimeur", "02_logo/pdf · 07_packaging/fichiers-impression · 04_couleurs/palette.json"),
             ("Brodeur / atelier", "02_logo/svg (versions Ricamo) · 05_collection/SERIES-A_fiches-produits.pdf · ce guide, pages 08–09"),
             ("Photographe", "06_photographie (direction, liste de plans, prompts-ia.md) · 01_inspiration"),
             ("Développeur web", "11_site-ecommerce/site · 03_typographie/typographie.css · 04_couleurs/palette.css · 02_logo/icones"),
             ("Réseaux sociaux", "09_reseaux-sociaux · 10_brand-story/reseaux-sociaux.md · 02_logo/icones"),
             ("Presse / partenaires", "00_presentation · 10_brand-story · 08_campagne")]
    d.title("Fichiers", "Tout est régénérable : python3 _source/build_all.py.", "15 · Fichiers",
            inner='<div class="body"><table class="t">' + "".join(f'<tr><td style="width:240px"><b>{a}</b></td><td class="mono" style="text-transform:none">{b}</td></tr>' for a, b in files) + "</table></div>")
    d.add(f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">{B.logo_svg("vertical", fill=B.CREMA, width=520)}</div>', dark=True)
    return d


def build():
    jobs = []
    for d, folder, fname in [(presentation(), "00_presentation", "FUORICLASSE_Direction-artistique_v1.0.pdf"),
                             (guide(), "12_guide-de-marque", "FUORICLASSE_Guide-de-marque_v1.0.pdf")]:
        src = K.write(K.TMP / "docs" / f"{folder}.html", d.html())
        jobs.append({"in": src, "out": R / folder / fname, "w": 1600, "h": 900, "pdf": {"width": "1600px", "height": "900px"}})
        # aperçus PNG de quelques pages
        for i in ([0, 3, 10, 14] if folder.startswith("00") else [0, 5, 7, 12]):
            if i < len(d.pages):
                one = K.page(d.pages[i], css=CSS, w=1600, h=900)
                s = K.write(K.TMP / "docs" / f"{folder}-p{i + 1}.html", one)
                jobs.append({"in": s, "out": R / folder / "apercus" / f"page-{i + 1:02d}.jpg", "w": 1600, "h": 900, "quality": 85})
        print(folder, len(d.pages), "pages")
    K.render(jobs)


if __name__ == "__main__":
    build()
