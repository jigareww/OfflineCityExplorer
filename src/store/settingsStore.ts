import { create } from 'zustand';
import { AppSettingsStorage, MMKVKeys } from '@/storage/mmkv';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  themeMode: ThemeMode;
  offlineSimulation: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleOfflineSimulation: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => {
  const savedTheme = AppSettingsStorage.getString(MMKVKeys.THEME_MODE, 'system') as ThemeMode;
  const savedOfflineSim = AppSettingsStorage.getBoolean(MMKVKeys.OFFLINE_SIMULATION_ENABLED, false);

  return {
    themeMode: savedTheme,
    offlineSimulation: savedOfflineSim,
    setThemeMode: (mode: ThemeMode) => {
      AppSettingsStorage.setString(MMKVKeys.THEME_MODE, mode);
      set({ themeMode: mode });
    },
    toggleOfflineSimulation: () => {
      set((state) => {
        const nextVal = !state.offlineSimulation;
        AppSettingsStorage.setBoolean(MMKVKeys.OFFLINE_SIMULATION_ENABLED, nextVal);
        return { offlineSimulation: nextVal };
      });
    },
  };
});
