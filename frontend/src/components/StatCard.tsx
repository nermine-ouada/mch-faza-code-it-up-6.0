import React from "react";
import Icon from "./Icon";

const ACCENTS = {
  sand: "pineapple-card",
  ocean: "ocean-card",
  coral: "coral-card",
};

export default function StatCard({ label, value, delta, trend, icon, accent = "ocean" }) {
  const cardClass = ACCENTS[accent] || ACCENTS.ocean;
  const isUp = trend === "up";

  return (
    <div className={`${cardClass} p-5`}>
      {/* Decorative bubble */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/40 blur-md dark:bg-white/10" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-75">
            {label}
          </p>
          <p className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-2xl shadow-soft animate-bobble dark:bg-white/10">
          {icon}
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-2">
        <span
          className={`chip ${
            isUp
              ? "bg-seaweed-500/20 text-seaweed-600"
              : "bg-coral-500/20 text-coral-600"
          }`}
        >
          <Icon name={isUp ? "arrow-up" : "arrow-down"} className="h-3.5 w-3.5" />
          {delta}
        </span>
        <span className="text-xs font-semibold opacity-70">vs last week</span>
      </div>
    </div>
  );
}
