"""Devis, offres de prix, factures et listes de prix Arte Automobili (HTML puis PDF A4).

Toutes les données commerciales viennent de donnees.json. Une demande décrit le client et les prestations choisies :

    python3 documents.py demande.json      # numéro suivant, PDF dans 18_documents/<type>/
    python3 documents.py exemples          # régénère les 4 exemples de 18_documents/exemples/

Format d'une demande (voir 18_documents/README.md) :
    {"type": "devis" | "offre" | "facture" | "liste",
     "date": "2026-10-29",                                   # facultatif, aujourd'hui par défaut
     "client": {"type": "particulier" | "professionnel", "nom": "...", "societe": "...", "rue": "...",
                "code_postal": "...", "ville": "...", "email": "...", "telephone": "...", "tva": "BE..."},
     "vehicule": {"modele": "...", "immatriculation": "...", "remarque": "..."},
     "objet": "...", "note": "...",
     "lignes": [{"code": "complet"}, {"code": "shampooing", "quantite": 2},
                {"libelle": "Polissage de finition", "prix_tvac": 180}, {"code": "polissage", "prix_htva": 150}],
     "remise": {"libelle": "Remise flotte", "pct": 10},     # facultatif
     "date_prestation": "2026-10-28",                        # facture
     "paiement": {"date": "2026-10-28", "mode": "Bancontact"}}  # facture réglée ; sinon échéance et virement
"""
import html
import json
import os
import re
import subprocess
import sys
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ICI = Path(__file__).resolve().parent
BASE = ICI.parents[1]  # dossier arte-automobili
SORTIE = BASE / "18_documents"
POLICES = BASE / "03_typographie" / "polices"
LOGO = BASE / "14_theme-shopify-premium" / "theme" / "assets" / "logo-principal-nero.svg"
COMPTEURS = SORTIE / "compteurs.json"
D = json.loads((ICI / "donnees.json").read_text())
CENT = Decimal("0.01")
TITRES = {"devis": "Devis", "offre": "Offre de prix", "facture": "Facture", "liste": "Liste de prix"}
DOSSIERS = {"devis": "devis", "offre": "offres", "facture": "factures", "liste": "listes"}
MOIS = "janvier février mars avril mai juin juillet août septembre octobre novembre décembre".split()


# ---------------------------------------------------------------- calculs et formats

def taux():
    return Decimal(0) if D["tva"]["regime_franchise"] else Decimal(D["tva"]["taux"]) / 100


def htva(tvac):
    return (Decimal(tvac) / (1 + taux())).quantize(CENT, ROUND_HALF_UP)


def euros(v):
    v = Decimal(v).quantize(CENT, ROUND_HALF_UP)
    signe = "−" if v < 0 else ""
    entier, dec = f"{abs(v):.2f}".split(".")
    entier = re.sub(r"(?<=\d)(?=(\d{3})+$)", " ", entier)
    return f"{signe}{entier},{dec} €"


def euros_court(v):
    """Prix de liste : sans centimes quand ils sont nuls (45 €, 37,19 €)."""
    v = Decimal(v).quantize(CENT, ROUND_HALF_UP)
    return f"{int(v)} €" if v == v.to_integral_value() else euros(v)


def jour(d):
    return d.strftime("%d.%m.%Y")


def jour_long(d):
    return f"{d.day}{'er' if d.day == 1 else ''} {MOIS[d.month - 1]} {d.year}"


def e(t):
    return html.escape(str(t or ""), quote=False)


def typo(t):
    """Espaces insécables françaises, sur du texte déjà échappé."""
    t = re.sub(r" ([:;!?»])", " \\1", t)
    return t.replace("« ", "« ")


def qte(q):
    q = Decimal(str(q))
    return str(q.normalize()).replace(".", ",") if q != q.to_integral_value() else str(int(q))


def communication_structuree(numero):
    """Communication structurée belge (+++123/4567/89012+++) dérivée des chiffres du numéro de facture."""
    base = re.sub(r"\D", "", numero)[-10:].rjust(10, "0")
    controle = int(base) % 97 or 97
    c = f"{base}{controle:02d}"
    return f"+++{c[:3]}/{c[3:7]}/{c[7:]}+++"


# ---------------------------------------------------------------- lignes et totaux

def catalogue(code):
    for x in D["prestations"] + D["supplements"]:
        if x["code"] == code:
            return x
    raise SystemExit(f"Code inconnu : {code!r}. Codes valides : {', '.join(x['code'] for x in D['prestations'] + D['supplements'])}")


