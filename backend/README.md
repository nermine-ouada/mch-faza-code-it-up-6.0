# Sandy Lab – Backend (FastAPI)

## Layout

```text
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── db.py
│   ├── auth.py
│   ├── models.py
│   ├── schemas.py
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── projects.py
│   │   ├── inventory.py
│   │   ├── experiments.py
│   │   ├── chat.py
│   │   └── agents.py
│   └── agents/
│       ├── llm.py
│       ├── tools/
│       │   ├── db_tools.py
│       │   ├── inventory_tools.py
│       │   └── research_tools.py
│       ├── subagents.py
│       └── planner.py
├── requirements.txt
└── .env.example
```

## Setup

1. Start Postgres (see repo root `README.md` for Docker compose).
2. From repo root, run: `python setup_db.py`
3. **Create a user** (pick one):
   - **Recommended:** use the frontend **`/login` → Register** (first user becomes **`admin`** when the DB has zero users), or call `POST /api/auth/register`.
   - **Manual SQL:** hash a password and insert into `users` (see below).

```bash
cd backend
python -c "from app.auth import hash_password; print(hash_password('sandy123'))"
```

```sql
INSERT INTO users (email, full_name, role, password_hash)
VALUES ('sandy@bikini-bottom.com', 'Sandy Cheeks', 'admin', 'HASH');
```

4. Install deps and run API:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# edit .env: JWT_SECRET, OPENROUTER_API_KEY (for /api/chat/stream), optional TAVILY_API_KEY
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# Verbose auth traces (JWT, /me, role denials): add --log-level debug
```

## Key endpoints

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/health` | Liveness |
| POST | `/api/auth/register` | Create user (gated by `ALLOW_OPEN_REGISTRATION`) |
| POST | `/api/auth/token` | JSON `{"email":"...","password":"..."}` → JWT |
| GET | `/api/auth/me` | Current user (Bearer JWT) |
| CRUD | `/api/projects`, `/api/inventory`, `/api/experiments` | Bearer JWT |
| POST | `/api/inventory/transactions` | Ledger row (+ trigger updates qty) |
| POST | `/api/chat/stream` | SSE planner stream (needs `OPENROUTER_API_KEY`) |
| GET | `/api/supervision/sql-proposals` | Pending / past SELECT proposals (human-in-the-loop DB) |
| POST | `/api/supervision/sql-proposals/{id}/approve` | Run approved SELECT, store truncated result |
| POST | `/api/supervision/sql-proposals/{id}/reject` | Reject proposal |
| GET | `/api/usage/activity` | Filterable `ai_actions_log` rows (e.g. `?action_type=chat_stream`) |

## Notes

- **`SKIP_AUTH`** (default **false**): set **true** only for local demos; when on, unauthenticated requests are treated as the first DB user. Uvicorn logs a warning.
- **`OPENROUTER_FALLBACK_MODELS`**: optional comma-separated model ids. On 429/rate-limit errors, `/api/chat/stream` rotates to the next model and retries automatically.
- **`USAGE_WEBHOOK_URL`**: optional `POST` JSON for usage fan-out — see `services/usage-reporter/README.md`.
- **Database agent**: autonomous path uses **`propose_select_query`** (human approval in the UI); approved runs are still **SELECT-only**.
- `DATABASE_URL` must use `+asyncpg` for the API; agent tools use a derived sync URL (`+psycopg2`) from the same settings.
- Prefer **`POST /api/inventory/transactions`** for stock changes so the trigger keeps **`inventory.quantity`** aligned.
