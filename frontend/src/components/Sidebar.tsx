import React from "react";
import { Link, NavLink } from "react-router-dom";
import Logo from "./Logo";
import Icon from "./Icon";
import navItems from "../data/navItems";

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-ocean-900/40 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/50 bg-white/70 p-5 backdrop-blur-2xl transition-transform duration-300
        dark:border-white/10 dark:bg-night-800/70
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="animate-bobble">
              <Logo size={46} />
            </div>
            <div>
              <p className="font-heading text-2xl leading-none text-ocean-800 dark:text-sand-200">
                Bikini Bottom
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-coral-500">
                Dashboard
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-ocean-700 hover:bg-white/70 dark:text-ocean-100 dark:hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-8 flex-1 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all",
                  isActive
                    ? "bg-gradient-to-r from-sand-300 to-sand-400 text-ocean-900 shadow-sun"
                    : "text-ocean-700 hover:-translate-y-0.5 hover:bg-white/60 hover:text-ocean-900 dark:text-ocean-100 dark:hover:bg-white/10",
                ].join(" ")
              }
            >
              <span className="text-xl transition-transform group-hover:scale-110">
                {item.icon}
              </span>
              <span className="font-body">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom helper card */}
        <div className="pineapple-card mt-6 p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-wiggle">🍍</span>
            <div>
              <p className="font-heading text-lg text-ocean-900">
                Need a hand?
              </p>
              <p className="text-xs opacity-80">
                Ask SpongeBob — he's always happy to help.
              </p>
            </div>
          </div>
          <button className="btn-primary mt-3 w-full !py-2 !text-base">
            Contact support
          </button>
        </div>

        <Link
          to="/"
          className="mt-3 flex items-center justify-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-ocean-700 backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-ocean-100 dark:hover:bg-white/10"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to site
        </Link>
      </aside>
    </>
  );
}
