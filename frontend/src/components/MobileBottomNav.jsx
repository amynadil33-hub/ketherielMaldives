import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Sparkles, Search, User } from "lucide-react";
import { useStore } from "../lib/store.jsx";

export default function MobileBottomNav() {
  const loc = useLocation();
  const { cartCount } = useStore();
  if (loc.pathname.startsWith("/admin")) return null;

  const items = [
    { to: "/", label: "Home", icon: Home, key: "home" },
    { to: "/shop", label: "Shop", icon: ShoppingBag, key: "shop" },
    { to: "/ai", label: "AI", icon: Sparkles, key: "ai", accent: true },
    { to: "/find-it-for-me", label: "Find", icon: Search, key: "find" },
    { to: "/cart", label: "Cart", icon: User, key: "cart", badge: cartCount },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40">
      <div className="mx-3 mb-3 rounded-3xl glass border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        <ul className="grid grid-cols-5 py-2">
          {items.map(({ to, label, icon: Icon, key, accent, badge }) => {
            const active = to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to);
            return (
              <li key={key} className="flex">
                <Link to={to} className="flex-1 flex flex-col items-center justify-center py-2 relative" data-testid={`bottom-nav-${key}`}>
                  <div className={`relative flex items-center justify-center h-9 w-9 rounded-full transition-all ${accent ? "gradient-coral text-white" : active ? "bg-slate-900 text-white" : "text-slate-600"}`}>
                    <Icon className="h-4 w-4" />
                    {badge > 0 && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 text-white text-[10px] h-4 min-w-4 px-1 flex items-center justify-center">{badge}</span>
                    )}
                  </div>
                  <span className={`mt-1 text-[10px] ${active ? "text-slate-900 font-semibold" : "text-slate-500"}`}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
