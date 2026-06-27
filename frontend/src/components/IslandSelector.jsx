import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useStore } from "../lib/store.jsx";
import { useT } from "../lib/i18n.jsx";
import { useCatalog } from "../lib/catalog.jsx";
import { MapPin } from "lucide-react";
import { formatMVR } from "../lib/api";

export default function IslandSelector({ open, onClose }) {
  const { island, setIsland } = useStore();
  const { islands } = useCatalog();
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="font-display text-2xl">{t("island.title")}</DialogTitle>
          <p className="text-sm text-slate-500">{t("island.sub")}</p>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-2 pb-4">
          {islands.map((i) => {
            const active = i.island === island.island;
            return (
              <button
                key={i.island}
                onClick={() => { setIsland(i); onClose(); }}
                data-testid={`island-option-${i.island.toLowerCase().replace(/\s|\(|\)/g,'-')}`}
                className={`w-full text-left flex items-center gap-3 rounded-2xl px-4 py-3 my-1 transition-colors ${active ? "bg-teal-50 ring-1 ring-teal-700" : "hover:bg-stone-50"}`}
              >
                <MapPin className={`h-5 w-5 ${active ? "text-teal-700" : "text-slate-400"}`} />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{i.island}</div>
                  <div className="text-xs text-slate-500">{i.atoll} {t("del.atoll")}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-semibold text-slate-900">{formatMVR(i.fee)}</div>
                  <div className="text-slate-500">+{i.min}–{i.max} {t("product.days")}</div>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
