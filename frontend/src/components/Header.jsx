import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, Heart, Search, Menu, X, Sparkles, MapPin, ChevronDown } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import IslandSelector from "./IslandSelector.jsx";
import { CATEGORIES } from "../lib/seedData.js";

export default function Header() {
  const { cartCount, island, wishlist } = useStore();
  const [open, setOpen] = useState(false);
  const [islandOpen, setIslandOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const loc = useLocation();

  const onSearch = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/shop?q=${encodeURIComponent(q)}`);
  };

  // Hide on admin route
  if (loc.pathname.startsWith("/admin")) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="font-display text-2xl tracking-tight text-slate-900">
            Raalhu<span className="text-teal-700">.</span>
          </Link>
          <div className="text-xs uppercase tracking-[0.25em] text-teal-700 font-semibold">Admin Console</div>
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900" data-testid="admin-exit-storefront">Exit to storefront</Link>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Top trust strip */}
      <div className="hidden md:block bg-slate-900 text-white text-xs">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between">
          <span className="tracking-wider uppercase font-semibold text-amber-300">Authentic branded products · India sourcing · Island-wide delivery</span>
          <div className="flex gap-5 text-slate-300">
            <Link to="/track" className="hover:text-white" data-testid="header-track-order">Track order</Link>
            <Link to="/delivery" className="hover:text-white" data-testid="header-delivery-link">Delivery to islands</Link>
            <Link to="/how-it-works" className="hover:text-white" data-testid="header-how-link">How it works</Link>
            <Link to="/admin" className="hover:text-amber-300" data-testid="header-admin-link">Admin</Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <button className="md:hidden p-2 -ml-2" onClick={() => setOpen(true)} data-testid="header-menu-button" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/" className="font-display text-2xl md:text-3xl tracking-tight text-slate-900 mr-2" data-testid="header-logo">
            Raalhu<span className="text-teal-700">.</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link to="/shop" className="hover:text-teal-700" data-testid="nav-shop">Shop</Link>
            <Link to="/find-it-for-me" className="hover:text-teal-700" data-testid="nav-fifm">Find-it-for-me</Link>
            <Link to="/ai" className="hover:text-teal-700 inline-flex items-center gap-1" data-testid="nav-ai">
              <Sparkles className="h-4 w-4 text-amber-500" /> AI Concierge
            </Link>
          </nav>

          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md ml-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search earbuds, sunscreen, abaya…"
                className="w-full rounded-full border border-stone-200 bg-stone-50 px-9 py-2 text-sm placeholder:text-slate-400 focus:border-teal-700 focus:bg-white focus:outline-none"
                data-testid="header-search-input"
              />
            </div>
          </form>

          <button
            onClick={() => setIslandOpen(true)}
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-stone-200 px-3 py-2 text-sm text-slate-700 hover:border-teal-700"
            data-testid="header-island-trigger"
          >
            <MapPin className="h-4 w-4 text-teal-700" />
            <span className="truncate max-w-[120px]">{island.island}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          <Link to="/wishlist" className="relative p-2 rounded-full hover:bg-stone-100" data-testid="header-wishlist">
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <span className="absolute -right-0 -top-0 rounded-full bg-rose-500 text-white text-[10px] h-4 min-w-4 px-1 flex items-center justify-center">{wishlist.length}</span>
            )}
          </Link>
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-stone-100" data-testid="header-cart">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0 -top-0 rounded-full bg-slate-900 text-white text-[10px] h-4 min-w-4 px-1 flex items-center justify-center font-bold">{cartCount}</span>
            )}
          </Link>
        </div>

        {/* Category bar */}
        <div className="hidden md:block border-t border-stone-100">
          <div className="mx-auto max-w-7xl px-4 flex gap-6 overflow-x-auto scroll-hide text-sm text-slate-600 h-11 items-center">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} to={`/shop/${c.slug}`} className="whitespace-nowrap hover:text-teal-700 transition-colors" data-testid={`header-cat-${c.slug}`}>
                {c.name}
              </Link>
            ))}
            <span className="ml-auto text-xs text-rose-500 font-semibold whitespace-nowrap">Free WhatsApp support · +960 791-2865</span>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-sm bg-white p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl">Raalhu<span className="text-teal-700">.</span></span>
              <button onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={(e) => { onSearch(e); setOpen(false); }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full rounded-full border border-stone-200 bg-stone-50 px-9 py-2.5 text-sm" data-testid="mobile-search-input" />
              </div>
            </form>
            <button onClick={() => { setIslandOpen(true); setOpen(false); }} className="flex items-center gap-2 text-left text-sm rounded-2xl border border-stone-200 p-3" data-testid="mobile-island-trigger">
              <MapPin className="h-4 w-4 text-teal-700" />
              <div className="flex-1">
                <div className="text-xs text-slate-500">Delivering to</div>
                <div className="font-semibold text-slate-900">{island.island}</div>
              </div>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </button>
            <div className="space-y-1">
              {[
                ["/shop", "Shop all"],
                ["/find-it-for-me", "Find-it-for-me"],
                ["/ai", "AI Shopping Concierge"],
                ["/wishlist", "Wishlist"],
                ["/track", "Track order"],
                ["/delivery", "Delivery to islands"],
                ["/how-it-works", "How pre-order works"],
                ["/admin", "Admin"],
              ].map(([to, label]) => (
                <Link key={to} to={to} onClick={() => setOpen(false)} className="block py-3 border-b border-stone-100 text-slate-800" data-testid={`mobile-link-${to.replace(/\//g,'-')}`}>
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-auto text-xs text-slate-500">
              <div className="font-semibold text-slate-900">Need help?</div>
              <a href="https://wa.me/9607912865" className="text-teal-700">WhatsApp +960 791-2865</a>
            </div>
          </div>
        </div>
      )}

      <IslandSelector open={islandOpen} onClose={() => setIslandOpen(false)} />
    </>
  );
}
