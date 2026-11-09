"""Réseaux sociaux : grille Instagram (12 publications), profil, stories, couvertures à la une,
bannières de profils, direction TikTok."""
import brand as B
import collection as CO
import kit as K
import textes as TX
from build_campaign import CSS, u, R3, CUT, logo

OUT = K.ROOT / "09_reseaux-sociaux"
DET = K.ROOT / "05_collection" / "produits" / "details"
PRD = K.ROOT / "05_collection" / "produits"
W, H = 1080, 1350


def page(inner, bg=B.NERO, color=B.CREMA, w=W, h=H):
    return f'<div class="f grain" style="--w:{w}px;--h:{h}px;background:{bg};color:{color}">{inner}</div>'


def foot(color=B.CREMA, left="Series A", right="fuoriclasse"):
    return (f'<div style="position:absolute;left:64px;right:64px;bottom:56px;display:flex;justify-content:space-between;color:{color}" class="lb">'
            f'<span style="font-size:13px">{left}</span><span style="font-size:13px">{right}</span></div>')


# --------------------------------------------------------------- gabarits de publication
def t_photo(img, line=None, pos="center"):
    return page(f'<div class="ph" style="background-image:url({u(img)});background-position:{pos}"></div><div class="shade"></div>'
                f'{logo(W / 2, 64, 300, anchor="tc")}'
                + (f'<div class="hl" style="position:absolute;left:64px;bottom:120px;font-size:96px">{line}</div>' if line else "")
                + foot() + '<div class="intent" style="font-size:10px">Rendu 3D d\'intention</div>')


def t_product(cut, bg, name, ref, color=B.CREMA, price=None):
    return page(f'<div class="cut" style="left:70px;right:70px;top:150px;bottom:170px;background-image:url({u(cut)})"></div>'
                f'<div class="mn" style="position:absolute;left:64px;top:64px;font-size:14px;opacity:.7">{ref}</div>'
                f'{logo(W - 64, 66, 230, fill=color, anchor="tr")}'
                f'<div style="position:absolute;left:64px;right:64px;bottom:64px;display:flex;justify-content:space-between;align-items:flex-end">'
                f'<div class="wide" style="font-size:24px">{name}</div><div class="mn" style="font-size:16px">{price or ""}</div></div>',
                bg=bg, color=color)


def t_quote(text, bg=B.NERO, color=B.CREMA, size=120):
    return page(f'<div class="hl" style="position:absolute;left:70px;right:70px;top:50%;transform:translateY(-50%);font-size:{size}px">{text}</div>'
                f'<div style="position:absolute;left:64px;top:64px">{B.logo_svg("key", fill=color, width=74)}</div>' + foot(color), bg=bg, color=color)


def t_hours(time, title, cut, bg=B.CREMA, color=B.NERO):
    return page(f'<div class="cut" style="left:150px;right:30px;top:330px;bottom:110px;background-image:url({u(cut)})"></div>'
                f'<div class="mn" style="position:absolute;left:64px;top:60px;font-size:150px;letter-spacing:-.02em;color:var(--barolo)">{time}</div>'
                f'<div class="hl" style="position:absolute;left:64px;top:240px;font-size:64px">{title}</div>'
                + foot(color, "Office Hours", "Series A"), bg=bg, color=color)


def t_detail(img, cap):
    return page(f'<div class="ph" style="background-image:url({u(img)})"></div>'
                f'<div style="position:absolute;left:0;right:0;bottom:0;height:200px;background:linear-gradient(0deg,rgba(14,13,12,.7),rgba(14,13,12,0))"></div>'
                f'<div class="mn" style="position:absolute;left:64px;bottom:64px;font-size:16px">{cap}</div>')


def t_pattern():
    g = K.svg_doc(B.gessato_rect("ig", 0, 0, W, H, pitch=26, line=2, bg=B.BLU, ink=B.CREMA, opacity=.5), W, H)
    return page(f'<div style="position:absolute;inset:0">{g}</div>'
                f'<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:var(--blu-notte);padding:60px 70px">'
                f'{B.logo_svg("key", fill=B.CREMA, width=260)}</div>'
                f'<div class="mn" style="position:absolute;left:64px;bottom:60px;font-size:15px">IL GESSATO — UNE RAYURE SUR NEUF SORT DU RANG</div>', bg=B.BLU)


