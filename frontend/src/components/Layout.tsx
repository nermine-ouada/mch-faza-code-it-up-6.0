import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Bubbles from "./Bubbles";
import FlowerPattern from "./FlowerPattern";
import { useAuth } from "../context/AuthContext";
import { skipAuthUi } from "../lib/skipAuthUi";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Sandy’s Treedome", subtitle: "Lab overview & signals" },
  "/projects": { title: "Research projects", subtitle: "Plan, track, ship science" },
  "/inventory": { title: "Inventory", subtitle: "Reagents, gear, and stock levels" },
  "/experiments": { title: "Experiment log", subtitle: "Results, notes, outcomes" },
  "/assistant": { title: "Lab Assistant", subtitle: "Planner + specialist agents" },
  "/oversight": { title: "AI oversight", subtitle: "Usage monitoring & approved database reads" },
  "/calendar": { title: "Schedule", subtitle: "Field work, reviews, deadlines" },
  "/settings": { title: "Settings", subtitle: "Profile & Treedome preferences" },
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const meta = TITLES[pathname] || TITLES["/dashboard"];

  const handleLogout = () => {
    logout();
    navigate(skipAuthUi() ? "/" : "/login");
  };

  // Close the sidebar whenever we navigate on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="bb-app-bg min-h-screen">
      <FlowerPattern />
      <Bubbles count={24} />

      <div className="bb-main-stack flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            onOpenSidebar={() => setSidebarOpen(true)}
            title={meta.title}
            subtitle={meta.subtitle}
            user={user}
            onLogout={handleLogout}
          />

          <main className="flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>

          <footer className="px-4 pb-8 pt-2 text-center text-xs font-semibold text-ocean-700/70 dark:text-ocean-100/60">
            🐿️ Sandy Lab OS — Treedome research, inventory, and AI helpers.
          </footer>
        </div>
      </div>
    </div>
  );
}
