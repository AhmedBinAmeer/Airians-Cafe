import { BadgeCheck, Clock3, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api, getErrorMessage } from "../api/client.js";
import { updateWallet } from "../features/auth/authSlice.js";
import { formatDateTime, formatMoney } from "../utils/dates.js";

export default function OrdersPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState({ walletBalance: user?.walletBalance || 0, walletTransactions: [] });
  const [deposit, setDeposit] = useState(500);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [ordersResponse, walletResponse] = await Promise.all([api.get("/orders/mine"), api.get("/wallet")]);
      setOrders(ordersResponse.data);
      setWallet(walletResponse.data);
      dispatch(updateWallet(walletResponse.data.walletBalance));
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

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h1 className="flex items-center gap-2 text-xl font-black text-navy-950">
          <WalletCards size={22} />
          Student Wallet
        </h1>
        <p className="mt-4 text-3xl font-black text-navy-950">{formatMoney(wallet.walletBalance)}</p>
        <form onSubmit={depositWallet} className="mt-5 grid gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-black text-navy-950">Deposit PKR</span>
            <input
              type="number"
              min="50"
              value={deposit}
              onChange={(event) => setDeposit(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-navy-500"
            />
          </label>
          <button className="h-11 rounded-md bg-saffron px-4 text-sm font-black text-navy-950 hover:bg-amber-300">
            Add balance
          </button>
        </form>
        {message ? <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{message}</div> : null}
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-navy-950">My Orders</h2>
          <button
            type="button"
            onClick={load}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-black text-navy-900 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
        ) : orders.length ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <article key={order._id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-navy-900 px-3 py-1 text-lg font-black tracking-widest text-white">
                        {order.shortCode}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black uppercase text-slate-600">
                        {order.status.replace("_", " ")}
                      </span>
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-800">
                        {order.paymentStatus}
                      </span>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <Clock3 size={16} />
                      {order.orderType === "wave"
                        ? `${order.wave?.name || "Recess wave"} on ${order.waveDate}`
                        : formatDateTime(order.pickupAt)}
                    </p>
                  </div>
                  <p className="text-lg font-black text-navy-950">{formatMoney(order.totalAmount)}</p>
                </div>

                <div className="mt-4 grid gap-2">
                  {order.items.map((item, index) => (
                    <div key={`${order._id}-${index}`} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-bold text-navy-950">
                        {item.quantity} x {item.name}
                        {item.extras?.length ? ` (${item.extras.map((extra) => extra.name).join(", ")})` : ""}
                      </span>
                      <span className="font-black text-navy-800">{formatMoney(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
            <BadgeCheck className="mx-auto text-slate-400" size={34} />
            <p className="mt-3 font-black text-navy-950">No orders yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
