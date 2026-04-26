import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { skipAuthUi } from "../lib/skipAuthUi";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-ocean-50 to-sand-100 dark:from-night-900 dark:to-night-800">
        <p className="font-heading text-xl text-ocean-800 dark:text-sand-200">
          Loading Treedome…
        </p>
      </div>
    );
  }

  if (skipAuthUi()) {
    return <Outlet />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
