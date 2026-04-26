# Sandy Lab – Treedome OS (Code It Up 6.0)

Full-stack **Sandy’s Treedome Lab** stack for the hackathon: **React (Vite)** frontend, **FastAPI** backend with **deepagents** (planner + research / database / inventory sub-agents) and **OpenRouter**, plus **PostgreSQL** for projects, inventory, experiments, and agent audit data.

## Quick start

1. Clone the repository and open the project folder.
2. **Infrastructure:** `docker compose up -d` — see [Docker Compose](#docker-compose).
3. **Database:** install `psycopg2-binary`, then run `python setup_db.py` (defaults to `localhost:5433` for Docker).
4. **Backend API:** see `backend/README.md` — copy `backend/.env.example` → `backend/.env`, set `JWT_SECRET` and (for live agents) `OPENROUTER_API_KEY`, run `uvicorn app.main:app --reload --port 8000`.
5. **Frontend:** see `frontend/README.md` — `npm install`, optional `frontend/.env` from `frontend/.env.example`, then `npm run dev` (port **5173**). Open **`/login`** — the **first registered user becomes `admin`** (when `ALLOW_OPEN_REGISTRATION=true`). Use **AI oversight** (`/oversight`) to monitor streamed chats and approve database-agent SELECT proposals.

### Environment checklist (what is often missing)

| Variable / area | Required for | Notes |
| --------------- | ------------ | ----- |
| **`OPENROUTER_API_KEY`** | Live **Lab Assistant** (`VITE_LIVE_AGENT=true`, `POST /api/chat/stream`) | Set in `backend/.env`. Without it the planner raises 503 on stream. |
| **`OPENROUTER_MODEL`** | Same | Default `openrouter:openai/gpt-4o-mini`; pick any OpenRouter route id. |
| **`TAVILY_API_KEY`** | Research-agent **web search** | Optional; without it `web_search` returns a friendly “not configured” message. |
| **`JWT_SECRET`** | Auth in production | Change from placeholder in `backend/.env`. |
| **`DATABASE_URL`** | All CRUD + agents | Default matches Docker `localhost:5433`. |
| **`SKIP_AUTH`** | Dev convenience | Default **false**; keep false outside sandboxes. |
| **`USAGE_WEBHOOK_URL`** | External **usage** copy | Optional; point at `services/usage-reporter` or your analytics sink. |
| **`VITE_LIVE_AGENT`** | Frontend calls stream API | `frontend/.env`: `true` to use real planner instead of demo script. |

| Document | Purpose |
| -------- | ------- |
| `docs/ARCHITECTURE.md` | Repository layout, ports, data flow |
| `database/README.md` | Running SQL migrations manually |
| `backend/README.md` | FastAPI, JWT, agents, env vars |
| `frontend/README.md` | UI dev server and build |

## Docker Compose

File: **`docker-compose.yml`**. Compose [project name](https://docs.docker.com/compose/how-tos/project-name/) is **`codeitup-sandy-lab`**.

| Service | Compose service name | Container name | Host → container | Notes |
| ------- | -------------------- | -------------- | ------------------ | ----- |
| **PostgreSQL** | `sandy-db` | `codeitup-sandy-lab` | **5433** → 5432 | DB `sandy_lab`, user `sandy`, password `sandy123` |
| **pgAdmin** | `pgadmin` | `codeitup-pgadmin` | **5050** → 80 | Web UI; login `sandy@bikini-bottom.com` / `sandy123` |

Both services use the **`codeitup-network`** bridge network so pgAdmin can register Postgres with **Host `sandy-db`**, **Port `5432`**.

```bash
docker compose up -d
docker compose ps
```

To stop: `docker compose down` (add `-v` to remove named volumes and reset DB data).

---

## 📁 Repository layout

High-level folder structure (see `docs/ARCHITECTURE.md` for the full tree and how services connect):

| Path | Purpose |
| ---- | ------- |
| `docs/ARCHITECTURE.md` | Folder architecture + data flow |
| `database/migrations/` | SQL migrations (idempotent alters) |
| `database/README.md` | How to run migrations manually |
| `backend/` | FastAPI API + JWT auth + deepagents planner (see `backend/README.md`) |
| `frontend/` | Vite + React UI (separate app) |
| `setup_db.py` | Creates base tables and applies migrations |
| `docker-compose.yml` | PostgreSQL + pgAdmin |
| `services/usage-reporter/` | Optional tiny service for `USAGE_WEBHOOK_URL` (AI usage fan-out) |

### API (backend)

After Postgres is running and `python setup_db.py` has been applied, configure and start the FastAPI app from `backend/` (see **`backend/README.md`**). Create users via **`/login` → Register** (first user is **`admin`** when the table is empty) or `POST /api/auth/register`.

---

## 📦 Prerequisites

### Method 1 (Docker)

* Docker
* Docker Compose

### Method 2 (Python Script)

* Python 3.8+
* pip
* PostgreSQL (local or remote)

---

## 🐳 Method 1: Using Docker (Recommended)

This method runs PostgreSQL and pgAdmin in containers.

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Start the containers

```bash
docker compose up -d
```

This will:

* Start **PostgreSQL** on host port **5433** → container port **5432**
* Start **pgAdmin** on host port **5050**

### 3. Run the setup script

```bash
python setup_db.py
```

This script:

1. Creates the **base tables** (`projects`, `inventory`, `experiments_log`, …) if they are missing.
2. Runs every **`database/migrations/*.sql`** file in **sorted** order (split on `---MIGRATE---` per file). That includes **`002_business_and_agents.sql`** (business / audit columns, `users`, `notifications`, indexes, inventory transaction trigger), **`003_seed_example_users.sql`** (demo logins for all roles), and **`005_seed_mock_data.sql`** (mock rows across all core tables for manual CRUD testing; see `database/README.md`).

Optional environment variables (defaults match Docker compose):

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5433` | Host port (**use `5432` for local Postgres without Docker**) |
| `DB_NAME` | `sandy_lab` | Database name |
| `DB_USER` | `sandy` | Database user |
| `DB_PASSWORD` | `sandy123` | Database password |

> ⚠️ With **Docker**, Postgres is published on host port **5433** (`5433:5432` in compose). With **local Postgres only**, set `DB_PORT=5432` (or change the default in `setup_db.py` for your machine).

### 3b. Run migrations only (optional)

See `database/README.md` for `psql` / Docker one-liners. Migrations are **idempotent** (safe to re-run).

**Credentials:**

* Database: `sandy_lab`
* User: `sandy`
* Password: `sandy123`

---

### 4. (Optional) Access pgAdmin

Open:

```
http://localhost:5050
```

**Login:**

* Email: `sandy@bikini-bottom.com`
* Password: `sandy123`

**Add Server:**

* Host: `sandy-db` (Docker Compose **service** name on the default network)
* Port: `5432`
* Username: `sandy`
* Password: `sandy123`

---

## 🐍 Method 2: Without Docker (Local PostgreSQL)

### 1. Install PostgreSQL (if needed)

**Ubuntu/Debian:**

```bash
sudo apt install postgresql postgresql-contrib
```

**macOS:**

```bash
brew install postgresql
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

---

### 2. Create database and user

```sql
sudo -u postgres psql

CREATE USER sandy WITH PASSWORD 'sandy123';
CREATE DATABASE sandy_lab OWNER sandy;
GRANT ALL PRIVILEGES ON DATABASE sandy_lab TO sandy;

\q
```

---

### 3. Install dependency

```bash
pip install psycopg2-binary
```

---

### 4. Run setup script

```bash
set DB_PORT=5432
python setup_db.py
```

> ⚠️ Use **`DB_PORT=5432`** (PowerShell: `$env:DB_PORT="5432"`) for a default local PostgreSQL install. Docker users should keep the default **`5433`** or omit `DB_PORT`.

---

## 📊 Database Tables & Schema

### projects

| Field       | Type      | Description                   |
| ----------- | --------- | ----------------------------- |
| id          | SERIAL PK | Project ID                    |
| name        | TEXT      | Project name                  |
| description | TEXT      | Optional description          |
| status      | TEXT      | planned / ongoing / completed |
| priority    | INTEGER   | Default = 1                   |
| created_at  | TIMESTAMP | Creation timestamp            |

---

### inventory

| Field        | Type      | Description       |
| ------------ | --------- | ----------------- |
| id           | SERIAL PK | Item ID           |
| name         | TEXT      | Item name         |
| category     | TEXT      | Item category     |
| quantity     | INTEGER   | Default = 0       |
| unit         | TEXT      | Unit type         |
| min_required | INTEGER   | Minimum threshold |
| last_updated | TIMESTAMP | Last update       |

---

### project_requirements

| Field             | Type              | Description     |
| ----------------- | ----------------- | --------------- |
| id                | SERIAL PK         | ID              |
| project_id        | FK → projects.id  | Linked project  |
| inventory_id      | FK → inventory.id | Linked item     |
| required_quantity | INTEGER           | Required amount |

---

### experiments_log

| Field      | Type      | Description        |
| ---------- | --------- | ------------------ |
| id         | SERIAL PK | Log ID             |
| project_id | FK        | Linked project     |
| result     | TEXT      | Result description |
| success    | BOOLEAN   | Success flag       |
| notes      | TEXT      | Additional notes   |
| created_at | TIMESTAMP | Timestamp          |

---

### ai_actions_log

| Field       | Type      | Description    |
| ----------- | --------- | -------------- |
| id          | SERIAL PK | ID             |
| action_type | TEXT      | Type of action |
| description | TEXT      | Description    |
| metadata    | JSONB     | Flexible data  |
| created_at  | TIMESTAMP | Timestamp      |

---

### research_cache

| Field      | Type      | Description      |
| ---------- | --------- | ---------------- |
| id         | SERIAL PK | ID               |
| topic      | TEXT      | Research topic   |
| summary    | TEXT      | Cached summary   |
| source     | TEXT      | Source reference |
| created_at | TIMESTAMP | Timestamp        |

---

### inventory_transactions

| Field         | Type      | Description     |
| ------------- | --------- | --------------- |
| id            | SERIAL PK | ID              |
| inventory_id  | FK        | Linked item     |
| change_amount | INTEGER   | Quantity change |
| reason        | TEXT      | Reason          |
| created_at    | TIMESTAMP | Timestamp       |

---

### agent_tasks

| Field      | Type      | Description                            |
| ---------- | --------- | -------------------------------------- |
| id         | SERIAL PK | ID                                     |
| task       | TEXT      | Task description                       |
| status     | TEXT      | pending / running / completed / failed |
| result     | TEXT      | Task result                            |
| created_at | TIMESTAMP | Timestamp                              |

---

## 🧩 Migration `002_business_and_agents.sql` (add-on schema)

Applied automatically by `setup_db.py` after base tables. Adds:

| Object | Purpose |
| ------ | ------- |
| **`users`** | Accounts with `role`: `admin`, `researcher`, `inventory`, `viewer` |
| **`notifications`** | In-app alerts (`info` / `warning` / `critical`) |
| **`projects`** | `owner_id`, `deadline`, `budget`, `tags` |
| **`inventory`** | `unit_cost`, `supplier`, `expiry_date`, `location`, `barcode` |
| **`inventory_transactions`** | `user_id`, `type` (`in` / `out` / `adjust` / `expired`), `unit_cost` |
| **`experiments_log`** | `user_id`, `duration_min`, `cost` |
| **`ai_actions_log`** | `user_id`, `agent`, `tokens`, `cost_usd`, `parent_id` (nested agent trace) |
| **`agent_tasks`** | `parent_task_id`, `agent`, `input_payload`, `output_payload`, `started_at`, `finished_at` |
| **Indexes** | Faster dashboard queries on `projects`, `inventory`, `ai_actions_log` |
| **Trigger** | On new `inventory_transactions` row, updates `inventory.quantity` |

> **Inventory rule:** Prefer inserting rows into `inventory_transactions` so stock stays consistent with the trigger. Direct manual edits to `inventory.quantity` can desync history unless you intentionally bypass the ledger.

---

## ⚠️ Important Port Notes

* **Docker method:** uses port `5433`
* **Local PostgreSQL:** uses port `5432`

Connection is configured in **`setup_db.py`** via `DB_CONFIG` and environment variables (`DB_HOST`, `DB_PORT`, …). For Docker, use host port **`5433`**; for local Postgres, set **`DB_PORT=5432`**.

---

## ✅ Verification

Check tables:

```bash
# Docker
docker exec -it codeitup-sandy-lab psql -U sandy -d sandy_lab -c "\dt"

# Local
psql -h localhost -p 5433 -U sandy -d sandy_lab -c "\dt"
```

---

## 🛠 Troubleshooting

| Problem                     | Solution                                      |
| --------------------------- | --------------------------------------------- |
| Connection refused          | Ensure DB is running and correct port is used |
| role "sandy" does not exist | Run CREATE USER commands                      |
| psycopg2 error              | `pip install psycopg2-binary`                 |
| Port already in use         | Change port in docker-compose and script      |

---

## Run everything (local dev)

Use **three terminals**: Postgres (Docker), API, UI.

**1) Database**

```bash
docker compose up -d
pip install psycopg2-binary
python setup_db.py
```

**2) Backend** (from `backend/`)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env: JWT_SECRET, DATABASE_URL if needed, OPENROUTER_API_KEY for live /api/chat/stream
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Auth endpoints:** `POST /api/auth/register`, `POST /api/auth/token`, `GET /api/auth/me` (Bearer JWT).

**3) Frontend** (from `frontend/`)

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server **proxies `/api`** to `http://127.0.0.1:8000`, so the UI can call the API on the same origin.

- Landing: **http://localhost:5173/**
- Sign in / register: **http://localhost:5173/login**
- Lab app (after login): **http://localhost:5173/dashboard**

**Lab Assistant:** default is **demo mode** in the browser. Set `VITE_LIVE_AGENT=true` in `frontend/.env` (see `frontend/.env.example`) to stream **`POST /api/chat/stream`** from the backend.

---

Good luck in the competition.
