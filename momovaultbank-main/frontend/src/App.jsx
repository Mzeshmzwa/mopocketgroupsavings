import { Route, Routes, Navigate } from "react-router-dom";
import { useContext } from "react";
import { Toaster } from "react-hot-toast";

import AuthPage from "@/pages/auth";
import AdminDashboard from "@/pages/admin";
import CreateSavingsGroup from "@/pages/savings-groups/create";
import MyGroups from "@/pages/savings-groups/my-groups";
import PublicGroups from "@/pages/savings-groups/public";
import AllGroups from "@/pages/savings-groups/all";
import HomePage from "@/pages/user/home";
import DepositPage from "@/pages/user/deposit";
import WithdrawPage from "@/pages/user/withdraw";
import ContributePage from "@/pages/savings-groups/contribute";
import GroupDetails from "@/pages/savings-groups/details";
import NotFoundPage from "@/pages/not-found";

import RouteGuard from "./components/route-guard";
import { AuthContext } from "./context/auth-context";

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

        <Route
          path="/savings-groups/create"
          element={
            <RouteGuard
              element={<CreateSavingsGroup />}
              authenticated={auth?.authenticate}
              user={auth?.user}
            />
          }
        />

        <Route
          path="/savings-groups/my-groups"
          element={
            <RouteGuard
              element={<MyGroups />}
              authenticated={auth?.authenticate}
              user={auth?.user}
            />
          }
        />

        <Route
          path="/savings-groups/public"
          element={
            <RouteGuard
              element={<PublicGroups />}
              authenticated={auth?.authenticate}
              user={auth?.user}
            />
          }
        />

        <Route
          path="/savings-groups/all"
          element={
            <RouteGuard
              element={<AllGroups />}
              authenticated={auth?.authenticate}
              user={auth?.user}
            />
          }
        />

        <Route
          path="/savings-groups/:groupId/contribute"
          element={
            <RouteGuard
              element={<ContributePage />}
              authenticated={auth?.authenticate}
              user={auth?.user}
            />
          }
        />

        <Route
          path="/savings-groups/:groupId"
          element={
            <RouteGuard
              element={<GroupDetails />}
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
