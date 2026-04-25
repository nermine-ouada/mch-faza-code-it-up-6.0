import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import ActivityFeed from "../components/ActivityFeed";
import TaskList from "../components/TaskList";

import stats from "../data/stats";
import activities from "../data/activities";
import tasks from "../data/tasks";
import { salesData, trafficData, menuMixData } from "../data/chartData";

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.7)",
  background: "rgba(255,255,255,0.95)",
  boxShadow: "0 10px 25px -10px rgba(10,143,216,0.35)",
  fontFamily: "Nunito, system-ui, sans-serif",
  fontWeight: 700,
  color: "#03385a",
};

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        emoji="🧽"
        title="Welcome back, friend!"
        subtitle="Here's what's cookin' at the Krusty Krab today. Flip a patty, check your crew, and keep Bikini Bottom happy."
        actions={
          <>
            <button className="btn-ghost">Export</button>
            <button className="btn-primary">+ New Order</button>
          </>
        }
      />

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.id} {...s} />
        ))}
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard
          title="Weekly Sales"
          subtitle="Patties & drinks"
          className="xl:col-span-2"
          action={
            <div className="flex gap-2">
              <span className="chip bg-sand-300 text-sand-900">🍔 Patties</span>
              <span className="chip bg-ocean-200 text-ocean-800">🥤 Drinks</span>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                dataKey="patties"
                stroke="#d69100"
                strokeWidth={3}
                fill="url(#pattyGrad)"
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="drinks"
                stroke="#0a8fd8"
                strokeWidth={3}
                fill="url(#drinkGrad)"
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Menu Mix" subtitle="Today's orders">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Pie
                data={menuMixData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={3}
              >
                {menuMixData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard
          title="Hourly Traffic"
          subtitle="Visitors today"
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trafficData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f73d66" />
                  <stop offset="100%" stopColor="#ff8aa0" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(10,143,216,0.15)" />
              <XAxis dataKey="hour" tickLine={false} axisLine={false} stroke="#0a8fd8" />
              <YAxis tickLine={false} axisLine={false} stroke="#0a8fd8" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(247,61,102,0.08)" }} />
              <Bar dataKey="visitors" fill="url(#barGrad)" radius={[10, 10, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <TaskList tasks={tasks} />
      </section>

      {/* Activity + shoutout */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityFeed items={activities} />
        </div>

        <aside className="coral-card flex flex-col justify-between p-6">
          <div>
            <span className="chip bg-white/70 text-coral-700">🌟 Shoutout</span>
            <h3 className="mt-3 font-heading text-2xl leading-tight">
              Employee of the Month
            </h3>
            <p className="mt-2 text-sm font-semibold opacity-80">
              For 127 perfectly flipped Krabby Patties and an unbeatable attitude.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white text-4xl shadow-bubble animate-bobble">
              🧽
            </div>
            <div>
              <p className="font-heading text-xl">SpongeBob</p>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                Fry Cook Extraordinaire
              </p>
            </div>
          </div>

          <button className="btn-primary mt-6 w-full">Send high five 🖐️</button>
        </aside>
      </section>
    </div>
  );
}
