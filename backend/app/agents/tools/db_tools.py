from __future__ import annotations

import re

from langchain_core.tools import tool
from sqlalchemy import text

from app.agents.request_context import agent_request_user_id
from app.db import SyncSessionLocal


def _normalize_mysql_date_add(sql: str) -> str:
    # Convert common MySQL date functions to PostgreSQL.
    out = re.sub(r"\bcurdate\s*\(\s*\)", "CURRENT_DATE", sql, flags=re.IGNORECASE)
    # DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY) -> (CURRENT_DATE + INTERVAL '14 day')
    pattern = re.compile(
        r"date_add\s*\(\s*(?:current_date|curdate\s*\(\s*\))\s*,\s*interval\s+(\d+)\s+day\s*\)",
        flags=re.IGNORECASE,
    )
    out = pattern.sub(r"(CURRENT_DATE + INTERVAL '\1 day')", out)
    # Invalid in PostgreSQL: INTERVAL '14' DAY  →  INTERVAL '14 days'
    out = re.sub(r"\bINTERVAL\s+'(\d+)'\s+DAY\b", r"INTERVAL '\1 days'", out, flags=re.IGNORECASE)
    return out


def _touches_projects_table(sql: str) -> bool:
    """True if SQL references the projects table (handles optional quotes, public schema, and alias)."""
    return bool(
        re.search(
            r"\b(?:from|join)\s+(?:public\.)?(?:\"|')?projects(?:\"|')?"
            r"(?:\s+(?:as\s+)?[a-zA-Z_]\w*)?"
            r"(?=\s*(?:where|join|group|order|having|limit|offset|on|,|\)|;|$))",
            sql,
            flags=re.IGNORECASE | re.DOTALL,
        ),
    )


def _touches_events_table(sql: str) -> bool:
    """True if SQL references the events table (which has a `title` column)."""
    return bool(
        re.search(
            r"\b(?:from|join)\s+(?:public\.)?(?:\"|')?events(?:\"|')?"
            r"(?:\s+(?:as\s+)?[a-zA-Z_]\w*)?"
            r"(?=\s*(?:where|join|group|order|having|limit|offset|on|,|\)|;|$))",
            sql,
            flags=re.IGNORECASE | re.DOTALL,
        ),
    )


def _normalize_projects_owner_join(sql: str) -> str:
    # Rewrite hallucinated owners join to existing users table.
    out = sql
    out = re.sub(
        r"\bjoin\s+owners\s+([a-z_][a-z0-9_]*)\s+on\s+([a-z_][a-z0-9_]*)\.owner_id\s*=\s*\1\.owner_id\b",
        r"LEFT JOIN users \1 ON \2.owner_id = \1.id",
        out,
        flags=re.IGNORECASE,
    )
    # owner_name does not exist; users.full_name is closest field.
    out = re.sub(
        r"\b([a-z_][a-z0-9_]*)\.owner_name\b",
        r"\1.full_name AS owner",
        out,
        flags=re.IGNORECASE,
    )
    return out


def _normalize_projects_column_aliases(sql: str) -> str:
    # Common hallucinated columns from LLM outputs against `projects` table.
    # Apply only when the query targets projects (including FROM "projects" / public.projects).
    if not _touches_projects_table(sql):
        return sql
    out = sql
    out = re.sub(r'"project_name"', "name", out, flags=re.IGNORECASE)
    out = re.sub(r'"project_id"', "id", out, flags=re.IGNORECASE)
    out = re.sub(r"\bproject_id\b", "id", out, flags=re.IGNORECASE)
    out = re.sub(r"\bproject_name\b", "name", out, flags=re.IGNORECASE)
    out = re.sub(r"\bprojects\.project_id\b", "projects.id", out, flags=re.IGNORECASE)
    out = re.sub(r"\bprojects\.project_name\b", "projects.name", out, flags=re.IGNORECASE)
    out = re.sub(r"\bp\.project_id\b", "p.id", out, flags=re.IGNORECASE)
    out = re.sub(r"\bp\.project_name\b", "p.name", out, flags=re.IGNORECASE)
    # `title` is not a column in `projects` (it exists on `events`).
    # Rewrite to `name` only if events table is NOT also touched (avoids breaking joins).
    if not _touches_events_table(out):
        out = re.sub(r"\bprojects\.title\b", "projects.name", out, flags=re.IGNORECASE)
        out = re.sub(r"\bp\.title\b", "p.name", out, flags=re.IGNORECASE)
        out = re.sub(r"\btitle\b", "name", out, flags=re.IGNORECASE)
    # `owner` is not a column in projects; expose owner_id under the expected label.
    out = re.sub(r"\bowner\b", "owner_id AS owner", out, flags=re.IGNORECASE)
    out = re.sub(r"\bprojects\.owner\b", "projects.owner_id", out, flags=re.IGNORECASE)
    out = re.sub(r"\bp\.owner\b", "p.owner_id", out, flags=re.IGNORECASE)
    # Normalize generic "active" status to actual enum/value used by this schema.
    out = re.sub(r"=\s*'active'\b", "= 'ongoing'", out, flags=re.IGNORECASE)
    out = _normalize_projects_owner_join(out)
    return out


