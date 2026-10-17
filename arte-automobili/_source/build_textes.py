"""Exporte les textes de marque (textes.py) en Markdown prêt à copier : 11_ton-de-voix/."""
from kit import ROOT
from textes import (AVIS, BIO_INSTAGRAM, LANCEMENT, METHODE, PITCH_COURT, PITCH_LONG, PRESTATIONS, SIGNATURE,
                    SIGNATURE_NOTE, SLOGANS, TITRES, TON, VOCABULAIRE)


def main():
    out = ROOT / "11_ton-de-voix"
    out.mkdir(exist_ok=True)
    L = ["# Arte Automobili — textes de marque", "",
         "Textes prêts à copier. Source unique : `_source/textes.py` (le guide, le site et les gabarits en dérivent).",
         "Les tarifs sont indicatifs et restent à fixer par l'entreprise.", "",
         "## Signature principale", "", f"**{SIGNATURE}**", "", SIGNATURE_NOTE, "",
         "## Cinq alternatives", ""]
    L += [f"- **{s}** ({lang}) — {d}" for s, lang, d in SLOGANS]
    L += ["", "## Présentation courte", "", PITCH_COURT, "", "## Présentation longue", ""]
    for p in PITCH_LONG:
        L += [p, ""]
    L += ["## Biographie Instagram", "", "```", BIO_INSTAGRAM, "```", f"({len(BIO_INSTAGRAM)} caractères sur 150)", "",
          "## Texte de lancement", ""]
    for p in LANCEMENT:
        L += [p, ""]
    L += ["## Titres de publications", ""] + [f"- {t}" for t in TITRES]
    L += ["", "## Descriptions des prestations", ""]
    for p in PRESTATIONS:
        L += [f"### {p['n']} — {p['nom']}", "", p["desc"], "", f"*{p['duree']} · {p['prix']}* — accroche courte : {p['court']}", ""]
    L += ["## La méthode en quatre temps", ""] + [f"{i + 1}. **{t}** — {d}" for i, (t, d) in enumerate(METHODE)]
    L += ["", "## Personnalité rédactionnelle", "", "| Trait | Principe | On écrit | On n'écrit pas |", "|---|---|---|---|"]
    L += [f"| {a} | {b} | {c} | ~~{d}~~ |" for a, b, c, d in TON]
    L += ["", "## Vocabulaire", "", "**On dit :** " + " · ".join(VOCABULAIRE["on dit"]), "",
          "**On évite :** " + " · ".join(VOCABULAIRE["on évite"]), "", "## Avis clients (exemples pour maquettes)", ""]
    L += [f"> « {q} » — {n}, {c}" + "\n" for n, c, q in AVIS]
    (out / "textes-de-marque.md").write_text("\n".join(L) + "\n")
    print("textes ok")


if __name__ == "__main__":
    main()
