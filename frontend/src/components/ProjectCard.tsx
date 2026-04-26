import React from "react";
import Badge from "./Badge";

const CARD_CLASSES = {
  sand: "pineapple-card",
  coral: "coral-card",
  ocean: "ocean-card",
};

const TAG_TONES: Record<string, string> = {
  "R&D": "bg-seaweed-400/30 text-seaweed-600",
  Ops: "bg-ocean-200/70 text-ocean-800",
  Design: "bg-coral-200/80 text-coral-700",
  Marketing: "bg-sand-200/80 text-sand-800",
  Education: "bg-ocean-100 text-ocean-700",
  Retail: "bg-sand-200/80 text-sand-800",
  Lab: "bg-ocean-200/70 text-ocean-800",
  Field: "bg-sand-200/80 text-sand-800",
};

export type ProjectCardModel = {
  id?: number;
  name: string;
  description?: string | null;
  status: string;
  priority?: number;
  tag?: string;
  emoji?: string;
  accent?: keyof typeof CARD_CLASSES;
  deadline?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

function accentFromStatus(status: string): keyof typeof CARD_CLASSES {
  if (status === "completed") return "sand";
  if (status === "ongoing" || status === "in-progress") return "ocean";
  return "coral";
}

function emojiFromName(name: string): string {
  const emojis = ["🍍", "🧪", "🔬", "🐿️", "🫧", "⭐"];
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h + name.charCodeAt(i)) % emojis.length;
  return emojis[h];
}

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: ProjectCardModel;
  onEdit?: (p: ProjectCardModel) => void;
  onDelete?: (p: ProjectCardModel) => void;
}) {
  const accent = project.accent || accentFromStatus(project.status);
  const cardCls = CARD_CLASSES[accent] || CARD_CLASSES.ocean;
  const tag = project.tag || "Lab";
  const emoji = project.emoji || emojiFromName(project.name);
  const start = project.startDate || "—";
  const end = project.endDate || project.deadline || "—";

  return (
    <article className={`${cardCls} relative flex h-full flex-col p-6`}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/40 blur-md dark:bg-white/10" />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-soft animate-bobble dark:bg-white/10">
            {emoji}
          </div>
          <div className="min-w-0">
            <span className={`chip ${TAG_TONES[tag] || "bg-white/80 text-ocean-800"}`}>
              {tag}
            </span>
            <h3 className="mt-1.5 truncate font-heading text-xl leading-tight">{project.name}</h3>
          </div>
        </div>
        <Badge status={project.status} />
      </div>

      <p className="relative mt-3 line-clamp-3 text-sm font-semibold opacity-80">
        {project.description || "No description yet."}
      </p>

      <div className="relative mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-2xl border border-white/40 bg-white/50 p-2 dark:border-white/10 dark:bg-white/5">
          <p className="font-bold uppercase tracking-wider opacity-70">Start date</p>
          <p className="mt-1 font-heading text-base">{start}</p>
        </div>
        <div className="rounded-2xl border border-white/40 bg-white/50 p-2 dark:border-white/10 dark:bg-white/5">
          <p className="font-bold uppercase tracking-wider opacity-70">End date</p>
          <p className="mt-1 font-heading text-base">{end}</p>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="relative mt-4 flex flex-wrap justify-end gap-2 border-t border-white/40 pt-4 dark:border-white/10">
          {onEdit && (
            <button type="button" className="btn-ghost !px-3 !py-1 !text-sm" onClick={() => onEdit(project)}>
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="rounded-full bg-coral-500/90 px-3 py-1 text-sm font-bold text-white shadow-coral"
              onClick={() => onDelete(project)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </article>
  );
}
