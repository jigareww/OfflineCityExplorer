import { createMMKV } from 'react-native-mmkv';

const mmkvInstance = createMMKV({
  id: 'offline-city-explorer-preferences',
});

export const MMKVKeys = {
  THEME_MODE: 'theme_mode',
  LAST_CITY_SYNC_TIME: 'last_city_sync_time',
  OFFLINE_SIMULATION_ENABLED: 'offline_simulation_enabled',
} as const;

export const AppSettingsStorage = {
  getString(key: string, defaultValue?: string): string | undefined {
    return mmkvInstance.getString(key) ?? defaultValue;
  },

  setString(key: string, value: string): void {
    mmkvInstance.set(key, value);
  },

  getBoolean(key: string, defaultValue = false): boolean {
    return mmkvInstance.getBoolean(key) ?? defaultValue;
  },

  setBoolean(key: string, value: boolean): void {
    mmkvInstance.set(key, value);
  },

  getNumber(key: string, defaultValue?: number): number | undefined {
    return mmkvInstance.getNumber(key) ?? defaultValue;
  },

  setNumber(key: string, value: number): void {
    mmkvInstance.set(key, value);
  },

  delete(key: string): void {
    mmkvInstance.remove(key);
  },

  clearAll(): void {
    mmkvInstance.clearAll();
  },
};
