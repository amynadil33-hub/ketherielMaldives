const rawSupabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseKey =
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "";

export const SUPABASE_URL = rawSupabaseUrl.replace(/\/+$/, "");
export const SUPABASE_KEY = supabaseKey;
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

function tableUrl(table, params = {}) {
  const qs = new URLSearchParams(params);
  return `${SUPABASE_URL}/rest/v1/${table}${qs.toString() ? `?${qs}` : ""}`;
}

async function select(table, params) {
  if (!isSupabaseConfigured) return [];

  const res = await fetch(tableUrl(table, params), {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Supabase ${table} request failed (${res.status}): ${detail || res.statusText}`);
  }

  return res.json();
}

export async function fetchSupabaseCatalog() {
  const [categories, brands, products, islands, reviews] = await Promise.all([
    select("categories", {
      select: "id,name,slug,image_url,icon,color_gradient,sort_order,blurb,product_count",
      order: "sort_order.asc,name.asc",
    }),
    select("brands", {
      select: "id,name,slug,source_country,is_verified",
      order: "name.asc",
    }),
    select("products", {
      select: "*,brands(name,slug,is_verified,source_country),categories(name,slug)",
      is_active: "eq.true",
      status: "eq.published",
      order: "is_featured.desc,title.asc",
    }),
    select("delivery_zones", {
      select: "island_name,atoll,delivery_fee_mvr,extra_min_days,extra_max_days,courier_partner,is_active",
      is_active: "eq.true",
      order: "atoll.asc,island_name.asc",
    }),
    select("reviews", {
      select: "customer_name,island,rating,comment,is_verified,is_published,created_at",
      is_published: "eq.true",
      order: "created_at.desc",
      limit: "12",
    }),
  ]);

  return { categories, brands, products, islands, reviews };
}
