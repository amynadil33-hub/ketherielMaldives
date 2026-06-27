import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Instagram, Facebook, MessageCircle } from "lucide-react";
import { useT } from "../lib/i18n.jsx";
import { useCatalog } from "../lib/catalog.jsx";

export default function Footer() {
  const loc = useLocation();
  const t = useT();
  const { categories } = useCatalog();
  if (loc.pathname.startsWith("/admin")) return null;
  return (
    <footer className="mt-24 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-16 grid gap-12 md:grid-cols-4">
        <div>
          <Link to="/" className="font-display text-3xl text-white">Raalhu<span className="text-teal-400">.</span></Link>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-xs">
            {t("foot.sub")}
          </p>
          <div className="mt-6 flex gap-3">
            <a href="#" className="h-9 w-9 rounded-full border border-white/10 grid place-items-center hover:border-teal-400"><Instagram className="h-4 w-4" /></a>
            <a href="#" className="h-9 w-9 rounded-full border border-white/10 grid place-items-center hover:border-teal-400"><Facebook className="h-4 w-4" /></a>
            <a href="https://wa.me/9607912865" className="h-9 w-9 rounded-full border border-white/10 grid place-items-center hover:border-emerald-400"><MessageCircle className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-teal-400 font-semibold mb-4">{t("foot.shop")}</h4>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}><Link to={`/shop/${c.slug}`} className="hover:text-white">{t(`cat.${c.slug}`)}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-teal-400 font-semibold mb-4">{t("foot.concierge")}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/find-it-for-me" className="hover:text-white">{t("foot.linkFifm")}</Link></li>
            <li><Link to="/ai" className="hover:text-white">{t("foot.linkAI")}</Link></li>
            <li><Link to="/track" className="hover:text-white">{t("foot.linkTrack")}</Link></li>
            <li><Link to="/delivery" className="hover:text-white">{t("foot.linkDelivery")}</Link></li>
            <li><Link to="/how-it-works" className="hover:text-white">{t("foot.linkHow")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-teal-400 font-semibold mb-4">{t("foot.help")}</h4>
          <ul className="space-y-2 text-sm">
            <li>{t("foot.wa")} <a href="https://wa.me/9607912865" className="text-emerald-300">+960 791-2865</a></li>
            <li>{t("foot.hours")}</li>
            <li>{t("foot.payments")}</li>
            <li className="text-xs text-slate-500 pt-3">{t("foot.brandDisclaim")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {t("foot.bottom")}
      </div>
    </footer>
  );
}
