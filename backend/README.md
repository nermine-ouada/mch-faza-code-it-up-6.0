# Sandy Lab Backend (FastAPI)

## Setup

1. From repo root, ensure DB is up and initialized:
```bash
docker compose up -d
python setup_db.py
```

2. Start API:
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

3. Health check:
```bash
curl http://127.0.0.1:8000/health
```

## Key Routes

Auth:
- `POST /api/auth/register`
- `POST /api/auth/token`
- `GET /api/auth/me`

Core CRUD:
- `GET/POST/PATCH/DELETE /api/projects`
- `GET/POST/PATCH/DELETE /api/inventory`
- `POST /api/inventory/transactions`
- `GET/POST/PATCH/DELETE /api/experiments`
- `GET/POST/PATCH/DELETE /api/events`

Users:
- `GET/POST/PATCH/DELETE /api/users` (admin)
- `PATCH /api/users/me` (self profile update)

AI:
- `POST /api/chat/stream`
- `POST /api/agent/chat`
- `POST /api/agent/approve`
- `GET /api/usage/activity`
- `GET /api/supervision/sql-proposals`
- `POST /api/supervision/sql-proposals/{id}/approve`
- `POST /api/supervision/sql-proposals/{id}/reject`

## Environment Variables

Important values in `backend/.env`:
- `DATABASE_URL` (must use `+asyncpg`)
- `JWT_SECRET`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_FALLBACK_MODELS`
- `TAVILY_API_KEY` (optional)
- `SKIP_AUTH` (dev only)
- `USAGE_WEBHOOK_URL` (optional)
- `CORS_ORIGINS`
- `CORS_ORIGIN_REGEX`

## Data Utilities

Initialize schema/migrations:
```bash
python setup_db.py
```

Reset all non-user data and reseed mocks:
```bash
python -m app.reset_and_seed_non_users
```

## Notes

- `SKIP_AUTH=true` is dev-only; keep false in normal use.
- Inventory quantities should be changed via `inventory_transactions` for consistent ledger behavior.
- Agent write actions are human-approved; orchestration traces are stored in `ai_actions_log.metadata`.
