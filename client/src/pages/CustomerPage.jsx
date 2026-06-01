import { Clock3, Filter, Search, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { api, getErrorMessage } from "../api/client.js";
import CartPanel from "../components/CartPanel.jsx";
import MenuCard from "../components/MenuCard.jsx";
import { setWaves } from "../features/cart/waveSlice.js";

export default function CustomerPage() {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWaves() {
      const { data } = await api.get("/waves");
      dispatch(setWaves(data));
    }
    loadWaves().catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    async function loadMenu() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/menu", {
          params: {
            category,
            search,
            available: availableOnly ? "true" : undefined
          }
        });
        setItems(data.items);
        setCategories(data.categories);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    const timeout = window.setTimeout(loadMenu, 250);
    return () => window.clearTimeout(timeout);
  }, [availableOnly, category, search]);

  const popular = useMemo(() => items.filter((item) => item.tags?.includes("popular")).slice(0, 3), [items]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow-soft">
            <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5 p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-md bg-navy-50 px-3 py-2 text-sm font-black text-navy-800">
                  <Clock3 size={17} />
                  Standard pickup and recess batch ordering
                </div>
                <div>
                  <h1 className="text-3xl font-black leading-tight text-navy-950 sm:text-4xl">
                    Airian&apos;s Cafe
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                    Order chai, rolls, burgers, biryani, snacks, and cold drinks for your own pickup time or a high-speed recess wave.
                  </p>
                </div>
                {popular.length ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {popular.map((item) => (
                      <div key={item._id} className="rounded-md border border-slate-200 p-3">
                        <p className="truncate text-sm font-black text-navy-950">{item.name}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{item.category}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="relative min-h-64 bg-navy-900">
                <img
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80"
                  alt="Cafe counter"
                  className="absolute inset-0 h-full w-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-navy-950/30" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_160px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search biryani, chai, roll, fries..."
                  className="h-12 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-navy-500"
                />
              </label>
              <label className="relative block">
                <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-12 w-full appearance-none rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm font-bold outline-none focus:border-navy-500"
                >
                  {categories.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex h-12 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-bold text-navy-950">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(event) => setAvailableOnly(event.target.checked)}
                  className="h-4 w-4 accent-navy-900"
                />
                In stock
              </label>
            </div>
          </div>

          {error ? <div className="rounded-md bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-96 animate-pulse rounded-lg bg-white/80 shadow-soft" />
              ))}
            </div>
          ) : items.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <MenuCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
              <Utensils className="mx-auto text-slate-400" size={34} />
              <p className="mt-3 font-black text-navy-950">No menu items found</p>
            </div>
          )}
        </div>

        <CartPanel />
      </section>
    </div>
  );
}
