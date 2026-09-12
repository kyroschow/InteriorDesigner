import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const MIGRATIONS: string[] = [
  `
  CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    revision INTEGER NOT NULL,
    configuration_revision INTEGER NOT NULL,
    record_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE assets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE generations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    status TEXT NOT NULL,
    stage TEXT,
    scope_json TEXT NOT NULL,
    input_revision INTEGER NOT NULL,
    input_configuration_revision INTEGER NOT NULL,
    catalog_version TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    progress_json TEXT NOT NULL DEFAULT '{}',
    issues_json TEXT NOT NULL DEFAULT '[]',
    error_code TEXT,
    layout_id TEXT,
    created_at TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT
  );
  CREATE INDEX generations_project ON generations(project_id, created_at);
  CREATE TABLE layouts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    generation_id TEXT NOT NULL REFERENCES generations(id),
    activated INTEGER NOT NULL,
    layout_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE idempotency_keys (
    project_id TEXT NOT NULL,
    key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    generation_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (project_id, key)
  );
  `,
]

export class Database {
  readonly sql: DatabaseSync

  constructor(file: string) {
    if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true })
    this.sql = new DatabaseSync(file)
    this.sql.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;')
    this.migrate()
  }

  private migrate() {
    this.sql.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY)')
    const row = this.sql.prepare('SELECT MAX(version) AS v FROM schema_migrations').get() as { v: number | null }
    const current = row.v ?? 0
    MIGRATIONS.slice(current).forEach((migration, i) => {
      this.tx(() => {
        this.sql.exec(migration)
        this.sql.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(current + i + 1)
      })
    })
  }

  /** Run `fn` in an IMMEDIATE transaction (writers serialize; revision checks stay atomic). */
  tx<T>(fn: () => T): T {
    this.sql.exec('BEGIN IMMEDIATE')
    try {
      const result = fn()
      this.sql.exec('COMMIT')
      return result
    } catch (err) {
      this.sql.exec('ROLLBACK')
      throw err
    }
  }

  close() {
    this.sql.close()
  }
}
