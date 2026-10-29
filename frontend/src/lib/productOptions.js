export const variantLabel = (variant) => variant.variant_name || [variant.size, variant.color].filter(Boolean).join(" / ") || null;

export function productSelection(product, label = null) {
  if (!product || !["preorder", "in_stock"].includes(product.stock_status)) return null;
  const sizes = product.size_options?.length ? product.size_options : [null];
  const colors = product.color_options?.length ? product.color_options : [null];
  const allowed = sizes.flatMap((size) => colors.map((color) => [size, color].filter(Boolean).join(" / ") || null));
  if (!allowed.includes(label)) return null;
  const variants = product.product_variants || [];
  let selected;
  if (variants.length) {
    const matching = variants.filter((variant) => variantLabel(variant) === label);
    if (matching.length !== 1 || !["preorder", "in_stock"].includes(matching[0].stock_status)) return null;
    selected = matching[0];
  }
  const price = Number(selected?.price_mvr ?? product.price_mvr);
  if (!Number.isFinite(price) || price <= 0) return null;
  return { price, sku: selected?.sku || product.sku };
}
