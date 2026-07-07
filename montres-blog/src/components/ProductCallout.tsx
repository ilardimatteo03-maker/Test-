import Image from "next/image";
import { getProductById } from "@/lib/products";
import { buildAffiliateLinkForProduct } from "@/lib/affiliate";
import { AffiliateButton } from "./AffiliateButton";

/**
 * Bloc produit insere dans le corps d'un article (au fil du texte).
 */
export function ProductCallout({ id }: { id: string }) {
  const product = getProductById(id);
  if (!product) return null;

  return (
    <div className="not-prose my-10 flex flex-col sm:flex-row gap-6 border-t border-b border-ink/15 py-6">
      <Image
        src={product.image}
        alt={product.name}
        width={104}
        height={104}
        className="border border-ink/10 self-start"
      />
      <div className="flex-1">
        <p className="eyebrow">{product.brand}</p>
        <h4 className="font-serif text-xl font-bold mt-1.5">{product.name}</h4>
        <ul className="mt-3 text-sm text-ink/70 space-y-1">
          {product.pros.slice(0, 2).map((pro, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-gold">—</span>
              <span>{pro}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center gap-4">
          <AffiliateButton href={buildAffiliateLinkForProduct(product)} />
          <span className="font-serif text-ink/60">{product.priceRangeEur} €</span>
        </div>
      </div>
    </div>
  );
}
