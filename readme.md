# Sandy Lab - Treedome OS

Sandy Labs operations platform: React (Vite) frontend + FastAPI backend + PostgreSQL.

It covers:
- project planning with start/end/deadline dates
- inventory and transaction ledger
- experiment logging
- calendar milestones + operational events
- supervised agent chat with orchestration logs

## Problem Statement

Sandy Labs has a common operations problem:
- project planning, inventory, experiment evidence, and AI outputs can become fragmented across tools
- teams lose continuity when updates are not traceable from planning to execution
- unsupervised AI-generated database mutations introduce governance and safety risks
- research workflows require context continuity and citations, while operations need deterministic actions

This project solves that by combining:
- one operational data model (projects, inventory, experiments, events, users)
- one execution surface (web app)
- one supervised AI workflow (planner + specialist agents + human approval)

## Solution Overview

The platform is built as a modular monolith:
- **Frontend** (`frontend/`): React + Vite app for CRUD, calendar, assistant chat, and oversight
- **Backend** (`backend/`): FastAPI API for auth, business CRUD, and agent orchestration endpoints
- **Database** (PostgreSQL): single source of truth for business data and AI audit trail
- **Optional usage sidecar** (`services/usage-reporter/`): receives webhook copies of usage events

Core design choices:
- keep write operations deterministic where possible
- require explicit approval for sensitive agent-driven DB actions
- log all agent interactions and orchestration traces for auditability
- support local-first development with Docker + idempotent SQL migrations

## Architecture (Technical)

### Frontend

- Routing and auth-guarded pages for `dashboard`, `projects`, `inventory`, `experiments`, `calendar`, `assistant`, `oversight`, `settings`
- Stores JWT in localStorage (`sandy_lab_token`)
- Stores theme preference (`bb-dashboard-theme`)
- Stores assistant chat session continuity (`lab_assistant_session_id`)
- Uses `apiJson`/`apiFetch` helpers and Vite proxy (`/api -> backend`)

### Backend

- FastAPI routers under `/api`:
  - auth: `/api/auth/*`
  - business CRUD: `/api/projects`, `/api/inventory`, `/api/experiments`, `/api/events`
  - users: `/api/users` (admin), `/api/users/me` (self profile update)
  - assistant/agents: `/api/chat/stream`, `/api/agent/chat`, `/api/agent/approve`
  - oversight/logging: `/api/usage/activity`, `/api/supervision/sql-proposals`
- SQLAlchemy models in `backend/app/models.py`
- Pydantic schemas in `backend/app/schemas.py`
- CORS configuration with local development fallback middleware

### Database

- Base tables + incremental migrations in `database/migrations/`
- Important entities:
  - `users`
  - `projects` (with `start_date`, `end_date`, `deadline`)
  - `inventory` + `inventory_transactions`
  - `experiments_log`
  - `events`
  - `ai_actions_log`
  - `agent_sql_proposals`
  - `agent_tasks`
  - `research_cache`

### Tables, Key Fields, and Seeds

Main relational model (see `backend/app/models.py`):

- `users`
  - `id`, `email`, `full_name`, `role`, `password_hash`, `created_at`
- `projects`
  - `id`, `name`, `description`, `status`, `priority`, `owner_id`, `deadline`, `start_date`, `end_date`, `budget`, `tags`, `created_at`
- `events`
  - `id`, `title`, `description`, `start_at`, `end_at`, `all_day`, `owner_id`, `project_id`, `created_at`
- `inventory`
  - `id`, `name`, `category`, `quantity`, `unit`, `min_required`, `unit_cost`, `supplier`, `expiry_date`, `location`, `barcode`, `last_updated`
- `inventory_transactions`
  - `id`, `inventory_id`, `change_amount`, `reason`, `type`, `unit_cost`, `user_id`, `created_at`
- `experiments_log`
  - `id`, `project_id`, `result`, `success`, `notes`, `duration_min`, `cost`, `user_id`, `created_at`
- `agent_sql_proposals`
  - `id`, `user_id`, `sql_text`, `rationale`, `status`, `result_text`, `error_text`, `created_at`, `decided_at`
- `ai_actions_log`
  - `id`, `action_type`, `description`, `metadata` (`action_metadata` in ORM), `user_id`, `agent`, `tokens`, `cost_usd`, `parent_id`, `created_at`
- `agent_tasks`
  - `id`, `task`, `status`, `result`, `agent`, `input_payload`, `output_payload`, `parent_task_id`, `started_at`, `finished_at`, `created_at`
- `research_cache`
  - `id`, `topic`, `summary`, `source`, `created_at`

Seed and migration coverage:

- `002_business_and_agents.sql`
  - idempotent business/agent schema upgrades (columns, constraints, indexes, trigger logic)
- `003_seed_example_users.sql`
  - upserts 4 demo users with roles (`admin`, `researcher`, `inventory`, `viewer`)
  - demo password: `demo123`
- `004_agent_supervision.sql`
  - creates `agent_sql_proposals` for human-reviewed read queries
- `005_seed_mock_data.sql`
  - inserts realistic operational mock data across core business and agent/audit tables
- `006_projects_dates_and_events.sql`
  - adds `projects.start_date`, `projects.end_date`, and creates `events`

