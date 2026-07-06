import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 prose prose-neutral">
      <h1>Mentions légales</h1>

      <p className="affiliate-disclosure not-prose">
        Modèle à compléter avec vos informations réelles avant mise en ligne
        (obligatoire en France : loi n°2004-575 du 21 juin 2004 pour la confiance dans
        l&apos;économie numérique).
      </p>

      <h2>Éditeur du site</h2>
      <p>
        [Nom / raison sociale] — [Statut juridique] — [Adresse] — [Numéro SIRET] —
        Directeur de la publication : [Nom]. Contact : [email de contact].
      </p>

      <h2>Hébergement</h2>
      <p>[Nom de l&apos;hébergeur] — [Adresse] — [Site web de l&apos;hébergeur].</p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus (textes, images, mise en page) de ce site est
        protégé par le droit d&apos;auteur. Toute reproduction sans autorisation
        préalable est interdite.
      </p>

      <h2>Programme d&apos;affiliation</h2>
      <p>
        Ce site participe au Programme Partenaires d&apos;Amazon EU, un programme
        d&apos;affiliation conçu pour permettre à des sites de percevoir une
        rémunération grâce à la création de liens vers Amazon.fr. Les liens présents
        sur ce site vers Amazon sont des liens affiliés.
      </p>
    </div>
  );
}
