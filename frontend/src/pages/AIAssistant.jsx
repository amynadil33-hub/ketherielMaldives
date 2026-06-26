import React, { useEffect, useRef, useState } from "react";
import { api, sessionId } from "../lib/api";
import { useStore } from "../lib/store.jsx";
import { TRENDING_PROMPTS } from "../lib/seedData";
import { Send, Sparkles } from "lucide-react";

const GREETING = "Hi! I'm Raalhu, your shopping concierge for the Maldives. Ask about products, sizes, gifts, delivery, or anything else.";

export default function AIAssistant() {
  const { island } = useStore();
  const [messages, setMessages] = useState([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/chat", { session_id: sessionId, message: msg, context: { island: island.island } });
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, I couldn't reach the server. Try again in a moment." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12 min-h-[80vh] flex flex-col">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-teal-700 font-semibold">Raalhu AI · Claude Sonnet 4.5</div>
        <h1 className="font-display text-5xl md:text-6xl mt-2">Your Maldives concierge</h1>
        <p className="text-slate-500 mt-2 max-w-xl mx-auto">Ask in plain English. I can find products, compare, suggest sizes, explain delivery, and draft sourcing quotes.</p>
      </div>

      <div ref={scrollRef} className="mt-8 flex-1 overflow-y-auto rounded-3xl bg-white border border-stone-200 p-5 md:p-7 space-y-4 max-h-[55vh]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-slate-900 text-white rounded-br-md" : "bg-stone-100 text-slate-800 rounded-bl-md"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-teal-700 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-teal-700 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-teal-700 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {messages.length === 1 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {TRENDING_PROMPTS.map((p) => (
            <button key={p} onClick={() => send(p)} className="text-xs md:text-sm rounded-full border border-stone-200 bg-white hover:border-teal-700 hover:text-teal-700 px-3 py-1.5" data-testid={`ai-prompt-${p.length}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-6 sticky bottom-0">
        <div className="flex items-center gap-2 rounded-full bg-white border border-stone-200 p-1.5 shadow-sm focus-within:border-teal-700">
          <Sparkles className="h-5 w-5 text-amber-500 ml-3" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Raalhu anything…"
            className="flex-1 bg-transparent px-2 py-3 text-base focus:outline-none"
            data-testid="ai-page-input"
          />
          <button type="submit" disabled={!input.trim() || loading} className="h-11 w-11 rounded-full bg-slate-900 text-white grid place-items-center disabled:opacity-40" data-testid="ai-page-send">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">AI suggestions are for shopping help only. Final orders and prices are always confirmed by our admin team.</p>
    </div>
  );
}
