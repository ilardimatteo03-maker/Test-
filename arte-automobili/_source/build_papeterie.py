"""Papeterie : carte de visite (85 × 55 mm + 3 mm de fonds perdus), papier à en-tête A4,
carte de remerciement A6, autocollants. Fichiers SVG en millimètres (texte vivant)
+ PDF vectoriels (polices incorporées) via Chromium."""
import json
import subprocess
from pathlib import Path

from kit import A, B, G, N, ROOT, TR, V, font_css, linea, logo_g, opera, rect, text

OUT = ROOT / "08_papeterie"
PT = 0.3528  # 1 pt en mm
BL = 3.0     # fonds perdus


def svg_mm(w, h, body, bleed=BL):
    W, H = w + 2 * bleed, h + 2 * bleed
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-bleed} {-bleed} {W} {H}" '
            f'width="{W}mm" height="{H}mm">{body}</svg>')


def pt(v):
    return v * PT


# ---------------------------------------------------------------- carte de visite
CW, CH = 85.0, 55.0
CLY = CH * 0.618


def card_recto():
    body = rect(-BL, -BL, CW + 2 * BL, CH + 2 * BL, N)
    body += logo_g("monogramme", CW / 2, CH / 2 + 0.6, height=21, fill=B, anchor="cc")
    return svg_mm(CW, CH, body)


def card_verso(name="Prénom Nom", role="Fondateur · Detailer", phone="+33 6 00 00 00 00",
               mail="prenom@arteautomobili.fr", web="arteautomobili.fr", addr="Atelier sur rendez-vous"):
    m = 7.0
    body = rect(-BL, -BL, CW + 2 * BL, CH + 2 * BL, V)
    body += logo_g("logo-secondaire", m, m, width=21, fill=B)
    body += text(m, CLY - 8.2, role, pt(5.2), "archivo", 600, B, ls=0.22, stretch=125, upper=True, opacity=0.72)
    body += text(m, CLY - 2.6, name, pt(11), "bodoni", 400, B)
    body += linea(-BL, CLY, CW + BL, B, 0.15, 0.55)
    s = pt(6.2)
    body += text(m, CLY + 6.4, [phone, mail], s, "mono", 400, B, lh=1.55)
    body += text(CW / 2 + 4, CLY + 6.4, [web, addr], s, "mono", 400, B, lh=1.55)
    return svg_mm(CW, CH, body)


# ---------------------------------------------------------------- papier à en-tête
AW, AH = 210.0, 297.0


def letterhead(sample=True):
    m = 20.0
    body = rect(0, 0, AW, AH, "#FFFFFF")
    body += logo_g("logo-principal", m, 18, height=11.5, fill=N)
    body += text(AW - m, 23.4, "Atelier de detailing", pt(6.5), "archivo", 600, N, ls=0.2, stretch=125,
                 anchor="end", upper=True, opacity=0.7)
    body += text(AW - m, 28.4, "Sur rendez-vous", pt(7), "mono", 400, N, anchor="end", opacity=0.7, upper=True)
    body += linea(m, 40, AW - m, N, 0.2)
    if sample:
        body += text(110, 58, ["M. Julien Martin", "12, rue des Ateliers", "75000 Ville"], pt(10), "archivo", 400, N, lh=1.45)
        body += text(m, 92, "Ville, le 17 octobre 2026", pt(9), "mono", 400, N, opacity=0.75)
        body += text(m, 100, "Réf. Opera N° 0147", pt(9), "mono", 400, N, opacity=0.75)
        body += text(m, 116, "Objet : confirmation de votre rendez-vous", pt(10), "archivo", 600, N)
        para = ["Monsieur,", "",
                "Nous vous confirmons la prise en charge de votre véhicule le mardi 21 octobre à 9 h 00",
                "pour une correction de vernis en deux étapes, suivie de l'application d'une protection",
                "céramique. Le véhicule restera trois jours à l'atelier : la céramique demande une",
                "polymérisation complète avant toute exposition à la pluie.", "",
                "Nous vous remettrons à la restitution la fiche de votre Opera, avec le détail des",
                "interventions et le calendrier d'entretien conseillé.", "",
                "Nous vous prions d'agréer, Monsieur, l'expression de nos salutations distinguées."]
        body += text(m, 130, para, pt(10), "archivo", 400, N, lh=1.55)
        body += text(m, 228, "Prénom Nom", pt(13), "bodoni", 400, N)
        body += text(m, 234, "Fondateur", pt(6.5), "archivo", 600, N, ls=0.2, stretch=125, upper=True, opacity=0.7)
    body += linea(m, 272, AW - m, N, 0.2)
    foot = "Arte Automobili · [forme juridique] au capital de [—] € · SIRET [—] · TVA [—]"
    body += text(m, 278, foot, pt(6.5), "mono", 400, N, opacity=0.65)
    body += text(m, 282.5, "[Adresse de l'atelier] · +33 6 00 00 00 00 · contact@arteautomobili.fr · arteautomobili.fr",
                 pt(6.5), "mono", 400, N, opacity=0.65)
    body += logo_g("monogramme-micro", AW - m, 282.8, height=6, fill=N, anchor="br")
    return svg_mm(AW, AH, body, bleed=0)


