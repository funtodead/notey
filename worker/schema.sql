-- One row per phone that turned notifications on.
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  subscription TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- What each phone wants to be notified about, replaced whenever its data changes.
CREATE TABLE IF NOT EXISTS reminders (
  device_id TEXT NOT NULL,
  id TEXT NOT NULL,
  at INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY (device_id, id)
);

CREATE INDEX IF NOT EXISTS reminders_at ON reminders (at);
