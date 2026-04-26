---MIGRATE---
-- Human-supervised SELECT proposals from the database-agent (no direct execution by the model).
CREATE TABLE IF NOT EXISTS agent_sql_proposals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sql_text TEXT NOT NULL,
    rationale TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    result_text TEXT,
    error_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_sql_proposals_user_id ON agent_sql_proposals (user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sql_proposals_status ON agent_sql_proposals (status);
CREATE INDEX IF NOT EXISTS idx_agent_sql_proposals_created ON agent_sql_proposals (created_at DESC);
