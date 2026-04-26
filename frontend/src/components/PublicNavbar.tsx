import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import Icon from "./Icon";
import { useTheme } from "../context/ThemeContext";

const LINKS = [
  { href: "#home", label: "Home" },
  { href: "#menu", label: "Menu" },
  { href: "#features", label: "Features" },
  { href: "#reviews", label: "Reviews" },
  { href: "#contact", label: "Contact" },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-night-800/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3">
          <div className="animate-bobble">
            <Logo size={42} />
          </div>
          <div className="leading-none">
            <p className="font-heading text-xl text-ocean-800 dark:text-sand-200">
              Sandy Lab
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-coral-500">
              Treedome OS
            </p>
          </div>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-bold text-ocean-800 transition hover:-translate-y-0.5 hover:bg-white/70 dark:text-ocean-100 dark:hover:bg-white/10"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="glass-pill hidden items-center gap-2 text-ocean-800 sm:flex dark:text-ocean-100"
            title={
              theme === "light"
                ? "Switch to Bikini Bottom Night"
                : "Switch to day"
            }
          >
            <Icon
              name={theme === "light" ? "moon" : "sun"}
              className="h-4 w-4"
            />
            <span className="text-xs font-bold uppercase tracking-wider">
              {theme === "light" ? "Night" : "Day"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="btn-ghost !px-4 !py-2 !text-base"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="btn-primary !px-5 !py-2 !text-base"
          >
            Lab dashboard
          </button>

          <button
            type="button"
            className="rounded-full p-2 text-ocean-700 hover:bg-white/70 dark:text-ocean-100 dark:hover:bg-white/10 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/40 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-night-800/80 lg:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 font-bold text-ocean-800 hover:bg-white dark:text-ocean-100 dark:hover:bg-white/10"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
