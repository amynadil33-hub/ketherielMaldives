import React from "react";
import OrderTimeline from "../components/OrderTimeline.jsx";

export default function HowItWorks() {
  return (
    <div>
      <section className="bg-slate-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-amber-300 font-semibold">How pre-order works</div>
          <h1 className="font-display text-5xl md:text-6xl mt-3">10 stages. Total transparency.</h1>
          <p className="text-slate-300 mt-4 max-w-2xl mx-auto">From an India shelf to your atoll. Every step is tracked and we'll WhatsApp you at the key moments.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <OrderTimeline current="sourcing_from_india" />
      </section>

      <section className="bg-stone-100">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20 grid md:grid-cols-3 gap-6">
          {[
            { t: "Honest pre-order pricing", b: "Prices on listings are estimates. Once your order is placed, our admin checks suppliers and confirms the final price within hours." },
            { t: "Payment flexibility", b: "Pick from BML, MIB, m-Faisaa, Dhiraagu Pay, or slip upload. High-value items can be split into a deposit + balance." },
            { t: "Island-aware delivery", b: "Each atoll has its own courier partner and fee. Our system adjusts your timeline based on where you are." },
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
