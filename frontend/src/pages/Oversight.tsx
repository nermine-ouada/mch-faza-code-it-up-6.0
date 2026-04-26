import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { ApiError, apiJson } from "../lib/api";

type Tab = "dashboard" | "usage" | "orchestration";

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

type MonitoringSummary = {
  total_actions: number;
  actions_by_agent: Record<string, number>;
  actions_by_tool: Record<string, number>;
  token_usage: { total_tokens: number; cost_usd: number };
  pending_approvals: number;
  approval_stats: {
    total_requests: number;
    approved: number;
    rejected: number;
    pending: number;
  };
};

type TraceStep = {
  step?: number;
  speaker?: string;
  content?: string;
  tool_calls?: Array<{ name?: string }>;
};

function inferSpeaker(step: TraceStep): string {
  const s = (step.speaker || "").trim().toLowerCase();
  if (s !== "ai") return s;
  const tools = (step.tool_calls || []).map((x) => (x?.name || "").toLowerCase());
  const c = (step.content || "").toLowerCase();
  const researchSignal =
    tools.some((t) => t.includes("web_search") || t.includes("cache_research")) ||
    c.includes("web_search") ||
    c.includes("cache_research") ||
    c.includes("citation") ||
    c.includes("source");
  if (researchSignal) return "research-agent";
  const databaseSignal =
    tools.some((t) => t.includes("propose_select_query") || t.includes("update_project_fields")) ||
    c.includes("sql") ||
    c.includes("select query");
  if (databaseSignal) return "database-agent";
  const inventorySignal =
    tools.some((t) => t.includes("list_low_stock") || t.includes("record_inventory_transaction")) ||
    c.includes("low stock") ||
    c.includes("inventory");
  if (inventorySignal) return "inventory-agent";
  return s;
}

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

function speakerKind(raw?: string): "human" | "planner" | "ai" | "tool" | "agent" | "other" {
  const s = (raw || "").trim().toLowerCase();
  if (s === "human" || s === "user") return "human";
  if (s === "planner") return "planner";
  if (s === "ai") return "ai";
  if (s === "tool") return "tool";
  if (s.endsWith("-agent")) return "agent";
  return "other";
}

function speakerBadgeClass(raw?: string): string {
  const k = speakerKind(raw);
  if (k === "human") return "bg-sand-200 text-sand-900 dark:bg-sand-900/40 dark:text-sand-100";
  if (k === "planner") return "bg-ocean-200 text-ocean-900 dark:bg-ocean-900/40 dark:text-ocean-100";
  if (k === "ai") return "bg-coral-200 text-coral-900 dark:bg-coral-900/40 dark:text-coral-100";
  if (k === "tool") return "bg-seaweed-200 text-seaweed-900 dark:bg-seaweed-900/40 dark:text-seaweed-100";
  if (k === "agent") return "bg-purple-200 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100";
  return "bg-white/70 text-ocean-800 dark:bg-white/10 dark:text-ocean-100";
}

