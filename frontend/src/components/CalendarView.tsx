import React, { useMemo, useState } from "react";
import Icon from "./Icon";

const TONE_BG = {
  sand: "bg-sand-300/80 text-sand-900 border-sand-400",
  ocean: "bg-ocean-200/80 text-ocean-900 border-ocean-300",
  coral: "bg-coral-200/80 text-coral-800 border-coral-300",
  seaweed: "bg-seaweed-400/40 text-seaweed-700 border-seaweed-500/50",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarEvent = {
  id: number | string;
  date: string;
  title: string;
  time?: string;
  owner?: string;
  tone?: "sand" | "ocean" | "coral" | "seaweed";
  kind?: "project" | "event";
};

export default function CalendarView({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const { grid, monthName } = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const daysInMonth = new Date(
      cursor.year,
      cursor.month + 1,
      0
    ).getDate();
    const startDay = first.getDay();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return {
      grid: cells,
      monthName: first.toLocaleString("default", { month: "long" }),
    };
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const m = new Map<number, CalendarEvent[]>();
    for (const e of events) {
      const dt = new Date(e.date);
      if (Number.isNaN(dt.getTime())) continue;
      if (dt.getMonth() !== cursor.month || dt.getFullYear() !== cursor.year) continue;
      const day = dt.getDate();
      if (!m.has(day)) m.set(day, []);
      m.get(day)?.push(e);
    }
    return m;
  }, [events, cursor.month, cursor.year]);

  const shift = (delta) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const isToday = (day) =>
    day === today.getDate() &&
    cursor.month === today.getMonth() &&
    cursor.year === today.getFullYear();

  return (
    <section className="glass-card p-5 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-2xl text-ocean-800 dark:text-sand-200">
            {monthName} {cursor.year}
          </h3>
          <p className="text-xs font-semibold uppercase tracking-widest text-coral-500">
            Bikini Bottom Schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shift(-1)}
            className="glass-pill text-ocean-800 dark:text-ocean-100"
            aria-label="Previous month"
          >
            <Icon name="chevron-left" className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              setCursor({
                year: today.getFullYear(),
                month: today.getMonth(),
              })
            }
            className="btn-ghost !px-3 !py-1.5 !text-xs"
          >
            Today
          </button>
          <button
            onClick={() => shift(1)}
            className="glass-pill text-ocean-800 dark:text-ocean-100"
            aria-label="Next month"
          >
            <Icon name="chevron-right" className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-ocean-600 dark:text-ocean-200/80">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {grid.map((day, idx) => {
          const dayEvents: CalendarEvent[] = day ? eventsByDay.get(day) || [] : [];
          return (
            <div
              key={idx}
              className={`relative flex min-h-[90px] flex-col rounded-2xl border p-1.5 transition
              ${
                day
                  ? "border-white/60 bg-white/60 hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/5"
                  : "border-transparent bg-transparent"
              }
              ${
                isToday(day)
                  ? "!border-coral-400 !bg-coral-100/70 dark:!bg-coral-500/20"
                  : ""
              }
              `}
            >
              {day && (
                <>
                  <span
                    className={`self-start rounded-full px-2 py-0.5 text-[11px] font-black ${
                      isToday(day)
                        ? "bg-coral-500 text-white"
                        : "text-ocean-800 dark:text-ocean-100"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-1 flex flex-col gap-1">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`truncate rounded-lg border px-1.5 py-0.5 text-[10px] font-bold ${
                          TONE_BG[ev.tone] || TONE_BG.ocean
                        }`}
                        title={`${ev.title} · ${ev.kind || "event"} · ${ev.time} · ${ev.owner}`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] font-bold text-ocean-600 dark:text-ocean-200/80">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
