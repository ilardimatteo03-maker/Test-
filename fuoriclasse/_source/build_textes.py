"""Brand story et textes de marque en Markdown (dossier 10_brand-story), prêts à copier."""
import collection as CO
import kit as K
import textes as TX

OUT = K.ROOT / "10_brand-story"


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    md = [f"# FUORICLASSE — brand story\n", f"> THE NEW GENERATION OF SUCCESS · Modern Luxury / Entrepreneurial Streetwear\n",
          f"## {TX.NOM['titre']}\n", *[t + "\n" for t in TX.NOM["texte"]],
          f"## {TX.STORY['titre']}\n", *[t + "\n" for t in TX.STORY["texte"]],
          "## Il Codice — la philosophie\n",
          "Quatre principes, pour les vêtements comme pour ceux qui les portent. Ce ne sont pas des slogans : "
          "ils décident des matières, des coupes et de ce que la marque refuse.\n"]
    for it, fr, tx in TX.PHILOSOPHIE:
        md.append(f"- **{it}** ({fr}) — {tx}")
    md += ["\n## Signature\n", "- **Concept** : THE NEW GENERATION OF SUCCESS",
           "- **Esthétique** : MODERN WEALTH CULTURE — Quiet Luxury × mode contemporaine × streetwear européen premium × culture d'entreprise",
           "- **Promesse** : *Out of class. Never out of place.* — *Fuori classe. Mai fuori luogo.* — *Hors classe. Jamais hors de propos.*",
           "- **Traduction anglaise du nom** (sous-titre, presse) : *Beyond ordinary.*\n"]
    (OUT / "brand-story.md").write_text("\n".join(md), encoding="utf-8")

    man = ["# Manifeste — No Ordinary Class\n", "## English (campagne)\n", *[f"{l}  " for l in TX.MANIFESTE],
           "\n## Français\n", *[f"{l}  " for l in TX.MANIFESTE_FR]]
    (OUT / "manifeste.md").write_text("\n".join(man) + "\n", encoding="utf-8")

    ton = ["# Ton de voix\n", "## FUORICLASSE est\n", *[f"- {x}" for x in TX.TON["on_est"]],
           "\n## FUORICLASSE évite\n", *[f"- {x}" for x in TX.TON["on_evite"]],
           "\n## Plutôt ceci que cela\n", "| À éviter | FUORICLASSE |", "|---|---|",
           *[f"| {a} | {b} |" for a, b in TX.TON["exemples"]],
           "\n## Langues\n", "- **Anglais** : titres de campagne, signatures.", "- **Italien** : noms de pièces, de familles, de codes (Firma, Gessato, Il Codice, Grazie).",
           "- **Français** (ou langue du client) : service, fiches produits, livraison, conditions."]
    (OUT / "ton-de-voix.md").write_text("\n".join(ton) + "\n", encoding="utf-8")

    camp = ["# Campagnes de communication\n"]
    for c in TX.CAMPAGNES:
        camp += [f"## {c['nom']} — {c['role']}\n", f"**Ligne** : *{c['ligne']}*\n", c["idee"] + "\n", "Titres :",
                 *[f"- {t}" for t in c["titres"]], f"\nSupports : {c['supports']}\n"]
    camp += ["## Les pistes du brief\n", "| Piste | Décision |", "|---|---|", *[f"| {a} | {b} |" for a, b in TX.PISTES_CLIENT]]
    (OUT / "campagnes.md").write_text("\n".join(camp) + "\n", encoding="utf-8")

    soc = ["# Réseaux sociaux — textes\n", "## Bio Instagram\n", "```", TX.INSTAGRAM["bio"], "```\n", "## Piliers éditoriaux\n",
           "| Pilier | Part | Contenu |", "|---|---|---|", *[f"| {a} | {b} | {c} |" for a, b, c in TX.INSTAGRAM["piliers"]],
           "\n## Légendes types\n", *[f"```\n{l}\n```" for l in TX.INSTAGRAM["legendes"]],
           f"\nHashtags (trois au maximum, toujours les mêmes) : {TX.INSTAGRAM['hashtags']}\n", "## TikTok — formats\n"]
    for t in TX.TIKTOK:
        soc += [f"### {t['titre']} ({t['duree']})\n", t["script"] + "\n"]
    (OUT / "reseaux-sociaux.md").write_text("\n".join(soc), encoding="utf-8")

    col = ["# Series A — descriptions produits\n", "Textes prêts pour le site et les fiches. Prix publics conseillés TVAC, à valider.\n"]
    for fam, (fn, fit, ftx) in CO.FAMILIES.items():
        col.append(f"## {fn} — *{fit}*\n\n{ftx}\n")
        for p in [q for q in CO.P if q["family"] == fam]:
            cols = ", ".join(CO.COLOR_NAMES[c] for c in p["colors"])
            col += [f"### {p['ref']} · {p['name']} — {p['cat']} — € {p['price']:,}\n",
                    f"- **Matière** : {p['material']}", f"- **Coupe** : {p['fit']}", f"- **Coloris** : {cols}",
                    f"- **Logo & placement** : {p['logo']}", f"- **Finitions** : {p['details']}", f"- **Fabrication** : {p['made']}\n"]
    (OUT / "series-a-descriptions-produits.md").write_text("\n".join(col), encoding="utf-8")


if __name__ == "__main__":
    build()
