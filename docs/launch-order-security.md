# Order security implementation — phase 1

This branch preserves the React/CRA storefront, Supabase catalogue and FastAPI/MongoDB order storage. No seed script, production deployment or live data operation is part of this change.

## Changed behaviour

- Checkout accepts product IDs, selected options and quantities, not authoritative titles, prices, delivery fees, discounts or totals. It verifies published/active products, source-catalogue option availability, reviewed catalogue prices and an active delivery zone server-side. Decimal calculations must equal the total the customer reviewed; a changed price is rejected for review rather than charged silently.
- Orders remain payment-pending. Only explicitly configured payment methods with actual operator-supplied instructions are offered. The incomplete slip uploader and cash-on-pickup flow are not enabled by this phase.
- Checkout writes one complete MongoDB document. A UUID idempotency key becomes the MongoDB `_id`, using its existing unique constraint to prevent duplicate orders on concurrent retries. No index migration is required. A retry with different data or access credentials is rejected. Ambiguous network failures preserve the original attempt in session storage, including after reload; the customer can explicitly retry/recover that attempt before starting a different order.
- Each checkout uses a random 256-bit private access code. Only its SHA-256 hash is stored in MongoDB. Order-number-only lookups no longer disclose customer information. The code travels in `X-Order-Token`, not a URL. Customers can copy their code after ordering and supply it on another device. Losing it requires verified support assistance; no automatic recovery flow is claimed.
- Existing orders without a code fail closed on public tracking; authorized admins can still view them. No legacy rows are rewritten.
- Admin sessions use existing Supabase Auth email/password sign-in. The backend verifies each bearer token against Supabase's user endpoint and then checks a server-side user-ID allowlist. Browser flags, a public Supabase key, and editable user metadata cannot grant admin access. Tokens remain in the current tab and expiration requires sign-in again.
- Order/sourcing lists and status writes require admin authorization. Status updates must advance one existing stage, supplying the expected current status so a stale admin tab cannot skip stages. Manual payment confirmation updates payment status and records the admin ID.
- API responses use `Cache-Control: no-store`. Order reads and admin lists exclude token/request hashes. Full customer details are never exposed by an unprotected list endpoint.
- Missing, empty, loading or failed Supabase catalogue responses never restore demo products, reviews, delivery zones or inflated category counts. Old demo carts cannot pass checkout validation. Variant prices, invalid quantities, stale products and cart product links are handled without rebuilding the storefront.

## Intentional launch gates

Ready-stock orders are blocked until inventory reservation can be implemented and verified. Supabase holds catalogue/variant data while MongoDB holds orders; this phase does not claim an atomic stock reservation across those systems. Preorders still require an available published catalogue entry; no retailer stock or supplier purchase is inferred from that entry.

Ordering defaults to disabled. Before enabling it in an approved environment, Sir must approve the catalogue, MVR prices, payment instructions, delivery fees/coverage and delivery estimates. His stated target is 15 days; how the clock starts and whether island delivery is included still needs operational confirmation. This change uses reviewed catalogue/zone values without inventing replacements or a pricing formula.

## Configuration for an isolated preview

Keep all values in hosting environment settings; never commit credentials.

Backend:

- `MONGO_URL`, `DB_NAME`: an isolated test database, never the live database for validation.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (or legacy `SUPABASE_ANON_KEY`): the same reviewed catalogue/auth project used by the preview. No service-role key is required for public catalogue reads or identity verification.
- `SUPABASE_ADMIN_USER_IDS`: comma-separated Supabase Auth user UUIDs authorized by the store owner. Create/invite these users through the service's normal account flow. Empty configuration denies access.
- `CORS_ORIGINS`: explicit preview frontend origins. Default is no cross-origin access. Same-origin routing remains available.
- `ORDERS_ENABLED`: defaults to `false`. Set `true` only after the environment's commerce data and operations have been approved.
- `CHECKOUT_PAYMENT_METHODS`: JSON array containing `id`, `label`, and nonempty `instructions` for each approved method. Supported IDs for this phase are `bml_transfer`, `mib_transfer`, `mfaisaa`, and `dhiraagu_pay`; default is `[]`. Do not insert example account details. Technical support for an ID does not mean the merchant has that service configured.

Frontend:

- Existing `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_PUBLISHABLE_KEY` (or legacy anon key).
- `REACT_APP_BACKEND_URL`: the backend service base before `/api`. Keep its actual hosting route prefix. If absent, requests use same-origin `/api`; do not assume the current Vercel service prefix is wired automatically.

The SQL file `supabase/migrations/20261028_protect_customer_tables.sql` is a proposed access-control migration only. It enables RLS and revokes anonymous/authenticated direct access to private operational tables. The same protection is included for a fresh schema installation. Neither SQL file was run. Inspect existing policies/integrations and test the migration in isolation before approving any production execution. Do not run `supabase/seed.sql`.

## Reproduce isolated validation

From the repository root, in a virtual environment with `backend/requirements-test.txt` installed:

```sh
python -m pytest backend/tests -q
npm --prefix frontend ci --ignore-scripts --legacy-peer-deps
CI=true npm --prefix frontend test -- --watchAll=false --runInBand
npm --prefix frontend run build
git diff --check
```

The backend suite uses in-memory storage, mocked Supabase responses and blocked outbound sockets. It replaces the original live-demo tests, which wrote to a shared remote endpoint and asserted unauthenticated access. It exercises request validation, canonical pricing/options/delivery, private order access, server-verified admin access, conditional status updates and concurrent idempotent retries. No AI calls or provider keys are needed. Frontend tests use jsdom for catalogue failures, option pricing, stale cart/admin state, sign-in authorization, retry credentials and checkout/recovery behaviour.

Actual Supabase/MongoDB/hosting integration, real payment verification and mobile browser/visual QA remain to be performed in an authorized isolated preview. Browser installation in the current workspace failed because the browser download was not a valid archive; jsdom tests and the production build are not a substitute for that QA. The proposed SQL migration was not executed or database-tested here.

## Remaining launch work

- Confirm and configure hosting/backend connections, approved admins and payment instructions; validate the real integration using isolated data.
- Implement a persistent product draft/review/publication workflow and verified retailer-link intake. The existing AI link draft still does not verify retailer data and must not be used as an authoritative price/stock source. No researched products are published by this change.
- Have Sir approve the retailer list, catalogue, pricing, delivery coverage and policies before enabling orders. Review existing storefront/AI copy and remove unverified courier relationships, stock claims, delivery ranges and testimonials already stored remotely; this phase does not silently alter live records.
- Add inventory reservation if ready-stock sales are required, a payment-slip storage/verification workflow if approved, and verified support procedures for legacy orders and lost private codes.
- Validate abuse limits, backups, monitoring and the complete operational workflow before public launch.