def t_number():
    return page(f'<div class="lb" style="position:absolute;left:64px;top:70px;font-size:14px;color:var(--talpa)">The first round</div>'
                f'<div class="mn" style="position:absolute;left:50px;right:50px;top:50%;transform:translateY(-55%);font-size:250px;letter-spacing:-.04em;text-align:center">0001</div>'
                f'<div class="mn" style="position:absolute;left:0;right:0;top:63%;text-align:center;font-size:40px;color:var(--talpa)">/ 1000</div>'
                f'<div class="hl" style="position:absolute;left:64px;right:64px;bottom:110px;font-size:44px;text-align:center">Series A. <i>Raised on ambition.</i></div>'
                + foot(B.CREMA, "17 pièces", "1000 exemplaires chacune"), bg=B.BAROLO)


def t_story_line(text, sub, bg):
    return page(f'{logo(W / 2, 80, 280, anchor="tc")}<div class="hl" style="position:absolute;left:64px;right:64px;top:40%;text-align:center;font-size:110px">{text}</div>'
                f'<div class="lb" style="position:absolute;left:0;right:0;top:66%;text-align:center;font-size:14px;opacity:.75">{sub}</div>', bg=bg)


def posts():
    """Les 12 premières publications, dans l'ordre de la grille (de haut en bas, de gauche à droite)."""
    P = [
        ("01-out-of-class", t_photo(R3 / "lieu-01-penthouse-heure-bleue.jpg", "Out of<br><i>class.</i>", "65% center")),
        ("02-attico-zip-jacket", t_product(CUT / "a07-attico-zip-jacket-blu-notte.png", B.CREMA, "Attico Zip Jacket", "FC-A07-BN", B.NERO, "€ 420")),
        ("03-quiet-class", t_quote("Success doesn't<br><i>raise its voice.</i>", size=104)),
        ("04-detail-broderie", t_detail(DET / "a04-monogramme-et-col.jpg", "FIRMA CREWNECK — MONOGRAMME BRODÉ 32 MM")),
        ("05-office-hours-0930", t_hours("09:30", "Board <i>meeting.</i>", CUT / "a06-consiglio-polo-cioccolato.png")),
        ("06-salle-du-conseil", t_photo(R3 / "lieu-03-salle-du-conseil.jpg", None)),
        ("07-gessato", t_pattern()),
        ("08-departures", t_product(CUT / "a14-departures-hoodie-blu-notte-dos.png", B.BLU, "Departures Hoodie", "FC-A14-BN", B.CREMA, "€ 260")),
        ("09-series-a-0001", t_number()),
        ("10-rooftop", t_photo(R3 / "lieu-04-rooftop.jpg", "Never out<br><i>of place.</i>")),
        ("11-fuori-classe", t_product(CUT / "a16-fuori-classe-crewneck-barolo.png", B.CIOCC, "Fuori / Classe Crewneck", "FC-A16-BA", B.CREMA, "€ 240")),
        ("12-detail-departures", t_detail(DET / "a14-tableau-departures.jpg", "DEPARTURES — SÉRIGRAPHIE HAUTE DENSITÉ")),
    ]
    return P


