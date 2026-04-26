import React from "react";
import { Link } from "react-router-dom";

const STATS = [
  { value: "1", label: "Unified operations workspace" },
  { value: "3", label: "Core workflows (projects, inventory, experiments)" },
  { value: "100%", label: "Human approval for sensitive write actions" },
  { value: "Live", label: "Agent orchestration visibility" },
];

export default function Home() {
  return (
    <div>
      <section id="home" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-24">
          <div className="relative">
            <span className="chip bg-white/80 !px-4 !py-1.5 text-coral-600 shadow-soft dark:bg-white/10">
              🐿️ Sandy Labs Ops Platform
            </span>

            <h1 className="mt-5 font-heading text-5xl leading-[1.05] text-ocean-800 sm:text-6xl lg:text-7xl dark:text-sand-200">
              Run coral research <br />
              <span className="text-coral-500">without losing</span> operational control
            </h1>

            <p className="mt-6 max-w-xl text-lg font-semibold text-ocean-800/80 dark:text-ocean-100/80">
              Sandy Labs needs one place to track project timelines, monitor inventory risk,
              keep experiment evidence organized, and supervise AI actions before any database mutation is executed.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard" className="btn-primary !text-lg">
                Open command center →
              </Link>
              <Link to="/assistant" className="btn-ghost !text-base">Open lab assistant</Link>
            </div>

            {/* Stats */}
            <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="glass-card px-4 py-3 text-center"
                >
                  <dt className="font-heading text-2xl text-ocean-800 dark:text-sand-200">
                    {s.value}
                  </dt>
                  <dd className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-coral-500">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-sand-300/70 blur-xl" />
            <div className="absolute -right-8 bottom-8 h-32 w-32 rounded-full bg-coral-300/60 blur-xl" />

            <div className="glass-card relative overflow-hidden p-8 sm:p-10">
              <div className="relative mx-auto flex h-72 w-72 items-center justify-center rounded-full bg-gradient-to-br from-sand-200 via-sand-300 to-sand-500 shadow-sun animate-bobble sm:h-80 sm:w-80">
                <span className="text-[8rem] leading-none drop-shadow-md">
                  🧪
                </span>
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-soft dark:bg-white/10">
                    🧽
                  </div>
                  <div>
                    <p className="font-heading text-lg text-ocean-800 dark:text-sand-200">
                      Sandy Labs
                    </p>
                    <p className="text-xs font-bold uppercase tracking-widest text-coral-500">
                      Research operations
                    </p>
                  </div>
                </div>
                <span className="chip bg-seaweed-400/30 text-seaweed-600">
                  ● Live
                </span>
              </div>
            </div>
            <div className="absolute -left-6 top-24 hidden rotate-[-8deg] rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-bold text-ocean-800 shadow-soft backdrop-blur sm:block dark:border-white/10 dark:bg-white/10 dark:text-ocean-100">
              📊 Project + inventory + experiment visibility
            </div>
            <div className="absolute -right-4 top-48 hidden rotate-[6deg] rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-bold text-ocean-800 shadow-soft backdrop-blur sm:block dark:border-white/10 dark:bg-white/10 dark:text-ocean-100">
              🛡️ Human-in-the-loop AI oversight
            </div>
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-coral-500">
              Problem We Solve
            </p>
            <h2 className="mt-2 font-heading text-4xl text-ocean-800 sm:text-5xl dark:text-sand-200">
              Operational chaos blocks research outcomes
            </h2>
            <p className="mt-3 text-base font-semibold text-ocean-700/80 dark:text-ocean-100/70">
              Teams lose time when project planning, stock tracking, and experiment evidence live in separate tools.
              This app centralizes those workflows and adds supervised AI support.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { title: "Project delivery risk", desc: "Unclear start/end timelines and status drift delay critical research milestones." },
              { title: "Inventory stockouts", desc: "Low stock on key items interrupts field work and experiment continuity." },
              { title: "Unsupervised automation", desc: "AI outputs need traceability and explicit approvals for sensitive database writes." },
            ].map((item) => (
              <article key={item.title} className="glass-card flex h-full flex-col p-6">
                <h3 className="font-heading text-2xl leading-tight">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold opacity-80">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="glass-card relative overflow-hidden p-8 sm:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-coral-500">
                Core Workflows
              </p>
              <h2 className="mt-2 font-heading text-4xl text-ocean-800 sm:text-5xl dark:text-sand-200">
                What teams do here every day
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { emoji: "📁", title: "Projects", desc: "Create, schedule, and track project start/end timelines." },
                { emoji: "🧫", title: "Inventory", desc: "Maintain stock levels with thresholds and transaction history." },
                { emoji: "📝", title: "Experiments", desc: "Capture results, notes, and success metrics in one place." },
                { emoji: "🤖", title: "Oversight", desc: "Audit AI actions and orchestration traces with approvals." },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-3xl border border-white/60 bg-white/70 p-5 text-center transition hover:-translate-y-1 hover:shadow-bubble dark:border-white/10 dark:bg-white/5"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sand-200 to-sand-400 text-3xl shadow-sun animate-bobble">
                    {f.emoji}
                  </div>
                  <h3 className="mt-4 font-heading text-xl text-ocean-800 dark:text-sand-200">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-ocean-700/80 dark:text-ocean-100/70">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="coral-card flex flex-col items-center justify-between gap-6 p-8 text-center sm:p-12 lg:flex-row lg:text-left">
            <div>
              <span className="chip bg-white/70 text-coral-700">
                🧭 Next step
              </span>
              <h2 className="mt-3 font-heading text-3xl leading-tight sm:text-4xl">
                Start from the dashboard, then move into projects and calendar
              </h2>
              <p className="mt-2 max-w-2xl text-base font-semibold opacity-80">
                Keep data grounded in real operations, then use the assistant with oversight for supervised automation.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard" className="btn-primary !text-lg">
                Go to Dashboard
              </Link>
              <Link to="/projects" className="btn-ghost !text-base">Open Projects</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
