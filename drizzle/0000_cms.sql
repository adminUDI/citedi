CREATE TABLE accounts (email TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','editor')), password TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
--> statement-breakpoint
CREATE TABLE sessions (token TEXT PRIMARY KEY, email TEXT NOT NULL REFERENCES accounts(email), expires INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE home (id INTEGER PRIMARY KEY CHECK(id=1), draft TEXT NOT NULL, published TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, published_at TEXT);
--> statement-breakpoint
CREATE TABLE login_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, until INTEGER NOT NULL);