def stories():
    S = []
    w, h = 1080, 1920
    for n, (j, txt) in enumerate([("J-3", "The first<br><i>round.</i>"), ("J-2", "Seventeen<br><i>pieces.</i>"), ("J-1", "One<br><i>thousand each.</i>")]):
        S.append((f"story-0{n + 1}-compte-a-rebours-{j.lower()}", page(
            f'{logo(w / 2, 150, 300, anchor="tc")}<div class="mn" style="position:absolute;left:0;right:0;top:30%;text-align:center;font-size:200px;color:var(--barolo)">{j}</div>'
            f'<div class="hl" style="position:absolute;left:80px;right:80px;top:50%;text-align:center;font-size:120px">{txt}</div>'
            f'<div class="lb" style="position:absolute;left:0;right:0;bottom:260px;text-align:center;font-size:15px;opacity:.7">Series A — Collezione 01</div>',
            bg=[B.NERO, B.BLU, B.CIOCC][n], w=w, h=h)))
    S.append(("story-04-lancement-now-live", page(
        f'<div class="ph" style="background-image:url({u(R3 / "lieu-01-penthouse-heure-bleue.jpg")});background-position:62% center"></div><div class="shade"></div>'
        f'{logo(w / 2, 150, 300, anchor="tc")}<div class="hl" style="position:absolute;left:80px;bottom:520px;font-size:150px">Now<br><i>live.</i></div>'
        f'<div style="position:absolute;left:0;right:0;bottom:300px;text-align:center"><span class="lb cta" style="font-size:20px;background:var(--crema);color:var(--nero);border-color:var(--crema)">Shop Series A</span></div>'
        f'<div class="intent" style="font-size:11px;bottom:140px">Rendu 3D d\'intention</div>', w=w, h=h)))
    S.append(("story-05-produit", page(
        f'<div class="cut" style="left:60px;right:60px;top:380px;bottom:520px;background-image:url({u(CUT / "a03-firma-hoodie-nero.png")})"></div>'
        f'<div class="mn" style="position:absolute;left:70px;top:170px;font-size:18px;opacity:.7">FC-A03-HD-NE</div>'
        f'<div class="wide" style="position:absolute;left:70px;top:210px;font-size:42px">Firma Hoodie</div>'
        f'<div class="hl" style="position:absolute;left:70px;bottom:420px;font-size:52px;max-width:800px"><i>Recognised at one metre. Not at ten.</i></div>'
        f'<div style="position:absolute;left:70px;right:70px;bottom:260px;border:1px dashed rgba(239,233,222,.4);height:110px;display:flex;align-items:center;justify-content:center" class="mn">'
        f'<span style="font-size:15px;opacity:.6">ZONE AUTOCOLLANT PRODUIT</span></div>', bg=B.GRAFITE, w=w, h=h)))
    S.append(("story-06-question-aux-fondateurs", page(
        f'<div style="position:absolute;inset:0;opacity:.25">{K.svg_doc(B.gessato_rect("sq", 0, 0, w, h, pitch=26, line=1.6, bg="none", ink=B.NERO, opacity=.4), w, h)}</div>'
        f'{logo(w / 2, 150, 300, fill=B.NERO, anchor="tc")}<div class="hl" style="position:absolute;left:80px;right:80px;top:30%;font-size:96px;text-align:center">Ask the<br><i>founders.</i></div>'
        f'<div style="position:absolute;left:120px;right:120px;top:52%;height:300px;background:var(--crema);box-shadow:0 20px 50px rgba(0,0,0,.15);border-radius:28px;display:flex;align-items:center;justify-content:center" class="mn">'
        f'<span style="font-size:16px;color:var(--talpa)">ZONE AUTOCOLLANT QUESTION</span></div>'
        f'<div class="lb" style="position:absolute;left:0;right:0;bottom:240px;text-align:center;font-size:14px">Chaque vendredi · 18:00</div>',
        bg=B.PIETRA, color=B.NERO, w=w, h=h)))
    return S


def highlights():
    """Couvertures des stories à la une (1080 × 1920, motif au centre du cercle)."""
    w, h = 1080, 1920
    items = [("series-a", B.NERO, f'<span class="hl" style="font-size:520px;color:var(--crema)">A</span>'),
             ("office-hours", B.BLU, f'<span class="mn" style="font-size:250px;color:var(--crema)">09:30</span>'),
             ("departures", B.CIOCC, f'<span class="mn" style="font-size:420px;color:var(--crema)">1A</span>'),
             ("membres", B.BAROLO, B.logo_svg("monogram", fill=B.CREMA, height=400)),
             ("entretien", B.PIETRA, B.logo_svg("key", fill=B.NERO, width=700))]
    out = []
    for n, bg, inner in items:
        out.append((f"a-la-une-{n}", page(f'<div style="position:absolute;left:50%;top:50%;width:1080px;height:1080px;transform:translate(-50%,-50%);'
                                          f'border-radius:50%;display:flex;align-items:center;justify-content:center">{inner}</div>', bg=bg, w=w, h=h)))
    return out


