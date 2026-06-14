// @ts-nocheck
"use client";

import { Clock3, Filter, Search, Utensils, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { api, getErrorMessage } from "@/api/client";
import MenuCard from "@/components/MenuCard";
import LoadingScreen from "@/components/LoadingScreen";

export default function CustomerPage() {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [search, setSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [ordersClosed, setOrdersClosed] = useState(false);

  // For scrollspy
  const observer = useRef(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await api.get("/settings");
        setOrdersClosed(data.ordersClosed);
      } catch (err) {}
    }
    loadSettings();
  }, []);

  useEffect(() => {
    async function loadMenu() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/menu", {
          params: {
            search,
            available: availableOnly ? "true" : undefined
          }
        });
        const itemsList = Array.isArray(data) ? data : (data?.items || []);
        setItems(itemsList);
        
        // Ensure categories are only those with items if searching
        const filteredCategories = Array.from(new Set(itemsList.map(item => item.category))).sort((a,b) => a.localeCompare(b));
        setCategories(filteredCategories.length ? filteredCategories : ["All"]);
        if (filteredCategories.length) {
          setActiveCategory(filteredCategories[0]);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    const timeout = window.setTimeout(loadMenu, 250);
    return () => window.clearTimeout(timeout);
  }, [availableOnly, search]);

  const popular = useMemo(() => items.filter((item) => item.tags?.includes("popular")).slice(0, 3), [items]);

  const itemsByCategory = useMemo(() => {
    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });
    return grouped;
  }, [items]);

  // Scrollspy logic
  useEffect(() => {
    if (loading) return;
    
    const sections = document.querySelectorAll("section[data-category]");
    
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveCategory(entry.target.getAttribute("data-category"));
          
          // Scroll the nav bar to the active item
          const navItem = document.getElementById(`nav-${entry.target.getAttribute("data-category")}`);
          if (navItem) {
            navItem.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
          }
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });

    sections.forEach(section => observer.current.observe(section));

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loading, itemsByCategory]);

  const scrollToCategory = (e, cat) => {
    e.preventDefault();
    const element = document.getElementById(`category-${cat}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 140; // offset for sticky headers
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <section>
        <div className="space-y-6">
          {/* ── Hero Card ── */}
          <div className="overflow-hidden rounded-xl bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800 shadow-lg dark:shadow-navy-950/20 relative">

            {/* Floating food emoji particles */}
            {[
              { emoji: "🍔", left: "8%",  delay: "0s",    dur: "5.2s",  size: "1.5rem" },
              { emoji: "☕", left: "18%", delay: "1.3s",  dur: "6.8s",  size: "1.3rem" },
              { emoji: "🍕", left: "30%", delay: "0.6s",  dur: "7.1s",  size: "1.6rem" },
              { emoji: "🍟", left: "44%", delay: "2.1s",  dur: "5.8s",  size: "1.2rem" },
              { emoji: "🥤", left: "58%", delay: "0.9s",  dur: "6.3s",  size: "1.4rem" },
              { emoji: "🍩", left: "70%", delay: "1.7s",  dur: "7.5s",  size: "1.3rem" },
              { emoji: "🌮", left: "82%", delay: "0.3s",  dur: "5.6s",  size: "1.5rem" },
              { emoji: "🧃", left: "92%", delay: "2.5s",  dur: "6.1s",  size: "1.2rem" },
            ].map((p, i) => (
              <span
                key={i}
                className="hero-particle"
                style={{
                  left: p.left,
                  bottom: "-2rem",
                  fontSize: p.size,
                  animationName: "float-up",
                  animationDuration: p.dur,
                  animationDelay: p.delay,
                  animationIterationCount: "infinite",
                  animationTimingFunction: "ease-in-out",
                  opacity: 0.35,
                }}
              >
                {p.emoji}
              </span>
            ))}

            {/* Glow orbs */}
            <div className="hero-orb" style={{ width: 260, height: 260, top: -80, left: -60, background: "rgba(247,179,43,0.22)", animationDuration: "7s", animationDelay: "0s" }} />
            <div className="hero-orb" style={{ width: 200, height: 200, bottom: -50, left: "28%", background: "rgba(54,201,142,0.18)", animationDuration: "9s", animationDelay: "2.5s" }} />
            <div className="hero-orb" style={{ width: 160, height: 160, top: 20, right: "44%", background: "rgba(242,109,91,0.15)", animationDuration: "11s", animationDelay: "5s" }} />

            <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr] lg:grid-cols-[1fr_1fr] relative">
              {/* Left: text panel with shimmer */}
              <div className="hero-shimmer relative flex flex-col space-y-5 p-6 sm:p-10">
                <div className="inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-black text-red-800 self-start">
                  <Clock3 size={17} />
                  Fast & Fresh Campus Orders
                </div>
                <div>
                  <h1 className="text-4xl font-black leading-tight text-navy-950 dark:text-white sm:text-5xl uppercase tracking-tight">
                    Airian&apos;s Cafe
                  </h1>
                  <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                    Order your favorites online and pick them up hot and fresh. From crispy Zinger Burgers to authentic Karak Chai.
                  </p>
                </div>
                {ordersClosed && (
                  <div className="mt-4 rounded-md bg-red-100 p-4 border border-red-300 shadow-inner">
                    <p className="font-black text-red-900 text-lg">⚠️ Cafe is currently closed for new orders</p>
                    <p className="text-red-800 text-sm mt-1">Please check back later.</p>
                  </div>
                )}
                {popular.length ? (
                  <div className="pt-4 border-t border-slate-100 dark:border-navy-800">
                    <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Campus Favorites</p>
                    <div className="flex flex-wrap gap-3">
                      {popular.map((item) => (
                        <div key={item._id} className="rounded-full bg-navy-50 dark:bg-navy-950 px-4 py-2 border border-navy-100 dark:border-navy-800 flex items-center gap-2">
                          <span className="text-sm font-black text-navy-950 dark:text-slate-200">{item.name}</span>
                          <span className="text-xs font-bold text-navy-700 dark:text-navy-300 bg-navy-200 dark:bg-navy-800 px-2 py-0.5 rounded-full">{item.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* ── Stat Badges ── fills the blank lower area */}
                <div className="hero-stats mt-auto pt-5 border-t border-slate-100 dark:border-navy-800 grid grid-cols-3 gap-3">
                  {[
                    { icon: "⚡", value: "~10 min", label: "Avg. ready time" },
                    { icon: "🌟", value: "4.8 / 5", label: "Student rating"   },
                    { icon: "🎓", value: "Campus", label: "Pickup only"       },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="hero-stat-card flex flex-col items-center rounded-xl border border-slate-200 dark:border-navy-700 bg-white/80 dark:bg-navy-800 py-3 px-2 text-center backdrop-blur-sm"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    >
                      <span className="text-2xl mb-1 block" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>{stat.icon}</span>
                      <p className="text-sm font-black text-navy-950 dark:text-white leading-none">{stat.value}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Live indicator */}
                <div className="flex items-center gap-2 self-start">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Live ordering</span>
                </div>

                {/* Decorative dot grid — bottom-right of text panel */}
                <svg
                  className="absolute bottom-3 right-3 opacity-[0.06] dark:opacity-[0.04] pointer-events-none select-none"
                  width="96" height="80" viewBox="0 0 96 80"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {Array.from({ length: 6 }, (_, row) =>
                    Array.from({ length: 8 }, (_, col) => (
                      <circle key={`${row}-${col}`} cx={col * 14 + 6} cy={row * 14 + 6} r="2.5" fill="currentColor" className="text-navy-950 dark:text-white" />
                    ))
                  )}
                </svg>
              </div>


              {/* Right: image with Ken Burns zoom */}
              <div className="relative min-h-80 lg:min-h-96 bg-navy-900 hidden md:block overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80"
                  alt="Cafe counter"
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                  style={{ animation: "kenBurns 18s ease-in-out infinite alternate" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-navy-900 via-transparent to-transparent" />
                {/* Decorative corner ring */}
                <div
                  className="absolute bottom-4 right-4 w-20 h-20 rounded-full border-4 border-amber-400/40"
                  style={{ animation: "pulse-ring 3s ease-in-out infinite" }}
                />
                <div
                  className="absolute bottom-6 right-6 w-10 h-10 rounded-full border-2 border-amber-400/60"
                  style={{ animation: "pulse-ring 3s ease-in-out infinite 1s" }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-4 shadow-md dark:shadow-navy-950/20">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search for your cravings..."
                  className="h-14 w-full rounded-lg border-2 border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 pl-12 pr-4 text-base font-semibold outline-none transition focus:border-navy-900 dark:focus:border-navy-700 focus:bg-white dark:focus:bg-navy-900 text-slate-900 dark:text-white"
                />
              </label>
              <label className="flex h-14 cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 px-6 text-sm font-black text-navy-950 dark:text-navy-100 transition hover:bg-slate-100 dark:hover:bg-navy-900">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(event) => setAvailableOnly(event.target.checked)}
                  className="h-5 w-5 accent-navy-900 dark:accent-saffron"
                />
                In stock only
              </label>
            </div>
          </div>

          {error ? <div className="rounded-lg bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

          {/* Sticky Category Navigation */}
          {categories.length > 0 && !loading && (
            <div className="sticky top-[60px] z-30 -mx-4 px-4 py-4 bg-[#f6f8fc]/95 dark:bg-navy-950/95 backdrop-blur-md sm:mx-0 sm:px-0">
              <nav className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {categories.map((cat) => (
                  <a
                    id={`nav-${cat}`}
                    href={`#category-${cat}`}
                    onClick={(e) => scrollToCategory(e, cat)}
                    key={cat}
                    className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-black uppercase tracking-wide transition-all ${
                      activeCategory === cat
                        ? "bg-navy-950 dark:bg-saffron text-white dark:text-navy-950 shadow-md scale-105"
                        : "bg-white dark:bg-navy-900 text-navy-800 dark:text-navy-100 border-2 border-slate-200 dark:border-navy-800 hover:border-navy-400 dark:hover:border-navy-600 hover:bg-slate-50 dark:hover:bg-navy-800"
                    }`}
                  >
                    {cat}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {loading ? (
            <LoadingScreen text="Loading Menu..." delay={0} />
          ) : items.length ? (
            <div className="space-y-16 animate-fade-in">
              {categories.map((category) => (
                <section 
                  key={category} 
                  id={`category-${category}`} 
                  data-category={category}
                  className="scroll-mt-36"
                >
                  <div className="mb-6 flex items-center gap-4">
                    <h2 className="text-3xl font-black text-navy-950 dark:text-white uppercase tracking-tight">{category}</h2>
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 dark:from-navy-800 to-transparent"></div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
                    {itemsByCategory[category]?.map((item) => (
                      <MenuCard key={item._id} item={item} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-navy-800 bg-white dark:bg-navy-900 py-20 text-center">
              <Utensils className="mx-auto text-slate-300 dark:text-slate-600" size={48} />
              <p className="mt-4 text-xl font-black text-navy-950 dark:text-white">No items found</p>
              <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
