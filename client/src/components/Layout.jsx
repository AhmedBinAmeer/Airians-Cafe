import { ChefHat, ClipboardList, LogOut, ShieldCheck, ShoppingBag, UserRound, WalletCards } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice.js";
import { selectCartCount } from "../features/cart/cartSlice.js";
import { formatMoney } from "../utils/dates.js";

function navClass({ isActive }) {
  return `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive ? "bg-white text-navy-900" : "text-navy-50 hover:bg-white/10"
  }`;
}

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const count = useSelector(selectCartCount);
  const { user } = useSelector((state) => state.auth);

  function handleLogout() {
    dispatch(logout());
    navigate("/");
  }

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/" className="mr-auto flex items-center gap-3 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-saffron text-navy-950 shadow-soft">
              <ChefHat size={24} />
            </span>
            <span>
              <span className="block text-lg font-black leading-tight">Airian&apos;s Cafe</span>
              <span className="block text-xs font-medium text-navy-100">Campus ordering desk</span>
            </span>
          </NavLink>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/" className={navClass}>
              <ShoppingBag size={17} />
              Menu
              {count > 0 ? <span className="rounded bg-saffron px-1.5 text-xs text-navy-950">{count}</span> : null}
            </NavLink>
            {user ? (
              <NavLink to="/orders" className={navClass}>
                <ClipboardList size={17} />
                Orders
              </NavLink>
            ) : null}
            {user?.role === "admin" ? (
              <NavLink to="/admin" className={navClass}>
                <ShieldCheck size={17} />
                Admin
              </NavLink>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm text-white md:flex">
                  <WalletCards size={17} className="text-mint" />
                  {formatMoney(user.walletBalance)}
                </div>
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
              </>
            ) : (
              <NavLink
                to="/auth"
                className="inline-flex items-center gap-2 rounded-md bg-saffron px-4 py-2 text-sm font-black text-navy-950 transition hover:bg-amber-300"
              >
                <UserRound size={17} />
                Sign in
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
