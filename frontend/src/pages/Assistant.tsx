import React, { useCallback, useRef, useState, type ReactNode } from "react";
import PageHeader from "../components/PageHeader";
import { apiFetch, apiJson } from "../lib/api";

type ChatLine = {
  id: string;
  role: "user" | "assistant";
  agent?: string;
  orchestratedBy?: string;
  content: string;
};

const LIVE = import.meta.env.VITE_LIVE_AGENT === "true";
const USE_DEEPAGENT = import.meta.env.VITE_AGENT_ARCH === "deepagent";
const SESSION_KEY = "lab_assistant_session_id";

function makeSessionId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function getOrCreateSessionId(): string {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = makeSessionId();
  localStorage.setItem(SESSION_KEY, next);
  return next;
}

function parseApprovalIntent(text: string): boolean | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  const approve = new Set(["yes", "y", "approve", "approved", "ok", "okay", "proceed", "confirm", "run it"]);
  const reject = new Set(["no", "n", "reject", "rejected", "cancel", "stop", "deny"]);
  if (approve.has(t)) return true;
  if (reject.has(t)) return false;
  return null;
}

function renderInlineBold(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={`b-${i}`}>{part.slice(2, -2)}</strong>
      ) : (
        <React.Fragment key={`t-${i}`}>{part}</React.Fragment>
      ),
    );
}

