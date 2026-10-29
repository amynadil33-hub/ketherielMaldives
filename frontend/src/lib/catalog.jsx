import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { FULFILLMENT_STAGES, TRENDING_PROMPTS } from "./seedData";
import { fetchSupabaseCatalog, isSupabaseConfigured } from "./supabase";

const emptyCatalog = {
  brands: [], categories: [], islands: [], products: [], reviews: [],
  fulfillmentStages: FULFILLMENT_STAGES, trendingPrompts: TRENDING_PROMPTS,
};

const CatalogContext = createContext({ ...emptyCatalog, loading: false, source: "unavailable", error: null });

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
    product_variants: asArray(row.product_variants).filter((variant) => variant && typeof variant === "object"),
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
    count: productCounts[row.slug] || 0,
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
  const products = asArray(raw.products)
    .filter((row) => row && row.status === "published" && row.is_active === true && Number.isFinite(Number(row.price_mvr)) && Number(row.price_mvr) > 0)
    .map(normalizeProduct);
  const productCounts = products.reduce((acc, product) => {
    if (product.category) acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  return {
    brands: asArray(raw.brands).map(normalizeBrand),
    categories: asArray(raw.categories).map((row) => normalizeCategory(row, productCounts)),
    islands: asArray(raw.islands).filter((row) => row?.is_active === true && row.delivery_fee_mvr != null && Number.isFinite(Number(row.delivery_fee_mvr)) && Number(row.delivery_fee_mvr) >= 0 && Number.isInteger(row.extra_min_days) && Number.isInteger(row.extra_max_days) && row.extra_min_days >= 0 && row.extra_max_days >= row.extra_min_days).map(normalizeIsland),
    products,
    reviews: asArray(raw.reviews).map(normalizeReview),
  };
}

export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(emptyCatalog);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [source, setSource] = useState("unavailable");
  const [error, setError] = useState(isSupabaseConfigured ? null : new Error("Catalogue is not configured"));

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let alive = true;
    setLoading(true);

    fetchSupabaseCatalog()
      .then((raw) => {
        if (!alive) return;
        setCatalog({ ...emptyCatalog, ...normalizeCatalog(raw) });
        setSource("supabase");
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setCatalog(emptyCatalog);
        setSource("unavailable");
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
