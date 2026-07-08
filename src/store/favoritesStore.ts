import { create } from 'zustand';
import { FavoritesRepository } from '@/repositories/FavoritesRepository';

interface FavoritesState {
  favorites: string[];
  loadFavorites: () => Promise<void>;
  toggleFavorite: (cityId: string) => Promise<void>;
  isFavorite: (cityId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  loadFavorites: async () => {
    try {
      const list = await FavoritesRepository.getFavorites();
      set({ favorites: list });
    } catch (e) {
      console.error('[FavoritesStore] Failed to load favorites:', e);
    }
  },
  toggleFavorite: async (cityId: string) => {
    const { favorites } = get();
    const isFav = favorites.includes(cityId);
    
    const nextFavorites = isFav
      ? favorites.filter(id => id !== cityId)
      : [...favorites, cityId];
      
    set({ favorites: nextFavorites });

    try {
      await FavoritesRepository.toggleFavorite(cityId, !isFav);
    } catch (e) {
      console.error('[FavoritesStore] Database toggle write failed. Rolling back...', e);
      set({ favorites });
    }
  },
  isFavorite: (cityId: string) => {
    return get().favorites.includes(cityId);
  },
}));
