/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  /** When "true", Assistant uses POST /api/chat/stream (needs OpenRouter on backend). */
  readonly VITE_LIVE_AGENT?: string;
  /** Optional assistant architecture mode: "deepagent" enables /api/agent chat/approve flow. */
  readonly VITE_AGENT_ARCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
