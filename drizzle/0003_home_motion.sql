CREATE TABLE IF NOT EXISTS home_motion (
  id INTEGER PRIMARY KEY CHECK(id=1),
  draft TEXT NOT NULL,
  published TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS motion_media (
  key TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  original_name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
