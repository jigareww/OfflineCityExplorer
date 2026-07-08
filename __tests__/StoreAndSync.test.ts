/* eslint-disable max-lines-per-function */
import { useSettingsStore } from '@/store/settingsStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { SyncQueueService } from '@/services/SyncQueueService';
import { FavoritesRepository } from '@/repositories/FavoritesRepository';
import { isOffline } from '@/services/network';
import { createMMKV } from 'react-native-mmkv';

// Mock Network reachability
jest.mock('@/services/network', () => ({
  isOffline: jest.fn(),
}));

// Mock Native JSI Status
jest.mock('@/native/NativeDeviceStatus', () => ({
  __esModule: true,
  default: {
    getDeviceInfo: jest.fn(() => Promise.resolve({ networkStatus: 'wifi' })),
  },
}));

// Mock MMKV inline to avoid Jest hoisting variable initialization issues
jest.mock('react-native-mmkv', () => {
  const mockSet = jest.fn();
  const mockGetString = jest.fn(() => 'system');
  const mockGetBoolean = jest.fn(() => false);
  const mockRemove = jest.fn();
  
  return {
    createMMKV: jest.fn(() => ({
      set: mockSet,
      getString: mockGetString,
      getBoolean: mockGetBoolean,
      remove: mockRemove,
      clearAll: jest.fn(),
    })),
  };
});

// Mock SQLite engine
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

describe('Zustand Stores & SyncQueue Service Unit Tests', () => {
  const mockIsOffline = isOffline as jest.Mock;
  const mockMMKV = createMMKV();

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOffline.mockResolvedValue(false);
  });

  describe('useSettingsStore', () => {
    test('setThemeMode updates theme state and persists to MMKV', () => {
      const store = useSettingsStore.getState();
      
      store.setThemeMode('dark');

      expect(useSettingsStore.getState().themeMode).toBe('dark');
      expect(mockMMKV.set).toHaveBeenCalledWith('theme_mode', 'dark');
    });

    test('toggleOfflineSimulation updates state and MMKV', () => {
      const initialVal = useSettingsStore.getState().offlineSimulation;
      
      useSettingsStore.getState().toggleOfflineSimulation();

      const nextVal = useSettingsStore.getState().offlineSimulation;
      expect(nextVal).toBe(!initialVal);
      expect(mockMMKV.set).toHaveBeenCalledWith('offline_simulation_enabled', nextVal);
    });
  });

  describe('useFavoritesStore', () => {
    test('loadFavorites queries database and updates state', async () => {
      mockExecute.mockResolvedValue({
        rows: [
          { city_id: 'paris:france' },
          { city_id: 'berlin:germany' }
        ],
        rowsAffected: 2
      });

      await useFavoritesStore.getState().loadFavorites();

      expect(useFavoritesStore.getState().favorites).toEqual(['paris:france', 'berlin:germany']);
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT city_id FROM favorites WHERE is_favorite = 1;'),
        []
      );
    });

    test('toggleFavorite applies optimistic updates and triggers repository', async () => {
      useFavoritesStore.setState({ favorites: ['paris:france'] });

      // Toggle off Paris
      await useFavoritesStore.getState().toggleFavorite('paris:france');

      expect(useFavoritesStore.getState().favorites).toEqual([]);
      expect(mockTransaction).toHaveBeenCalledTimes(1); // FavoritesRepository toggled
    });
  });

  describe('SyncQueueService', () => {
    test('processQueue skips processing if offline', async () => {
      mockIsOffline.mockResolvedValue(true);
      const spyPending = jest.spyOn(FavoritesRepository, 'getPendingMutations');

      await SyncQueueService.processQueue();

      expect(spyPending).not.toHaveBeenCalled();
    });

    test('processQueue processes queued items and deletes completed mutations', async () => {
      mockIsOffline.mockResolvedValue(false);
      
      // Mock pending sync mutations
      jest.spyOn(FavoritesRepository, 'getPendingMutations').mockResolvedValue([
        {
          id: 10,
          actionType: 'ADD_FAVORITE',
          payload: { cityId: 'rome:italy', timestamp: 1234 },
          timestamp: 1234,
          retryCount: 0
        }
      ]);

      const spyDelete = jest.spyOn(FavoritesRepository, 'deletePendingMutation').mockResolvedValue();

      await SyncQueueService.processQueue();

      expect(spyDelete).toHaveBeenCalledWith(10);
    });

    test('processQueue skips mutations exceeding retry threshold', async () => {
      mockIsOffline.mockResolvedValue(false);
      
      // Mock pending sync mutations with 5 retries
      jest.spyOn(FavoritesRepository, 'getPendingMutations').mockResolvedValue([
        {
          id: 12,
          actionType: 'REMOVE_FAVORITE',
          payload: { cityId: 'tokyo:japan', timestamp: 1234 },
          timestamp: 1234,
          retryCount: 5
        }
      ]);

      const spyDelete = jest.spyOn(FavoritesRepository, 'deletePendingMutation');

      await SyncQueueService.processQueue();

      expect(spyDelete).not.toHaveBeenCalled();
    });
  });
});
