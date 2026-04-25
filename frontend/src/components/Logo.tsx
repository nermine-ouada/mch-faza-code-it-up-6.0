import React from "react";

/**
 * Playful pineapple-house logo. Pure SVG – no external assets.
 */
export default function Logo({ size = 40, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Bikini Bottom Dashboard logo"
    >
      <defs>
        <linearGradient id="pineBody" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffde3f" />
          <stop offset="100%" stopColor="#d69100" />
        </linearGradient>
        <linearGradient id="leafG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4fd48a" />
          <stop offset="100%" stopColor="#0f9a54" />
        </linearGradient>
      </defs>

      {/* Leaves */}
      <g>
        <path
          d="M32 4 C28 10 24 14 22 16 C27 14 30 14 32 16 Z"
          fill="url(#leafG)"
        />
        <path
          d="M32 4 C36 10 40 14 42 16 C37 14 34 14 32 16 Z"
          fill="url(#leafG)"
        />
        <path
          d="M32 6 C32 12 32 15 32 18 C34 15 36 12 36 8 Z"
          fill="#1fbf6b"
        />
      </g>

      {/* Body */}
      <g>
        <ellipse cx="32" cy="38" rx="22" ry="22" fill="url(#pineBody)" />
        {/* Diamond cross-hatch */}
        <g stroke="#a46b00" strokeWidth="1.2" opacity="0.55">
          <path d="M14 30 L50 30" />
          <path d="M12 38 L52 38" />
          <path d="M14 46 L50 46" />
          <path d="M20 22 L20 54" />
          <path d="M32 20 L32 56" />
          <path d="M44 22 L44 54" />
        </g>
        {/* Door */}
        <rect
          x="27"
          y="42"
          width="10"
          height="14"
          rx="3"
          fill="#a46b00"
        />
        <circle cx="34" cy="50" r="1" fill="#ffde3f" />
        {/* Little window */}
        <circle cx="22" cy="34" r="2.2" fill="#cdeeff" stroke="#a46b00" />
      </g>
    </svg>
  );
}
