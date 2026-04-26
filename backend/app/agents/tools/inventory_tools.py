from __future__ import annotations

from langchain_core.tools import tool
from sqlalchemy import text

from app.db import SyncSessionLocal, sync_engine
from app.models import InventoryTransaction


@tool
def list_low_stock(threshold_multiplier: float = 1.0) -> str:
    """List inventory rows where quantity is at or below min_required * threshold_multiplier."""
    tm = float(threshold_multiplier)
    stmt = text(
        """
        SELECT id, name, quantity, min_required, unit, location
        FROM inventory
        WHERE quantity <= (min_required * :tm)
        ORDER BY quantity ASC
        LIMIT 50
        """
    )
    with sync_engine.connect() as conn:
        rows = conn.execute(stmt, {"tm": tm}).mappings().all()
        return str(rows)


@tool
def record_inventory_transaction(
    inventory_id: int,
    change_amount: int,
    reason: str,
    txn_type: str = "adjust",
) -> str:
    """Insert an inventory_transactions row. DB trigger updates inventory.quantity."""
    if txn_type not in ("in", "out", "adjust", "expired"):
        return "Error: txn_type must be one of in, out, adjust, expired."
    with SyncSessionLocal() as session:
        row = InventoryTransaction(
            inventory_id=inventory_id,
            change_amount=change_amount,
            reason=reason,
            type=txn_type,
        )
        session.add(row)
        session.commit()
        return f"OK: inserted inventory_transactions id={row.id} for inventory_id={inventory_id}"
