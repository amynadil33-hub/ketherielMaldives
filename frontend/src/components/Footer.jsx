import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Instagram, Facebook, MessageCircle } from "lucide-react";

export default function Footer() {
  const loc = useLocation();
  if (loc.pathname.startsWith("/admin")) return null;
  return (
    <footer className="mt-24 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-16 grid gap-12 md:grid-cols-4">
        <div>
          <Link to="/" className="font-display text-3xl text-white">Raalhu<span className="text-teal-400">.</span></Link>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-xs">
            Authentic branded products from India and beyond — delivered across Maldives with WhatsApp-first concierge service.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="#" className="h-9 w-9 rounded-full border border-white/10 grid place-items-center hover:border-teal-400"><Instagram className="h-4 w-4" /></a>
            <a href="#" className="h-9 w-9 rounded-full border border-white/10 grid place-items-center hover:border-teal-400"><Facebook className="h-4 w-4" /></a>
            <a href="https://wa.me/9607912865" className="h-9 w-9 rounded-full border border-white/10 grid place-items-center hover:border-emerald-400"><MessageCircle className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-teal-400 font-semibold mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop/garments" className="hover:text-white">Garments</Link></li>
            <li><Link to="/shop/cosmetics" className="hover:text-white">Cosmetics</Link></li>
            <li><Link to="/shop/electronics" className="hover:text-white">Electronics</Link></li>
            <li><Link to="/shop/gaming" className="hover:text-white">Gaming</Link></li>
            <li><Link to="/shop/shoes" className="hover:text-white">Shoes</Link></li>
            <li><Link to="/shop/musical" className="hover:text-white">Musical</Link></li>
            <li><Link to="/shop/sports" className="hover:text-white">Sports</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-teal-400 font-semibold mb-4">Concierge</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/find-it-for-me" className="hover:text-white">Find-it-for-me</Link></li>
            <li><Link to="/ai" className="hover:text-white">AI Shopping Assistant</Link></li>
            <li><Link to="/track" className="hover:text-white">Track your order</Link></li>
            <li><Link to="/delivery" className="hover:text-white">Delivery to islands</Link></li>
            <li><Link to="/how-it-works" className="hover:text-white">How pre-order works</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-teal-400 font-semibold mb-4">Help</h4>
          <ul className="space-y-2 text-sm">
            <li>WhatsApp: <a href="https://wa.me/9607912865" className="text-emerald-300">+960 791-2865</a></li>
            <li>Hours: 9am – 9pm (Maldives time)</li>
            <li>Payments: BML, MIB, m-Faisaa, Dhiraagu Pay</li>
            <li className="text-xs text-slate-500 pt-3">Brand names are used to identify sourced products; we do not claim official partnership unless marked verified.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Raalhu Concierge · A premium Maldives retail experience
      </div>
    </footer>
  );
}
