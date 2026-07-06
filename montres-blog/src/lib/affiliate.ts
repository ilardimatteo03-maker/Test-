import { siteConfig } from "./site-config";
import type { Product } from "./products";

/**
 * Construit un lien d'affiliation Amazon a partir d'un ASIN et du tag
 * d'associe. Tant que le compte Amazon Associates n'a pas acces a la
 * Product Advertising API (accès accordé après un historique de ventes,
 * voir README), ce lien pointe simplement vers la fiche produit avec le
 * tag de tracking — ce qui est suffisant pour toucher les commissions.
 */
export function buildAffiliateLink(asin: string): string {
  const tag = siteConfig.amazonAssociateTag;
  return `https://www.amazon.fr/dp/${asin}?tag=${tag}`;
}

export function buildAffiliateLinkForProduct(product: Product): string {
  return buildAffiliateLink(product.asin);
}
