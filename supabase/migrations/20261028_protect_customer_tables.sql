-- REVIEW ONLY: do not run against production without approval.
-- MongoDB currently stores orders; Supabase must not expose a parallel path to personal data.
begin;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.sourcing_requests enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_batch_rows enable row level security;
alter table public.wishlists enable row level security;
alter table public.ai_interactions enable row level security;
revoke all on table public.customers, public.customer_addresses, public.orders,
  public.order_items, public.payments, public.sourcing_requests, public.import_jobs,
  public.import_batch_rows, public.wishlists, public.ai_interactions from anon, authenticated;
commit;
