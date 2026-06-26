import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { api, formatMVR } from "../lib/api";
import { Upload, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { ISLANDS } from "../lib/seedData";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { id: "bml_transfer", label: "BML Bank Transfer", note: "Bank of Maldives — Acc# pending setup" },
  { id: "mib_transfer", label: "MIB Bank Transfer", note: "Maldives Islamic Bank — Acc# pending setup" },
  { id: "mfaisaa", label: "Ooredoo m-Faisaa", note: "Send to 7912865" },
  { id: "dhiraagu_pay", label: "Dhiraagu Pay", note: "Pay to merchant Raalhu" },
  { id: "slip_upload", label: "Payment slip upload", note: "We verify within 30 mins" },
  { id: "cash_pickup", label: "Cash on pickup (ready stock only)", note: "Male & Hulhumale" },
];

export default function Checkout() {
  const { cart, subtotal, island, setIsland, clearCart } = useStore();
  const nav = useNavigate();
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", customer_email: "",
    atoll: island.atoll, island: island.island, address_line: "",
    notes: "", payment_method: "bml_transfer",
  });
  const [submitting, setSubmitting] = useState(false);
  const [slipFile, setSlipFile] = useState(null);

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl">Your cart is empty</h1>
        <Link to="/shop" className="mt-4 inline-block rounded-full bg-slate-900 text-white px-6 py-2 font-semibold">Shop now</Link>
      </div>
    );
  }

  const deliveryFee = island.fee;
  const total = subtotal + deliveryFee;
  const ed_min = Math.min(...cart.map((c) => 7)) + island.min;
  const ed_max = Math.max(...cart.map((c) => 14)) + island.max;

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleIslandChange = (name) => {
    const i = ISLANDS.find((x) => x.island === name);
    if (i) { setIsland(i); update("island", i.island); update("atoll", i.atoll); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_phone || !form.address_line) {
      toast.error("Please fill name, phone and address");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: cart.map((c) => ({
          product_id: c.id, title: c.title, sku: c.sku, quantity: c.qty,
          price_mvr: c.price_mvr, variant: c.variant, main_image_url: c.main_image_url, product_type: c.product_type,
        })),
        subtotal_mvr: subtotal, delivery_fee_mvr: deliveryFee, discount_mvr: 0, total_mvr: total,
        estimated_delivery_min_days: ed_min, estimated_delivery_max_days: ed_max,
      };
      const { data } = await api.post("/orders", payload);
      clearCart();
      nav(`/order-success/${data.order_number}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not place order. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <h1 className="font-display text-4xl md:text-5xl">Checkout</h1>
      <p className="text-slate-500 mt-1">Almost there. Maldives-friendly fields below.</p>

      <form onSubmit={submit} className="mt-8 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-6">
          {/* contact */}
          <Section title="Contact" desc="We'll send order updates to your phone via WhatsApp.">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Full name" required testid="checkout-name">
                <input value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} required className="input" />
              </Field>
              <Field label="Phone / WhatsApp" required testid="checkout-phone">
                <input value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} required placeholder="+960 ..." className="input" />
              </Field>
              <Field label="Email (optional)" testid="checkout-email">
                <input type="email" value={form.customer_email} onChange={(e) => update("customer_email", e.target.value)} className="input" />
              </Field>
            </div>
          </Section>

          {/* delivery */}
          <Section title="Deliver to" desc="Delivery fee & timing adjust based on your atoll.">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Island" required testid="checkout-island">
                <select value={form.island} onChange={(e) => handleIslandChange(e.target.value)} className="input">
                  {ISLANDS.map((i) => <option key={i.island} value={i.island}>{i.island} ({i.atoll})</option>)}
                </select>
              </Field>
              <Field label="Atoll" testid="checkout-atoll">
                <input value={form.atoll} readOnly className="input bg-stone-50" />
              </Field>
              <Field label="Address / Pickup point" required testid="checkout-address">
                <input value={form.address_line} onChange={(e) => update("address_line", e.target.value)} required placeholder="Street, house, landmark" className="input sm:col-span-2" />
              </Field>
              <Field label="Delivery notes" testid="checkout-notes">
                <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Call before arrival, leave with neighbour, etc." className="input min-h-24" />
              </Field>
            </div>
          </Section>

          {/* payment */}
          <Section title="Payment" desc="Pick your preferred Maldives payment method.">
            <div className="space-y-2">
              {PAYMENT_METHODS.map((p) => (
                <label key={p.id} className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-colors ${form.payment_method === p.id ? "border-teal-700 bg-teal-50/50" : "border-stone-200 hover:border-stone-300"}`} data-testid={`payment-${p.id}`}>
                  <input type="radio" name="pm" checked={form.payment_method === p.id} onChange={() => update("payment_method", p.id)} className="mt-1 accent-teal-700" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{p.label}</div>
                    <div className="text-xs text-slate-500">{p.note}</div>
                  </div>
                </label>
              ))}
            </div>
            {form.payment_method === "slip_upload" && (
              <div className="mt-3 rounded-2xl border-2 border-dashed border-stone-300 p-6 text-center">
                <Upload className="h-6 w-6 mx-auto text-slate-400" />
                <p className="text-sm mt-2 text-slate-600">{slipFile ? slipFile.name : "Drag & drop your payment slip"}</p>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => setSlipFile(e.target.files?.[0])} className="mt-3 text-sm" data-testid="slip-upload" />
              </div>
            )}
          </Section>
        </div>

        {/* summary */}
        <aside className="md:col-span-4">
          <div className="sticky top-24 rounded-2xl bg-white border border-stone-200 p-6">
            <h3 className="font-display text-2xl">Order summary</h3>
            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
              {cart.map((c) => (
                <div key={c.key} className="flex gap-3">
                  <img src={c.main_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.title}</div>
                    <div className="text-xs text-slate-500">Qty {c.qty}{c.variant ? ` · ${c.variant}` : ""}</div>
                  </div>
                  <div className="text-sm font-bold">{formatMVR(c.price_mvr * c.qty)}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2 text-sm border-t border-stone-200 pt-4">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{formatMVR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span className="font-semibold">{formatMVR(deliveryFee)}</span></div>
              <div className="flex justify-between text-base pt-2 border-t border-stone-200"><span className="font-semibold">Total</span><span className="font-bold text-xl">{formatMVR(total)}</span></div>
              <div className="text-xs text-slate-500">Estimated delivery <span className="font-semibold text-slate-900">{ed_min}–{ed_max} days</span></div>
            </div>
            <button disabled={submitting} type="submit" className="mt-6 w-full rounded-full bg-slate-900 text-white py-3.5 font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2" data-testid="checkout-place-order">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? "Placing order…" : "Place order"}
            </button>
            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">By placing this order you agree that pre-order pricing is final after admin's supplier check. Refunds are allowed if we cannot source.</p>
          </div>
        </aside>
      </form>

      <style>{`
        .input { width: 100%; border-radius: 12px; border: 1px solid #e7e5e4; background:#fff; padding: 10px 14px; font-size: 14px; }
        .input:focus { outline: none; border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15,118,110,0.15); }
      `}</style>
    </div>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="rounded-2xl bg-white border border-stone-200 p-6">
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
function Field({ label, required, children, testid }) {
  return (
    <label className="block" data-testid={testid}>
      <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{label}{required && <span className="text-rose-500"> *</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
