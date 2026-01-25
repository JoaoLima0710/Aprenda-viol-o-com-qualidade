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
  // TÉCNICA - Iniciante
  {
    id: 'first-chord',
    title: 'Primeira Nota',
    description: 'Toque seu primeiro acorde corretamente',
    icon: '🎵',
    xpReward: 50,
    unlocked: false,
  },
  {
    id: 'basic-8-chords',
    title: 'Fundação Sólida',
    description: 'Domine os 8 acordes básicos (Em, Am, E, A, Dm, D, C, G)',
    icon: '🎸',
    xpReward: 200,
    unlocked: false,
  },
  {
    id: 'chord-changes-60',
    title: 'Dedos de Aço',
    description: 'Faça 60 trocas de acordes em 1 minuto',
    icon: '⚡',
    xpReward: 150,
    unlocked: false,
  },
  {
    id: 'first-barre',
    title: 'Pestana Perfeita',
    description: 'Toque o acorde F com pestana por 30 segundos sem zumbido',
    icon: '💪',
    xpReward: 250,
    unlocked: false,
  },
  {
    id: 'rhythm-master',
    title: 'Metrônomo Humano',
    description: 'Mantenha ritmo constante por 3 minutos sem erros',
    icon: '🥁',
    xpReward: 150,
    unlocked: false,
  },
  
  // TEORIA
  {
    id: 'theory-basics',
    title: 'Teórico Iniciante',
    description: 'Complete todas as lições de teoria básica',
    icon: '📖',
    xpReward: 100,
    unlocked: false,
  },
  {
    id: 'harmonic-field',
    title: 'Harmonia Desvendada',
    description: 'Entenda o campo harmônico de C maior',
    icon: '🔮',
    xpReward: 200,
    unlocked: false,
  },
  
  // PERCEPÇÃO AUDITIVA
  {
    id: 'ear-major-minor',
    title: 'Ouvido Iniciante',
    description: 'Identifique 20 acordes maiores/menores consecutivos',
    icon: '👂',
    xpReward: 150,
    unlocked: false,
  },
  {
    id: 'ear-intervals',
    title: 'Ouvido de Ouro',
    description: 'Identifique 50 intervalos corretamente',
    icon: '🏆',
    xpReward: 250,
    unlocked: false,
  },
  
  // REPERTÓRIO
  {
    id: 'first-song',
    title: 'Estreia Musical',
    description: 'Toque sua primeira música do início ao fim',
    icon: '🎤',
    xpReward: 200,
    unlocked: false,
  },
  {
    id: 'three-songs',
    title: 'Repertório Bronze',
    description: 'Domine 3 músicas completas',
    icon: '🥉',
    xpReward: 300,
    unlocked: false,
  },
  {
    id: 'ten-songs',
    title: 'Repertório Prata',
    description: 'Domine 10 músicas de memória',
    icon: '🥈',
    xpReward: 500,
    unlocked: false,
  },
  
  // ESCALAS
  {
    id: 'first-scale',
    title: 'Primeira Escala',
    description: 'Toque a escala pentatônica menor completa',
    icon: '⭐',
    xpReward: 100,
    unlocked: false,
  },
  {
    id: 'scale-speed',
    title: 'Velocista',
    description: 'Toque escala cromática a 120 BPM',
    icon: '🚀',
    xpReward: 200,
    unlocked: false,
  },
  
  // CONSISTÊNCIA
  {
    id: 'week-streak',
    title: 'Uma Semana de Foco',
    description: 'Pratique 7 dias seguidos',
    icon: '🔥',
    xpReward: 100,
    unlocked: false,
  },
  {
    id: 'month-streak',
    title: 'Mês Dedicado',
    description: 'Pratique 30 dias seguidos',
    icon: '🌟',
    xpReward: 500,
    unlocked: false,
  },
  {
    id: 'century-streak',
    title: 'Centenário',
    description: 'Pratique 100 dias seguidos',
    icon: '👑',
    xpReward: 1000,
    unlocked: false,
  },
  {
    id: 'early-bird',
    title: 'Madrugador',
    description: 'Pratique antes das 8h por 7 dias',
    icon: '🌅',
    xpReward: 100,
    unlocked: false,
  },
  {
    id: 'night-owl',
    title: 'Coruja',
    description: 'Pratique após 22h por 7 dias',
    icon: '🦉',
    xpReward: 100,
    unlocked: false,
  },
  
  // PROGRESSÃO DE NÍVEL
  {
    id: 'level-intermediate',
    title: 'Intermediário',
    description: 'Alcance o nível intermediário',
    icon: '📈',
    xpReward: 500,
    unlocked: false,
  },
  {
    id: 'level-advanced',
    title: 'Avançado',
    description: 'Alcance o nível avançado',
    icon: '🎓',
    xpReward: 1000,
    unlocked: false,
  },
  
  // SOCIAL
  {
    id: 'first-recording',
    title: 'Primeira Gravação',
    description: 'Grave sua primeira performance',
    icon: '🎙️',
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
        let leveledUp = false;
        
        // Check level up
        while (newXP >= xpForNext) {
          newXP -= xpForNext;
          newLevel++;
          xpForNext = calculateXPForLevel(newLevel);
          leveledUp = true;
        }
        
        set({
          xp: newXP,
          level: newLevel,
          xpToNextLevel: xpForNext,
        });

        // Feedback tátil e sonoro ao subir de nível
        if (leveledUp) {
          import('@/services/HapticFeedbackService').then(({ hapticFeedbackService }) => {
            hapticFeedbackService.levelUp();
          });
          // Som de level up (com rate limiting)
          import('@/services/GamificationSoundService').then(({ gamificationSoundService }) => {
            gamificationSoundService.playSound('level_up', 0.15);
          });
        } else if (amount >= 50) {
          // Som de XP grande para ganhos significativos
          import('@/services/GamificationSoundService').then(({ gamificationSoundService }) => {
            gamificationSoundService.playSound('xp_bonus', 0.12);
          });
        } else if (amount > 0) {
          // Som de XP pequeno para ganhos normais
          import('@/services/GamificationSoundService').then(({ gamificationSoundService }) => {
            gamificationSoundService.playSound('xp_gain', 0.1);
          });
        }
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
                
                // Som de missão completada
                import('@/services/GamificationSoundService').then(({ gamificationSoundService }) => {
                  gamificationSoundService.playSound('mission_complete', 0.12);
                });
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
          
          // Som de achievement desbloqueado
          import('@/services/GamificationSoundService').then(({ gamificationSoundService }) => {
            gamificationSoundService.playSound('achievement', 0.15);
          });
          
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
          
          // Som de milestone de streak (a cada 5 dias)
          if (newStreak > 0 && newStreak % 5 === 0) {
            import('@/services/GamificationSoundService').then(({ gamificationSoundService }) => {
              gamificationSoundService.playSound('streak_milestone', 0.1);
            });
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
