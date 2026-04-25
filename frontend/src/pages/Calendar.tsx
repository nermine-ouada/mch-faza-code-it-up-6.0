import React from "react";
import PageHeader from "../components/PageHeader";
import CalendarView from "../components/CalendarView";
import events from "../data/events";

const TONE_DOT = {
  sand: "bg-sand-500",
  ocean: "bg-ocean-500",
  coral: "bg-coral-500",
  seaweed: "bg-seaweed-500",
};

export default function CalendarPage() {
  const upcoming = [...events].sort((a, b) => a.date - b.date).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        emoji="📅"
        title="Calendar"
        subtitle="Plan training sessions, product launches, jellyfishing trips, and everything in between."
        actions={
          <>
            <button className="btn-ghost">Import ICS</button>
            <button className="btn-primary">+ New Event</button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CalendarView events={events} />
        </div>

        <section className="glass-card p-5 sm:p-6">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-xl text-ocean-800 dark:text-sand-200">
                Upcoming
              </h3>
              <p className="text-xs font-semibold uppercase tracking-widest text-coral-500">
                Next 6 events
              </p>
            </div>
            <button className="btn-ghost !px-3 !py-1 !text-xs">All</button>
          </header>

          <ul className="space-y-3">
            {upcoming.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-200 to-ocean-400 text-ocean-900 shadow-soft">
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Day
                  </span>
                  <span className="font-heading text-2xl leading-none">
                    {ev.date}
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
          </ul>
        </section>
      </div>
    </div>
  );
}
