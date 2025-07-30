import { Route, Routes, Navigate } from "react-router-dom";
import AuthPage from "@/pages/auth";
import AdminDashboard from "@/pages/admin";
import RouteGuard from "./components/route-guard";
import { useContext } from "react";
import { AuthContext } from "./context/auth-context";
import { Toaster } from "react-hot-toast";
import HomePage from "@/pages/user/home";
import NotFoundPage from "@/pages/not-found";
import DepositPage from "@/pages/user/deposit";
import WithdrawPage from "@/pages/user/withdraw";

function App() {
  const { auth } = useContext(AuthContext);

  return (
    <>
      <Routes>
        {/* Redirect root to /auth */}
        <Route path="/" element={<Navigate to="/auth" />} />

        <Route
          path="/auth"
          element={
            <RouteGuard
              element={<AuthPage />}
              authenticated={auth?.authenticate}
              user={auth?.user}
            />
          }
        />

        <Route
          path="/home"
          element={
            <RouteGuard
              element={<HomePage />}
              authenticated={auth?.authenticate}
              user={auth?.user}
            />
          }
        />

        <Route
          path="/deposit"
          element={
            <RouteGuard
              element={<DepositPage />}
              authenticated={auth?.authenticate}
              user={auth?.user}
            />
          }
        />

        <Route
          path="/withdraw"
          element={
            <RouteGuard
              element={<WithdrawPage />}
              authenticated={auth?.authenticate}
              user={auth?.user}
            />
          }
        />

        <Route
          path="/admin"
          element={
            <RouteGuard
              element={<AdminDashboard />}
              authenticated={auth?.authenticate}
              user={auth?.user}
            />
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
}

export default App;
