import React, { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { apiFetch, apiJson } from "../lib/api";

type Row = {
  id: number;
  name: string;
  category: string | null;
  quantity: number;
  unit: string | null;
  min_required: number;
  last_updated: string;
};

const DEFAULT_CATEGORY_SUGGESTIONS = ["consumables", "reagent", "equipment", "media", "glassware", "safety"];

export default function Inventory() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<"create" | "edit" | "txn" | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: 0,
    unit: "",
    min_required: 0,
  });
  const [txn, setTxn] = useState({ change_amount: 0, reason: "", txn_type: "adjust" });

  const categorySuggestions = Array.from(
    new Set([
      ...DEFAULT_CATEGORY_SUGGESTIONS,
      ...rows.map((r) => (r.category || "").trim()).filter(Boolean),
    ]),
  ).sort((a, b) => a.localeCompare(b));

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiJson<Row[]>("/api/inventory");
      setRows(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", category: "", quantity: 0, unit: "", min_required: 0 });
    setModal("create");
  };

  const openEdit = (r: Row) => {
    setEditing(r);
    setForm({
      name: r.name,
      category: r.category || "",
      quantity: r.quantity,
      unit: r.unit || "",
      min_required: r.min_required,
    });
    setModal("edit");
  };

  const openTxn = (r: Row) => {
    setEditing(r);
    setTxn({ change_amount: 0, reason: "", txn_type: "adjust" });
    setModal("txn");
  };

  const saveItem = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      if (editing && modal === "edit") {
        await apiJson(`/api/inventory/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name,
            category: form.category || null,
            quantity: form.quantity,
            unit: form.unit || null,
            min_required: form.min_required,
          }),
        });
      } else {
        await apiJson("/api/inventory", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            category: form.category || null,
            quantity: form.quantity,
            unit: form.unit || null,
            min_required: form.min_required,
          }),
        });
      }
      setModal(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const saveTxn = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await apiJson("/api/inventory/transactions", {
        method: "POST",
        body: JSON.stringify({
          inventory_id: editing.id,
          change_amount: txn.change_amount,
          reason: txn.reason || "adjustment",
          txn_type: txn.txn_type,
        }),
      });
      setModal(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: Row) => {
    if (!window.confirm(`Delete “${r.name}”?`)) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/inventory/${r.id}`, { method: "DELETE" });
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
        emoji="🧪"
        title="Inventory"
        subtitle="Track reagents and gear. Stock changes go through transactions so quantities stay honest."
        actions={
          <>
            <button type="button" className="btn-ghost" onClick={() => void load()} disabled={busy}>
              Refresh
            </button>
            <button type="button" className="btn-primary" onClick={openCreate} disabled={busy}>
              + Add item
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Min</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const low = r.quantity <= r.min_required;
              return (
                <tr
                  key={r.id}
                  className={`border-b border-white/40 dark:border-white/5 ${
                    low ? "bg-coral-500/10" : "bg-transparent"
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-ocean-900 dark:text-ocean-50">{r.name}</td>
                  <td className="px-4 py-3 text-ocean-700 dark:text-ocean-100/80">{r.category || "—"}</td>
                  <td className="px-4 py-3">{r.quantity}</td>
                  <td className="px-4 py-3">{r.min_required}</td>
                  <td className="px-4 py-3">{r.unit || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="btn-ghost !px-2 !py-1 !text-xs" onClick={() => openTxn(r)}>
                      Stock
                    </button>
                    <button type="button" className="btn-ghost !px-2 !py-1 !text-xs" onClick={() => openEdit(r)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-2 py-1 text-xs font-bold text-coral-700 hover:bg-coral-100 dark:text-coral-200 dark:hover:bg-coral-900/40"
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
            {modal === "txn" && editing ? (
              <>
                <h3 className="font-heading text-xl text-ocean-900 dark:text-sand-100">
                  Stock change — {editing.name}
                </h3>
                <p className="mt-1 text-xs font-semibold text-ocean-600 dark:text-ocean-200/70">
                  Creates a ledger row; trigger updates total quantity.
                </p>
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                    Change (+/-)
                    <input
                      type="number"
                      className="input mt-1"
                      value={txn.change_amount}
                      onChange={(e) => setTxn({ ...txn, change_amount: Number(e.target.value) })}
                    />
                  </label>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                    Reason
                    <input
                      className="input mt-1"
                      value={txn.reason}
                      onChange={(e) => setTxn({ ...txn, reason: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                    Type
                    <select
                      className="input mt-1"
                      value={txn.txn_type}
                      onChange={(e) => setTxn({ ...txn, txn_type: e.target.value })}
                    >
                      <option value="in">in</option>
                      <option value="out">out</option>
                      <option value="adjust">adjust</option>
                      <option value="expired">expired</option>
                    </select>
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" className="btn-ghost" onClick={() => setModal(null)} disabled={busy}>
                    Cancel
                  </button>
                  <button type="button" className="btn-primary" onClick={() => void saveTxn()} disabled={busy}>
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-heading text-xl text-ocean-900 dark:text-sand-100">
                  {modal === "edit" ? "Edit item" : "New item"}
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80 sm:col-span-2">
                    Name
                    <input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </label>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                    Category
                    <input
                      className="input mt-1"
                      list="inventory-category-suggestions"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="e.g. reagent"
                    />
                    <datalist id="inventory-category-suggestions">
                      {categorySuggestions.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </label>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                    Unit
                    <input className="input mt-1" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                  </label>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                    Quantity
                    <input
                      type="number"
                      className="input mt-1"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    />
                  </label>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ocean-700 dark:text-ocean-200/80">
                    Min required
                    <input
                      type="number"
                      className="input mt-1"
                      value={form.min_required}
                      onChange={(e) => setForm({ ...form, min_required: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" className="btn-ghost" onClick={() => setModal(null)} disabled={busy}>
                    Cancel
                  </button>
                  <button type="button" className="btn-primary" onClick={() => void saveItem()} disabled={busy}>
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
