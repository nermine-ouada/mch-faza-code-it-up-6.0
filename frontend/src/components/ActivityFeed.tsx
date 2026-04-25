import React from "react";

const TONES = {
  sand: "bg-sand-200 text-sand-800",
  ocean: "bg-ocean-200 text-ocean-800",
  coral: "bg-coral-200 text-coral-700",
  seaweed: "bg-seaweed-400/30 text-seaweed-600",
};

export default function ActivityFeed({ items }) {
  return (
    <section className="glass-card p-5 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-xl text-ocean-800 dark:text-sand-200">
            Recent Activity
          </h3>
          <p className="text-xs font-semibold uppercase tracking-widest text-coral-500">
            From the reef
          </p>
        </div>
        <button className="btn-ghost !px-3 !py-1 !text-xs">View all</button>
      </header>

      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.id} className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-xl shadow-soft ${
                TONES[a.tone] || TONES.ocean
              }`}
            >
              {a.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-ocean-900 dark:text-ocean-50">
                <span className="font-bold">{a.user}</span>{" "}
                <span className="opacity-80">{a.action}</span>
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-ocean-500 dark:text-ocean-200/70">
                {a.time}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
