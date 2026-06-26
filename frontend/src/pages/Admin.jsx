import React, { useEffect, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { api, formatMVR } from "../lib/api";
import { PRODUCTS, FULFILLMENT_STAGES } from "../lib/seedData";
import { Lock, Package, ShoppingBag, Search, FileText, Upload, Sparkles, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ADMIN_PASS = "raalhu2026";

export default function Admin() {
  const { adminAuthed, setAdminAuthed } = useStore();
  const [pass, setPass] = useState("");
  const [tab, setTab] = useState("overview");

  if (!adminAuthed) {
    return (
      <div className="min-h-[70vh] grid place-items-center px-4">
        <div className="rounded-3xl bg-white border border-stone-200 p-8 max-w-md w-full">
          <Lock className="h-6 w-6 text-teal-700" />
          <h1 className="font-display text-3xl mt-3">Admin login</h1>
          <p className="text-sm text-slate-500 mt-1">Restricted area. Enter the admin passphrase.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (pass === ADMIN_PASS) { setAdminAuthed(true); toast.success("Welcome, admin"); } else toast.error("Wrong password"); }} className="mt-5 space-y-3">
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Passphrase" className="w-full rounded-full border border-stone-200 px-5 py-3 text-sm" data-testid="admin-password-input" />
            <button type="submit" className="w-full rounded-full bg-slate-900 text-white py-3 font-semibold" data-testid="admin-login-button">Enter</button>
          </form>
          <p className="text-[11px] text-slate-400 mt-4">Hint for demo: raalhu2026 (replace with Supabase auth later)</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { k: "overview", l: "Overview", icon: Package },
    { k: "orders", l: "Orders", icon: ShoppingBag },
    { k: "sourcing", l: "Sourcing Requests", icon: Search },
    { k: "import", l: "Import Center", icon: Upload },
    { k: "ai", l: "AI Tools", icon: Sparkles },
    { k: "products", l: "Products", icon: FileText },
  ];

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-6 max-w-7xl mx-auto px-4 py-8">
      <aside className="rounded-2xl bg-white border border-stone-200 p-3 h-fit">
        <div className="px-3 py-2 text-xs uppercase tracking-widest text-slate-500 font-semibold">Admin</div>
        <nav className="space-y-1">
          {tabs.map(({ k, l, icon: Icon }) => (
            <button key={k} onClick={() => setTab(k)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${tab === k ? "bg-slate-900 text-white" : "hover:bg-stone-100 text-slate-700"}`} data-testid={`admin-tab-${k}`}>
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </nav>
        <button onClick={() => setAdminAuthed(false)} className="mt-4 w-full text-xs text-slate-500 hover:text-rose-500 px-3 py-2" data-testid="admin-logout">Sign out</button>
      </aside>
      <div>
        {tab === "overview" && <Overview />}
        {tab === "orders" && <Orders />}
        {tab === "sourcing" && <Sourcing />}
        {tab === "import" && <ImportCenter />}
        {tab === "ai" && <AITools />}
        {tab === "products" && <Products />}
      </div>
    </div>
  );
}

function Overview() {
  const [orders, setOrders] = useState([]);
  const [sourcing, setSourcing] = useState([]);
  useEffect(() => {
    api.get("/orders").then(({ data }) => setOrders(data || []));
    api.get("/sourcing-requests").then(({ data }) => setSourcing(data || []));
  }, []);
  const revenue = orders.reduce((acc, o) => acc + (o.total_mvr || 0), 0);
  const stats = [
    { label: "Orders", value: orders.length, sub: "Total in system" },
    { label: "Pending Pre-orders", value: orders.filter((o) => o.fulfillment_status !== "delivered").length, sub: "Need confirmation" },
    { label: "Sourcing Requests", value: sourcing.filter((s) => s.status === "new").length, sub: "New leads" },
    { label: "Revenue", value: formatMVR(revenue), sub: "Lifetime MVR" },
  ];
  return (
    <div>
      <h1 className="font-display text-4xl">Overview</h1>
      <p className="text-slate-500">A snapshot of your store right now.</p>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-stone-200 p-5">
            <div className="text-xs uppercase tracking-widest text-teal-700 font-semibold">{s.label}</div>
            <div className="font-display text-3xl mt-1">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-stone-200 p-5">
          <h3 className="font-display text-2xl">Recent orders</h3>
          <div className="mt-3 space-y-2 text-sm">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex justify-between py-2 border-b border-stone-100 last:border-0">
                <span><span className="font-semibold">{o.order_number}</span> · {o.customer_name}</span>
                <span className="text-slate-500">{o.island} · {formatMVR(o.total_mvr)}</span>
              </div>
            ))}
            {orders.length === 0 && <div className="text-slate-500">No orders yet.</div>}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5">
          <h3 className="font-display text-2xl">Recent sourcing</h3>
          <div className="mt-3 space-y-2 text-sm">
            {sourcing.slice(0, 5).map((s) => (
              <div key={s.id} className="flex justify-between py-2 border-b border-stone-100 last:border-0">
                <span className="truncate pr-2"><span className="font-semibold">{s.customer_name}</span> · {s.product_description || s.product_url || "—"}</span>
                <span className="text-xs text-slate-500">{s.island}</span>
              </div>
            ))}
            {sourcing.length === 0 && <div className="text-slate-500">No sourcing requests yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Orders() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); api.get("/orders").then(({ data }) => { setRows(data || []); setLoading(false); }); };
  useEffect(load, []);
  const advance = async (o) => {
    const idx = FULFILLMENT_STAGES.findIndex((s) => s.key === o.fulfillment_status);
    const next = FULFILLMENT_STAGES[Math.min(idx + 1, FULFILLMENT_STAGES.length - 1)];
    await api.patch(`/orders/${o.id}/status`, { fulfillment_status: next.key });
    toast.success(`Moved to ${next.label}`);
    load();
  };
  return (
    <div>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-4xl">Orders</h1>
          <p className="text-slate-500">Manage and advance fulfillment.</p>
        </div>
        <button onClick={load} className="text-sm inline-flex items-center gap-1 text-teal-700"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin mt-6" /> : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr><Th>Order</Th><Th>Customer</Th><Th>Island</Th><Th>Total</Th><Th>Status</Th><Th>Action</Th></tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-stone-100">
                  <Td><div className="font-semibold">{o.order_number}</div><div className="text-xs text-slate-500">{new Date(o.created_at).toLocaleDateString()}</div></Td>
                  <Td><div className="font-semibold">{o.customer_name}</div><div className="text-xs text-slate-500">{o.customer_phone}</div></Td>
                  <Td>{o.island}</Td>
                  <Td className="font-semibold">{formatMVR(o.total_mvr)}</Td>
                  <Td><span className="text-xs rounded-full bg-teal-50 text-teal-800 px-2 py-1">{(FULFILLMENT_STAGES.find((s) => s.key === o.fulfillment_status) || {}).label}</span></Td>
                  <Td><button onClick={() => advance(o)} className="text-xs rounded-full bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-800" data-testid={`advance-${o.id}`}>Advance →</button></Td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-500">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Sourcing() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get("/sourcing-requests").then(({ data }) => setRows(data || [])); }, []);
  return (
    <div>
      <h1 className="font-display text-4xl">Sourcing Requests</h1>
      <p className="text-slate-500">Customer-submitted "Find-it-for-me" leads.</p>
      <div className="mt-6 space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white border border-stone-200 p-5">
            <div className="flex justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-teal-700 font-semibold">{r.island}</div>
                <div className="font-display text-2xl">{r.customer_name}</div>
                <div className="text-sm text-slate-500">{r.customer_phone}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Budget</div>
                <div className="font-bold">{r.budget_mvr ? formatMVR(r.budget_mvr) : "—"}</div>
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-700">{r.product_description}</div>
            {r.product_url && <a href={r.product_url} target="_blank" rel="noreferrer" className="mt-2 text-xs text-teal-700 inline-flex items-center gap-1">{r.product_url} <ExternalLink className="h-3 w-3" /></a>}
            {r.notes && <div className="mt-2 text-xs text-slate-500">Note: {r.notes}</div>}
          </div>
        ))}
        {rows.length === 0 && <div className="text-slate-500 text-center py-12">No requests yet.</div>}
      </div>
    </div>
  );
}

function ImportCenter() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [csv, setCsv] = useState("");
  const [csvRows, setCsvRows] = useState(null);

  const importUrl = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const { data } = await api.post("/ai/find-it-for-me", { product_url: url });
      setDraft(data.draft || { raw: data.raw });
    } catch { toast.error("Could not extract"); }
    finally { setLoading(false); }
  };

  const parseCsv = () => {
    if (!csv) return;
    const lines = csv.trim().split(/\r?\n/);
    const headers = lines[0].split(",").map((s) => s.trim());
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(",");
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cols[i]; });
      // simple validation
      const errs = [];
      if (!obj.sku) errs.push("missing sku");
      if (!obj.title) errs.push("missing title");
      if (!obj.price_mvr) errs.push("missing price_mvr");
      if (!obj.category) errs.push("missing category");
      if (!obj.main_image_url) errs.push("missing main_image_url");
      return { ...obj, _errors: errs };
    });
    setCsvRows(rows);
  };

  return (
    <div>
      <h1 className="font-display text-4xl">Import Center</h1>
      <p className="text-slate-500">Bring products into the StandardProduct format from any source.</p>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-stone-200 p-6">
          <div className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Paste product URL</div>
          <h3 className="font-display text-2xl mt-1">URL → Draft</h3>
          <div className="mt-4 flex gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://amazon.in/dp/B07X..." className="flex-1 rounded-full border border-stone-200 px-4 py-2.5 text-sm" data-testid="import-url-input" />
            <button onClick={importUrl} disabled={loading} className="rounded-full bg-slate-900 text-white px-5 text-sm font-semibold disabled:opacity-60" data-testid="import-url-go">{loading ? "..." : "Extract"}</button>
          </div>
          {draft && (
            <pre className="mt-4 max-h-72 overflow-auto text-xs bg-stone-50 p-3 rounded-xl whitespace-pre-wrap">{JSON.stringify(draft, null, 2)}</pre>
          )}
          <div className="mt-3 text-xs text-slate-500">Imports never publish automatically. Review then approve & publish.</div>
        </div>

        <div className="rounded-2xl bg-white border border-stone-200 p-6">
          <div className="text-xs uppercase tracking-widest text-teal-700 font-semibold">CSV upload</div>
          <h3 className="font-display text-2xl mt-1">CSV → Batch draft</h3>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="Paste CSV here (sku,title,brand,category,...)" className="mt-3 w-full rounded-2xl border border-stone-200 p-3 text-xs min-h-32 font-mono" data-testid="csv-input" />
          <button onClick={parseCsv} className="mt-2 rounded-full bg-slate-900 text-white px-5 py-2 text-sm font-semibold" data-testid="csv-parse">Validate</button>
          {csvRows && (
            <div className="mt-4 max-h-72 overflow-auto text-xs">
              {csvRows.map((r, i) => (
                <div key={i} className="border-t border-stone-100 py-2">
                  <div className="font-semibold">{r.title || "(no title)"} <span className="text-slate-400">· {r.sku || "no SKU"}</span></div>
                  {r._errors.length > 0 ? (
                    <div className="text-rose-500 text-[11px]">⚠ {r._errors.join(", ")}</div>
                  ) : (
                    <div className="text-emerald-600 text-[11px]">✓ Ready for draft</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-stone-50 border border-stone-200 p-5 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">CSV header:</span> sku,title,brand,category,subcategory,short_description,description,source_name,source_url,source_country,source_city,source_currency,source_price,price_mvr,compare_at_price_mvr,product_type,stock_status,preorder,estimated_delivery_min_days,estimated_delivery_max_days,main_image_url,gallery_images,size_options,color_options,specifications,warranty,return_policy,delivery_note,status
      </div>
    </div>
  );
}

function AITools() {
  const [raw, setRaw] = useState("");
  const [out, setOut] = useState(null);
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/ai/product-description", { raw_text: raw });
      setOut(data.result || { raw: data.raw });
    } finally { setLoading(false); }
  };
  return (
    <div>
      <h1 className="font-display text-4xl">AI Tools</h1>
      <p className="text-slate-500">Rewrite supplier text into premium store copy. Powered by Claude Sonnet 4.5.</p>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-stone-200 p-6">
          <div className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Description generator</div>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} className="mt-3 w-full rounded-2xl border border-stone-200 p-3 text-sm min-h-40" placeholder="Paste raw supplier text here…" data-testid="ai-desc-input" />
          <button onClick={generate} disabled={loading || !raw} className="mt-2 rounded-full bg-slate-900 text-white px-5 py-2 text-sm font-semibold disabled:opacity-60" data-testid="ai-desc-go">{loading ? "Generating…" : "Rewrite"}</button>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-6">
          <div className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Output</div>
          <pre className="mt-3 max-h-96 overflow-auto text-xs whitespace-pre-wrap bg-stone-50 p-3 rounded-xl">{out ? JSON.stringify(out, null, 2) : "Awaiting input…"}</pre>
        </div>
      </div>
    </div>
  );
}

function Products() {
  return (
    <div>
      <h1 className="font-display text-4xl">Products</h1>
      <p className="text-slate-500">{PRODUCTS.length} demo products loaded from seed data.</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50">
            <tr><Th>SKU</Th><Th>Title</Th><Th>Brand</Th><Th>Category</Th><Th>Type</Th><Th>Price</Th></tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => (
              <tr key={p.id} className="border-t border-stone-100">
                <Td className="font-mono text-xs">{p.sku}</Td>
                <Td className="font-semibold">{p.title}</Td>
                <Td>{p.brand}</Td>
                <Td className="capitalize">{p.category}</Td>
                <Td><span className="text-xs rounded-full bg-teal-50 text-teal-800 px-2 py-1">{p.product_type}</span></Td>
                <Td>{formatMVR(p.price_mvr)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) { return <th className="text-left text-xs uppercase tracking-widest text-slate-500 font-semibold px-4 py-3">{children}</th>; }
function Td({ children, className = "" }) { return <td className={`px-4 py-3 ${className}`}>{children}</td>; }
