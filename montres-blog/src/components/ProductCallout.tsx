import Image from "next/image";
import { getProductById } from "@/lib/products";
import { buildAffiliateLinkForProduct } from "@/lib/affiliate";
import { AffiliateButton } from "./AffiliateButton";

/**
 * Bloc produit inséré dans le corps d'un article (remplace les
 * placeholders {{product:ID}} générés par le script de génération).
 */
export function ProductCallout({ id }: { id: string }) {
  const product = getProductById(id);
  if (!product) return null;

  return (
    <div className="not-prose my-8 flex flex-col sm:flex-row gap-5 rounded-lg border border-ink/10 p-5 bg-white/60">
      <Image
        src={product.image}
        alt={product.name}
        width={96}
        height={96}
        className="rounded border border-ink/10 self-start"
      />
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wide text-brass font-medium">
          {product.brand}
        </p>
        <h4 className="font-serif text-lg font-semibold mt-1">{product.name}</h4>
        <ul className="mt-2 text-sm text-ink/70 space-y-1">
          {product.pros.slice(0, 2).map((pro, i) => (
            <li key={i}>+ {pro}</li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-4">
          <AffiliateButton href={buildAffiliateLinkForProduct(product)} />
          <span className="text-sm text-ink/50">{product.priceRangeEur} €</span>
        </div>
      </div>
    </div>
  );
}
