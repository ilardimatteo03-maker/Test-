import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/politique-de-confidentialite" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 prose prose-editorial">
      <h1>Politique de confidentialité</h1>

      <p className="affiliate-disclosure not-prose">
        Modèle générique à adapter à votre traitement de données réel (RGPD) avant mise
        en ligne. Si vous utilisez Google Analytics, Amazon ou tout autre traceur,
        listez-les explicitement ci-dessous.
      </p>

      <h2>Données collectées</h2>
      <p>
        Ce site peut utiliser des cookies de mesure d&apos;audience et des cookies
        techniques liés au programme d&apos;affiliation Amazon (identification de
        l&apos;origine des clics pour le versement des commissions).
      </p>

      <h2>Finalité</h2>
      <p>
        Les données collectées servent uniquement à mesurer l&apos;audience du site et
        à assurer le bon fonctionnement du programme d&apos;affiliation. Aucune donnée
        personnelle n&apos;est vendue à des tiers.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
        rectification et de suppression de vos données. Pour l&apos;exercer, contactez
        [email de contact].
      </p>

      <h2>Cookies tiers</h2>
      <p>
        Amazon et, le cas échéant, votre outil de mesure d&apos;audience (Google
        Analytics, Plausible...) peuvent déposer leurs propres cookies. Consultez leur
        politique de confidentialité respective pour plus de détails.
      </p>
    </div>
  );
}
