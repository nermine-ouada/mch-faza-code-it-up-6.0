import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import ProjectCard, { type ProjectCardModel } from "../components/ProjectCard";
import { apiFetch, apiJson } from "../lib/api";
import { nextDemoProject } from "../lib/demoData";

type ApiProject = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  priority: number;
  created_at: string;
  deadline?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  tags?: string[] | null;
};

function normalizeStatus(status: string): "planned" | "ongoing" | "completed" {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "done" || s === "closed") return "completed";
  if (s === "ongoing" || s === "in_progress" || s === "in-progress" || s === "active" || s === "running") {
    return "ongoing";
  }
  return "planned";
}

const FILTERS = [
  { id: "all", label: "All", emoji: "🍍" },
  { id: "planned", label: "Planned", emoji: "📋" },
  { id: "ongoing", label: "Ongoing", emoji: "🛠️" },
  { id: "completed", label: "Completed", emoji: "✅" },
];

function toCard(p: ApiProject): ProjectCardModel {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: normalizeStatus(p.status),
    priority: p.priority,
    tag: (p.tags && p.tags[0]) || "Lab",
    deadline: p.deadline,
    startDate: p.start_date,
    endDate: p.end_date,
  };
}

export default function Projects() {
  const [items, setItems] = useState<ApiProject[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiProject | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "planned",
    priority: 1,
    deadline: "",
    start_date: "",
    end_date: "",
  });

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiJson<ApiProject[]>("/api/projects");
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      const okFilter = filter === "all" || normalizeStatus(p.status) === filter;
      const okQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q);
      return okFilter && okQ;
    });
  }, [items, filter, query]);

  const openCreate = () => {
    setEditing(null);
    const demo = nextDemoProject();
    setForm({
      name: demo.name,
      description: demo.description,
      status: demo.status,
      priority: demo.priority,
      deadline: demo.deadline,
      start_date: demo.start_date,
      end_date: demo.end_date,
    });
    setModalOpen(true);
  };

  const fillDemo = () => {
    const demo = nextDemoProject();
    setForm({
      name: demo.name,
      description: demo.description,
      status: demo.status,
      priority: demo.priority,
      deadline: demo.deadline,
      start_date: demo.start_date,
      end_date: demo.end_date,
    });
  };

  const clearForm = () => {
    setForm({ name: "", description: "", status: "planned", priority: 1, deadline: "", start_date: "", end_date: "" });
  };

  const openEdit = (card: ProjectCardModel) => {
    const p = items.find((x) => x.id === card.id);
    if (!p) return;
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      status: normalizeStatus(p.status),
      priority: p.priority,
      deadline: p.deadline || "",
      start_date: p.start_date || "",
      end_date: p.end_date || "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      if (editing) {
        await apiJson(`/api/projects/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name,
            description: form.description || null,
            status: form.status,
            priority: form.priority,
            deadline: form.deadline || null,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
          }),
        });
      } else {
        await apiJson("/api/projects", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            description: form.description || null,
            status: form.status,
            priority: form.priority,
            deadline: form.deadline || null,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
          }),
        });
      }
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (card: ProjectCardModel) => {
    if (!card.id) return;
    const ok = window.confirm(
      `Delete project “${card.name}”?\n\nThis will permanently remove it and any references in experiments. This action cannot be undone.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/projects/${card.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        emoji="🍍"
        title="Research projects"
        subtitle="Plan lab work, track status, and keep Bikini Bottom-grade documentation."
        actions={
          <>
            <button type="button" className="btn-ghost" onClick={() => void load()} disabled={busy}>
              Refresh
            </button>
            <button type="button" className="btn-primary" onClick={openCreate} disabled={busy}>
              + New project
            </button>
          </>
        }
      />

      {error && (
        <div className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-900 dark:border-coral-500/30 dark:bg-coral-900/20 dark:text-coral-100">
          {error}
        </div>
      )}

      <div className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
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
          <h3 className="font-heading text-2xl text-ocean-800 dark:text-sand-200">No projects yet</h3>
          <p className="mt-1 text-sm font-semibold text-ocean-700/80 dark:text-ocean-100/70">
            Create one to start your Treedome research board.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={toCard(p)} onEdit={openEdit} onDelete={remove} />
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ocean-900/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-3xl border border-white/60 bg-white p-6 shadow-bubble dark:border-white/10 dark:bg-night-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl text-ocean-900 dark:text-sand-100">
                  {editing ? "Edit project" : "New project"}
                </h3>
                {!editing && (
                  <p className="mt-1 text-xs font-semibold text-ocean-600 dark:text-ocean-200/70">
                    Pre-filled with demo data — Save to test, or edit fields first.
                  </p>
                )}
              </div>
              {!editing && (
                <div className="flex flex-none gap-2">
                  <button type="button" className="btn-ghost !px-2 !py-1 !text-xs" onClick={fillDemo}>
                    Re-fill demo
                  </button>
                  <button type="button" className="btn-ghost !px-2 !py-1 !text-xs" onClick={clearForm}>
                    Clear
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                Name
                <input
                  className="input mt-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                Description
                <textarea
                  className="input mt-1 resize-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                  Status
                  <select
                    className="input mt-1"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="planned">planned</option>
                    <option value="ongoing">ongoing</option>
                    <option value="completed">completed</option>
                  </select>
                </label>
                <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                  Priority
                  <input
                    type="number"
                    min={1}
                    className="input mt-1"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 1 })}
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                  Start date
                  <input
                    type="date"
                    className="input mt-1"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </label>
                <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                  End date
                  <input
                    type="date"
                    className="input mt-1"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </label>
                <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                  Deadline
                  <input
                    type="date"
                    className="input mt-1"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={() => void save()} disabled={busy || !form.name.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
