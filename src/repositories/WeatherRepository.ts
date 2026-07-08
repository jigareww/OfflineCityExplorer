import { executeQuery, executeTransaction } from '@/database/sqlite';
import { City, Weather } from '@/models';
import { weatherApiClient, executeWithDeduplication } from '@/services/api';

interface DBWeather {
  city_id: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  weather_code: number;
  cached_at: number;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
}

const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes cache freshness

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
      weather.cachedAt
    ];
    await executeTransaction([{ sql, params }]);
  }

  static async getWeather(city: City): Promise<Weather | null> {
    const cachedWeather = await this.getCachedWeather(city.id);
    
    // If cache is fresh, return immediately without network calls
    if (cachedWeather && Date.now() - cachedWeather.cachedAt < STALE_THRESHOLD_MS) {
      console.log(`[WeatherRepository] Cache hit (fresh) for city: ${city.id}`);
      return cachedWeather;
    }

    // Coordinates check
    const lat = city.latitude ?? 0.0;
    const lng = city.longitude ?? 0.0;

    try {
      console.log(`[WeatherRepository] Cache stale or missing. Fetching online weather forecast for: ${city.id}`);
      const response = await executeWithDeduplication<OpenMeteoResponse>(
        weatherApiClient,
        {
          method: 'GET',
          url: '/forecast',
          params: {
            latitude: lat,
            longitude: lng,
            current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
          },
        }
      );

      const weather: Weather = {
        temperature: response.current.temperature_2m,
        humidity: response.current.relative_humidity_2m,
        windSpeed: response.current.wind_speed_10m,
        weatherCode: response.current.weather_code,
        cachedAt: Date.now(),
      };

      // Save to database cache
      await this.saveWeather(city.id, weather);
      return weather;
    } catch (error) {
      console.warn(`[WeatherRepository] Online weather fetch failed for ${city.id}:`, error);
      
      // Offline fallback: Return cache if available (even if stale)
      if (cachedWeather) {
        console.log(`[WeatherRepository] Falling back to stale cached weather for ${city.id}`);
        return cachedWeather;
      }
      
      // If no cache, propagate the error so UI knows to show error state
      throw error;
    }
  }
}
