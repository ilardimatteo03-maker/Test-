"""Campagnes : concepts, campagne de lancement « Out of Class » déclinée, direction photo, film.

Les zones photo utilisent les rendus 3D d'intention (06_photographie/rendus-3d) et les détourages
produits : à remplacer par la photographie de campagne (liste de plans dans 06_photographie).
"""
import brand as B
import kit as K
import textes as TX

OUT = K.ROOT / "08_campagne"
PH = K.ROOT / "06_photographie"
R3 = PH / "rendus-3d"
CUT = K.ROOT / "05_collection" / "detourages"


def u(p):
    return p.as_uri()


CSS = """
.f{position:relative;overflow:hidden;width:var(--w);height:var(--h);color:var(--crema)}
.ph{position:absolute;inset:0;background-size:cover;background-position:center}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,13,12,.35) 0%,rgba(14,13,12,0) 30%,rgba(14,13,12,0) 50%,rgba(14,13,12,.78) 100%)}
.hl{font-family:'Playfair';font-variation-settings:'opsz' 900;font-weight:400;line-height:.95;letter-spacing:-.01em}
.hl i{font-style:italic}
.lb{font-family:'Mona Sans';font-stretch:125%;font-weight:500;text-transform:uppercase;letter-spacing:.3em}
.mn{font-family:'Geist Mono';letter-spacing:.06em;text-transform:uppercase}
.intent{position:absolute;right:1.4%;bottom:1.1%;font-family:'Geist Mono';font-size:9px;letter-spacing:.08em;opacity:.45;text-transform:uppercase}
.cut{position:absolute;background-size:contain;background-repeat:no-repeat;background-position:center}
.cta{display:inline-block;border:1px solid currentColor;padding:.9em 1.6em}
"""


def frame(w, h, inner, bg=B.NERO, color=B.CREMA):
    return f'<div class="f grain" style="--w:{w}px;--h:{h}px;background:{bg};color:{color}">{inner}</div>'


def logo(x, y, width, fill=B.CREMA, lk="wordmark", anchor="tl"):
    _, (vw, vh) = B.lockup(lk)
    h = width * vh / vw
    tx = {"l": 0, "c": -width / 2, "r": -width}[anchor[1]]
    ty = {"t": 0, "c": -h / 2, "b": -h}[anchor[0]]
    return (f'<div style="position:absolute;left:{x}px;top:{y}px;transform:translate({tx}px,{ty}px);line-height:0">'
            f'{B.logo_svg(lk, fill=fill, width=width)}</div>')


def job(name, html, w, h, scale=1, folder=None, jpg=True):
    src = K.write(K.TMP / "camp" / f"{name}.html", K.page(html, css=CSS, w=w, h=h))
    out = (folder or OUT) / f"{name}.{'jpg' if jpg else 'png'}"
    return {"in": src, "out": out, "w": w, "h": h, "scale": scale, "quality": 90}


