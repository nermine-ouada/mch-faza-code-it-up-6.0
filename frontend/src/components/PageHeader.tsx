import React from "react";

export default function PageHeader({ title, subtitle, emoji, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-coral-500">
          Bikini Bottom HQ
        </p>
        <h1 className="mt-1 flex items-center gap-3 font-heading text-4xl leading-tight text-ocean-800 sm:text-5xl dark:text-sand-200">
          {emoji && <span className="animate-wiggle text-5xl">{emoji}</span>}
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm font-semibold text-ocean-700/80 dark:text-ocean-100/70">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
