/**
 * Store para gerenciar micro-progressões de acordes
 * Divide acordes básicos em semanas com desbloqueio gradual baseado em taxa de acerto
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toArray, toSet } from './persistHelpers';

export interface ChordWeek {
  week: number;
  name: string;
  description: string;
  chordIds: string[];
  minAccuracy: number; // Taxa de acerto mínima para desbloquear próxima semana (80%)
}

// Definição das semanas de progressão
export const CHORD_WEEKS: ChordWeek[] = [
  {
    week: 1,
    name: 'Semana 1: Primeiros Acordes',
    description: 'Domine os 3 acordes mais fundamentais',
    chordIds: ['C', 'G', 'D'],
    minAccuracy: 80,
  },
  {
    week: 2,
    name: 'Semana 2: Acordes Poderosos',
    description: 'Aprenda acordes que usam todas as cordas',
    chordIds: ['A', 'E'],
    minAccuracy: 80,
  },
  {
    week: 3,
    name: 'Semana 3: Acordes Menores',
    description: 'Introdução aos acordes menores',
    chordIds: ['Am', 'Em'],
    minAccuracy: 80,
  },
];

interface ChordProgressionState {
  currentWeek: number;
  unlockedWeeks: Set<number>;
  weekProgress: Record<number, {
    week: number;
    chordsCompleted: Set<string>;
    averageAccuracy: number;
    unlocked: boolean;
  }>;
  
  // Verificar se acorde está desbloqueado
  isChordUnlocked: (chordId: string) => boolean;
  
  // Verificar se semana está desbloqueada
  isWeekUnlocked: (week: number) => boolean;
  
  // Completar acorde (com precisão)
  completeChord: (chordId: string, accuracy: number) => void;
  
  // Obter semana atual do usuário
  getCurrentWeek: () => number;
  
  // Obter acordes desbloqueados da semana atual
  getUnlockedChordsForWeek: (week: number) => string[];
  
  // Verificar se pode avançar para próxima semana
  canAdvanceToNextWeek: () => boolean;
  
  // Avançar para próxima semana
  advanceToNextWeek: () => void;
  
  // Obter progresso da semana
  getWeekProgress: (week: number) => {
    completed: number;
    total: number;
    averageAccuracy: number;
    unlocked: boolean;
  };
}

export const useChordProgressionStore = create<ChordProgressionState>()(
  persist(
    (set, get) => ({
      currentWeek: 1,
      unlockedWeeks: new Set([1]), // Semana 1 sempre desbloqueada
      weekProgress: {},
      
      isChordUnlocked: (chordId: string) => {
        const state = get();
        const currentWeek = state.currentWeek;
        
        // Encontrar em qual semana está o acorde
        const chordWeek = CHORD_WEEKS.find(w => w.chordIds.includes(chordId));
        if (!chordWeek) {
          // Acorde não está em nenhuma semana (intermediário/avançado) - sempre desbloqueado
          return true;
        }
        
        // Verificar se a semana do acorde está desbloqueada
        return state.isWeekUnlocked(chordWeek.week);
      },
      
      isWeekUnlocked: (week: number) => {
        const state = get();
        
        // Semana 1 sempre desbloqueada
        if (week === 1) return true;
        
        // Verificar se está nas semanas desbloqueadas
        if (state.unlockedWeeks.has(week)) return true;
        
        // Verificar se semana anterior foi completada com precisão mínima
        const previousWeek = CHORD_WEEKS.find(w => w.week === week - 1);
        if (!previousWeek) return false;
        
        const prevWeekProgress = state.weekProgress[week - 1];
        if (!prevWeekProgress) return false;
        
        // Verificar se todos os acordes da semana anterior foram completados
        const allChordsCompleted = previousWeek.chordIds.every(
          chordId => prevWeekProgress.chordsCompleted.has(chordId)
        );
        
        // Verificar se precisão média é >= mínima
        const accuracyMet = prevWeekProgress.averageAccuracy >= previousWeek.minAccuracy;
        
        return allChordsCompleted && accuracyMet;
      },
      
      completeChord: (chordId: string, accuracy: number) => {
        const state = get();
        
        // Encontrar semana do acorde
        const chordWeek = CHORD_WEEKS.find(w => w.chordIds.includes(chordId));
        if (!chordWeek) return; // Acorde não está em progressão semanal
        
        const weekNum = chordWeek.week;
        const currentProgress = state.weekProgress[weekNum] || {
          week: weekNum,
          chordsCompleted: new Set<string>(),
          averageAccuracy: 0,
          unlocked: state.isWeekUnlocked(weekNum),
        };
        
        // Adicionar acorde aos completados
        const newChordsCompleted = new Set(currentProgress.chordsCompleted);
        newChordsCompleted.add(chordId);
        
        // Calcular nova média de precisão
        const completedChords = Array.from(newChordsCompleted);
        const newAverageAccuracy = completedChords.length > 0
          ? (currentProgress.averageAccuracy * (completedChords.length - 1) + accuracy) / completedChords.length
          : accuracy;
        
        // Atualizar progresso da semana
        set({
          weekProgress: {
            ...state.weekProgress,
            [weekNum]: {
              ...currentProgress,
              chordsCompleted: newChordsCompleted,
              averageAccuracy: newAverageAccuracy,
            },
          },
        });
        
        // Verificar se pode desbloquear próxima semana
        const newState = get();
        if (newState.canAdvanceToNextWeek()) {
          newState.advanceToNextWeek();
        }
      },
      
      getCurrentWeek: () => {
        return get().currentWeek;
      },
      
      getUnlockedChordsForWeek: (week: number) => {
        const state = get();
        const weekData = CHORD_WEEKS.find(w => w.week === week);
        if (!weekData) return [];
        
        if (!state.isWeekUnlocked(week)) return [];
        
        return weekData.chordIds;
      },
      
      canAdvanceToNextWeek: () => {
        const state = get();
        const currentWeek = state.currentWeek;
        
        // Se já está na última semana, não pode avançar
        if (currentWeek >= CHORD_WEEKS.length) return false;
        
        const currentWeekData = CHORD_WEEKS.find(w => w.week === currentWeek);
        if (!currentWeekData) return false;
        
        const weekProgress = state.weekProgress[currentWeek];
        if (!weekProgress) return false;
        
        // Verificar se todos os acordes foram completados
        const allChordsCompleted = currentWeekData.chordIds.every(
          chordId => weekProgress.chordsCompleted.has(chordId)
        );
        
        // Verificar se precisão média é >= mínima
        const accuracyMet = weekProgress.averageAccuracy >= currentWeekData.minAccuracy;
        
        return allChordsCompleted && accuracyMet;
      },
      
      advanceToNextWeek: () => {
        const state = get();
        const nextWeek = state.currentWeek + 1;
        
        if (nextWeek > CHORD_WEEKS.length) return;
        
        set({
          currentWeek: nextWeek,
          unlockedWeeks: new Set(state.unlockedWeeks).add(nextWeek),
          weekProgress: {
            ...state.weekProgress,
            [nextWeek]: {
              week: nextWeek,
              chordsCompleted: new Set<string>(),
              averageAccuracy: 0,
              unlocked: true,
            },
          },
        });
      },
      
      getWeekProgress: (week: number) => {
        const state = get();
        const weekData = CHORD_WEEKS.find(w => w.week === week);
        if (!weekData) {
          return { completed: 0, total: 0, averageAccuracy: 0, unlocked: false };
        }
        
        const weekProgress = state.weekProgress[week] || {
          week,
          chordsCompleted: new Set<string>(),
          averageAccuracy: 0,
          unlocked: state.isWeekUnlocked(week),
        };
        
        return {
          completed: weekProgress.chordsCompleted.size,
          total: weekData.chordIds.length,
          averageAccuracy: weekProgress.averageAccuracy,
          unlocked: weekProgress.unlocked,
        };
      },
    }),
    {
      name: 'chord-progression-store',
      version: 1,
      partialize: (state) => ({
        currentWeek: state.currentWeek,
        unlockedWeeks: toArray(state.unlockedWeeks),
        weekProgress: Object.fromEntries(
          Object.entries(state.weekProgress).map(([week, progress]) => [
            week,
            {
              ...progress,
              chordsCompleted: toArray(progress.chordsCompleted),
            },
          ])
        ),
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as {
          currentWeek?: number;
          unlockedWeeks?: unknown;
          weekProgress?: Record<string, { chordsCompleted?: unknown }>;
        };
        const unlockedWeeks = toSet<number>(persisted?.unlockedWeeks);
        const weekProgress = Object.fromEntries(
          Object.entries(persisted?.weekProgress ?? {}).map(([week, progress]) => [
            week,
            {
              ...progress,
              chordsCompleted: toSet<string>(progress?.chordsCompleted),
            },
          ])
        );

        return {
          ...currentState,
          currentWeek: persisted?.currentWeek ?? currentState.currentWeek,
          unlockedWeeks: unlockedWeeks.size > 0 ? unlockedWeeks : currentState.unlockedWeeks,
          weekProgress: Object.keys(weekProgress).length > 0 ? weekProgress : currentState.weekProgress,
        };
      },
    }
  )
);
