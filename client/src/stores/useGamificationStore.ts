import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: number;
}

interface GamificationStore {
  // XP e Nível
  xp: number;
  level: number;
  xpToNextLevel: number;
  
  // Streak
  currentStreak: number;
  maxStreak: number;
  lastActivityDate: string;
  streakFreezes: number; // Freezes disponíveis para iniciantes
  frozenStreak: boolean; // Se o streak está congelado
  
  // Missões
  dailyMissions: Mission[];
  
  // Conquistas
  achievements: Achievement[];
  
  // Ações
  addXP: (amount: number) => void;
  updateMissionProgress: (missionId: string, progress: number) => void;
  unlockAchievement: (achievementId: string) => void;
  updateStreak: () => void;
  freezeStreak: () => void; // Congelar streak (para iniciantes)
  resetDailyMissions: () => void;
}

const calculateXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

const initialMissions: Mission[] = [
  {
    id: 'daily-chord-practice',
    title: 'Praticar 5 Acordes',
    description: 'Complete 5 acordes diferentes hoje',
    target: 5,
    current: 0,
    xpReward: 50,
    completed: false,
  },
  {
    id: 'daily-scale-practice',
    title: 'Praticar 3 Escalas',
    description: 'Complete 3 escalas diferentes hoje',
    target: 3,
    current: 0,
    xpReward: 50,
    completed: false,
  },
  {
    id: 'practice-time',
    title: '30 Minutos de Prática',
    description: 'Pratique por pelo menos 30 minutos',
    target: 1800,
    current: 0,
    xpReward: 100,
    completed: false,
  },
];

const initialAchievements: Achievement[] = [
  {
    id: 'first-chord',
    title: 'Primeira Nota',
    description: 'Complete seu primeiro acorde',
    icon: '🎵',
    xpReward: 50,
    unlocked: false,
  },
  {
    id: 'first-scale',
    title: 'Primeira Escala',
    description: 'Complete sua primeira escala',
    icon: '⭐',
    xpReward: 50,
    unlocked: false,
  },
  {
    id: 'chord-collector',
    title: 'Colecionador de Acordes',
    description: 'Complete 10 acordes diferentes',
    icon: '🎸',
    xpReward: 150,
    unlocked: false,
  },
  {
    id: 'scale-collector',
    title: 'Colecionador de Escalas',
    description: 'Complete 10 escalas diferentes',
    icon: '📚',
    xpReward: 150,
    unlocked: false,
  },
  {
    id: 'week-streak',
    title: 'Dedicado',
    description: 'Pratique 7 dias seguidos',
    icon: '🔥',
    xpReward: 100,
    unlocked: false,
  },
];

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      xpToNextLevel: 100,
      currentStreak: 0,
      maxStreak: 0,
      lastActivityDate: '',
      streakFreezes: 3, // Iniciantes começam com 3 freezes
      frozenStreak: false,
      dailyMissions: initialMissions,
      achievements: initialAchievements,
      
      addXP: (amount) => {
        const state = get();
        let newXP = state.xp + amount;
        let newLevel = state.level;
        let xpForNext = state.xpToNextLevel;
        
        // Check level up
        while (newXP >= xpForNext) {
          newXP -= xpForNext;
          newLevel++;
          xpForNext = calculateXPForLevel(newLevel);
        }
        
        set({
          xp: newXP,
          level: newLevel,
          xpToNextLevel: xpForNext,
        });
      },
      
      updateMissionProgress: (missionId, progress) => {
        set((state) => ({
          dailyMissions: state.dailyMissions.map((mission) => {
            if (mission.id === missionId && !mission.completed) {
              const newCurrent = Math.min(mission.current + progress, mission.target);
              const completed = newCurrent >= mission.target;
              
              if (completed && !mission.completed) {
                // Award XP
                get().addXP(mission.xpReward);
              }
              
              return {
                ...mission,
                current: newCurrent,
                completed,
              };
            }
            return mission;
          }),
        }));
      },
      
      unlockAchievement: (achievementId) => {
        set((state) => {
          const achievement = state.achievements.find((a) => a.id === achievementId);
          if (!achievement || achievement.unlocked) return state;
          
          // Award XP
          get().addXP(achievement.xpReward);
          
          return {
            achievements: state.achievements.map((a) =>
              a.id === achievementId
                ? { ...a, unlocked: true, unlockedAt: Date.now() }
                : a
            ),
          };
        });
      },
      
      updateStreak: () => {
        const state = get();
        const today = new Date().toDateString();
        const lastActivity = state.lastActivityDate;
        
        if (lastActivity === today) {
          return;
        }
        
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const daysSinceLastActivity = Math.floor(
          (Date.now() - new Date(lastActivity || yesterday).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Se estava congelado, descongelar
        if (state.frozenStreak) {
          set({ frozenStreak: false });
        }
        
        if (lastActivity === yesterday) {
          // Streak continua normalmente
          const newStreak = state.currentStreak + 1;
          set({
            currentStreak: newStreak,
            maxStreak: Math.max(state.maxStreak, newStreak),
            lastActivityDate: today,
          });
          
          // Check streak achievements
          if (newStreak === 7) {
            get().unlockAchievement('week-streak');
          }
        } else if (daysSinceLastActivity <= 2 && state.level <= 3) {
          // Para iniciantes (nível 1-3), permite 1 dia de folga sem perder streak
          // Mas reduz o streak em 1 como "decadência"
          const newStreak = Math.max(0, state.currentStreak - 1);
          set({
            currentStreak: newStreak,
            lastActivityDate: today,
          });
        } else if (daysSinceLastActivity > 2 && state.level <= 3 && state.streakFreezes > 0) {
          // Se passou mais de 2 dias e tem freezes, pode usar um freeze
          // O streak não é perdido, mas não aumenta
          set({
            streakFreezes: state.streakFreezes - 1,
            frozenStreak: true,
            lastActivityDate: today,
          });
        } else {
          // Perde o streak normalmente
          set({
            currentStreak: 1,
            lastActivityDate: today,
          });
        }
      },
      
      freezeStreak: () => {
        const state = get();
        if (state.streakFreezes > 0 && state.level <= 3) {
          set({
            streakFreezes: state.streakFreezes - 1,
            frozenStreak: true,
          });
        }
      },
      
      resetDailyMissions: () => {
        set({
          dailyMissions: initialMissions.map((m) => ({ ...m, current: 0, completed: false })),
        });
      },
    }),
    {
      name: 'gamification-store',
      version: 1,
    }
  )
);