def profile(P):
    """Maquette du profil Instagram (écran de téléphone)."""
    thumbs = "".join(f'<div style="aspect-ratio:4/5;background:url({u(OUT / "publications" / (n + ".jpg"))}) center/cover"></div>' for n, _ in P)
    hl = "".join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><div style="width:62px;height:62px;border-radius:50%;'
                 f'border:1px solid #ccc;padding:3px"><div style="width:100%;height:100%;border-radius:50%;background:url({u(OUT / "a-la-une" / (n + ".jpg"))}) center/cover"></div></div>'
                 f'<span style="font-size:11px">{t}</span></div>'
                 for n, t in [("a-la-une-series-a", "Series A"), ("a-la-une-office-hours", "Office Hours"), ("a-la-une-departures", "Departures"),
                              ("a-la-une-membres", "Membres"), ("a-la-une-entretien", "Entretien")])
    bio = TX.INSTAGRAM["bio"].replace("\n", "<br>")
    avatar = u(K.ROOT / "02_logo" / "icones" / "avatar-reseaux-chiave-1080.png")
    body = f"""<div style="width:430px;height:932px;background:#fff;color:#111;font-family:-apple-system,'Mona Sans',sans-serif;overflow:hidden">
<div style="display:flex;justify-content:space-between;padding:16px 18px 6px;font-size:14px;font-weight:600"><span>9:41</span><span>●●● ▮</span></div>
<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 16px;font-weight:700;font-size:20px"><span>fuoriclasse ✓</span><span style="font-size:20px">⊕ ≡</span></div>
<div style="display:flex;align-items:center;gap:22px;padding:10px 16px">
<div style="width:86px;height:86px;border-radius:50%;background:url({avatar}) center/cover;flex:none"></div>
<div style="display:flex;gap:22px;text-align:center;font-size:13px"><div><b style="font-size:17px">12</b><br>publications</div><div><b style="font-size:17px">48,2 k</b><br>abonnés</div><div><b style="font-size:17px">31</b><br>abonnements</div></div></div>
<div style="padding:4px 16px;font-size:13px;line-height:1.4"><b>FUORICLASSE</b><br><span style="color:#777">Marque de vêtements</span><br>{bio}<br><span style="color:#00376b">fuoriclasse.com</span></div>
<div style="display:flex;gap:6px;padding:10px 16px"><div style="flex:1;background:#efefef;border-radius:8px;text-align:center;padding:7px;font-size:13px;font-weight:600">Suivre</div>
<div style="flex:1;background:#efefef;border-radius:8px;text-align:center;padding:7px;font-size:13px;font-weight:600">Message</div><div style="flex:1;background:#efefef;border-radius:8px;text-align:center;padding:7px;font-size:13px;font-weight:600">Boutique</div></div>
<div style="display:flex;gap:14px;padding:6px 16px 12px">{hl}</div>
<div style="display:flex;justify-content:space-around;border-top:1px solid #eee;padding:10px 0;font-size:18px"><span>▦</span><span style="color:#aaa">▷</span><span style="color:#aaa">◎</span></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px">{thumbs}</div></div>"""
    return body


def tiktok():
    """Direction TikTok : quatre formats, cadres 9:16 avec zones de sécurité."""
    w, h = 1080, 1920
    frames = [
        (TX.TIKTOK[0], f'<div class="ph" style="background-image:url({u(R3 / "lieu-02-bureau-panoramique.jpg")});background-position:40% center"></div>'
                       f'<div class="mn" style="position:absolute;left:80px;top:330px;font-size:180px;line-height:1;color:var(--crema)">06:12</div>'
                       f'<div class="hl" style="position:absolute;left:80px;top:540px;font-size:72px;max-width:760px">Before the market <i>opens.</i></div>'),
        (TX.TIKTOK[1], f'<div style="position:absolute;inset:0;background:linear-gradient(180deg,#1e2430,#0e0d0c)"></div>'
                       f'<div class="cut" style="left:120px;right:120px;top:520px;bottom:520px;background-image:url({u(CUT / "a17-gessato-hoodie-blu-notte.png")})"></div>'
                       f'<div class="mn" style="position:absolute;right:90px;top:300px;font-size:120px;color:var(--ottone)">31</div>'
                       f'<div class="lb" style="position:absolute;right:90px;top:450px;font-size:18px">Étage</div>'),
        (TX.TIKTOK[2], f'<div class="ph" style="background-image:url({u(K.ROOT / "07_packaging/rendus-3d/packaging-02-boite-ouverte.jpg")})"></div>'
                       f'<div class="mn" style="position:absolute;left:0;right:0;top:300px;text-align:center;font-size:44px;color:var(--nero)">N° 0347 / 1000</div>'),
        (TX.TIKTOK[3], f'<div class="ph" style="background-image:url({u(K.ROOT / "07_packaging/rendus-3d/packaging-03-sac-et-pochette.jpg")});background-position:55% center"></div>'
                       f'<div style="position:absolute;left:80px;right:80px;bottom:600px;background:rgba(14,13,12,.82);padding:40px">'
                       f'<div class="hl" style="font-size:56px">What’s in the <i>bag.</i></div><div class="mn" style="font-size:22px;margin-top:14px;opacity:.7">FOUNDER EDITION · EP. 01</div></div>'),
    ]
    cells = []
    for i, (t, inner) in enumerate(frames):
        safe = ('<div style="position:absolute;left:0;right:0;top:0;height:220px;border-bottom:2px dashed rgba(255,80,80,.55)"></div>'
                '<div style="position:absolute;left:0;right:0;bottom:0;height:420px;border-top:2px dashed rgba(255,80,80,.55)"></div>'
                '<div style="position:absolute;right:0;top:220px;bottom:420px;width:150px;border-left:2px dashed rgba(255,80,80,.55)"></div>')
        fr = page(inner + safe + f'{logo(w / 2, 260, 260, anchor="tc")}', w=w, h=h)
        cells.append((f"tiktok-0{i + 1}", fr, t))
    return cells


