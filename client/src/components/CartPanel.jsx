import { CalendarClock, CreditCard, ReceiptText, Trash2, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../api/client.js";
import { updateWallet } from "../features/auth/authSlice.js";
import {
  clearCart,
  removeFromCart,
  selectCartTotal,
  setOrderType,
  setPaymentMethod,
  setPickupAt,
  updateQuantity
} from "../features/cart/cartSlice.js";
import { setSelectedWave, setWaveDate } from "../features/cart/waveSlice.js";
import { datetimeLocalAfter, formatMoney, todayDate } from "../utils/dates.js";

export default function CartPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((state) => state.cart);
  const wave = useSelector((state) => state.wave);
  const { user } = useSelector((state) => state.auth);
  const total = useSelector(selectCartTotal);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedWave = useMemo(
    () => wave.waves.find((entry) => entry._id === wave.selectedWaveId),
    [wave.selectedWaveId, wave.waves]
  );

  async function checkout() {
    setError("");
    setMessage("");

    if (!user) {
      navigate("/auth");
      return;
    }

    if (!cart.items.length) {
      setError("Add at least one item before checkout");
      return;
    }

    if (cart.orderType === "standard" && !cart.pickupAt) {
      dispatch(setPickupAt(datetimeLocalAfter(20)));
      setError("Choose a pickup time for the standard order");
      return;
    }

    if (cart.orderType === "wave" && !wave.selectedWaveId) {
      setError("Choose a recess wave");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        orderType: cart.orderType,
        pickupAt: cart.pickupAt,
        waveId: wave.selectedWaveId,
        waveDate: wave.waveDate,
        paymentMethod: cart.paymentMethod,
        items: cart.items.map((item) => ({
          menuItem: item.menuItem,
          quantity: item.quantity,
          extras: item.extras
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
    <aside className="sticky top-24 rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-navy-950">
            <ReceiptText size={20} />
            Cart
          </h2>
          <span className="rounded-md bg-navy-50 px-2 py-1 text-xs font-black text-navy-800">
            {cart.items.length} lines
          </span>
        </div>
      </div>

      <div className="max-h-[38vh] space-y-3 overflow-y-auto p-4 scrollbar-thin">
        {cart.items.length ? (
          cart.items.map((item) => (
            <div key={item.lineId} className="rounded-md border border-slate-200 p-3">
              <div className="flex gap-3">
                <img src={item.imageUrl} alt={item.name} className="h-14 w-14 rounded-md object-cover food-image" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-black text-navy-950">{item.name}</p>
                    <button
                      type="button"
                      onClick={() => dispatch(removeFromCart(item.lineId))}
                      className="grid h-8 w-8 place-items-center rounded-md text-coral hover:bg-red-50"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {item.extras.length ? (
                    <p className="mt-1 text-xs text-slate-500">{item.extras.join(", ")}</p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        dispatch(updateQuantity({ lineId: item.lineId, quantity: Number(event.target.value) }))
                      }
                      className="h-9 w-16 rounded-md border border-slate-200 px-2 text-sm font-bold"
                    />
                    <span className="text-sm font-black text-navy-800">
                      {formatMoney((item.unitPrice + item.extrasTotal) * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500">
            Your cart is empty
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-slate-200 p-4">
        <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => dispatch(setOrderType("standard"))}
            className={`rounded-md px-3 py-2 text-sm font-black ${
              cart.orderType === "standard" ? "bg-white text-navy-950 shadow" : "text-slate-600"
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => dispatch(setOrderType("wave"))}
            className={`rounded-md px-3 py-2 text-sm font-black ${
              cart.orderType === "wave" ? "bg-white text-navy-950 shadow" : "text-slate-600"
            }`}
          >
            Recess wave
          </button>
        </div>

        {cart.orderType === "standard" ? (
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-black text-navy-950">
              <CalendarClock size={16} />
              Pickup time
            </span>
            <input
              type="datetime-local"
              min={datetimeLocalAfter(10)}
              value={cart.pickupAt}
              onChange={(event) => dispatch(setPickupAt(event.target.value))}
              className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-navy-500"
            />
          </label>
        ) : (
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-black text-navy-950">Wave date</span>
              <input
                type="date"
                min={todayDate()}
                value={wave.waveDate}
                onChange={(event) => dispatch(setWaveDate(event.target.value))}
                className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-navy-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-black text-navy-950">Recess wave</span>
              <select
                value={wave.selectedWaveId}
                onChange={(event) => dispatch(setSelectedWave(event.target.value))}
                className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-navy-500"
              >
                {wave.waves.map((entry) => (
                  <option key={entry._id} value={entry._id}>
                    {entry.name} {entry.startTime}-{entry.endTime}
                  </option>
                ))}
              </select>
            </label>
            {selectedWave ? (
              <div className="rounded-md bg-navy-50 p-3 text-sm text-navy-800">
                <b>Cut-off:</b> {selectedWave.cutoffTime} | <b>Capacity:</b> {selectedWave.maxItems} items
              </div>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => dispatch(setPaymentMethod("wallet"))}
            className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-black ${
              cart.paymentMethod === "wallet"
                ? "border-mint bg-emerald-50 text-navy-950"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <WalletCards size={16} />
            Wallet
          </button>
          <button
            type="button"
            onClick={() => dispatch(setPaymentMethod("cash"))}
            className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-black ${
              cart.paymentMethod === "cash"
                ? "border-saffron bg-amber-50 text-navy-950"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <CreditCard size={16} />
            Cash
          </button>
        </div>

        <div className="flex items-center justify-between text-lg font-black text-navy-950">
          <span>Total</span>
          <span>{formatMoney(total)}</span>
        </div>

        {message ? <div className="rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{message}</div> : null}
        {error ? <div className="rounded-md bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}

        <button
          type="button"
          onClick={checkout}
          disabled={submitting || !cart.items.length}
          className="h-12 w-full rounded-md bg-navy-900 px-4 text-sm font-black text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "Placing order..." : "Place order"}
        </button>
      </div>
    </aside>
  );
}
