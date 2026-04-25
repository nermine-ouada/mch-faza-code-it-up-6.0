import React, { useState } from "react";
import ProgressBar from "./ProgressBar";

const PRIORITY_TONES = {
  high: "coral",
  medium: "sand",
  low: "ocean",
};

const PRIORITY_LABELS = {
  high: "🔥 High",
  medium: "🟡 Medium",
  low: "💧 Low",
};

export default function TaskList({ tasks: initial }) {
  const [tasks, setTasks] = useState(initial);

  const toggleTask = (id) =>
    setTasks((list) =>
      list.map((t) =>
        t.id === id ? { ...t, progress: t.progress === 100 ? 60 : 100 } : t
      )
    );

  return (
    <section className="glass-card p-5 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-xl text-ocean-800 dark:text-sand-200">
            Today's Tasks
          </h3>
          <p className="text-xs font-semibold uppercase tracking-widest text-coral-500">
            Keep on flippin'
          </p>
        </div>
        <button className="btn-ghost !px-3 !py-1 !text-xs">+ New</button>
      </header>

      <ul className="space-y-4">
        {tasks.map((task) => {
          const done = task.progress === 100;
          return (
            <li
              key={task.id}
              className="rounded-2xl border border-white/60 bg-white/60 p-4 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTask(task.id)}
                  aria-label={done ? "Mark as incomplete" : "Mark as complete"}
                  className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 transition ${
                    done
                      ? "border-seaweed-500 bg-seaweed-500 text-white"
                      : "border-ocean-300 bg-white/80 dark:bg-white/10"
                  }`}
                >
                  {done && (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      className={`font-bold text-ocean-900 dark:text-ocean-50 ${
                        done ? "line-through opacity-60" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <span className="chip bg-white/80 text-ocean-700 dark:bg-white/10 dark:text-ocean-100">
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ocean-500 dark:text-ocean-200/70">
                    Due {task.due}
                  </p>
                  <div className="mt-2">
                    <ProgressBar
                      value={task.progress}
                      tone={PRIORITY_TONES[task.priority] || "ocean"}
                      showValue={false}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