def lignes(demande, pro):
    """Résout chaque ligne : libellé, description, quantité, prix unitaire et total (TVAC pour un particulier, HTVA pour un pro)."""
    res = []
    for l in demande["lignes"]:
        ref = catalogue(l["code"]) if "code" in l else {}
        nom = l.get("libelle") or ref.get("nom")
        if not nom:
            raise SystemExit(f"Ligne sans code ni libellé : {l}")
        if "prix_htva" in l:
            pu_ht = Decimal(str(l["prix_htva"]))
            pu_tvac = (pu_ht * (1 + taux())).quantize(CENT, ROUND_HALF_UP)
        else:
            tvac = l.get("prix_tvac", ref.get("prix_tvac"))
            if tvac is None:
                raise SystemExit(f"« {nom} » est sur devis : indique son prix (prix_tvac ou prix_htva).")
            if ref.get("des") and "prix_tvac" not in l:
                print(f"  ! « {nom} » : prix de départ ({tvac} €) utilisé, à ajuster si besoin.")
            pu_tvac = Decimal(str(tvac))
            pu_ht = htva(pu_tvac)
        q = Decimal(str(l.get("quantite", 1)))
        pu = pu_ht if pro else pu_tvac
        res.append({"nom": nom, "description": l.get("description", ref.get("description", "")),
                    "quantite": q, "pu": pu, "total": (pu * q).quantize(CENT, ROUND_HALF_UP)})
    return res


def totaux(lgs, demande, pro):
    """Particulier : le total TVAC fait foi (prix affichés), HTVA et TVA en sont déduits. Professionnel : l'inverse."""
    sous_total = sum((l["total"] for l in lgs), Decimal(0))
    remise = Decimal(0)
    if demande.get("remise"):
        remise = (sous_total * Decimal(str(demande["remise"]["pct"])) / 100).quantize(CENT, ROUND_HALF_UP)
    net = sous_total - remise
    if pro:
        tva = (net * taux()).quantize(CENT, ROUND_HALF_UP)
        return {"sous_total": sous_total, "remise": remise, "htva": net, "tva": tva, "tvac": net + tva}
    ht = htva(net)
    return {"sous_total": sous_total, "remise": remise, "htva": ht, "tva": net - ht, "tvac": net}


# ---------------------------------------------------------------- HTML

def logo(hauteur=34):
    s = LOGO.read_text()
    s = re.sub(r"<title>.*?</title>", "", s)
    return re.sub(r'\swidth="[^"]+"\s+height="[^"]+"', f' height="{hauteur}"', s, count=1)


