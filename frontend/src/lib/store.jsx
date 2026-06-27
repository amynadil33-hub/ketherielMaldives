// Lightweight client-side store using React Context.
// Persists cart, wishlist, selected island in localStorage.
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { ISLANDS } from "./seedData";
import { useCatalog } from "./catalog.jsx";

const Ctx = createContext(null);

const LS = {
  cart: "mv_cart_v1",
  wish: "mv_wish_v1",
  island: "mv_island_v1",
  adminAuth: "mv_admin_v1",
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
  const { islands } = useCatalog();
  const islandOptions = islands?.length ? islands : ISLANDS;
  const [cart, setCart] = useState(() => load(LS.cart, []));
  const [wishlist, setWishlist] = useState(() => load(LS.wish, []));
  const [island, setIsland] = useState(() => load(LS.island, islandOptions[0]));
  const [adminAuthed, setAdminAuthed] = useState(() => load(LS.adminAuth, false));

  useEffect(() => {
    setIsland((prev) => {
      const match = islandOptions.find((i) => i.island === prev?.island);
      return match || prev || islandOptions[0];
    });
  }, [islandOptions]);

  useEffect(() => save(LS.cart, cart), [cart]);
  useEffect(() => save(LS.wish, wishlist), [wishlist]);
  useEffect(() => save(LS.island, island), [island]);
  useEffect(() => save(LS.adminAuth, adminAuthed), [adminAuthed]);

  const addToCart = useCallback((product, qty = 1, variant = null) => {
    setCart((prev) => {
      const key = `${product.id}-${variant || "default"}`;
      const existing = prev.find((c) => c.key === key);
      if (existing) {
        return prev.map((c) => (c.key === key ? { ...c, qty: c.qty + qty } : c));
      }
      return [
        ...prev,
        {
          key,
          id: product.id,
          title: product.title,
          sku: product.sku,
          price_mvr: product.price_mvr,
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
    setCart((prev) => prev.map((c) => (c.key === key ? { ...c, qty: Math.max(1, qty) } : c)));
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
    adminAuthed, setAdminAuthed,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}