def _validate_projects_columns(sql: str) -> tuple[str | None, str]:
    if not _touches_projects_table(sql):
        return None, sql
    known = {
        "id",
        "name",
        "description",
        "status",
        "priority",
        "created_at",
        "owner_id",
        "deadline",
        "start_date",
        "end_date",
        "budget",
        "tags",
    }
    refs = re.findall(r"\b(?:projects|p)\.([a-z_][a-z0-9_]*)\b", sql, flags=re.IGNORECASE)
    bad = sorted({r.lower() for r in refs if r.lower() not in known})
    if bad:
        return (
            "Unknown column(s) on projects: "
            + ", ".join(bad)
            + ". Use columns like name, deadline, owner_id, status.",
            sql,
        )
    return None, sql


def validate_read_only_select(q: str) -> tuple[str | None, str | None]:
    """Return (error_message, cleaned_sql) or (None, sql) if OK."""
    raw = (q or "").strip()
    if not raw.lower().startswith("select"):
        return "Only SELECT queries are allowed.", None
    normalized = _normalize_mysql_date_add(raw)
    normalized = _normalize_projects_column_aliases(normalized)
    col_err, normalized = _validate_projects_columns(normalized)
    if col_err:
        return col_err, None
    body = normalized.rstrip().rstrip(";")
    if ";" in body:
        return "Multiple statements are not allowed (no semicolons in the middle).", None
    return None, normalized


@tool
def propose_select_query(sql: str, rationale: str = "") -> str:
    """Submit a read-only SELECT for human approval in the Lab UI. Does NOT query the database.

    Use this instead of running SQL yourself. The operator reviews and approves proposals
    under AI oversight → Pending database reads. After approval, results are stored on the proposal.
    """
    err, cleaned = validate_read_only_select(sql)
    if err or cleaned is None:
        return f"Error: {err}"

    uid = agent_request_user_id.get()
    if uid is None:
        return (
            "Error: no lab user context for this request (cannot attribute a proposal). "
            "The planner must run inside an authenticated /api/chat/stream session."
        )

    rationale_clean = (rationale or "").strip()[:2000]

    insert_sql = text(
        """
        INSERT INTO agent_sql_proposals (user_id, sql_text, rationale, status)
        VALUES (:user_id, :sql_text, :rationale, 'pending')
        RETURNING id
        """
    )
    with SyncSessionLocal() as session:
        row = session.execute(
            insert_sql,
            {"user_id": uid, "sql_text": cleaned, "rationale": rationale_clean or None},
        ).scalar_one()
        session.commit()

    return (
        f"Proposal #{row} submitted for human review. "
        f"Open **AI oversight → Pending database reads** in the lab app to approve or reject it. "
        f"Until then, no rows are returned from this query."
    )


@tool
def update_project_fields(
    project_name: str,
    status: str | None = None,
    priority: int | None = None,
    description: str | None = None,
) -> str:
    """Update project fields by exact name.

    This tool performs a direct update and is intended to run only after
    top-level human approval is granted by /api/agent/approve.
    """
    name = (project_name or "").strip()
    if not name:
        return "Error: project_name is required."
    updates: dict[str, object] = {}
    if status is not None:
        s = status.strip().lower()
        if s not in {"planned", "ongoing", "completed"}:
            return "Error: status must be one of planned, ongoing, completed."
        updates["status"] = s
    if priority is not None:
        try:
            p = int(priority)
        except Exception:  # noqa: BLE001
            return "Error: priority must be an integer."
        if p < 1 or p > 10:
            return "Error: priority must be between 1 and 10."
        updates["priority"] = p
    if description is not None:
        updates["description"] = description.strip() or None
    if not updates:
        return "Error: no fields to update."

    set_parts = []
    params: dict[str, object] = {"name": name}
    for k, v in updates.items():
        set_parts.append(f"{k} = :{k}")
        params[k] = v
    stmt = text(
        f"""
        UPDATE projects
        SET {", ".join(set_parts)}
        WHERE name = :name
        RETURNING id, name, status, priority
        """
    )
    with SyncSessionLocal() as session:
        row = session.execute(stmt, params).mappings().first()
        if not row:
            return f"Error: no project found with name '{name}'."
        session.commit()
    return (
        "OK: project updated "
        f"(id={row['id']}, name={row['name']}, status={row['status']}, priority={row['priority']})."
    )