# ------------------------------------------------------------------ lancement « Out of Class »
def launch():
    J = []
    # Affiches 120 × 176 (proportion) — 1200 × 1760 px
    W, H = 1200, 1760
    J.append(job("lancement/affiche-01-out-of-class-120x176", frame(W, H,
        f'<div class="ph" style="background-image:url({u(R3 / "lieu-01-penthouse-heure-bleue.jpg")});background-position:68% center"></div>'
        f'<div class="shade"></div>{logo(W / 2, 80, 420, anchor="tc")}'
        f'<div style="position:absolute;left:80px;right:80px;bottom:200px"><div class="hl" style="font-size:190px">Out of<br>class.</div>'
        f'<div class="hl" style="font-size:72px;margin-top:26px"><i>Never out of place.</i></div></div>'
        f'<div style="position:absolute;left:80px;right:80px;bottom:80px;display:flex;justify-content:space-between" class="lb">'
        f'<span style="font-size:16px">Series A — Collezione 01</span><span style="font-size:16px">fuoriclasse.com</span></div>'
        f'<div class="intent">Visuel d\'intention — rendu 3D, photo à produire</div>'), W, H))
    J.append(job("lancement/affiche-02-first-to-board-120x176", frame(W, H,
        f'<div class="cut" style="left:80px;right:80px;top:330px;bottom:250px;background-image:url({u(CUT / "a14-departures-hoodie-blu-notte-dos.png")})"></div>'
        f'{logo(W / 2, 80, 420, anchor="tc")}'
        f'<div style="position:absolute;left:80px;top:170px" class="hl"><span style="font-size:150px">First to <i>board.</i></span></div>'
        f'<div style="position:absolute;left:80px;right:80px;bottom:80px;display:flex;justify-content:space-between;align-items:flex-end">'
        f'<div><div class="lb" style="font-size:16px">Departures Hoodie</div><div class="mn" style="font-size:16px;margin-top:10px;opacity:.7">FC-A14 · MILANO 08:40 → DUBAI 21:50</div></div>'
        f'<span class="lb" style="font-size:16px">fuoriclasse.com</span></div>', bg=B.BLU), W, H))
    J.append(job("lancement/affiche-03-never-out-of-place-120x176", frame(W, H,
        f'<div class="cut" style="left:60px;right:60px;top:300px;bottom:230px;background-image:url({u(CUT / "a16-fuori-classe-crewneck-barolo.png")})"></div>'
        f'{logo(W / 2, 80, 420, anchor="tc")}'
        f'<div style="position:absolute;left:80px;top:170px" class="hl"><span style="font-size:132px">Never out <i>of place.</i></span></div>'
        f'<div style="position:absolute;left:80px;right:80px;bottom:80px;display:flex;justify-content:space-between;align-items:flex-end">'
        f'<div><div class="lb" style="font-size:16px">Fuori / Classe Crewneck</div><div class="mn" style="font-size:16px;margin-top:10px;opacity:.7">FC-A16 · BRODERIE RELIEF</div></div>'
        f'<span class="lb" style="font-size:16px">fuoriclasse.com</span></div>', bg=B.CIOCC), W, H))
    # 4 × 3 — 2400 × 1800
    W, H = 2400, 1800
    J.append(job("lancement/affichage-4x3-rooftop", frame(W, H,
        f'<div class="ph" style="background-image:url({u(R3 / "lieu-04-rooftop.jpg")})"></div>'
        f'<div class="shade" style="background:linear-gradient(90deg,rgba(14,13,12,.75) 0%,rgba(14,13,12,.2) 50%,rgba(14,13,12,0) 70%)"></div>'
        f'{logo(130, 120, 560)}'
        f'<div style="position:absolute;left:130px;bottom:330px" class="hl"><div style="font-size:300px">Out of class.</div>'
        f'<div style="font-size:110px;margin-top:36px"><i>Never out of place.</i></div></div>'
        f'<div style="position:absolute;left:130px;bottom:130px" class="lb"><span style="font-size:26px">Series A — fuoriclasse.com</span></div>'
        f'<div class="intent" style="font-size:14px">Visuel d\'intention — rendu 3D, photo à produire</div>'), W, H, scale=1))
    # Double page magazine 460 × 300 mm — 2300 × 1500
    W, H = 2300, 1500
    J.append(job("lancement/double-page-magazine-460x300", frame(W, H,
        f'<div class="ph" style="right:50%;background-image:url({u(R3 / "lieu-03-salle-du-conseil.jpg")});background-position:40% center"></div>'
        f'<div style="position:absolute;left:50%;top:0;right:0;bottom:0;background:var(--crema);color:var(--nero)"></div>'
        f'<div class="cut" style="left:50%;right:0;top:120px;bottom:420px;background-image:url({u(CUT / "a07-attico-zip-jacket-blu-notte.png")})"></div>'
        f'<div style="position:absolute;left:calc(50% + 110px);right:110px;bottom:110px;color:var(--nero)">'
        f'<div class="hl" style="font-size:96px">Dressed for the board.<br><i>And for what comes after.</i></div>'
        f'<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px">'
        f'<div><div class="lb" style="font-size:15px">Attico Zip Jacket — Blu Notte</div><div class="mn" style="font-size:15px;margin-top:10px;color:var(--talpa)">MÉRINOS TECHNIQUE 340 G/M² · TIRETTE CHIAVE EN LAITON · € 420</div></div>'
        f'{B.logo_svg("wordmark", fill=B.NERO, width=300)}</div></div>'
        f'<div style="position:absolute;left:110px;top:110px">{B.logo_svg("key", fill=B.CREMA, width=120)}</div>'
        f'<div class="intent" style="right:auto;left:1.2%;font-size:12px">Visuel d\'intention — rendu 3D</div>'), W, H))
    # Bannières (affichées en x2)
    banners = [(300, 250), (728, 90), (160, 600), (970, 250), (320, 100), (300, 600)]
    for w, h in banners:
        land = w / h > 2.5
        tall = h / w > 2
        size_hl = min(w, h) * (0.16 if not land else 0.36)
        if land:
            inner = (f'<div style="position:absolute;left:{h * .4}px;top:50%;transform:translateY(-50%)">{B.logo_svg("wordmark", fill=B.CREMA, height=max(10, h * .14))}</div>'
                     f'<div class="hl" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:{h * .38}px;white-space:nowrap">Out of class. <i>Never out of place.</i></div>'
                     f'<div class="lb cta" style="position:absolute;right:{h * .3}px;top:50%;transform:translateY(-50%);font-size:{max(7, h * .09)}px">Series A</div>')
            if w < 500:
                inner = (f'<div style="position:absolute;left:{h * .25}px;top:50%;transform:translateY(-50%)">{B.logo_svg("key", fill=B.CREMA, height=h * .34)}</div>'
                         f'<div class="hl" style="position:absolute;left:{h * 1.2}px;top:50%;transform:translateY(-50%);font-size:{h * .3}px;white-space:nowrap">Out of <i>class.</i></div>'
                         f'<div class="lb cta" style="position:absolute;right:{h * .2}px;top:50%;transform:translateY(-50%);font-size:{h * .085}px">Series A</div>')
        else:
            prod = "a07-attico-zip-jacket-blu-notte.png" if not tall else "a14-departures-hoodie-blu-notte-dos.png"
            inner = (f'<div class="cut" style="left:6%;right:6%;top:{30 if tall else 22}%;bottom:{30 if tall else 30}%;background-image:url({u(CUT / prod)})"></div>'
                     f'<div style="position:absolute;left:0;right:0;top:{h * .06}px;display:flex;justify-content:center">{B.logo_svg("wordmark", fill=B.CREMA, width=w * .62)}</div>'
                     f'<div class="hl" style="position:absolute;left:8%;right:8%;top:{h * (.13 if tall else .16)}px;text-align:center;font-size:{size_hl}px">Out of <i>class.</i></div>'
                     f'<div style="position:absolute;left:0;right:0;bottom:{h * .06}px;text-align:center"><span class="lb cta" style="font-size:{max(7, w * .03)}px">Découvrir Series A</span></div>')
        J.append(job(f"lancement/banniere-{w}x{h}", frame(w, h, inner, bg=B.BLU if not land else B.NERO), w, h, scale=2))
    # Publicités sociales
    W, H = 1080, 1350
    J.append(job("lancement/pub-sociale-feed-office-hours-1080x1350", frame(W, H,
        f'<div class="cut" style="left:90px;right:90px;top:250px;bottom:190px;background-image:url({u(CUT / "a07-attico-zip-jacket-blu-notte.png")})"></div>'
        f'<div class="mn" style="position:absolute;left:70px;top:70px;font-size:96px;letter-spacing:0;color:var(--barolo)">09:30</div>'
        f'<div class="hl" style="position:absolute;left:70px;top:190px;font-size:62px">Board <i>meeting.</i></div>'
        f'{logo(W - 70, 84, 260, fill=B.NERO, anchor="tr")}'
        f'<div style="position:absolute;left:70px;right:70px;bottom:70px;display:flex;justify-content:space-between;align-items:center">'
        f'<span class="lb" style="font-size:14px">Attico Zip Jacket · € 420</span><span class="lb cta" style="font-size:13px">Acheter</span></div>',
        bg=B.CREMA, color=B.NERO), W, H))
    W, H = 1080, 1920
    J.append(job("lancement/pub-sociale-story-out-of-class-1080x1920", frame(W, H,
        f'<div class="ph" style="background-image:url({u(R3 / "lieu-02-bureau-panoramique.jpg")});background-position:46% center"></div>'
        f'<div class="shade"></div>{logo(W / 2, 150, 380, anchor="tc")}'
        f'<div style="position:absolute;left:80px;right:80px;bottom:430px"><div class="hl" style="font-size:170px">Out of<br><i>class.</i></div></div>'
        f'<div style="position:absolute;left:0;right:0;bottom:250px;text-align:center"><span class="lb cta" style="font-size:20px;background:var(--crema);color:var(--nero);border-color:var(--crema)">Shop Series A</span></div>'
        f'<div class="intent" style="font-size:12px;bottom:120px">Visuel d\'intention — rendu 3D</div>'), W, H))
    # Manifeste
    W, H = 1200, 1700
    lines = "".join(f'<div style="font-size:{"54px" if i else "112px"};margin-bottom:{"10px" if i else "56px"};{"font-style:italic;" if i >= len(TX.MANIFESTE) - 2 else ""}">{l}</div>'
                    for i, l in enumerate(TX.MANIFESTE))
    J.append(job("lancement/manifeste-no-ordinary-class", frame(W, H,
        f'<div style="position:absolute;inset:0;opacity:.18">{K.svg_doc(B.gessato_rect("mg", 0, 0, W, H, pitch=22, line=1.2, bg="none", ink=B.CREMA, opacity=.6), W, H)}</div>'
        f'<div class="hl" style="position:absolute;left:100px;right:100px;top:140px;line-height:1.08">{lines}</div>'
        f'{logo(100, H - 150, 360)}<div class="mn" style="position:absolute;right:100px;bottom:150px;font-size:14px;opacity:.6">MANIFESTO · SERIES A</div>'), W, H))
    return J


