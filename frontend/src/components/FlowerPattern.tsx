import React from "react";

/**
 * The classic SpongeBob opening "underwater flower" sky.
 * Rendered as an inline SVG tiled background with soft petals.
 */
export default function FlowerPattern({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
          FLOWER_SVG
        )}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "260px 260px",
        opacity: 0.18,
      }}
    />
  );
}

// A single "flower" tile: 5 fat petals around a center circle.
// Softly colored to look like the sky flowers in the intro.
const FLOWER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" width="260" height="260">
  <defs>
    <radialGradient id="petal" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#9bdcff" stop-opacity="0.25"/>
    </radialGradient>
    <radialGradient id="petalPink" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#ffe0e4" stop-opacity="0.95"/>
      <stop offset="70%" stop-color="#ffb6c1" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#f73d66" stop-opacity="0.15"/>
    </radialGradient>
  </defs>

  <!-- Flower 1 (top-left) -->
  <g transform="translate(60 60)">
    <g>
      <ellipse cx="0" cy="-28" rx="18" ry="26" fill="url(#petal)"/>
      <ellipse cx="27" cy="-9" rx="18" ry="26" fill="url(#petal)" transform="rotate(72 27 -9)"/>
      <ellipse cx="17" cy="23" rx="18" ry="26" fill="url(#petal)" transform="rotate(144 17 23)"/>
      <ellipse cx="-17" cy="23" rx="18" ry="26" fill="url(#petal)" transform="rotate(216 -17 23)"/>
      <ellipse cx="-27" cy="-9" rx="18" ry="26" fill="url(#petal)" transform="rotate(288 -27 -9)"/>
      <circle r="10" fill="#ffde3f" opacity="0.85"/>
    </g>
  </g>

  <!-- Flower 2 (bottom-right, pinkish) -->
  <g transform="translate(195 180)">
    <g>
      <ellipse cx="0" cy="-22" rx="14" ry="22" fill="url(#petalPink)"/>
      <ellipse cx="22" cy="-7" rx="14" ry="22" fill="url(#petalPink)" transform="rotate(72 22 -7)"/>
      <ellipse cx="14" cy="19" rx="14" ry="22" fill="url(#petalPink)" transform="rotate(144 14 19)"/>
      <ellipse cx="-14" cy="19" rx="14" ry="22" fill="url(#petalPink)" transform="rotate(216 -14 19)"/>
      <ellipse cx="-22" cy="-7" rx="14" ry="22" fill="url(#petalPink)" transform="rotate(288 -22 -7)"/>
      <circle r="8" fill="#ffde3f" opacity="0.85"/>
    </g>
  </g>

  <!-- Small center flower -->
  <g transform="translate(200 60)">
    <g>
      <ellipse cx="0" cy="-14" rx="9" ry="14" fill="url(#petal)"/>
      <ellipse cx="14" cy="-5" rx="9" ry="14" fill="url(#petal)" transform="rotate(72 14 -5)"/>
      <ellipse cx="9" cy="12" rx="9" ry="14" fill="url(#petal)" transform="rotate(144 9 12)"/>
      <ellipse cx="-9" cy="12" rx="9" ry="14" fill="url(#petal)" transform="rotate(216 -9 12)"/>
      <ellipse cx="-14" cy="-5" rx="9" ry="14" fill="url(#petal)" transform="rotate(288 -14 -5)"/>
      <circle r="5" fill="#ffde3f" opacity="0.9"/>
    </g>
  </g>

  <g transform="translate(60 200)">
    <g>
      <ellipse cx="0" cy="-14" rx="9" ry="14" fill="url(#petal)"/>
      <ellipse cx="14" cy="-5" rx="9" ry="14" fill="url(#petal)" transform="rotate(72 14 -5)"/>
      <ellipse cx="9" cy="12" rx="9" ry="14" fill="url(#petal)" transform="rotate(144 9 12)"/>
      <ellipse cx="-9" cy="12" rx="9" ry="14" fill="url(#petal)" transform="rotate(216 -9 12)"/>
      <ellipse cx="-14" cy="-5" rx="9" ry="14" fill="url(#petal)" transform="rotate(288 -14 -5)"/>
      <circle r="5" fill="#ffde3f" opacity="0.9"/>
    </g>
  </g>
</svg>
`;
