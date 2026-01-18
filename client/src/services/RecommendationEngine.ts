/**
 * Motor de Recomendação Inteligente - 2026
 * Sistema que gera recomendações personalizadas baseado no perfil de competências
 */

import { competenceSystem, CompetenceDefinition, CompetenceProfile } from './CompetenceSystem';

export interface UserContext {
  currentLevel: number;
  availableTime: number; // minutos
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  recentActivities: string[]; // IDs de exercícios recentes
  goals: string[]; // objetivos declarados
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: number; // 0-6
}

export interface ExerciseRecommendation {
  id: string;
  title: string;
  description: string;
  competenceId: string;
  difficulty: number;
  estimatedDuration: number; // minutos
  priority: 'high' | 'medium' | 'low';
  reason: string;
  expectedOutcome: string;
  prerequisites: string[]; // competências necessárias
  category: 'practice' | 'theory' | 'ear' | 'review';
}

export interface SessionRecommendation {
  exercises: ExerciseRecommendation[];
  totalDuration: number;
  focusArea: string;
  progressionPath: string[];
  estimatedDifficulty: number;
}

export class RecommendationEngine {
  private static instance: RecommendationEngine;

  // Base de exercícios mapeados por competência
  private exerciseDatabase: ExerciseRecommendation[] = [
    // Harmonia
    {
      id: 'chord_basic_c_formation',
      title: 'Formar Acorde de C',
      description: 'Pratique a formação básica do acorde de Dó',
      competenceId: 'chord-formation',
      difficulty: 2,
      estimatedDuration: 5,
      priority: 'medium',
      reason: 'Competência fundamental para começar',
      expectedOutcome: 'Capacidade de formar C consistentemente',
      prerequisites: [],
      category: 'practice'
    },
    {
      id: 'chord_basic_transitions_c_g',
      title: 'Transições C → G',
      description: 'Alterne entre C e G em ritmo constante',
      competenceId: 'chord-transitions',
      difficulty: 3,
      estimatedDuration: 8,
      priority: 'high',
      reason: 'Transição fundamental em músicas populares',
      expectedOutcome: 'Transições suaves entre acordes básicos',
      prerequisites: ['chord-formation'],
      category: 'practice'
    },
    {
      id: 'chord_recognition_basic',
      title: 'Reconhecer Acordes Básicos',
      description: 'Identifique acordes C, G, Am e F',
      competenceId: 'chord-recognition',
      difficulty: 2,
      estimatedDuration: 6,
      priority: 'medium',
      reason: 'Base para leitura de cifras',
      expectedOutcome: 'Reconhecimento instantâneo de acordes básicos',
      prerequisites: [],
      category: 'practice'
    },

    // Ritmo
    {
      id: 'rhythm_basic_steadiness',
      title: 'Ritmo Constante',
      description: 'Mantenha tempo constante em 80 BPM',
      competenceId: 'rhythmic-precision',
      difficulty: 2,
      estimatedDuration: 7,
      priority: 'high',
      reason: 'Fundamento de todas as músicas',
      expectedOutcome: 'Capacidade de manter tempo estável',
      prerequisites: [],
      category: 'practice'
    },
    {
      id: 'rhythm_subdivision_sixteenth',
      title: 'Subdivisão em Semicolcheias',
      description: 'Pratique feeling de semicolcheias',
      competenceId: 'rhythmic-subdivision',
      difficulty: 4,
      estimatedDuration: 10,
      priority: 'medium',
      reason: 'Próximo nível de precisão rítmica',
      expectedOutcome: 'Execução confortável de ritmos complexos',
      prerequisites: ['rhythmic-precision'],
      category: 'practice'
    },

    // Técnica
    {
      id: 'technique_finger_independence',
      title: 'Independência dos Dedos',
      description: 'Exercícios para coordenação dos dedos',
      competenceId: 'finger-technique',
      difficulty: 3,
      estimatedDuration: 8,
      priority: 'medium',
      reason: 'Melhora qualidade de execução',
      expectedOutcome: 'Maior precisão e velocidade',
      prerequisites: [],
      category: 'practice'
    },

    // Teoria
    {
      id: 'theory_intervals_basic',
      title: 'Intervalos Musicais',
      description: 'Aprenda terça maior, terça menor, quinta justa',
      competenceId: 'music-theory-basics',
      difficulty: 3,
      estimatedDuration: 6,
      priority: 'low',
      reason: 'Contexto para acordes e escalas',
      expectedOutcome: 'Compreensão de relações entre notas',
      prerequisites: [],
      category: 'theory'
    },

    // Ouvido
    {
      id: 'ear_intervals_identification',
      title: 'Identificar Intervalos',
      description: 'Ouça e identifique intervalos musicais',
      competenceId: 'ear-training',
      difficulty: 4,
      estimatedDuration: 8,
      priority: 'medium',
      reason: 'Desenvolve percepção musical',
      expectedOutcome: 'Capacidade de reconhecer intervalos pelo ouvido',
      prerequisites: ['music-theory-basics'],
      category: 'ear'
    }
  ];

