---MIGRATE---
-- Mock data across core tables for manual CRUD testing.
-- Idempotent approach: each row inserts only when a deterministic key is missing.

-- 1) Notifications
INSERT INTO notifications (user_id, level, title, message, link, read)
SELECT u.id, 'warning', 'Low stock alert', 'PCR Tube Rack is below minimum level.', '/inventory', FALSE
FROM users u
WHERE u.email = 'inventory.demo@sandy-lab.local'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.title = 'Low stock alert'
  );

INSERT INTO notifications (user_id, level, title, message, link, read)
SELECT u.id, 'info', 'Weekly summary ready', 'Planner generated this week''s lab summary.', '/oversight', TRUE
FROM users u
WHERE u.email = 'researcher.demo@sandy-lab.local'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.title = 'Weekly summary ready'
  );

INSERT INTO notifications (user_id, level, title, message, link, read)
SELECT u.id, 'critical', 'Cold storage check', 'Freezer B2 temp drift detected during audit.', '/inventory', FALSE
FROM users u
WHERE u.email = 'admin.demo@sandy-lab.local'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.title = 'Cold storage check'
  );

-- 2) Projects
INSERT INTO projects (name, description, status, priority, owner_id, deadline, budget, tags)
SELECT
  'Coral Growth Trial - Alpha',
  'Track growth rates under variable salinity and nutrient dosing.',
  'ongoing',
  5,
  u.id,
  CURRENT_DATE + INTERVAL '21 day',
  4500.00,
  ARRAY['coral','growth','salinity']
FROM users u
WHERE u.email = 'researcher.demo@sandy-lab.local'
  AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.name = 'Coral Growth Trial - Alpha');

INSERT INTO projects (name, description, status, priority, owner_id, deadline, budget, tags)
SELECT
  'Kelp Nutrient Matrix',
  'Compare nutrient blends for rapid kelp regrowth cycles.',
  'planned',
  3,
  u.id,
  CURRENT_DATE + INTERVAL '35 day',
  2800.00,
  ARRAY['kelp','nutrients']
FROM users u
WHERE u.email = 'researcher.demo@sandy-lab.local'
  AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.name = 'Kelp Nutrient Matrix');

INSERT INTO projects (name, description, status, priority, owner_id, deadline, budget, tags)
SELECT
  'Sensor Drift Retrospective',
  'Analyze instrument drift events and calibration cadence.',
  'completed',
  2,
  u.id,
  CURRENT_DATE - INTERVAL '3 day',
  1200.00,
  ARRAY['ops','calibration','qa']
FROM users u
WHERE u.email = 'admin.demo@sandy-lab.local'
  AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.name = 'Sensor Drift Retrospective');

-- 3) Inventory
INSERT INTO inventory (name, category, quantity, unit, min_required, unit_cost, supplier, expiry_date, location, barcode)
SELECT 'PCR Tube Rack', 'consumables', 12, 'rack', 20, 48.50, 'ReefLab Supply', CURRENT_DATE + INTERVAL '180 day', 'A1-COLD', 'MOCK-INV-0001'
WHERE NOT EXISTS (SELECT 1 FROM inventory i WHERE i.barcode = 'MOCK-INV-0001');

INSERT INTO inventory (name, category, quantity, unit, min_required, unit_cost, supplier, expiry_date, location, barcode)
SELECT 'Salinity Buffer 35ppt', 'reagent', 4, 'bottle', 8, 22.75, 'OceanChem', CURRENT_DATE + INTERVAL '120 day', 'B2-REFR', 'MOCK-INV-0002'
WHERE NOT EXISTS (SELECT 1 FROM inventory i WHERE i.barcode = 'MOCK-INV-0002');

INSERT INTO inventory (name, category, quantity, unit, min_required, unit_cost, supplier, expiry_date, location, barcode)
SELECT 'Optical pH Probe', 'equipment', 2, 'unit', 1, 310.00, 'BlueSensor', NULL, 'E3-BENCH', 'MOCK-INV-0003'
WHERE NOT EXISTS (SELECT 1 FROM inventory i WHERE i.barcode = 'MOCK-INV-0003');

