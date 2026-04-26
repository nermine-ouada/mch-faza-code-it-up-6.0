import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import CalendarView from "../components/CalendarView";
import { apiJson } from "../lib/api";

const TONE_DOT = {
  sand: "bg-sand-500",
  ocean: "bg-ocean-500",
  coral: "bg-coral-500",
  seaweed: "bg-seaweed-500",
};

export default function CalendarPage() {
  const [projects, setProjects] = useState<
    Array<{
      id: number;
      name: string;
      status: string;
      created_at: string;
      deadline?: string | null;
      start_date?: string | null;
      end_date?: string | null;
      owner_id?: number | null;
    }>
  >([]);
  const [events, setEvents] = useState<
    Array<{
      id: number;
      title: string;
      description?: string | null;
      start_at: string;
      end_at?: string | null;
      all_day: boolean;
      owner_id?: number | null;
      project_id?: number | null;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [projectRows, eventRows] = await Promise.all([
          apiJson<
          Array<{
            id: number;
            name: string;
            status: string;
            created_at: string;
            deadline?: string | null;
            start_date?: string | null;
            end_date?: string | null;
            owner_id?: number | null;
          }>
          >("/api/projects"),
          apiJson<
            Array<{
              id: number;
              title: string;
              description?: string | null;
              start_at: string;
              end_at?: string | null;
              all_day: boolean;
              owner_id?: number | null;
              project_id?: number | null;
            }>
          >("/api/events"),
        ]);
        setProjects(projectRows);
        setEvents(eventRows);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load calendar");
      }
    })();
  }, []);

  const projectMilestones = useMemo(
    () =>
      projects.map((p) => ({
        id: `project-${p.id}`,
        date: p.end_date || p.deadline || p.start_date || p.created_at,
        title: p.name,
        time: p.end_date ? "Project end" : p.deadline ? "Deadline" : p.start_date ? "Project start" : "Created",
        owner: p.owner_id ? `User #${p.owner_id}` : "Unassigned",
        tone:
          p.status === "completed"
            ? ("seaweed" as const)
            : p.status === "ongoing"
              ? ("ocean" as const)
              : ("sand" as const),
        kind: "project" as const,
      })),
    [projects],
  );

  const scheduledEvents = useMemo(
    () =>
      events.map((e) => ({
        id: `event-${e.id}`,
        date: e.start_at,
        title: e.title,
        time: e.all_day ? "All day" : "Scheduled event",
        owner: e.owner_id ? `User #${e.owner_id}` : "Unassigned",
        tone: "coral" as const,
        kind: "event" as const,
      })),
    [events],
  );

  const combinedEvents = useMemo(() => [...projectMilestones, ...scheduledEvents], [projectMilestones, scheduledEvents]);

  const upcomingProjects = useMemo(
    () =>
      [...projectMilestones]
        .filter((e) => !Number.isNaN(new Date(e.date).getTime()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5),
    [projectMilestones],
  );
  const upcomingEvents = useMemo(
    () =>
      [...scheduledEvents]
        .filter((e) => !Number.isNaN(new Date(e.date).getTime()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5),
    [scheduledEvents],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        emoji="📅"
        title="Calendar"
        subtitle="Track real project milestones and scheduled operational events."
        actions={<></>}
      />

      {error && (
        <div className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-900 dark:border-coral-500/30 dark:bg-coral-900/20 dark:text-coral-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CalendarView events={combinedEvents} />
        </div>

        <section className="glass-card p-5 sm:p-6">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-xl text-ocean-800 dark:text-sand-200">
                Upcoming
              </h3>
              <p className="text-xs font-semibold uppercase tracking-widest text-coral-500">
                Projects and events
              </p>
            </div>
          </header>
          <div className="mb-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="chip bg-sand-200 text-sand-800">Project milestone</span>
            <span className="chip bg-coral-200 text-coral-800">Operational event</span>
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ocean-600 dark:text-ocean-200/80">
            Project milestones
          </p>
          <ul className="space-y-3">
            {upcomingProjects.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-200 to-ocean-400 text-ocean-900 shadow-soft">
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Day
                  </span>
                  <span className="font-heading text-2xl leading-none">
                    {new Date(ev.date).getDate()}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ocean-900 dark:text-ocean-50">
                    {ev.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ocean-500 dark:text-ocean-200/70">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        TONE_DOT[ev.tone] || TONE_DOT.ocean
                      }`}
                    />
                    {ev.time} · {ev.owner}
                  </div>
                </div>
              </li>
            ))}
            {upcomingProjects.length === 0 && (
              <li className="text-sm font-semibold text-ocean-600 dark:text-ocean-200/80">No project milestones yet.</li>
            )}
          </ul>
          <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-ocean-600 dark:text-ocean-200/80">
            Operational events
          </p>
          <ul className="space-y-3">
            {upcomingEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-coral-200 to-coral-400 text-ocean-900 shadow-soft">
                  <span className="text-[9px] font-black uppercase tracking-widest">Day</span>
                  <span className="font-heading text-2xl leading-none">{new Date(ev.date).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ocean-900 dark:text-ocean-50">{ev.title}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ocean-500 dark:text-ocean-200/70">
                    <span className="inline-block h-2 w-2 rounded-full bg-coral-500" />
                    {ev.time} · {ev.owner}
                  </div>
                </div>
              </li>
            ))}
            {upcomingEvents.length === 0 && (
              <li className="text-sm font-semibold text-ocean-600 dark:text-ocean-200/80">No operational events yet.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
