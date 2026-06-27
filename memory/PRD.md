# Maldives AI Retail Concierge — PRD

**Problem statement (original):** Build a NextGen retail shopping platform — specifically the "Maldives AI Retail Concierge" (per attached spec doc). A premium, colorful, mobile-first AI retail pre-order concierge platform for Maldivian customers shopping authentic branded products from India / global markets with island-wide delivery and WhatsApp-first concierge service.

## User-stated decisions
- **Backend:** Supabase (frontend has client-ready integration; SQL schema delivered at `/app/supabase/schema.sql` for user to apply later)
- **AI model:** Claude Sonnet 4.5 (via Emergent LLM key, proxied through FastAPI backend)
- **Auth:** Supabase authentication (to be wired up later by user)
- **WhatsApp:** +960 791-2865
- **Timeline:** Full MVP in 3 days — delivered in single sprint

## Personas
- **Maldivian shopper** (Male, Hulhumale, Addu, Fuvahmulah etc) — buys/pre-orders authentic India brand products with island-aware delivery
- **Resort staff / outer-island residents** — need reliable concierge sourcing
- **Admin operator** — manages products, orders, sourcing requests, runs Import Center

## What's implemented (Feb 2026)
### Storefront
- Luxury home with hero, island selector, 7 category bento, hot pre-orders, Find-it-for-me banner, AI concierge demo prompts, How pre-order works timeline, brands marquee, reviews
- Shop / Category routes with filters (availability + price), sort, search query, mobile filters drawer
- Product Detail: gallery, MVR pricing, badges, island-aware delivery estimate, size/color variants, qty, add-to-cart / buy-now / WhatsApp / wishlist / AI compare-ready, specs table, related products
- Cart with quantity controls, subtotal + delivery
- Maldives-friendly Checkout: contact, island/atoll, address, notes, 6 payment methods (BML / MIB / m-Faisaa / Dhiraagu Pay / slip upload / cash on pickup), slip upload UI, deposit-ready
- Order Success page with copy order #, full 10-stage timeline, WhatsApp deeplink
- Track Order by number (URL params)
- Wishlist, Delivery to Islands (atoll-grouped courier table), How It Works
### Concierge
- Find-it-for-me page with form + AI draft quote preview + persisted sourcing request
- AI Shopping Assistant (full page + floating chat panel) — Claude Sonnet 4.5 with island-aware context
### Admin (password `raalhu2026`)
- Overview (stats, recent orders & sourcing)
- Orders table with one-click stage advance through 10 fulfillment stages
- Sourcing Requests list
- Import Center: URL → AI draft + CSV paste + validation
- AI Tools: product description rewriter
- Products list
### Backend
- FastAPI: AI chat / Find-it-for-me / Product description / Compare endpoints + sourcing-requests + orders + status updates
- Claude Sonnet 4.5 via emergentintegrations
- Mongo storage for orders + sourcing + AI interactions (until Supabase live)
### Supabase
- Full SQL schema at `/app/supabase/schema.sql` (brands, categories, products, variants, customers, addresses, delivery_zones, orders, items, payments, sourcing, imports, wishlists, reviews, promotions, ai_interactions) + indexes

## Mobile UX
- Sticky bottom nav (5 items, glass)
- Floating WhatsApp + AI chat buttons (above nav)
- Mobile filters drawer, mobile drawer menu, large tap targets

## Design language
- Cormorant Garamond serif (display) + Inter (body)
- Deep navy / cream stone / emerald-teal / coral-rose / luxury amber
- Glass + bento layout, rounded-2xl, grain texture

## P1 backlog
- Wire Supabase client (`@supabase/supabase-js`) to schema once URL/keys provided
- Real Supabase auth (Google + email magic link)
- Product comparison UI on listing
- Bundle builder + gift finder dedicated flows
- Provider adapters (boAt, Mamaearth, Nykaa, Amazon IN) for URL import
- Dhivehi (ދިވެހި) translations layer
- Admin slip-verification UI + payments table
- PWA manifest / installable home screen icon
- Real-time order push (Supabase realtime) on tracking page

## P2 backlog
- Promotions/discount codes engine
- Resort staff bulk orders portal
- Reviews submission with photo upload
- Stripe / BML payment gateway when available
