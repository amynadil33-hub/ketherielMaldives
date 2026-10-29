import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { CatalogProvider, useCatalog } from "./catalog.jsx";
import * as supabase from "./supabase";
jest.mock("./supabase", () => ({ __esModule: true, isSupabaseConfigured: true, fetchSupabaseCatalog: jest.fn() }));
global.IS_REACT_ACT_ENVIRONMENT = true;
let root, container;
function Probe() {
  const { products, reviews, categories, islands, source, loading, error } = useCatalog();
  return <div>{JSON.stringify({ products, reviews, categories, islands, source, loading, error: Boolean(error) })}</div>;
}
beforeEach(() => { container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); supabase.isSupabaseConfigured = true; });
afterEach(async () => { await act(() => root.unmount()); container.remove(); jest.clearAllMocks(); });
async function render() { await act(async () => root.render(<CatalogProvider><Probe /></CatalogProvider>)); return JSON.parse(container.textContent); }
test("missing configuration never displays demo products, reviews or delivery zones", async () => {
  supabase.isSupabaseConfigured = false;
  const result = await render();
  expect(result.products).toEqual([]); expect(result.reviews).toEqual([]); expect(result.islands).toEqual([]); expect(result.error).toBe(true);
  expect(supabase.fetchSupabaseCatalog).not.toHaveBeenCalled();
});
test("a failed request stays empty and reports an unavailable catalogue", async () => {
  supabase.fetchSupabaseCatalog.mockRejectedValue(new Error("offline"));
  const result = await render();
  expect(result.products).toEqual([]); expect(result.reviews).toEqual([]); expect(result.source).toBe("unavailable"); expect(result.error).toBe(true);
});
test("an intentionally empty catalogue stays empty", async () => {
  supabase.fetchSupabaseCatalog.mockResolvedValue({ products: [], reviews: [], categories: [], brands: [], islands: [] });
  const result = await render();
  expect(result.products).toEqual([]); expect(result.reviews).toEqual([]); expect(result.source).toBe("supabase"); expect(result.error).toBe(false);
});
test("draft/inactive/invalid products are excluded and counts use actual published products", async () => {
  const approved = { id: "one", title: "Reviewed", status: "published", is_active: true, price_mvr: "120.50", categories: { slug: "shoes" } };
  supabase.fetchSupabaseCatalog.mockResolvedValue({ products: [approved, { ...approved, id: "draft", status: "draft" }, { ...approved, id: "inactive", is_active: false }, { ...approved, id: "invalid", price_mvr: "NaN" }], categories: [{ slug: "shoes", product_count: 99 }] });
  const result = await render();
  expect(result.products).toHaveLength(1); expect(result.products[0].price_mvr).toBe(120.5); expect(result.categories[0].count).toBe(1);
});
test("loading never flashes demo inventory", async () => {
  supabase.fetchSupabaseCatalog.mockReturnValue(new Promise(() => {}));
  const result = await render();
  expect(result.loading).toBe(true); expect(result.products).toEqual([]); expect(result.reviews).toEqual([]);
});
