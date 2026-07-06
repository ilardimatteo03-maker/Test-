import productsData from "../../data/products.json";

export type Product = {
  id: string;
  brand: string;
  name: string;
  asin: string;
  category: string;
  priceRangeEur: string;
  image: string;
  pros: string[];
  cons: string[];
  bestFor: string;
};

const products = productsData as Product[];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByIds(ids: string[]): Product[] {
  return ids
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p));
}
