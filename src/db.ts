import { Pool } from "pg";

// --- In-memory fallback (used when DATABASE_URL is not set) ---

interface MemChannel {
  id: number;
  title: string;
  level: string;
  active: boolean;
}

const memChannels = new Map<number, MemChannel>();
const memProgress = new Map<string, number>();

const useMemory = !process.env.DATABASE_URL;

if (useMemory) {
  console.warn(
    "DATABASE_URL not set — using in-memory storage (data will be lost on restart)"
  );
}

// --- PostgreSQL pool (only created when DATABASE_URL is present) ---

const pool = useMemory
  ? null
  : new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });

async function query(sql: string, params?: unknown[]) {
  return pool!.query(sql, params);
}

// --- Public interface ---

export interface Channel {
  id: number;
  title: string;
  level: string;
  active: boolean;
}

export async function initDb(): Promise<void> {
  if (useMemory) return;
  await query(`
    CREATE TABLE IF NOT EXISTS channels (
      id BIGINT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      level VARCHAR(2) NOT NULL DEFAULT 'C2',
      active BOOLEAN NOT NULL DEFAULT true,
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS content_progress (
      level VARCHAR(2) NOT NULL,
      content_type TEXT NOT NULL,
      next_index INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (level, content_type)
    )
  `);
}

export async function subscribeChannel(
  id: number,
  title: string
): Promise<void> {
  if (useMemory) {
    const existing = memChannels.get(id);
    memChannels.set(id, {
      id,
      title,
      level: existing?.level ?? "C2",
      active: true,
    });
    return;
  }
  await query(
    `INSERT INTO channels (id, title, active)
     VALUES ($1, $2, true)
     ON CONFLICT (id) DO UPDATE SET active = true, title = $2`,
    [id, title]
  );
}

export async function unsubscribeChannel(id: number): Promise<void> {
  if (useMemory) {
    const ch = memChannels.get(id);
    if (ch) ch.active = false;
    return;
  }
  await query(`UPDATE channels SET active = false WHERE id = $1`, [id]);
}

export async function setChannelLevel(
  id: number,
  level: string
): Promise<void> {
  if (useMemory) {
    const ch = memChannels.get(id);
    if (ch) ch.level = level;
    return;
  }
  await query(`UPDATE channels SET level = $1 WHERE id = $2`, [level, id]);
}

export async function getChannel(id: number): Promise<Channel | undefined> {
  if (useMemory) return memChannels.get(id);
  const result = await query(
    `SELECT id, title, level, active FROM channels WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function getActiveChannels(): Promise<Channel[]> {
  if (useMemory) {
    return [...memChannels.values()].filter((ch) => ch.active);
  }
  const result = await query(
    `SELECT id, title, level FROM channels WHERE active = true`
  );
  return result.rows;
}

// Returns the current index for peeking (used by /preview — does not advance)
export async function peekIndex(
  level: string,
  contentType: string
): Promise<number> {
  if (useMemory) return memProgress.get(`${level}:${contentType}`) ?? 0;
  const result = await query(
    `SELECT next_index FROM content_progress WHERE level = $1 AND content_type = $2`,
    [level, contentType]
  );
  return (result.rows[0]?.next_index as number) ?? 0;
}

// Returns the current index and atomically increments it for the next send
export async function getAndIncrementIndex(
  level: string,
  contentType: string
): Promise<number> {
  const key = `${level}:${contentType}`;
  if (useMemory) {
    const current = memProgress.get(key) ?? 0;
    memProgress.set(key, current + 1);
    return current;
  }
  const result = await query(
    `INSERT INTO content_progress (level, content_type, next_index)
     VALUES ($1, $2, 1)
     ON CONFLICT (level, content_type) DO UPDATE
       SET next_index = content_progress.next_index + 1
     RETURNING content_progress.next_index - 1 AS used_index`,
    [level, contentType]
  );
  return result.rows[0].used_index as number;
}
