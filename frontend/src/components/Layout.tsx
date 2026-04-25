import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Bubbles from "./Bubbles";
import FlowerPattern from "./FlowerPattern";

const TITLES = {
  "/dashboard": { title: "Howdy, SpongeBob!", subtitle: "Krusty Krab Overview" },
  "/projects": { title: "Projects", subtitle: "Coral Reef Board" },
  "/team": { title: "The Crew", subtitle: "Meet the Team" },
  "/calendar": { title: "Calendar", subtitle: "Under-the-Sea Schedule" },
  "/settings": { title: "Settings", subtitle: "Your Pineapple, Your Rules" },
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const meta = TITLES[pathname] || TITLES["/dashboard"];

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
          />

          <main className="flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>

          <footer className="px-4 pb-8 pt-2 text-center text-xs font-semibold text-ocean-700/70 dark:text-ocean-100/60">
            🧽 Crafted in Bikini Bottom — Who lives in a pineapple under the sea?
          </footer>
        </div>
      </div>
    </div>
  );
}