def css(dossier):
    p = Path(os.path.relpath(POLICES, dossier)).as_posix()
    return f"""
@font-face{{font-family:'Bodoni Moda';src:url('{p}/BodoniModa%5Bopsz,wght%5D.ttf') format('truetype');font-weight:400 900;font-style:normal}}
@font-face{{font-family:'Bodoni Moda';src:url('{p}/BodoniModa-Italic%5Bopsz,wght%5D.ttf') format('truetype');font-weight:400 900;font-style:italic}}
@font-face{{font-family:'Archivo';src:url('{p}/Archivo%5Bwdth,wght%5D.ttf') format('truetype');font-weight:100 900;font-stretch:62% 125%}}
@font-face{{font-family:'DM Mono';src:url('{p}/DMMono-Light.ttf') format('truetype');font-weight:300}}
@font-face{{font-family:'DM Mono';src:url('{p}/DMMono-Regular.ttf') format('truetype');font-weight:400}}
@page{{size:A4;margin:16mm 0}}
*{{box-sizing:border-box}}
html,body{{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
body{{font:400 9pt/1.5 Archivo,Arial,sans-serif;color:#0D0F0E;background:#fff}}
.feuille{{position:relative;width:210mm;min-height:264mm;padding:2mm 22mm 0;display:flex;flex-direction:column}}
.feuille+.feuille{{break-before:page}}
.mono{{font-family:'DM Mono',monospace;font-weight:400;letter-spacing:.03em}}
.eyebrow{{margin:0 0 2mm;font:600 6.6pt/1.4 Archivo,sans-serif;font-stretch:125%;letter-spacing:.22em;text-transform:uppercase;color:#5E6461}}
header{{display:flex;justify-content:space-between;align-items:flex-start}}
header dl{{display:grid;grid-template-columns:auto auto;gap:1mm 6mm;margin:0;font:400 8pt/1.4 'DM Mono',monospace;letter-spacing:.03em}}
header svg{{flex:none}}
header.suite{{align-items:flex-end;margin-bottom:7mm}}header.suite h2{{margin:0}}
header dt{{color:#5E6461}}header dd{{margin:0;text-align:right}}
h1{{margin:12mm 0 8mm;font:400 30pt/1 'Bodoni Moda',Didot,serif}}
h1 i,h2 i,.nom i{{font-style:italic}}
h2{{margin:0 0 6mm;font:400 20pt/1 'Bodoni Moda',serif}}
.parties{{display:grid;grid-template-columns:1fr 1fr;gap:12mm;margin-bottom:6mm}}
.parties p{{margin:0;line-height:1.55}}
.parties strong{{font-weight:600}}
.contexte{{display:flex;flex-wrap:wrap;gap:3mm 12mm;padding:3mm 0;margin-bottom:5mm;border-top:.5pt solid #D6D3CA;border-bottom:.5pt solid #D6D3CA}}
.contexte p{{margin:0}}.contexte .eyebrow{{margin:0 0 .5mm}}
table{{width:100%;border-collapse:collapse}}
thead{{display:table-header-group}}
tr{{break-inside:avoid}}
th{{padding:0 0 3mm;text-align:left;font:600 6.6pt/1.4 Archivo,sans-serif;font-stretch:125%;letter-spacing:.22em;text-transform:uppercase;border-bottom:.6pt solid #0D0F0E}}
th.n,td.n{{text-align:right;white-space:nowrap;padding-left:5mm}}
th small{{display:block;font:400 6.4pt/1.4 'DM Mono',monospace;letter-spacing:.06em;text-transform:none;color:#5E6461}}
td{{padding:2.8mm 0;border-bottom:.5pt solid #D6D3CA;vertical-align:baseline}}
td.n{{font:400 9pt/1.3 'DM Mono',monospace;font-variant-numeric:tabular-nums}}
td .nom{{display:block;font:400 11.5pt/1.3 'Bodoni Moda',serif}}
td .desc{{display:block;margin-top:.8mm;font-size:8pt;line-height:1.45;color:#5E6461;max-width:112mm}}
.totaux{{width:82mm;margin:4mm 0 0 auto}}
.totaux div{{display:flex;justify-content:space-between;padding:1.3mm 0}}
.totaux span:last-child{{font:400 9pt/1.3 'DM Mono',monospace;font-variant-numeric:tabular-nums}}
.totaux .total{{margin-top:1.5mm;padding-top:3mm;border-top:.6pt solid #0D0F0E;align-items:baseline}}
.totaux .total span:first-child{{font:400 15pt/1 'Bodoni Moda',serif}}
.totaux .total span:last-child{{font-size:12pt}}
.totaux .discret{{color:#5E6461}}
.totaux .regle{{margin-top:2mm;padding-top:3mm;border-top:.5pt solid #D6D3CA}}
.infos{{display:grid;grid-template-columns:repeat(2,1fr);gap:4mm 12mm;margin-top:7mm}}
.infos p{{margin:0;font-size:8.4pt;line-height:1.5}}
.accord{{display:grid;grid-template-columns:1fr 1fr;gap:12mm;margin-top:7mm}}
.accord div{{height:17mm;border-top:.5pt solid #0D0F0E;padding-top:2mm;font-size:8pt;color:#5E6461}}
.pour{{margin:-4mm 0 8mm;font:400 8.4pt/1.4 'DM Mono',monospace;letter-spacing:.03em}}
footer{{margin-top:auto;padding-top:6mm}}
footer p{{margin:0;padding-top:3mm;border-top:.5pt solid #D6D3CA;font:400 6.6pt/1.7 'DM Mono',monospace;letter-spacing:.03em;color:#5E6461}}
footer span{{white-space:nowrap}}
footer i{{font-family:'Bodoni Moda',serif;font-size:8.5pt;letter-spacing:0;color:#0D0F0E}}
.liste td{{padding:4.2mm 0}}
.liste td.n{{width:34mm;font-size:10.5pt}}
.liste .duree{{font:300 7.6pt/1 'DM Mono',monospace;color:#5E6461;margin-left:2.5mm}}
.liste.compacte td{{padding:1.55mm 0}}
.liste.compacte td .nom{{display:inline;font-size:9.6pt}}
.liste.compacte td.n{{font-size:9pt}}
.liste .cat td{{padding:4.5mm 0 1.6mm;border-bottom:.6pt solid #0D0F0E;font:600 6.6pt/1.4 Archivo,sans-serif;font-stretch:125%;letter-spacing:.22em;text-transform:uppercase}}
.liste .cat:first-child td{{padding-top:0}}
"""


