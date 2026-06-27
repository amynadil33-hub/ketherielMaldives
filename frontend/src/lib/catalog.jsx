import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  BRANDS,
  CATEGORIES,
  FULFILLMENT_STAGES,
  ISLANDS,
  PRODUCTS,
  REVIEWS,
  TRENDING_PROMPTS,
} from "./seedData";
import { fetchSupabaseCatalog, isSupabaseConfigured } from "./supabase";

const fallbackCatalog = {
  brands: BRANDS,
  categories: CATEGORIES,
  fulfillmentStages: FULFILLMENT_STAGES,
  islands: ISLANDS,
  products: PRODUCTS,
  reviews: REVIEWS,
  trendingPrompts: TRENDING_PROMPTS,
};

const CatalogContext = createContext({
  ...fallbackCatalog,
  loading: false,
  source: "seed",
  error: null,
});

const asArray = (value) => (Array.isArray(value) ? value : []);
const asNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function normalizeProduct(row) {
  const brand = row.brands?.name || row.brand || "";
  const category = row.categories?.slug || row.category || "";

  return {
    ...row,
    brand,
    category,
    badges: asArray(row.badges),
    color_options: asArray(row.color_options),
    compare_at_price_mvr: row.compare_at_price_mvr == null ? null : asNumber(row.compare_at_price_mvr),
    gallery_images: asArray(row.gallery_images),
    price_mvr: asNumber(row.price_mvr),
    preorder: Boolean(row.preorder),
    size_options: asArray(row.size_options),
    source_price: row.source_price == null ? null : asNumber(row.source_price),
    specifications: row.specifications || {},
  };
}

function normalizeCategory(row, productCounts) {
  return {
    slug: row.slug,
    name: row.name,
    icon: row.icon,
    gradient: row.color_gradient,
    img: row.image_url,
    count: asNumber(row.product_count, productCounts[row.slug] || 0),
    blurb: row.blurb || "",
  };
}

function normalizeBrand(row) {
  return {
    name: row.name,
    slug: row.slug,
    verified: Boolean(row.is_verified),
    country: row.source_country || "India",
  };
}

function normalizeIsland(row) {
  return {
    island: row.island_name,
    atoll: row.atoll,
    fee: asNumber(row.delivery_fee_mvr),
    min: asNumber(row.extra_min_days),
    max: asNumber(row.extra_max_days),
    courier: row.courier_partner || "Local courier",
  };
}

function normalizeReview(row) {
  return {
    name: row.customer_name,
    island: row.island,
    rating: asNumber(row.rating, 5),
    comment: row.comment,
    verified: Boolean(row.is_verified),
  };
}

function normalizeCatalog(raw) {
  const products = asArray(raw.products).map(normalizeProduct);
  const productCounts = products.reduce((acc, product) => {
    if (product.category) acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  return {
    brands: asArray(raw.brands).map(normalizeBrand),
    categories: asArray(raw.categories).map((row) => normalizeCategory(row, productCounts)),
    islands: asArray(raw.islands).map(normalizeIsland),
    products,
    reviews: asArray(raw.reviews).map(normalizeReview),
  };
}

function withFallback(remote) {
  return {
    ...fallbackCatalog,
    brands: remote.brands.length ? remote.brands : fallbackCatalog.brands,
    categories: remote.categories.length ? remote.categories : fallbackCatalog.categories,
    islands: remote.islands.length ? remote.islands : fallbackCatalog.islands,
    products: remote.products.length ? remote.products : fallbackCatalog.products,
    reviews: remote.reviews.length ? remote.reviews : fallbackCatalog.reviews,
  };
}

export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(fallbackCatalog);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [source, setSource] = useState("seed");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let alive = true;
    setLoading(true);

    fetchSupabaseCatalog()
      .then((raw) => {
        if (!alive) return;
        setCatalog(withFallback(normalizeCatalog(raw)));
        setSource("supabase");
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        console.warn("Falling back to bundled seed data:", err);
        setCatalog(fallbackCatalog);
        setSource("seed");
        setError(err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(
    () => ({ ...catalog, loading, source, error }),
    [catalog, error, loading, source],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  return useContext(CatalogContext);
}
