import { executeQuery, executeTransaction } from '@/database/sqlite';
import { PendingMutation } from '@/models';

interface DBFavorite {
  city_id: string;
  is_favorite: number;
  updated_at: number;
}

interface DBMutation {
  id: number;
  action_type: string;
  payload: string;
  timestamp: number;
  retry_count: number;
}

export class FavoritesRepository {
  static async getFavorites(): Promise<string[]> {
    const sql = 'SELECT city_id FROM favorites WHERE is_favorite = 1;';
    const result = await executeQuery<{ city_id: string }>(sql);
    return result.map(row => row.city_id);
  }

  static async isFavorite(cityId: string): Promise<boolean> {
    const sql = 'SELECT is_favorite FROM favorites WHERE city_id = ?;';
    const result = await executeQuery<DBFavorite>(sql, [cityId]);
    if (result.length === 0) {
      return false;
    }
    return result[0].is_favorite === 1;
  }

  static async toggleFavorite(
    cityId: string,
    isFavorite: boolean,
  ): Promise<void> {
    const timestamp = Date.now();
    const isFavInt = isFavorite ? 1 : 0;

    const favSql = `INSERT OR REPLACE INTO favorites (city_id, is_favorite, updated_at) 
                    VALUES (?, ?, ?);`;

    const actionType = isFavorite ? 'ADD_FAVORITE' : 'REMOVE_FAVORITE';
    const payload = JSON.stringify({ cityId, timestamp });
    const queueSql = `INSERT INTO pending_sync_queue (action_type, payload, timestamp, retry_count) 
                      VALUES (?, ?, ?, 0);`;

    const queries = [
      { sql: favSql, params: [cityId, isFavInt, timestamp] },
      { sql: queueSql, params: [actionType, payload, timestamp] },
    ];

    await executeTransaction(queries);
  }

  static async getPendingMutations(): Promise<PendingMutation[]> {
    const sql = 'SELECT * FROM pending_sync_queue ORDER BY timestamp ASC;';
    const result = await executeQuery<DBMutation>(sql);

    return result.map(row => {
      let parsedPayload = { cityId: '', timestamp: 0 };
      try {
        parsedPayload = JSON.parse(row.payload);
      } catch (e) {
        console.error(
          '[FavoritesRepository] Failed to parse pending sync payload',
          e,
        );
      }
      return {
        id: row.id,
        actionType: row.action_type as 'ADD_FAVORITE' | 'REMOVE_FAVORITE',
        payload: parsedPayload,
        timestamp: row.timestamp,
        retryCount: row.retry_count,
      };
    });
  }

  static async deletePendingMutation(id: number): Promise<void> {
    const sql = 'DELETE FROM pending_sync_queue WHERE id = ?;';
    await executeTransaction([{ sql, params: [id] }]);
  }

  static async incrementRetryCount(id: number): Promise<void> {
    const sql =
      'UPDATE pending_sync_queue SET retry_count = retry_count + 1 WHERE id = ?;';
    await executeTransaction([{ sql, params: [id] }]);
  }
}
