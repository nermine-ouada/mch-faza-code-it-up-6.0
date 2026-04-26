import React, { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { ApiError, apiJson } from "../lib/api";

type Tab = "usage" | "orchestration";

type UsageRow = {
  id: number;
  action_type: string | null;
  description: string | null;
  agent: string | null;
  created_at: string;
  action_metadata?: Record<string, unknown> | null;
  tokens?: number | null;
  cost_usd?: string | null;
};

function prettySpeakerLabel(raw?: string): string {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return "Agent";
  if (s === "human" || s === "user") return "Human";
  if (s === "planner") return "Planner";
  if (s === "ai") return "AI model (planner thought/response)";
  if (s === "tool") return "Tool runtime (function execution)";
  if (s === "research-agent") return "Research agent";
  if (s === "database-agent") return "Database agent";
  if (s === "inventory-agent") return "Inventory agent";
  return s.replace(/-/g, " ");
}

function speakerHint(raw?: string): string {
  const s = (raw || "").trim().toLowerCase();
  if (s === "human" || s === "user") return "Your prompt/input.";
  if (s === "planner") return "Orchestrator deciding which subagent/tool to use.";
  if (s === "ai") return "Raw model output step (often planner-level).";
  if (s === "tool") return "Result returned by a called tool.";
  if (s.endsWith("-agent")) return "Specialist subagent action.";
  return "Agent orchestration step.";
}

export default function Oversight() {
  const [tab, setTab] = useState<Tab>("usage");
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(Date.now());

  const loadUsage = useCallback(async () => {
    const rows = await apiJson<UsageRow[]>("/api/usage/activity?limit=200");
    setUsage(rows);
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await loadUsage();
      setLastUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [loadUsage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      void (async () => {
        try {
          await loadUsage();
          setLastUpdatedAt(Date.now());
        } catch {
          // keep current data; explicit error will show on manual refresh if needed
        }
      })();
    }, 2000);
    return () => window.clearInterval(id);
  }, [live, loadUsage]);
  const usageBySession = usage.reduce<Record<string, UsageRow[]>>((acc, row) => {
    const sid =
      (typeof row.action_metadata?.session_id === "string" && row.action_metadata.session_id) || "unspecified";
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        emoji="🛡️"
        title="AI oversight"
        subtitle="Monitor assistant activity and orchestration traces for supervised AI operations."
        actions={
          <div className="flex items-center gap-2">
            <button type="button" className="btn-primary" onClick={() => void refresh()} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button
              type="button"
              className={`btn-ghost ${live ? "border border-seaweed-400/50 text-seaweed-700 dark:text-seaweed-300" : ""}`}
              onClick={() => setLive((v) => !v)}
            >
              {live ? "Live ON" : "Live OFF"}
            </button>
          </div>
        }
      />
      <p className="text-xs font-semibold text-ocean-600 dark:text-ocean-200/80">
        Last updated: {new Date(lastUpdatedAt).toLocaleTimeString()}
      </p>

      {error && (
        <div className="rounded-2xl border border-coral-400/60 bg-coral-100/50 px-4 py-3 text-sm font-semibold text-coral-900 dark:bg-coral-950/40 dark:text-coral-100">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("usage")}
          className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wider transition ${
            tab === "usage"
              ? "bg-gradient-to-r from-sand-300 to-coral-300 text-ocean-900 shadow-sun"
              : "glass-pill text-ocean-800 dark:text-ocean-100"
          }`}
        >
          AI usage log
        </button>
        <button
          type="button"
          onClick={() => setTab("orchestration")}
          className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wider transition ${
            tab === "orchestration"
              ? "bg-gradient-to-r from-sand-300 to-coral-300 text-ocean-900 shadow-sun"
              : "glass-pill text-ocean-800 dark:text-ocean-100"
          }`}
        >
          Agent orchestration
        </button>
      </div>

      {tab === "usage" && (
        <section className="glass-card p-5 sm:p-6">
          <h3 className="font-heading text-xl text-ocean-800 dark:text-sand-200">Planner streams</h3>
          <p className="mt-1 text-sm font-semibold text-ocean-700/80 dark:text-ocean-100/70">
            Each row is recorded when someone calls <code className="rounded bg-white/60 px-1 dark:bg-white/10">POST /api/chat/stream</code>. Hook{" "}
            <code className="rounded bg-white/60 px-1 dark:bg-white/10">USAGE_WEBHOOK_URL</code> to forward copies to a small reporter service (see{" "}
            <code className="rounded bg-white/60 px-1 dark:bg-white/10">services/usage-reporter</code>).
          </p>
          <ul className="mt-4 max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {usage.length === 0 && !loading && (
              <li className="text-sm font-semibold text-ocean-600 dark:text-ocean-200/80">No stream events yet.</li>
            )}
            {Object.entries(usageBySession).map(([sessionId, rows]) => (
              <li key={sessionId} className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <details>
                  <summary className="cursor-pointer text-sm font-bold text-ocean-900 dark:text-sand-100">
                    Session {sessionId} ({rows.length} request{rows.length > 1 ? "s" : ""})
                  </summary>
                  <ul className="mt-3 space-y-3">
                    {rows.map((u) => (
                      <li key={u.id} className="rounded-xl border border-white/40 bg-white/50 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-heading text-ocean-900 dark:text-sand-100">#{u.id}</span>
                          <span className="text-xs font-bold uppercase tracking-widest text-coral-500">
                            {new Date(u.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-2 font-semibold text-ocean-800 dark:text-ocean-100">{u.description}</p>
                        <p className="mt-1 text-xs text-ocean-600 dark:text-ocean-200/80">
                          model: {String(u.action_metadata?.model ?? "—")} · prompt chars:{" "}
                          {String(u.action_metadata?.prompt_chars ?? "—")} · updates:{" "}
                          {String(u.action_metadata?.update_count ?? "—")}
                        </p>
                        {typeof u.action_metadata?.response_text === "string" && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-bold text-seaweed-700 dark:text-seaweed-300">
                              Show response
                            </summary>
                            <pre className="mt-2 max-h-56 overflow-auto rounded-xl bg-night-900/90 p-3 text-xs text-sand-100">
                              {u.action_metadata.response_text}
                            </pre>
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "orchestration" && (
        <section className="glass-card p-5 sm:p-6">
          <h3 className="font-heading text-xl text-ocean-800 dark:text-sand-200">Agent orchestration timeline</h3>
          <p className="mt-1 text-sm font-semibold text-ocean-700/80 dark:text-ocean-100/70">
            Observe how planner and subagents coordinate per session.
          </p>
          <div className="mt-3 rounded-2xl border border-white/50 bg-white/60 p-3 text-xs font-semibold text-ocean-700 dark:border-white/10 dark:bg-white/5 dark:text-ocean-100/80">
            <p className="font-bold uppercase tracking-wider text-coral-500">Trace labels</p>
            <p className="mt-1">
              <strong>Human</strong>: your input · <strong>Planner</strong>: orchestrator · <strong>AI</strong>: model text step ·{" "}
              <strong>Tool</strong>: function execution output · <strong>*-agent</strong>: specialist subagent (research/database/inventory).
            </p>
          </div>
          <ul className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {usage
              .filter((u) => Array.isArray((u.action_metadata?.orchestration_trace as unknown[] | undefined)))
              .map((u) => {
                const trace = (u.action_metadata?.orchestration_trace as Array<{
                  step?: number;
                  speaker?: string;
                  content?: string;
                  tool_calls?: Array<{ name?: string }>;
                }>) || [];
                return (
                  <li key={`orch-${u.id}`} className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-heading text-ocean-900 dark:text-sand-100">
                        Session {String(u.action_metadata?.session_id ?? "unspecified")} · event #{u.id}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-coral-500">
                        {new Date(u.created_at).toLocaleString()}
                      </span>
                    </div>
                    <details className="mt-2" open>
                      <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-ocean-600 dark:text-ocean-200/80">
                        {trace.length} orchestration step{trace.length === 1 ? "" : "s"}
                      </summary>
                      <div className="mt-2 space-y-2">
                        {trace.slice(0, 30).map((t, i) => (
                          <div key={`${u.id}-${i}`} className="rounded-xl border border-white/40 bg-white/60 p-2 text-xs dark:border-white/10 dark:bg-white/5">
                            <p className="font-bold text-ocean-800 dark:text-ocean-100">
                              {t.step ?? i + 1}. {prettySpeakerLabel(t.speaker)}
                            </p>
                            <p className="mt-0.5 text-[11px] font-semibold text-coral-600 dark:text-coral-300">
                              {speakerHint(t.speaker)}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-ocean-700 dark:text-ocean-100/80">
                              {t.content || "No content"}
                            </p>
                            {Array.isArray(t.tool_calls) && t.tool_calls.length > 0 && (
                              <p className="mt-1 text-seaweed-700 dark:text-seaweed-300">
                                tools: {t.tool_calls.map((x) => x?.name || "tool").join(", ")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  </li>
                );
              })}
          </ul>
        </section>
      )}
    </div>
  );
}
