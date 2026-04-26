import React, { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import TeamMemberCard from "../components/TeamMemberCard";
import team from "../data/team";

const STATUSES = [
  { id: "all", label: "Everyone" },
  { id: "online", label: "Online" },
  { id: "away", label: "Away" },
  { id: "busy", label: "Busy" },
  { id: "offline", label: "Offline" },
];

export default function Team() {
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return team.filter((m) => {
      const matchStatus = status === "all" || m.status === status;
      const matchQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.skills.some((s) => s.toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  }, [status, query]);

  const countsByStatus = useMemo(() => {
    const c = { online: 0, away: 0, busy: 0, offline: 0 };
    for (const m of team) c[m.status] = (c[m.status] || 0) + 1;
    return c;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        emoji="🐙"
        title="Meet the Crew"
        subtitle="People coordinating projects, field ops, inventory, and lab experiments."
        actions={<></>}
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Crew", value: team.length, emoji: "🧑‍🍳", accent: "sand" },
          { label: "Online Now", value: countsByStatus.online || 0, emoji: "🟢", accent: "seaweed" },
          { label: "Busy", value: countsByStatus.busy || 0, emoji: "🔥", accent: "coral" },
          { label: "Away", value: countsByStatus.away || 0, emoji: "🌙", accent: "ocean" },
        ].map((s) => (
          <div key={s.label} className="glass-card flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-soft dark:bg-white/10">
              {s.emoji}
            </div>
            <div>
              <p className="font-heading text-2xl leading-none text-ocean-800 dark:text-sand-200">
                {s.value}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-coral-500">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => {
            const active = status === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                className={`chip !px-3 !py-1.5 text-sm transition ${
                  active
                    ? "bg-gradient-to-r from-sand-300 to-sand-500 text-ocean-900 shadow-sun"
                    : "bg-white/80 text-ocean-700 hover:bg-white dark:bg-white/10 dark:text-ocean-100"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <input
          type="search"
          placeholder="Search by name, role, or skill…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-semibold text-ocean-900 shadow-soft outline-none focus:border-ocean-300 focus:ring-2 focus:ring-ocean-200 dark:border-white/10 dark:bg-white/10 dark:text-ocean-50 sm:max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <div className="mx-auto mb-3 text-6xl animate-wiggle">🐌</div>
          <h3 className="font-heading text-2xl text-ocean-800 dark:text-sand-200">
            Nobody's here right now
          </h3>
          <p className="mt-1 text-sm font-semibold text-ocean-700/80 dark:text-ocean-100/70">
            Gary says try a different filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <TeamMemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}