-- 4) Project requirements
INSERT INTO project_requirements (project_id, inventory_id, required_quantity)
SELECT p.id, i.id, 10
FROM projects p
JOIN inventory i ON i.barcode = 'MOCK-INV-0001'
WHERE p.name = 'Coral Growth Trial - Alpha'
  AND NOT EXISTS (
    SELECT 1 FROM project_requirements pr
    WHERE pr.project_id = p.id AND pr.inventory_id = i.id
  );

INSERT INTO project_requirements (project_id, inventory_id, required_quantity)
SELECT p.id, i.id, 6
FROM projects p
JOIN inventory i ON i.barcode = 'MOCK-INV-0002'
WHERE p.name = 'Kelp Nutrient Matrix'
  AND NOT EXISTS (
    SELECT 1 FROM project_requirements pr
    WHERE pr.project_id = p.id AND pr.inventory_id = i.id
  );

-- 5) Inventory transactions (trigger updates quantity on first insert only)
INSERT INTO inventory_transactions (inventory_id, change_amount, reason, user_id, type, unit_cost)
SELECT i.id, -3, 'Mock usage for coral assay run', u.id, 'out', 48.50
FROM inventory i
JOIN users u ON u.email = 'inventory.demo@sandy-lab.local'
WHERE i.barcode = 'MOCK-INV-0001'
  AND NOT EXISTS (
    SELECT 1 FROM inventory_transactions t
    WHERE t.inventory_id = i.id AND t.reason = 'Mock usage for coral assay run'
  );

INSERT INTO inventory_transactions (inventory_id, change_amount, reason, user_id, type, unit_cost)
SELECT i.id, 5, 'Mock restock delivery batch RB-77', u.id, 'in', 22.75
FROM inventory i
JOIN users u ON u.email = 'inventory.demo@sandy-lab.local'
WHERE i.barcode = 'MOCK-INV-0002'
  AND NOT EXISTS (
    SELECT 1 FROM inventory_transactions t
    WHERE t.inventory_id = i.id AND t.reason = 'Mock restock delivery batch RB-77'
  );

-- 6) Experiments log
INSERT INTO experiments_log (project_id, result, success, notes, user_id, duration_min, cost)
SELECT p.id, 'Growth +14% vs control', TRUE, 'Stable temp. Slight pH wobble at hour 6.', u.id, 95, 185.40
FROM projects p
JOIN users u ON u.email = 'researcher.demo@sandy-lab.local'
WHERE p.name = 'Coral Growth Trial - Alpha'
  AND NOT EXISTS (
    SELECT 1 FROM experiments_log e
    WHERE e.project_id = p.id AND e.result = 'Growth +14% vs control'
  );

INSERT INTO experiments_log (project_id, result, success, notes, user_id, duration_min, cost)
SELECT p.id, 'Nutrient mix B underperformed', FALSE, 'Chlorophyll drop after day 2.', u.id, 70, 92.00
FROM projects p
JOIN users u ON u.email = 'researcher.demo@sandy-lab.local'
WHERE p.name = 'Kelp Nutrient Matrix'
  AND NOT EXISTS (
    SELECT 1 FROM experiments_log e
    WHERE e.project_id = p.id AND e.result = 'Nutrient mix B underperformed'
  );

-- 7) Research cache
INSERT INTO research_cache (topic, summary, source)
SELECT 'Coral salinity stress', 'Coral fragments tolerated 33-36ppt with gradual acclimation.', 'doi:10.1000/mock.coral.2026'
WHERE NOT EXISTS (
  SELECT 1 FROM research_cache r WHERE r.topic = 'Coral salinity stress'
);

INSERT INTO research_cache (topic, summary, source)
SELECT 'Kelp nitrogen ratio', 'Higher nitrate ratios improved regrowth in controlled tanks.', 'https://example.org/mock-kelp-study'
WHERE NOT EXISTS (
  SELECT 1 FROM research_cache r WHERE r.topic = 'Kelp nitrogen ratio'
);

