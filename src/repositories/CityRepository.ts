import { executeQuery, executeTransaction } from '@/database/sqlite';
import { City } from '@/models';
import { countriesApiClient, executeWithDeduplication } from '@/services/api';

interface CountriesNowResponse {
  error: boolean;
  msg: string;
  data: {
    country: string;
    cities: string[];
  }[];
}

export class CityRepository {
  private static getDeterministicCoordinates(cityName: string, countryName: string): { latitude: number; longitude: number } {
    const str = cityName + countryName;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = (Math.abs(hash) % 180) - 90;
    const lng = (Math.abs(hash * 31) % 360) - 180;
    return { latitude: Number(lat.toFixed(4)), longitude: Number(lng.toFixed(4)) };
  }

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
        city.population ?? null
      ]
    }));

    await executeTransaction(queries);
  }

  static async searchCities(query: string, limit: number, offset: number): Promise<City[]> {
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

  static async syncCities(): Promise<void> {
    const count = await this.getCityCount();
    if (count > 0) {
      console.log(`[CityRepository] Local cache already contains ${count} cities. Skipping sync.`);
      return;
    }

    console.log('[CityRepository] Downloading cities list from CountriesNow API...');
    const response = await executeWithDeduplication<CountriesNowResponse>(
      countriesApiClient,
      { method: 'GET', url: '/countries' }
    );

    if (response.error) {
      throw new Error(`CountriesNow API returned error: ${response.msg}`);
    }

    const citiesToSave: City[] = [];
    response.data.forEach(item => {
      const country = item.country;
      item.cities.forEach(cityName => {
        const id = `${cityName}:${country}`.toLowerCase();
        const coords = this.getDeterministicCoordinates(cityName, country);
        citiesToSave.push({
          id,
          name: cityName,
          country,
          latitude: coords.latitude,
          longitude: coords.longitude,
          population: undefined
        });
      });
    });

    console.log(`[CityRepository] Mapped ${citiesToSave.length} cities. Saving to SQLite database...`);
    
    const CHUNK_SIZE = 5000;
    for (let i = 0; i < citiesToSave.length; i += CHUNK_SIZE) {
      const chunk = citiesToSave.slice(i, i + CHUNK_SIZE);
      await this.saveCities(chunk);
    }
    
    console.log('[CityRepository] Database synchronization complete.');
  }
}