# ---------------------------------------------------------------- carte de remerciement A6
TW, TH = 148.0, 105.0


def thanks_recto():
    body = rect(-BL, -BL, TW + 2 * BL, TH + 2 * BL, V)
    ly = TH * 0.618
    body += text(TW / 2, ly - 8, "Grazie.", 15, "bodoni", 400, B, italic=True, anchor="middle")
    body += linea(-BL, ly, TW + BL, B, 0.2, 0.5)
    body += logo_g("monogramme", TW / 2, ly + 9, height=17, fill=B, anchor="tc")
    return svg_mm(TW, TH, body)


def thanks_verso():
    m = 12.0
    body = rect(-BL, -BL, TW + 2 * BL, TH + 2 * BL, B)
    body += opera(m, 22, "0147", 11, N, N)
    rows = [("Restitué le", "24.10.2026"), ("Prestations", "Correction 2 étapes · Céramique 5 ans"),
            ("Prochain contrôle", "Avril 2027 — entretien de la céramique")]
    for i, (k, v) in enumerate(rows):
        y = 34 + i * 7.2
        body += text(m, y, k, pt(6.5), "mono", 400, N, ls=0.06, upper=True, opacity=0.6)
        body += text(m + 38, y, v, pt(8.5), "archivo", 400, N)
    ly = TH * 0.618
    body += linea(m, ly + 4, TW - m, N, 0.2)
    body += text(m, ly + 14, "Un mot de l'atelier", pt(6.5), "archivo", 600, N, ls=0.2, stretch=125, upper=True, opacity=0.6)
    for i in range(2):
        body += linea(m, ly + 24 + i * 9, TW - m - 34, TR, 0.25)
    body += logo_g("logo-secondaire", TW - m, TH - 9, width=22, fill=N, anchor="br")
    return svg_mm(TW, TH, body)


# ---------------------------------------------------------------- autocollants
def sticker_round():
    d = 60.0
    body = (f'<circle cx="{d / 2}" cy="{d / 2}" r="{d / 2 + BL}" fill="{N}"/>'
            + logo_g("monogramme", d / 2, d / 2 + 0.5, height=26, fill=B, anchor="cc"))
    return svg_mm(d, d, body)


def sticker_windscreen():
    """Vitrophanie intérieure (lecture à travers le pare-brise) posée après une céramique."""
    w, h = 70.0, 24.0
    body = rect(0, 0, w, h, N) + logo_g("monogramme-simplifie", 6, h / 2, height=13, fill=B, anchor="cl")
    body += text(19, 9.2, "Protection céramique", pt(8.5), "bodoni", 400, B)
    body += text(19, 14.2, "Appliquée par Arte Automobili", pt(4.8), "archivo", 600, B, ls=0.1, stretch=125, upper=True, opacity=0.75)
    body += text(19, 19.0, "10.2026 · Opera N° 0147 · Entretien 04.2027", pt(5.0), "mono", 400, B, opacity=0.75)
    return svg_mm(w, h, body, bleed=0)


def sticker_rect():
    w, h = 90.0, 22.0
    body = rect(-BL, -BL, w + 2 * BL, h + 2 * BL, B) + logo_g("logo-horizontal", w / 2, h / 2 + 1.3, height=9.5, fill=N, anchor="cc")
    return svg_mm(w, h, body)


