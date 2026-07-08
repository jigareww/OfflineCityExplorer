/* eslint-disable max-lines-per-function */
import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import BackgroundFetch from 'react-native-background-fetch';
import { queryClient } from '@/services/queryClient';
import { AppNavigator } from '@/navigation/AppNavigator';
import { initializeDatabase } from '@/database/sqlite';
import { useFavoritesStore } from '@/store/favoritesStore';
import { SyncQueueService } from '@/services/SyncQueueService';

function App(): React.JSX.Element {
  useEffect(() => {
    // 1. Initialize SQLite Database
    initializeDatabase();

    // 2. Load cached Favorites
    useFavoritesStore.getState().loadFavorites();

    // 3. Process Sync Queue instantly on boot
    SyncQueueService.processQueue();

    // 4. Listen to AppState transitions (sync when app is brought to foreground)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[App] Returned to foreground. Triggering sync queue process...');
        SyncQueueService.processQueue();
      }
    };
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // 5. Configure periodic background fetch sync
    BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // 15 minutes
        stopOnTerminate: false,
        enableHeadless: true,
        startOnBoot: true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
      },
      async (taskId) => {
        console.log('[BackgroundFetch] Running background sync task: ', taskId);
        await SyncQueueService.processQueue();
        BackgroundFetch.finish(taskId);
      },
      (error) => {
        console.error('[BackgroundFetch] Failed to configure: ', error);
      }
    );

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
