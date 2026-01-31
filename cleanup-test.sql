DELETE FROM assets WHERE projectId = 600001;
DELETE FROM generation_history WHERE projectId = 600001;
DELETE FROM projects WHERE id = 600001;
UPDATE users SET freeGenerationsUsed = 0 WHERE id = 1;
