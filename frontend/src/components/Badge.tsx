import React from "react";
import { ReactNode } from "react";

const STATUS_STYLES: Record<
  string,
  { label: string; cls: string }
> = {
  planned: {
    label: "Planned",
    cls: "bg-ocean-100 text-ocean-800 dark:bg-ocean-800/40 dark:text-ocean-100",
  },
  ongoing: {
    label: "Ongoing",
    cls: "bg-ocean-200/70 text-ocean-800 dark:bg-ocean-700/40 dark:text-ocean-100",
  },
  completed: {
    label: "Completed",
    cls: "bg-seaweed-400/30 text-seaweed-600 dark:bg-seaweed-500/30 dark:text-seaweed-400",
  },
  "in-progress": {
    label: "In Progress",
    cls: "bg-ocean-200/70 text-ocean-800 dark:bg-ocean-700/40 dark:text-ocean-100",
  },
  review: {
    label: "In Review",
    cls: "bg-sand-200/80 text-sand-800 dark:bg-sand-500/30 dark:text-sand-100",
  },
  blocked: {
    label: "Blocked",
    cls: "bg-coral-200/80 text-coral-700 dark:bg-coral-500/30 dark:text-coral-100",
  },
  done: {
    label: "Done",
    cls: "bg-seaweed-400/30 text-seaweed-600 dark:bg-seaweed-500/30 dark:text-seaweed-400",
  },
  online: {
    label: "Online",
    cls: "bg-seaweed-400/30 text-seaweed-600",
  },
  away: {
    label: "Away",
    cls: "bg-sand-300/60 text-sand-800",
  },
  busy: {
    label: "Busy",
    cls: "bg-coral-200/80 text-coral-700",
  },
  offline: {
    label: "Offline",
    cls: "bg-ocean-100 text-ocean-700 dark:bg-white/10 dark:text-ocean-100",
  },
};

type BadgeProps = {
  status: string;
  children?: ReactNode;
  className?: string;
};

export default function Badge({ status, children, className = "" }: BadgeProps) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`chip ${s ? s.cls : "bg-white/70 text-ocean-800"} ${className}`}
    >
      {children || s?.label || status}
    </span>
  );
}
