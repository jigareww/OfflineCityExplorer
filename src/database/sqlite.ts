import { open, DB } from '@op-engineering/op-sqlite';
import { INITIAL_SCHEMA_QUERIES, MIGRATIONS, SCHEMA_VERSION } from './schema';

let dbInstance: DB | null = null;

export function getDB(): DB {
  if (!dbInstance) {
    dbInstance = open({
      name: 'offline_city_explorer.db',
    });

    dbInstance.executeSync('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

export async function initializeDatabase(): Promise<void> {
  const db = getDB();

  const result = await db.execute('PRAGMA user_version;');
  const currentVersion = (result.rows?.[0]?.user_version as number) ?? 0;

  if (currentVersion === 0) {
    await db.transaction(async tx => {
      for (const query of INITIAL_SCHEMA_QUERIES) {
        await tx.execute(query);
      }
    });

    await db.execute(`PRAGMA user_version = ${SCHEMA_VERSION};`);
    console.log(`[Database] Initialized schema version ${SCHEMA_VERSION}`);
  } else if (currentVersion < SCHEMA_VERSION) {
    await db.transaction(async tx => {
      for (const migration of MIGRATIONS) {
        if (
          migration.version > currentVersion &&
          migration.version <= SCHEMA_VERSION
        ) {
          for (const query of migration.queries) {
            await tx.execute(query);
          }
        }
      }
    });

    await db.execute(`PRAGMA user_version = ${SCHEMA_VERSION};`);
    console.log(
      `[Database] Migrated database from version ${currentVersion} to ${SCHEMA_VERSION}`,
    );
  } else {
    console.log(`[Database] Schema up to date. Version: ${currentVersion}`);
  }
}

export async function executeQuery<T = unknown>(
  query: string,
  params: unknown[] = [],
): Promise<T[]> {
  const db = getDB();
  const response = await db.execute(query, params as any[]); // eslint-disable-line @typescript-eslint/no-explicit-any
  return (response.rows ?? []) as unknown as T[];
}

export async function executeInsert(
  query: string,
  params: unknown[] = [],
): Promise<number | undefined> {
  const db = getDB();
  const response = await db.execute(query, params as any[]); // eslint-disable-line @typescript-eslint/no-explicit-any
  return response.insertId;
}

export async function executeTransaction(
  queries: { sql: string; params: unknown[] }[],
): Promise<void> {
  const db = getDB();
  await db.transaction(async tx => {
    for (const q of queries) {
      await tx.execute(q.sql, q.params as any[]); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  });
}