def board_tiktok(cells):
    items = "".join(f'<div><div style="width:100%;aspect-ratio:9/16;background:url({u(OUT / "tiktok" / (n + ".jpg"))}) center/cover;border-radius:22px;'
                    f'border:6px solid #111"></div><div class="mn" style="font-size:11px;color:var(--barolo);margin:14px 0 6px">{t["duree"]}</div>'
                    f'<div class="hl" style="font-size:26px">{t["titre"]}</div><p style="font-size:12.5px;line-height:1.5;color:var(--grafite);margin-top:6px">{t["script"]}</p></div>'
                    for n, _, t in cells)
    rules = ["Le son d'abord : matières, pas de tendance sonore saturée.", "Horodatage en Geist Mono, titres en Playfair, sous-titres Mona Sans.",
             "Lumière du lieu + flash direct, comme en photo.", "Zones de sécurité respectées (pointillés) : rien d'important sous 420 px.",
             "Une idée par vidéo, 10 à 30 s, fin sur le mot-symbole 1 s."]
    rl = "".join(f"<li>{r}</li>" for r in rules)
    body = (f'<div style="width:1800px;height:980px;background:var(--crema);color:var(--nero);padding:56px 60px;display:grid;grid-template-columns:330px 1fr;gap:50px">'
            f'<div><div class="lb" style="font-size:11px;color:var(--talpa)">Direction artistique TikTok</div>'
            f'<h1 class="hl" style="font-size:58px;margin:12px 0 26px">Natif, <i>pas bavard.</i></h1>'
            f'<ul style="font-size:14px;line-height:1.6;padding-left:18px">{rl}</ul></div>'
            f'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:28px">{items}</div></div>')
    return K.page(body, css=CSS, w=1800, h=980)


def banners():
    out = []
    for name, w, h in [("linkedin-1584x396", 1584, 396), ("x-1500x500", 1500, 500), ("youtube-2560x1440", 2560, 1440)]:
        if name.startswith("youtube"):
            inner = (f'<div class="ph" style="background-image:url({u(R3 / "lieu-04-rooftop.jpg")})"></div><div class="shade" style="background:rgba(14,13,12,.45)"></div>'
                     f'<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center">{B.logo_svg("wordmark", fill=B.CREMA, width=900)}'
                     f'<div class="lb" style="font-size:22px;margin-top:40px">The new generation of success</div></div>')
        else:
            g = K.svg_doc(B.gessato_rect("bn" + name[:2], 0, 0, w, h, pitch=18, line=1.2, bg=B.BLU, ink=B.CREMA, opacity=.35), w, h)
            inner = (f'<div style="position:absolute;inset:0">{g}</div><div style="position:absolute;right:0;top:0;bottom:0;width:58%;background:var(--blu-notte)"></div>'
                     f'<div style="position:absolute;right:8%;top:50%;transform:translateY(-50%);text-align:right">{B.logo_svg("wordmark", fill=B.CREMA, width=w * .32)}'
                     f'<div class="hl" style="font-size:{h * .1}px;margin-top:{h * .06}px"><i>Out of class. Never out of place.</i></div></div>')
        out.append((name, page(inner, w=w, h=h), w, h))
    return out


