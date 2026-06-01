import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import Layout from "./components/Layout.jsx";

const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.jsx"));
const CustomerPage = lazy(() => import("./pages/CustomerPage.jsx"));
const OrdersPage = lazy(() => import("./pages/OrdersPage.jsx"));

function AdminRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function PrivateRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<div className="rounded-lg bg-white p-6 font-black text-navy-950 shadow-soft">Loading Airian&apos;s Cafe...</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<CustomerPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <OrdersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
