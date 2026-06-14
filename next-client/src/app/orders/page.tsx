// @ts-nocheck
"use client";

import { BadgeCheck, Clock3, MessageSquareHeart, Star, WalletCards, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api, getErrorMessage } from "@/api/client";
import { updateWallet } from "@/features/auth/authSlice";
import { formatDateTime, formatMoney } from "@/utils/dates";
import LoadingScreen from "@/components/LoadingScreen";

export default function OrdersPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState({ walletBalance: user?.walletBalance || 0, walletTransactions: [] });
  const [deposit, setDeposit] = useState(500);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedbackOrder, setFeedbackOrder] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleFeedbackSuccess(updatedOrder) {
    setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
    setFeedbackOrder(null);
  }

  async function load() {
    setLoading(true);
    try {
      if (user?.role === "admin") {
        const { data } = await api.get("/orders/admin/history");
        setOrders(data);
      } else {
        const [ordersResponse, walletResponse] = await Promise.all([api.get("/orders/mine"), api.get("/wallet/balance")]);
        setOrders(ordersResponse.data);
        setWallet(walletResponse.data);
        dispatch(updateWallet(walletResponse.data.walletBalance));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function depositWallet(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/wallet/deposit", { amount: Number(deposit) });
      setWallet(data);
      dispatch(updateWallet(data.walletBalance));
      setMessage(`Wallet updated: ${formatMoney(data.walletBalance)}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (!mounted) return <LoadingScreen text="Loading Orders..." delay={0} />;

  return (
    <div className={`grid gap-6 ${user?.role !== "admin" ? "lg:grid-cols-[340px_1fr]" : ""}`}>
      {user?.role !== "admin" && (
        <section className="rounded-lg border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-5 shadow-soft">
        <h1 className="flex items-center gap-2 text-xl font-black text-navy-950 dark:text-white">
          <WalletCards size={22} />
          Student Wallet
        </h1>
        <p className="mt-4 text-3xl font-black text-navy-950 dark:text-saffron">{formatMoney(wallet.walletBalance)}</p>
        <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Contact admin to add balance</p>
        {message ? <div className="mt-4 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50 p-3 text-sm font-bold">{message}</div> : null}
        {error ? <div className="mt-4 rounded-md bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50 p-3 text-sm font-bold">{error}</div> : null}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-5 shadow-soft">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-navy-950 dark:text-white">My Orders</h2>
          <button
            type="button"
            onClick={load}
            className="rounded-md border border-slate-200 dark:border-navy-700 px-3 py-2 text-sm font-black text-navy-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-navy-800"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <LoadingScreen text="Loading Orders..." delay={0} />
        ) : orders.length ? (
          <div className="space-y-3 animate-fade-in">
            {orders.map((order) => (
              <article key={order._id} className="rounded-lg border border-slate-200 dark:border-navy-800 p-4 bg-slate-50/30 dark:bg-navy-950/20">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-navy-900 px-3 py-1 text-lg font-black tracking-widest text-white">
                        {order.shortCode}
                      </span>
                      <span className="rounded-md bg-slate-100 dark:bg-navy-800 px-2 py-1 text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                        {order.status.replace("_", " ")}
                      </span>
                      {order.paymentStatus !== "pending" && (
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-800">
                          {order.paymentStatus}
                        </span>
                      )}
                      {user?.role === "admin" && (
                        <span className="rounded-md bg-purple-50 px-2 py-1 text-xs font-black text-purple-800">
                          {order.customerName || order.customer?.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <Clock3 size={16} />
                      {new Date(order.pickupAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <p className="text-lg font-black text-navy-950 dark:text-white">{formatMoney(order.totalAmount)}</p>
                </div>

                <div className="mt-4 grid gap-2">
                  {order.items.map((item, index) => (
                    <div key={`${order._id}-${index}`} className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-navy-950/60 px-3 py-2 text-sm">
                      <span className="font-bold text-navy-950 dark:text-slate-100">
                        {item.quantity} x {item.name}
                      </span>
                      <span className="font-black text-navy-800 dark:text-saffron">{formatMoney(item.lineTotal)}</span>
                    </div>
                  ))}
                  {order.notes && (
                    <div className="mt-2 text-sm font-bold text-amber-600">
                      Notes: {order.notes}
                    </div>
                  )}
                </div>

                {user?.role !== "admin" && order.status === "picked_up" && !order.feedback?.rating && (
                  <button
                    type="button"
                    onClick={() => setFeedbackOrder(order)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2.5 text-sm font-black text-navy-950 shadow-md transition-all hover:shadow-lg hover:brightness-105"
                  >
                    <MessageSquareHeart size={18} />
                    Leave Feedback & Rating
                  </button>
                )}

                {order.feedback?.rating && (
                  <div className="mt-4 flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 px-3 py-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          className={s <= order.feedback.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                        />
                      ))}
                    </div>
                    {order.feedback.comment && (
                      <p className="ml-2 truncate text-xs font-semibold text-slate-600 dark:text-slate-300">"{order.feedback.comment}"</p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-navy-800 p-10 text-center bg-slate-50/50 dark:bg-navy-950/30">
            <BadgeCheck className="mx-auto text-slate-400 dark:text-slate-500" size={34} />
            <p className="mt-3 font-black text-navy-950 dark:text-white">No orders yet</p>
          </div>
        )}
      </section>
      {feedbackOrder && (
        <FeedbackModal
          order={feedbackOrder}
          onClose={() => setFeedbackOrder(null)}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  );
}

function FeedbackModal({ order, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post(`/orders/${order._id}/feedback`, { rating, comment: comment.trim() || undefined });
      onSuccess(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800 p-6 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xl font-black text-navy-950 dark:text-white">Rate Your Order</h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>
        <p className="mb-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
          Order <span className="rounded bg-navy-950 px-2 py-0.5 font-black tracking-widest text-white">{order.shortCode}</span> — {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
        </p>

        {error && <div className="mb-4 rounded-md bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50 p-3 text-sm font-bold">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-6 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                className="group rounded-lg p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={38}
                  className={`transition-colors ${
                    s <= (hover || rating)
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                      : "text-slate-300 group-hover:text-slate-400"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="mb-4 text-center text-sm font-black text-navy-950 dark:text-white">
            {rating === 0 ? "Tap a star" : ["😞 Poor", "😐 Fair", "🙂 Good", "😊 Great", "🤩 Amazing!"][rating - 1]}
          </p>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment (optional)..."
            rows="3"
            className="w-full resize-none rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 px-4 py-3 text-sm outline-none focus:border-navy-500 dark:focus:border-navy-600 text-slate-900 dark:text-white"
          />

          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-navy-800">
              Skip
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="rounded-md bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-2 text-sm font-black text-navy-950 shadow hover:brightness-105 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Submit Rating"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
