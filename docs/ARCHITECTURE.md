# Sandy Lab – Repository layout

Target layout for the full-stack + agentic system.

```text
mch-faza-code-it-up-6.0/
├── docs/
│   └── ARCHITECTURE.md          # This file
├── database/
│   ├── README.md                # How migrations are applied
│   └── migrations/
│       └── 002_business_and_agents.sql   # Idempotent schema enhancements
├── backend/                     # FastAPI – API + deepagents orchestration
│   ├── app/
│   │   ├── main.py              # FastAPI entry, CORS, route mounting, /api/auth/token
│   │   ├── config.py            # Env (DATABASE_URL, OPENROUTER_*, JWT, CORS, Tavily)
│   │   ├── db.py                # Async SQLAlchemy + derived sync engine for agent tools
│   │   ├── auth.py              # JWT helpers + password verification + get_current_user
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── schemas.py           # Pydantic request/response models
│   │   ├── routes/
│   │   │   ├── projects.py
│   │   │   ├── inventory.py
│   │   │   ├── experiments.py
│   │   │   ├── chat.py          # SSE stream of planner run
│   │   │   └── agents.py        # Recent agent_tasks / ai_actions_log
│   │   └── agents/
│   │       ├── llm.py           # OpenRouter model id helper
│   │       ├── tools/
│   │       │   ├── db_tools.py
│   │       │   ├── inventory_tools.py
│   │       │   └── research_tools.py
│   │       ├── subagents.py     # research / database / inventory SubAgent dicts
│   │       └── planner.py       # create_deep_agent planner + subagents
│   ├── requirements.txt
│   ├── .env.example             # Copy to .env (gitignored)
│   └── README.md
├── frontend/                    # Vite + React UI (dashboard, CRUD, agent console)
│   ├── src/
│   ├── public/
│   └── package.json
├── docker-compose.yml           # Postgres + pgAdmin (+ optional backend later)
├── setup_db.py                  # Creates base tables + runs SQL migrations
└── README.md                    # Project overview + Docker + database + schema
```

## Data flow (high level)

1. **Browser** talks to **backend** (REST + optional SSE for agent streams).
2. **Backend** uses **PostgreSQL** (`sandy_lab`) for all durable state.
3. **Planner agent** delegates to **research**, **database**, and **inventory** agents; each uses tools that read/write the same database (with guardrails for writes).

## Ports (Docker)

| Service    | Host port | Notes                          |
| ---------- | --------- | ------------------------------ |
| PostgreSQL | 5433      | Mapped from container `5432`   |
| pgAdmin    | 5050      | Web UI for DB inspection       |

Host apps (Python, Node) use `localhost` and **5433** for Postgres when using the compose file in this repo.
