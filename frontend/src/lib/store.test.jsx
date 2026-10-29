import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { StoreProvider, useStore } from "./store.jsx";
import { useCatalog } from "./catalog.jsx";
jest.mock("./catalog.jsx", () => ({ useCatalog: jest.fn() }));
global.IS_REACT_ACT_ENVIRONMENT = true;
let root, container, state;
function Probe() { state = useStore(); return <span>{state.cartCount}</span>; }
beforeEach(() => {
  localStorage.clear(); container = document.createElement("div"); root = createRoot(container);
  useCatalog.mockReturnValue({ islands: [], products: [], loading: false, error: null });
});
afterEach(async () => { await act(() => root.unmount()); jest.clearAllMocks(); });
async function render() { await act(async () => root.render(<StoreProvider><Probe /></StoreProvider>)); }
test("old demo island and browser admin flag cannot restore delivery or admin access", async () => {
  localStorage.setItem("mv_island_v1", JSON.stringify({ island: "Unapproved Island", fee: 0 }));
  localStorage.setItem("mv_admin_v1", "true");
  await render();
  expect(state.island.island).toBe(""); expect(state.cartValid).toBe(false); expect(state.adminAuthed).toBeUndefined(); expect(localStorage.getItem("mv_admin_v1")).toBeNull();
});
test("malformed persisted cart data does not crash the storefront", async () => {
  localStorage.setItem("mv_cart_v1", JSON.stringify([null, {}, { id: "one", qty: -1 }])); await render(); expect(state.cart).toEqual([]);
});
test("old demo products cannot be checked out against the live catalogue", async () => {
  const product = { id: "one", key: "one-default", qty: 1, price_mvr: 100 };
  localStorage.setItem("mv_cart_v1", JSON.stringify([product]));
  useCatalog.mockReturnValue({ islands: [{ island: "Reviewed Island", fee: 20 }], products: [], loading: false, error: null });
  await render(); expect(state.cart).toHaveLength(1); expect(state.cartValid).toBe(false);
});
test("reviewed preorders retain cart/wishlist functionality and use variant prices", async () => {
  const product = { id: "one", slug: "reviewed", title: "Reviewed", product_type: "preorder", stock_status: "preorder", size_options: ["M"], price_mvr: 100,
    product_variants: [{ size: "M", price_mvr: "120.50", stock_status: "preorder" }] };
  useCatalog.mockReturnValue({ islands: [{ island: "Reviewed Island", fee: 20 }], products: [product], loading: false, error: null });
  await render(); await act(() => state.addToCart(product, 2, "M"));
  expect(state.subtotal).toBe(241); expect(state.cartValid).toBe(true); expect(state.cart[0].slug).toBe("reviewed");
  await act(() => state.toggleWishlist("one")); expect(state.wishlist).toEqual(["one"]);
});
