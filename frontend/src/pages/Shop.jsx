import React, { useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useCatalog } from "../lib/catalog.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useT } from "../lib/i18n.jsx";
import { SlidersHorizontal, X } from "lucide-react";

export default function Shop() {
  const { category } = useParams();
  const [sp] = useSearchParams();
  const { categories, products: catalogProducts } = useCatalog();
  const t = useT();
  const q = sp.get("q")?.toLowerCase() || "";
  const cat = categories.find((c) => c.slug === category);

  const [filters, setFilters] = useState({ priceMax: 5000, productType: "all", sort: "featured" });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const products = useMemo(() => {
    let list = catalogProducts.filter((p) => {
      if (category && p.category !== category) return false;
      if (q && !`${p.title} ${p.brand} ${p.subcategory}`.toLowerCase().includes(q)) return false;
      if (filters.productType !== "all" && p.product_type !== filters.productType) return false;
      if (filters.priceMax && p.price_mvr > filters.priceMax) return false;
      return true;
    });
    if (filters.sort === "price-asc") list = [...list].sort((a, b) => a.price_mvr - b.price_mvr);
    else if (filters.sort === "price-desc") list = [...list].sort((a, b) => b.price_mvr - a.price_mvr);
    else if (filters.sort === "discount") list = [...list].sort((a, b) => {
      const da = a.compare_at_price_mvr ? (a.compare_at_price_mvr - a.price_mvr) / a.compare_at_price_mvr : 0;
      const db = b.compare_at_price_mvr ? (b.compare_at_price_mvr - b.price_mvr) / b.compare_at_price_mvr : 0;
      return db - da;
    });
    return list;
  }, [catalogProducts, category, q, filters]);

  return (
    <div>
      {/* HERO STRIP */}
      <section className="relative bg-slate-900 text-white">
        {cat && <img src={cat.img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/70 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 md:py-20">
          <div className="text-xs uppercase tracking-[0.3em] text-teal-300 font-semibold">{cat ? t("shop.title.category") : q ? t("shop.title.search") : t("shop.title.shop")}</div>
          <h1 className="font-display text-5xl md:text-6xl mt-3">{cat ? t(`cat.${cat.slug}`) : q ? `"${q}"` : t("shop.title.all")}</h1>
          {cat?.blurb && <p className="text-slate-300 mt-2 max-w-xl">{cat.blurb}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        {/* category chips */}
        <div className="mb-6 flex gap-2 overflow-x-auto scroll-hide">
          <Link to="/shop" className={`whitespace-nowrap rounded-full px-4 py-2 text-sm border transition-colors ${!category ? "bg-slate-900 text-white border-slate-900" : "border-stone-200 hover:border-teal-700"}`} data-testid="filter-cat-all">{t("shop.all")}</Link>
          {categories.map((c) => (
            <Link key={c.slug} to={`/shop/${c.slug}`} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm border transition-colors ${category === c.slug ? "bg-slate-900 text-white border-slate-900" : "border-stone-200 hover:border-teal-700"}`} data-testid={`filter-cat-${c.slug}`}>{t(`cat.${c.slug}`)}</Link>
          ))}
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          {/* sidebar (desktop) */}
          <aside className="hidden md:block md:col-span-3">
            <FilterPanel filters={filters} setFilters={setFilters} t={t} />
          </aside>

          <div className="md:col-span-9">
            <div className="flex items-center justify-between mb-5">
              <div className="text-sm text-slate-500"><span className="font-semibold text-slate-900">{products.length}</span> {t("shop.products")}</div>
              <button onClick={() => setFiltersOpen(true)} className="md:hidden inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm" data-testid="open-filters">
                <SlidersHorizontal className="h-4 w-4" /> {t("shop.filters")}
              </button>
              <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} className="hidden md:block rounded-full border border-stone-200 bg-white px-4 py-2 text-sm" data-testid="sort-select">
                <option value="featured">{t("shop.sort.featured")}</option>
                <option value="price-asc">{t("shop.sort.priceAsc")}</option>
                <option value="price-desc">{t("shop.sort.priceDesc")}</option>
                <option value="discount">{t("shop.sort.discount")}</option>
              </select>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <div className="font-display text-3xl text-slate-900">{t("shop.empty.title")}</div>
                <p className="mt-2">{t("shop.empty.sub")}</p>
                <Link to="/find-it-for-me" className="mt-4 inline-block rounded-full bg-slate-900 text-white px-5 py-2 text-sm">{t("nav.fifm")}</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setFiltersOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-2xl">{t("shop.filters")}</h3>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X className="h-5 w-5" /></button>
            </div>
            <FilterPanel filters={filters} setFilters={setFilters} t={t} />
            <button onClick={() => setFiltersOpen(false)} className="mt-6 w-full rounded-full bg-slate-900 text-white py-3 font-semibold" data-testid="apply-filters">{t("shop.view")} {products.length} {t("shop.products")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({ filters, setFilters, t }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-3">{t("shop.availability")}</div>
        <div className="space-y-2 text-sm">
          {[
            { v: "all", l: t("shop.all") },
            { v: "ready_stock", l: t("shop.avail.ready") },
            { v: "preorder", l: t("shop.avail.preorder") },
            { v: "custom_sourcing", l: t("shop.avail.custom") },
          ].map((o) => (
            <label key={o.v} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="ptype" checked={filters.productType === o.v} onChange={() => setFilters({ ...filters, productType: o.v })} data-testid={`filter-type-${o.v}`} />
              {o.l}
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-3">{t("shop.maxPrice")}</div>
        <input type="range" min="100" max="5000" step="50" value={filters.priceMax} onChange={(e) => setFilters({ ...filters, priceMax: Number(e.target.value) })} className="w-full accent-teal-700" data-testid="filter-price-range" />
        <div className="text-sm text-slate-700 mt-1">{t("shop.upTo")} {filters.priceMax.toLocaleString()}</div>
      </div>
      <div className="md:hidden">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-3">{t("shop.sortLabel")}</div>
        <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} className="w-full rounded-full border border-stone-200 px-4 py-2 text-sm">
          <option value="featured">{t("shop.sortShort.featured")}</option>
          <option value="price-asc">{t("shop.sort.priceAsc")}</option>
          <option value="price-desc">{t("shop.sort.priceDesc")}</option>
          <option value="discount">{t("shop.sort.discount")}</option>
        </select>
      </div>
    </div>
  );
}
