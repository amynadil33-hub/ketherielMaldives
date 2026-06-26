import React from "react";
import OrderTimeline from "../components/OrderTimeline.jsx";
import { useT } from "../lib/i18n.jsx";

export default function HowItWorks() {
  const t = useT();
  return (
    <div>
      <section className="bg-slate-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-amber-300 font-semibold">{t("how.kicker")}</div>
          <h1 className="font-display text-5xl md:text-6xl mt-3">{t("how.title")}</h1>
          <p className="text-slate-300 mt-4 max-w-2xl mx-auto">{t("how.sub")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <OrderTimeline current="sourcing_from_india" />
      </section>

      <section className="bg-stone-100">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20 grid md:grid-cols-3 gap-6">
          {[
            { t: t("how.c1.t"), b: t("how.c1.b") },
            { t: t("how.c2.t"), b: t("how.c2.b") },
            { t: t("how.c3.t"), b: t("how.c3.b") },
          ].map((c) => (
            <div key={c.t} className="rounded-3xl bg-white p-7 border border-stone-200">
              <h3 className="font-display text-2xl">{c.t}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{c.b}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
