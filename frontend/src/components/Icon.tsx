import React from "react";

/**
 * Tiny hand-drawn icon set as inline SVGs.
 * Use like: <Icon name="search" className="w-5 h-5" />
 */
type IconName =
  | "search"
  | "bell"
  | "menu"
  | "close"
  | "sun"
  | "moon"
  | "plus"
  | "chevron-left"
  | "chevron-right"
  | "mail"
  | "phone"
  | "chat"
  | "check"
  | "arrow-up"
  | "arrow-down";

type IconProps = {
  name: IconName;
  className?: string;
  strokeWidth?: number;
};

export default function Icon({
  name,
  className = "w-5 h-5",
  strokeWidth = 2,
}: IconProps) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...common}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M22 16.92V21a1 1 0 0 1-1.1 1 19 19 0 0 1-8.3-3 19 19 0 0 1-6-6A19 19 0 0 1 3.6 4.1 1 1 0 0 1 4.6 3h4.1a1 1 0 0 1 1 .75c.12.9.33 1.78.63 2.63a1 1 0 0 1-.23 1L8.4 9.1a16 16 0 0 0 6 6l1.7-1.7a1 1 0 0 1 1-.23c.85.3 1.73.51 2.63.63a1 1 0 0 1 .75 1Z" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M21 12c0 4.4-4 8-9 8a10 10 0 0 1-4-.8L3 20l1-4.5A8 8 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "arrow-up":
      return (
        <svg {...common}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      );
    case "arrow-down":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      );
    default:
      return null;
  }
}
