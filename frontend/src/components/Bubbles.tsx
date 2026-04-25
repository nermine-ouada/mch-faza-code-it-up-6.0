import React, { useMemo } from "react";

/**
 * Floating bubbles background. Pure CSS-animated SVG.
 * Bubbles float from the bottom of the viewport to the top, forever.
 */
export default function Bubbles({ count = 22 }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const size = Math.floor(Math.random() * 34) + 10; // 10–44px
        const left = Math.floor(Math.random() * 100);
        const duration = Math.floor(Math.random() * 14) + 12; // 12–26s
        const delay = Math.floor(Math.random() * 18);
        const opacity = Math.random() * 0.4 + 0.25;
        return { id: i, size, left, duration, delay, opacity };
      }),
    [count]
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="absolute bottom-[-60px] block rounded-full animate-float"
          style={{
            left: `${b.left}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            opacity: b.opacity,
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.35) 45%, rgba(155,220,255,0.15) 80%)",
            boxShadow:
              "inset -2px -3px 6px rgba(10,143,216,0.25), 0 2px 6px rgba(10,143,216,0.15)",
            border: "1px solid rgba(255,255,255,0.65)",
          }}
        />
      ))}
    </div>
  );
}
