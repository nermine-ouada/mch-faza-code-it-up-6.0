from pathlib import Path

from sqlalchemy import text

from app.db import sync_engine


def main() -> None:
    seed_sql = Path(__file__).resolve().parents[2] / "database" / "migrations" / "005_seed_mock_data.sql"
    parts = [p.strip() for p in seed_sql.read_text(encoding="utf-8").split("---MIGRATE---") if p.strip()]

    extra_sql = """
UPDATE projects
SET start_date = CURRENT_DATE - INTERVAL '14 day', end_date = deadline
WHERE name = 'Coral Growth Trial - Alpha';

UPDATE projects
SET start_date = CURRENT_DATE + INTERVAL '2 day', end_date = deadline
WHERE name = 'Kelp Nutrient Matrix';

INSERT INTO events (title, description, start_at, end_at, all_day, owner_id, project_id)
SELECT
    'Coral Field Survey',
    'Diver survey and photo transects for alpha trial.',
    CURRENT_TIMESTAMP + INTERVAL '2 day',
    CURRENT_TIMESTAMP + INTERVAL '2 day 3 hour',
    FALSE,
    u.id,
    p.id
FROM users u
JOIN projects p ON p.name = 'Coral Growth Trial - Alpha'
WHERE u.email = 'researcher.demo@sandy-lab.local'
  AND NOT EXISTS (SELECT 1 FROM events e WHERE e.title = 'Coral Field Survey');

INSERT INTO events (title, description, start_at, end_at, all_day, owner_id, project_id)
SELECT
    'Weekly Ops Review',
    'Review inventory risk and experiment throughput.',
    CURRENT_TIMESTAMP + INTERVAL '4 day',
    CURRENT_TIMESTAMP + INTERVAL '4 day 1 hour',
    FALSE,
    u.id,
    NULL
FROM users u
WHERE u.email = 'admin.demo@sandy-lab.local'
  AND NOT EXISTS (SELECT 1 FROM events e WHERE e.title = 'Weekly Ops Review');
"""

    with sync_engine.begin() as conn:
        rows = conn.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'users'"),
        ).all()
        for (table_name,) in rows:
            conn.exec_driver_sql(f'TRUNCATE TABLE "{table_name}" RESTART IDENTITY CASCADE')
        for stmt in parts:
            conn.exec_driver_sql(stmt.replace("%", "%%"))
        conn.exec_driver_sql(extra_sql.replace("%", "%%"))

    print("OK: all non-user data removed and fresh mock data seeded.")


if __name__ == "__main__":
    main()
