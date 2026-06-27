import React from "react";
import * as Lucide from "lucide-react";
import { FULFILLMENT_STAGES } from "../lib/seedData";
import { useT } from "../lib/i18n.jsx";

export default function OrderTimeline({ current = "order_placed", compact = false }) {
  const t = useT();
  const idx = FULFILLMENT_STAGES.findIndex((s) => s.key === current);
  return (
    <ol className={`relative ${compact ? "space-y-3" : "space-y-5"}`}>
      {FULFILLMENT_STAGES.map((stage, i) => {
        const Icon = Lucide[stage.icon] || Lucide.Circle;
        const done = i <= idx;
        const isCurrent = i === idx;
        return (
          <li key={stage.key} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`h-9 w-9 rounded-full grid place-items-center transition-colors ${done ? (isCurrent ? "bg-amber-500 text-white animate-pulse" : "bg-teal-700 text-white") : "bg-stone-200 text-slate-400"}`}>
                <Icon className="h-4 w-4" />
              </div>
              {i < FULFILLMENT_STAGES.length - 1 && (
                <div className={`flex-1 w-px ${done ? "bg-teal-700" : "bg-stone-200"}`} style={{ minHeight: compact ? 14 : 28 }} />
              )}
            </div>
            <div className="pb-2 flex-1">
              <div className={`font-semibold text-sm ${done ? "text-slate-900" : "text-slate-400"}`}>{t(`stage.${stage.key}`)}</div>
              {isCurrent && <div className="text-xs text-amber-700">{t("stage.inProgress")}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
