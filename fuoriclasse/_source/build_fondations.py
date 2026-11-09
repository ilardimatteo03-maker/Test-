"""Palette (fichiers d'échange + planche) et système typographique (planche + CSS)."""
import json
import struct

import brand as B
import kit as K

PAL = K.ROOT / "04_couleurs"
TYP = K.ROOT / "03_typographie"

USAGE = {"Crema": 38, "Nero Assoluto": 30, "Talpa": 9, "Grafite": 8, "Blu Notte": 7, "Cioccolato": 5, "Barolo": 3}
SUPPORT = [("Ottone", B.OTTONE, "Laiton brossé — accessoires métal, dorure à chaud, jamais en aplat"),
           ("Pietra", B.PIETRA, "Travertin — fonds photo, intérieur des boîtes"),
           ("Crema ombrée", B.CREMA_2, "Filets et séparateurs sur fond Crema"),
           ("Nero levé", B.NERO_2, "Cartes et encarts sur fond Nero")]


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _ase(colors):
    """Adobe Swatch Exchange (RVB, global)."""
    blocks = b""
    for name, hx in colors:
        nm = (name + "\0").encode("utf-16-be")
        r, g, b = (c / 255 for c in rgb(hx))
        body = struct.pack(">H", len(name) + 1) + nm + b"RGB " + struct.pack(">fffH", r, g, b, 0)
        blocks += struct.pack(">HI", 0x0001, len(body)) + body
    return b"ASEF" + struct.pack(">HHI", 1, 0, len(colors)) + blocks