export default function Oversight() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(Date.now());
  const [traceSearch, setTraceSearch] = useState("");
  const [speakerFilter, setSpeakerFilter] = useState<"all" | "human" | "planner" | "ai" | "tool" | "agent">("all");

  const loadUsage = useCallback(async () => {
    const rows = await apiJson<UsageRow[]>("/api/usage/activity?limit=200");
    setUsage(rows);
  }, []);
  const loadMonitoring = useCallback(async () => {
    const stats = await apiJson<MonitoringSummary>("/api/agent/monitoring");
    setMonitoring(stats);
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await Promise.all([loadUsage(), loadMonitoring()]);
      setLastUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [loadUsage, loadMonitoring]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      void (async () => {
        try {
          await Promise.all([loadUsage(), loadMonitoring()]);
          setLastUpdatedAt(Date.now());
        } catch {
          // keep current data; explicit error will show on manual refresh if needed
        }
      })();
    }, 2000);
    return () => window.clearInterval(id);
  }, [live, loadUsage, loadMonitoring]);
  const usageBySession = usage.reduce<Record<string, UsageRow[]>>((acc, row) => {
    const sid =
      (typeof row.action_metadata?.session_id === "string" && row.action_metadata.session_id) || "unspecified";
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(row);
    return acc;
  }, {});

  const orchestrationRows = useMemo(() => {
    const q = traceSearch.trim().toLowerCase();
    const base = usage
      .filter((u) => Array.isArray((u.action_metadata?.orchestration_trace as unknown[] | undefined)))
      .map((u) => {
        const trace = (u.action_metadata?.orchestration_trace as TraceStep[]) || [];
        return { row: u, trace };
      });

    const withSpeaker = speakerFilter === "all"
      ? base
      : base.filter(({ trace }) => trace.some((t) => speakerKind(inferSpeaker(t)) === speakerFilter));
    if (!q) return withSpeaker;
    return withSpeaker.filter(({ row, trace }) => {
      const sid = String(row.action_metadata?.session_id ?? "").toLowerCase();
      if (sid.includes(q)) return true;
      if (String(row.id).includes(q)) return true;
      return trace.some((t) =>
        `${t.speaker || ""} ${t.content || ""} ${(t.tool_calls || []).map((x) => x?.name || "").join(" ")}`
          .toLowerCase()
          .includes(q),
      );
    });
  }, [usage, traceSearch, speakerFilter]);

  const orchestrationSummary = useMemo(() => {
    const eventCount = orchestrationRows.length;
    const stepCount = orchestrationRows.reduce((acc, x) => acc + x.trace.length, 0);
    const sessions = new Set(orchestrationRows.map((x) => String(x.row.action_metadata?.session_id ?? "unspecified"))).size;
    return { eventCount, stepCount, sessions };
  }, [orchestrationRows]);

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
          onClick={() => setTab("dashboard")}
          className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wider transition ${
            tab === "dashboard"
              ? "bg-gradient-to-r from-sand-300 to-coral-300 text-ocean-900 shadow-sun"
              : "glass-pill text-ocean-800 dark:text-ocean-100"
          }`}
        >
          Monitoring dashboard
        </button>
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

      {tab === "dashboard" && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-bold uppercase tracking-wider text-coral-500">Total actions</p>
              <p className="mt-1 font-heading text-3xl text-ocean-900 dark:text-sand-100">
                {monitoring?.total_actions ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-bold uppercase tracking-wider text-coral-500">Pending approvals</p>
              <p className="mt-1 font-heading text-3xl text-ocean-900 dark:text-sand-100">
                {monitoring?.pending_approvals ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-bold uppercase tracking-wider text-coral-500">Token usage</p>
              <p className="mt-1 font-heading text-3xl text-ocean-900 dark:text-sand-100">
                {monitoring?.token_usage?.total_tokens ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-bold uppercase tracking-wider text-coral-500">Estimated cost (USD)</p>
              <p className="mt-1 font-heading text-3xl text-ocean-900 dark:text-sand-100">
                {(monitoring?.token_usage?.cost_usd ?? 0).toFixed(4)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-bold uppercase tracking-wider text-coral-500">Actions by agent</p>
              <ul className="mt-2 space-y-2 text-sm font-semibold">
                {Object.entries(monitoring?.actions_by_agent || {}).map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between rounded-lg border border-white/40 bg-white/60 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                    <span>{k}</span>
                    <span className="font-heading text-xl">{v}</span>
                  </li>
                ))}
                {Object.keys(monitoring?.actions_by_agent || {}).length === 0 && (
                  <li className="text-ocean-700/80 dark:text-ocean-100/80">No agent activity yet.</li>
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-bold uppercase tracking-wider text-coral-500">Actions by tool</p>
              <ul className="mt-2 space-y-2 text-sm font-semibold">
                {Object.entries(monitoring?.actions_by_tool || {}).map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between rounded-lg border border-white/40 bg-white/60 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                    <span>{k}</span>
                    <span className="font-heading text-xl">{v}</span>
                  </li>
                ))}
                {Object.keys(monitoring?.actions_by_tool || {}).length === 0 && (
                  <li className="text-ocean-700/80 dark:text-ocean-100/80">No tool activity yet.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-bold uppercase tracking-wider text-coral-500">Approval stats</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-white/40 bg-white/60 p-2 text-center dark:border-white/10 dark:bg-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider">Total</p>
                <p className="font-heading text-2xl">{monitoring?.approval_stats?.total_requests ?? 0}</p>
              </div>
              <div className="rounded-lg border border-white/40 bg-white/60 p-2 text-center dark:border-white/10 dark:bg-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider">Approved</p>
                <p className="font-heading text-2xl">{monitoring?.approval_stats?.approved ?? 0}</p>
              </div>
              <div className="rounded-lg border border-white/40 bg-white/60 p-2 text-center dark:border-white/10 dark:bg-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider">Rejected</p>
                <p className="font-heading text-2xl">{monitoring?.approval_stats?.rejected ?? 0}</p>
              </div>
              <div className="rounded-lg border border-white/40 bg-white/60 p-2 text-center dark:border-white/10 dark:bg-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider">Pending</p>
                <p className="font-heading text-2xl">{monitoring?.approval_stats?.pending ?? 0}</p>
              </div>
            </div>
          </div>
        </section>
      )}

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
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-white/5">
              Events: <span className="font-heading text-lg">{orchestrationSummary.eventCount}</span>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-white/5">
              Steps: <span className="font-heading text-lg">{orchestrationSummary.stepCount}</span>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-white/5">
              Sessions: <span className="font-heading text-lg">{orchestrationSummary.sessions}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              className="input flex-1"
              value={traceSearch}
              onChange={(e) => setTraceSearch(e.target.value)}
              placeholder="Filter by session, event id, speaker, content, tool..."
            />
            <select
              className="input sm:w-56"
              value={speakerFilter}
              onChange={(e) => setSpeakerFilter(e.target.value as typeof speakerFilter)}
            >
              <option value="all">All speakers</option>
              <option value="human">Human</option>
              <option value="planner">Planner</option>
              <option value="ai">AI</option>
              <option value="tool">Tool</option>
              <option value="agent">Specialist agent</option>
            </select>
          </div>
          <ul className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {orchestrationRows.map(({ row: u, trace }) => {
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
                          <div key={`${u.id}-${i}`} className="rounded-xl border border-white/40 bg-white/60 p-3 text-xs dark:border-white/10 dark:bg-white/5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-bold text-ocean-800 dark:text-ocean-100">
                                Step {t.step ?? i + 1}
                              </p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${speakerBadgeClass(inferSpeaker(t))}`}>
                                {prettySpeakerLabel(inferSpeaker(t))}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] font-semibold text-coral-600 dark:text-coral-300">
                              {speakerHint(inferSpeaker(t))}
                            </p>
                            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-white/40 bg-white/70 p-2 text-ocean-800 dark:border-white/10 dark:bg-night-900/60 dark:text-sand-100">
                              {t.content || "No content"}
                            </pre>
                            {Array.isArray(t.tool_calls) && t.tool_calls.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {t.tool_calls.map((x, idx) => (
                                  <span key={`${u.id}-${i}-tool-${idx}`} className="rounded-full bg-seaweed-200 px-2 py-0.5 text-[10px] font-bold text-seaweed-900 dark:bg-seaweed-900/40 dark:text-seaweed-100">
                                    {x?.name || "tool"}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  </li>
                );
              })}
            {orchestrationRows.length === 0 && !loading && (
              <li className="rounded-xl border border-white/50 bg-white/60 p-4 text-sm font-semibold text-ocean-700 dark:border-white/10 dark:bg-white/5 dark:text-ocean-100/80">
                No orchestration rows match current filters.
              </li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
