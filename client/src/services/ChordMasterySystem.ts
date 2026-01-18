/**
 * Sistema de Maestria por Acorde - 2026
 * Níveis de domínio individualizados para cada acorde
 * Exercícios específicos por nível de proficiência
 */

export interface ChordDefinition {
  name: string;
  root: string;
  quality: 'major' | 'minor' | 'dim' | 'aug' | 'sus4' | 'sus2' | '7' | 'maj7' | 'm7' | 'dim7';
  frets: number[];
  fingers: number[];
  barre?: boolean;
  capo?: number;
  difficulty: number; // 1-10
  commonness: number; // 1-10, quão comum é
}

export interface ChordMasteryLevel {
  level: number;
  name: string;
  description: string;
  requirements: {
    accuracy: number; // % mínimo de precisão
    speed?: number; // BPM mínimo para transições
    consistency: number; // % mínimo de consistência
    duration?: number; // segundos mínimo de sustain
  };
  exercises: ChordExercise[];
  unlockedFeatures: string[];
}

export interface ChordExercise {
  id: string;
  name: string;
  description: string;
  type: 'knowledge' | 'execution' | 'transition' | 'application';
  difficulty: number;
  estimatedDuration: number; // minutos
  instructions: string[];
  successCriteria: string[];
  audioGuidance?: boolean;
  visualGuidance?: boolean;
  prerequisites?: string[]; // outros exercícios necessários
}

export interface ChordMasteryProgress {
  chordName: string;
  currentLevel: number;
  overallProficiency: number; // 0-100
  levelProgress: {
    knowledge: number; // 0-100
    execution: number; // 0-100
    transition: number; // 0-100
    application: number; // 0-100
  };
  completedExercises: string[];
  attempts: number;
  bestPerformance: {
    accuracy: number;
    speed: number;
    consistency: number;
    date: Date;
  };
  timeSpent: number; // minutos totais
  lastPracticed: Date;
  streak: number; // dias consecutivos praticando este acorde
}

export class ChordMasterySystem {
  private static instance: ChordMasterySystem;

  // Definição de acordes comuns
  private chordDatabase: ChordDefinition[] = [
    {
      name: 'C',
      root: 'C',
      quality: 'major',
      frets: [0, 1, 0, 2, 3, 0],
      fingers: [0, 1, 0, 2, 3, 0],
      difficulty: 2,
      commonness: 10
    },
    {
      name: 'G',
      root: 'G',
      quality: 'major',
      frets: [3, 2, 0, 0, 0, 3],
      fingers: [2, 1, 0, 0, 0, 3],
      difficulty: 3,
      commonness: 9
    },
    {
      name: 'Am',
      root: 'A',
      quality: 'minor',
      frets: [0, 1, 2, 2, 0, 0],
      fingers: [0, 1, 2, 3, 0, 0],
      difficulty: 2,
      commonness: 10
    },
    {
      name: 'F',
      root: 'F',
      quality: 'major',
      frets: [1, 3, 3, 2, 1, 1],
      fingers: [1, 3, 3, 2, 1, 1],
      barre: false,
      difficulty: 4,
      commonness: 8
    },
    {
      name: 'Em',
      root: 'E',
      quality: 'minor',
      frets: [0, 2, 2, 0, 0, 0],
      fingers: [0, 2, 3, 0, 0, 0],
      difficulty: 1,
      commonness: 9
    },
    {
      name: 'D',
      root: 'D',
      quality: 'major',
      frets: [0, 0, 0, 2, 3, 2],
      fingers: [0, 0, 0, 1, 3, 2],
      difficulty: 3,
      commonness: 8
    },
    {
      name: 'A',
      root: 'A',
      quality: 'major',
      frets: [0, 0, 2, 2, 2, 0],
      fingers: [0, 0, 1, 2, 3, 0],
      difficulty: 2,
      commonness: 8
    },
    {
      name: 'E',
      root: 'E',
      quality: 'major',
      frets: [0, 2, 2, 1, 0, 0],
      fingers: [0, 2, 3, 1, 0, 0],
      difficulty: 3,
      commonness: 7
    }
  ];