def palette_files():
    PAL.mkdir(parents=True, exist_ok=True)
    data = {"marque": [], "support": []}
    for n, hx, role, cmyk in B.PALETTE:
        data["marque"].append({"nom": n, "hex": hx, "rvb": rgb(hx), "cmjn_indicatif": cmyk, "role": role,
                               "part_conseillee_pct": USAGE[n]})
    for n, hx, role in SUPPORT:
        data["support"].append({"nom": n, "hex": hx, "rvb": rgb(hx), "role": role})
    data["note"] = ("CMJN indicatifs pour papier couché : à valider sur épreuve chez l'imprimeur. Pour le textile, "
                    "faire teindre d'après les références TCX/TPX choisies sur nuancier physique, à partir des HEX.")
    (PAL / "palette.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    slug = lambda n: n.lower().replace(" ", "-").replace("é", "e")
    css = "/* FUORICLASSE — palette */\n:root{\n" + "".join(
        f"  --fc-{slug(n)}: {hx};\n" for n, hx, *_ in B.PALETTE) + "".join(
        f"  --fc-{slug(n)}: {hx};\n" for n, hx, _ in SUPPORT) + "}\n"
    (PAL / "palette.css").write_text(css, encoding="utf-8")
    allc = [(n, hx) for n, hx, *_ in B.PALETTE] + [(n, hx) for n, hx, _ in SUPPORT]
    (PAL / "palette.ase").write_bytes(_ase(allc))
    gpl = "GIMP Palette\nName: FUORICLASSE\nColumns: 7\n#\n" + "".join(
        f"{r:3d} {g:3d} {b:3d}\t{n}\n" for n, hx in allc for r, g, b in [rgb(hx)])
    (PAL / "palette.gpl").write_text(gpl, encoding="utf-8")


def palette_board():
    cols = ""
    for n, hx, role, cmyk in B.PALETTE:
        r, g, b = rgb(hx)
        light = sum(rgb(hx)) > 450
        fg = B.NERO if light else B.CREMA
        sig = n == "Barolo"
        cols += (f'<div class="sw" style="background:{hx};color:{fg};flex:{USAGE[n] + 9};min-width:170px;{'outline:1px solid var(--crema-2);outline-offset:-1px;' if n == 'Crema' else ''}">'
                 f'<div class="top">{"<span class=sig>SIGNATURE</span>" if sig else ""}</div>'
                 f'<div class="nm serif">{n}</div>'
                 f'<div class="mono codes">{hx}<br>RVB {r} {g} {b}<br>CMJN {" ".join(map(str, cmyk))}</div>'
                 f'<div class="role">{role}</div><div class="pct mono">{USAGE[n]} %</div></div>')
    sup = "".join(f'<div class="sp"><i style="background:{hx}"></i><div><b>{n}</b> <span class="mono">{hx}</span><br>{role}</div></div>'
                  for n, hx, role in SUPPORT)
    css = """
.wrap{width:1600px;height:1000px;display:flex;flex-direction:column;background:var(--crema)}
.head{padding:48px 64px 28px;display:flex;justify-content:space-between;align-items:flex-end}
.head h1{font-size:56px;line-height:1}
.head p{max-width:560px;font-size:14px;color:var(--grafite)}
.row{display:flex;height:640px;margin:0 64px}
.sw{position:relative;padding:22px 18px;display:flex;flex-direction:column;gap:10px}
.sw .top{height:22px}
.sig{font-family:'Mona Sans';font-stretch:125%;font-size:9px;letter-spacing:.3em;border:1px solid currentColor;padding:4px 7px}
.nm{font-size:30px;line-height:1.05;margin-top:auto}
.codes{font-size:11px;line-height:1.6;opacity:.85}
.role{font-size:12px;line-height:1.45;opacity:.85;min-height:52px}
.pct{position:absolute;bottom:20px;right:16px;font-size:11px;opacity:.7}
.sup{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin:26px 64px 0;font-size:12px;line-height:1.45;color:var(--grafite)}
.sp{display:flex;gap:12px}.sp i{width:38px;height:38px;flex:none;border:1px solid rgba(0,0,0,.08)}
.sp b{font-weight:600;color:var(--nero)}
"""
    body = (f'<div class="wrap"><div class="head"><div><div class="lab" style="color:var(--talpa)">Palette — Modern Wealth Culture</div>'
            f'<h1 class="serif" style="margin-top:12px">Sept couleurs, <i>une seule voix.</i></h1></div>'
            f'<p>Des neutres de tailleur — le noir d\'une veste de smoking, le crème d\'une chemise, le taupe d\'un cachemire, '
            f'le chocolat d\'un cuir, le bleu nuit d\'un costume — et une seule couleur signature, Barolo, réservée aux détails. '
            f'La largeur de chaque colonne donne la part conseillée dans un support.</p></div>'
            f'<div class="row">{cols}</div><div class="sup">{sup}</div></div>')
    src = K.write(K.TMP / "fond" / "palette.html", K.page(body, css=css, w=1600, h=1000))
    # accords de couleurs
    pairs = [(B.CREMA, B.NERO, "Crema / Nero", "Le classique : fond, texte."),
             (B.NERO, B.CREMA, "Nero / Crema", "Soirée, packaging, digital."),
             (B.BLU, B.CREMA, "Blu Notte / Crema", "Costume, nuit, voyage."),
             (B.CIOCC, B.PIETRA, "Cioccolato / Pietra", "Cuir, bois, café d'hôtel."),
             (B.TALPA, B.CREMA, "Talpa / Crema", "Cachemire, jour, douceur."),
             (B.CREMA, B.BAROLO, "Crema / Barolo", "Le détail signature."),
             (B.BAROLO, B.CREMA, "Barolo / Crema", "Ruban, doublure, carte."),
             (B.GRAFITE, B.CREMA, "Grafite / Crema", "Bureau, béton, acier.")]
    tiles = "".join(f'<div style="background:{bg};color:{fg};padding:26px;display:flex;flex-direction:column;justify-content:space-between">'
                    f'<div class="lab" style="opacity:.8">{lab}</div>{B.logo_svg("monogram", fill=fg, height=70)}'
                    f'<div style="font-size:13px;opacity:.85">{txt}</div></div>' for bg, fg, lab, txt in pairs)
    body2 = (f'<div style="width:1600px;height:1000px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr">{tiles}</div>')
    src2 = K.write(K.TMP / "fond" / "accords.html", K.page(body2, w=1600, h=1000))
    return [{"in": src, "out": PAL / "planche-palette.png", "w": 1600, "h": 1000, "scale": 1.5},
            {"in": src2, "out": PAL / "accords-de-couleurs.png", "w": 1600, "h": 1000, "scale": 1.5}]


TYPE_CSS = """
/* FUORICLASSE — système typographique (polices OFL du dossier polices/) */
:root{
  --fc-serif:'Playfair',Georgia,'Times New Roman',serif;
  --fc-sans:'Mona Sans','Helvetica Neue',Arial,sans-serif;
  --fc-mono:'Geist Mono',ui-monospace,Menlo,monospace;
}
.fc-display{font-family:var(--fc-serif);font-variation-settings:'opsz' 900;font-weight:400;font-size:clamp(48px,7vw,112px);line-height:.98;letter-spacing:-.01em}
.fc-display em{font-style:italic}
.fc-titre{font-family:var(--fc-serif);font-variation-settings:'opsz' 600;font-weight:400;font-size:clamp(32px,4vw,56px);line-height:1.05}
.fc-capitales{font-family:var(--fc-serif);font-stretch:112.5%;font-variation-settings:'opsz' 30;font-weight:420;letter-spacing:.14em;text-transform:uppercase}
.fc-surtitre{font-family:var(--fc-sans);font-stretch:125%;font-weight:500;font-size:11px;letter-spacing:.32em;text-transform:uppercase}
.fc-texte{font-family:var(--fc-sans);font-weight:400;font-size:16px;line-height:1.6}
.fc-legende{font-family:var(--fc-sans);font-weight:400;font-size:13px;line-height:1.5}
.fc-code{font-family:var(--fc-mono);font-weight:400;font-size:12px;letter-spacing:.04em;text-transform:uppercase}
"""


def type_files():
    (TYP / "typographie.css").write_text(TYPE_CSS, encoding="utf-8")


def type_board():
    css = """
.w{width:1600px;height:1000px;display:grid;grid-template-columns:1fr 1fr 1fr;background:var(--crema)}
.c{padding:56px 48px;border-right:1px solid var(--crema-2);display:flex;flex-direction:column;gap:18px}
.c:last-child{border:0}
.big{font-size:220px;line-height:.9}
.use{margin-top:auto;border-top:1px solid var(--crema-2);padding-top:22px}
.meta{font-size:13px;line-height:1.55;color:var(--grafite)}
.chars{font-size:26px;line-height:1.35;word-break:break-all}
.k{font-family:'Geist Mono';font-size:11px;letter-spacing:.1em;color:var(--talpa)}
"""
    body = f"""<div class="w">
<div class="c"><div class="k">01 — TITRES · PLAYFAIR</div><div class="big serif">Aa</div>
<div class="serif" style="font-size:44px;line-height:1.02">The new generation <i>of success.</i></div>
<div class="wide" style="font-size:20px">Firma Hoodie</div>
<div class="chars serif">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz <i>0123456789 &amp; €</i></div>
<p class="meta">Claus Eggers Sørensen, licence OFL. Variable : optique 5–1200, chasse 87,5–112,5 %, graisse 300–900. Le mot-symbole en est dessiné.
Optique 900 pour les titres, italique pour l'accent ; capitales larges (chasse 112,5 %, optique 30) pour les noms de pièces.</p>
<div class="use"><div class="k" style="margin-bottom:14px">EN USAGE — TITRE DE CAMPAGNE</div><div class="serif" style="font-size:64px;line-height:.95">Quiet <i>class.</i></div></div></div>
<div class="c"><div class="k">02 — TEXTE &amp; SURTITRES · MONA SANS</div><div class="big" style="font-weight:420">Aa</div>
<div class="lab" style="font-size:13px">Series A — Collezione 01</div>
<p style="font-size:17px;line-height:1.6">FUORICLASSE habille ceux qui construisent. Des pièces sobres, coupées pour la réunion du matin comme pour le vol du soir.</p>
<div class="chars" style="font-weight:420">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</div>
<p class="meta">GitHub, licence OFL. Variable : chasse 75–125 %, graisse 200–900. Texte courant en 400 (chasse 100 %) ;
surtitres en capitales, chasse 125 %, graisse 500, interlettrage 32 %. Jamais de gras au-delà de 600.</p>
<div class="use"><div class="k" style="margin-bottom:14px">EN USAGE — INTERFACE</div>
<div style="display:flex;gap:12px;align-items:center"><span class="lab" style="background:var(--nero);color:var(--crema);padding:16px 26px">Ajouter au panier</span>
<span class="lab" style="border:1px solid var(--nero);padding:15px 26px">Guide des tailles</span></div></div></div>
<div class="c"><div class="k">03 — CODES · GEIST MONO</div><div class="big mono" style="font-weight:380">Aa</div>
<div class="mono" style="font-size:15px;line-height:1.9">FC-A01-HD-NE<br>480 G/M² · 100 % COTON PEIGNÉ<br>MILANO 45.4642 N 9.1900 E<br>€ 240,00 TVAC</div>
<div class="chars mono" style="font-size:22px">ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 ·/—€%</div>
<p class="meta">Vercel, licence OFL. Pour tout ce qui se lit comme une donnée : références, prix, compositions, coordonnées, heures, numéros de série.
La culture d'entreprise par le détail — une étiquette se lit comme une fiche technique.</p>
<div class="use"><div class="k" style="margin-bottom:14px">EN USAGE — ÉTIQUETTE DE COMPOSITION</div>
<div class="mono" style="font-size:12px;line-height:1.8;display:grid;grid-template-columns:120px 1fr"><span style="color:var(--talpa)">RÉF.</span><span>FC-A03-HD-CI</span>
<span style="color:var(--talpa)">MATIÈRE</span><span>100 % COTON PEIGNÉ, 480 G/M²</span><span style="color:var(--talpa)">ORIGINE</span><span>TISSÉ ET CONFECTIONNÉ AU PORTUGAL</span>
<span style="color:var(--talpa)">SÉRIE</span><span>SERIES A — 0347 / 1000</span></div></div></div></div>"""
    src = K.write(K.TMP / "fond" / "typo.html", K.page(body, css=css, w=1600, h=1000))
    # hiérarchie
    body2 = """<div style="width:1600px;height:1000px;padding:64px 80px;background:var(--nero);color:var(--crema);display:grid;grid-template-columns:300px 1fr;gap:0 48px;align-content:start">
<div class="k">HIÉRARCHIE</div><div></div>
<div class="k" style="padding-top:40px">DISPLAY — PLAYFAIR 400, OPTIQUE 900<br>96–140 PX · INTERLIGNE 0,98</div>
<div class="serif" style="font-size:112px;line-height:.98;padding-top:28px">Built <i>beyond</i><br>the ordinary.</div>
<div class="k" style="padding-top:34px">TITRE — PLAYFAIR 400, OPTIQUE 600<br>40–56 PX</div>
<div class="serif" style="font-size:48px;line-height:1.05;padding-top:26px">Out of class. <i>Never out of place.</i></div>
<div class="k" style="padding-top:30px">NOM DE PIÈCE — PLAYFAIR LARGE<br>CAPITALES, +14 %</div>
<div class="wide" style="font-size:26px;padding-top:26px">Attico Zip Jacket</div>
<div class="k" style="padding-top:30px">SURTITRE — MONA SANS 125 %<br>500, CAPITALES, +32 %</div>
<div class="lab" style="font-size:13px;padding-top:30px">Series A · Business Culture</div>
<div class="k" style="padding-top:28px">TEXTE — MONA SANS 400<br>16–18 PX · INTERLIGNE 1,6</div>
<p style="font-size:18px;line-height:1.6;max-width:760px;padding-top:24px;opacity:.9">Une veste zippée en laine technique, coupée près du corps, avec un col cheminée et une tirette en laiton gravée de la Chiave.</p>
<div class="k" style="padding-top:28px">CODE — GEIST MONO 400<br>11–13 PX, CAPITALES</div>
<div class="mono" style="font-size:13px;padding-top:28px;opacity:.85">FC-A07-ZJ-BN · LAINE 92 % ÉLASTHANNE 8 % · € 420,00</div>
</div>"""
    css2 = ".k{font-family:'Geist Mono';font-size:10.5px;letter-spacing:.1em;line-height:1.6;color:var(--talpa)}"
    src2 = K.write(K.TMP / "fond" / "typo2.html", K.page(body2, css=css + css2, w=1600, h=1000))
    return [{"in": src, "out": TYP / "planche-typographie.png", "w": 1600, "h": 1000, "scale": 1.5},
            {"in": src2, "out": TYP / "hierarchie-typographique.png", "w": 1600, "h": 1000, "scale": 1.5}]


def build():
    palette_files()
    type_files()
    K.render(palette_board() + type_board())


if __name__ == "__main__":
    build()
