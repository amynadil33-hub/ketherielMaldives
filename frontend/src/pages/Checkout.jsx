import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { useT } from "../lib/i18n.jsx";
import { useCatalog } from "../lib/catalog.jsx";
import { api, formatMVR } from "../lib/api";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { checkoutAttempt, rememberOrder, pendingCheckout, discardRejectedCheckout } from "../lib/orderAccess";

export default function Checkout() {
  const { cart, subtotal, island, setIsland, clearCart, cartValid } = useStore();
  const { islands, products } = useCatalog();
  const t = useT();
  const nav = useNavigate();
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", customer_email: "",
    atoll: island.atoll, island: island.island, address_line: "",
    notes: "", payment_method: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [pending, setPending] = useState(() => { try { return pendingCheckout(); } catch { return null; } });
  const [configuration, setConfiguration] = useState(null);
  const [configError, setConfigError] = useState("");
  useEffect(() => {
    let active = true;
    api.get("/checkout/config").then(({ data }) => {
      if (active) setConfiguration(data);
    }).catch(() => { if (active) setConfigError("Checkout is temporarily unavailable."); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    setForm((previous) => ({ ...previous, island: island.island, atoll: island.atoll }));
  }, [island.island, island.atoll]);
  const PAYMENT_METHODS = configuration?.payment_methods || [];
  const canOrder = cartValid && configuration?.enabled && PAYMENT_METHODS.some((p) => p.id === form.payment_method);

  if (pending) return <CheckoutRecovery attempt={pending} cart={cart} clearCart={clearCart} />;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl">{t("cart.empty.title")}</h1>
        <Link to="/shop" className="mt-4 inline-block rounded-full bg-slate-900 text-white px-6 py-2 font-semibold">{t("nav.shop")}</Link>
      </div>
    );
  }

  const deliveryFee = island.fee;
  const total = subtotal + deliveryFee;
  const deliveryProducts = cart.map((c) => products.find((p) => p.id === c.id));
  const hasDeliveryEstimate = deliveryProducts.every((p) => Number.isInteger(p?.estimated_delivery_min_days) && Number.isInteger(p?.estimated_delivery_max_days));
  const ed_min = hasDeliveryEstimate ? Math.max(...deliveryProducts.map((p) => p.estimated_delivery_min_days)) + island.min : null;
  const ed_max = hasDeliveryEstimate ? Math.max(...deliveryProducts.map((p) => p.estimated_delivery_max_days)) + island.max : null;

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleIslandChange = (name) => {
    const i = islands.find((x) => x.island === name);
    if (i) { setIsland(i); update("island", i.island); update("atoll", i.atoll); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current || !canOrder) return;
    if (!form.customer_name || !form.customer_phone || !form.address_line) {
      toast.error(t("checkout.field.name") + " · " + t("checkout.field.phone") + " · " + t("checkout.field.address"));
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        customer_name: form.customer_name, customer_phone: form.customer_phone,
        customer_email: form.customer_email || null, island: form.island,
        address_line: form.address_line, notes: form.notes, payment_method: form.payment_method,
        items: cart.map((c) => ({ product_id: c.id, quantity: c.qty, variant: c.variant })),
        expected_total_mvr: Number(total.toFixed(2)),
      };
      const attempt = checkoutAttempt(payload);
      const { data } = await api.post("/orders", payload, {
        headers: { "Idempotency-Key": attempt.key, "X-Order-Token": attempt.token },
      });
      rememberOrder(data.order_number, attempt.token);
      clearCart();
      nav(`/order-success/${data.order_number}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if ([422, 503].includes(err.response?.status) || detail?.code === "checkout_rejected") {
        discardRejectedCheckout();
      } else {
        try { setPending(pendingCheckout()); } catch {}
      }
      toast.error(detail?.message || (typeof detail === "string" ? detail : err.message || "We could not complete checkout. Your cart is saved."));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <h1 className="font-display text-4xl md:text-5xl">{t("checkout.title")}</h1>
      <p className="text-slate-500 mt-1">{t("checkout.sub")}</p>

      {!cartValid && <p role="alert" className="mt-4 text-amber-900">Some items or delivery details need review. Refresh the catalogue and re-add any unavailable or changed items before ordering.</p>}
      {(!configuration?.enabled || configError) && <p role="status" className="mt-4 text-amber-900">{configError || (configuration ? "Checkout is not yet available. Please contact support for help." : "Checking checkout availability…")}</p>}
      <form onSubmit={submit} className="mt-8 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-6">
          {/* contact */}
          <Section title={t("checkout.sec.contact")} desc={t("checkout.sec.contact.desc")}>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={t("checkout.field.name")} required testid="checkout-name">
                <input value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} required className="input" />
              </Field>
              <Field label={t("checkout.field.phone")} required testid="checkout-phone">
                <input value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} required placeholder="+960 ..." className="input" />
              </Field>
              <Field label={t("checkout.field.email")} testid="checkout-email">
                <input type="email" value={form.customer_email} onChange={(e) => update("customer_email", e.target.value)} className="input" />
              </Field>
            </div>
          </Section>

          {/* delivery */}
          <Section title={t("checkout.sec.deliver")} desc={t("checkout.sec.deliver.desc")}>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={t("checkout.field.island")} required testid="checkout-island">
                <select value={form.island} onChange={(e) => handleIslandChange(e.target.value)} className="input">
                  {islands.map((i) => <option key={i.island} value={i.island}>{i.island} ({i.atoll})</option>)}
                </select>
              </Field>
              <Field label={t("checkout.field.atoll")} testid="checkout-atoll">
                <input value={form.atoll} readOnly className="input bg-stone-50" />
              </Field>
              <Field label={t("checkout.field.address")} required testid="checkout-address">
                <input value={form.address_line} onChange={(e) => update("address_line", e.target.value)} required placeholder="Street, house, landmark" className="input sm:col-span-2" />
              </Field>
              <Field label={t("checkout.field.notes")} testid="checkout-notes">
                <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder={t("checkout.field.notesPh")} className="input min-h-24" />
              </Field>
            </div>
          </Section>

          {/* payment */}
          <Section title={t("checkout.sec.payment")} desc={t("checkout.sec.payment.desc")}>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((p) => (
                <label key={p.id} className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-colors ${form.payment_method === p.id ? "border-teal-700 bg-teal-50/50" : "border-stone-200 hover:border-stone-300"}`} data-testid={`payment-${p.id}`}>
                  <input type="radio" name="pm" checked={form.payment_method === p.id} onChange={() => update("payment_method", p.id)} className="mt-1 accent-teal-700" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{p.label}</div>
                    <div className="text-xs text-slate-500">{p.instructions}</div>
                  </div>
                </label>
              ))}
            </div>
          </Section>
        </div>

        {/* summary */}
        <aside className="md:col-span-4">
          <div className="sticky top-24 rounded-2xl bg-white border border-stone-200 p-6">
            <h3 className="font-display text-2xl">{t("cart.summary")}</h3>
            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
              {cart.map((c) => (
                <div key={c.key} className="flex gap-3">
                  <img src={c.main_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.title}</div>
                    <div className="text-xs text-slate-500">{t("cart.qty")} {c.qty}{c.variant ? ` · ${c.variant}` : ""}</div>
                  </div>
                  <div className="text-sm font-bold">{formatMVR(c.price_mvr * c.qty)}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2 text-sm border-t border-stone-200 pt-4">
              <div className="flex justify-between"><span className="text-slate-500">{t("cart.subtotal")}</span><span className="font-semibold">{formatMVR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{t("cart.delivery")}</span><span className="font-semibold">{formatMVR(deliveryFee)}</span></div>
              <div className="flex justify-between text-base pt-2 border-t border-stone-200"><span className="font-semibold">{t("cart.total")}</span><span className="font-bold text-xl">{formatMVR(total)}</span></div>
              {hasDeliveryEstimate && <div className="text-xs text-slate-500">{t("checkout.estimated")} <span className="font-semibold text-slate-900">{ed_min}–{ed_max} {t("product.days")}</span></div>}
            </div>
            <button disabled={submitting || !canOrder} type="submit" className="mt-6 w-full rounded-full bg-slate-900 text-white py-3.5 font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2" data-testid="checkout-place-order">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? t("checkout.placing") : t("checkout.place")}
            </button>
            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">Your payment remains pending until it is verified. Review the order details before submitting.</p>
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

function CheckoutRecovery({ attempt, cart, clearCart }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigating = useNavigate();
  const inFlight = useRef(false);
  const retry = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const payload = JSON.parse(attempt.fingerprint);
      const { data } = await api.post("/orders", payload, { headers: { "Idempotency-Key": attempt.key, "X-Order-Token": attempt.token } });
      rememberOrder(data.order_number, attempt.token);
      const currentItems = cart.map((item) => ({ product_id: item.id, quantity: item.qty, variant: item.variant }));
      if (JSON.stringify(currentItems) === JSON.stringify(payload.items)) clearCart();
      navigating(`/order-success/${data.order_number}`);
    } catch (failure) {
      const detail = failure.response?.data?.detail;
      // After a lost response, even an unavailable service cannot prove the first request failed.
      // Keep the original key until a receipt or verified support reconciliation is available.
      setError(detail?.message || "We could not recover the order yet. Retry or contact support before placing another order.");
    } finally { inFlight.current = false; setBusy(false); }
  };
  return <div className="mx-auto max-w-2xl px-4 py-16">
    <h1 className="font-display text-3xl">Recover your previous checkout</h1>
    <p className="mt-4">Your previous checkout did not receive a confirmation. Retry that same order first so it cannot be submitted twice.</p>
    <button onClick={retry} disabled={busy} className="mt-6 rounded-full bg-slate-900 px-6 py-3 text-white disabled:opacity-50">{busy ? "Recovering…" : "Retry previous checkout"}</button>
    {error && <p role="alert" className="mt-4 text-amber-900">{error}</p>}
  </div>;
}
