// Lightweight i18n: English (en) + Dhivehi (dv) with RTL handling.
// Adding new keys: just add them to TRANSLATIONS. Missing keys fall back to English.
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

const LS_KEY = "mv_lang_v1";

// ---------- Dictionary ----------
// English values are the source of truth. Dhivehi is community-translatable.
// (Initial Dhivehi strings are an approximation — refine with native review.)
const TRANSLATIONS = {
  // brand / generic
  "brand.tagline": { en: "Authentic branded products · India sourcing · Island-wide delivery", dv: "އަޞްލު ބްރޭންޑް ޕްރޮޑަކްޓްސް · އިންޑިއާއިން · ހުރިހާ ރަށަކަށް ޑެލިވަރީ" },
  "currency.mvr": { en: "MVR", dv: "ރ." },

  // nav
  "nav.shop": { en: "Shop", dv: "ފިހާރަ" },
  "nav.fifm": { en: "Find-it-for-me", dv: "ހޯދައިދޭ" },
  "nav.ai": { en: "AI Concierge", dv: "އޭއައި ކޮންސިއަރޖް" },
  "nav.track": { en: "Track order", dv: "އޯޑަރ ޓްރެކް" },
  "nav.delivery": { en: "Delivery to islands", dv: "ރަށްރަށަށް ޑެލިވަރީ" },
  "nav.how": { en: "How it works", dv: "ޚިދުމަތުގެ ބަޔާން" },
  "nav.admin": { en: "Admin", dv: "އެޑްމިން" },
  "nav.wishlist": { en: "Wishlist", dv: "ބޭނުންވާ ތަކެތި" },
  "nav.cart": { en: "Cart", dv: "ޓޮޓު" },
  "nav.help": { en: "Help", dv: "އެހީ" },
  "nav.continue": { en: "Continue shopping", dv: "ޝޮޕިންގ ކުރިއަށް" },

  // mobile bottom nav
  "bnav.home": { en: "Home", dv: "ހޯމް" },
  "bnav.shop": { en: "Shop", dv: "ފިހާރަ" },
  "bnav.ai": { en: "AI", dv: "އޭއައި" },
  "bnav.find": { en: "Find", dv: "ހޯދާ" },
  "bnav.cart": { en: "Cart", dv: "ޓޮޓު" },

  // hero
  "hero.kicker": { en: "Maldives · India sourcing · since 2026", dv: "ދިވެހިރާއްޖެ · އިންޑިއާއިން · 2026 އިން ފެށިގެން" },
  "hero.title.line1": { en: "Authentic brands.", dv: "އަޞްލު ބްރޭންޑްތައް." },
  "hero.title.line2.a": { en: "Island-wide", dv: "ހުރިހާ ރަށަކަށް" },
  "hero.title.line2.b": { en: "delivery.", dv: "ޑެލިވަރީ." },
  "hero.subtitle": { en: "Pre-order original products from India and global markets. AI concierge that understands your atoll. WhatsApp-first service. No surprises.", dv: "އިންޑިއާ އާ ދުނިޔޭގެ އެކި ބާޒާރުތަކުން ޢަސްލު ޕްރޮޑަކްޓްސް ޕްރީ-އޯޑަރ ކޮށްލާ. ތިޔަ ރަށާމެދު ވިސްނާ އޭއައި ކޮންސިއަރޖް. ވަޓްސްއެޕް މެދުވެރިކޮށް ޚިދުމަތް." },
  "hero.cta.shop": { en: "Start shopping", dv: "ޝޮޕިންގ ފަށާ" },
  "hero.cta.fifm": { en: "Find-it-for-me", dv: "ހޯދައިދޭ" },
  "hero.cta.ai": { en: "Ask AI", dv: "އޭއައި އަށް އަހާ" },
  "hero.trust.verified": { en: "Admin-verified listings", dv: "އެޑްމިން ޔަޤީންކޮށްފައި" },
  "hero.trust.wa": { en: "WhatsApp +960 791-2865", dv: "ވަޓްސްއެޕް +960 791-2865" },
  "hero.trust.delivery": { en: "Delivery to all atolls", dv: "ހުރިހާ އަތޮޅަކަށް ޑެލިވަރީ" },
  "hero.island.deliveringTo": { en: "Currently delivering to", dv: "މިހާރު ޑެލިވަރީ ކުރަނީ" },

  // sections
  "sec.shopByMood.kicker": { en: "Shop by mood", dv: "މޫޑު ހެޔޮވާ ޝޮޕިންގ" },
  "sec.shopByMood.title": { en: "Seven worlds. One island concierge.", dv: "ހަތް ދުނިޔެ. އެއް ކޮންސިއަރޖް." },
  "sec.hot.kicker": { en: "Hot pre-orders", dv: "ހިޓް ޕްރީ-އޯޑަރ" },
  "sec.hot.title": { en: "This week from India.", dv: "މިހަފްތާ އިންޑިއާއިން." },
  "sec.brands.title": { en: "From India's best, to your atoll.", dv: "އިންޑިއާގެ އެންމެ މޮޅު, ތިޔަ އަތޮޅަށް." },
  "sec.reviews.title": { en: "Delivered, verified, repeated.", dv: "ޑެލިވަރކޮށް, ޔަޤީންކޮށް, އަލުން." },
  "sec.fifm.title.a": { en: "Can't find it?", dv: "ނުފެނޭހެއް؟" },
  "sec.fifm.title.b": { en: "We'll find it.", dv: "އަޅުގަނޑުމެން ހޯދައިދޭނަން." },
  "sec.fifm.cta": { en: "Request a quote", dv: "ކޯޓޭޝަން ހޯދާ" },
  "sec.fifm.wa": { en: "WhatsApp us", dv: "ވަޓްސްއެޕް ކޮށްލާ" },
  "sec.how.kicker": { en: "How pre-order works", dv: "ޕްރީ-އޯޑަރ ކިހިނެތް" },
  "sec.how.title": { en: "From India shelf to your island. Tracked.", dv: "އިންޑިއާގެ ފިހާރައިން ތިޔަ ރަށަށް. ޓްރެކް ކުރެވިފައި." },
  "sec.how.viewFull": { en: "See the full 10-step timeline", dv: "10 މަރުޙަލާގެ ޓައިމްލައިން ބަލާ" },

  // product card / detail
  "product.addToCart": { en: "Add to cart", dv: "ޓޮޓަށް އަޅާ" },
  "product.buyNow": { en: "Buy now", dv: "މިހާރު ބައްލަވާ" },
  "product.wa.ask": { en: "Ask on WhatsApp", dv: "ވަޓްސްއެޕް އިން އަހާ" },
  "product.wishlist.save": { en: "Wishlist", dv: "ބޭނުންވޭ" },
  "product.wishlist.saved": { en: "Saved", dv: "ރައްކާކޮށްފި" },
  "product.deliverTo": { en: "Deliver to", dv: "ޑެލިވަރީ" },
  "product.estDays": { en: "Estimated", dv: "ލަފާކުރާ" },
  "product.about": { en: "About this product", dv: "މި ޕްރޮޑަކްޓާމެދު" },
  "product.specs": { en: "Specifications", dv: "ތަފާތު މަޢުލޫމާތު" },
  "product.related": { en: "You may also like", dv: "ބޭނުންވެދާނެ" },

  // cart / checkout
  "cart.title": { en: "Your cart", dv: "ތިޔަ ޓޮޓު" },
  "cart.empty.title": { en: "Your cart is empty", dv: "ޓޮޓު ހުސް" },
  "cart.empty.sub": { en: "Time to browse some treasures.", dv: "އައު ތަކެތި ބަލާލާ." },
  "cart.summary": { en: "Order summary", dv: "އޯޑަރ ޚުލާޞާ" },
  "cart.subtotal": { en: "Subtotal", dv: "ޖުމްލަ (ޑެލިވަރީ ނުލާ)" },
  "cart.deliveryTo": { en: "Delivery to", dv: "ޑެލިވަރީ" },
  "cart.total": { en: "Total", dv: "ޖުމްލަ" },
  "cart.checkout": { en: "Checkout", dv: "ޗެކްއައުޓް" },
  "checkout.title": { en: "Checkout", dv: "ޗެކްއައުޓް" },
  "checkout.place": { en: "Place order", dv: "އޯޑަރ ކުރޭ" },
  "checkout.placing": { en: "Placing order…", dv: "އޯޑަރ ކުރަނީ…" },

  // ai
  "ai.title": { en: "Your Maldives concierge", dv: "ތިޔަ ދިވެހި ކޮންސިއަރޖް" },
  "ai.sub": { en: "Ask in plain English. I can find products, compare, suggest sizes, explain delivery, and draft sourcing quotes.", dv: "ސާދާ ބަހުން އަހާ. ޕްރޮޑަކްޓްސް ހޯދައި, ތަފާތުކޮށް, ސައިޒް ހުށަހަޅައި, ޑެލިވަރީ ހަމަޖައްސައި ދޭނަން." },
  "ai.placeholder": { en: "Ask Raalhu anything…", dv: "ރާޅު އާ ކޮންމެ ކަމެއް އަހާ…" },
  "ai.greeting": { en: "Hi! I'm Raalhu, your shopping concierge for the Maldives. Ask about products, sizes, gifts, delivery, or anything else.", dv: "ހެލޯ! އަޅުގަނޑަކީ ރާޅު, ތިޔަ ދިވެހި ޝޮޕިންގ ކޮންސިއަރޖް. ޕްރޮޑަކްޓްސް, ސައިޒް, ހަދިޔާ, ޑެލިވަރީ ނުވަތަ އެނޫން ކޮންމެ ކަމެއް އަހާ." },

  // wishlist
  "wishlist.title": { en: "Wishlist", dv: "ބޭނުންވާ ތަކެތި" },
  "wishlist.empty.title": { en: "Your wishlist is empty", dv: "ބޭނުންވާ ތަކެތި ހުސް" },
  "wishlist.empty.sub": { en: "Save products you love and we'll keep them ready.", dv: "ތިޔަ ބޭނުންވާ ޕްރޮޑަކްޓްސް ރައްކާކޮށްލާ." },
  "wishlist.browse": { en: "Browse shop", dv: "ފިހާރަ ބަލާ" },

  // language toggle
  "lang.en": { en: "English", dv: "English" },
  "lang.dv": { en: "Dhivehi", dv: "ދިވެހި" },
  "lang.switch": { en: "Language", dv: "ބަސް" },
};

const I18nCtx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem(LS_KEY) || "en"; } catch { return "en"; }
  });

  const setLang = useCallback((next) => {
    setLangState(next);
    try { localStorage.setItem(LS_KEY, next); } catch {}
  }, []);

  // Apply RTL + lang attribute + Thaana font class on <html>
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (lang === "dv") {
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", "dv");
      body.classList.add("font-thaana");
    } else {
      html.setAttribute("dir", "ltr");
      html.setAttribute("lang", "en");
      body.classList.remove("font-thaana");
    }
  }, [lang]);

  const t = useCallback((key) => {
    const entry = TRANSLATIONS[key];
    if (!entry) return key; // fallback: show key (helps QA find missing strings)
    return entry[lang] || entry.en || key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, isRTL: lang === "dv" }), [lang, setLang, t]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