def film():
    """Film 30 s « Out of Class » : storyboard en 6 plans."""
    frames = [("00:00", "lieu-02-bureau-panoramique.jpg", "06:12. La ville s'allume encore. Zip de l'Attico, en gros plan.", "Son : le zip, puis le silence."),
              ("00:05", "lieu-03-salle-du-conseil.jpg", "09:30. La salle du conseil. Elle s'assoit la dernière ; personne ne parle avant elle.", "Titre : Out of class."),
              ("00:11", None, "13:15. Café de l'hôtel. Les mains, la tasse, le carnet Barolo.", "Plan serré, 85 mm."),
              ("00:16", "lieu-05-gt-devant-facade.jpg", "19:45. La GT devant la façade. La clé tourne dans la main.", "La Chiave, en écho."),
              ("00:22", "lieu-04-rooftop.jpg", "21:30. Rooftop. Les amis, la ville, la même tenue depuis le matin.", "Titre : Never out of place."),
              ("00:27", None, "Mot-symbole FUORICLASSE sur noir. « Series A — fuoriclasse.com »", "Son : une respiration.")]
    cells = ""
    for t, img, act, note in frames:
        pic = (f'<div style="aspect-ratio:16/9;background:url({u(R3 / img)}) center/cover"></div>' if img else
               f'<div style="aspect-ratio:16/9;background:var(--nero);display:flex;align-items:center;justify-content:center">'
               f'{B.logo_svg("wordmark" if t == "00:27" else "key", fill=B.CREMA, width=260 if t == "00:27" else 90)}</div>')
        cells += (f'<div>{pic}<div class="mn" style="font-size:12px;color:var(--barolo);margin:14px 0 6px">{t}</div>'
                  f'<div style="font-size:15px;line-height:1.45">{act}</div><div style="font-size:13px;color:var(--talpa);margin-top:6px">{note}</div></div>')
    body = (f'<div style="width:1600px;height:1000px;background:var(--crema);color:var(--nero);padding:56px 64px">'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:34px"><div>'
            f'<div class="lb" style="font-size:11px;color:var(--talpa)">Film de lancement · 30 s · 16:9 et 9:16</div>'
            f'<h1 class="hl" style="font-size:60px;margin-top:10px">Out of class — <i>one day, one outfit.</i></h1></div>'
            f'<p style="max-width:470px;font-size:14px;color:var(--grafite)">Une journée, une tenue, cinq décors. Pas de voix off : des sons de matières, '
            f'un horodatage en caractères mono. Montage sec, flash direct, grain 400 ISO.</p></div>'
            f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px 28px">{cells}</div></div>')
    return [job("film-30s-storyboard", body, 1600, 1000, scale=1.5)]


def concepts():
    cols = ""
    vis = ["lieu-01-penthouse-heure-bleue.jpg", None, "lieu-02-bureau-panoramique.jpg", None, None]
    for i, c in enumerate(TX.CAMPAGNES):
        if i == 1:
            v = f'<div style="height:300px;background:url({u(K.ROOT / "05_collection/produits/details/a01-broderie-mot-symbole.jpg")}) center/cover"></div>'
        elif i == 3:
            v = f'<div style="height:300px;background:url({u(K.ROOT / "05_collection/produits/details/a14-tableau-departures.jpg")}) center/cover"></div>'
        elif i == 4:
            v = (f'<div style="height:300px;background:var(--nero);display:flex;align-items:center;justify-content:center">'
                 f'<span class="hl" style="font-size:64px;color:var(--crema)">Series <i>A</i></span></div>')
        else:
            v = f'<div style="height:300px;background:url({u(R3 / vis[i])}) center/cover"></div>'
        tit = "".join(f"<li>{t}</li>" for t in c["titres"][:3])
        cols += (f'<div style="display:flex;flex-direction:column;gap:14px">{v}<div class="mn" style="font-size:11px;color:var(--talpa)">0{i + 1} · {c["role"]}</div>'
                 f'<div class="hl" style="font-size:40px">{c["nom"]}</div><div class="hl" style="font-size:20px;color:var(--barolo)"><i>{c["ligne"]}</i></div>'
                 f'<p style="font-size:13px;line-height:1.5;color:var(--grafite)">{c["idee"]}</p>'
                 f'<ul style="font-size:12px;line-height:1.6;padding-left:16px;color:var(--nero)">{tit}</ul></div>')
    body = (f'<div style="width:1800px;height:960px;background:var(--crema);color:var(--nero);padding:56px 60px">'
            f'<div class="lb" style="font-size:11px;color:var(--talpa)">Campagnes de communication</div>'
            f'<h1 class="hl" style="font-size:64px;margin:10px 0 34px">Cinq campagnes, <i>une seule culture.</i></h1>'
            f'<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:30px">{cols}</div></div>')
    return [job("concepts-de-campagne", body, 1800, 960, scale=1.4)]


# ------------------------------------------------------------------ direction photo
def photo_direction():
    J = []
    rules = "".join(f'<div style="border-top:1px solid var(--crema-2);padding-top:14px"><div class="hl" style="font-size:28px">{t}</div>'
                    f'<p style="font-size:13.5px;line-height:1.55;color:var(--grafite);margin-top:8px">{d}</p></div>' for t, d in TX.PHOTO_REGLES)
    body = (f'<div style="width:1600px;height:1000px;background:var(--crema);color:var(--nero);display:grid;grid-template-columns:1fr 1fr">'
            f'<div style="background:url({u(R3 / "lieu-05-gt-devant-facade.jpg")}) 55% center/cover;position:relative">'
            f'<div class="intent" style="color:var(--crema)">Rendu 3D d\'intention</div></div>'
            f'<div style="padding:56px 60px"><div class="lb" style="font-size:11px;color:var(--talpa)">Direction photographique</div>'
            f'<h1 class="hl" style="font-size:58px;margin:12px 0 30px">Flash direct, <i>tons naturels.</i></h1>'
            f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px 34px">{rules}</div></div></div>')
    J.append(job("direction-photographique", body, 1600, 1000, scale=1.5, folder=PH))
    # Liste de plans : 9 scènes en deux planches
    cards = []
    for s in TX.SCENES:
        if s["rendu"]:
            pic = f'<div style="height:230px;background:url({u(R3 / (s["rendu"] + ".jpg"))}) center/cover"></div>'
        else:
            pic = (f'<div style="height:230px;position:relative;background:var(--pietra);overflow:hidden">'
                   f'{K.svg_doc(B.gessato_rect("sc" + s["n"], 0, 0, 600, 230, pitch=16, line=1, bg=B.PIETRA, ink=B.TALPA, opacity=.5), 600, 230)}'
                   f'<div class="mn" style="position:absolute;left:16px;bottom:14px;font-size:11px;color:var(--grafite)">Repérage à faire</div></div>')
        cards.append(f'<div style="background:#fff7;display:flex;flex-direction:column">{pic}<div style="padding:18px 20px">'
                     f'<div class="mn" style="font-size:11px;color:var(--barolo)">SCÈNE {s["n"]}</div>'
                     f'<div class="hl" style="font-size:28px;margin:6px 0 10px">{s["titre"]}</div>'
                     f'<div style="font-size:12.5px;line-height:1.5"><b>Lieu.</b> {s["lieu"]}<br><b>Pièces.</b> {s["pieces"]}<br>'
                     f'<b>Plan.</b> {s["plan"]}<br><b>Lumière.</b> {s["lumiere"]}</div></div></div>')
    for k, chunk in enumerate([cards[:5], cards[5:]]):
        body = (f'<div style="width:1800px;height:1100px;background:var(--crema);color:var(--nero);padding:50px 56px">'
                f'<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:28px"><div>'
                f'<div class="lb" style="font-size:11px;color:var(--talpa)">Liste de plans — campagne Series A · {k + 1}/2</div>'
                f'<h1 class="hl" style="font-size:52px;margin-top:10px">{"Neuf scènes," if k == 0 else "Une journée,"} <i>{"une seule tenue d’esprit." if k == 0 else "cinq villes."}</i></h1></div>'
                f'<p style="max-width:520px;font-size:13px;color:var(--grafite)">Les vignettes sont des rendus 3D d\'intention : ils fixent le décor, '
                f'la lumière et le cadrage. Les invites pour générateur d\'images figurent dans <span class="mn">prompts-ia.md</span>.</p></div>'
                f'<div style="display:grid;grid-template-columns:repeat({len(chunk)},1fr);gap:20px">{"".join(chunk)}</div></div>')
        J.append(job(f"liste-de-plans-{k + 1}", body, 1800, 1100, scale=1.4, folder=PH))
    md = ["# FUORICLASSE — invites pour générateur d'images\n",
          "Ces invites (en anglais) servent à produire des esquisses de campagne avec un générateur d'images, "
          "avant la séance photo réelle. Elles décrivent décor, tenue, lumière et cadrage de chaque scène. "
          "Les images générées restent des intentions : ne pas les publier comme photos de campagne, et ne jamais "
          "les présenter comme des personnes réelles.\n",
          "Paramètres conseillés : format 4:5 ou 2:3, style photographique, sans texte ni logo dans l'image "
          "(les logos sont ajoutés ensuite en mise en page).\n"]
    for s in TX.SCENES:
        md.append(f"## Scène {s['n']} — {s['titre']}\n\n- **Lieu** : {s['lieu']}\n- **Pièces** : {s['pieces']}\n"
                  f"- **Plan** : {s['plan']}\n- **Lumière** : {s['lumiere']}\n\n```\n{s['prompt']}\n```\n")
    K.write(PH / "prompts-ia.md", "\n".join(md))
    return J


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    K.render(launch() + film() + concepts() + photo_direction())


if __name__ == "__main__":
    build()
