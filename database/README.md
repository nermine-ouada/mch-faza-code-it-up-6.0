# Database migrations

- **`migrations/002_business_and_agents.sql`** – idempotent enhancements (users, notifications, extra columns, indexes, inventory transaction trigger). Statements are separated by `---MIGRATE---` on its own line so `setup_db.py` can run them with **psycopg2** (one statement per `execute`).
- **`migrations/003_seed_example_users.sql`** – inserts (or upserts) **four demo users**, one per role, with a backend-compatible bcrypt hash for password `demo123`. Emails:

| Role | Email |
| ---- | ----- |
| admin | `admin.demo@sandy-lab.local` |
| researcher | `researcher.demo@sandy-lab.local` |
| inventory | `inventory.demo@sandy-lab.local` |
| viewer | `viewer.demo@sandy-lab.local` |

- **`migrations/004_agent_supervision.sql`** – `agent_sql_proposals` for human-approved SELECTs from the database-agent.
- **`migrations/005_seed_mock_data.sql`** – realistic sample data across notifications, projects, inventory, requirements, transactions, experiments, research cache, agent tasks/actions, and SQL proposal supervision rows.

`setup_db.py` runs every `database/migrations/*.sql` in **sorted** order (`002` … `005`, …).
- Applied automatically when you run **`python setup_db.py`** from the repo root (after base tables are created).

### Run only the migration file (manual)

**Docker (from host):**

```bash
docker exec -i codeitup-sandy-lab psql -U sandy -d sandy_lab < database/migrations/002_business_and_agents.sql
```

**PowerShell (Docker):**

```powershell
Get-Content database\migrations\002_business_and_agents.sql -Raw | docker exec -i codeitup-sandy-lab psql -U sandy -d sandy_lab
```

**Local psql:**

```bash
psql -h localhost -p 5433 -U sandy -d sandy_lab -f database/migrations/002_business_and_agents.sql
```

Statements in the file are separated by `---MIGRATE---` so `setup_db.py` can execute them one at a time without a local `psql` binary.