def pied():
    x = D["entreprise"]
    l1 = [x["denomination_legale"], f"{x['rue']}, {x['code_postal']} {x['ville']}", f"TVA {x['numero_entreprise']}", x.get("rpm")]
    l2 = [f"IBAN {x['iban']}", f"BIC {x['bic']}", x["telephone"], x["email"], x["site"]]
    ligne = lambda l: " · ".join(f"<span>{e(m)}</span>" for m in l if m)
    return f"<footer><p>{ligne(l1)}<br>{ligne(l2)}<br><i>{e(x['signature'])}</i></p></footer>"


def bloc_entreprise():
    x = D["entreprise"]
    return (f"<p><strong>{e(x['nom'])}</strong><br>{e(x['rue'])}<br>{e(x['code_postal'])} {e(x['ville'])}<br>"
            f"{e(x['telephone'])}<br>{e(x['email'])}</p>")


def bloc_client(c):
    l = []
    if c.get("societe"):
        l.append(f"<strong>{e(c['societe'])}</strong>")
        if c.get("nom"):
            l.append(f"À l'attention de {e(c['nom'])}")
    else:
        l.append(f"<strong>{e(c['nom'])}</strong>")
    if c.get("rue"):
        l.append(e(c["rue"]))
    if c.get("code_postal") or c.get("ville"):
        l.append(f"{e(c.get('code_postal'))} {e(c.get('ville'))}".strip())
    for k in ("telephone", "email"):
        if c.get(k):
            l.append(e(c[k]))
    if c.get("tva"):
        l.append(f"<span class='mono'>TVA {e(c['tva'])}</span>")
    return f"<p>{'<br>'.join(l)}</p>"


