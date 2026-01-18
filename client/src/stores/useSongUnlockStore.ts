import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useChordStore } from './useChordStore';
import { useScaleProgressionStore } from './useScaleProgressionStore';
import { useGamificationStore } from './useGamificationStore';
import { useSongStore } from './useSongStore';
import { Song, songs } from '@/data/songs';

interface SongUnlockStore {
  unlockedSongs: Set<string>;
  masteredSongs: Set<string>;
  
  // Verificar se música está desbloqueada
  isSongUnlocked: (songId: string) => boolean;
  
  // Verificar se música foi dominada
  isSongMastered: (songId: string) => boolean;
  
  // Desbloquear música manualmente (para testes ou recompensas)
  unlockSong: (songId: string) => void;
  
  // Marcar música como dominada
  masterSong: (songId: string) => void;
  
  // Verificar requisitos de desbloqueio
  getUnlockRequirements: (songId: string) => {
    met: boolean;
    requirements: Array<{ type: string; description: string; met: boolean }>;
  };
  
  // Obter próximas músicas que podem ser desbloqueadas
  getNextUnlockableSongs: () => Song[];
  
  // Obter músicas desbloqueadas
  getUnlockedSongs: () => Song[];
  
  // Obter músicas bloqueadas
  getLockedSongs: () => Song[];
}

// Requisitos de desbloqueio baseados em acordes dominados, escalas, nível, etc
const getSongUnlockRequirements = (song: Song): Array<{ type: string; description: string; met: boolean }> => {
  const chordStore = useChordStore.getState();
  const scaleStore = useScaleProgressionStore.getState();
  const gamificationStore = useGamificationStore.getState();
  const songStore = useSongStore.getState();
  
  const requirements: Array<{ type: string; description: string; met: boolean }> = [];
  
  // Requisito 1: Nível mínimo baseado na dificuldade
  const minLevel = song.difficulty === 'beginner' ? 1 : song.difficulty === 'intermediate' ? 3 : 5;
  const levelMet = gamificationStore.level >= minLevel;
  requirements.push({
    type: 'level',
    description: `Nível ${minLevel}`,
    met: levelMet,
  });
  
  // Requisito 2: Acordes necessários dominados (simplificado - verifica se pelo menos alguns foram praticados)
  const requiredChords = song.chords;
  const practicedChords = Object.values(chordStore.progress).filter(p => p?.practiced).length;
  // Para iniciantes, requer pelo menos 2 acordes praticados; intermediário 5; avançado 10
  const minChords = song.difficulty === 'beginner' ? 2 : song.difficulty === 'intermediate' ? 5 : 10;
  const chordsMet = practicedChords >= minChords;
  
  requirements.push({
    type: 'chords',
    description: `Praticar ${minChords} acordes diferentes`,
    met: chordsMet,
  });
  
  // Requisito 3: Para intermediário/avançado, requer escalas básicas
  if (song.difficulty !== 'beginner') {
    const basicScales = ['c-major', 'a-minor', 'g-major'];
    const scalesMet = basicScales.every(scaleId => scaleStore.isScaleMastered(scaleId));
    requirements.push({
      type: 'scales',
      description: 'Dominar escalas básicas',
      met: scalesMet,
    });
  }
  
  // Requisito 4: Número mínimo de músicas praticadas (para progressão)
  const practicedSongs = Object.values(songStore.progress).filter(p => p.practiced).length;
  const minSongs = song.difficulty === 'beginner' ? 0 : song.difficulty === 'intermediate' ? 3 : 10;
  const songsMet = practicedSongs >= minSongs;
  
  requirements.push({
    type: 'songs',
    description: `Praticar ${minSongs} músicas`,
    met: songsMet,
  });
  
  return requirements;
};

export const useSongUnlockStore = create<SongUnlockStore>()(
  persist(
    (set, get) => {
      // Músicas iniciantes sempre desbloqueadas
      const initialUnlocked = new Set(
        songs
          .filter(s => s.difficulty === 'beginner')
          .map(s => s.id)
      );
      
      return {
        unlockedSongs: initialUnlocked,
        masteredSongs: new Set<string>(),
        
        isSongUnlocked: (songId: string) => {
          return get().unlockedSongs.has(songId);
        },
        
        isSongMastered: (songId: string) => {
          return get().masteredSongs.has(songId);
        },
        
        unlockSong: (songId: string) => {
          set((state) => ({
            unlockedSongs: new Set(state.unlockedSongs).add(songId),
          }));
        },
        
        masterSong: (songId: string) => {
          set((state) => ({
            masteredSongs: new Set(state.masteredSongs).add(songId),
          }));
        },
        
        getUnlockRequirements: (songId: string) => {
          const song = songs.find(s => s.id === songId);
          if (!song) {
            return { met: false, requirements: [] };
          }
          
          const requirements = getSongUnlockRequirements(song);
          const met = requirements.every(r => r.met);
          
          return { met, requirements };
        },
        
        getNextUnlockableSongs: () => {
          const unlocked = get().unlockedSongs;
          return songs.filter(song => {
            if (unlocked.has(song.id)) return false;
            const { met } = get().getUnlockRequirements(song.id);
            return met;
          });
        },
        
        getUnlockedSongs: () => {
          return songs.filter(song => get().unlockedSongs.has(song.id));
        },
        
        getLockedSongs: () => {
          return songs.filter(song => !get().unlockedSongs.has(song.id));
        },
      };
    },
    {
      name: 'song-unlock-store',
      version: 1,
    }
  )
);

// Auto-desbloquear músicas quando requisitos são atendidos
export const checkAndUnlockSongs = () => {
  const store = useSongUnlockStore.getState();
  const nextUnlockable = store.getNextUnlockableSongs();
  
  nextUnlockable.forEach(song => {
    store.unlockSong(song.id);
  });
};