def render(pages, out_pdf, w_mm, h_mm):
    """Assemble des SVG (une page chacun) en un PDF vectoriel au format exact."""
    html = OUT / f"_tmp_pdf_{out_pdf.stem}.html"
    css = font_css("../03_typographie/polices")
    body = "".join(f'<section>{p}</section>' for p in pages)
    html.write_text(f"<!doctype html><meta charset=utf-8><style>{css}@page{{size:{w_mm}mm {h_mm}mm;margin:0}}"
                    f"html,body{{margin:0}}section{{width:{w_mm}mm;height:{h_mm}mm;overflow:hidden;break-after:page}}"
                    f"section svg{{display:block;width:{w_mm}mm;height:{h_mm}mm}}</style>{body}")
    return {"in": str(html), "out": str(out_pdf), "w": 800, "h": 600, "pdf": {"width": f"{w_mm}mm", "height": f"{h_mm}mm"}}


def png_job(svg, out_png, px_w):
    html = OUT / f"_tmp_png_{out_png.stem}.html"
    css = font_css("../03_typographie/polices")
    w = float(svg.split('width="')[1].split("mm")[0])
    h = float(svg.split('height="')[1].split("mm")[0])
    ph = round(px_w * h / w)
    svg2 = svg.replace(f'width="{w}mm" height="{h}mm"', f'width="{px_w}" height="{ph}"', 1)
    html.write_text(f"<!doctype html><meta charset=utf-8><style>{css}html,body{{margin:0;background:transparent}}"
                    f"svg{{display:block}}</style>{svg2}")
    return {"in": str(html), "out": str(out_png), "w": px_w, "h": ph, "transparent": True}


def main():
    for d in ("carte-de-visite", "en-tete", "carte-remerciement", "autocollants"):
        (OUT / d).mkdir(parents=True, exist_ok=True)
    files = {
        "carte-de-visite/carte-recto.svg": card_recto(), "carte-de-visite/carte-verso.svg": card_verso(),
        "en-tete/papier-en-tete-a4.svg": letterhead(False), "en-tete/papier-en-tete-a4-exemple.svg": letterhead(True),
        "carte-remerciement/carte-remerciement-recto.svg": thanks_recto(),
        "carte-remerciement/carte-remerciement-verso.svg": thanks_verso(),
        "autocollants/autocollant-rond-60mm.svg": sticker_round(),
        "autocollants/vitrophanie-ceramique-70x24mm.svg": sticker_windscreen(),
        "autocollants/autocollant-rectangle-90x22mm.svg": sticker_rect(),
    }
    for k, v in files.items():
        (OUT / k).write_text(v)
    jobs = [
        render([files["carte-de-visite/carte-recto.svg"], files["carte-de-visite/carte-verso.svg"]],
               OUT / "carte-de-visite" / "carte-de-visite-85x55-fonds-perdus-3mm.pdf", CW + 6, CH + 6),
        render([files["en-tete/papier-en-tete-a4.svg"]], OUT / "en-tete" / "papier-en-tete-a4.pdf", AW, AH),
        render([files["en-tete/papier-en-tete-a4-exemple.svg"]], OUT / "en-tete" / "papier-en-tete-a4-exemple.pdf", AW, AH),
        render([files["carte-remerciement/carte-remerciement-recto.svg"], files["carte-remerciement/carte-remerciement-verso.svg"]],
               OUT / "carte-remerciement" / "carte-remerciement-a6-fonds-perdus-3mm.pdf", TW + 6, TH + 6),
    ]
    for k, v in files.items():
        jobs.append(png_job(v, OUT / k.replace(".svg", ".png"), 1600 if "a4" not in k else 1240))
    jf = OUT / "_jobs.json"
    jf.write_text(json.dumps(jobs))
    subprocess.run(["node", str(ROOT / "_source" / "render.mjs"), str(jf)], check=True, stdout=subprocess.DEVNULL)
    for j in jobs:
        Path(j["in"]).unlink()
    jf.unlink()
    print("papeterie ok")


if __name__ == "__main__":
    main()
