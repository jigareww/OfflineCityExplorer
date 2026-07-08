export interface Migration {
  version: number;
  queries: string[];
}

export const SCHEMA_VERSION = 1;

export const INITIAL_SCHEMA_QUERIES = [
  `CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    population INTEGER
  );`,
  `CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);`,
  `CREATE TABLE IF NOT EXISTS weather (
    city_id TEXT PRIMARY KEY,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    wind_speed REAL NOT NULL,
    weather_code INTEGER NOT NULL,
    cached_at INTEGER NOT NULL,
    FOREIGN KEY(city_id) REFERENCES cities(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS favorites (
    city_id TEXT PRIMARY KEY,
    is_favorite INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(city_id) REFERENCES cities(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS pending_sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0
  );`,
];

export const MIGRATIONS: Migration[] = [
  // Future migrations will be appended here. Example:
  // {
  //   version: 2,
  //   queries: ["ALTER TABLE cities ADD COLUMN description TEXT;"]
  // }
];
