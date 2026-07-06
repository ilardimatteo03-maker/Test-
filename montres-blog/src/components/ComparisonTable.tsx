import Image from "next/image";
import { getProductsByIds } from "@/lib/products";
import { buildAffiliateLinkForProduct } from "@/lib/affiliate";
import { AffiliateButton } from "./AffiliateButton";

/**
 * `ids` est une chaine separee par des virgules ("id1,id2,id3") plutot
 * qu'un tableau. Dans le rendu MDX (next-mdx-remote/rsc), les props de
 * type expression JSX ({[...]}) sur un composant serveur sont parfois
 * perdues silencieusement lors de la serialisation RSC. Une prop string
 * simple est beaucoup plus fiable, y compris pour du contenu genere par un
 * LLM (moins de risque d'erreur de syntaxe JS dans les guillemets/crochets).
 */
export function ComparisonTable({ ids }: { ids: string }) {
  const productIds = (ids || "").split(",").map((id) => id.trim()).filter(Boolean);
  const products = getProductsByIds(productIds);

  if (!products.length) return null;

  return (
    <div className="not-prose my-10 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink/15 text-left">
            <th className="py-3 pr-4 font-semibold">Modèle</th>
            <th className="py-3 pr-4 font-semibold">Idéal pour</th>
            <th className="py-3 pr-4 font-semibold">Prix indicatif</th>
            <th className="py-3 pr-4 font-semibold">Lien</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-ink/10 align-top">
              <td className="py-4 pr-4">
                <div className="flex items-center gap-3">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="rounded border border-ink/10"
                  />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-ink/50">{product.brand}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 pr-4 text-ink/70">{product.bestFor}</td>
              <td className="py-4 pr-4 whitespace-nowrap">{product.priceRangeEur} €</td>
              <td className="py-4 pr-4">
                <AffiliateButton
                  href={buildAffiliateLinkForProduct(product)}
                  label="Voir le prix"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
