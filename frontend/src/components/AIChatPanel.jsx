import React, { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { api, sessionId } from "../lib/api";
import { useStore } from "../lib/store.jsx";
import { TRENDING_PROMPTS } from "../lib/seedData";

const GREETING = "Hey! I'm Raalhu, your shopping concierge for Maldives. Ask me anything — I can find products, suggest gifts, explain delivery, or draft a custom sourcing quote.";

export default function AIChatPanel({ open, onClose }) {
  const { island } = useStore();
  const [messages, setMessages] = useState([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages, open]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/chat", { session_id: sessionId, message: msg, context: { island: island.island } });
      setMessages((m) => [...m, { role: "assistant", text: data.reply || "(no reply)" }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, I couldn't reach the server. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:w-[420px] md:mr-6 md:rounded-3xl bg-white shadow-2xl flex flex-col h-[88vh] md:h-[640px] rounded-t-3xl overflow-hidden" data-testid="ai-chat-panel">
        {/* header */}
        <div className="gradient-ocean text-white px-5 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/15 grid place-items-center">
            <Sparkles className="h-5 w-5 text-amber-300" />
          </div>
          <div className="flex-1">
            <div className="font-display text-xl leading-none">Raalhu AI</div>
            <div className="text-xs text-teal-100">Your Maldives shopping concierge</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/10 grid place-items-center hover:bg-white/20" aria-label="Close" data-testid="ai-chat-close"><X className="h-4 w-4" /></button>
        </div>

        {/* messages */}
        <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-slate-900 text-white rounded-br-md" : "bg-white border border-stone-200 text-slate-800 rounded-bl-md"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-teal-700 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-teal-700 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-teal-700 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {messages.length === 1 && (
            <div className="pt-2">
              <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">Try asking</div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_PROMPTS.map((p) => (
                  <button key={p} onClick={() => send(p)} className="text-xs bg-white border border-stone-200 hover:border-teal-700 hover:text-teal-700 rounded-full px-3 py-1.5" data-testid={`ai-suggested-prompt-${p.length}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* input */}
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-stone-200 p-3 bg-white">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about shopping…"
              className="flex-1 rounded-full bg-stone-100 px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-700"
              data-testid="ai-chat-input"
            />
            <button type="submit" disabled={!input.trim() || loading} className="h-11 w-11 rounded-full bg-slate-900 text-white grid place-items-center disabled:opacity-40" data-testid="ai-chat-send">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
