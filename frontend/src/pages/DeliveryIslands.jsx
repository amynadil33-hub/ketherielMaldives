import React from "react";
import { useCatalog } from "../lib/catalog.jsx";
import { formatMVR } from "../lib/api";
import { useT } from "../lib/i18n.jsx";
import { MapPin, Clock } from "lucide-react";

export default function DeliveryIslands() {
  const t = useT();
  const { islands } = useCatalog();
  const byAtoll = islands.reduce((acc, i) => {
    acc[i.atoll] = acc[i.atoll] || [];
    acc[i.atoll].push(i);
    return acc;
  }, {});
  return (
    <div>
      <section className="bg-slate-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-xs uppercase tracking-[0.3em] text-teal-300 font-semibold">{t("del.kicker")}</div>
          <h1 className="font-display text-5xl md:text-6xl mt-3 max-w-3xl">{t("del.title")}</h1>
          <p className="text-slate-300 mt-4 max-w-2xl">{t("del.sub")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(byAtoll).map(([atoll, islands]) => (
            <div key={atoll} className="rounded-3xl border border-stone-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-700" />
                <h3 className="font-display text-2xl">{atoll} {t("del.atoll")}</h3>
              </div>
              <div className="mt-4 divide-y divide-stone-100">
                {islands.map((i) => (
                  <div key={i.island} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <div className="font-semibold text-slate-900">{i.island}</div>
                      <div className="text-xs text-slate-500">{i.courier}</div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" /> +{i.min}–{i.max} {t("product.days").slice(0,1)}</div>
                      <div className="font-semibold">{formatMVR(i.fee)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-500 text-center max-w-2xl mx-auto">{t("del.dontSee")}</p>
      </section>
    </div>
  );
}
