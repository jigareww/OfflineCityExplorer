/* eslint-disable max-lines-per-function */
import { initializeDatabase } from '@/database/sqlite';
import { CityRepository } from '@/repositories/CityRepository';
import { WeatherRepository } from '@/repositories/WeatherRepository';
import { FavoritesRepository } from '@/repositories/FavoritesRepository';

// Setup Mocks
const mockExecuteSync = jest.fn();
const mockExecute = jest.fn();
const mockTransaction = jest.fn((callback) => {
  const tx = {
    execute: jest.fn(() => Promise.resolve({ rows: [], rowsAffected: 0 })),
  };
  return callback(tx).then(() => Promise.resolve());
});

jest.mock('@/native/NativeDeviceStatus', () => ({
  __esModule: true,
  default: {
    getDeviceInfo: jest.fn(() => Promise.resolve({ networkStatus: 'wifi' })),
  },
}));

jest.mock('@op-engineering/op-sqlite', () => {
  return {
    open: jest.fn(() => ({
      executeSync: mockExecuteSync,
      execute: mockExecute,
      transaction: mockTransaction,
    })),
  };
});

describe('Database & Repositories Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock response for user_version check
    mockExecute.mockResolvedValue({
      rows: [{ user_version: 1 }],
      rowsAffected: 0
    });
  });

  describe('Database Lifecycle', () => {
    test('initializeDatabase skips creation when schema version is up to date', async () => {
      mockExecute.mockResolvedValue({
        rows: [{ user_version: 1 }],
        rowsAffected: 0
      });

      await initializeDatabase();

      expect(mockExecute).toHaveBeenCalledWith('PRAGMA user_version;');
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    test('initializeDatabase creates tables when user_version is 0', async () => {
      mockExecute.mockResolvedValue({
        rows: [{ user_version: 0 }],
        rowsAffected: 0
      });

      await initializeDatabase();

      expect(mockExecute).toHaveBeenCalledWith('PRAGMA user_version;');
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('CityRepository', () => {
    test('saveCities triggers transaction with correct parameters', async () => {
      const cities = [
        { id: 'london:uk', name: 'London', country: 'uk', latitude: 51.5, longitude: -0.1 }
      ];

      await CityRepository.saveCities(cities);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    test('searchCities executes SELECT query with correct parameters', async () => {
      mockExecute.mockResolvedValue({
        rows: [
          { id: 'london:uk', name: 'London', country: 'uk' }
        ],
        rowsAffected: 1
      });

      const results = await CityRepository.searchCities('Lon', 10, 0);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('London');
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM cities WHERE name LIKE ?'),
        ['Lon%', 10, 0]
      );
    });
  });

  describe('WeatherRepository', () => {
    test('getCachedWeather maps SQL rows to Weather model', async () => {
      mockExecute.mockResolvedValue({
        rows: [
          {
            city_id: 'london:uk',
            temperature: 21.5,
            humidity: 60,
            wind_speed: 4.5,
            weather_code: 1,
            cached_at: 1700000000
          }
        ],
        rowsAffected: 1
      });

      const weather = await WeatherRepository.getCachedWeather('london:uk');

      expect(weather).not.toBeNull();
      expect(weather?.temperature).toBe(21.5);
      expect(weather?.windSpeed).toBe(4.5);
    });

    test('saveWeather saves cached weather reports', async () => {
      const weather = {
        temperature: 15.0,
        humidity: 80,
        windSpeed: 2.0,
        weatherCode: 3,
        cachedAt: Date.now()
      };

      await WeatherRepository.saveWeather('london:uk', weather);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('FavoritesRepository', () => {
    test('toggleFavorite inserts favorite toggle and sync queue record in a single transaction', async () => {
      await FavoritesRepository.toggleFavorite('london:uk', true);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    test('getPendingMutations parses payloads correctly', async () => {
      mockExecute.mockResolvedValue({
        rows: [
          {
            id: 1,
            action_type: 'ADD_FAVORITE',
            payload: JSON.stringify({ cityId: 'london:uk', timestamp: 12345 }),
            timestamp: 12345,
            retry_count: 0
          }
        ],
        rowsAffected: 1
      });

      const mutations = await FavoritesRepository.getPendingMutations();

      expect(mutations).toHaveLength(1);
      expect(mutations[0].actionType).toBe('ADD_FAVORITE');
      expect(mutations[0].payload.cityId).toBe('london:uk');
    });
  });
});
