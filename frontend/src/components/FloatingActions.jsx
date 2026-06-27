import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, Sparkles } from "lucide-react";
import { waLink } from "../lib/api";
import { useT } from "../lib/i18n.jsx";
import AIChatPanel from "./AIChatPanel.jsx";

export default function FloatingActions() {
  const loc = useLocation();
  const t = useT();
  const [aiOpen, setAiOpen] = useState(false);
  if (loc.pathname.startsWith("/admin")) return null;
  if (loc.pathname === "/ai") return null; // already on AI page

  return (
    <>
      <div className="fixed right-4 bottom-24 md:bottom-6 z-30 flex flex-col gap-3 items-end">
        <a
          href={waLink("Hi Ketheriel Maldives, I need help with my order.")}
          target="_blank"
          rel="noreferrer"
          className="h-12 w-12 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="WhatsApp support"
          data-testid="floating-whatsapp-button"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
        <button
          onClick={() => setAiOpen(true)}
          className="group inline-flex items-center gap-2 rounded-full gradient-ocean text-white pl-4 pr-5 h-12 shadow-lg shadow-teal-900/30 hover:scale-105 transition-transform"
          data-testid="floating-ai-button"
        >
          <Sparkles className="h-5 w-5 text-amber-300" />
          <span className="text-sm font-semibold">{t("ai.fab")}</span>
        </button>
      </div>
      <AIChatPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}
