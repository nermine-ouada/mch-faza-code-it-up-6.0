---MIGRATE---
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'researcher', 'inventory', 'viewer')) DEFAULT 'viewer',
    password_hash TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
---MIGRATE---
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    level TEXT CHECK (level IN ('info', 'warning', 'critical')) DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'deadline'
    ) THEN
        ALTER TABLE projects ADD COLUMN deadline DATE;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'budget'
    ) THEN
        ALTER TABLE projects ADD COLUMN budget NUMERIC(12, 2);
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'tags'
    ) THEN
        ALTER TABLE projects ADD COLUMN tags TEXT[];
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name = 'unit_cost'
    ) THEN
        ALTER TABLE inventory ADD COLUMN unit_cost NUMERIC(12, 2) DEFAULT 0;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name = 'supplier'
    ) THEN
        ALTER TABLE inventory ADD COLUMN supplier TEXT;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name = 'expiry_date'
    ) THEN
        ALTER TABLE inventory ADD COLUMN expiry_date DATE;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name = 'location'
    ) THEN
        ALTER TABLE inventory ADD COLUMN location TEXT;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name = 'barcode'
    ) THEN
        ALTER TABLE inventory ADD COLUMN barcode TEXT UNIQUE;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'inventory_transactions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE inventory_transactions ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'inventory_transactions' AND column_name = 'type'
    ) THEN
        ALTER TABLE inventory_transactions ADD COLUMN type TEXT CHECK (type IN ('in', 'out', 'adjust', 'expired'));
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'inventory_transactions' AND column_name = 'unit_cost'
    ) THEN
        ALTER TABLE inventory_transactions ADD COLUMN unit_cost NUMERIC(12, 2);
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'experiments_log' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE experiments_log ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'experiments_log' AND column_name = 'duration_min'
    ) THEN
        ALTER TABLE experiments_log ADD COLUMN duration_min INTEGER;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'experiments_log' AND column_name = 'cost'
    ) THEN
        ALTER TABLE experiments_log ADD COLUMN cost NUMERIC(12, 2);
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_actions_log' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE ai_actions_log ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_actions_log' AND column_name = 'agent'
    ) THEN
        ALTER TABLE ai_actions_log ADD COLUMN agent TEXT;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_actions_log' AND column_name = 'tokens'
    ) THEN
        ALTER TABLE ai_actions_log ADD COLUMN tokens INTEGER;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_actions_log' AND column_name = 'cost_usd'
    ) THEN
        ALTER TABLE ai_actions_log ADD COLUMN cost_usd NUMERIC(12, 6);
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_actions_log' AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE ai_actions_log ADD COLUMN parent_id INTEGER REFERENCES ai_actions_log(id) ON DELETE SET NULL;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'agent_tasks' AND column_name = 'parent_task_id'
    ) THEN
        ALTER TABLE agent_tasks ADD COLUMN parent_task_id INTEGER REFERENCES agent_tasks(id) ON DELETE SET NULL;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'agent_tasks' AND column_name = 'agent'
    ) THEN
        ALTER TABLE agent_tasks ADD COLUMN agent TEXT;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'agent_tasks' AND column_name = 'input_payload'
    ) THEN
        ALTER TABLE agent_tasks ADD COLUMN input_payload JSONB;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'agent_tasks' AND column_name = 'output_payload'
    ) THEN
        ALTER TABLE agent_tasks ADD COLUMN output_payload JSONB;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'agent_tasks' AND column_name = 'started_at'
    ) THEN
        ALTER TABLE agent_tasks ADD COLUMN started_at TIMESTAMP;
    END IF;
END $$;
---MIGRATE---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'agent_tasks' AND column_name = 'finished_at'
    ) THEN
        ALTER TABLE agent_tasks ADD COLUMN finished_at TIMESTAMP;
    END IF;
END $$;
---MIGRATE---
CREATE INDEX IF NOT EXISTS idx_projects_status_priority ON projects (status, priority DESC);
---MIGRATE---
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory (quantity);
---MIGRATE---
CREATE INDEX IF NOT EXISTS idx_ai_actions_log_created_at ON ai_actions_log (created_at DESC);
---MIGRATE---
CREATE OR REPLACE FUNCTION apply_inventory_transaction() RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory
    SET quantity = quantity + COALESCE(NEW.change_amount, 0),
        last_updated = CURRENT_TIMESTAMP
    WHERE id = NEW.inventory_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
---MIGRATE---
DROP TRIGGER IF EXISTS trg_apply_inventory_transaction ON inventory_transactions;
---MIGRATE---
CREATE TRIGGER trg_apply_inventory_transaction
    AFTER INSERT ON inventory_transactions
    FOR EACH ROW
    EXECUTE PROCEDURE apply_inventory_transaction();
