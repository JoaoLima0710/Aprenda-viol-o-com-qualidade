/**
 * Store para gerenciar progressão e desbloqueio de módulos teóricos
 * Implementa sistema de níveis (Básico, Intermediário, Avançado) com bloqueio de progressão
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toArray, toSet } from './persistHelpers';

export type TheoryLevel = 'basic' | 'intermediate' | 'advanced';

interface TheoryModuleProgress {
  moduleId: string;
  completed: boolean;
  progress: number; // 0-100
  accuracy: number; // 0-100 (taxa de acerto em quizzes/exercícios)
  completedAt?: number;
  attempts: number;
}

interface TheoryProgressionState {
  currentLevel: TheoryLevel;
  moduleProgress: Record<string, TheoryModuleProgress>;
  completedModules: Set<string>;
  
  // Verificar se módulo está desbloqueado
  isModuleUnlocked: (moduleId: string, prerequisites: string[], minAccuracy?: number) => boolean;
  
  // Completar módulo
  completeModule: (moduleId: string, accuracy: number) => void;
  
  // Atualizar progresso
  updateModuleProgress: (moduleId: string, progress: number, accuracy?: number) => void;
  
  // Verificar se pode avançar de nível
  canAdvanceLevel: (targetLevel: TheoryLevel) => boolean;
  
  // Avançar de nível
  advanceLevel: (newLevel: TheoryLevel) => void;
  
  // Obter módulos desbloqueados
  getUnlockedModules: (allModules: string[]) => string[];
  
  // Obter requisitos não atendidos
  getMissingRequirements: (moduleId: string, prerequisites: string[], minAccuracy?: number) => string[];
}

// Módulos básicos sempre desbloqueados
const INITIAL_UNLOCKED_MODULES = ['fundamentals'];

// Requisitos de precisão mínima por nível
const MIN_ACCURACY_BY_LEVEL: Record<TheoryLevel, number> = {
  basic: 70,
  intermediate: 75,
  advanced: 80,
};

// Requisitos para avançar de nível
const LEVEL_REQUIREMENTS: Record<TheoryLevel, { modules: string[]; minAccuracy: number }> = {
  basic: {
    modules: ['fundamentals'],
    minAccuracy: 70,
  },
  intermediate: {
    modules: ['fundamentals', 'intervals', 'scales'],
    minAccuracy: 75,
  },
  advanced: {
    modules: ['fundamentals', 'intervals', 'scales', 'chord-formation', 'progressions'],
    minAccuracy: 80,
  },
};

export const useTheoryProgressionStore = create<TheoryProgressionState>()(
  persist(
    (set, get) => ({
      currentLevel: 'basic',
      moduleProgress: {},
      completedModules: new Set<string>(),
      
      isModuleUnlocked: (moduleId: string, prerequisites: string[], minAccuracy = 70) => {
        // Módulos iniciais sempre desbloqueados
        if (INITIAL_UNLOCKED_MODULES.includes(moduleId)) {
          return true;
        }
        
        // Se já foi completado, está desbloqueado
        if (get().completedModules.has(moduleId)) {
          return true;
        }
        
        // Verificar pré-requisitos
        if (prerequisites.length === 0) {
          return true; // Sem pré-requisitos, está desbloqueado
        }
        
        // Verificar se todos os pré-requisitos foram completados com precisão mínima
        const state = get();
        return prerequisites.every(prereqId => {
          const prereqProgress = state.moduleProgress[prereqId];
          if (!prereqProgress?.completed) {
            return false;
          }
          return prereqProgress.accuracy >= minAccuracy;
        });
      },
      
      completeModule: (moduleId: string, accuracy: number) => {
        const state = get();
        const currentProgress = state.moduleProgress[moduleId] || {
          moduleId,
          completed: false,
          progress: 0,
          accuracy: 0,
          attempts: 0,
        };
        
        set({
          moduleProgress: {
            ...state.moduleProgress,
            [moduleId]: {
              ...currentProgress,
              completed: true,
              progress: 100,
              accuracy: Math.max(currentProgress.accuracy, accuracy),
              completedAt: Date.now(),
              attempts: currentProgress.attempts + 1,
            },
          },
          completedModules: new Set(state.completedModules).add(moduleId),
        });
        
        // Desbloquear exercícios práticos relacionados
        import('@/stores/usePracticeUnlockStore').then(({ usePracticeUnlockStore }) => {
          const practiceStore = usePracticeUnlockStore.getState();
          practiceStore.checkAndUnlockFromTheory(moduleId, Math.max(currentProgress.accuracy, accuracy));
        });
        
        // Registrar tentativa para dificuldade adaptativa
        import('@/stores/useAdaptiveDifficultyStore').then(({ useAdaptiveDifficultyStore }) => {
          const adaptiveStore = useAdaptiveDifficultyStore.getState();
          const difficulty = moduleId.includes('advanced') ? 5 : moduleId.includes('intermediate') ? 3 : 2;
          adaptiveStore.recordAttempt(moduleId, 'theory', difficulty as any, Math.max(currentProgress.accuracy, accuracy));
        });
        
        // Verificar se módulo foi dominado e adicionar à revisão espaçada
        const finalAccuracy = Math.max(currentProgress.accuracy, accuracy);
        if (finalAccuracy >= 80) {
          import('@/stores/useSpacedRepetitionStore').then(({ useSpacedRepetitionStore }) => {
            const spacedStore = useSpacedRepetitionStore.getState();
            if (!spacedStore.isInQueue(moduleId, 'theory')) {
              // Mapear IDs de módulos para nomes amigáveis
              const moduleNames: Record<string, string> = {
                'fundamentals': 'Fundamentos da Música',
                'intervals': 'Intervalos Musicais',
                'scales': 'Escalas Musicais',
                'chord-formation': 'Formação de Acordes',
                'progressions': 'Progressões Harmônicas',
              };
              const moduleName = moduleNames[moduleId] || moduleId;
              spacedStore.addItem(moduleId, 'theory', moduleName);
            }
          });
        }
        
        // Verificar se pode avançar de nível
        const newState = get();
        if (newState.currentLevel === 'basic' && newState.canAdvanceLevel('intermediate')) {
          newState.advanceLevel('intermediate');
        } else if (newState.currentLevel === 'intermediate' && newState.canAdvanceLevel('advanced')) {
          newState.advanceLevel('advanced');
        }
      },
      
      updateModuleProgress: (moduleId: string, progress: number, accuracy?: number) => {
        const state = get();
        const currentProgress = state.moduleProgress[moduleId] || {
          moduleId,
          completed: false,
          progress: 0,
          accuracy: 0,
          attempts: 0,
        };
        
        set({
          moduleProgress: {
            ...state.moduleProgress,
            [moduleId]: {
              ...currentProgress,
              progress: Math.max(currentProgress.progress, progress),
              accuracy: accuracy !== undefined 
                ? Math.max(currentProgress.accuracy, accuracy)
                : currentProgress.accuracy,
            },
          },
        });
      },
      
      canAdvanceLevel: (targetLevel: TheoryLevel) => {
        const state = get();
        const currentLevel = state.currentLevel;
        
        // Não pode retroceder
        if (targetLevel === 'basic' || 
            (currentLevel === 'intermediate' && targetLevel === 'basic') ||
            (currentLevel === 'advanced' && targetLevel !== 'advanced')) {
          return false;
        }
        
        // Verificar requisitos do nível alvo
        const requirements = LEVEL_REQUIREMENTS[targetLevel];
        const allModulesCompleted = requirements.modules.every(moduleId => {
          const progress = state.moduleProgress[moduleId];
          return progress?.completed && progress.accuracy >= requirements.minAccuracy;
        });
        
        return allModulesCompleted;
      },
      
      advanceLevel: (newLevel: TheoryLevel) => {
        set({ currentLevel: newLevel });
      },
      
      getUnlockedModules: (allModules: string[]) => {
        const state = get();
        return allModules.filter(moduleId => {
          // Para simplificar, assumir que módulos básicos não têm pré-requisitos
          // Em implementação completa, isso viria dos dados do módulo
          if (INITIAL_UNLOCKED_MODULES.includes(moduleId)) {
            return true;
          }
          
          // Verificar se foi completado
          if (state.completedModules.has(moduleId)) {
            return true;
          }
          
          // Verificar nível atual
          if (moduleId.includes('advanced') && state.currentLevel !== 'advanced') {
            return false;
          }
          if (moduleId.includes('intermediate') && state.currentLevel === 'basic') {
            return false;
          }
          
          return true;
        });
      },
      
      getMissingRequirements: (moduleId: string, prerequisites: string[], minAccuracy = 70) => {
        const state = get();
        const missing: string[] = [];
        
        prerequisites.forEach(prereqId => {
          const prereqProgress = state.moduleProgress[prereqId];
          if (!prereqProgress?.completed) {
            missing.push(`${prereqId} (não completado)`);
          } else if (prereqProgress.accuracy < minAccuracy) {
            missing.push(`${prereqId} (precisão ${prereqProgress.accuracy}% < ${minAccuracy}%)`);
          }
        });
        
        return missing;
      },
      
      // Aplicar resultado do teste de nivelamento
      applyPlacementTest: (level: 'beginner' | 'intermediate' | 'advanced', score: number) => {
        const state = get();
        
        // Mapear nível do teste para nível teórico
        let theoryLevel: TheoryLevel = 'basic';
        if (level === 'advanced') {
          theoryLevel = 'advanced';
        } else if (level === 'intermediate') {
          theoryLevel = 'intermediate';
        }
        
        // Definir nível atual
        set({ currentLevel: theoryLevel });
        
        // Se intermediário ou avançado, marcar módulos básicos como completados
        if (theoryLevel !== 'basic') {
          const modulesToComplete = ['fundamentals'];
          if (theoryLevel === 'advanced') {
            modulesToComplete.push('intervals', 'scales');
          }
          
          const newModuleProgress = { ...state.moduleProgress };
          const newCompletedModules = new Set(state.completedModules);
          
          modulesToComplete.forEach(moduleId => {
            newModuleProgress[moduleId] = {
              moduleId,
              completed: true,
              progress: 100,
              accuracy: Math.max(70, score),
              completedAt: Date.now(),
              attempts: 1,
            };
            newCompletedModules.add(moduleId);
          });
          
          set({
            moduleProgress: newModuleProgress,
            completedModules: newCompletedModules,
          });
        }
      },
    }),
    {
      name: 'theory-progression-store',
      version: 1,
      partialize: (state) => ({
        currentLevel: state.currentLevel,
        moduleProgress: state.moduleProgress,
        completedModules: toArray(state.completedModules),
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as {
          currentLevel?: TheoryLevel;
          moduleProgress?: Record<string, TheoryModuleProgress>;
          completedModules?: unknown;
        };
        const completedModules = toSet<string>(persisted?.completedModules);

        return {
          ...currentState,
          currentLevel: persisted?.currentLevel ?? currentState.currentLevel,
          moduleProgress: persisted?.moduleProgress ?? currentState.moduleProgress,
          completedModules: completedModules.size > 0 ? completedModules : currentState.completedModules,
        };
      },
    }
  )
);
