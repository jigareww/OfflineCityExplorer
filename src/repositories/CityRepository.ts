import { executeQuery, executeTransaction } from '@/database/sqlite';
import { City } from '@/models';

export class CityRepository {
  static async saveCities(cities: City[]): Promise<void> {
    if (cities.length === 0) {
      return;
    }

    const queries = cities.map(city => ({
      sql: `INSERT OR REPLACE INTO cities (id, name, country, latitude, longitude, population) 
            VALUES (?, ?, ?, ?, ?, ?);`,
      params: [
        city.id,
        city.name,
        city.country,
        city.latitude ?? null,
        city.longitude ?? null,
        city.population ?? null,
      ],
    }));

    await executeTransaction(queries);
  }

  static async searchCities(
    query: string,
    limit: number,
    offset: number,
  ): Promise<City[]> {
    if (!query || query.trim() === '') {
      const sql = 'SELECT * FROM cities LIMIT ? OFFSET ?;';
      return await executeQuery<City>(sql, [limit, offset]);
    }

    const sql = 'SELECT * FROM cities WHERE name LIKE ? LIMIT ? OFFSET ?;';
    const wildQuery = `${query}%`;
    return await executeQuery<City>(sql, [wildQuery, limit, offset]);
  }

  static async getCityCount(): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM cities;';
    const result = await executeQuery<{ count: number }>(sql);
    return result[0]?.count ?? 0;
  }
}