  // Níveis de maestria para cada acorde
  private masteryLevels: ChordMasteryLevel[] = [
    {
      level: 1,
      name: 'Descoberta',
      description: 'Primeiro contato com o acorde',
      requirements: {
        accuracy: 0,
        consistency: 0
      },
      exercises: [
        {
          id: 'identify_chord',
          name: 'Identificar Acorde',
          description: 'Aprender a reconhecer o acorde',
          type: 'knowledge',
          difficulty: 1,
          estimatedDuration: 2,
          instructions: [
            'Observe o diagrama do acorde',
            'Note qual dedo vai em qual casa',
            'Identifique a raiz do acorde',
            'Compare com acordes que você já conhece'
          ],
          successCriteria: [
            'Identificar corretamente o nome do acorde',
            'Localizar a posição de pelo menos 3 dedos'
          ],
          visualGuidance: true
        },
        {
          id: 'name_notes',
          name: 'Nomear Notas',
          description: 'Identificar as notas que compõem o acorde',
          type: 'knowledge',
          difficulty: 2,
          estimatedDuration: 3,
          instructions: [
            'Para cada corda, identifique qual nota soa',
            'Compare com a fundamental do acorde',
            'Entenda o intervalo de cada nota'
          ],
          successCriteria: [
            'Nomear corretamente pelo menos 4 notas do acorde',
            'Identificar a função de cada nota (fundamental, terça, quinta)'
          ],
          prerequisites: ['identify_chord']
        }
      ],
      unlockedFeatures: ['chord_diagram', 'basic_info']
    },
    {
      level: 2,
      name: 'Formação',
      description: 'Aprender a formar o acorde corretamente',
      requirements: {
        accuracy: 60,
        consistency: 50,
        duration: 5
      },
      exercises: [
        {
          id: 'form_chord_slowly',
          name: 'Formar Acorde Devagar',
          description: 'Praticar formação dedo por dedo',
          type: 'execution',
          difficulty: 2,
          estimatedDuration: 5,
          instructions: [
            'Coloque o primeiro dedo na posição indicada',
            'Verifique se a corda soa corretamente',
            'Adicione o segundo dedo',
            'Continue até formar o acorde completo',
            'Tire todos os dedos e repita'
          ],
          successCriteria: [
            'Formar o acorde sem cordas abafadas',
            'Todas as notas soarem claras',
            'Repetir formação 5 vezes consecutivas'
          ],
          visualGuidance: true,
          audioGuidance: true
        },
        {
          id: 'sustain_chord',
          name: 'Sustentar Acorde',
          description: 'Manter o acorde formado por tempo prolongado',
          type: 'execution',
          difficulty: 3,
          estimatedDuration: 4,
          instructions: [
            'Forme o acorde corretamente',
            'Mantenha a posição por 10 segundos',
            'Preste atenção em dedos que escorregam',
            'Sinta a tensão muscular',
            'Descanse e repita'
          ],
          successCriteria: [
            'Manter acorde formado por 10 segundos',
            'Notas permanecerem claras durante todo o tempo',
            'Identificar pontos de tensão'
          ],
          prerequisites: ['form_chord_slowly']
        },
        {
          id: 'chord_memory',
          name: 'Memória Visual',
          description: 'Formar acorde sem olhar',
          type: 'execution',
          difficulty: 4,
          estimatedDuration: 6,
          instructions: [
            'Olhe para o diagrama por 5 segundos',
            'Feche os olhos',
            'Tente formar o acorde',
            'Abra os olhos para verificar',
            'Corrija se necessário e repita'
          ],
          successCriteria: [
            'Formar acorde corretamente sem olhar',
            'Posicionar pelo menos 4 dedos corretamente',
            'Reduzir tempo de formação gradual'
          ],
          prerequisites: ['sustain_chord']
        }
      ],
      unlockedFeatures: ['finger_animation', 'audio_feedback', 'practice_timer']
    },
    {
      level: 3,
      name: 'Transição',
      description: 'Transitar suavemente entre acordes',
      requirements: {
        accuracy: 75,
        speed: 80,
        consistency: 70
      },
      exercises: [
        {
          id: 'transition_to_common',
          name: 'Transições para Acordes Comuns',
          description: 'Praticar mudanças para acordes relacionados',
          type: 'transition',
          difficulty: 4,
          estimatedDuration: 8,
          instructions: [
            'Identifique acordes que compartilham dedos',
            'Pratique mudança lenta primeiro',
            'Encontre o "dedo âncora" que fica no lugar',
            'Acelere gradualmente mantendo precisão',
            'Foque em transição, não na formação final'
          ],
          successCriteria: [
            'Transitar sem cordas abafadas',
            'Manter tempo constante',
            'Reduzir tempo de transição abaixo de 2 segundos'
          ],
          audioGuidance: true
        },
        {
          id: 'rhythmic_transitions',
          name: 'Transições Rítmicas',
          description: 'Transitar no tempo do metrônomo',
          type: 'transition',
          difficulty: 5,
          estimatedDuration: 10,
          instructions: [
            'Configure metrônomo em 60 BPM',
            'Mantenha acorde por 4 batidas',
            'Mude na batida 1 do próximo compasso',
            'Acelere BPM gradualmente',
            'Mantenha precisão em velocidades mais altas'
          ],
          successCriteria: [
            'Transitar exatamente na batida certa',
            'Manter BPM constante',
            'Conseguir em pelo menos 100 BPM'
          ],
          prerequisites: ['transition_to_common']
        },
        {
          id: 'pattern_transitions',
          name: 'Padrões de Transição',
          description: 'Transitar em sequências musicais',
          type: 'transition',
          difficulty: 6,
          estimatedDuration: 12,
          instructions: [
            'Pratique progressões comuns (I-IV-V-I)',
            'Identifique padrões de movimento dos dedos',
            'Antecipe próxima mudança',
            'Mantenha fluxo musical',
            'Foque em expressão, não apenas precisão'
          ],
          successCriteria: [
            'Executar progressão completa sem erros',
            'Manter tempo constante',
            'Adicionar dinâmica e expressão'
          ],
          prerequisites: ['rhythmic_transitions']
        }
      ],
      unlockedFeatures: ['metronome_sync', 'transition_guide', 'speed_training']
    },
    {
      level: 4,
      name: 'Aplicação',
      description: 'Usar o acorde em contextos musicais reais',
      requirements: {
        accuracy: 85,
        speed: 120,
        consistency: 80,
        duration: 30
      },
      exercises: [
        {
          id: 'chord_in_song',
          name: 'Acorde em Música',
          description: 'Tocar música que usa este acorde',
          type: 'application',
          difficulty: 5,
          estimatedDuration: 15,
          instructions: [
            'Encontre música simples que use este acorde',
            'Pratique seção que contém o acorde',
            'Foque na transição para este acorde específico',
            'Sinta o contexto harmônico',
            'Integre com ritmo da música'
          ],
          successCriteria: [
            'Tocar música completa sem erros',
            'Transições suaves no contexto musical',
            'Sentir função harmônica do acorde'
          ],
          audioGuidance: true
        },
        {
          id: 'chord_improvisation',
          name: 'Improvisação com Acorde',
          description: 'Criar progressões usando o acorde',
          type: 'application',
          difficulty: 7,
          estimatedDuration: 20,
          instructions: [
            'Use o acorde como base para progressão',
            'Experimente acordes que combinam bem',
            'Crie padrão rítmico interessante',
            'Adicione dinâmica e variação',
            'Grave e avalie sua criação'
          ],
          successCriteria: [
            'Criar progressão musical coerente',
            'Usar acorde de forma criativa',
            'Manter interesse auditivo'
          ],
          prerequisites: ['chord_in_song']
        },
        {
          id: 'chord_mastery_test',
          name: 'Teste de Maestria',
          description: 'Demonstrar domínio completo do acorde',
          type: 'application',
          difficulty: 8,
          estimatedDuration: 25,
          instructions: [
            'Forme o acorde instantaneamente',
            'Transite rapidamente para acordes relacionados',
            'Mantenha em diferentes velocidades',
            'Use em contexto musical complexo',
            'Demonstre controle total'
          ],
          successCriteria: [
            'Execução perfeita em todas as dimensões',
            'Capacidade de ensinar o acorde para outros',
            'Integração natural em playing'
          ],
          prerequisites: ['chord_improvisation']
        }
      ],
      unlockedFeatures: ['song_library', 'improvisation_tools', 'teaching_mode', 'chord_variants']
    }
  ];

