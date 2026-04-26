import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import ActivityFeed from "../components/ActivityFeed";
import { apiJson } from "../lib/api";

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.7)",
  background: "rgba(255,255,255,0.95)",
  boxShadow: "0 10px 25px -10px rgba(10,143,216,0.35)",
  fontFamily: "Nunito, system-ui, sans-serif",
  fontWeight: 700,
  color: "#03385a",
};

type Project = { id: number; status: string };
type Inv = { id: number; quantity: number; min_required: number };
type Exp = { id: number; success: boolean | null; created_at: string };
type UsageRow = {
  id: number;
  description: string | null;
  created_at: string;
  action_metadata?: Record<string, unknown> | null;
};

export default function Dashboard() {
  const [counts, setCounts] = useState({
    projects: 0,
    ongoing: 0,
    inventory: 0,
    lowStock: 0,
    experiments: 0,
    successRate: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<Inv[]>([]);
  const [experiments, setExperiments] = useState<Exp[]>([]);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [projectsRows, invRows, expRows, usageRows] = await Promise.all([
          apiJson<Project[]>("/api/projects"),
          apiJson<Inv[]>("/api/inventory"),
          apiJson<Exp[]>("/api/experiments"),
          apiJson<UsageRow[]>("/api/usage/activity?limit=30"),
        ]);
        if (cancelled) return;
        const ongoing = projectsRows.filter((p) => p.status === "ongoing").length;
        const low = invRows.filter((i) => i.quantity <= i.min_required).length;
        const wins = expRows.filter((e) => e.success === true).length;
        const decided = expRows.filter((e) => e.success !== null && e.success !== undefined).length;
        const successRate = decided ? Math.round((wins / decided) * 100) : 0;
        setProjects(projectsRows);
        setInventory(invRows);
        setExperiments(expRows);
        setUsage(usageRows);
        setCounts({
          projects: projectsRows.length,
          ongoing,
          inventory: invRows.length,
          lowStock: low,
          experiments: expRows.length,
          successRate,
        });
      } catch (e: unknown) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Could not load lab data");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const experimentSeries = useMemo(() => {
    const byDay = new Map<string, { day: string; runs: number; successful: number }>();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, {
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        runs: 0,
        successful: 0,
      });
    }
    for (const e of experiments) {
      const key = new Date(e.created_at).toISOString().slice(0, 10);
      const row = byDay.get(key);
      if (!row) continue;
      row.runs += 1;
      if (e.success === true) row.successful += 1;
    }
    return Array.from(byDay.values());
  }, [experiments]);

  const inventoryMix = useMemo(() => {
    const healthy = inventory.filter((i) => i.quantity > i.min_required).length;
    const low = inventory.filter((i) => i.quantity <= i.min_required).length;
    return [
      { label: "Healthy stock", value: healthy },
      { label: "At/below minimum", value: low },
    ];
  }, [inventory]);

  const recentActivity = useMemo(
    () =>
      usage.slice(0, 8).map((u) => ({
        id: u.id,
        user: "Lab assistant",
        emoji: "🤖",
        action: u.description || "Logged an action",
        time: new Date(u.created_at).toLocaleString(),
        tone: "ocean",
      })),
    [usage],
  );

  const stats = [
    {
      id: "p",
      label: "Active projects",
      value: String(counts.projects),
      delta: `${counts.ongoing} ongoing`,
      trend: "up" as const,
      accent: "sand" as const,
      icon: "🍍",
    },
    {
      id: "i",
      label: "Inventory SKUs",
      value: String(counts.inventory),
      delta: `${counts.lowStock} at/below min`,
      trend: "up" as const,
      accent: "ocean" as const,
      icon: "🧪",
    },
    {
      id: "e",
      label: "Experiment logs",
      value: String(counts.experiments),
      delta: `${counts.successRate}% success`,
      trend: "up" as const,
      accent: "coral" as const,
      icon: "📓",
    },
    {
      id: "a",
      label: "Lab Assistant",
      value: "AI",
      delta: "Planner + 3 agents",
      trend: "up" as const,
      accent: "sand" as const,
      icon: "🤖",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        emoji="🐿️"
        title="Treedome command center"
        subtitle="Track projects, stock, and experiments — with AI helpers when you need them."
        actions={
          <>
            <a className="btn-ghost" href="/assistant">
              Open Assistant
            </a>
            <a className="btn-primary" href="/projects">
              + New project
            </a>
          </>
        }
      />

      {loadError && (
        <div className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-900 dark:border-coral-500/30 dark:bg-coral-900/20 dark:text-coral-100">
          {loadError}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.id} {...s} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard
          title="Weekly experiment runs"
          subtitle="Real data from experiment logs"
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={experimentSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="pattyGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffcf1f" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#ffcf1f" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="drinkGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2badf7" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#2badf7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(10,143,216,0.15)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#0a8fd8" />
              <YAxis tickLine={false} axisLine={false} stroke="#0a8fd8" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#f5b301", strokeWidth: 2 }} />
              <Area
                type="monotone"
                dataKey="runs"
                name="Runs"
                stroke="#d69100"
                strokeWidth={3}
                fill="url(#pattyGrad)"
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="successful"
                name="Successful"
                stroke="#0a8fd8"
                strokeWidth={3}
                fill="url(#drinkGrad)"
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Inventory health" subtitle="Current stock posture">
          <ul className="space-y-3 text-sm font-semibold">
            {inventoryMix.map((row) => (
              <li key={row.label} className="flex items-center justify-between rounded-xl border border-white/50 bg-white/60 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <span>{row.label}</span>
                <span className="font-heading text-xl">{row.value}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityFeed items={recentActivity} />
        </div>

        <aside className="coral-card p-6">
          <div>
            <span className="chip bg-white/70 text-coral-700">📌 Operational focus</span>
            <h3 className="mt-3 font-heading text-2xl leading-tight">Priority checkpoints</h3>
            <ul className="mt-3 space-y-2 text-sm font-semibold">
              <li>Ongoing projects: {counts.ongoing}</li>
              <li>Low stock alerts: {counts.lowStock}</li>
              <li>Experiment success rate: {counts.successRate}%</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
