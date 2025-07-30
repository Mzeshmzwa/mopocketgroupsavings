import { Navigate, useLocation } from "react-router-dom";
import { Fragment } from "react";
import PropTypes from "prop-types";

function RouteGuard({ authenticated, user, element }) {
  const location = useLocation();

  console.log("AUTH CHECK:", authenticated, user);

  // 🚫 If user is not logged in and tries to access any protected page
  if (!authenticated && !location.pathname.includes("/auth")) {
    return <Navigate to="/auth" />;
  }

  // 🧍 Block regular users from accessing /admin routes
  if (
    authenticated &&
    user?.role !== "admin" &&
    location.pathname.startsWith("/admin")
  ) {
    return <Navigate to="/dashboard" />;
  }

  // 👑 Block admin users from accessing /dashboard routes
  if (
    authenticated &&
    user?.role === "user" &&
    location.pathname.startsWith("/user")
  ) {
    return <Navigate to="/home" />;
  }

  // ✅ Allow access
  return <Fragment>{element}</Fragment>;
}

RouteGuard.propTypes = {
  authenticated: PropTypes.bool.isRequired,
  user: PropTypes.object,
  element: PropTypes.node.isRequired,
};

export default RouteGuard;
