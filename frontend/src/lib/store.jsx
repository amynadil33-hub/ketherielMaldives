// Lightweight client-side store using React Context.
// Persists cart, wishlist, selected island in localStorage.
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { productSelection } from "./productOptions";
import { useCatalog } from "./catalog.jsx";

const Ctx = createContext(null);
const EMPTY_ISLAND = { island: "", atoll: "", fee: 0, min: 0, max: 0, courier: "" };

const LS = {
  cart: "mv_cart_v1",
  wish: "mv_wish_v1",
  island: "mv_island_v1",
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function StoreProvider({ children }) {
  const { islands, products, loading, error } = useCatalog();
  const islandOptions = islands;
  const [cart, setCart] = useState(() => {
    const saved = load(LS.cart, []);
    return Array.isArray(saved) ? saved.filter((item) => item && typeof item.key === "string" && typeof item.id === "string" && Number.isFinite(item.price_mvr) && Number.isInteger(item.qty) && item.qty > 0 && item.qty <= 99) : [];
  });
  const [wishlist, setWishlist] = useState(() => { const saved = load(LS.wish, []); return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []; });
  const [island, setIsland] = useState(() => islandOptions.find((i) => i.island === load(LS.island, {})?.island) || EMPTY_ISLAND);

  useEffect(() => {
    setIsland((prev) => {
      const match = islandOptions.find((i) => i.island === prev?.island);
      return match || islandOptions[0] || EMPTY_ISLAND;
    });
  }, [islandOptions]);

  useEffect(() => save(LS.cart, cart), [cart]);
  useEffect(() => save(LS.wish, wishlist), [wishlist]);
  useEffect(() => save(LS.island, island), [island]);
  useEffect(() => { try { localStorage.removeItem("mv_admin_v1"); } catch {} }, []);

  const addToCart = useCallback((product, qty = 1, variant = null) => {
    const selection = productSelection(product, variant);
    if (!selection || !Number.isInteger(qty) || qty < 1 || qty > 99) return;
    setCart((prev) => {
      const key = `${product.id}-${variant || "default"}`;
      const existing = prev.find((c) => c.key === key);
      if (existing) {
        return prev.map((c) => (c.key === key ? { ...c, qty: Math.min(99, c.qty + qty) } : c));
      }
      return [
        ...prev,
        {
          key,
          id: product.id,
          title: product.title,
          slug: product.slug,
          sku: selection.sku,
          price_mvr: selection.price,
          compare_at_price_mvr: product.compare_at_price_mvr,
          main_image_url: product.main_image_url,
          brand: product.brand,
          product_type: product.product_type,
          variant,
          qty,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((key) => {
    setCart((prev) => prev.filter((c) => c.key !== key));
  }, []);

  const updateQty = useCallback((key, qty) => {
    setCart((prev) => prev.map((c) => (c.key === key ? { ...c, qty: Math.min(99, Math.max(1, Number.isInteger(qty) ? qty : 1)) } : c)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((productId) => {
    setWishlist((prev) => (prev.includes(productId) ? prev.filter((p) => p !== productId) : [...prev, productId]));
  }, []);

  const subtotal = useMemo(() => cart.reduce((acc, c) => acc + c.price_mvr * c.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((a, c) => a + c.qty, 0), [cart]);

  const value = {
    cart, addToCart, removeFromCart, updateQty, clearCart, subtotal, cartCount,
    wishlist, toggleWishlist,
    island, setIsland,
    cartValid: !loading && !error && !!island.island && cart.every((c) => {
      const p = products.find((row) => row.id === c.id);
      return p && p.product_type === "preorder" && productSelection(p, c.variant)?.price === c.price_mvr && Number.isInteger(c.qty) && c.qty > 0 && c.qty <= 99;
    }),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}