  private constructor() {
    this.loadProgressFromStorage();
  }

  static getInstance(): ChordMasterySystem {
    if (!ChordMasterySystem.instance) {
      ChordMasterySystem.instance = new ChordMasterySystem();
    }
    return ChordMasterySystem.instance;
  }

  /**
   * Obtém definição completa de um acorde
   */
  getChordDefinition(chordName: string): ChordDefinition | undefined {
    return this.chordDatabase.find(chord => chord.name === chordName);
  }

  /**
   * Obtém todos os acordes disponíveis
   */
  getAllChords(): ChordDefinition[] {
    return [...this.chordDatabase];
  }

  /**
   * Obtém níveis de maestria para um acorde
   */
  getMasteryLevels(): ChordMasteryLevel[] {
    return [...this.masteryLevels];
  }

  /**
   * Obtém progresso de maestria para um acorde específico
   */
  getChordProgress(chordName: string): ChordMasteryProgress | null {
    const stored = localStorage.getItem(`chord_mastery_${chordName}`);
    if (!stored) return null;

    try {
      const progress: ChordMasteryProgress = JSON.parse(stored);
      // Converter string de data para Date
      progress.lastPracticed = new Date(progress.lastPracticed);
      progress.bestPerformance.date = new Date(progress.bestPerformance.date);
      return progress;
    } catch {
      return null;
    }
  }

