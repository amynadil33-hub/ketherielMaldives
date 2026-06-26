import React, { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PRODUCTS } from "../lib/seedData";
import { useStore } from "../lib/store.jsx";
import { useT } from "../lib/i18n.jsx";
import { formatMVR, waLink, computeDeliveryRange } from "../lib/api";
import { Heart, ShoppingBag, MessageCircle, Sparkles, Truck, ShieldCheck, BadgeCheck, ChevronRight } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import { toast } from "sonner";

export default function ProductDetail() {
  const { slug } = useParams();
  const product = PRODUCTS.find((p) => p.slug === slug);
  const { addToCart, toggleWishlist, wishlist, island } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState(product?.size_options?.[0] || null);
  const [color, setColor] = useState(product?.color_options?.[0] || null);
  const [qty, setQty] = useState(1);

  const related = useMemo(
    () => product ? PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4) : [],
    [product]
  );

  if (!product) return (
    <div className="mx-auto max-w-3xl px-4 py-32 text-center">
      <h2 className="font-display text-3xl">{t("product.notFound")}</h2>
      <Link to="/shop" className="mt-4 inline-block text-teal-700 underline">{t("product.backToShop")}</Link>
    </div>
  );

  const images = [product.main_image_url, ...(product.gallery_images || [])].filter(Boolean);
  const { min, max } = computeDeliveryRange(product, island);
  const off = product.compare_at_price_mvr ? Math.round(((product.compare_at_price_mvr - product.price_mvr) / product.compare_at_price_mvr) * 100) : 0;
  const isWished = wishlist.includes(product.id);

  const variant = [size, color].filter(Boolean).join(" / ") || null;

  const handleBuyNow = () => {
    addToCart(product, qty, variant);
    nav("/checkout");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
        <Link to="/" className="hover:text-slate-900">{t("bnav.home")}</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/shop/${product.category}`} className="hover:text-slate-900 capitalize">{t(`cat.${product.category}`)}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-700 truncate">{product.title}</span>
      </div>

      <div className="grid md:grid-cols-12 gap-8 lg:gap-14">
        {/* Gallery */}
        <div className="md:col-span-7">
          <div className="rounded-3xl overflow-hidden bg-stone-100 aspect-[4/5] md:aspect-[5/5] relative">
            <img src={images[activeImg]} alt={product.title} className="w-full h-full object-cover" />
            {(product.badges || []).slice(0, 1).map((b) => (
              <span key={b} className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur text-xs font-bold tracking-widest uppercase px-3 py-1.5 text-slate-900">{t("badge." + b.replace(/[\s-]/g, ""))}</span>
            ))}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((src, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`aspect-square overflow-hidden rounded-2xl border-2 ${i === activeImg ? "border-teal-700" : "border-transparent"}`} data-testid={`gallery-thumb-${i}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:col-span-5">
          <div className="text-xs uppercase tracking-[0.25em] text-teal-700 font-semibold">{product.brand}</div>
          <h1 className="font-display text-4xl md:text-5xl mt-2 leading-tight">{product.title}</h1>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900" data-testid="product-price">{formatMVR(product.price_mvr)}</span>
            {product.compare_at_price_mvr && (
              <span className="text-base text-slate-400 line-through">{formatMVR(product.compare_at_price_mvr)}</span>
            )}
            {off > 0 && <span className="rounded-full bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5">-{off}%</span>}
          </div>
          <p className="text-sm text-slate-500 mt-1">{t("product.preorderFinal")}</p>

          {/* delivery */}
          <div className="mt-5 rounded-2xl bg-stone-100 p-4 flex gap-3 items-start">
            <Truck className="h-5 w-5 text-teal-700 mt-0.5" />
            <div className="text-sm flex-1">
              <div className="font-semibold text-slate-900">{t("product.deliverTo")} {island.island}</div>
              <div className="text-slate-600">{t("product.estimated")} <span className="font-semibold">{min}–{max} {t("product.days")}</span> · MVR {island.fee} {t("product.deliveryFee")} · {island.courier}</div>
            </div>
          </div>

          {/* variants */}
          {product.size_options?.length > 0 && (
            <div className="mt-5">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">{t("product.size")}</div>
              <div className="flex flex-wrap gap-2">
                {product.size_options.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`min-w-12 rounded-full px-4 py-2 text-sm border transition-colors ${size === s ? "bg-slate-900 text-white border-slate-900" : "border-stone-200 hover:border-teal-700"}`} data-testid={`size-${s}`}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {product.color_options?.length > 0 && (
            <div className="mt-5">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">{t("product.color")}</div>
              <div className="flex flex-wrap gap-2">
                {product.color_options.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={`rounded-full px-4 py-2 text-sm border transition-colors ${color === c ? "bg-slate-900 text-white border-slate-900" : "border-stone-200 hover:border-teal-700"}`} data-testid={`color-${c}`}>{c}</button>
                ))}
              </div>
            </div>
          )}

          {/* qty */}
          <div className="mt-5 inline-flex items-center rounded-full border border-stone-200">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 text-lg" data-testid="qty-decrement">−</button>
            <span className="px-3 font-semibold min-w-8 text-center" data-testid="qty-value">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="px-4 py-2 text-lg" data-testid="qty-increment">+</button>
          </div>

          {/* actions */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={() => { addToCart(product, qty, variant); toast.success(t("product.addedToCart")); }} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white py-3 font-semibold transition-colors" data-testid="add-to-cart-button">
              <ShoppingBag className="h-4 w-4" /> {t("product.addToCart")}
            </button>
            <button onClick={handleBuyNow} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800" data-testid="buy-now-button">
              {t("product.buyNow")}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <a href={waLink(`Hi Raalhu, I'm interested in: ${product.title} (${product.sku}). Can you confirm availability for ${island.island}?`)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500 text-emerald-700 py-2.5 font-semibold hover:bg-emerald-500 hover:text-white transition-colors" data-testid="whatsapp-product-button">
              <MessageCircle className="h-4 w-4" /> {t("product.wa.ask")}
            </a>
            <button onClick={() => { toggleWishlist(product.id); toast.success(isWished ? t("product.wishlist.removed") : t("product.wishlist.added")); }} className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 py-2.5 font-semibold hover:border-rose-500 hover:text-rose-500" data-testid="wishlist-button">
              <Heart className={`h-4 w-4 ${isWished ? "fill-rose-500 text-rose-500" : ""}`} /> {isWished ? t("product.wishlist.saved") : t("product.wishlist.save")}
            </button>
          </div>

          {/* trust strip */}
          <ul className="mt-7 space-y-2 text-sm text-slate-600">
            <li className="flex gap-2"><BadgeCheck className="h-4 w-4 text-emerald-600 mt-0.5" /> {t("product.trust.authentic")} {product.source_country || "India"}.</li>
            <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5" /> {t("product.trust.admin")}</li>
            <li className="flex gap-2"><Sparkles className="h-4 w-4 text-amber-500 mt-0.5" /> {t("product.trust.wa")}</li>
          </ul>
        </div>
      </div>

      {/* description / spec tabs */}
      <section className="mt-16 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-7">
          <h3 className="font-display text-2xl">{t("product.about")}</h3>
          <p className="mt-3 text-slate-600 leading-relaxed">{product.description || product.short_description}</p>
          {product.warranty && (
            <div className="mt-5">
              <div className="text-xs uppercase tracking-widest text-teal-700 font-semibold">{t("product.warranty")}</div>
              <p className="text-sm text-slate-600 mt-1">{product.warranty}</p>
            </div>
          )}
          {product.return_policy && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-widest text-teal-700 font-semibold">{t("product.returns")}</div>
              <p className="text-sm text-slate-600 mt-1">{product.return_policy}</p>
            </div>
          )}
        </div>
        <div className="md:col-span-5">
          <h3 className="font-display text-2xl">{t("product.specs")}</h3>
          <div className="mt-3 rounded-2xl border border-stone-200 divide-y divide-stone-200">
            {Object.entries(product.specifications || {}).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm px-4 py-3">
                <span className="capitalize text-slate-500">{k.replace(/_/g, " ")}</span>
                <span className="font-semibold text-slate-900">{v}</span>
              </div>
            ))}
            {Object.keys(product.specifications || {}).length === 0 && (
              <div className="text-sm text-slate-500 px-4 py-3">{t("product.specsNone")}</div>
            )}
          </div>
        </div>
      </section>

      {/* related */}
      <section className="mt-20">
        <h3 className="font-display text-3xl">{t("product.related")}</h3>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {related.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
