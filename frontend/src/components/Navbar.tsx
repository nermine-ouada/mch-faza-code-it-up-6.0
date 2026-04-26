import React from "react";
import Icon from "./Icon";
import { useTheme } from "../context/ThemeContext";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "../context/AuthContext";

type NavbarProps = {
  onOpenSidebar: () => void;
  title: string;
  subtitle?: string;
  user: AuthUser | null;
  onLogout: () => void;
};

export default function Navbar({
  onOpenSidebar,
  title,
  subtitle,
  user,
  onLogout,
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-night-800/50">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          onClick={onOpenSidebar}
          className="rounded-full p-2 text-ocean-700 hover:bg-white/70 dark:text-ocean-100 dark:hover:bg-white/10 lg:hidden"
          aria-label="Open sidebar"
        >
          <Icon name="menu" />
        </button>

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

        <div className="relative ml-auto hidden w-full max-w-sm md:block">
          <Icon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ocean-500"
          />
          <Input
            type="search"
            placeholder="Search the lab…"
            className="rounded-full py-2.5 pl-11 pr-4"
          />
        </div>

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
            type="button"
            onClick={onLogout}
            className="glass-pill hidden text-xs font-bold uppercase tracking-wider text-ocean-800 sm:inline dark:text-ocean-100"
          >
            Sign out
          </button>

          <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 py-1 pl-1 pr-3 shadow-soft dark:border-white/10 dark:bg-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sand-300 to-sand-500 text-lg shadow-sun">
              🐿️
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <p className="max-w-[140px] truncate text-xs font-bold text-ocean-900 dark:text-ocean-50">
                {user?.full_name || user?.email || "Scientist"}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-coral-500">
                {user?.role || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

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
