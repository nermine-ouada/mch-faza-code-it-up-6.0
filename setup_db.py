# pip install psycopg2-binary
import os
from pathlib import Path

import psycopg2

DB_CONFIG = {
    "dbname": os.environ.get("DB_NAME", "sandy_lab"),
    "user": os.environ.get("DB_USER", "sandy"),
    "password": os.environ.get("DB_PASSWORD", "sandy123"),
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": os.environ.get("DB_PORT", "5433"),
}

_REPO_ROOT = Path(__file__).resolve().parent
_MIGRATIONS_DIR = _REPO_ROOT / "database" / "migrations"
_MIGRATE_MARKER = "---MIGRATE---"


def _sql_segment_has_executable(segment: str) -> bool:
    for line in segment.splitlines():
        s = line.strip()
        if not s:
            continue
        if not s.startswith("--"):
            return True
    return False


def create_tables(conn):
    with conn.cursor() as cur:

        # Projects
        cur.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT CHECK (status IN ('planned', 'ongoing', 'completed')) DEFAULT 'planned',
            priority INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Inventory
        cur.execute("""
        CREATE TABLE IF NOT EXISTS inventory (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            quantity INTEGER DEFAULT 0,
            unit TEXT,
            min_required INTEGER DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Project Requirements
        cur.execute("""
        CREATE TABLE IF NOT EXISTS project_requirements (
            id SERIAL PRIMARY KEY,
            project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
            inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
            required_quantity INTEGER NOT NULL
        );
        """)

        # Experiments Log
        cur.execute("""
        CREATE TABLE IF NOT EXISTS experiments_log (
            id SERIAL PRIMARY KEY,
            project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
            result TEXT,
            success BOOLEAN,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # AI Actions Log
        cur.execute("""
        CREATE TABLE IF NOT EXISTS ai_actions_log (
            id SERIAL PRIMARY KEY,
            action_type TEXT,
            description TEXT,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Research Cache
        cur.execute("""
        CREATE TABLE IF NOT EXISTS research_cache (
            id SERIAL PRIMARY KEY,
            topic TEXT,
            summary TEXT,
            source TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Inventory Transactions
        cur.execute("""
        CREATE TABLE IF NOT EXISTS inventory_transactions (
            id SERIAL PRIMARY KEY,
            inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
            change_amount INTEGER,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Agent Tasks
        cur.execute("""
        CREATE TABLE IF NOT EXISTS agent_tasks (
            id SERIAL PRIMARY KEY,
            task TEXT,
            status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
            result TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

    conn.commit()
    print("OK: All base tables created successfully.")


def run_migration_file(conn, path: Path) -> None:
    if not path.is_file():
        print("Skip migrations: file not found:", path)
        return
    raw = path.read_text(encoding="utf-8")
    parts = [p.strip() for p in raw.split(_MIGRATE_MARKER)]
    with conn.cursor() as cur:
        for part in parts:
            if not part:
                continue
            if not _sql_segment_has_executable(part):
                continue
            cur.execute(part)
    conn.commit()
    print("OK: Migrations applied:", path.name)


def main():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        try:
            create_tables(conn)
            for migration_path in sorted(_MIGRATIONS_DIR.glob("*.sql")):
                run_migration_file(conn, migration_path)
        finally:
            conn.close()
    except Exception as e:
        print("Error:", e)


if __name__ == "__main__":
    main()
