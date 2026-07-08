import { FavoritesRepository } from '@/repositories/FavoritesRepository';
import { isOffline } from './network';

export class SyncQueueService {
  private static isProcessing = false;

  static async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    const offline = await isOffline();
    if (offline) {
      console.log('[SyncQueueService] Device is offline. Skipping sync queue processing.');
      return;
    }

    const mutations = await FavoritesRepository.getPendingMutations();
    if (mutations.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`[SyncQueueService] Processing ${mutations.length} queued mutations...`);

    for (const mutation of mutations) {
      if (mutation.retryCount >= 5) {
        console.warn(`[SyncQueueService] Skipping mutation ${mutation.id} due to excessive retries (>= 5).`);
        continue;
      }

      try {
        // Simulating remote backend server synchronization latency
        await new Promise<void>((resolve) => setTimeout(resolve, 300));

        // Delete processed item from the queue
        await FavoritesRepository.deletePendingMutation(mutation.id);
        console.log(`[SyncQueueService] Synchronized mutation ${mutation.id} (${mutation.actionType}) successfully.`);
      } catch (error) {
        console.error(`[SyncQueueService] Failed to process mutation ${mutation.id}:`, error);
        await FavoritesRepository.incrementRetryCount(mutation.id);
      }
    }

    this.isProcessing = false;
  }
}
