/**
 * Shared ISR window for product detail pages.
 * Keep `export const revalidate` on `/products/[slug]` equal to this value —
 * Next requires a statically analyzable literal on the page module.
 */
export const PRODUCT_PAGE_REVALIDATE_SECONDS = 300;
