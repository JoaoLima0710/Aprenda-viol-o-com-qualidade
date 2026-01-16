import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SongProgress {
  songId: string;
  practiced: boolean;
  lastPracticed?: number;
  timesPlayed: number;
  favorite: boolean;
}

interface SongStore {
  progress: Record<string, SongProgress>;
  currentSong: string | null;
  favorites: string[];
  
  setCurrentSong: (songId: string) => void;
  markAsPracticed: (songId: string) => void;
  toggleFavorite: (songId: string) => void;
  getSongProgress: (songId: string) => SongProgress | undefined;
  getPracticedCount: () => number;
  getFavorites: () => string[];
  isFavorite: (songId: string) => boolean;
}

export const useSongStore = create<SongStore>()(
  persist(
    (set, get) => ({
      progress: {},
      currentSong: null,
      favorites: [],
      
      setCurrentSong: (songId) => {
        set({ currentSong: songId });
      },
      
      markAsPracticed: (songId) => {
        set((state) => {
          const existing = state.progress[songId];
          
          return {
            progress: {
              ...state.progress,
              [songId]: {
                songId,
                practiced: true,
                lastPracticed: Date.now(),
                timesPlayed: existing ? existing.timesPlayed + 1 : 1,
                favorite: existing?.favorite || false,
              },
            },
          };
        });
      },
      
      toggleFavorite: (songId) => {
        set((state) => {
          const isFav = state.favorites.includes(songId);
          const newFavorites = isFav
            ? state.favorites.filter(id => id !== songId)
            : [...state.favorites, songId];
          
          // Update progress as well
          const existing = state.progress[songId];
          const newProgress = {
            ...state.progress,
            [songId]: {
              songId,
              practiced: existing?.practiced || false,
              lastPracticed: existing?.lastPracticed,
              timesPlayed: existing?.timesPlayed || 0,
              favorite: !isFav,
            },
          };
          
          return {
            favorites: newFavorites,
            progress: newProgress,
          };
        });
      },
      
      getSongProgress: (songId) => {
        return get().progress[songId];
      },
      
      getPracticedCount: () => {
        return Object.values(get().progress).filter(p => p.practiced).length;
      },
      
      getFavorites: () => {
        return get().favorites;
      },
      
      isFavorite: (songId) => {
        return get().favorites.includes(songId);
      },
    }),
    {
      name: 'song-store',
      version: 1,
    }
  )
);
