import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  CookingPot,
  Eye,
  EyeOff,
  PackageCheck,
  SearchCheck,
  TimerReset
} from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, getErrorMessage } from "../api/client.js";
import { formatDateTime, formatMoney, todayDate } from "../utils/dates.js";

const statuses = ["placed", "preparing", "ready", "picked_up", "cancelled"];

function statusClass(status) {
  const map = {
    placed: "bg-blue-50 text-blue-800",
    preparing: "bg-amber-50 text-amber-800",
    ready: "bg-emerald-50 text-emerald-800",
    picked_up: "bg-slate-100 text-slate-700",
    cancelled: "bg-red-50 text-red-700"
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

export default function AdminPage() {
  const [view, setView] = useState("timeline");
  const [date, setDate] = useState(todayDate());
  const [waves, setWaves] = useState([]);
  const [selectedWave, setSelectedWave] = useState("all");
  const [timelineOrders, setTimelineOrders] = useState([]);
  const [batchSummary, setBatchSummary] = useState([]);
  const [batchOrders, setBatchOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [quickCode, setQuickCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadKitchen() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/orders/admin", {
        params: {
          view,
          date,
          waveId: selectedWave === "all" ? undefined : selectedWave
        }
      });

      if (view === "batch") {
        setBatchSummary(data.summary || []);
        setBatchOrders(data.orders || []);
      } else {
        setTimelineOrders(data.orders || []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminData() {
    try {
      const [wavesResponse, menuResponse, analyticsResponse] = await Promise.all([
        api.get("/waves/admin/all"),
        api.get("/menu"),
        api.get("/admin/analytics/waves")
      ]);
      setWaves(wavesResponse.data);
      setMenu(menuResponse.data.items);
      setAnalytics(analyticsResponse.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    loadKitchen();
  }, [view, date, selectedWave]);

  async function quickFulfill(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/orders/quick-fulfill", { code: quickCode });
      setQuickCode("");
      setMessage(`Order ${data.shortCode} marked picked up`);
      await loadKitchen();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateOrderStatus(orderId, status) {
    setError("");
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      await loadKitchen();
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function toggleStock(item) {
    setError("");
    try {
      const { data } = await api.patch(`/menu/${item._id}/toggle-stock`, { isInStock: !item.isInStock });
      setMenu((current) => current.map((entry) => (entry._id === item._id ? data : entry)));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const activeWave = waves.find((wave) => wave._id === selectedWave);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-navy-50 px-3 py-2 text-sm font-black text-navy-800">
                <CookingPot size={17} />
                Kitchen Command
              </div>
              <h1 className="mt-3 text-3xl font-black text-navy-950">Admin Dashboard</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-11 rounded-md border border-slate-200 px-3 text-sm font-bold outline-none focus:border-navy-500"
              />
              <button
                type="button"
                onClick={loadKitchen}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-black text-navy-900 hover:bg-slate-50"
              >
                <TimerReset size={17} />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-2 rounded-md bg-slate-100 p-1 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setView("timeline")}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-black ${
                view === "timeline" ? "bg-white text-navy-950 shadow" : "text-slate-600"
              }`}
            >
              <ClipboardList size={17} />
              Timeline View
            </button>
            <button
              type="button"
              onClick={() => setView("batch")}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-black ${
                view === "batch" ? "bg-white text-navy-950 shadow" : "text-slate-600"
              }`}
            >
              <PackageCheck size={17} />
              Batch Summary
            </button>
          </div>

          {view === "batch" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-[260px_1fr]">
              <select
                value={selectedWave}
                onChange={(event) => setSelectedWave(event.target.value)}
                className="h-11 rounded-md border border-slate-200 px-3 text-sm font-bold outline-none focus:border-navy-500"
              >
                <option value="all">All recess waves</option>
                {waves.map((wave) => (
                  <option key={wave._id} value={wave._id}>
                    {wave.name}
                  </option>
                ))}
              </select>
              {activeWave ? (
                <div className="rounded-md bg-navy-50 px-3 py-2 text-sm font-bold text-navy-800">
                  {activeWave.startTime}-{activeWave.endTime} | Cut-off {activeWave.cutoffTime} | {activeWave.maxItems} item cap
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <form onSubmit={quickFulfill} className="rounded-lg bg-navy-950 p-5 text-white shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <SearchCheck size={20} className="text-saffron" />
            Quick Entry
          </h2>
          <div className="mt-5 flex gap-2">
            <input
              value={quickCode}
              onChange={(event) => setQuickCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              placeholder="4-digit code"
              className="h-12 min-w-0 flex-1 rounded-md border border-white/10 bg-white px-3 text-center text-xl font-black tracking-[0.35em] text-navy-950 outline-none focus:border-saffron"
            />
            <button className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-saffron text-navy-950 hover:bg-amber-300">
              <CheckCircle2 size={22} />
            </button>
          </div>
          {message ? <div className="mt-4 rounded-md bg-emerald-500/15 p-3 text-sm font-bold text-emerald-100">{message}</div> : null}
          {error ? <div className="mt-4 rounded-md bg-red-500/15 p-3 text-sm font-bold text-red-100">{error}</div> : null}
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        {view === "timeline" ? (
          <TimelineView loading={loading} orders={timelineOrders} onStatus={updateOrderStatus} />
        ) : (
          <BatchView loading={loading} summary={batchSummary} orders={batchOrders} onStatus={updateOrderStatus} />
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_390px]">
        <InventoryPanel menu={menu} onToggle={toggleStock} />
        <AnalyticsPanel analytics={analytics} />
      </section>
    </div>
  );
}

function TimelineView({ loading, orders, onStatus }) {
  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-slate-100" />;

  return (
    <div>
      <h2 className="mb-4 text-xl font-black text-navy-950">Standard Orders</h2>
      {orders.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-3 py-2">Pickup</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="bg-slate-50">
                  <td className="rounded-l-md px-3 py-3 font-bold text-navy-950">{formatDateTime(order.pickupAt)}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-navy-950 px-3 py-1 font-black tracking-widest text-white">
                      {order.shortCode}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-black text-navy-950">{order.customerName}</p>
                    <p className="text-xs text-slate-500">{order.customerPhone}</p>
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-slate-700">
                    {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                  </td>
                  <td className="px-3 py-3 font-black text-navy-950">{formatMoney(order.totalAmount)}</td>
                  <td className="rounded-r-md px-3 py-3">
                    <select
                      value={order.status}
                      onChange={(event) => onStatus(order._id, event.target.value)}
                      className={`h-10 rounded-md border-0 px-2 text-sm font-black ${statusClass(order.status)}`}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState label="No standard orders for this date" />
      )}
    </div>
  );
}

function BatchView({ loading, summary, orders, onStatus }) {
  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-slate-100" />;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <div>
        <h2 className="mb-4 text-xl font-black text-navy-950">Batch Totals</h2>
        {summary.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="text-xs uppercase text-slate-500">
                  <th className="px-3 py-2">Wave</th>
                  <th className="px-3 py-2">Menu item</th>
                  <th className="px-3 py-2">Extras</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row, index) => (
                  <tr key={`${row._id.name}-${index}`} className="bg-slate-50">
                    <td className="rounded-l-md px-3 py-3 font-black text-navy-950">{row.wave.name}</td>
                    <td className="px-3 py-3 font-bold text-slate-800">{row._id.name}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{row._id.extras?.join(", ") || "None"}</td>
                    <td className="px-3 py-3 text-lg font-black text-navy-950">{row.quantity}</td>
                    <td className="rounded-r-md px-3 py-3 font-black text-navy-950">{formatMoney(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState label="No recess wave batches for this date" />
        )}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-black text-navy-950">Wave Pickups</h2>
        {orders.length ? (
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
            {orders.map((order) => (
              <article key={order._id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-md bg-navy-950 px-3 py-1 text-lg font-black tracking-widest text-white">
                      {order.shortCode}
                    </span>
                    <p className="mt-3 font-black text-navy-950">{order.customerName}</p>
                    <p className="text-xs text-slate-500">{order.customerPhone}</p>
                  </div>
                  <select
                    value={order.status}
                    onChange={(event) => onStatus(order._id, event.target.value)}
                    className={`h-10 rounded-md border-0 px-2 text-sm font-black ${statusClass(order.status)}`}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-700">
                  {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState label="No pickup codes in this batch" />
        )}
      </div>
    </div>
  );
}

function InventoryPanel({ menu, onToggle }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="mb-4 text-xl font-black text-navy-950">Inventory</h2>
      <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
        {menu.map((item) => (
          <div key={item._id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <img src={item.imageUrl} alt={item.name} className="h-14 w-14 rounded-md object-cover food-image" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-navy-950">{item.name}</p>
              <p className="text-xs font-semibold text-slate-500">{item.category}</p>
            </div>
            <button
              type="button"
              onClick={() => onToggle(item)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${
                item.isInStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
              title={item.isInStock ? "Mark out of stock" : "Mark in stock"}
            >
              {item.isInStock ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnalyticsPanel({ analytics }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-navy-950">
        <BarChart3 size={21} />
        Wave Revenue
      </h2>
      {analytics.length ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics} margin={{ top: 12, right: 10, left: 0, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} height={70} tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `${value / 1000}k`} width={46} />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Bar dataKey="revenue" fill="#f7b32b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState label="No wave revenue yet" />
      )}
    </section>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
      <ClipboardList className="mx-auto text-slate-400" size={34} />
      <p className="mt-3 font-black text-navy-950">{label}</p>
    </div>
  );
}
