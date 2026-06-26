import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, formatMVR, waLink } from "../lib/api";
import { Search, Loader2, MessageCircle } from "lucide-react";
import OrderTimeline from "../components/OrderTimeline.jsx";

export default function TrackOrder() {
  const { orderNumber } = useParams();
  const nav = useNavigate();
  const [num, setNum] = useState(orderNumber || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async (n) => {
    if (!n) return;
    setLoading(true); setError("");
    try {
      const { data } = await api.get(`/orders/${n}`);
      setOrder(data);
    } catch (e) {
      setOrder(null);
      setError("Order not found. Double-check the number.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (orderNumber) lookup(orderNumber);
  }, [orderNumber]);

  const submit = (e) => {
    e.preventDefault();
    nav(`/track/${num.trim()}`);
    lookup(num.trim());
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-teal-700 font-semibold">Order tracking</div>
        <h1 className="font-display text-4xl md:text-5xl mt-2">Where's my package?</h1>
        <p className="text-slate-500 mt-2">Enter your order number to see real-time status across 10 stages.</p>
      </div>

      <form onSubmit={submit} className="mt-8 flex gap-2 max-w-xl mx-auto">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="MV251104ABCDE" className="w-full rounded-full border border-stone-200 px-10 py-3 text-sm bg-white" data-testid="track-input" />
        </div>
        <button type="submit" className="rounded-full bg-slate-900 text-white px-6 font-semibold inline-flex items-center gap-2" data-testid="track-submit">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
        </button>
      </form>

      {error && <p className="text-center text-sm text-rose-500 mt-4">{error}</p>}

      {order && (
        <div className="mt-10 rounded-2xl bg-white border border-stone-200 p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Order</div>
              <div className="font-display text-3xl">{order.order_number}</div>
              <div className="text-sm text-slate-500 mt-1">Placed for {order.customer_name} · {order.island}</div>
            </div>
            <a href={waLink(`Hi Raalhu, please update me on order ${order.order_number}.`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white px-5 py-2.5 text-sm font-semibold hover:bg-emerald-600" data-testid="track-whatsapp">
              <MessageCircle className="h-4 w-4" /> Message us
            </a>
          </div>
          <div className="mt-8">
            <OrderTimeline current={order.fulfillment_status} />
          </div>
          <div className="mt-8 grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-stone-100 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Estimated delivery</div>
              <div className="font-semibold mt-1">{order.estimated_delivery_min_days}–{order.estimated_delivery_max_days} days</div>
            </div>
            <div className="rounded-xl bg-stone-100 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Total</div>
              <div className="font-bold text-lg mt-1">{formatMVR(order.total_mvr)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
