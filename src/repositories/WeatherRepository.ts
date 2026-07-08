import { executeQuery, executeTransaction } from '@/database/sqlite';
import { Weather } from '@/models';

interface DBWeather {
  city_id: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  weather_code: number;
  cached_at: number;
}

export class WeatherRepository {
  static async getCachedWeather(cityId: string): Promise<Weather | null> {
    const sql = 'SELECT * FROM weather WHERE city_id = ?;';
    const result = await executeQuery<DBWeather>(sql, [cityId]);
    if (result.length === 0) {
      return null;
    }
    const dbItem = result[0];
    return {
      temperature: dbItem.temperature,
      humidity: dbItem.humidity,
      windSpeed: dbItem.wind_speed,
      weatherCode: dbItem.weather_code,
      cachedAt: dbItem.cached_at,
    };
  }

  static async saveWeather(cityId: string, weather: Weather): Promise<void> {
    const sql = `INSERT OR REPLACE INTO weather (city_id, temperature, humidity, wind_speed, weather_code, cached_at) 
                 VALUES (?, ?, ?, ?, ?, ?);`;
    const params = [
      cityId,
      weather.temperature,
      weather.humidity,
      weather.windSpeed,
      weather.weatherCode,
      weather.cachedAt,
    ];
    await executeTransaction([{ sql, params }]);
  }
}