How seeds are applied:

- `python setup_db.py` runs migrations in sorted order (`002` -> `006`)
- `python -m app.reset_and_seed_non_users` (run from `backend/`) clears non-user tables and reseeds mock operational data while preserving `users`

## App Workflow (End-to-End)

1. User signs in via JWT auth (`/api/auth/token`)
2. Frontend fetches operational entities from CRUD APIs
3. User actions update DB records directly through API routes
4. Dashboard and calendar render backend-derived data (no fake charts/progress)
5. Assistant route can run either:
   - stream mode (`/api/chat/stream`) for live planner updates
   - deepagent mode (`/api/agent/chat`) for orchestrated tool/subagent flow
6. Oversight reads usage and orchestration data from `ai_actions_log.metadata`

## Agent Workflow (Detailed Technical)

### 1) Entry point and session context

- Frontend sends `message` + `session_id` to `/api/agent/chat`
- Backend keeps bounded per-session message history in memory (`_SESSIONS`) to preserve context across turns
- Session history is injected into planner input as prior messages

### 2) Planner orchestration

- Planner (deepagents) is the orchestrator
- It can delegate to specialist subagents configured in `backend/app/agents/subagents.py`:
  - `research-agent` (web research + cache)
  - `database-agent` (read proposals + controlled updates)
  - `inventory-agent` (stock tools / inventory operations)
- Backend extracts orchestration trace rows from planner output and stores them in `ai_actions_log.metadata.orchestration_trace`

### 3) Read vs write safety model

- Read access through database-agent is proposal-based (`agent_sql_proposals`)
- Writes are guarded by intent detection and approval flow:
  - backend detects write intent
  - builds deterministic plan/preview
  - returns pending approval to UI
  - only executes after explicit approve call (`/api/agent/approve`)

### 4) Deterministic approval execution

- For supported project create/update/delete intents, approved actions execute via deterministic backend logic
- This avoids re-prompt drift after approval and preserves intent fidelity
- Results and trace are logged for audit

### 5) Usage + observability

- Each chat/approval creates `ai_actions_log` rows (agent, description, metadata, tokens/cost when available)
- Oversight page visualizes:
  - usage timeline
  - orchestration speaker steps (`human`, `planner`, `ai`, `tool`, `*-agent`)
- Optional webhook (`USAGE_WEBHOOK_URL`) sends non-blocking usage copies to sidecar service

## Human-in-the-Loop Governance

- Sensitive operations are never silently executed by agent output alone
- Approval UX and backend checks enforce:
  - proposal visibility
  - explicit approve/reject
  - trace + result persistence
- This enables compliance-style review of AI-assisted operations

## Data Management Workflow

- Initial setup: `python setup_db.py`
- Re-seed demo users: migration `003_seed_example_users.sql`
- Re-seed operational mock data: migration `005_seed_mock_data.sql`
- Clear all non-user data and refresh mocks:
  - `python -m app.reset_and_seed_non_users`

## Quick Start

### One-command Docker setup (recommended)

1. Create env files from examples:
```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

2. Start everything (DB + seed + backend + frontend + pgAdmin):
```bash
docker compose up --build
```

3. Open:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- pgAdmin: `http://localhost:5050`

Notes:
- `db-setup` runs `python setup_db.py` automatically after DB healthcheck.
- This applies migrations and seed data for demo/testing.

### Run manually (without Docker for app services)

1. Start DB services:
```bash
docker compose up -d
```

2. Initialize schema + migrations + seed:
```bash
python setup_db.py
```

3. Start backend:
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

4. Start frontend:
```bash
cd frontend
npm install
npm run dev
```

5. Open app:
- `http://localhost:5173/login`

Demo users are seeded by migrations (password `demo123`):
- `admin.demo@sandy-lab.local`
- `researcher.demo@sandy-lab.local`
- `inventory.demo@sandy-lab.local`
- `viewer.demo@sandy-lab.local`

## Ports

- Frontend: `5173` (or next free Vite port)
- Backend: `8000`
- Postgres (Docker): `5433 -> 5432`
- pgAdmin: `5050`

## Important Environment Variables

Backend (`backend/.env`):
- `DATABASE_URL` (default docker value uses `localhost:5433`)
- `JWT_SECRET`
- `OPENROUTER_API_KEY` (required for live LLM routes)
- `OPENROUTER_MODEL`
- `OPENROUTER_FALLBACK_MODELS`
- `TAVILY_API_KEY` (optional for web research)
- `SKIP_AUTH` (dev only)
- `USAGE_WEBHOOK_URL` (optional)

Frontend (`frontend/.env`):
- `VITE_API_BASE` (optional; empty uses Vite proxy)
- `VITE_LIVE_AGENT`
- `VITE_AGENT_ARCH=deepagent`

## Database Reset (keep users)

To clear all non-user data and reseed mocks:
```bash
cd backend
python -m app.reset_and_seed_non_users
```

This preserves rows in `users` and refreshes data in projects/inventory/experiments/events/AI logs/proposals.

## Docs

- `backend/README.md` - backend setup and API map
- `frontend/README.md` - frontend setup and pages
- `database/README.md` - migrations and seeding
- `services/usage-reporter/README.md` - optional usage webhook service
