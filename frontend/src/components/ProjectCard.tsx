import React from "react";
import Badge from "./Badge";
import ProgressBar from "./ProgressBar";

const CARD_CLASSES = {
  sand: "pineapple-card",
  coral: "coral-card",
  ocean: "ocean-card",
};

const TAG_TONES = {
  "R&D": "bg-seaweed-400/30 text-seaweed-600",
  Ops: "bg-ocean-200/70 text-ocean-800",
  Design: "bg-coral-200/80 text-coral-700",
  Marketing: "bg-sand-200/80 text-sand-800",
  Education: "bg-ocean-100 text-ocean-700",
  Retail: "bg-sand-200/80 text-sand-800",
};

export default function ProjectCard({ project }) {
  const cardCls = CARD_CLASSES[project.accent] || CARD_CLASSES.ocean;

  return (
    <article className={`${cardCls} flex h-full flex-col p-6`}>
      {/* Decorative bubble */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/40 blur-md dark:bg-white/10" />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-soft animate-bobble dark:bg-white/10">
            {project.emoji}
          </div>
          <div>
            <span
              className={`chip ${TAG_TONES[project.tag] || "bg-white/80 text-ocean-800"}`}
            >
              {project.tag}
            </span>
            <h3 className="mt-1.5 font-heading text-xl leading-tight">
              {project.name}
            </h3>
          </div>
        </div>
        <Badge status={project.status} />
      </div>

      <p className="relative mt-3 text-sm font-semibold opacity-80">
        {project.description}
      </p>

      <div className="relative mt-4">
        <ProgressBar
          value={project.progress}
          tone={project.accent === "coral" ? "coral" : project.accent === "sand" ? "sand" : "ocean"}
        />
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <div className="flex -space-x-2">
          {project.team.map((t, i) => (
            <span
              key={i}
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white/90 text-lg shadow-soft dark:border-white/30 dark:bg-white/10"
              title={`Team member ${i + 1}`}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
            Due
          </p>
          <p className="font-heading text-base">{project.dueDate}</p>
        </div>
      </div>
    </article>
  );
}