def document(t, demande, numero, dossier):
    """Devis, offre de prix ou facture."""
    d = date.fromisoformat(demande["date"])
    c = demande["client"]
    pro = c.get("type") == "professionnel"
    lgs = lignes(demande, pro)
    tot = totaux(lgs, demande, pro)
    cond = D["conditions"]
    tva_pct = "0" if D["tva"]["regime_franchise"] else str(D["tva"]["taux"])

    meta = [("N°", numero), ("Date", jour(d))]
    if t == "devis":
        meta.append(("Valable jusqu'au", jour(d + timedelta(days=cond["validite_devis_jours"]))))
    elif t == "offre":
        meta.append(("Valable jusqu'au", jour(d + timedelta(days=cond["validite_offre_jours"]))))
    else:
        if demande.get("date_prestation"):
            meta.append(("Prestation", jour(date.fromisoformat(demande["date_prestation"]))))
        if not demande.get("paiement"):
            meta.append(("Échéance", jour(d + timedelta(days=cond["echeance_facture_jours"]))))
    meta_html = "".join(f"<dt>{e(k)}</dt><dd>{e(v)}</dd>" for k, v in meta)

    contexte = []
    v = demande.get("vehicule")
    if v:
        if v.get("modele"):
            contexte.append(("Véhicule", v["modele"]))
        if v.get("immatriculation"):
            contexte.append(("Immatriculation", v["immatriculation"]))
        if v.get("remarque"):
            contexte.append(("Remarque", v["remarque"]))
    if demande.get("objet"):
        contexte.insert(0, ("Objet", demande["objet"]))
    contexte_html = ("<section class='contexte'>" + "".join(
        f"<div><p class='eyebrow'>{e(k)}</p><p>{typo(e(val))}</p></div>" for k, val in contexte) + "</section>") if contexte else ""

    base = "HTVA" if pro else "TVAC"
    corps = "".join(f"""
      <tr><td><span class="nom">{e(l['nom'])}</span>{f'<span class="desc">{typo(e(l["description"]))}</span>' if l['description'] else ''}</td>
        <td class="n">{qte(l['quantite'])}</td><td class="n">{euros(l['pu'])}</td><td class="n">{euros(l['total'])}</td></tr>""" for l in lgs)

    lignes_tot = []
    if tot["remise"]:
        r = demande["remise"]
        lignes_tot.append(("Sous-total " + base, euros(tot["sous_total"]), ""))
        lignes_tot.append((f"{r.get('libelle', 'Remise')} ({qte(r['pct'])} %)", euros(-tot["remise"]), ""))
    if D["tva"]["regime_franchise"]:
        lignes_tot.append(("Total", euros(tot["tvac"]), "total"))
    elif pro:
        lignes_tot += [("Total HTVA", euros(tot["htva"]), ""), (f"TVA {tva_pct} %", euros(tot["tva"]), ""),
                       ("Total TVAC", euros(tot["tvac"]), "total")]
    else:
        lignes_tot += [("Total TVAC", euros(tot["tvac"]), "total"), ("Dont base HTVA", euros(tot["htva"]), "discret"),
                       (f"Dont TVA {tva_pct} %", euros(tot["tva"]), "discret")]
    lignes_tot.sort(key=lambda x: x[2] == "discret")
    p = demande.get("paiement") if t == "facture" else None
    if p:
        lignes_tot += [(f"Réglé le {jour(date.fromisoformat(p['date']))}", euros(tot["tvac"]), "regle"),
                       ("Solde dû", euros(0), "")]
    totaux_html = "".join(f"<div class='{cl}'><span>{e(k)}</span><span>{val}</span></div>" for k, val, cl in lignes_tot)

    infos = []
    if t == "devis":
        infos += [("Conditions", cond["devis"]), ("Paiement", cond["paiement"])]
    elif t == "offre":
        infos += [("Conditions", cond["offre"]), ("Validité", f"Offre valable {cond['validite_offre_jours']} jours, jusqu'au {jour_long(d + timedelta(days=cond['validite_offre_jours']))}.")]
    else:
        p = demande.get("paiement")
        if p:
            infos.append(("Règlement", f"Facture acquittée le {jour_long(date.fromisoformat(p['date']))}"
                                        f"{', ' + p['mode'].lower() if p.get('mode') else ''}, sur place."))
        else:
            ech = jour_long(d + timedelta(days=cond["echeance_facture_jours"]))
            infos.append(("Règlement", f"À régler au plus tard le {ech}, par virement sur le compte "
                                       f"{D['entreprise']['iban']} avec la communication {communication_structuree(numero)}."))
            infos.append(("Retard", cond["retard"]))
    if D["tva"]["regime_franchise"]:
        infos.append(("TVA", D["tva"]["mention_franchise"]))
    if demande.get("note"):
        infos.append(("Note", demande["note"]))
    infos_html = "".join(f"<div><p class='eyebrow'>{e(k)}</p><p>{typo(e(val))}</p></div>" for k, val in infos)

    accord = ""
    if t in ("devis", "offre"):
        accord = ("<section class='accord'><div>Pour Arte Automobili</div>"
                  "<div>Bon pour accord — date, nom et signature du client</div></section>")

    titre = TITRES[t]
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>{e(titre)} {e(numero)} — Arte Automobili</title><style>{css(dossier)}</style></head><body>
<section class="feuille">
  <header>{logo()}<dl>{meta_html}</dl></header>
  <h1>{e(titre)}<i>.</i></h1>
  <section class="parties">
    <div><p class="eyebrow">De</p>{bloc_entreprise()}</div>
    <div><p class="eyebrow">{'Client' if t == 'facture' else 'Pour'}</p>{bloc_client(c)}</div>
  </section>
  {contexte_html}
  <table>
    <thead><tr><th>Désignation</th><th class="n">Qté</th><th class="n">Prix unitaire<small>{base}</small></th><th class="n">Total<small>{base}</small></th></tr></thead>
    <tbody>{corps}
    </tbody>
  </table>
  <section class="totaux">{totaux_html}</section>
  <section class="infos">{infos_html}</section>
  {accord}
  {pied()}
