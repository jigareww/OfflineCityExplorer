/* eslint-disable max-lines-per-function */
import { CityRepository } from '@/repositories/CityRepository';
import { WeatherRepository } from '@/repositories/WeatherRepository';
import { executeWithDeduplication } from '@/services/api';

// Mock Network Client API calls
const mockExecuteWithDeduplication = executeWithDeduplication as jest.Mock;

jest.mock('@/native/NativeDeviceStatus', () => ({
  __esModule: true,
  default: {
    getDeviceInfo: jest.fn(() => Promise.resolve({ networkStatus: 'wifi' })),
  },
}));

jest.mock('@/services/api', () => ({
  __esModule: true,
  countriesApiClient: {},
  weatherApiClient: {},
  executeWithDeduplication: jest.fn(),
}));

// Mock database interactions
const mockExecute = jest.fn();
const mockTransaction = jest.fn((callback) => {
  const tx = {
    execute: jest.fn(() => Promise.resolve({ rows: [], rowsAffected: 0 })),
  };
  return callback(tx).then(() => Promise.resolve());
});

jest.mock('@op-engineering/op-sqlite', () => {
  return {
    open: jest.fn(() => ({
      executeSync: jest.fn(),
      execute: mockExecute,
      transaction: mockTransaction,
    })),
  };
});

describe('Repository Synchronization & Caching Coordination Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CityRepository Caching & Sync Coordination', () => {
    test('syncCities downloads from network and chunks saves if local database is empty', async () => {
      // 1. Mock DB count query returning 0
      mockExecute.mockResolvedValue({
        rows: [{ count: 0 }],
        rowsAffected: 1
      });

      // 2. Mock CountriesNow network API response
      mockExecuteWithDeduplication.mockResolvedValue({
        error: false,
        msg: 'success',
        data: [
          {
            country: 'CountryA',
            cities: ['City1', 'City2']
          }
        ]
      });

      await CityRepository.syncCities();

      expect(mockExecute).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM cities;', []);
      expect(mockExecuteWithDeduplication).toHaveBeenCalledTimes(1);
      expect(mockTransaction).toHaveBeenCalledTimes(1); // Mapped cities saved
    });

    test('syncCities skips network download if database already contains cities', async () => {
      // Mock DB count query returning 250 cities
      mockExecute.mockResolvedValue({
        rows: [{ count: 250 }],
        rowsAffected: 1
      });

      await CityRepository.syncCities();

      expect(mockExecute).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM cities;', []);
      expect(mockExecuteWithDeduplication).not.toHaveBeenCalled();
      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  describe('WeatherRepository Freshness & Fallback Coordination', () => {
    const city = {
      id: 'city1:countrya',
      name: 'City1',
      country: 'CountryA',
      latitude: 10.0,
      longitude: 20.0
    };

    test('getWeather returns fresh cache immediately without network queries', async () => {
      const recentTimestamp = Date.now() - 5000; // 5 seconds ago (fresh)
      
      // Mock DB select returning fresh record
      mockExecute.mockResolvedValue({
        rows: [
          {
            city_id: 'city1:countrya',
            temperature: 20.5,
            humidity: 50,
            wind_speed: 3.5,
            weather_code: 1,
            cached_at: recentTimestamp
          }
        ],
        rowsAffected: 1
      });

      const weather = await WeatherRepository.getWeather(city);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM weather WHERE city_id = ?;'),
        ['city1:countrya']
      );
      expect(mockExecuteWithDeduplication).not.toHaveBeenCalled();
      expect(weather?.temperature).toBe(20.5);
    });

    test('getWeather queries network if cache is stale and saves new result', async () => {
      const staleTimestamp = Date.now() - 25 * 60 * 1000; // 25 minutes ago (stale)
      
      // 1. Mock DB select returning stale cache
      mockExecute.mockResolvedValue({
        rows: [
          {
            city_id: 'city1:countrya',
            temperature: 20.5,
            humidity: 50,
            wind_speed: 3.5,
            weather_code: 1,
            cached_at: staleTimestamp
          }
        ],
        rowsAffected: 1
      });

      // 2. Mock Open-Meteo network query response
      mockExecuteWithDeduplication.mockResolvedValue({
        current: {
          temperature_2m: 25.0,
          relative_humidity_2m: 45,
          wind_speed_10m: 5.0,
          weather_code: 2
        }
      });

      const weather = await WeatherRepository.getWeather(city);

      expect(mockExecuteWithDeduplication).toHaveBeenCalledTimes(1);
      expect(mockTransaction).toHaveBeenCalledTimes(1); // New weather saved
      expect(weather?.temperature).toBe(25.0);
    });

    test('getWeather returns stale cache as offline fallback if network query fails', async () => {
      const staleTimestamp = Date.now() - 25 * 60 * 1000;
      
      // 1. Mock DB select returning stale cache
      mockExecute.mockResolvedValue({
        rows: [
          {
            city_id: 'city1:countrya',
            temperature: 12.0,
            humidity: 90,
            wind_speed: 8.0,
            weather_code: 4,
            cached_at: staleTimestamp
          }
        ],
        rowsAffected: 1
      });

      // 2. Mock network failure (Offline state)
      mockExecuteWithDeduplication.mockRejectedValue(new Error('Network connection failed'));

      const weather = await WeatherRepository.getWeather(city);

      // Asserts fallback completed successfully
      expect(mockExecuteWithDeduplication).toHaveBeenCalledTimes(1);
      expect(weather).not.toBeNull();
      expect(weather?.temperature).toBe(12.0); // Returns stale data
    });
  });
});
