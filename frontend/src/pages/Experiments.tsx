import React, { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { apiFetch, apiJson } from "../lib/api";
import { nextDemoExperiment } from "../lib/demoData";

type Row = {
  id: number;
  project_id: number | null;
  result: string | null;
  success: boolean | null;
  notes: string | null;
  created_at: string;
};

type Project = { id: number; name: string };

export default function Experiments() {
  const [rows, setRows] = useState<Row[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    project_id: "" as string | number,
    result: "",
    success: "" as "" | "true" | "false",
    notes: "",
  });

  const load = useCallback(async () => {
    setError(null);
    try {
      const [e, p] = await Promise.all([
        apiJson<Row[]>("/api/experiments"),
        apiJson<Project[]>("/api/projects"),
      ]);
      setRows(e);
      setProjects(p);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    const firstProjectId = projects[0]?.id ?? null;
    setForm(nextDemoExperiment(firstProjectId));
    setModal(true);
  };

  const fillDemo = () => {
    const firstProjectId = projects[0]?.id ?? null;
    setForm(nextDemoExperiment(firstProjectId));
  };

  const clearForm = () => {
    setForm({ project_id: "", result: "", success: "", notes: "" });
  };

  const openEdit = (r: Row) => {
    setEditing(r);
    setForm({
      project_id: r.project_id ?? "",
      result: r.result || "",
      success: r.success === true ? "true" : r.success === false ? "false" : "",
      notes: r.notes || "",
    });
    setModal(true);
  };

  const payload = () => ({
    project_id: form.project_id === "" ? null : Number(form.project_id),
    result: form.result || null,
    success: form.success === "" ? null : form.success === "true",
    notes: form.notes || null,
  });

  const save = async () => {
    setBusy(true);
    try {
      if (editing) {
        await apiJson(`/api/experiments/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload()),
        });
      } else {
        await apiJson("/api/experiments", {
          method: "POST",
          body: JSON.stringify(payload()),
        });
      }
      setModal(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: Row) => {
    const pname = projects.find((p) => p.id === r.project_id)?.name || "—";
    const ok = window.confirm(
      `Delete this experiment log?\n\nID: ${r.id}\nProject: ${pname}\nLogged: ${new Date(r.created_at).toLocaleString()}\n\nThis action cannot be undone.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/experiments/${r.id}`, { method: "DELETE" });
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
        emoji="📓"
        title="Experiment log"
        subtitle="Record outcomes for each run. Tie entries to a project when it helps traceability."
        actions={
          <>
            <button type="button" className="btn-ghost" onClick={() => void load()} disabled={busy}>
              Refresh
            </button>
            <button type="button" className="btn-primary" onClick={openCreate} disabled={busy}>
              + Log experiment
            </button>
          </>
        }
      />

      {error && (
        <div className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-900 dark:border-coral-500/30 dark:bg-coral-900/20 dark:text-coral-100">
          {error}
        </div>
      )}

      <div className="glass-card overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/50 bg-white/60 text-xs font-black uppercase tracking-widest text-ocean-600 dark:border-white/10 dark:bg-white/5 dark:text-ocean-200/80">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Success</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pname = projects.find((p) => p.id === r.project_id)?.name || "—";
              return (
                <tr key={r.id} className="border-b border-white/40 dark:border-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-ocean-600 dark:text-ocean-300">{r.id}</td>
                  <td className="px-4 py-3 font-semibold text-ocean-900 dark:text-ocean-50">{pname}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-ocean-800 dark:text-ocean-100/90">
                    {r.result || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.success === true ? "yes" : r.success === false ? "no" : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ocean-600 dark:text-ocean-300">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="btn-ghost !px-2 !py-1 !text-xs" onClick={() => openEdit(r)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-2 py-1 text-xs font-bold text-coral-700 hover:bg-coral-100 dark:text-coral-200"
                      onClick={() => void remove(r)}
                    >
                      Del
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ocean-900/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-3xl border border-white/60 bg-white p-6 shadow-bubble dark:border-white/10 dark:bg-night-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl text-ocean-900 dark:text-sand-100">
                  {editing ? "Edit log" : "New experiment log"}
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
                Project (optional)
                <select
                  className="input mt-1"
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                >
                  <option value="">— none —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                Result
                <textarea className="input mt-1 resize-none" rows={3} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} />
              </label>
              <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                Success
                <select
                  className="input mt-1"
                  value={form.success}
                  onChange={(e) => setForm({ ...form, success: e.target.value as "" | "true" | "false" })}
                >
                  <option value="">unknown</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </label>
              <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                Notes
                <textarea className="input mt-1 resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(false)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={() => void save()} disabled={busy}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
