CREATE TABLE IF NOT EXISTS academic_records (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  title TEXT NOT NULL,
  owner TEXT NOT NULL,
  reference TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pendiente','En proceso','Concluido','Archivado')),
  notes TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS academic_records_module_updated ON academic_records (module, updated_at DESC, id);