def build():
    jobs = []
    P = posts()
    for n, html in P:
        src = K.write(K.TMP / "social" / f"{n}.html", K.page(html, css=CSS, w=W, h=H))
        jobs.append({"in": src, "out": OUT / "publications" / f"{n}.jpg", "w": W, "h": H, "quality": 90})
    for n, html in stories():
        src = K.write(K.TMP / "social" / f"{n}.html", K.page(html, css=CSS, w=1080, h=1920))
        jobs.append({"in": src, "out": OUT / "stories" / f"{n}.jpg", "w": 1080, "h": 1920, "quality": 90})
    for n, html in highlights():
        src = K.write(K.TMP / "social" / f"{n}.html", K.page(html, css=CSS, w=1080, h=1920))
        jobs.append({"in": src, "out": OUT / "a-la-une" / f"{n}.jpg", "w": 1080, "h": 1920, "quality": 90})
    cells = tiktok()
    for n, html, _ in cells:
        src = K.write(K.TMP / "social" / f"{n}.html", K.page(html, css=CSS, w=1080, h=1920))
        jobs.append({"in": src, "out": OUT / "tiktok" / f"{n}.jpg", "w": 1080, "h": 1920, "quality": 88})
    for n, html, w, h in banners():
        src = K.write(K.TMP / "social" / f"banner-{n}.html", K.page(html, css=CSS, w=w, h=h))
        jobs.append({"in": src, "out": OUT / "bannieres" / f"{n}.jpg", "w": w, "h": h, "quality": 90})
    K.render(jobs)
    # planches : grille, profil, TikTok
    grid = "".join(f'<div style="aspect-ratio:4/5;background:url({u(OUT / "publications" / (n + ".jpg"))}) center/cover"></div>' for n, _ in P)
    gb = (f'<div style="width:1600px;height:2790px;background:var(--crema);padding:60px 70px"><div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:34px">'
          f'<div><div class="lb" style="font-size:12px;color:var(--talpa)">Grille Instagram — les 12 premières publications</div>'
          f'<h1 class="hl" style="font-size:64px;margin-top:10px">Un rythme, <i>pas un catalogue.</i></h1></div>'
          f'<p style="max-width:560px;font-size:15px;color:var(--grafite)">Alternance clair / foncé en damier, une image de lieu, un produit, une phrase, un détail. '
          f'Une couleur signature (Barolo) au centre de la grille, jamais deux fois sur la même ligne.</p></div>'
          f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">{grid}</div></div>')
    s1 = K.write(K.TMP / "social" / "grid.html", K.page(gb, css=CSS, w=1600, h=2790))
    s2 = K.write(K.TMP / "social" / "profile.html", K.page(profile(P), w=430, h=932))
    s3 = K.write(K.TMP / "social" / "tiktok-board.html", board_tiktok(cells))
    piliers = "".join(f'<div style="border-top:1px solid var(--crema-2);padding-top:12px"><div class="hl" style="font-size:28px">{a} <span class="mn" style="font-size:14px;color:var(--barolo)">{b}</span></div>'
                      f'<p style="font-size:13px;color:var(--grafite);margin-top:6px">{c}</p></div>' for a, b, c in TX.INSTAGRAM["piliers"])
    caps = "".join(f'<div class="mn" style="font-size:12px;line-height:1.6;padding:14px 16px;background:#fff8;white-space:pre-line">{c}</div>' for c in TX.INSTAGRAM["legendes"])
    ub = (f'<div style="width:1600px;height:1000px;background:var(--crema);color:var(--nero);padding:56px 64px;display:grid;grid-template-columns:1fr 1fr;gap:60px">'
          f'<div><div class="lb" style="font-size:11px;color:var(--talpa)">Univers Instagram</div><h1 class="hl" style="font-size:58px;margin:12px 0 30px">Quatre piliers, <i>un ton.</i></h1>'
          f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px 30px">{piliers}</div>'
          f'<div class="mn" style="margin-top:30px;font-size:12px;line-height:1.7;white-space:pre-line;padding:18px;border:1px solid var(--crema-2)">{TX.INSTAGRAM["bio"]}</div></div>'
          f'<div><div class="lb" style="font-size:11px;color:var(--talpa);margin-bottom:16px">Légendes types</div><div style="display:grid;gap:10px">{caps}</div>'
          f'<p style="font-size:13px;color:var(--grafite);margin-top:18px">Trois hashtags au maximum, toujours les mêmes : {TX.INSTAGRAM["hashtags"]}. Pas d\'émoji, sauf ✓ et → dans les stories.</p></div></div>')
    s4 = K.write(K.TMP / "social" / "univers.html", K.page(ub, css=CSS, w=1600, h=1000))
    K.render([{"in": s1, "out": OUT / "grille-instagram-12-publications.jpg", "w": 1600, "h": 2790, "quality": 90},
              {"in": s2, "out": OUT / "profil-instagram-telephone.png", "w": 430, "h": 932, "scale": 3},
              {"in": s3, "out": OUT / "direction-tiktok.jpg", "w": 1800, "h": 980, "scale": 1.3, "quality": 90},
              {"in": s4, "out": OUT / "univers-instagram.jpg", "w": 1600, "h": 1000, "scale": 1.5, "quality": 90}])


if __name__ == "__main__":
    build()
