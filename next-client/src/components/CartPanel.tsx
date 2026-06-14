// @ts-nocheck
"use client";

import { CalendarClock, CreditCard, ReceiptText, Trash2, WalletCards, Smartphone, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from 'next/navigation';
import { api, getErrorMessage } from "@/api/client";
import { updateWallet } from "@/features/auth/authSlice";
import {
  clearCart,
  removeFromCart,
  selectCartTotal,
  setPaymentMethod,
  setPickupAt,
  updateQuantity,
  setCartOpen,
  setNotes
} from "@/features/cart/cartSlice";
import { datetimeLocalAfter, formatMoney } from "@/utils/dates";

export default function CartPanel() {
  const dispatch = useDispatch();
  const router = useRouter();
  const cart = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const total = useSelector(selectCartTotal);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ordersClosed, setOrdersClosed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await api.get("/settings");
        setOrdersClosed(data.ordersClosed);
      } catch (err) {}
    }
    loadSettings();
  }, [cart.isOpen]);

  async function checkout() {
    setError("");
    setMessage("");

    if (!user) {
      dispatch(setCartOpen(false));
      router.push("/auth");
      return;
    }

    if (!cart.items.length) {
      setError("Add at least one item before checkout");
      return;
    }

    if (!cart.pickupAt) {
      dispatch(setPickupAt(datetimeLocalAfter(20)));
      setError("Choose a pickup time for the order");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        pickupAt: cart.pickupAt,
        paymentMethod: cart.paymentMethod,
        notes: cart.notes,
        items: cart.items.map((item) => ({
          menuItem: item.menuItem,
          quantity: item.quantity
        }))
      };

      const { data } = await api.post("/orders", payload);
      if (cart.paymentMethod === "wallet") {
        dispatch(updateWallet(Math.max(0, (user.walletBalance || 0) - total)));
      }
      dispatch(clearCart());
      setMessage(`Order confirmed. Pickup code ${data.shortCode}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      {cart.isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-sm transition-opacity" 
          onClick={() => dispatch(setCartOpen(false))} 
        />
      )}

      {/* Drawer */}
      <aside 
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white dark:bg-navy-900 border-l border-slate-200 dark:border-navy-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          cart.isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-navy-800 p-4">
          <h2 className="flex items-center gap-2 text-lg font-black text-navy-950 dark:text-white">
            <ReceiptText size={20} />
            Cart
          </h2>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-navy-50 dark:bg-navy-950 px-2 py-1 text-xs font-black text-navy-800 dark:text-saffron">
              {cart.items.length} lines
            </span>
            <button 
              type="button" 
              onClick={() => dispatch(setCartOpen(false))}
              className="grid h-8 w-8 place-items-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {cart.items.length ? (
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.lineId} className="rounded-md border border-slate-200 dark:border-navy-800 p-3 bg-slate-50/50 dark:bg-navy-950/40">
                  <div className="flex gap-3">
                    <img src={item.imageUrl} alt={item.name} className="h-14 w-14 rounded-md object-cover food-image" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-black text-navy-950 dark:text-white">{item.name}</p>
                        <button
                          type="button"
                          onClick={() => dispatch(removeFromCart(item.lineId))}
                          className="grid h-8 w-8 place-items-center rounded-md text-coral hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            dispatch(updateQuantity({ lineId: item.lineId, quantity: Number(event.target.value) }))
                          }
                          className="h-9 w-16 rounded-md border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 px-2 text-sm font-bold text-slate-900 dark:text-white"
                        />
                        <span className="text-sm font-black text-navy-800 dark:text-saffron">
                          {formatMoney(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 dark:border-navy-800 p-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              Your cart is empty
            </div>
          )}
        </div>

        <div className="space-y-4 border-t border-slate-200 dark:border-navy-800 p-4 bg-white dark:bg-navy-900">
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-black text-navy-950 dark:text-white">
              <CalendarClock size={16} />
              Pickup time
            </span>
            <input
              type="datetime-local"
              min={datetimeLocalAfter(10)}
              value={cart.pickupAt}
              onChange={(event) => dispatch(setPickupAt(event.target.value))}
              className="h-11 w-full rounded-md border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 px-3 text-sm outline-none focus:border-navy-500 dark:focus:border-navy-600 text-slate-900 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-black text-navy-950 dark:text-white">
              Order Notes for Cafe
            </span>
            <textarea
              value={cart.notes}
              onChange={(event) => dispatch(setNotes(event.target.value))}
              placeholder="e.g. Please make it extra spicy, less sugar..."
              rows={2}
              className="w-full rounded-md border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 p-3 text-sm outline-none focus:border-navy-500 dark:focus:border-navy-600 text-slate-900 dark:text-white resize-none"
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => dispatch(setPaymentMethod("wallet"))}
              className={`inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-md border px-1 py-2 text-xs font-black ${
                cart.paymentMethod === "wallet"
                  ? "border-mint bg-emerald-50 dark:bg-emerald-950/20 text-navy-950 dark:text-emerald-300"
                  : "border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              <WalletCards size={16} />
              Wallet
            </button>
            <button
              type="button"
              onClick={() => dispatch(setPaymentMethod("cash"))}
              className={`inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-md border px-1 py-2 text-xs font-black ${
                cart.paymentMethod === "cash"
                  ? "border-saffron bg-amber-50 dark:bg-amber-950/20 text-navy-950 dark:text-saffron"
                  : "border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              <CreditCard size={16} />
              Cash
            </button>

          </div>

          <div className="flex items-center justify-between text-lg font-black text-navy-950 dark:text-white">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>

          {message ? <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50 p-3 text-sm font-bold">{message}</div> : null}
          {error ? <div className="rounded-md bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50 p-3 text-sm font-bold">{error}</div> : null}
          {ordersClosed && !message ? <div className="rounded-md bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50 p-3 text-sm font-bold">Orders are currently closed.</div> : null}

          {isMounted && user ? (
            <button
              type="button"
              onClick={checkout}
              disabled={submitting || ordersClosed || !cart.items.length}
              className="h-12 w-full rounded-md bg-gradient-to-r from-amber-400 to-orange-400 px-4 text-sm font-black text-navy-950 shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Placing order..." : "Place order"}
            </button>
          ) : isMounted ? (
            <button
              type="button"
              onClick={() => {
                dispatch(setCartOpen(false));
                router.push("/auth");
              }}
              className="h-12 w-full rounded-md bg-navy-900 dark:bg-navy-950 border border-slate-700 dark:border-navy-700 px-4 text-sm font-black text-white shadow-md transition hover:bg-navy-950 dark:hover:bg-navy-800"
            >
              Login to order
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="h-12 w-full rounded-md bg-navy-900 px-4 text-sm font-black text-white shadow-md opacity-50"
            >
              Loading...
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
