import React, { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import ProjectCard from "../components/ProjectCard";
import projects from "../data/projects";

const FILTERS = [
  { id: "all", label: "All Projects", emoji: "🍍" },
  { id: "in-progress", label: "In Progress", emoji: "🛠️" },
  { id: "review", label: "In Review", emoji: "👀" },
  { id: "blocked", label: "Blocked", emoji: "🚧" },
  { id: "done", label: "Done", emoji: "✅" },
];

export default function Projects() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesFilter = filter === "all" || p.status === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.lead.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        emoji="🍍"
        title="Projects"
        subtitle="Everything the crew is cooking up — from secret formulas to mall pop-ups."
        actions={
          <>
            <button className="btn-ghost">Import</button>
            <button className="btn-primary">+ New Project</button>
          </>
        }
      />

      {/* Filters & search */}
      <div className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`chip gap-1.5 !px-3 !py-1.5 text-sm transition ${
                  active
                    ? "bg-gradient-to-r from-sand-300 to-sand-500 text-ocean-900 shadow-sun"
                    : "bg-white/80 text-ocean-700 hover:bg-white dark:bg-white/10 dark:text-ocean-100"
                }`}
              >
                <span>{f.emoji}</span>
                {f.label}
              </button>
            );
          })}
        </div>

        <input
          type="search"
          placeholder="Search projects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-semibold text-ocean-900 shadow-soft outline-none focus:border-ocean-300 focus:ring-2 focus:ring-ocean-200 dark:border-white/10 dark:bg-white/10 dark:text-ocean-50 sm:max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <div className="mx-auto mb-3 text-6xl animate-wiggle">🐠</div>
          <h3 className="font-heading text-2xl text-ocean-800 dark:text-sand-200">
            Nothin' swimming in this net
          </h3>
          <p className="mt-1 text-sm font-semibold text-ocean-700/80 dark:text-ocean-100/70">
            Try a different filter or search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
