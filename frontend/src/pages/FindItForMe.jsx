import React, { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { useT } from "../lib/i18n.jsx";
import { useCatalog } from "../lib/catalog.jsx";
import { api, waLink } from "../lib/api";
import { Sparkles, MessageCircle, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function FindItForMe() {
  const { island } = useStore();
  const { islands } = useCatalog();
  const t = useT();
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", customer_email: "",
    product_url: "", product_description: "", budget_mvr: "",
    quantity: 1, island: island.island, atoll: island.atoll, notes: "",
  });
  const [draft, setDraft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState(null);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const aiDraft = async () => {
    if (!form.product_url && !form.product_description) {
      toast.error(t("fifm.field.url") + " / " + t("fifm.field.desc"));
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/ai/find-it-for-me", {
        product_url: form.product_url, description: form.product_description,
        budget_mvr: Number(form.budget_mvr) || null, quantity: Number(form.quantity) || 1, island: form.island,
      });
      setDraft(data.draft || { raw: data.raw });
    } catch (e) {
      console.error(e);
      toast.error(t("ai.error"));
    } finally { setSubmitting(false); }
  };

  const submit = async () => {
    if (!form.customer_name || !form.customer_phone) {
      toast.error(t("fifm.field.name") + " · " + t("fifm.field.phone"));
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/sourcing-requests", {
        ...form, budget_mvr: Number(form.budget_mvr) || null, quantity: Number(form.quantity) || 1,
      });
      setSavedId(data.id);
      toast.success(t("fifm.success"));
    } catch (e) {
      toast.error(t("ai.error"));
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      {/* hero */}
      <section className="bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 grain opacity-20" />
        <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-teal-700/30 blur-3xl" />
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="text-xs uppercase tracking-[0.3em] text-amber-300 font-semibold">{t("fifm.kicker")}</div>
          <h1 className="font-display text-5xl md:text-6xl mt-3 leading-[0.95] max-w-3xl">{t("fifm.title")}</h1>
          <p className="text-slate-300 mt-4 max-w-2xl">{t("fifm.sub")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16 grid md:grid-cols-12 gap-10">
        {/* form */}
        <div className="md:col-span-7">
          <div className="rounded-3xl bg-white border border-stone-200 p-6 md:p-8 space-y-5">
            <h2 className="font-display text-3xl">{t("fifm.sec.tell")}</h2>

            <Field label={t("fifm.field.url")} testid="fifm-url">
              <input value={form.product_url} onChange={(e) => update("product_url", e.target.value)} placeholder="https://www.amazon.in/...." className="input" />
            </Field>
            <Field label={t("fifm.field.desc")} testid="fifm-desc">
              <textarea value={form.product_description} onChange={(e) => update("product_description", e.target.value)} placeholder="boAt Airdopes 141, black, 1 unit" className="input min-h-24" />
            </Field>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={t("fifm.field.budget")} testid="fifm-budget">
                <input type="number" value={form.budget_mvr} onChange={(e) => update("budget_mvr", e.target.value)} placeholder="1200" className="input" />
              </Field>
              <Field label={t("fifm.field.qty")} testid="fifm-qty">
                <input type="number" min="1" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} className="input" />
              </Field>
              <Field label={t("fifm.field.island")} testid="fifm-island">
                <select value={form.island} onChange={(e) => {
                  const i = islands.find((x) => x.island === e.target.value);
                  update("island", e.target.value);
                  if (i) update("atoll", i.atoll);
                }} className="input">
                  {islands.map((i) => <option key={i.island}>{i.island}</option>)}
                </select>
              </Field>
              <Field label={t("fifm.field.atoll")} testid="fifm-atoll">
                <input value={form.atoll} readOnly className="input bg-stone-50" />
              </Field>
            </div>

            <button onClick={aiDraft} disabled={submitting} className="w-full rounded-full gradient-ocean text-white py-3.5 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60" data-testid="fifm-ai-draft">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-300" />}
              {submitting ? t("fifm.cta.drafting") : t("fifm.cta.draft")}
            </button>

            {/* contact */}
            <div className="border-t border-stone-200 pt-5 space-y-3">
              <h3 className="font-display text-2xl">{t("fifm.yourDetails")}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label={t("fifm.field.name")} required testid="fifm-name">
                  <input value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} required className="input" />
                </Field>
                <Field label={t("fifm.field.phone")} required testid="fifm-phone">
                  <input value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} required className="input" placeholder="+960 ..." />
                </Field>
                <Field label={t("fifm.field.email")} testid="fifm-email">
                  <input type="email" value={form.customer_email} onChange={(e) => update("customer_email", e.target.value)} className="input" />
                </Field>
                <Field label={t("fifm.field.notes")} testid="fifm-notes">
                  <input value={form.notes} onChange={(e) => update("notes", e.target.value)} className="input" placeholder={t("fifm.field.notes.ph")} />
                </Field>
              </div>
              <button onClick={submit} disabled={submitting || !!savedId} className="w-full rounded-full bg-slate-900 text-white py-3.5 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60" data-testid="fifm-submit">
                {savedId ? <><CheckCircle2 className="h-4 w-4" /> {t("fifm.submitted")}</> : <>{t("fifm.submit")} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4 leading-relaxed">{t("fifm.aiDisclaim")}</p>
        </div>

        {/* preview / draft */}
        <div className="md:col-span-5">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl bg-white border border-stone-200 p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="font-display text-2xl">{t("fifm.aiDraft")}</h3>
              </div>
              {!draft && <p className="mt-3 text-sm text-slate-500">{t("fifm.aiDraft.empty")}</p>}
              {draft && (
                <div className="mt-4 space-y-3 text-sm">
                  {draft.detected_product_name && <Row k={t("fifm.row.product")} v={draft.detected_product_name} />}
                  {draft.brand && <Row k={t("fifm.row.brand")} v={draft.brand} />}
                  {draft.category && <Row k={t("fifm.row.category")} v={draft.category} />}
                  {draft.estimated_source_price_inr && <Row k={t("fifm.row.source")} v={`INR ${draft.estimated_source_price_inr}`} />}
                  {draft.suggested_price_mvr && <Row k={t("fifm.row.suggested")} v={`MVR ${draft.suggested_price_mvr}`} highlight />}
                  {(draft.estimated_delivery_min_days || draft.estimated_delivery_max_days) && (
                    <Row k={t("fifm.row.delivery")} v={`${draft.estimated_delivery_min_days || "?"}–${draft.estimated_delivery_max_days || "?"} ${t("product.days")}`} />
                  )}
                  {draft.sourcing_notes && <div className="text-xs text-slate-500 mt-3 leading-relaxed border-t border-stone-200 pt-3"><span className="font-semibold text-slate-700">{t("fifm.row.notes")}</span> {draft.sourcing_notes}</div>}
                  {draft.missing_info && draft.missing_info.length > 0 && <div className="text-xs text-rose-500">{t("fifm.row.missing")} {Array.isArray(draft.missing_info) ? draft.missing_info.join(", ") : draft.missing_info}</div>}
                  {draft.raw && <pre className="text-xs whitespace-pre-wrap bg-stone-50 p-3 rounded-xl mt-2">{draft.raw}</pre>}
                </div>
              )}
            </div>
            <a href={waLink("Hi Raalhu, I'd like to source a product. Here's the link/details:")} target="_blank" rel="noreferrer" className="block w-full rounded-2xl bg-emerald-500 text-white text-center py-3 font-semibold inline-flex items-center justify-center gap-2 hover:bg-emerald-600" data-testid="fifm-whatsapp">
              <MessageCircle className="h-4 w-4" /> {t("fifm.waDirect")}
            </a>
          </div>
        </div>
      </section>

      <style>{`
        .input { width: 100%; border-radius: 12px; border: 1px solid #e7e5e4; background:#fff; padding: 10px 14px; font-size: 14px; }
        .input:focus { outline: none; border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15,118,110,0.15); }
      `}</style>
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
function Row({ k, v, highlight }) {
  return (
    <div className={`flex justify-between border-b border-stone-100 pb-2 ${highlight ? "text-base" : ""}`}>
      <span className="text-slate-500">{k}</span>
      <span className={highlight ? "font-bold text-slate-900" : "font-semibold text-slate-900"}>{v}</span>
    </div>
  );
}
