from __future__ import annotations

from langchain_core.tools import tool
from sqlalchemy import text

from app.agents.request_context import agent_request_user_id
from app.db import SyncSessionLocal


def validate_read_only_select(q: str) -> tuple[str | None, str | None]:
    """Return (error_message, cleaned_sql) or (None, sql) if OK."""
    raw = (q or "").strip()
    if not raw.lower().startswith("select"):
        return "Only SELECT queries are allowed.", None
    body = raw.rstrip().rstrip(";")
    if ";" in body:
        return "Multiple statements are not allowed (no semicolons in the middle).", None
    return None, raw


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
