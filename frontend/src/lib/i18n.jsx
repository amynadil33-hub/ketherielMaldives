// Lightweight i18n: English (en) + Dhivehi (dv) with RTL handling.
// Adding new keys: just add them to TRANSLATIONS. Missing keys fall back to English.
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

const LS_KEY = "mv_lang_v1";

// ---------- Dictionary ----------
// English values are the source of truth. Dhivehi is community-translatable.
const TRANSLATIONS = {
  // brand / generic
  "brand.tagline": { en: "Authentic branded products · India sourcing · Island-wide delivery", dv: "އަޞްލު ބްރޭންޑް ޕްރޮޑަކްޓްސް · އިންޑިއާއިން · ހުރިހާ ރަށަކަށް ޑެލިވަރީ" },
  "currency.mvr": { en: "MVR", dv: "ރ." },
  "common.optional": { en: "(optional)", dv: "(ޚިޔާރީ)" },
  "common.required": { en: "required", dv: "ބޭނުންވޭ" },
  "common.refresh": { en: "Refresh", dv: "ރިފްރެޝް" },
  "common.copy": { en: "Copy", dv: "ކޮޕީ" },
  "common.copied": { en: "Copied", dv: "ކޮޕީކޮށްފި" },
  "common.loading": { en: "Loading…", dv: "ލޯޑްވަނީ…" },
  "common.signOut": { en: "Sign out", dv: "ނިމުމަށް" },
  "common.searchPlaceholder": { en: "Search earbuds, sunscreen, abaya…", dv: "ހޯދުމަށް ޓައިޕްކޮށްލާ…" },
  "common.searchShort": { en: "Search…", dv: "ހޯދާ…" },

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
  "nav.shopAll": { en: "Shop all", dv: "ހުރިހާ ޕްރޮޑަކްޓެއް" },
  "nav.needHelp": { en: "Need help?", dv: "އެހީ ބޭނުންތަ؟" },

  // mobile bottom nav
  "bnav.home": { en: "Home", dv: "ހޯމް" },
  "bnav.shop": { en: "Shop", dv: "ފިހާރަ" },
  "bnav.ai": { en: "AI", dv: "އޭއައި" },
  "bnav.find": { en: "Find", dv: "ހޯދާ" },
  "bnav.cart": { en: "Cart", dv: "ޓޮޓު" },

  // categories
  "cat.garments": { en: "Garments", dv: "ފޭރާން" },
  "cat.cosmetics": { en: "Cosmetics", dv: "ކޮސްމެޓިކްސް" },
  "cat.electronics": { en: "Electronics", dv: "އިލެކްޓްރޯނިކްސް" },
  "cat.gaming": { en: "Gaming", dv: "ގޭމިންގ" },
  "cat.shoes": { en: "Shoes", dv: "ބޫޓު" },
  "cat.musical": { en: "Musical", dv: "މިއުޒިކަލް" },
  "cat.sports": { en: "Sports", dv: "ކުޅިވަރު" },

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
  "hero.island.atoll": { en: "atoll", dv: "އަތޮޅު" },
  "hero.island.delivery": { en: "delivery", dv: "ޑެލިވަރީ" },
  "hero.island.confirm": { en: "Pre-order final price & delivery confirmed by admin via WhatsApp after sourcing check.", dv: "ޕްރީ-އޯޑަރ ނިހާއީ އަގާއި ޑެލިވަރީ، ސޯސިންގ ޔަޤީންކުރުމަށްފަހު އެޑްމިން ވަޓްސްއެޕް މެދުވެރިކޮށް ޔަޤީންކޮށްދޭނެ." },

  // home sections
  "sec.shopByMood.kicker": { en: "Shop by mood", dv: "މޫޑު ހެޔޮވާ ޝޮޕިންގ" },
  "sec.shopByMood.title": { en: "Seven worlds. One island concierge.", dv: "ހަތް ދުނިޔެ. އެއް ކޮންސިއަރޖް." },
  "sec.shopByMood.explore": { en: "Explore all", dv: "ހުރިހާ ބައި" },
  "sec.shopByMood.products": { en: "products", dv: "ޕްރޮޑަކްޓްސް" },
  "sec.hot.kicker": { en: "Hot pre-orders", dv: "ހިޓް ޕްރީ-އޯޑަރ" },
  "sec.hot.title": { en: "This week from India.", dv: "މިހަފްތާ އިންޑިއާއިން." },
  "sec.hot.seeAll": { en: "See all", dv: "ހުރިހާ" },
  "sec.brands.kicker": { en: "Popular sourced brands", dv: "މަޝްހޫރު ބްރޭންޑްތައް" },
  "sec.brands.title": { en: "From India's best, to your atoll.", dv: "އިންޑިއާގެ އެންމެ މޮޅު, ތިޔަ އަތޮޅަށް." },
  "sec.brands.disclaimer": { en: "Brand names identify sourced products only. We do not claim official partnership unless marked verified by admin.", dv: "ބްރޭންޑް ނަންތައް ހަމައެކަނި ސޯސްކޮށްފައިވާ ޕްރޮޑަކްޓްސް ދެނެގަތުމަށް ބޭނުންކުރެވޭ. ވެރިފައިޑް ފާހަގަ ނުކޮށްފިއްޔާ ރަސްމީ ޕާޓްނަރޝިޕެއް ދަޢުވާ ނުކުރަމު." },
  "sec.brands.verified": { en: "Verified", dv: "ވެރިފައިޑް" },
  "sec.reviews.kicker": { en: "Loved across the Maldives", dv: "ދިވެހިރާއްޖޭގައި ލޯބިވާ" },
  "sec.reviews.title": { en: "Delivered, verified, repeated.", dv: "ޑެލިވަރކޮށް, ޔަޤީންކޮށް, އަލުން." },
  "sec.reviews.verified": { en: "verified buyer", dv: "ޔަޤީންކޮށްފައިވާ ކަސްޓަމަރ" },
  "sec.fifm.kicker": { en: "Concierge sourcing", dv: "ކޮންސިއަރޖް ސޯސިންގ" },
  "sec.fifm.title.a": { en: "Can't find it?", dv: "ނުފެނޭހެއް؟" },
  "sec.fifm.title.b": { en: "We'll find it.", dv: "އަޅުގަނޑުމެން ހޯދައިދޭނަން." },
  "sec.fifm.sub": { en: "Paste any product link from Amazon, Myntra, Nykaa, or anywhere global. Our AI drafts a quote and a real human confirms via WhatsApp.", dv: "އެމަޒޮން, މިންޓްރާ, ނައިކާ، ނުވަތަ އެނޫން ވެބްސައިޓަކުން ޕްރޮޑަކްޓް ލިންކް ޕޭސްޓްކޮށްލާ. އޭއައި ކޯޓޭޝަން ތައްޔާރުކޮށް އަޅުގަނޑުމެން ވަޓްސްއެޕް މެދުވެރިކޮށް ޔަޤީންކޮށްދޭނަން." },
  "sec.fifm.cta": { en: "Request a quote", dv: "ކޯޓޭޝަން ހޯދާ" },
  "sec.fifm.wa": { en: "WhatsApp us", dv: "ވަޓްސްއެޕް ކޮށްލާ" },
  "sec.fifm.label.url": { en: "Paste URL", dv: "ޔޫއާރުއެލް" },
  "sec.fifm.label.upload": { en: "Or upload", dv: "ނުވަތަ އަޕްލޯޑް" },
  "sec.fifm.label.budget": { en: "Budget", dv: "ބަޖެޓް" },
  "sec.fifm.label.deliverTo": { en: "Deliver to", dv: "ޑެލިވަރީ" },
  "sec.howSummary.kicker": { en: "How pre-order works", dv: "ޕްރީ-އޯޑަރ ކިހިނެތް" },
  "sec.howSummary.title": { en: "From India shelf to your island. Tracked.", dv: "އިންޑިއާގެ ފިހާރައިން ތިޔަ ރަށަށް. ޓްރެކް ކުރެވިފައި." },
  "sec.howSummary.viewFull": { en: "See the full 10-step timeline →", dv: "10 މަރުޙަލާގެ ޓައިމްލައިން ބަލާ →" },
  "sec.howSummary.s1.t": { en: "Choose product", dv: "ޕްރޮޑަކްޓް ހޮވާ" },
  "sec.howSummary.s1.n": { en: "Browse or paste a URL", dv: "ބަލާ ނުވަތަ ޔޫއާރުއެލް" },
  "sec.howSummary.s2.t": { en: "Place order", dv: "އޯޑަރ ކުރޭ" },
  "sec.howSummary.s2.n": { en: "BML, m-Faisaa, slip upload", dv: "ބީއެމްއެލް, އެމްފައިސާ, ސްލިޕް" },
  "sec.howSummary.s3.t": { en: "Sourced from India", dv: "އިންޑިއާއިން ސޯސް" },
  "sec.howSummary.s3.n": { en: "Admin confirms supplier", dv: "އެޑްމިން ޔަޤީންކުރާނެ" },
  "sec.howSummary.s4.t": { en: "Arrives in Maldives", dv: "ދިވެހިރާއްޖެ އަށް އަންނާނެ" },
  "sec.howSummary.s4.n": { en: "Air freight to Male", dv: "އެއަރ ފްރެއިޓް މާލެއަށް" },
  "sec.howSummary.s5.t": { en: "Delivered to island", dv: "ރަށަށް ޑެލިވަރީ" },
  "sec.howSummary.s5.n": { en: "Local courier handoff", dv: "ލޯކަލް ކޮރިއަރ" },
  "sec.ai.kicker": { en: "Ketheriel Maldives AI Concierge", dv: "Ketheriel Maldives އޭއައި ކޮންސިއަރޖް" },
  "sec.ai.title": { en: "Talk to a shopkeeper who knows India and your island.", dv: "އިންޑިއާ އާ ތިޔަ ރަށް ދަންނަ ފިހާރައެއްގެ ވެރިޔާއާ ވާހަކަ ދައްކާ." },
  "sec.ai.sub": { en: "Ask in plain English. Compare products. Pick gifts. Decode delivery. Powered by Claude Sonnet 4.5.", dv: "ސާދާ ބަހުން އަހާ. ޕްރޮޑަކްޓްސް ތަފާތުކޮށްލާ. ހަދިޔާ ހޮވާ. ޑެލިވަރީ ދެނެގަންނާ. Claude Sonnet 4.5 މެދުވެރިކޮށް." },
  "sec.ai.cta": { en: "Open full assistant", dv: "ފުލް އެސިސްޓެންޓް" },
  "sec.ai.try": { en: "Try it", dv: "ޓްރައި ކުރޭ" },
  "sec.ai.prompt": { en: "Prompt", dv: "ޕްރޮމްޕްޓް" },

  // product card / detail
  "product.addToCart": { en: "Add to cart", dv: "ޓޮޓަށް އަޅާ" },
  "product.addedToCart": { en: "Added to cart", dv: "ޓޮޓަށް އެޅިއްޖެ" },
  "product.buyNow": { en: "Buy now", dv: "މިހާރު ބައްލަވާ" },
  "product.wa.ask": { en: "Ask on WhatsApp", dv: "ވަޓްސްއެޕް އިން އަހާ" },
  "product.wishlist.save": { en: "Wishlist", dv: "ބޭނުންވޭ" },
  "product.wishlist.saved": { en: "Saved", dv: "ރައްކާކޮށްފި" },
  "product.wishlist.added": { en: "Added to wishlist", dv: "ބޭނުންވާ ތަކެއްޗަށް އެޅިއްޖެ" },
  "product.wishlist.removed": { en: "Removed from wishlist", dv: "ބޭނުންވާ ތަކެތިން ނެގިއްޖެ" },
  "product.deliverTo": { en: "Deliver to", dv: "ޑެލިވަރީ" },
  "product.deliveryFee": { en: "delivery fee", dv: "ޑެލިވަރީ ފީ" },
  "product.estimated": { en: "Estimated", dv: "ލަފާކުރާ" },
  "product.days": { en: "days", dv: "ދުވަސް" },
  "product.about": { en: "About this product", dv: "މި ޕްރޮޑަކްޓާމެދު" },
  "product.specs": { en: "Specifications", dv: "ތަފާތު މަޢުލޫމާތު" },
  "product.specsNone": { en: "Specifications available on request — ask via WhatsApp.", dv: "ޓެކްނިކަލް ތަފްޞީލް ވަޓްސްއެޕް މެދުވެރިކޮށް ފޯރުކޮށްދޭނަން." },
  "product.warranty": { en: "Warranty", dv: "ވޮރަންޓީ" },
  "product.returns": { en: "Returns", dv: "އަލުން ފޮނުވުން" },
  "product.related": { en: "You may also like", dv: "ބޭނުންވެދާނެ" },
  "product.size": { en: "Size", dv: "ސައިޒް" },
  "product.color": { en: "Color", dv: "ކުލަ" },
  "product.preorderFinal": { en: "Pre-order price. Final price confirmed by admin after supplier check.", dv: "ޕްރީ-އޯޑަރ އަގު. ނިހާއީ އަގު ސަޕްލަޔަރ ޔަޤީންކުރުމަށްފަހު އެޑްމިން ޔަޤީންކޮށްދޭނެ." },
  "product.trust.authentic": { en: "Authentic branded product, sourced from", dv: "އަޞްލު ބްރޭންޑް ޕްރޮޑަކްޓް، ސޯސް:" },
  "product.trust.admin": { en: "Admin-verified listing · price confirmed after supplier check.", dv: "އެޑްމިން ޔަޤީންކޮށްފައި · ސަޕްލަޔަރ ޔަޤީންކުރުމަށްފަހު އަގު ޔަޤީންކުރެވޭނެ." },
  "product.trust.wa": { en: "Free WhatsApp support · order updates direct to your phone.", dv: "ހިލޭ ވަޓްސްއެޕް އެހީ · އޯޑަރ އަޕްޑޭޓްތައް ފޯނަށް ސީދާ." },
  "product.notFound": { en: "Product not found", dv: "ޕްރޮޑަކްޓް ނުފެނުނު" },
  "product.backToShop": { en: "Back to shop", dv: "ފިހާރައަށް އެނބުރި" },

  // shop / filters
  "shop.title.all": { en: "All products", dv: "ހުރިހާ ޕްރޮޑަކްޓްސް" },
  "shop.title.search": { en: "Search results", dv: "ހޯދުމުގެ ނަތީޖާ" },
  "shop.title.category": { en: "Category", dv: "ބައި" },
  "shop.title.shop": { en: "Shop", dv: "ފިހާރަ" },
  "shop.all": { en: "All", dv: "ހުރިހާ" },
  "shop.products": { en: "products", dv: "ޕްރޮޑަކްޓްސް" },
  "shop.filters": { en: "Filters", dv: "ފިލްޓަރ" },
  "shop.sort.featured": { en: "Sort: Featured", dv: "ތަރުތީބު: ޚާއްޞަ" },
  "shop.sort.priceAsc": { en: "Price: Low to High", dv: "އަގު: ދަށުން ފުށަށް" },
  "shop.sort.priceDesc": { en: "Price: High to Low", dv: "އަގު: ފުށުން ދަށަށް" },
  "shop.sort.discount": { en: "Biggest discount", dv: "ބޮޑު ޑިސްކައުންޓް" },
  "shop.sortShort.featured": { en: "Featured", dv: "ޚާއްޞަ" },
  "shop.sortLabel": { en: "Sort", dv: "ތަރުތީބު" },
  "shop.availability": { en: "Availability", dv: "ލިބެން ހުރި" },
  "shop.avail.ready": { en: "Ready in Maldives", dv: "ދިވެހިރާއްޖޭގައި ތައްޔާރު" },
  "shop.avail.preorder": { en: "India Pre-order", dv: "އިންޑިއާ ޕްރީ-އޯޑަރ" },
  "shop.avail.custom": { en: "Custom Sourcing", dv: "ކަސްޓަމް ސޯސިންގ" },
  "shop.maxPrice": { en: "Max price", dv: "އެންމެ ބޮޑު އަގު" },
  "shop.upTo": { en: "Up to MVR", dv: "ވަރަށްދާ ރ." },
  "shop.empty.title": { en: "Nothing here yet.", dv: "އަދި ޕްރޮޑަކްޓެއް ނެތް." },
  "shop.empty.sub": { en: "Try a different filter, or let our concierge source it.", dv: "އެހެން ފިލްޓަރެއް ޓްރައި ކުރޭ، ނުވަތަ ކޮންސިއަރޖް ހޯދައިދޭނެ." },
  "shop.view": { en: "View", dv: "ބަލާ" },

  // cart / checkout
  "cart.title": { en: "Your cart", dv: "ތިޔަ ޓޮޓު" },
  "cart.empty.title": { en: "Your cart is empty", dv: "ޓޮޓު ހުސް" },
  "cart.empty.sub": { en: "Time to browse some treasures.", dv: "އައު ތަކެތި ބަލާލާ." },
  "cart.summary": { en: "Order summary", dv: "އޯޑަރ ޚުލާޞާ" },
  "cart.subtotal": { en: "Subtotal", dv: "ޖުމްލަ (ޑެލިވަރީ ނުލާ)" },
  "cart.deliveryTo": { en: "Delivery to", dv: "ޑެލިވަރީ" },
  "cart.delivery": { en: "Delivery", dv: "ޑެލިވަރީ" },
  "cart.total": { en: "Total", dv: "ޖުމްލަ" },
  "cart.checkout": { en: "Checkout", dv: "ޗެކްއައުޓް" },
  "cart.preorderNote": { en: "Pre-order items: final price confirmed by admin via WhatsApp after sourcing check.", dv: "ޕްރީ-އޯޑަރ: ނިހާއީ އަގު ވަޓްސްއެޕް މެދުވެރިކޮށް އެޑްމިން ޔަޤީންކޮށްދޭނެ." },
  "cart.clear": { en: "Clear cart", dv: "ޓޮޓު ހުސްކުރޭ" },
  "cart.qty": { en: "Qty", dv: "ޢަދަދު" },

  "checkout.title": { en: "Checkout", dv: "ޗެކްއައުޓް" },
  "checkout.sub": { en: "Almost there. Maldives-friendly fields below.", dv: "ކައިރި ވެއްޖެ. ދިވެހިރާއްޖެއާ އެކަށޭނަ ފީލްޑްތައް." },
  "checkout.place": { en: "Place order", dv: "އޯޑަރ ކުރޭ" },
  "checkout.placing": { en: "Placing order…", dv: "އޯޑަރ ކުރަނީ…" },
  "checkout.estimated": { en: "Estimated delivery", dv: "ލަފާކުރާ ޑެލިވަރީ" },
  "checkout.terms": { en: "By placing this order you agree that pre-order pricing is final after admin's supplier check. Refunds are allowed if we cannot source.", dv: "އޯޑަރ ކޮށްލުމުން ޕްރީ-އޯޑަރ އަގު ސަޕްލަޔަރ ޔަޤީންކުރުމަށްފަހު ނިހާއީ ވާކަން ޤަބޫލުކުރައްވާ. ސޯސް ނުކުރެވިއްޖެނަމަ ފައިސާ އަނބުރާ ދެވޭނެ." },
  "checkout.sec.contact": { en: "Contact", dv: "ކޮންޓެކްޓް" },
  "checkout.sec.contact.desc": { en: "We'll send order updates to your phone via WhatsApp.", dv: "އޯޑަރ އަޕްޑޭޓްތައް ވަޓްސްއެޕް މެދުވެރިކޮށް ފޯނަށް ފޮނުވާނަން." },
  "checkout.sec.deliver": { en: "Deliver to", dv: "ޑެލިވަރީ" },
  "checkout.sec.deliver.desc": { en: "Delivery fee & timing adjust based on your atoll.", dv: "އަތޮޅަށް ބަލާ ޑެލިވަރީ އަގާއި ވަގުތު ބަދަލުވޭ." },
  "checkout.sec.payment": { en: "Payment", dv: "ޕޭމަންޓް" },
  "checkout.sec.payment.desc": { en: "Pick your preferred Maldives payment method.", dv: "ބޭނުންވާ ޕޭމަންޓް ވިއުގަ ހޮވާ." },
  "checkout.field.name": { en: "Full name", dv: "ފުރިހަމަ ނަން" },
  "checkout.field.phone": { en: "Phone / WhatsApp", dv: "ފޯނު / ވަޓްސްއެޕް" },
  "checkout.field.email": { en: "Email (optional)", dv: "އީމެއިލް (ޚިޔާރީ)" },
  "checkout.field.island": { en: "Island", dv: "ރަށް" },
  "checkout.field.atoll": { en: "Atoll", dv: "އަތޮޅު" },
  "checkout.field.address": { en: "Address / Pickup point", dv: "އެޑްރެސް / ޕިކްއަޕް" },
  "checkout.field.notes": { en: "Delivery notes", dv: "ޑެލިވަރީ ނޯޓްސް" },
  "checkout.field.notesPh": { en: "Call before arrival, leave with neighbour, etc.", dv: "އަންނަ ކުރިން ގުޅާ، އެ ގެއެއްގައި ބެހެއްޓުމާ ބެހޭ..." },
  "checkout.island.with": { en: "Island", dv: "ރަށް" },

  // payment methods
  "pay.bml": { en: "BML Bank Transfer", dv: "ބީއެމްއެލް ބޭންކް ޓްރާންސްފާ" },
  "pay.bml.note": { en: "Bank of Maldives — Acc# pending setup", dv: "ބޭންކް އޮފް މޯލްޑިވްސް — އެކައުންޓް ނަންބަރު ސެޓަޕް ކުރުމަށް" },
  "pay.mib": { en: "MIB Bank Transfer", dv: "އެމްއައިބީ ބޭންކް ޓްރާންސްފާ" },
  "pay.mib.note": { en: "Maldives Islamic Bank — Acc# pending setup", dv: "މޯލްޑިވްސް އިސްލާމިކް ބޭންކް — އެކައުންޓް ނަންބަރު" },
  "pay.mfaisaa": { en: "Ooredoo m-Faisaa", dv: "އޫރިޑޫ އެމްފައިސާ" },
  "pay.mfaisaa.note": { en: "Send to 7912865", dv: "ފޮނުވާ 7912865 އަށް" },
  "pay.dhiraagu": { en: "Dhiraagu Pay", dv: "ދިރާގު ޕޭ" },
  "pay.dhiraagu.note": { en: "Pay to merchant Ketheriel Maldives", dv: "Ketheriel Maldives މަރޗަންޓަށް ޕޭ" },
  "pay.slip": { en: "Payment slip upload", dv: "ޕޭމަންޓް ސްލިޕް އަޕްލޯޑް" },
  "pay.slip.note": { en: "We verify within 30 mins", dv: "30 މިނެޓުތެރޭގައި ޔަޤީންކުރާނަން" },
  "pay.cash": { en: "Cash on pickup (ready stock only)", dv: "ނަގާއިރު ކޭޝް (ތައްޔާރު ސްޓޮކް އެކަނި)" },
  "pay.cash.note": { en: "Male & Hulhumale", dv: "މާލެ އާ ހުޅުމާލެ" },
  "pay.slip.drop": { en: "Drag & drop your payment slip", dv: "ޕޭމަންޓް ސްލިޕް ޑްރެގް އެންޑް ޑްރޮޕް" },

  // order success
  "os.placed": { en: "Order placed!", dv: "އޯޑަރ ކުރެވިއްޖެ!" },
  "os.confirmed": { en: "We've sent a confirmation to", dv: "ޔަޤީންކުރުން ފޮނުވީ:" },
  "os.adminWa": { en: "Admin will confirm sourcing on WhatsApp shortly.", dv: "އެޑްމިން ވަޓްސްއެޕް މެދުވެރިކޮށް ވަރަށް އަވަހަށް ޔަޤީންކޮށްދޭނެ." },
  "os.orderNum": { en: "Order #", dv: "އޯޑަރ #" },
  "os.timeline": { en: "Tracking timeline", dv: "ޓްރެކް ޓައިމްލައިން" },
  "os.estimatedDelivery": { en: "Estimated delivery", dv: "ލަފާކުރާ ޑެލިވަރީ" },
  "os.to": { en: "to", dv: "އަށް" },
  "os.summary": { en: "Summary", dv: "ޚުލާޞާ" },
  "os.wa": { en: "WhatsApp us about this order", dv: "މި އޯޑަރއާ ބެހޭ ވަޓްސްއެޕް" },
  "os.track": { en: "Track this order", dv: "މި އޯޑަރ ޓްރެކް" },

  // track
  "track.kicker": { en: "Order tracking", dv: "އޯޑަރ ޓްރެކިންގ" },
  "track.title": { en: "Where's my package?", dv: "ޕެކޭޖް ކޮބާ؟" },
  "track.sub": { en: "Enter your order number to see real-time status across 10 stages.", dv: "އޯޑަރ ނަންބަރު ޖަހާލާ، 10 މަރުޙަލާގައި ހާލަތު ބެލުމަށް." },
  "track.cta": { en: "Track", dv: "ޓްރެކް" },
  "track.notFound": { en: "Order not found. Double-check the number.", dv: "އޯޑަރ ނުފެނުނު. ނަންބަރު ބައްލަވާ." },
  "track.placedFor": { en: "Placed for", dv: "ޖެހީ" },
  "track.messageUs": { en: "Message us", dv: "ފޮނުވާ" },

  // FIFM
  "fifm.kicker": { en: "Concierge sourcing", dv: "ކޮންސިއަރޖް ސޯސިންގ" },
  "fifm.title": { en: "Paste a link. We'll find it.", dv: "ލިންކް ޕޭސްޓްކޮށްލާ. އަޅުގަނޑުމެން ހޯދައިދޭނަން." },
  "fifm.sub": { en: "Amazon, Myntra, Nykaa, Flipkart, AliExpress — anywhere. Our AI drafts a Maldives quote in seconds and our team confirms via WhatsApp within hours.", dv: "އެމަޒޮން, މިންޓްރާ, ނައިކާ, ފްލިޕްކާޓް, އެލިއެކްސްޕްރެސް — ކޮންމެ ތަނަކުން. އޭއައި ވަގުތުން ކޯޓޭޝަން ތައްޔާރުކޮށް ޓީމް ވަޓްސްއެޕް މެދުވެރިކޮށް ޔަޤީންކޮށްދޭނެ." },
  "fifm.sec.tell": { en: "Tell us what to source", dv: "ކޮން ޕްރޮޑަކްޓެއް ހޯދަން ބޭނުންވޭ ބުނޭ" },
  "fifm.field.url": { en: "Product URL", dv: "ޕްރޮޑަކްޓް ޔޫއާރުއެލް" },
  "fifm.field.desc": { en: "Or describe the product", dv: "ނުވަތަ ޕްރޮޑަކްޓް ދޭހަކޮށްދޭ" },
  "fifm.field.budget": { en: "Budget (MVR)", dv: "ބަޖެޓް (ރ.)" },
  "fifm.field.qty": { en: "Quantity", dv: "ޢަދަދު" },
  "fifm.field.island": { en: "Deliver to island", dv: "ޑެލިވަރީ ރަށް" },
  "fifm.field.atoll": { en: "Atoll", dv: "އަތޮޅު" },
  "fifm.cta.draft": { en: "Generate AI draft quote", dv: "އޭއައި ޑްރާފްޓް ކޯޓޭޝަން" },
  "fifm.cta.drafting": { en: "Drafting…", dv: "ތައްޔާރުކުރަނީ…" },
  "fifm.yourDetails": { en: "Your details", dv: "ތިޔަ މަޢުލޫމާތު" },
  "fifm.field.name": { en: "Name", dv: "ނަން" },
  "fifm.field.phone": { en: "Phone / WhatsApp", dv: "ފޯނު / ވަޓްސްއެޕް" },
  "fifm.field.email": { en: "Email (optional)", dv: "އީމެއިލް (ޚިޔާރީ)" },
  "fifm.field.notes": { en: "Notes", dv: "ނޯޓްސް" },
  "fifm.field.notes.ph": { en: "Anything else we should know?", dv: "އިތުރު މަޢުލޫމާތެއް؟" },
  "fifm.submit": { en: "Send sourcing request", dv: "ސޯސިންގ ރިކުއެސްޓް ފޮނުވާ" },
  "fifm.submitted": { en: "Submitted", dv: "ފޮނުވިއްޖެ" },
  "fifm.success": { en: "Request submitted — admin will WhatsApp you a final quote.", dv: "ރިކުއެސްޓް ފޮނުވިއްޖެ — އެޑްމިން ވަޓްސްއެޕް މެދުވެރިކޮށް ނިހާއީ ކޯޓޭޝަން ފޮނުވާނެ." },
  "fifm.aiDraft": { en: "AI draft", dv: "އޭއައި ޑްރާފްޓް" },
  "fifm.aiDraft.empty": { en: "Press \"Generate AI draft quote\" to see a preview of the sourced price, delivery range, and notes.", dv: "\"އޭއައި ޑްރާފްޓް ކޯޓޭޝަން\" ފިއްތާ، އަގު، ޑެލިވަރީ، އަދި ނޯޓްތައް ބަލާލާ." },
  "fifm.row.product": { en: "Product", dv: "ޕްރޮޑަކްޓް" },
  "fifm.row.brand": { en: "Brand", dv: "ބްރޭންޑް" },
  "fifm.row.category": { en: "Category", dv: "ބައި" },
  "fifm.row.source": { en: "Source price", dv: "ސޯސް އަގު" },
  "fifm.row.suggested": { en: "Suggested price", dv: "ހުށަހެޅުނު އަގު" },
  "fifm.row.delivery": { en: "Delivery", dv: "ޑެލިވަރީ" },
  "fifm.row.notes": { en: "Sourcing notes:", dv: "ސޯސިންގ ނޯޓްސް:" },
  "fifm.row.missing": { en: "Missing:", dv: "ނެތް:" },
  "fifm.aiDisclaim": { en: "AI drafts are estimates only. Final pricing and availability are confirmed by our admin via WhatsApp after a supplier check.", dv: "އޭއައި ޑްރާފްޓްތައް ހަމައެކަނި ލަފާކުރުމެއް. ނިހާއީ އަގާއި ލިބުމުގެ ޔަޤީންކަން ސަޕްލަޔަރ ޔަޤީންކުރުމަށްފަހު އެޑްމިން ވަޓްސްއެޕް މެދުވެރިކޮށް ޔަޤީންކޮށްދޭނެ." },
  "fifm.waDirect": { en: "Or WhatsApp us directly", dv: "ނުވަތަ ސީދާ ވަޓްސްއެޕް ކޮށްލާ" },

  // AI page / chat panel
  "ai.title": { en: "Your Maldives concierge", dv: "ތިޔަ ދިވެހި ކޮންސިއަރޖް" },
  "ai.sub": { en: "Ask in plain English. I can find products, compare, suggest sizes, explain delivery, and draft sourcing quotes.", dv: "ސާދާ ބަހުން އަހާ. ޕްރޮޑަކްޓްސް ހޯދައި, ތަފާތުކޮށް, ސައިޒް ހުށަހަޅައި, ޑެލިވަރީ ހަމަޖައްސައި ދޭނަން." },
  "ai.placeholder": { en: "Ask Ketheriel Maldives anything…", dv: "Ketheriel Maldives އާ ކޮންމެ ކަމެއް އަހާ…" },
  "ai.greeting": { en: "Hi! I'm Ketheriel Maldives, your shopping concierge for the Maldives. Ask about products, sizes, gifts, delivery, or anything else.", dv: "ހެލޯ! އަޅުގަނޑަކީ Ketheriel Maldives, ތިޔަ ދިވެހި ޝޮޕިންގ ކޮންސިއަރޖް. ޕްރޮޑަކްޓްސް, ސައިޒް, ހަދިޔާ, ޑެލިވަރީ ނުވަތަ އެނޫން ކޮންމެ ކަމެއް އަހާ." },
  "ai.disclaim": { en: "AI suggestions are for shopping help only. Final orders and prices are always confirmed by our admin team.", dv: "އޭއައި ހުށަހެޅުންތައް ހަމައެކަނި ޝޮޕިންގ އެހީއެއް. ނިހާއީ އޯޑަރ އާ އަގު އެޑްމިން ޔަޤީންކޮށްދޭނެ." },
  "ai.tryAsk": { en: "Try asking", dv: "އަހާ ޓްރައި ކުރޭ" },
  "ai.panel.title": { en: "Ketheriel Maldives AI", dv: "Ketheriel Maldives އޭއައި" },
  "ai.panel.sub": { en: "Your Maldives shopping concierge", dv: "ތިޔަ ދިވެހި ޝޮޕިންގ ކޮންސިއަރޖް" },
  "ai.panel.placeholder": { en: "Ask anything about shopping…", dv: "ޝޮޕިންގއާ ބެހޭ ހުރިހާ ކަމެއް އަހާ…" },
  "ai.panel.greeting": { en: "Hey! I'm Ketheriel Maldives, your shopping concierge for Maldives. Ask me anything — I can find products, suggest gifts, explain delivery, or draft a custom sourcing quote.", dv: "ހެލޯ! އަޅުގަނޑު Ketheriel Maldives, ތިޔަ ޝޮޕިންގ ކޮންސިއަރޖް. ހުރިހާ ކަމެއް އަހާ — ޕްރޮޑަކްޓްސް ހޯދާ, ހަދިޔާ ހުށަހަޅާ, ޑެލިވަރީ ބަޔާންކޮށް, ކޯޓޭޝަން ތައްޔާރުކޮށްދޭނަން." },
  "ai.fab": { en: "Ask Ketheriel Maldives AI", dv: "Ketheriel Maldives އޭއައި އަށް އަހާ" },
  "ai.error": { en: "Sorry, I couldn't reach the server. Try again in a moment.", dv: "މާފް ކުރައްވާ، ސަރވަރ އާ ގުޅޭ ނުވި. ވަގުތުކޮޅަކަށްފަހު ޓްރައި ކުރޭ." },

  // wishlist
  "wishlist.title": { en: "Wishlist", dv: "ބޭނުންވާ ތަކެތި" },
  "wishlist.empty.title": { en: "Your wishlist is empty", dv: "ބޭނުންވާ ތަކެތި ހުސް" },
  "wishlist.empty.sub": { en: "Save products you love and we'll keep them ready.", dv: "ތިޔަ ބޭނުންވާ ޕްރޮޑަކްޓްސް ރައްކާކޮށްލާ." },
  "wishlist.browse": { en: "Browse shop", dv: "ފިހާރަ ބަލާ" },

  // how it works
  "how.kicker": { en: "How pre-order works", dv: "ޕްރީ-އޯޑަރ ކިހިނެތް" },
  "how.title": { en: "10 stages. Total transparency.", dv: "10 މަރުޙަލާ. ފުރިހަމަ ހާމަކަން." },
  "how.sub": { en: "From an India shelf to your atoll. Every step is tracked and we'll WhatsApp you at the key moments.", dv: "އިންޑިއާގެ ފިހާރައިން ތިޔަ އަތޮޅަށް. ކޮންމެ ފިޔަވަޅެއް ޓްރެކް ކުރެވޭ، މުހިއްމު ވަގުތުތަކުގައި ވަޓްސްއެޕް ކުރާނަން." },
  "how.c1.t": { en: "Honest pre-order pricing", dv: "ތެދު ޕްރީ-އޯޑަރ އަގު" },
  "how.c1.b": { en: "Prices on listings are estimates. Once your order is placed, our admin checks suppliers and confirms the final price within hours.", dv: "ލިސްޓްގައިވާ އަގުތައް ހަމައެކަނި ލަފާކުރުމެއް. އޯޑަރ ކުރުމުން، ސަޕްލަޔަރ ޗެކްކޮށް ނިހާއީ އަގު ވަގުތުކޮޅެއްގެ ތެރޭގައި ޔަޤީންކޮށްދޭނަން." },
  "how.c2.t": { en: "Payment flexibility", dv: "ޕޭމަންޓް ފުރުޞަތު" },
  "how.c2.b": { en: "Pick from BML, MIB, m-Faisaa, Dhiraagu Pay, or slip upload. High-value items can be split into a deposit + balance.", dv: "ބީއެމްއެލް، އެމްއައިބީ، އެމްފައިސާ، ދިރާގު ޕޭ، ނުވަތަ ސްލިޕް އަޕްލޯޑްއިން ހޮވާ. ބޮޑު އަގުގެ ތަކެތި ޑިޕޮޒިޓް އާ ބެލެންސް އަށް ބަހާލެވޭ." },
  "how.c3.t": { en: "Island-aware delivery", dv: "ރަށާ އެކަށޭނަ ޑެލިވަރީ" },
  "how.c3.b": { en: "Each atoll has its own courier partner and fee. Our system adjusts your timeline based on where you are.", dv: "ކޮންމެ އަތޮޅަކަށް ހާއްޞަ ކޮރިއަރ ޕާޓްނަރ އާ ފީއެއް. ތިޔަ ހުރި ތަނަށް ބަލާ ޓައިމްލައިން ބަދަލުވޭ." },

  // delivery islands
  "del.kicker": { en: "Delivery network", dv: "ޑެލިވަރީ ނެޓްވޯކް" },
  "del.title": { en: "From Male to every atoll.", dv: "މާލެއިން ހުރިހާ އަތޮޅަކަށް." },
  "del.sub": { en: "We work with local courier partners — Maldivian Air Cargo, FlyMe Cargo, and speedboat services — to reach every inhabited island.", dv: "ލޯކަލް ކޮރިއަރ ޕާޓްނަރުންނާ ގުޅިގެން — Maldivian Air Cargo, FlyMe Cargo، އާ ސްޕީޑްބޯޓް ޚިދުމަތްތައް — ކޮންމެ ރަށަކަށް." },
  "del.atoll": { en: "atoll", dv: "އަތޮޅު" },
  "del.dontSee": { en: "Don't see your island? We deliver to every inhabited island in the Maldives. Get an exact quote via WhatsApp: +960 791-2865.", dv: "ތިޔަ ރަށް ނުފެނޭހެއް؟ ދިވެހިރާއްޖޭގެ ކޮންމެ ރަށަކަށް ޑެލިވަރީ. ދިސާމު ކޯޓޭޝަން ވަޓްސްއެޕް: +960 791-2865." },

  // island selector
  "island.title": { en: "Delivering to your island", dv: "ތިޔަ ރަށަށް ޑެލިވަރީ" },
  "island.sub": { en: "We adjust delivery fee & time based on your atoll.", dv: "ތިޔަ އަތޮޅަށް ބަލާ ޑެލިވަރީ އަގު އާ ވަގުތު ބަދަލުކުރަން." },
  "island.deliveringTo": { en: "Delivering to", dv: "ޑެލިވަރީ ކުރަނީ" },

  // footer
  "foot.sub": { en: "Authentic branded products from India and beyond — delivered across Maldives with WhatsApp-first concierge service.", dv: "އިންޑިއާ އާ އެނޫން ހިސާބުތަކުގެ އަޞްލު ބްރޭންޑް ޕްރޮޑަކްޓްސް — ދިވެހިރާއްޖޭގައި ވަޓްސްއެޕް-ފުރަތަމަ ޚިދުމަތާއެކު." },
  "foot.shop": { en: "Shop", dv: "ފިހާރަ" },
  "foot.concierge": { en: "Concierge", dv: "ކޮންސިއަރޖް" },
  "foot.help": { en: "Help", dv: "އެހީ" },
  "foot.wa": { en: "WhatsApp:", dv: "ވަޓްސްއެޕް:" },
  "foot.hours": { en: "Hours: 9am – 9pm (Maldives time)", dv: "ހިނގާ ވަގުތު: ހެނދުނު 9 – ރޭގަނޑު 9 (ދިވެހިރާއްޖޭގެ ވަގުތު)" },
  "foot.payments": { en: "Payments: BML, MIB, m-Faisaa, Dhiraagu Pay", dv: "ޕޭމަންޓްތައް: ބީއެމްއެލް، އެމްއައިބީ، އެމްފައިސާ، ދިރާގު ޕޭ" },
  "foot.brandDisclaim": { en: "Brand names are used to identify sourced products; we do not claim official partnership unless marked verified.", dv: "ބްރޭންޑް ނަންތައް ބޭނުންކުރެވެނީ ހަމައެކަނި ޕްރޮޑަކްޓްތައް ދެނެގަތުމަށް؛ ވެރިފައި ފާހަގަ ނުކޮށްފިއްޔާ ރަސްމީ ޕާޓްނަރޝިޕެއް ދަޢުވާ ނުކުރަމު." },
  "foot.bottom": { en: "Ketheriel Maldives Concierge · A premium Maldives retail experience", dv: "Ketheriel Maldives ކޮންސިއަރޖް · ޕްރީމިއަމް ދިވެހި ރީޓެއިލް ތަޖުރިބާ" },
  "foot.linkTrack": { en: "Track your order", dv: "އޯޑަރ ޓްރެކް" },
  "foot.linkDelivery": { en: "Delivery to islands", dv: "ރަށްރަށަށް ޑެލިވަރީ" },
  "foot.linkHow": { en: "How pre-order works", dv: "ޕްރީ-އޯޑަރ ކިހިނެތް" },
  "foot.linkAI": { en: "AI Shopping Assistant", dv: "އޭއައި ޝޮޕިންގ އެސިސްޓެންޓް" },
  "foot.linkFifm": { en: "Find-it-for-me", dv: "ހޯދައިދޭ" },

  // order timeline stages
  "stage.order_placed": { en: "Order placed", dv: "އޯޑަރ ޖެހުނީ" },
  "stage.payment_pending": { en: "Payment pending", dv: "ޕޭމަންޓް އިންތިޒާރުގައި" },
  "stage.payment_confirmed": { en: "Payment confirmed", dv: "ޕޭމަންޓް ޔަޤީންކޮށްފި" },
  "stage.sourcing_from_india": { en: "Sourcing from India", dv: "އިންޑިއާއިން ސޯސް" },
  "stage.received_at_india_hub": { en: "Received at India hub", dv: "އިންޑިއާ ހަބް އަށް ލިބުނީ" },
  "stage.shipped_to_maldives": { en: "Shipped to Maldives", dv: "ދިވެހިރާއްޖެ އަށް ފޮނުވިއްޖެ" },
  "stage.arrived_in_male": { en: "Arrived in Male", dv: "މާލެއަށް އަތުވެއްޖެ" },
  "stage.sent_to_island_courier": { en: "Sent to island courier", dv: "ރަށު ކޮރިއަރ އަށް ފޮނުވިއްޖެ" },
  "stage.out_for_delivery": { en: "Out for delivery", dv: "ޑެލިވަރީއަށް ނުކުމެފި" },
  "stage.delivered": { en: "Delivered", dv: "ޑެލިވަރީ ކުރެވިއްޖެ" },
  "stage.inProgress": { en: "In progress · admin will confirm via WhatsApp", dv: "ކުރިއަށްދޭ · އެޑްމިން ވަޓްސްއެޕް މެދުވެރިކޮށް ޔަޤީންކޮށްދޭނެ" },

  // badges (product card)
  "badge.IndiaPreorder": { en: "India Pre-order", dv: "އިންޑިއާ ޕްރީ-އޯޑަރ" },
  "badge.ReadyInMaldives": { en: "Ready in Maldives", dv: "ދިވެހިރާއްޖޭގައި ތައްޔާރު" },
  "badge.OriginalBrand": { en: "Original Brand", dv: "އަޞްލު ބްރޭންޑް" },
  "badge.BestValue": { en: "Best Value", dv: "އެންމެ ފައިދާ" },
  "badge.FastSourcing": { en: "Fast Sourcing", dv: "އަވަސް ސޯސިންގ" },
  "badge.CustomSourcing": { en: "Custom Sourcing", dv: "ކަސްޓަމް ސޯސިންގ" },

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
