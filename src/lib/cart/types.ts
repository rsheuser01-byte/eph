import type { Product, ProductVariant } from "@/data/products";

export type CartLine = {
  slug: string;
  size: string;
  qty: number;
};

export type ResolvedCartLine = {
  line: CartLine;
  product: Product;
  variant: ProductVariant;
  lineTotal: number;
};