function renderAssistantContent(content: string): ReactNode {
  const lines = (content || "").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;

  const isTableHeader = (idx: number) =>
    idx + 1 < lines.length &&
    lines[idx].includes("|") &&
    /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[idx + 1] || "");

  while (i < lines.length) {
    if (isTableHeader(i)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const normalizeRow = (row: string) =>
        row
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());
      const headers = normalizeRow(tableLines[0] || "");
      const rows = tableLines.slice(2).map(normalizeRow).filter((r) => r.length > 0);
      blocks.push(
        <div key={`tbl-${i}`} className="overflow-x-auto rounded-xl border border-white/40 bg-white/50 p-2 dark:border-white/10 dark:bg-white/5">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr>
                {headers.map((h, idx) => (
                  <th key={`h-${idx}`} className="px-2 py-1 font-black uppercase tracking-wider text-ocean-700 dark:text-ocean-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ridx) => (
                <tr key={`r-${ridx}`} className="border-t border-white/30 dark:border-white/10">
                  {r.map((c, cidx) => (
                    <td key={`c-${ridx}-${cidx}`} className="px-2 py-1 align-top text-ocean-800 dark:text-ocean-100">
                      {renderInlineBold(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const line = lines[i];
    if (!line.trim()) {
      blocks.push(<div key={`sp-${i}`} className="h-2" />);
      i += 1;
      continue;
    }
    const bullet = /^(\-|\•)\s+/.test(line);
    blocks.push(
      <p key={`ln-${i}`} className={bullet ? "pl-3" : ""}>
        {bullet ? "• " : ""}
        {renderInlineBold(line.replace(/^(\-|\•)\s+/, ""))}
      </p>,
    );
    i += 1;
  }

  return <div className="space-y-1 whitespace-pre-wrap leading-relaxed">{blocks}</div>;
}

function summarizeUpdate(update: unknown): string[] {
  const out: string[] = [];
  if (!update) return out;
  if (typeof update === "string") {
    out.push(update);
    return out;
  }
  if (typeof update !== "object") {
    out.push(String(update));
    return out;
  }
  const obj = update as Record<string, unknown>;
  if (typeof obj.meta === "string") out.push(obj.meta);

  for (const [agentName, payload] of Object.entries(obj)) {
    if (agentName === "meta") continue;
    if (!payload || typeof payload !== "object") {
      out.push(`${agentName}: ${String(payload)}`);
      continue;
    }
    const p = payload as Record<string, unknown>;
    if (typeof p.message === "string") {
      out.push(`${agentName}: ${p.message}`);
    }
    if (typeof p.next_step === "string") {
      out.push(`${agentName} next: ${p.next_step}`);
    }
    if (typeof p.proposal_id === "number") {
      out.push(`${agentName}: SQL proposal #${p.proposal_id}`);
    }
    if (typeof p.sql === "string") {
      out.push(`${agentName} SQL: ${p.sql}`);
    }
    if (typeof p.reply === "string") {
      out.push(`${agentName}: ${p.reply.slice(0, 320)}`);
    }
    if (typeof p.model === "string") {
      out.push(`${agentName} model: ${p.model}`);
    }
    const msgs = Array.isArray(p.messages) ? p.messages : [];
    if (msgs.length > 0) {
      const last = msgs[msgs.length - 1] as Record<string, unknown>;
      const role = typeof last.role === "string" ? last.role : "assistant";
      const content = typeof last.content === "string" ? last.content : "";
      if (content) out.push(`${agentName} (${role}): ${content.slice(0, 220)}`);
      else out.push(`${agentName}: emitted ${msgs.length} message(s)`);
      continue;
    }
    if (typeof p.error === "string") {
      out.push(`${agentName} error: ${p.error}`);
      continue;
    }
    out.push(`${agentName}: update received`);
  }
  return out;
}

function pickActiveAgentFromTrace(
  trace?: Array<{
    step?: number;
    speaker?: string;
    content?: string;
    tool_calls?: Array<{ name?: string }>;
  }>,
): string {
  if (!Array.isArray(trace) || trace.length === 0) return "planner";
  const mapToolToAgent = (toolName: string): string | null => {
    const t = toolName.toLowerCase();
    if (t.includes("web_search") || t.includes("cache_research")) return "research-agent";
    if (t.includes("propose_select_query") || t.includes("update_project_fields")) return "database-agent";
    if (t.includes("list_low_stock") || t.includes("record_inventory_transaction")) return "inventory-agent";
    return null;
  };

  // Strongest signal: explicit specialist speaker.
  for (let i = trace.length - 1; i >= 0; i -= 1) {
    const speaker = (trace[i]?.speaker || "").toString().trim().toLowerCase();
    if (!speaker || speaker === "human" || speaker === "user") continue;
    if (speaker === "planner" || speaker === "ai" || speaker === "tool") continue;
    if (speaker.endsWith("-agent")) return speaker;
  }

  // Secondary signal: tool calls imply specialist ownership.
  for (let i = trace.length - 1; i >= 0; i -= 1) {
    const calls = Array.isArray(trace[i]?.tool_calls) ? trace[i]!.tool_calls! : [];
    for (let j = calls.length - 1; j >= 0; j -= 1) {
      const name = (calls[j]?.name || "").trim();
      if (!name) continue;
      const mapped = mapToolToAgent(name);
      if (mapped) return mapped;
    }
  }

  // Tertiary signal: content mentions research tools/intent.
  for (let i = trace.length - 1; i >= 0; i -= 1) {
    const content = (trace[i]?.content || "").toLowerCase();
    if (!content) continue;
    if (content.includes("web_search") || content.includes("cache_research") || content.includes("citations")) {
      return "research-agent";
    }
    if (content.includes("propose_select_query") || content.includes("select") || content.includes("sql proposal")) {
      return "database-agent";
    }
    if (content.includes("low stock") || content.includes("inventory transaction")) {
      return "inventory-agent";
    }
  }

  // Last fallback: show first non-human speaker (ai/tool) instead of empty.
  for (let i = trace.length - 1; i >= 0; i -= 1) {
    const speaker = (trace[i]?.speaker || "").toString().trim().toLowerCase();
    if (!speaker || speaker === "human" || speaker === "user") continue;
    return speaker;
  }
  return "planner";
}

function runDemoAgents(message: string): ChatLine[] {
  const m = message.toLowerCase();
  const lines: ChatLine[] = [];
  const id = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  lines.push({
    id: id(),
    role: "assistant",
    agent: "Planner",
    content: "Decomposing your request and delegating to specialist agents…",
  });
  if (m.includes("stock") || m.includes("inventory") || m.includes("low")) {
    lines.push({
      id: id(),
      role: "assistant",
      agent: "inventory-agent",
      content:
        "Would run list_low_stock and suggest reorders. In production this hits Postgres via a tool.",
    });
  }
  if (m.includes("sql") || m.includes("project") || m.includes("database") || m.includes("select")) {
    lines.push({
      id: id(),
      role: "assistant",
      agent: "database-agent",
      content:
        "Would submit SELECT proposals for human approval (no direct sql_read in autonomous mode).",
    });
  }
  if (m.includes("research") || m.includes("web") || m.includes("paper") || m.includes("search")) {
    lines.push({
      id: id(),
      role: "assistant",
      agent: "research-agent",
      content: "Would call web_search and cache_research with sources.",
    });
  }
  lines.push({
    id: id(),
    role: "assistant",
    agent: "Planner",
    content:
      "Demo wrap-up: set env VITE_LIVE_AGENT=true and configure backend OpenRouter to stream real planner output from /api/chat/stream.",
  });
  return lines;
}

export default function Assistant() {
  const [lines, setLines] = useState<ChatLine[]>([
    {
      id: "welcome",
      role: "assistant",
      agent: "Planner",
      content:
        "Hi! I'm the Treedome Planner (demo). Ask about inventory, experiments, or research workflows. Live mode uses OpenRouter; database reads go through **AI oversight** for human approval.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const [pendingApproval, setPendingApproval] = useState<{
    sessionId: string;
    details?: Record<string, unknown> | null;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollDown = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const append = useCallback((chunk: ChatLine[]) => {
    setLines((prev) => [...prev, ...chunk]);
    setTimeout(scrollDown, 50);
  }, []);

  const upsertLine = useCallback((id: string, updater: (prev?: ChatLine) => ChatLine) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return [...prev, updater(undefined)];
      const next = [...prev];
      next[idx] = updater(prev[idx]);
      return next;
    });
    setTimeout(scrollDown, 50);
  }, []);

  const sendLive = async (message: string, activeSessionId: string) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 90000);
    const res = await apiFetch("/api/chat/stream", {
      method: "POST",
      body: JSON.stringify({ message, session_id: activeSessionId }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const t = await res.text();
      window.clearTimeout(timeoutId);
      throw new Error(t || res.statusText);
    }
    const reader = res.body?.getReader();
    if (!reader) {
      window.clearTimeout(timeoutId);
      throw new Error("No response body");
    }
    const dec = new TextDecoder();
    const traceId = `${Date.now()}-trace`;
    let buffer = "";
    let eventCount = 0;
    const stepLines: string[] = [];
    const startedAt = Date.now();
    let lastEventAt = Date.now();

    upsertLine(traceId, () => ({
      id: traceId,
      role: "assistant",
      agent: "stream",
      content: "Streaming agent progress (connecting)...\n",
    }));
    const pulseId = window.setInterval(() => {
      const idleSec = Math.floor((Date.now() - lastEventAt) / 1000);
      if (idleSec < 4) return;
      const totalSec = Math.floor((Date.now() - startedAt) / 1000);
      upsertLine(traceId, () => ({
        id: traceId,
        role: "assistant",
        agent: "stream",
        content:
          `Streaming agent progress (${eventCount} updates)...\n` +
          `Waiting for next update (${idleSec}s idle, ${totalSec}s total)...\n\n` +
          stepLines.join("\n"),
      }));
    }, 1500);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      lastEventAt = Date.now();
      buffer += dec.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const block of parts) {
        for (const line of block.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw) as { update?: unknown };
            eventCount += 1;
            const updates = summarizeUpdate(parsed.update);
            if (updates.length === 0) {
              stepLines.push(`• Update #${eventCount} received`);
            } else {
              for (const entry of updates) {
                stepLines.push(`• ${entry}`);
              }
            }
            upsertLine(traceId, () => ({
              id: traceId,
              role: "assistant",
              agent: "stream",
              content: `Streaming agent progress (${eventCount} updates)...\n\n${stepLines.join("\n")}`,
            }));
          } catch {
            eventCount += 1;
            stepLines.push(`• ${raw.slice(0, 220)}`);
            upsertLine(traceId, () => ({
              id: traceId,
              role: "assistant",
              agent: "stream",
              content: `Streaming agent progress (${eventCount} updates)...\n\n${stepLines.join("\n")}`,
            }));
          }
        }
      }
    }
    window.clearInterval(pulseId);
    window.clearTimeout(timeoutId);
    upsertLine(traceId, (prev) => ({
      ...(prev || { id: traceId, role: "assistant", agent: "stream" }),
      id: traceId,
      role: "assistant",
      agent: "stream",
      content:
        (stepLines.length > 0
          ? `Completed (${eventCount} updates).\n\n${stepLines.join("\n")}`
          : "Completed: no stream updates were emitted."),
    }));
  };

  const sendDemo = async (message: string) => {
    const chunks = runDemoAgents(message);
    for (const line of chunks) {
      append([line]);
      await new Promise((r) => setTimeout(r, 450));
    }
  };

  const sendDeepAgent = async (message: string, activeSessionId: string) => {
    const data = await apiJson<{
      session_id: string;
      response: string;
      pending_approval: boolean;
      approval_details?: Record<string, unknown> | null;
      orchestration_trace?: Array<{
        step?: number;
        speaker?: string;
        content?: string;
        tool_calls?: Array<{ name?: string }>;
      }>;
    }>("/api/agent/chat", {
      method: "POST",
      body: JSON.stringify({ message, session_id: activeSessionId }),
    });
    setSessionId(data.session_id);
    localStorage.setItem(SESSION_KEY, data.session_id);
    append([
      {
        id: `${Date.now()}-a`,
        role: "assistant",
        agent: data.pending_approval ? "database-agent" : pickActiveAgentFromTrace(data.orchestration_trace),
        orchestratedBy: "planner",
        content: data.response || "No response",
      },
    ]);
    if (data.pending_approval) {
      setPendingApproval({ sessionId: data.session_id, details: data.approval_details || null });
    } else {
      setPendingApproval(null);
    }
    // Keep orchestration details out of chat; visible in AI Oversight page.
  };

  const handleApproval = async (approved: boolean) => {
    if (!pendingApproval || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await apiJson<{
        status: string;
        response?: string | null;
        orchestration_trace?: Array<{ step?: number; speaker?: string; content?: string }>;
      }>("/api/agent/approve", {
        method: "POST",
        body: JSON.stringify({ session_id: pendingApproval.sessionId, approved }),
      });
      append([
        {
          id: `${Date.now()}-approval`,
          role: "assistant",
          agent: "database-agent",
          orchestratedBy: "planner",
          content: data.response || `Operation ${data.status}.`,
        },
      ]);
      // Keep orchestration details out of chat; visible in AI Oversight page.
      setPendingApproval(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setBusy(false);
    }
  };

  const onSend = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    setBusy(true);
    append([{ id: `${Date.now()}-u`, role: "user", content: text }]);
    try {
      // Cursor-like UX: if approval is pending, short yes/no replies trigger approve/reject.
      const intent = pendingApproval ? parseApprovalIntent(text) : null;
      if (intent !== null && pendingApproval) {
        await handleApproval(intent);
        return;
      }
      if (USE_DEEPAGENT) await sendDeepAgent(text, sessionId);
      else if (LIVE) await sendLive(text, sessionId);
      else await sendDemo(text);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("Assistant timed out after 90s. Try a shorter prompt or a different model.");
      } else {
        setError(e instanceof Error ? e.message : "Request failed");
      }
    } finally {
      setBusy(false);
      scrollDown();
    }
  };

  const startNewChat = () => {
    if (busy) return;
    const next = makeSessionId();
    localStorage.setItem(SESSION_KEY, next);
    setSessionId(next);
    setError(null);
    setLines([
      {
        id: "welcome",
        role: "assistant",
        agent: "Planner",
        content:
          "New chat session started. Old conversations are saved in AI Oversight usage logs and grouped by session.",
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        emoji="🤖"
        title="Lab Assistant"
        subtitle={
          USE_DEEPAGENT
            ? "Deepagent mode: planner + subagents via /api/agent/chat with human approval for write operations."
            : LIVE
            ? "Live mode: streaming from FastAPI + deepagents (needs OpenRouter on server)."
            : "Demo mode: multi-agent flow simulated in the browser. No API costs."
        }
        actions={
          <div className="flex items-center gap-2">
            <span className="chip bg-white/80 text-ocean-800 dark:bg-white/10 dark:text-ocean-100">
              {USE_DEEPAGENT
                ? busy
                  ? "Deepagent • Running"
                  : "Deepagent"
                : LIVE
                  ? busy
                    ? "Live API • Running"
                    : "Live API"
                  : "Frontend demo"}
            </span>
            <button type="button" className="btn-ghost" onClick={startNewChat} disabled={busy}>
              New chat
            </button>
          </div>
        }
      />
      <p className="text-xs font-semibold text-ocean-600 dark:text-ocean-200/80">Session: {sessionId}</p>

      {error && (
        <div className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-900 dark:border-coral-500/30 dark:bg-coral-900/20 dark:text-coral-100">
          {error}
        </div>
      )}

      <div className="glass-card flex h-[min(70vh,640px)] flex-col p-0">
        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
          {lines.map((ln) => (
            <div
              key={ln.id}
              className={`max-w-[95%] rounded-2xl px-4 py-3 text-sm font-semibold shadow-soft sm:max-w-[85%] ${
                ln.role === "user"
                  ? "ml-auto bg-gradient-to-r from-ocean-400 to-ocean-600 text-white"
                  : "mr-auto border border-white/50 bg-white/80 text-ocean-900 dark:border-white/10 dark:bg-night-800/80 dark:text-ocean-50"
              }`}
            >
              {ln.role === "assistant" && ln.agent && (
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-coral-500">
                  {ln.agent}
                </p>
              )}
              {ln.role === "assistant" && ln.orchestratedBy && ln.agent !== ln.orchestratedBy && (
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ocean-500/80 dark:text-ocean-200/80">
                  orchestrated by {ln.orchestratedBy}
                </p>
              )}
              {ln.role === "assistant" ? (
                renderAssistantContent(ln.content)
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{ln.content}</p>
              )}
            </div>
          ))}
          {pendingApproval && (
            <div className="mr-auto max-w-[95%] rounded-2xl border border-coral-300 bg-coral-50 px-4 py-3 text-sm font-semibold shadow-soft sm:max-w-[85%] dark:border-coral-500/40 dark:bg-coral-900/20">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-coral-500">approval</p>
              <p className="whitespace-pre-wrap leading-relaxed text-coral-900 dark:text-coral-100">
                This operation requires approval (human-in-the-loop).
              </p>
              {pendingApproval.details && (
                <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-white/80 p-3 text-xs text-ocean-900 dark:bg-night-800 dark:text-sand-100">
                  {JSON.stringify(pendingApproval.details, null, 2)}
                </pre>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn-primary !bg-seaweed-600 hover:!bg-seaweed-500"
                  onClick={() => void handleApproval(true)}
                  disabled={busy}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn-ghost border border-coral-400/50 text-coral-800 dark:text-coral-200"
                  onClick={() => void handleApproval(false)}
                  disabled={busy}
                >
                  Reject
                </button>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/50 p-3 dark:border-white/10 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="input flex-1"
              placeholder="Ask: “Any low stock?” or “Summarize project status in SQL terms”…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
            />
            <button type="button" className="btn-primary shrink-0" disabled={busy} onClick={() => void onSend()}>
              {busy ? "Running…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