</section>
</body></html>"""


def liste(demande, dossier):
    """Liste de prix : prestations (page 1) puis suppléments (page 2), particuliers TVAC et professionnels HTVA."""
    d = date.fromisoformat(demande["date"])
    c = demande.get("client")
    meta_html = f"<dt>En vigueur le</dt><dd>{jour(d)}</dd>"
    pour = f"<p class='pour'>Établie pour {e(c.get('societe') or c.get('nom'))}</p>" if c else ""

    def prix(x):
        if x["prix_tvac"] is None:
            return "<td class='n' colspan='2'>Sur devis</td>"
        des = "dès " if x.get("des") else ""
        return f"<td class='n'>{des}{euros_court(x['prix_tvac'])}</td><td class='n'>{des}{euros_court(htva(x['prix_tvac']))}</td>"

    entete = ("<thead><tr><th></th><th class='n'>Particuliers<small>TVAC</small></th>"
              "<th class='n'>Professionnels<small>HTVA</small></th></tr></thead>")
    prest = "".join(f"""
      <tr><td><span class="nom">{e(x['nom']).replace('ARTE', '<i>ARTE</i>')}{f'<span class="duree">{e(x["duree"])}</span>' if x['duree'] else ''}</span>
        <span class="desc">{typo(e(x['description']))}</span></td>{prix(x)}</tr>""" for x in D["prestations"])

    supp, cat = [], None
    for x in D["supplements"]:
        if x["categorie"] != cat:
            cat = x["categorie"]
            supp.append(f"<tr class='cat'><td colspan='3'>{e(cat)}</td></tr>")
        duree = f'<span class="duree">{e(x["duree"])}</span>' if x["duree"] else ""
        supp.append(f"<tr><td><span class='nom'>{e(x['nom'])}</span>{duree}</td>{prix(x)}</tr>")

    tva = D["tva"]["mention_franchise"] if D["tva"]["regime_franchise"] else f"TVA {D['tva']['taux']} % comprise pour les particuliers, en sus pour les professionnels."
    mentions = typo(e(f"Prix en euros. {tva} {D['conditions']['paiement']} {D['entreprise']['horaires']}"))
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Liste de prix — Arte Automobili</title><style>{css(dossier)}</style></head><body>
<section class="feuille">
  <header>{logo()}<dl>{meta_html}</dl></header>
  <h1>Liste de prix<i>.</i></h1>
  {pour}
  <h2>Prestations</h2>
  <table class="liste">{entete}<tbody>{prest}</tbody></table>
  <section class="infos"><div><p class="eyebrow">Conditions</p><p>{mentions}</p></div></section>
  {pied()}
</section>
<section class="feuille">
  <header class="suite"><h2>Suppléments</h2>{logo(26)}</header>
  <table class="liste compacte">{entete}<tbody>{''.join(supp)}</tbody></table>
  {pied()}
</section>
</body></html>"""


# ---------------------------------------------------------------- numérotation et sortie

def numero_suivant(t, annee, reserver):
    compteurs = json.loads(COMPTEURS.read_text()) if COMPTEURS.exists() else {}
    n = compteurs.get(str(annee), {}).get(t, 0) + 1
    if reserver:
        compteurs.setdefault(str(annee), {})[t] = n
        COMPTEURS.write_text(json.dumps(compteurs, indent=2, ensure_ascii=False) + "\n")
    return D["numerotation"][t].format(annee=annee, n=n)


def slug(t):
    t = re.sub(r"[^\w]+", "-", t.lower(), flags=re.UNICODE).strip("-")
    return t.translate(str.maketrans("àâäéèêëîïôöùûüç", "aaaeeeeiioouuuc"))


def produire(demande, dossier=None, numero=None):
    t = demande["type"]
    if t not in TITRES:
        raise SystemExit(f"Type inconnu : {t!r} (devis, offre, facture ou liste)")
    demande.setdefault("date", date.today().isoformat())
    annee = date.fromisoformat(demande["date"]).year
    dossier = Path(dossier or SORTIE / DOSSIERS[t])
    dossier.mkdir(parents=True, exist_ok=True)
    c = demande.get("client") or {}
    if t == "liste":  # pas de numéro : la date d'entrée en vigueur suffit
        nom = slug(f"liste de prix {demande['date']} {c.get('societe') or c.get('nom') or ''}")
        page = liste(demande, dossier)
    else:
        numero = numero or demande.get("numero") or numero_suivant(t, annee, reserver=True)
        nom = slug(f"{numero} {c.get('societe') or c.get('nom') or ''}")
        page = document(t, demande, numero, dossier)
    chemin = dossier / f"{nom}.html"
    chemin.write_text(page)
    (dossier / f"{nom}.json").write_text(json.dumps(demande, indent=2, ensure_ascii=False) + "\n")
    if t == "facture" and c.get("type") == "professionnel" and c.get("tva"):
        print("  ! Client assujetti à la TVA : depuis le 1er janvier 2026, la facture doit en principe lui être "
              "transmise par Peppol. Ce PDF en est la copie lisible.")
    return chemin


def imprimer(chemins):
    subprocess.run(["node", str(ICI / "pdf.mjs"), *map(str, chemins)], check=True)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    if sys.argv[1] == "exemples":
        ex = json.loads((ICI / "exemples.json").read_text())
        chemins = [produire(x["demande"], SORTIE / "exemples", x["numero"]) for x in ex]
    else:
        chemins = [produire(json.loads(Path(sys.argv[1]).read_text()))]
    imprimer(chemins)
