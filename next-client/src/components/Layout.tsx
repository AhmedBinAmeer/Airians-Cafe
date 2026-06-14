"use client";

import { ChefHat, ClipboardList, LogOut, ShieldCheck, ShoppingBag, UserRound, WalletCards, Utensils, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/features/auth/authSlice";
import { selectCartCount, setCartOpen } from "@/features/cart/cartSlice";
import { formatMoney } from "@/utils/dates";
import CartPanel from "./CartPanel";
import { useTheme } from "@/hooks/useTheme";

export default function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const count = useSelector(selectCartCount);
  const { user } = useSelector((state: any) => state.auth);
  const { theme, isMounted, toggleTheme } = useTheme();

  function handleLogout() {
    dispatch(logout());
    router.push("/");
  }

  function getNavClass(path: string) {
    const isActive = pathname === path;
    return `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
      isActive ? "bg-white text-navy-900" : "text-navy-50 hover:bg-white/10"
    }`;
  }

  return (
    <div className="app-shell min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="mr-auto flex items-center gap-3 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-saffron text-navy-950 shadow-soft">
              <ChefHat size={24} />
            </span>
            <span>
              <span className="block text-lg font-black leading-tight">Airian&apos;s Cafe</span>
              <span className="block text-xs font-medium text-navy-100">Campus ordering desk</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/" className={getNavClass("/")}>
              <Utensils size={17} />
              Menu
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition text-navy-50 hover:bg-white/10"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isMounted && (theme === "light" ? <Moon size={17} /> : <Sun size={17} />)}
              <span className="hidden sm:inline">{isMounted && (theme === "light" ? "Dark" : "Light")}</span>
            </button>
            <button 
              type="button" 
              onClick={() => dispatch(setCartOpen(true))} 
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition text-navy-50 hover:bg-white/10"
            >
              <ShoppingBag size={17} />
              Cart
              {count > 0 ? <span className="rounded bg-saffron px-1.5 text-xs text-navy-950">{count}</span> : null}
            </button>
            {isMounted && user ? (
              <Link href="/orders" className={getNavClass("/orders")}>
                <ClipboardList size={17} />
                Orders
              </Link>
            ) : null}
            {isMounted && user?.role === "admin" ? (
              <Link href="/admin" className={getNavClass("/admin")}>
                <ShieldCheck size={17} />
                Admin
              </Link>
            ) : null}

            {isMounted && user ? (
              <div className="ml-2 flex items-center gap-3 border-l border-white/20 pl-4">
                {user.role !== "admin" && (
                  <div className="hidden items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm text-white md:flex">
                    <WalletCards size={17} className="text-mint" />
                    {formatMoney(user.walletBalance)}
                  </div>
                )}
                <div className="hidden items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm text-white sm:flex">
                  <UserRound size={17} className="text-saffron" />
                  <span className="max-w-32 truncate">{user.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20"
                  title="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : isMounted ? (
              <div className="ml-2 border-l border-white/20 pl-4">
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 rounded-md bg-saffron px-4 py-2 text-sm font-black text-navy-950 transition hover:bg-amber-300"
                >
                  <UserRound size={17} />
                  Sign in
                </Link>
              </div>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      <CartPanel />
    </div>
  );
}