  private constructor() {}

  static getInstance(): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine();
    }
    return RecommendationEngine.instance;
  }

  /**
   * Gera recomendação para próximo exercício individual
   */
  getNextExerciseRecommendation(userContext: UserContext): ExerciseRecommendation | null {
    const profile = competenceSystem.getCompetenceProfile();
    const decayingCompetences = competenceSystem.getDecayingCompetences();
    const needingPractice = competenceSystem.getCompetencesNeedingPractice();

    // Priorizar competências em risco de decaimento
    if (decayingCompetences.length > 0) {
      const exercise = this.findBestExerciseForCompetence(
        decayingCompetences[0],
        profile,
        userContext
      );
      if (exercise) {
        exercise.priority = 'high';
        exercise.reason = `Revisão necessária - competência em risco de decaimento`;
        return exercise;
      }
    }

    // Recomendar baseado em zona de desenvolvimento proximal
    if (needingPractice.length > 0) {
      const targetCompetence = needingPractice[0];
      const exercise = this.findBestExerciseForCompetence(
        targetCompetence,
        profile,
        userContext
      );
      if (exercise) return exercise;
    }

    // Fallback: exercício de revisão geral
    return this.getReviewExercise(userContext);
  }

  /**
   * Gera recomendação completa de sessão de treino
   */
  getSessionRecommendation(userContext: UserContext): SessionRecommendation {
    const profile = competenceSystem.getCompetenceProfile();
    const exercises: ExerciseRecommendation[] = [];
    let totalDuration = 0;

    // Estrutura da sessão: 15% aquecimento, 60% principal, 25% fechamento
    const targetDuration = userContext.availableTime || 25;
    const warmupDuration = Math.round(targetDuration * 0.15);
    const mainDuration = Math.round(targetDuration * 0.60);
    const closureDuration = Math.round(targetDuration * 0.25);

    // 1. Aquecimento (15%) - exercício fácil/familiar
    const warmupExercise = this.findWarmupExercise(userContext, warmupDuration);
    if (warmupExercise) {
      exercises.push(warmupExercise);
      totalDuration += warmupExercise.estimatedDuration;
    }

    // 2. Conteúdo principal (60%) - foco em desenvolvimento
    let remainingMainDuration = mainDuration;
    const mainExercises = this.selectMainExercises(
      profile,
      userContext,
      remainingMainDuration
    );

    exercises.push(...mainExercises);
    totalDuration += mainExercises.reduce((sum, ex) => sum + ex.estimatedDuration, 0);

    // 3. Fechamento (25%) - aplicação prática
    const closureExercise = this.findClosureExercise(userContext, closureDuration);
    if (closureExercise && totalDuration + closureExercise.estimatedDuration <= targetDuration) {
      exercises.push(closureExercise);
      totalDuration += closureExercise.estimatedDuration;
    }

    // Identificar área de foco principal
    const focusArea = this.determineFocusArea(exercises);

    // Caminho de progressão
    const progressionPath = exercises.map(ex => ex.competenceId);

    return {
      exercises,
      totalDuration,
      focusArea,
      progressionPath,
      estimatedDifficulty: this.calculateSessionDifficulty(exercises)
    };
  }

  /**
   * Encontra melhor exercício para uma competência específica
   */
  private findBestExerciseForCompetence(
    competenceId: string,
    profile: CompetenceProfile,
    userContext: UserContext
  ): ExerciseRecommendation | null {
    const competenceProfile = profile[competenceId];
    const currentProficiency = competenceProfile?.currentProficiency || 0;

    // Filtrar exercícios para esta competência
    const candidateExercises = this.exerciseDatabase.filter(
      ex => ex.competenceId === competenceId
    );

    if (candidateExercises.length === 0) return null;

    // Calcular zona de desenvolvimento proximal (10-20 pontos acima da proficiência atual)
    const minDifficulty = currentProficiency + 10;
    const maxDifficulty = currentProficiency + 20;

    // Encontrar exercícios na zona ideal
    const idealExercises = candidateExercises.filter(
      ex => ex.difficulty >= minDifficulty / 10 && ex.difficulty <= maxDifficulty / 10
    );

    // Se não encontrar na zona ideal, expandir busca
    const fallbackExercises = candidateExercises.filter(
      ex => Math.abs(ex.difficulty - currentProficiency / 10) <= 2
    );

    const availableExercises = idealExercises.length > 0 ? idealExercises : fallbackExercises;

    if (availableExercises.length === 0) return null;

    // Escolher baseado em contexto do usuário
    return this.selectBestExerciseFromCandidates(availableExercises, userContext);
  }

  /**
   * Seleciona melhor exercício de uma lista de candidatos
   */
  private selectBestExerciseFromCandidates(
    candidates: ExerciseRecommendation[],
    userContext: UserContext
  ): ExerciseRecommendation {
    // Pontuar cada candidato
    const scoredCandidates = candidates.map(exercise => {
      let score = 0;

      // Preferir exercícios não feitos recentemente
      if (!userContext.recentActivities.includes(exercise.id)) {
        score += 20;
      }

      // Ajustar por tempo disponível
      if (exercise.estimatedDuration <= userContext.availableTime) {
        score += 15;
      }

      // Preferência por dificuldade
      const difficultyMatch = this.getDifficultyMatchScore(exercise.difficulty, userContext.preferredDifficulty);
      score += difficultyMatch * 10;

      // Hora do dia (exercícios mais leves de manhã)
      if (userContext.timeOfDay === 'morning' && exercise.difficulty <= 3) {
        score += 10;
      }

      return { exercise, score };
    });

    // Retornar exercício com maior pontuação
    scoredCandidates.sort((a, b) => b.score - a.score);
    return scoredCandidates[0].exercise;
  }

  /**
   * Calcula compatibilidade de dificuldade
   */
  private getDifficultyMatchScore(exerciseDifficulty: number, preferredDifficulty: string): number {
    const difficultyMap = {
      'easy': 2.5,
      'medium': 3.5,
      'hard': 4.5
    };

    const targetDifficulty = difficultyMap[preferredDifficulty as keyof typeof difficultyMap];
    const diff = Math.abs(exerciseDifficulty - targetDifficulty);

    return Math.max(0, 1 - diff / 2); // 1.0 = match perfeito, 0 = muito diferente
  }

  /**
   * Encontra exercício de aquecimento
   */
  private findWarmupExercise(userContext: UserContext, targetDuration: number): ExerciseRecommendation | null {
    // Procurar exercícios fáceis e familiares
    const warmupCandidates = this.exerciseDatabase.filter(ex =>
      ex.difficulty <= 3 &&
      ex.estimatedDuration <= targetDuration + 3 &&
      !userContext.recentActivities.includes(ex.id)
    );

    if (warmupCandidates.length === 0) return null;

    return warmupCandidates[Math.floor(Math.random() * warmupCandidates.length)];
  }

  /**
   * Seleciona exercícios principais para a sessão
   */
  private selectMainExercises(
    profile: CompetenceProfile,
    userContext: UserContext,
    maxDuration: number
  ): ExerciseRecommendation[] {
    const exercises: ExerciseRecommendation[] = [];
    let currentDuration = 0;

    // Estratégia: 40% revisão, 40% novo, 20% desafio
    const reviewAllocation = Math.round(maxDuration * 0.4);
    const newAllocation = Math.round(maxDuration * 0.4);
    const challengeAllocation = Math.round(maxDuration * 0.2);

    // Exercícios de revisão (competências já boas mas precisam manutenção)
    const reviewCompetences = Object.entries(profile)
      .filter(([_, prof]) => prof.currentProficiency > 70 && prof.riskOfDecay)
      .map(([id]) => id);

    for (const competenceId of reviewCompetences.slice(0, 2)) {
      if (currentDuration >= reviewAllocation) break;

      const exercise = this.findBestExerciseForCompetence(competenceId, profile, {
        ...userContext,
        availableTime: reviewAllocation - currentDuration
      });

      if (exercise && currentDuration + exercise.estimatedDuration <= reviewAllocation) {
        exercises.push(exercise);
        currentDuration += exercise.estimatedDuration;
      }
    }

    // Exercícios novos (competências que precisam desenvolvimento)
    const newCompetences = competenceSystem.getCompetencesNeedingPractice().slice(0, 2);

    for (const competenceId of newCompetences) {
      if (currentDuration >= reviewAllocation + newAllocation) break;

      const exercise = this.findBestExerciseForCompetence(competenceId, profile, {
        ...userContext,
        availableTime: reviewAllocation + newAllocation - currentDuration
      });

      if (exercise && currentDuration + exercise.estimatedDuration <= reviewAllocation + newAllocation) {
        exercises.push(exercise);
        currentDuration += exercise.estimatedDuration;
      }
    }

    // Exercício de desafio (ligeiramente acima do nível atual)
    if (currentDuration < maxDuration) {
      const challengeCompetence = competenceSystem.getCompetencesNeedingPractice()[0];
      if (challengeCompetence) {
        const challengeExercise = this.findBestExerciseForCompetence(challengeCompetence, profile, {
          ...userContext,
          availableTime: maxDuration - currentDuration,
          preferredDifficulty: 'hard'
        });

        if (challengeExercise && currentDuration + challengeExercise.estimatedDuration <= maxDuration) {
          challengeExercise.priority = 'medium';
          challengeExercise.reason = 'Desafio para crescimento';
          exercises.push(challengeExercise);
        }
      }
    }

    return exercises;
  }

  /**
   * Encontra exercício de fechamento
   */
  private findClosureExercise(userContext: UserContext, targetDuration: number): ExerciseRecommendation | null {
    // Preferir exercícios de aplicação prática ou músicas curtas
    const closureCandidates = this.exerciseDatabase.filter(ex =>
      (ex.category === 'practice' || ex.category === 'review') &&
      ex.estimatedDuration <= targetDuration + 5 &&
      ex.difficulty <= 4
    );

    if (closureCandidates.length === 0) return null;

    return closureCandidates[Math.floor(Math.random() * closureCandidates.length)];
  }

  /**
   * Determina área de foco da sessão
   */
  private determineFocusArea(exercises: ExerciseRecommendation[]): string {
    const competenceCount = new Map<string, number>();

    exercises.forEach(ex => {
      competenceCount.set(ex.competenceId, (competenceCount.get(ex.competenceId) || 0) + 1);
    });

    const [topCompetence] = Array.from(competenceCount.entries())
      .sort((a, b) => b[1] - a[1]);

    const definition = competenceSystem.getCompetenceDefinition(topCompetence[0]);
    return definition?.name || 'Desenvolvimento Geral';
  }

  /**
   * Calcula dificuldade média da sessão
   */
  private calculateSessionDifficulty(exercises: ExerciseRecommendation[]): number {
    if (exercises.length === 0) return 1;

    const avgDifficulty = exercises.reduce((sum, ex) => sum + ex.difficulty, 0) / exercises.length;
    return Math.round(avgDifficulty * 10) / 10;
  }

  /**
   * Obtém exercício de revisão geral
   */
  private getReviewExercise(userContext: UserContext): ExerciseRecommendation | null {
    const reviewCandidates = this.exerciseDatabase.filter(ex =>
      ex.category === 'review' &&
      ex.estimatedDuration <= userContext.availableTime &&
      !userContext.recentActivities.includes(ex.id)
    );

    if (reviewCandidates.length === 0) return null;

    return reviewCandidates[Math.floor(Math.random() * reviewCandidates.length)];
  }

  /**
   * Atualiza histórico de atividades recentes
   */
  updateRecentActivities(activityId: string): void {
    // Esta função seria chamada quando o usuário completa um exercício
    // Atualiza o contexto do usuário para recomendações futuras
  }

  /**
   * Obtém estatísticas de recomendação
   */
  getRecommendationStats(): {
    totalExercises: number;
    exercisesByCompetence: Record<string, number>;
    averageDifficulty: number;
  } {
    const byCompetence: Record<string, number> = {};

    this.exerciseDatabase.forEach(ex => {
      byCompetence[ex.competenceId] = (byCompetence[ex.competenceId] || 0) + 1;
    });

    const avgDifficulty = this.exerciseDatabase.reduce((sum, ex) => sum + ex.difficulty, 0) / this.exerciseDatabase.length;

    return {
      totalExercises: this.exerciseDatabase.length,
      exercisesByCompetence: byCompetence,
      averageDifficulty: Math.round(avgDifficulty * 10) / 10
    };
  }
}

export const recommendationEngine = RecommendationEngine.getInstance();