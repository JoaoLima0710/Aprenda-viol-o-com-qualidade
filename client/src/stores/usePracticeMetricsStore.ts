/**
 * 📊 Practice Metrics Store
 * 
 * Store simples para rastrear métricas de progresso nas práticas.
 * 
 * Métricas:
 * - % de acertos
 * - Tempo médio
 * - Consistência por sessão
 * 
 * Persistência: localStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type PracticeType = 'chord' | 'chord_progression' | 'rhythm' | 'scale' | 'general';

export interface PracticeSession {
  id: string;
  type: PracticeType;
  timestamp: number;
  duration: number; // em segundos
  accuracy: number; // 0-100
  attempts: number;
  correct: number;
  consistency: number; // 0-100 (baseado em variação de acertos)
  metadata?: {
    chordName?: string;
    progressionName?: string;
    exerciseType?: string;
    bpm?: number;
  };
}

export interface PracticeMetrics {
  sessions: PracticeSession[];
  averageAccuracy: number;
  averageTime: number;
  averageConsistency: number;
  totalSessions: number;
  lastSession?: PracticeSession;
  bestSession?: PracticeSession;
}

interface PracticeMetricsState {
  sessions: PracticeSession[];
  
  // Ações
  recordSession: (session: Omit<PracticeSession, 'id' | 'timestamp'>) => void;
  getMetrics: (type?: PracticeType, days?: number) => PracticeMetrics;
  getSessionComparison: (currentSession: PracticeSession) => {
    accuracyChange: number;
    timeChange: number;
    consistencyChange: number;
    isImproving: boolean;
    message: string;
  };
  clearSessions: () => void;
}

export const usePracticeMetricsStore = create<PracticeMetricsState>()(
  persist(
    (set, get) => ({
      sessions: [],

      recordSession: (sessionData) => {
        const session: PracticeSession = {
          ...sessionData,
          id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };

        set((state) => ({
          sessions: [...state.sessions, session].slice(-100), // Manter últimas 100 sessões
        }));
      },

      getMetrics: (type, days = 7) => {
        const state = get();
        const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
        
        let filteredSessions = state.sessions.filter(
          (s) => s.timestamp >= cutoffTime
        );

        if (type) {
          filteredSessions = filteredSessions.filter((s) => s.type === type);
        }

        if (filteredSessions.length === 0) {
          return {
            sessions: [],
            averageAccuracy: 0,
            averageTime: 0,
            averageConsistency: 0,
            totalSessions: 0,
          };
        }

        const totalAccuracy = filteredSessions.reduce((sum, s) => sum + s.accuracy, 0);
        const totalTime = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
        const totalConsistency = filteredSessions.reduce((sum, s) => sum + s.consistency, 0);

        const averageAccuracy = Math.round(totalAccuracy / filteredSessions.length);
        const averageTime = Math.round(totalTime / filteredSessions.length);
        const averageConsistency = Math.round(totalConsistency / filteredSessions.length);

        const lastSession = filteredSessions[filteredSessions.length - 1];
        const bestSession = filteredSessions.reduce((best, current) => {
          const bestScore = best.accuracy * 0.5 + best.consistency * 0.3 + (100 - best.duration / 10) * 0.2;
          const currentScore = current.accuracy * 0.5 + current.consistency * 0.3 + (100 - current.duration / 10) * 0.2;
          return currentScore > bestScore ? current : best;
        }, filteredSessions[0]);

        return {
          sessions: filteredSessions,
          averageAccuracy,
          averageTime,
          averageConsistency,
          totalSessions: filteredSessions.length,
          lastSession,
          bestSession,
        };
      },

      getSessionComparison: (currentSession) => {
        const state = get();
        const recentSessions = state.sessions
          .filter((s) => s.type === currentSession.type)
          .slice(-5); // Últimas 5 sessões do mesmo tipo

        if (recentSessions.length === 0) {
          return {
            accuracyChange: 0,
            timeChange: 0,
            consistencyChange: 0,
            isImproving: true,
            message: 'Primeira sessão! Continue praticando para ver seu progresso.',
          };
        }

        const previousSession = recentSessions[recentSessions.length - 1];
        const avgRecentSessions = recentSessions.length > 1
          ? {
              accuracy: recentSessions.slice(0, -1).reduce((sum, s) => sum + s.accuracy, 0) / (recentSessions.length - 1),
              time: recentSessions.slice(0, -1).reduce((sum, s) => sum + s.duration, 0) / (recentSessions.length - 1),
              consistency: recentSessions.slice(0, -1).reduce((sum, s) => sum + s.consistency, 0) / (recentSessions.length - 1),
            }
          : {
              accuracy: previousSession.accuracy,
              time: previousSession.duration,
              consistency: previousSession.consistency,
            };

        const accuracyChange = currentSession.accuracy - avgRecentSessions.accuracy;
        const timeChange = avgRecentSessions.time - currentSession.duration; // Positivo = mais rápido
        const consistencyChange = currentSession.consistency - avgRecentSessions.consistency;

        // Considerar melhoria se: acurácia melhorou OU (tempo melhorou E consistência melhorou)
        const isImproving =
          accuracyChange > 5 ||
          (timeChange > 5 && consistencyChange > 5) ||
          (accuracyChange > 0 && consistencyChange > 0);

        let message = '';
        if (isImproving) {
          if (accuracyChange > 10) {
            message = `Excelente! Você melhorou ${Math.round(accuracyChange)}% na precisão! 🎉`;
          } else if (timeChange > 10) {
            message = `Ótimo! Você está ${Math.round(timeChange)}s mais rápido! ⚡`;
          } else if (consistencyChange > 10) {
            message = `Parabéns! Sua consistência melhorou ${Math.round(consistencyChange)}%! 📈`;
          } else {
            message = 'Você está melhorando! Continue praticando! 💪';
          }
        } else {
          if (accuracyChange < -10) {
            message = `Sua precisão diminuiu ${Math.round(Math.abs(accuracyChange))}%. Não desanime, continue praticando!`;
          } else if (timeChange < -10) {
            message = `Você está ${Math.round(Math.abs(timeChange))}s mais lento. Foque em qualidade primeiro!`;
          } else {
            message = 'Mantenha o ritmo! A prática constante leva à melhoria.';
          }
        }

        return {
          accuracyChange: Math.round(accuracyChange),
          timeChange: Math.round(timeChange),
          consistencyChange: Math.round(consistencyChange),
          isImproving,
          message,
        };
      },

      clearSessions: () => {
        set({ sessions: [] });
      },
    }),
    {
      name: 'practice-metrics-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
