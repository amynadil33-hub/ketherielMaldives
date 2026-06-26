import React from "react";
import { Link } from "react-router-dom";
import { Heart, Plus } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { formatMVR } from "../lib/api";
import { toast } from "sonner";

const badgeStyles = {
  "India Pre-order": "bg-teal-100 text-teal-800",
  "Ready in Maldives": "bg-emerald-100 text-emerald-800",
  "Original Brand": "bg-amber-100 text-amber-800",
  "Best Value": "bg-rose-100 text-rose-800",
  "Fast Sourcing": "bg-sky-100 text-sky-800",
  "Custom Sourcing": "bg-violet-100 text-violet-800",
};

export default function ProductCard({ product, size = "md" }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const isWished = wishlist.includes(product.id);
  const off = product.compare_at_price_mvr ? Math.round(((product.compare_at_price_mvr - product.price_mvr) / product.compare_at_price_mvr) * 100) : 0;

  return (
    <div className="group relative rounded-2xl bg-white border border-stone-200 overflow-hidden hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition-all duration-300" data-testid={`product-card-${product.slug}`}>
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
          <img
            src={product.main_image_url}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
          {/* badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 max-w-[70%]">
            {(product.badges || []).slice(0, 2).map((b) => (
              <span key={b} className={`text-[10px] font-bold tracking-wide rounded-full px-2 py-0.5 ${badgeStyles[b] || "bg-slate-100 text-slate-800"}`}>{b}</span>
            ))}
          </div>
          {off > 0 && (
            <div className="absolute top-2 right-2 rounded-full bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5">-{off}%</div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); toast.success(isWished ? "Removed from wishlist" : "Added to wishlist"); }}
            className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-white/85 backdrop-blur grid place-items-center hover:bg-white"
            aria-label="Toggle wishlist"
            data-testid={`wishlist-toggle-${product.slug}`}
          >
            <Heart className={`h-4 w-4 ${isWished ? "fill-rose-500 text-rose-500" : "text-slate-700"}`} />
          </button>
        </div>
        <div className="p-3 md:p-4">
          <div className="text-[11px] uppercase tracking-widest text-teal-700 font-semibold">{product.brand}</div>
          <div className="mt-1 line-clamp-2 text-sm md:text-base font-semibold text-slate-900 leading-snug">{product.title}</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base md:text-lg font-bold text-slate-900">{formatMVR(product.price_mvr)}</span>
            {product.compare_at_price_mvr && (
              <span className="text-xs text-slate-400 line-through">{formatMVR(product.compare_at_price_mvr)}</span>
            )}
          </div>
        </div>
      </Link>
      <button
        onClick={() => { addToCart(product, 1); toast.success("Added to cart"); }}
        className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-slate-900 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        aria-label="Add to cart"
        data-testid={`add-to-cart-${product.slug}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
