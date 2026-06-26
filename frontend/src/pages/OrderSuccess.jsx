import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatMVR, waLink } from "../lib/api";
import { CheckCircle2, MessageCircle, Copy, MapPin, Loader2 } from "lucide-react";
import OrderTimeline from "../components/OrderTimeline.jsx";
import { toast } from "sonner";

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get(`/orders/${orderNumber}`).then(({ data }) => {
      if (alive) setOrder(data);
    }).catch(() => {}).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [orderNumber]);

  if (loading) return <div className="py-24 text-center"><Loader2 className="h-6 w-6 mx-auto animate-spin text-teal-700" /></div>;
  if (!order) return <div className="py-24 text-center text-slate-500">Order not found.</div>;

  const copyOrderNum = () => { navigator.clipboard.writeText(order.order_number); toast.success("Copied"); };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full gradient-ocean text-white grid place-items-center">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl mt-4">Order placed!</h1>
        <p className="text-slate-500 mt-2">We've sent a confirmation to {order.customer_phone}. Admin will confirm sourcing on WhatsApp shortly.</p>
        <div className="mt-5 inline-flex items-center gap-2 bg-stone-100 rounded-full px-4 py-2 text-sm">
          <span className="text-slate-500">Order #</span>
          <span className="font-bold text-slate-900">{order.order_number}</span>
          <button onClick={copyOrderNum} aria-label="Copy"><Copy className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mt-10 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-7 rounded-2xl bg-white border border-stone-200 p-6">
          <h3 className="font-display text-2xl">Tracking timeline</h3>
          <p className="text-sm text-slate-500 mt-1">Estimated delivery <span className="font-semibold text-slate-900">{order.estimated_delivery_min_days}–{order.estimated_delivery_max_days} days</span> to {order.island}.</p>
          <div className="mt-5">
            <OrderTimeline current={order.fulfillment_status} />
          </div>
        </div>
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl bg-white border border-stone-200 p-6">
            <h3 className="font-display text-2xl">Summary</h3>
            <div className="mt-4 space-y-1 text-sm">
              {(order.items || []).map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span className="truncate pr-2"><span className="font-semibold">{it.quantity}×</span> {it.title}</span>
                  <span className="font-semibold">{formatMVR(it.price_mvr * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-200 my-4" />
            <div className="space-y-1 text-sm">
              <Row label="Subtotal" value={formatMVR(order.subtotal_mvr)} />
              <Row label="Delivery" value={formatMVR(order.delivery_fee_mvr)} />
              <Row label="Total" value={formatMVR(order.total_mvr)} bold />
            </div>
            <div className="mt-4 text-sm flex items-start gap-2 text-slate-600">
              <MapPin className="h-4 w-4 text-teal-700 mt-0.5" />
              <span>{order.address_line}, {order.island} ({order.atoll})</span>
            </div>
          </div>
          <a href={waLink(`Hi Raalhu, I just placed order ${order.order_number}.`)} target="_blank" rel="noreferrer" className="block w-full rounded-full bg-emerald-500 text-white text-center py-3 font-semibold hover:bg-emerald-600 inline-flex items-center justify-center gap-2" data-testid="order-success-whatsapp">
            <MessageCircle className="h-4 w-4" /> WhatsApp us about this order
          </a>
          <Link to={`/track/${order.order_number}`} className="block w-full rounded-full border border-slate-900 text-slate-900 text-center py-3 font-semibold hover:bg-slate-900 hover:text-white" data-testid="order-success-track">Track this order</Link>
          <Link to="/shop" className="block text-center text-sm text-slate-500 hover:text-slate-900">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between ${bold ? "border-t border-stone-200 pt-2 text-base" : ""}`}>
      <span className="text-slate-500">{label}</span>
      <span className={bold ? "font-bold text-xl" : "font-semibold"}>{value}</span>
    </div>
  );
}
