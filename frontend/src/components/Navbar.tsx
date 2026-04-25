import React from "react";
import Icon from "./Icon";
import { useTheme } from "../context/ThemeContext";
import { Input } from "@/components/ui/input";

export default function Navbar({ onOpenSidebar, title, subtitle }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-night-800/50">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Mobile menu */}
        <button
          onClick={onOpenSidebar}
          className="rounded-full p-2 text-ocean-700 hover:bg-white/70 dark:text-ocean-100 dark:hover:bg-white/10 lg:hidden"
          aria-label="Open sidebar"
        >
          <Icon name="menu" />
        </button>

        {/* Title */}
        <div className="hidden flex-col sm:flex">
          <h1 className="font-heading text-2xl leading-none text-ocean-800 dark:text-sand-200">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-coral-500">
              {subtitle}
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative ml-auto hidden w-full max-w-sm md:block">
          <Icon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ocean-500"
          />
          <Input
            type="search"
            placeholder="Search the Krusty Krab…"
            className="rounded-full py-2.5 pl-11 pr-4"
          />
        </div>

        {/* Quick actions */}
        <div className="ml-auto flex items-center gap-2 md:ml-4">
          <button
            onClick={toggleTheme}
            className="glass-pill flex items-center gap-2 text-ocean-800 transition hover:-translate-y-0.5 dark:text-ocean-100"
            title={theme === "light" ? "Switch to Bikini Bottom Night" : "Switch to day"}
          >
            <Icon name={theme === "light" ? "moon" : "sun"} className="h-4 w-4" />
            <span className="hidden text-xs font-bold uppercase tracking-wider sm:inline">
              {theme === "light" ? "Night" : "Day"}
            </span>
          </button>

          <button
            className="glass-pill relative text-ocean-800 dark:text-ocean-100"
            aria-label="Notifications"
          >
            <Icon name="bell" />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-black text-white shadow-coral">
              3
            </span>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 py-1 pl-1 pr-3 shadow-soft dark:border-white/10 dark:bg-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sand-300 to-sand-500 text-xl shadow-sun">
              🧽
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-xs font-bold text-ocean-900 dark:text-ocean-50">
                SpongeBob
              </p>
              <p className="text-[10px] uppercase tracking-widest text-coral-500">
                Admin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Icon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ocean-500"
          />
          <Input
            type="search"
            placeholder="Search…"
            className="rounded-full py-2 pl-11 pr-4"
          />
        </div>
      </div>
    </header>
  );
}
