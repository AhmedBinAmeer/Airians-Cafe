// @ts-nocheck
"use client";

import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  CookingPot,
  DollarSign,
  Download,
  Eye,
  EyeOff,
  MessageSquareHeart,
  PackageCheck,
  Pencil,
  Search,
  SearchCheck,
  ShieldBan,
  ShoppingBag,
  Star,
  TimerReset,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { api, getErrorMessage } from "@/api/client";
import { formatDateTime, formatMoney, todayDate } from "@/utils/dates";
import LoadingScreen from "@/components/LoadingScreen";

const statuses = ["placed", "preparing", "ready", "picked_up", "cancelled"];

const adminTabs = [
  { id: "kitchen", label: "Kitchen", icon: CookingPot },
  { id: "inventory", label: "Inventory", icon: PackageCheck },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "feedback", label: "Feedback", icon: MessageSquareHeart },
  { id: "users", label: "Users", icon: Users }
];

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
  const [activeTab, setActiveTab] = useState("kitchen");
  const [view, setView] = useState("individual");
  const [date, setDate] = useState(todayDate());
  const [timelineOrders, setTimelineOrders] = useState([]);
  const [batchSummary, setBatchSummary] = useState([]);
  const [menu, setMenu] = useState([]);
  const [ordersClosed, setOrdersClosed] = useState(false);
  const [earnings, setEarnings] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [todaySales, setTodaySales] = useState(null);
  const [quickCode, setQuickCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  function handleTabChange(tabId) {
    if (tabId === activeTab) return;
    setTabLoading(true);
    setActiveTab(tabId);
    setTimeout(() => setTabLoading(false), 400);
  }

  async function loadKitchen() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/orders/admin", {
        params: {
          view,
          date
        }
      });

      if (view === "bulk") {
        setBatchSummary(data.summary || []);
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
      const [menuResponse, settingsResponse] = await Promise.all([
        api.get("/menu"),
        api.get("/settings")
      ]);
      setMenu(Array.isArray(menuResponse.data) ? menuResponse.data : (menuResponse.data?.items || []));
      setOrdersClosed(settingsResponse.data.ordersClosed);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function loadEarnings() {
    try {
      const { data } = await api.get("/admin/analytics/earnings");
      setEarnings(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function loadFeedback() {
    try {
      const { data } = await api.get("/admin/analytics/feedback");
      setFeedbackList(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    loadAdminData();
    loadTodaySales();
  }, []);

  useEffect(() => {
    loadKitchen();
  }, [view, date]);

  useEffect(() => {
    if (activeTab === "analytics") loadEarnings();
    if (activeTab === "feedback") loadFeedback();
  }, [activeTab]);

  async function loadTodaySales() {
    try {
      const { data } = await api.get("/admin/analytics/today");
      setTodaySales(data);
    } catch (err) {
      console.warn("Failed to load today sales", err);
    }
  }

  async function deleteItem(itemId) {
    setError("");
    try {
      await api.delete(`/menu/${itemId}`);
      setMenu((current) => current.filter((entry) => entry._id !== itemId));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

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
      const { data } = await api.put(`/menu/${item._id}/stock`, { isInStock: !item.isInStock });
      setMenu((current) => current.map((entry) => (entry._id === item._id ? data : entry)));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function handleAddItem(newItem) {
    setMenu((current) => [...current, newItem]);
  }

  function handleEditItem(updatedItem) {
    setMenu((current) => current.map((entry) => (entry._id === updatedItem._id ? updatedItem : entry)));
  }

  async function toggleOrdersClosed() {
    try {
      const { data } = await api.patch("/settings/toggle-orders");
      setOrdersClosed(data.ordersClosed);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="admin-theme space-y-6">
      {/* Dashboard Header */}
      <div className="rounded-xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 px-6 py-5 shadow-xl">
        <h1 className="text-2xl font-black text-white sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm font-semibold text-white/60">Manage your cafe operations</p>

        {/* Tab Navigation */}
        <div className="mt-5 flex gap-1 overflow-x-auto rounded-lg bg-white/10 p-1 backdrop-blur-sm">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-black transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-navy-950 shadow-lg"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="mt-6">
        {tabLoading ? (
          <LoadingScreen text="Loading Tab..." delay={0} />
        ) : (
          <div className="animate-fade-in space-y-6">
            {activeTab === "kitchen" && (
              <KitchenTab
                view={view}
                setView={setView}
                date={date}
                setDate={setDate}
                ordersClosed={ordersClosed}
                onToggleOrders={toggleOrdersClosed}
                loading={loading}
                timelineOrders={timelineOrders}
                batchSummary={batchSummary}
                quickCode={quickCode}
                setQuickCode={setQuickCode}
                message={message}
                error={error}
                onRefresh={loadKitchen}
                onQuickFulfill={quickFulfill}
                onStatus={updateOrderStatus}
                todaySales={todaySales}
              />
            )}

            {activeTab === "inventory" && (
              <InventoryTab
                menu={menu}
                onToggle={toggleStock}
                onAdd={handleAddItem}
                onEdit={handleEditItem}
                onDelete={deleteItem}
              />
            )}

            {activeTab === "analytics" && <AnalyticsTab earnings={earnings} waveAnalytics={[]} />}

            {activeTab === "feedback" && <FeedbackTab feedbackList={feedbackList} />}

            {activeTab === "users" && <UsersTab />}
          </div>
        )}
      </main>
    </div>
  );
}

/* ──────────────────────────── KITCHEN TAB ──────────────────────────── */

function KitchenTab({
  view, setView, date, setDate, ordersClosed, onToggleOrders,
  loading, timelineOrders, batchSummary,
  quickCode, setQuickCode, message, error,
  onRefresh, onQuickFulfill, onStatus, todaySales
}) {
  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-md bg-navy-50 px-3 py-2 text-sm font-black text-navy-800">
              <CookingPot size={17} />
              Kitchen Command
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onToggleOrders}
                className={`inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-black transition-colors ${
                  ordersClosed
                    ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                {ordersClosed ? <ShieldBan size={17} /> : <CheckCircle2 size={17} />}
                {ordersClosed ? "Accept Orders" : "Pause Orders"}
              </button>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-11 rounded-md border border-slate-200 px-3 text-sm font-bold outline-none focus:border-navy-500"
              />
              <button
                type="button"
                onClick={onRefresh}
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
              onClick={() => setView("individual")}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-black ${
                view === "individual" ? "bg-white text-navy-950 shadow" : "text-slate-600"
              }`}
            >
              <ClipboardList size={17} />
              Individual Orders
            </button>
            <button
              type="button"
              onClick={() => setView("bulk")}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-black ${
                view === "bulk" ? "bg-white text-navy-950 shadow" : "text-slate-600"
              }`}
            >
              <PackageCheck size={17} />
              Bulk Cooking List
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {todaySales && (
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-emerald-500 p-4 text-white shadow-soft">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Today's Revenue</p>
                <p className="mt-1 text-2xl font-black">{formatMoney(todaySales.today.revenue)}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-100">
                  {todaySales.yesterday.revenue > 0 ? (
                    `${((todaySales.today.revenue - todaySales.yesterday.revenue) / todaySales.yesterday.revenue * 100).toFixed(1)}% vs yesterday`
                  ) : "No data yesterday"}
                </p>
              </div>
              <div className="rounded-lg bg-blue-500 p-4 text-white shadow-soft">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Today's Orders</p>
                <p className="mt-1 text-2xl font-black">{todaySales.today.orders}</p>
                <p className="mt-1 truncate text-xs font-semibold text-blue-100">
                  Top: {todaySales.topItem ? `${todaySales.topItem.qty}x ${todaySales.topItem._id}` : "None yet"}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={onQuickFulfill} className="rounded-lg bg-navy-950 p-5 text-white shadow-soft">
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
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        {view === "individual" ? (
          <TimelineView loading={loading} orders={timelineOrders} onStatus={onStatus} />
        ) : (
          <BulkView loading={loading} summary={batchSummary} />
        )}
      </section>
    </>
  );
}

/* ──────────────────────────── INVENTORY TAB ──────────────────────────── */

function InventoryTab({ menu, onToggle, onAdd, onEdit, onDelete }) {
  return (
    <section className="grid gap-6">
      <InventoryPanel menu={menu} onToggle={onToggle} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />
    </section>
  );
}

/* ──────────────────────────── ANALYTICS TAB ──────────────────────────── */

function AnalyticsTab({ earnings, waveAnalytics }) {
  const [chartReady, setChartReady] = useState(false);

  // Defer chart mount until after the tab DOM is painted so
  // ResponsiveContainer can measure a real pixel size (avoids width=-1 warnings)
  useEffect(() => {
    const id = requestAnimationFrame(() => setChartReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const totalRevenue = earnings.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = earnings.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const peakDay = earnings.length ? earnings.reduce((a, b) => (a.revenue > b.revenue ? a : b)) : null;

  async function handleDownloadCSV() {
    try {
      const response = await api.get("/orders/admin/export-csv", { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-export-${todayDate()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Failed to download CSV", err);
      alert("Failed to download CSV");
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={DollarSign} label="Total Revenue" value={formatMoney(totalRevenue)} color="from-emerald-500 to-emerald-600" />
        <KpiCard icon={ShoppingBag} label="Total Orders" value={totalOrders} color="from-blue-500 to-blue-600" />
        <KpiCard icon={TrendingUp} label="Avg. Order Value" value={formatMoney(avgOrderValue)} color="from-violet-500 to-violet-600" />
        <KpiCard icon={BarChart3} label="Peak Day" value={peakDay ? `${formatMoney(peakDay.revenue)}` : "—"} subtitle={peakDay?.date} color="from-amber-500 to-orange-500" />
      </div>

      {/* Earnings Area Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-navy-950">Daily Revenue</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Last 30 days earnings trend</p>
          </div>
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 hover:text-navy-950"
          >
            <Download size={16} />
            Export Orders CSV
          </button>
        </div>
        {earnings.length ? (
          <div style={{ width: "100%", height: 320 }}>
            {chartReady && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earnings} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f7b32b" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f7b32b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => v.slice(5)}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v / 1000}k`}
                    width={50}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [formatMoney(value), "Revenue"]}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 20px rgba(0,0,0,.08)",
                      fontWeight: 700
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f7b32b"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff", fill: "#f7b32b" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          <EmptyState label="No revenue data available yet" />
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, subtitle, color }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="flex items-center gap-4 p-5">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="truncate text-xl font-black text-navy-950">{value}</p>
          {subtitle && <p className="text-xs font-semibold text-slate-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── FEEDBACK TAB ──────────────────────────── */

function FeedbackTab({ feedbackList }) {
  const avgRating = feedbackList.length
    ? (feedbackList.reduce((sum, f) => sum + f.feedback.rating, 0) / feedbackList.length).toFixed(1)
    : "—";

  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: feedbackList.filter((f) => f.feedback.rating === r).length
  }));
  const maxCount = Math.max(...ratingCounts.map((r) => r.count), 1);

  return (
    <div className="space-y-6">
      {/* Feedback Summary Header */}
      <div className="grid gap-4 sm:grid-cols-[320px_1fr]">
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-soft">
          <p className="text-sm font-black uppercase tracking-wider text-amber-800">Overall Rating</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-5xl font-black text-navy-950">{avgRating}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={20}
                  className={s <= Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                />
              ))}
            </div>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-600">{feedbackList.length} total review{feedbackList.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="mb-4 text-sm font-black uppercase tracking-wider text-navy-950">Rating Distribution</p>
          <div className="space-y-2.5">
            {ratingCounts.map((r) => (
              <div key={r.rating} className="flex items-center gap-3">
                <span className="flex w-12 items-center gap-1 text-sm font-black text-navy-950">
                  {r.rating} <Star size={13} className="fill-amber-400 text-amber-400" />
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
                    style={{ width: `${(r.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-bold text-slate-500">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Cards Grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="mb-5 text-xl font-black text-navy-950">Customer Reviews</h2>
        {feedbackList.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {feedbackList.map((order) => (
              <div
                key={order._id}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-amber-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-black text-navy-950">{order.customerName || "Customer"}</p>
                    <p className="text-xs font-semibold text-slate-400">
                      Order <span className="rounded bg-navy-950 px-1.5 py-0.5 text-[10px] font-black tracking-widest text-white">{order.shortCode}</span>
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        className={s <= order.feedback.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                      />
                    ))}
                  </div>
                </div>
                {order.feedback.comment && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    &ldquo;{order.feedback.comment}&rdquo;
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {order.items.map((item, i) => (
                    <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>
                {order.notes && (
                  <p className="mt-2 text-sm font-bold text-red-500">
                    Notes: {order.notes}
                  </p>
                )}
                <p className="mt-3 text-[11px] font-semibold text-slate-400">
                  {new Date(order.feedback.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label="No customer feedback yet" />
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────── SHARED COMPONENTS ──────────────────────────── */

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
                    {order.notes && <p className="mt-1 text-xs text-red-500 font-black">Note: {order.notes}</p>}
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

function BulkView({ loading, summary }) {
  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-slate-100" />;

  return (
    <div>
      <h2 className="mb-4 text-xl font-black text-navy-950">Bulk Cooking List</h2>
      {summary.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-3 py-2">Menu item</th>
                <th className="px-3 py-2">Total Qty to Cook</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row, index) => (
                <tr key={`${row._id.name}-${index}`} className="bg-slate-50">
                  <td className="px-3 py-3 font-bold text-slate-800">{row._id.name}</td>
                  <td className="rounded-r-md px-3 py-3 text-lg font-black text-navy-950">{row.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState label="No pending orders to cook" />
      )}
    </div>
  );
}

function InventoryPanel({ menu, onToggle, onAdd, onEdit, onDelete }) {
  const [editingItem, setEditingItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-navy-950">Inventory</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-md bg-navy-900 px-3 py-1.5 text-sm font-bold text-white hover:bg-navy-800"
        >
          + Add Item
        </button>
      </div>
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
              onClick={() => setEditingItem(item)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-50 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              title="Edit item"
            >
              <Pencil size={18} />
            </button>
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
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${item.name}? This will hide it from the menu.`)) {
                  onDelete(item._id);
                }
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
              title="Delete item"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      {showAdd && <ItemFormModal onClose={() => setShowAdd(false)} onSuccess={onAdd} />}
      {editingItem && <ItemFormModal initialData={editingItem} onClose={() => setEditingItem(null)} onSuccess={onEdit} />}
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

function ItemFormModal({ initialData, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!initialData;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.target);
      let data;

      if (isEditing) {
        if (!e.target.image.files[0]) {
          formData.delete("image");
        }
        const res = await api.patch(`/menu/${initialData._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        data = res.data;
      } else {
        const res = await api.post("/menu", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        data = res.data;
      }

      onSuccess(data);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-black text-navy-950">{isEditing ? "Edit Menu Item" : "Add Menu Item"}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-bold text-navy-950">Name</label>
              <input name="name" defaultValue={initialData?.name} required className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy-500" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-bold text-navy-950">Description</label>
              <textarea name="description" defaultValue={initialData?.description} required rows="2" className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-navy-950">Category</label>
              <input name="category" defaultValue={initialData?.category} required className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-navy-950">Price</label>
              <input name="price" defaultValue={initialData?.price} type="number" step="0.01" min="0" required className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy-500" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-bold text-navy-950">Prep Minutes (Optional)</label>
              <input name="prepMinutes" defaultValue={initialData?.prepMinutes} type="number" min="1" placeholder="12" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy-500" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-bold text-navy-950">
                Image {isEditing && <span className="text-slate-400 font-medium">(Optional, leaves unchanged)</span>}
              </label>
              <div className="relative">
                <input type="file" name="image" accept="image/*" required={!isEditing} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                <div className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm font-bold text-slate-500 hover:bg-slate-100">
                  <Upload size={18} />
                  {isEditing ? "Choose new image file" : "Choose an image file"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-50">
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────── USERS TAB ──────────────────────────── */

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/admin/users?q=${encodeURIComponent(query)}`);
      setUsers(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-navy-950">User Management</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Search and manage customer accounts</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-navy-500"
            />
          </div>
        </div>

        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}

        {loading ? (
          <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
        ) : users.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="text-xs uppercase text-slate-500">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">Wallet</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="bg-slate-50 transition-colors hover:bg-slate-100">
                    <td className="rounded-l-md px-3 py-3">
                      <div className="flex items-center gap-2">
                        {user.isBlocked && <ShieldBan size={16} className="text-red-500" />}
                        <span className={`font-black ${user.isBlocked ? 'text-red-700 line-through' : 'text-navy-950'}`}>
                          {user.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold uppercase text-slate-700">
                        {user.role}
                      </span>
                      {user.studentId && <p className="mt-1 text-xs font-semibold text-slate-500">{user.studentId}</p>}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">
                      <p>{user.email}</p>
                      <p>{user.phone}</p>
                    </td>
                    <td className="px-3 py-3 font-black text-navy-950">{formatMoney(user.walletBalance)}</td>
                    <td className="rounded-r-md px-3 py-3 text-right">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm font-bold text-navy-900 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                      >
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState label="No users found" />
        )}
      </div>

      {selectedUser && (
        <UserProfileModal
          userId={selectedUser._id}
          onClose={() => {
            setSelectedUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

function UserProfileModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function handleToggleBlock() {
    try {
      await api.patch(`/admin/users/${userId}/block`);
      loadProfile();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleTopUp(e) {
    e.preventDefault();
    setDepositLoading(true);
    try {
      await api.post(`/admin/users/${userId}/wallet`, { amount: depositAmount });
      setDepositAmount("");
      loadProfile();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDepositLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
          <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
    );
  }

  const { user, orders } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl scrollbar-thin">
        <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-5">
          <div>
            <h3 className="flex items-center gap-2 text-2xl font-black text-navy-950">
              {user.isBlocked && <ShieldBan size={24} className="text-red-500" />}
              {user.name}
            </h3>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold uppercase text-slate-700">{user.role}</span>
              {user.studentId && <span>• ID: {user.studentId}</span>}
              <span>• Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Details */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h4 className="font-black uppercase tracking-wider text-slate-500 text-xs">Contact Info</h4>
            <div>
              <p className="text-xs font-semibold text-slate-500">Email Address</p>
              <p className="font-bold text-navy-950">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Phone Number</p>
              <p className="font-bold text-navy-950">{user.phone || "Not provided"}</p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleToggleBlock}
                className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold shadow-sm ${
                  user.isBlocked 
                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                <ShieldBan size={16} />
                {user.isBlocked ? "Unblock Account" : "Block Account"}
              </button>
            </div>
          </div>

          {/* Wallet Control */}
          <div className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50 p-5">
            <h4 className="flex items-center gap-2 font-black uppercase tracking-wider text-emerald-700 text-xs">
              <Wallet size={16} /> Wallet Balance
            </h4>
            <p className="text-4xl font-black text-emerald-900">{formatMoney(user.walletBalance)}</p>
            <form onSubmit={handleTopUp} className="mt-4 border-t border-emerald-200 pt-4">
              <label className="mb-2 block text-xs font-bold text-emerald-800">Top Up Wallet</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="50"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Amount"
                  className="h-10 w-full min-w-0 rounded-md border border-emerald-200 px-3 text-sm font-bold text-emerald-900 outline-none placeholder:text-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={depositLoading}
                  className="h-10 shrink-0 rounded-md bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {depositLoading ? "Adding..." : "Deposit"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8">
          <h4 className="mb-4 text-lg font-black text-navy-950">Recent Orders</h4>
          {orders.length ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                  <div>
                    <span className="rounded bg-navy-950 px-2 py-0.5 text-xs font-black tracking-widest text-white">
                      {order.shortCode}
                    </span>
                    <span className={`ml-2 text-xs font-bold uppercase ${
                      order.status === 'cancelled' ? 'text-red-500' : 'text-emerald-600'
                    }`}>
                      {order.status.replace("_", " ")}
                    </span>
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                    </p>
                    {order.notes && <p className="mt-1 text-xs text-red-500 font-black">Note: {order.notes}</p>}
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-navy-950">{formatMoney(order.totalAmount)}</p>
                    <p className="text-xs font-bold text-slate-500">{order.paymentMethod === 'transfer' ? 'JazzCash' : order.paymentMethod}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-500">No orders placed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
