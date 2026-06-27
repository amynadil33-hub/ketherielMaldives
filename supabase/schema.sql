-- =====================================================
-- MALDIVES AI RETAIL CONCIERGE - Supabase schema
-- Apply once in your Supabase SQL editor.
-- =====================================================

create extension if not exists "pgcrypto";

-- ---------- core taxonomy ----------
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  source_country text default 'India',
  is_verified boolean default false,
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories(id),
  image_url text,
  icon text,
  color_gradient text,
  blurb text,
  product_count int default 0,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------- products ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  slug text not null unique,
  title text not null,
  brand_id uuid references brands(id),
  category_id uuid references categories(id),
  subcategory text,
  short_description text,
  description text,
  source_name text,
  source_url text,
  source_country text default 'India',
  source_city text,
  source_currency text default 'INR',
  source_price numeric,
  price_mvr numeric not null,
  compare_at_price_mvr numeric,
  product_type text default 'preorder',
  stock_status text default 'preorder',
  preorder boolean default true,
  estimated_delivery_min_days int default 7,
  estimated_delivery_max_days int default 14,
  main_image_url text,
  gallery_images jsonb default '[]'::jsonb,
  size_options jsonb default '[]'::jsonb,
  color_options jsonb default '[]'::jsonb,
  specifications jsonb default '{}'::jsonb,
  badges jsonb default '[]'::jsonb,
  warranty text,
  return_policy text,
  delivery_note text,
  is_featured boolean default false,
  is_active boolean default true,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table categories add column if not exists blurb text;
alter table categories add column if not exists product_count int default 0;
alter table products add column if not exists badges jsonb default '[]'::jsonb;

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  sku text unique,
  variant_name text,
  size text,
  color text,
  storage text,
  model text,
  source_price numeric,
  price_mvr numeric,
  compare_at_price_mvr numeric,
  stock_quantity int default 0,
  stock_status text default 'preorder',
  image_url text,
  created_at timestamptz default now()
);

-- ---------- customers / delivery ----------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  full_name text,
  phone text not null,
  whatsapp text,
  email text,
  island text,
  atoll text,
  created_at timestamptz default now()
);

create table if not exists customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  full_name text,
  phone text,
  atoll text,
  island text,
  address_line text,
  notes text,
  is_default boolean default false,
  created_at timestamptz default now()
);

create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  island_name text not null,
  atoll text,
  delivery_fee_mvr numeric default 0,
  extra_min_days int default 1,
  extra_max_days int default 5,
  courier_partner text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ---------- orders ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid references customers(id),
  customer_name text,
  customer_phone text,
  customer_email text,
  island text,
  atoll text,
  address_line text,
  subtotal_mvr numeric default 0,
  delivery_fee_mvr numeric default 0,
  discount_mvr numeric default 0,
  total_mvr numeric default 0,
  payment_method text,
  payment_status text default 'pending',
  fulfillment_status text default 'order_placed',
  order_type text default 'preorder',
  estimated_delivery_min_days int,
  estimated_delivery_max_days int,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  title text,
  sku text,
  quantity int default 1,
  price_mvr numeric,
  product_type text,
  preorder boolean default true,
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  payment_method text,
  amount_mvr numeric,
  status text default 'pending',
  transaction_reference text,
  slip_url text,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz default now()
);

-- ---------- sourcing & imports ----------
create table if not exists sourcing_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_phone text,
  customer_email text,
  island text,
  atoll text,
  product_url text,
  uploaded_image_url text,
  product_description text,
  budget_mvr numeric,
  quantity int default 1,
  ai_detected_data jsonb default '{}'::jsonb,
  quoted_price_mvr numeric,
  estimated_delivery_min_days int,
  estimated_delivery_max_days int,
  status text default 'new',
  admin_notes text,
  created_at timestamptz default now()
);

create table if not exists import_jobs (
  id uuid primary key default gen_random_uuid(),
  import_type text not null,
  source_name text,
  source_url text,
  file_url text,
  raw_data jsonb,
  normalized_data jsonb,
  status text default 'pending',
  error_message text,
  created_at timestamptz default now()
);

create table if not exists import_batch_rows (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid references import_jobs(id) on delete cascade,
  row_number int,
  raw_data jsonb,
  normalized_data jsonb,
  status text default 'pending',
  error_message text,
  created_at timestamptz default now()
);

-- ---------- engagement ----------
create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(customer_id, product_id)
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  customer_name text,
  island text,
  rating int check (rating >= 1 and rating <= 5),
  comment text,
  is_verified boolean default false,
  is_published boolean default false,
  created_at timestamptz default now()
);

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  code text unique,
  discount_type text,
  discount_value numeric,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists ai_interactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  interaction_type text,
  prompt text,
  response text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ---------- indexes ----------
create index if not exists idx_products_status on products(status);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_featured on products(is_featured);
create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_fulfillment on orders(fulfillment_status);
create index if not exists idx_sourcing_status on sourcing_requests(status);
create unique index if not exists idx_delivery_zones_island_name on delivery_zones(island_name);

-- ---------- public storefront read access ----------
alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table delivery_zones enable row level security;
alter table reviews enable row level security;
alter table promotions enable row level security;

grant usage on schema public to anon, authenticated;
grant select on brands, categories, products, product_variants, delivery_zones, reviews, promotions to anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'brands' and policyname = 'Public can read brands') then
    create policy "Public can read brands" on brands for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'categories' and policyname = 'Public can read categories') then
    create policy "Public can read categories" on categories for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'Public can read published products') then
    create policy "Public can read published products" on products for select using (is_active = true and status = 'published');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_variants' and policyname = 'Public can read variants for published products') then
    create policy "Public can read variants for published products" on product_variants for select using (
      exists (
        select 1
        from products
        where products.id = product_variants.product_id
          and products.is_active = true
          and products.status = 'published'
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_zones' and policyname = 'Public can read active delivery zones') then
    create policy "Public can read active delivery zones" on delivery_zones for select using (is_active = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reviews' and policyname = 'Public can read published reviews') then
    create policy "Public can read published reviews" on reviews for select using (is_published = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'promotions' and policyname = 'Public can read active promotions') then
    create policy "Public can read active promotions" on promotions for select using (is_active = true);
  end if;
end $$;

-- Keep customer/order/sourcing writes behind the backend service role until
-- Supabase Auth and customer-specific policies are added.