  /**
   * Registra tentativa de exercício para um acorde
   */
  recordExerciseAttempt(
    chordName: string,
    exerciseId: string,
    performance: {
      accuracy: number;
      speed: number;
      consistency: number;
      duration: number;
    }
  ): void {
    const progress = this.getChordProgress(chordName) || this.initializeChordProgress(chordName);

    // Atualizar progresso
    progress.completedExercises = [...new Set([...progress.completedExercises, exerciseId])];
    progress.attempts++;
    progress.timeSpent += 5; // minutos estimados
    progress.lastPracticed = new Date();

    // Atualizar melhor performance
    if (performance.accuracy > progress.bestPerformance.accuracy) {
      progress.bestPerformance = {
        accuracy: performance.accuracy,
        speed: performance.speed,
        consistency: performance.consistency,
        date: new Date()
      };
    }

    // Calcular progresso por nível
    this.updateLevelProgress(progress, exerciseId, performance);

    // Verificar se pode avançar de nível
    this.checkLevelAdvancement(progress);

    // Salvar progresso
    this.saveChordProgress(progress);
  }

  /**
   * Obtém próximo exercício recomendado para um acorde
   */
  getNextExercise(chordName: string): ChordExercise | null {
    const progress = this.getChordProgress(chordName);
    if (!progress) {
      // Primeiro exercício do nível 1
      return this.masteryLevels[0].exercises[0];
    }

    const currentLevel = this.masteryLevels[progress.currentLevel - 1];
    if (!currentLevel) return null;

    // Encontrar próximo exercício não completado no nível atual
    const nextExercise = currentLevel.exercises.find(
      exercise => !progress.completedExercises.includes(exercise.id)
    );

    if (nextExercise) return nextExercise;

    // Se completou todos os exercícios do nível atual, sugerir revisão
    if (progress.currentLevel < this.masteryLevels.length) {
      return currentLevel.exercises[0]; // Revisar primeiro exercício
    }

    return null; // Já completou tudo
  }

  /**
   * Obtém exercícios disponíveis para um acorde em um nível específico
   */
  getExercisesForLevel(chordName: string, level: number): ChordExercise[] {
    const levelData = this.masteryLevels[level - 1];
    if (!levelData) return [];

    return levelData.exercises.map(exercise => ({
      ...exercise,
      // Adicionar contexto específico do acorde
      name: exercise.name.replace('{chord}', chordName),
      description: exercise.description.replace('{chord}', chordName),
      instructions: exercise.instructions.map(inst =>
        inst.replace('{chord}', chordName)
      )
    }));
  }

  /**
   * Calcula proficiência geral de um acorde
   */
  getChordProficiency(chordName: string): number {
    const progress = this.getChordProgress(chordName);
    if (!progress) return 0;

    // Média ponderada dos níveis
    const weights = { knowledge: 0.2, execution: 0.3, transition: 0.3, application: 0.2 };
    const proficiency =
      progress.levelProgress.knowledge * weights.knowledge +
      progress.levelProgress.execution * weights.execution +
      progress.levelProgress.transition * weights.transition +
      progress.levelProgress.application * weights.application;

    return Math.round(proficiency);
  }

