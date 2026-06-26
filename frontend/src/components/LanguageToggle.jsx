import React from "react";
import { useI18n } from "../lib/i18n.jsx";
import { Globe } from "lucide-react";

export default function LanguageToggle({ compact = false, className = "" }) {
  const { lang, setLang } = useI18n();
  const next = lang === "en" ? "dv" : "en";
  const label = lang === "en" ? "ދިވެހި" : "English";

  return (
    <button
      onClick={() => setLang(next)}
      className={`inline-flex items-center gap-1.5 rounded-full border border-stone-200 hover:border-teal-700 px-3 py-1.5 text-xs font-semibold transition-colors ${className}`}
      data-testid="language-toggle"
      aria-label="Switch language"
    >
      <Globe className="h-3.5 w-3.5" />
      <span className={lang === "en" ? "font-thaana text-sm" : ""}>{label}</span>
    </button>
  );
}
