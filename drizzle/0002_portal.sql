CREATE TABLE IF NOT EXISTS portal_documents (
  id TEXT PRIMARY KEY,
  draft TEXT NOT NULL,
  published TEXT,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS portal_messages (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL
);