  /**
   * Identifica acordes que precisam de prática
   */
  getChordsNeedingPractice(): string[] {
    const allChords = this.chordDatabase.map(c => c.name);
    const chordProgresses = allChords.map(name => ({
      name,
      proficiency: this.getChordProficiency(name),
      lastPracticed: this.getChordProgress(name)?.lastPracticed
    }));

    // Ordenar por prioridade: proficiência baixa + não praticado recentemente
    return chordProgresses
      .sort((a, b) => {
        const scoreA = a.proficiency + (a.lastPracticed ? 0 : 20);
        const scoreB = b.proficiency + (b.lastPracticed ? 0 : 20);
        return scoreA - scoreB;
      })
      .slice(0, 5)
      .map(c => c.name);
  }

  /**
   * Obtém estatísticas de maestria
   */
  getMasteryStats(): {
    totalChords: number;
    masteredChords: number; // nível 4 completo
    learningChords: number; // em progresso
    totalPracticeTime: number;
    averageProficiency: number;
  } {
    const allChords = this.chordDatabase.map(c => c.name);
    let masteredChords = 0;
    let totalPracticeTime = 0;
    let totalProficiency = 0;

    allChords.forEach(chordName => {
      const progress = this.getChordProgress(chordName);
      if (progress) {
        totalPracticeTime += progress.timeSpent;
        totalProficiency += this.getChordProficiency(chordName);
        if (progress.currentLevel >= 4) masteredChords++;
      }
    });

    return {
      totalChords: allChords.length,
      masteredChords,
      learningChords: allChords.length - masteredChords,
      totalPracticeTime,
      averageProficiency: Math.round(totalProficiency / allChords.length)
    };
  }

  // Private methods

  private initializeChordProgress(chordName: string): ChordMasteryProgress {
    return {
      chordName,
      currentLevel: 1,
      overallProficiency: 0,
      levelProgress: {
        knowledge: 0,
        execution: 0,
        transition: 0,
        application: 0
      },
      completedExercises: [],
      attempts: 0,
      bestPerformance: {
        accuracy: 0,
        speed: 0,
        consistency: 0,
        date: new Date()
      },
      timeSpent: 0,
      lastPracticed: new Date(),
      streak: 0
    };
  }

  private updateLevelProgress(
    progress: ChordMasteryProgress,
    exerciseId: string,
    performance: { accuracy: number; speed: number; consistency: number; duration: number }
  ): void {
    // Encontrar tipo do exercício
    const exerciseType = this.findExerciseType(exerciseId);

    if (exerciseType) {
      // Atualizar progresso do nível específico
      const currentProgress = progress.levelProgress[exerciseType];
      const newProgress = Math.min(100, currentProgress + (performance.accuracy * 20)); // +20% por exercício completado

      progress.levelProgress[exerciseType] = Math.round(newProgress);
    }
  }

  private findExerciseType(exerciseId: string): keyof ChordMasteryProgress['levelProgress'] | null {
    for (const level of this.masteryLevels) {
      for (const exercise of level.exercises) {
        if (exercise.id === exerciseId) {
          return exercise.type;
        }
      }
    }
    return null;
  }

  private checkLevelAdvancement(progress: ChordMasteryProgress): void {
    const currentLevelData = this.masteryLevels[progress.currentLevel - 1];
    if (!currentLevelData) return;

    const requirements = currentLevelData.requirements;
    const levelProgress = progress.levelProgress;

    // Verificar se atende todos os requisitos
    const meetsAccuracy = levelProgress.execution >= requirements.accuracy;
    const meetsConsistency = levelProgress.transition >= requirements.consistency;
    const meetsSpeed = !requirements.speed || progress.bestPerformance.speed >= requirements.speed;
    const meetsDuration = !requirements.duration || progress.bestPerformance.accuracy >= 80; // proxy para duration

    if (meetsAccuracy && meetsConsistency && meetsSpeed && meetsDuration) {
      progress.currentLevel = Math.min(progress.currentLevel + 1, this.masteryLevels.length);
    }
  }

  private saveChordProgress(progress: ChordMasteryProgress): void {
    localStorage.setItem(`chord_mastery_${progress.chordName}`, JSON.stringify(progress));
  }

  private loadProgressFromStorage(): void {
    // Progress is loaded on-demand via getChordProgress
  }
}

export const chordMasterySystem = ChordMasterySystem.getInstance();