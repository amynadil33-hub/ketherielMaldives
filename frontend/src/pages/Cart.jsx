import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { formatMVR } from "../lib/api";
import { Trash2, ChevronRight, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { cart, removeFromCart, updateQty, subtotal, island, clearCart } = useStore();
  const nav = useNavigate();
  const deliveryFee = cart.length > 0 ? island.fee : 0;
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <ShoppingBag className="h-12 w-12 mx-auto text-slate-300" />
        <h1 className="font-display text-4xl mt-4">Your cart is empty</h1>
        <p className="text-slate-500 mt-2">Time to browse some treasures.</p>
        <Link to="/shop" className="mt-6 inline-block rounded-full bg-slate-900 text-white px-6 py-3 font-semibold">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <h1 className="font-display text-4xl md:text-5xl">Your cart <span className="text-teal-700">({cart.length})</span></h1>

      <div className="mt-8 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-3">
          {cart.map((c) => (
            <div key={c.key} className="rounded-2xl bg-white border border-stone-200 p-4 flex gap-4" data-testid={`cart-item-${c.id}`}>
              <Link to={`/product/${c.id}`} className="shrink-0">
                <img src={c.main_image_url} alt={c.title} className="h-24 w-24 md:h-28 md:w-28 object-cover rounded-xl" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase tracking-widest text-teal-700 font-semibold">{c.brand}</div>
                <div className="font-semibold text-slate-900 truncate">{c.title}</div>
                {c.variant && <div className="text-xs text-slate-500 mt-0.5">{c.variant}</div>}
                <div className="mt-2 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-stone-200">
                    <button onClick={() => updateQty(c.key, c.qty - 1)} className="px-3 py-1 text-base" data-testid={`cart-dec-${c.id}`}>−</button>
                    <span className="px-2 text-sm font-semibold min-w-6 text-center">{c.qty}</span>
                    <button onClick={() => updateQty(c.key, c.qty + 1)} className="px-3 py-1 text-base" data-testid={`cart-inc-${c.id}`}>+</button>
                  </div>
                  <div className="font-bold">{formatMVR(c.price_mvr * c.qty)}</div>
                </div>
              </div>
              <button onClick={() => removeFromCart(c.key)} className="text-slate-400 hover:text-rose-500 self-start" data-testid={`cart-remove-${c.id}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button onClick={clearCart} className="text-sm text-slate-500 hover:text-rose-500" data-testid="cart-clear">Clear cart</button>
        </div>

        <aside className="md:col-span-4">
          <div className="rounded-2xl bg-white border border-stone-200 p-6">
            <h3 className="font-display text-2xl">Order summary</h3>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{formatMVR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Delivery to {island.island}</span><span className="font-semibold">{formatMVR(deliveryFee)}</span></div>
              <div className="border-t border-stone-200 pt-3 flex justify-between text-base"><span className="font-semibold">Total</span><span className="font-bold text-xl">{formatMVR(total)}</span></div>
            </div>
            <button onClick={() => nav("/checkout")} className="mt-6 w-full rounded-full bg-slate-900 text-white py-3.5 font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-800" data-testid="cart-checkout-button">
              Checkout <ChevronRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">Pre-order items: final price confirmed by admin via WhatsApp after sourcing check.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
