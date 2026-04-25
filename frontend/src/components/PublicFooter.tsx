import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const COLUMNS = [
  {
    title: "Menu",
    links: ["Krabby Patty", "Kelp Shake", "Coral Bits", "Seaweed Fries"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Press", "Contact"],
  },
  {
    title: "Follow",
    links: ["Twitter / X", "Instagram", "YouTube", "Newsletter"],
  },
];

export default function PublicFooter() {
  return (
    <footer
      id="contact"
      className="relative mt-24 border-t border-white/40 bg-white/60 py-14 backdrop-blur-xl dark:border-white/10 dark:bg-night-800/60"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Logo size={46} />
            <div>
              <p className="font-heading text-2xl text-ocean-800 dark:text-sand-200">
                Bikini Bottom
              </p>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-coral-500">
                Krusty Krab Co.
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm font-semibold text-ocean-700/80 dark:text-ocean-100/70">
            Who lives in a pineapple under the sea? We do — and we serve the
            tastiest patties in the ocean since forever.
          </p>

          <Link to="/dashboard" className="btn-primary mt-5 !text-base">
            Enter Dashboard
          </Link>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="font-heading text-lg text-ocean-800 dark:text-sand-200">
              {col.title}
            </h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#!"
                    className="text-sm font-semibold text-ocean-700/80 transition hover:text-coral-500 dark:text-ocean-100/70"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-white/50 px-4 pt-6 text-center text-xs font-semibold text-ocean-700/70 dark:border-white/10 dark:text-ocean-100/60 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Krusty Krab Co. — Made with bubbles in
        Bikini Bottom.
      </div>
    </footer>
  );
}