-- 8) AI action logs
INSERT INTO ai_actions_log (action_type, description, metadata, user_id, agent, tokens, cost_usd)
SELECT
  'chat_stream',
  'Mock planner run for weekly lab briefing.',
  '{"model":"openrouter:openai/gpt-4o-mini","prompt_chars":184}'::jsonb,
  u.id,
  'planner',
  820,
  0.004125
FROM users u
WHERE u.email = 'admin.demo@sandy-lab.local'
  AND NOT EXISTS (
    SELECT 1 FROM ai_actions_log a
    WHERE a.description = 'Mock planner run for weekly lab briefing.'
  );

INSERT INTO ai_actions_log (action_type, description, metadata, user_id, agent, tokens, cost_usd)
SELECT
  'tool_call',
  'Mock inventory-agent low stock sweep.',
  '{"tool":"list_low_stock","limit":20}'::jsonb,
  u.id,
  'inventory-agent',
  140,
  0.000310
FROM users u
WHERE u.email = 'inventory.demo@sandy-lab.local'
  AND NOT EXISTS (
    SELECT 1 FROM ai_actions_log a
    WHERE a.description = 'Mock inventory-agent low stock sweep.'
  );

-- 9) Agent tasks
INSERT INTO agent_tasks (task, status, result, agent, input_payload, output_payload, started_at, finished_at)
SELECT
  'Draft weekly operations summary',
  'completed',
  'Summary generated and posted to notifications.',
  'planner',
  '{"scope":"weekly","sections":["inventory","experiments","alerts"]}'::jsonb,
  '{"notifications_created":2}'::jsonb,
  CURRENT_TIMESTAMP - INTERVAL '2 hour',
  CURRENT_TIMESTAMP - INTERVAL '1 hour 55 minute'
WHERE NOT EXISTS (
  SELECT 1 FROM agent_tasks t WHERE t.task = 'Draft weekly operations summary'
);

INSERT INTO agent_tasks (task, status, result, agent, input_payload, output_payload, started_at, finished_at)
SELECT
  'Investigate low stock anomalies',
  'running',
  NULL,
  'inventory-agent',
  '{"threshold":"below_min","warehouse":"main"}'::jsonb,
  NULL,
  CURRENT_TIMESTAMP - INTERVAL '12 minute',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM agent_tasks t WHERE t.task = 'Investigate low stock anomalies'
);

-- 10) Supervision proposals
INSERT INTO agent_sql_proposals (user_id, sql_text, rationale, status, result_text, error_text, decided_at)
SELECT
  u.id,
  'SELECT id, name, quantity, min_required FROM inventory ORDER BY quantity ASC LIMIT 10',
  'Need quick low-stock overview for Monday planning.',
  'approved',
  '[{"id":1,"name":"PCR Tube Rack","quantity":9,"min_required":20}]',
  NULL,
  CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM users u
WHERE u.email = 'researcher.demo@sandy-lab.local'
  AND NOT EXISTS (
    SELECT 1 FROM agent_sql_proposals p
    WHERE p.sql_text = 'SELECT id, name, quantity, min_required FROM inventory ORDER BY quantity ASC LIMIT 10'
  );

INSERT INTO agent_sql_proposals (user_id, sql_text, rationale, status, result_text, error_text, decided_at)
SELECT
  u.id,
  'SELECT project_id, COUNT(*) AS trials FROM experiments_log GROUP BY project_id ORDER BY trials DESC',
  'Compare experiment load by project before planning next sprint.',
  'pending',
  NULL,
  NULL,
  NULL
FROM users u
WHERE u.email = 'admin.demo@sandy-lab.local'
  AND NOT EXISTS (
    SELECT 1 FROM agent_sql_proposals p
    WHERE p.sql_text = 'SELECT project_id, COUNT(*) AS trials FROM experiments_log GROUP BY project_id ORDER BY trials DESC'
  );
