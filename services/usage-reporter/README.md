# Usage reporter (optional microservice)

## Why separate this?

The main Sandy Lab API already writes **AI usage** rows to Postgres (`ai_actions_log`, e.g. `action_type=chat_stream` when `/api/chat/stream` is called). That keeps a durable audit trail next to your business data.

A **small sidecar service** is useful when you want:

- **Isolation** — analytics traffic and retention policies do not touch the primary API process.
- **Fan-out** — one webhook can fan out to Datadog, BigQuery, or a billing meter without bloating the monolith.
- **Rate limits / retries** — buffer spikes from many concurrent chats.

## How it connects

1. In `backend/.env`, set **`USAGE_WEBHOOK_URL`** to this service’s ingest URL, e.g. `http://127.0.0.1:8099/ingest`.
2. Start the reporter (see `main.py`), then start the backend as usual.
3. Each streamed chat triggers a **fire-and-forget POST** with JSON like:

```json
{
  "kind": "chat_stream",
  "user_id": 1,
  "model": "openrouter:openai/gpt-4o-mini",
  "prompt_chars": 120
}
```

The main app **still** inserts into `ai_actions_log`; the webhook is an extra copy. If the reporter is down, the main app continues (warnings in logs only).

## Run locally

```bash
cd services/usage-reporter
pip install fastapi uvicorn
uvicorn main:app --host 127.0.0.1 --port 8099
```

This demo stores the last 500 events in memory. Replace with your database or queue in production.
