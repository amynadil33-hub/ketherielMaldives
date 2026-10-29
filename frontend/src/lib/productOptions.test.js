import { productSelection } from "./productOptions";
const product = { stock_status: "preorder", price_mvr: 100, size_options: ["M", "L"], color_options: ["Blue"] };
test("requires a complete valid option selection", () => {
  expect(productSelection(product)).toBeNull(); expect(productSelection(product, "XL / Blue")).toBeNull(); expect(productSelection(product, "M / Blue").price).toBe(100);
});
test("uses variant-specific prices and rejects unavailable combinations", () => {
  const p = { ...product, product_variants: [{ size: "M", color: "Blue", price_mvr: "120.50", stock_status: "preorder", sku: "M-BLUE" }] };
  expect(productSelection(p, "M / Blue")).toEqual({ price: 120.5, sku: "M-BLUE" }); expect(productSelection(p, "L / Blue")).toBeNull();
});
test("rejects unavailable or invalidly priced inventory", () => {
  expect(productSelection({ price_mvr: 0, stock_status: "preorder" })).toBeNull(); expect(productSelection({ price_mvr: 10, stock_status: "out_of_stock" })).toBeNull();
});
