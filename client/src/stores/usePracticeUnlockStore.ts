/**
 * Store para gerenciar desbloqueio de exercícios práticos baseado em módulos teóricos completados
 * Torna teoria e prática interdependentes
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toArray, toSet } from './persistHelpers';

export type PracticeExerciseType = 
  | 'interval-practice'      // Praticar intervalos no violão
  | 'scale-improv'           // Improvisar com escalas
  | 'chord-voicings'         // Explorar voicings de acordes
  | 'progression-play'       // Tocar progressões
  | 'ear-intervals'          // Treino de ouvido - intervalos
  | 'ear-chords'             // Treino de ouvido - acordes
  | 'ear-progressions';      // Treino de ouvido - progressões

interface PracticeExercise {
  id: PracticeExerciseType;
  name: string;
  description: string;
  requiredTheoryModule: string; // ID do módulo teórico necessário
  minAccuracy?: number; // Precisão mínima no módulo teórico (padrão 70%)
}

// Mapeamento de exercícios práticos e seus pré-requisitos teóricos
export const PRACTICE_EXERCISES: PracticeExercise[] = [
  {
    id: 'interval-practice',
    name: 'Toque Intervalos no Violão',
    description: 'Pratique tocar intervalos no violão após aprender a teoria',
    requiredTheoryModule: 'intervals',
    minAccuracy: 70,
  },
  {
    id: 'scale-improv',
    name: 'Improvisar com Escalas',
    description: 'Use escalas para improvisar após dominar a teoria',
    requiredTheoryModule: 'scales',
    minAccuracy: 75,
  },
  {
    id: 'chord-voicings',
    name: 'Explorar Voicings de Acordes',
    description: 'Aprenda diferentes formas de tocar o mesmo acorde',
    requiredTheoryModule: 'chord-formation',
    minAccuracy: 75,
  },
  {
    id: 'progression-play',
    name: 'Tocar Progressões Harmônicas',
    description: 'Pratique progressões completas no violão',
    requiredTheoryModule: 'progressions',
    minAccuracy: 75,
  },
  {
    id: 'ear-intervals',
    name: 'Treino de Ouvido - Intervalos',
    description: 'Identifique intervalos pelo som (requer conhecimento teórico)',
    requiredTheoryModule: 'intervals',
    minAccuracy: 70,
  },
  {
    id: 'ear-chords',
    name: 'Treino de Ouvido - Acordes',
    description: 'Identifique tipos de acordes pelo som',
    requiredTheoryModule: 'chord-formation',
    minAccuracy: 75,
  },
  {
    id: 'ear-progressions',
    name: 'Treino de Ouvido - Progressões',
    description: 'Identifique progressões harmônicas em músicas reais',
    requiredTheoryModule: 'progressions',
    minAccuracy: 75,
  },
];

interface PracticeUnlockState {
  unlockedExercises: Set<PracticeExerciseType>;
  
  // Verificar se exercício está desbloqueado
  isExerciseUnlocked: (exerciseId: PracticeExerciseType) => boolean;
  
  // Desbloquear exercício (chamado automaticamente quando teoria é completada)
  unlockExercise: (exerciseId: PracticeExerciseType) => void;
  
  // Verificar se pode desbloquear exercício baseado em teoria
  checkAndUnlockFromTheory: (theoryModuleId: string, accuracy: number) => void;
  
  // Obter exercícios desbloqueados
  getUnlockedExercises: () => PracticeExerciseType[];
  
  // Obter exercícios bloqueados com requisitos
  getLockedExercises: () => Array<{
    exercise: PracticeExercise;
    missingRequirement: string;
  }>;
}

export const usePracticeUnlockStore = create<PracticeUnlockState>()(
  persist(
    (set, get) => ({
      unlockedExercises: new Set<PracticeExerciseType>(),
      
      isExerciseUnlocked: (exerciseId: PracticeExerciseType) => {
        return get().unlockedExercises.has(exerciseId);
      },
      
      unlockExercise: (exerciseId: PracticeExerciseType) => {
        set((state) => ({
          unlockedExercises: new Set(state.unlockedExercises).add(exerciseId),
        }));
      },
      
      checkAndUnlockFromTheory: (theoryModuleId: string, accuracy: number) => {
        const state = get();
        
        // Encontrar exercícios que requerem este módulo teórico
        const exercisesToUnlock = PRACTICE_EXERCISES.filter(exercise => {
          // Se já está desbloqueado, pular
          if (state.unlockedExercises.has(exercise.id)) {
            return false;
          }
          
          // Verificar se requer este módulo teórico
          if (exercise.requiredTheoryModule !== theoryModuleId) {
            return false;
          }
          
          // Verificar se precisão é suficiente
          const minAccuracy = exercise.minAccuracy || 70;
          return accuracy >= minAccuracy;
        });
        
        // Desbloquear exercícios elegíveis
        exercisesToUnlock.forEach(exercise => {
          state.unlockExercise(exercise.id);
        });
      },
      
      getUnlockedExercises: () => {
        return Array.from(get().unlockedExercises);
      },
      
      getLockedExercises: () => {
        const state = get();
        const unlocked = state.unlockedExercises;
        
        return PRACTICE_EXERCISES
          .filter(exercise => !unlocked.has(exercise.id))
          .map(exercise => ({
            exercise,
            missingRequirement: `Complete módulo "${exercise.requiredTheoryModule}" com ${exercise.minAccuracy || 70}% de precisão`,
          }));
      },
    }),
    {
      name: 'practice-unlock-store',
      version: 1,
      partialize: (state) => ({
        unlockedExercises: toArray(state.unlockedExercises),
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { unlockedExercises?: unknown };
        const unlockedExercises = toSet<PracticeExerciseType>(persisted?.unlockedExercises);

        return {
          ...currentState,
          unlockedExercises: unlockedExercises.size > 0 ? unlockedExercises : currentState.unlockedExercises,
        };
      },
    }
  )
);
