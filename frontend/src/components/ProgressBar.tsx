import React from "react";

const TONES = {
  sand: "from-sand-300 to-sand-500",
  ocean: "from-ocean-300 to-ocean-500",
  coral: "from-coral-300 to-coral-500",
  seaweed: "from-seaweed-400 to-seaweed-600",
};

export default function ProgressBar({ value = 0, tone = "ocean", showValue = true, size = "md" }) {
  const pct = Math.max(0, Math.min(100, value));
  const grad = TONES[tone] || TONES.ocean;
  const h = size === "sm" ? "h-2" : size === "lg" ? "h-4" : "h-2.5";

  return (
    <div className="w-full">
      <div
        className={`relative w-full overflow-hidden rounded-full bg-white/60 ring-1 ring-white/60 dark:bg-white/10 dark:ring-white/10 ${h}`}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${grad} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showValue && (
        <div className="mt-1 flex justify-between text-[11px] font-bold uppercase tracking-wider text-ocean-700/80 dark:text-ocean-100/70">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
      )}
    </div>
  );
}
