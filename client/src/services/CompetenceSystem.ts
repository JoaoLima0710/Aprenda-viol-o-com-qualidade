/**
 * Sistema de Competências Granulares - 2026
 * Mapeamento detalhado de 18 habilidades musicais principais
 * Cada competência tem proficiência 0-100 baseada em performance real
 */

export interface CompetenceEvent {
  id: string;
  competenceId: string;
  performance: number; // 0-1
  timestamp: Date;
  context: {
    difficulty: number; // 1-10
    speed?: number; // BPM
    duration?: number; // segundos
    exerciseType: string;
    metadata?: Record<string, any>;
  };
}

export interface CompetenceProfile {
  [competenceId: string]: {
    currentProficiency: number; // 0-100
    lastUpdated: Date;
    totalEvents: number;
    recentPerformance: number[]; // últimas 10 performances para cálculo
    riskOfDecay: boolean; // se não praticada há muito tempo
    decayRate: number; // taxa de decaimento diário
  };
}

export interface CompetenceDefinition {
  id: string;
  name: string;
  description: string;
  category: 'harmony' | 'rhythm' | 'technique' | 'theory' | 'reading' | 'ear';
  subskills: string[];
  difficulty: number; // 1-10, dificuldade típica
  decayRate: number; // taxa de decaimento diário (0.01 = 1% por dia)
  baselineProficiency: number; // proficiência inicial esperada
}

export class CompetenceSystem {
  private static instance: CompetenceSystem;
  private profile: CompetenceProfile = {};
  private eventHistory: CompetenceEvent[] = [];

  // Definição das 18 competências principais
  private competenceDefinitions: CompetenceDefinition[] = [
    // Harmonia (6 competências)
    {
      id: 'chord-formation',
      name: 'Formação de Acordes',
      description: 'Capacidade de formar acordes corretamente no instrumento',
      category: 'harmony',
      subskills: ['dedilhado', 'posicionamento', 'pressão', 'transições básicas'],
      difficulty: 2,
      decayRate: 0.005,
      baselineProficiency: 20
    },
    {
      id: 'chord-transitions',
      name: 'Transições de Acordes',
      description: 'Velocidade e precisão em mudanças de acordes',
      category: 'harmony',
      subskills: ['velocidade', 'precisão', 'dedilhado alternado', 'economia de movimento'],
      difficulty: 4,
      decayRate: 0.008,
      baselineProficiency: 15
    },
    {
      id: 'chord-recognition',
      name: 'Reconhecimento de Acordes',
      description: 'Identificar acordes por nome e formação',
      category: 'harmony',
      subskills: ['nomes', 'diagramas', 'inversões', 'extensões'],
      difficulty: 3,
      decayRate: 0.003,
      baselineProficiency: 25
    },
    {
      id: 'progression-analysis',
      name: 'Análise de Progressões',
      description: 'Entender e analisar progressões harmônicas',
      category: 'harmony',
      subskills: ['graus', 'funções', 'tensão-resolução', 'progressões comuns'],
      difficulty: 6,
      decayRate: 0.004,
      baselineProficiency: 10
    },
    {
      id: 'harmonic-substitution',
      name: 'Substituições Harmônicas',
      description: 'Usar acordes substitutos em contextos musicais',
      category: 'harmony',
      subskills: ['equivalentes', 'extensões', 'tensões', 'contextuais'],
      difficulty: 7,
      decayRate: 0.006,
      baselineProficiency: 5
    },
    {
      id: 'harmonic-vocabulary',
      name: 'Vocabulário Harmônico',
      description: 'Conhecimento de acordes avançados e extensões',
      category: 'harmony',
      subskills: ['sétimas', 'novenas', 'sus4', 'add9', 'dim/aug'],
      difficulty: 8,
      decayRate: 0.007,
      baselineProficiency: 5
    },

    // Ritmo (4 competências)
    {
      id: 'rhythmic-precision',
      name: 'Precisão Rítmica',
      description: 'Manter tempo constante e preciso',
      category: 'rhythm',
      subskills: ['steadiness', 'accuracy', 'consistency', 'tempo adaptation'],
      difficulty: 3,
      decayRate: 0.006,
      baselineProficiency: 30
    },
    {
      id: 'rhythmic-subdivision',
      name: 'Subdivisão Rítmica',
      description: 'Sentir e executar subdivisões (colcheias, semicolcheias)',
      category: 'rhythm',
      subskills: ['colcheias', 'semicolcheias', 'tercinas', 'quintuplets'],
      difficulty: 5,
      decayRate: 0.008,
      baselineProficiency: 15
    },
    {
      id: 'rhythmic-feel',
      name: 'Feeling Rítmico',
      description: 'Groove e swing em diferentes estilos',
      category: 'rhythm',
      subskills: ['swing', 'shuffle', 'latin', 'funk', 'bossa'],
      difficulty: 6,
      decayRate: 0.007,
      baselineProficiency: 10
    },
    {
      id: 'tempo-flexibility',
      name: 'Flexibilidade de Tempo',
      description: 'Adaptar e variar tempo expressivamente',
      category: 'rhythm',
      subskills: ['rubato', 'accelerando', 'ritardando', 'tempo changes'],
      difficulty: 7,
      decayRate: 0.005,
      baselineProficiency: 8
    },

    // Técnica (3 competências)
    {
      id: 'finger-technique',
      name: 'Técnica de Dedilhado',
      description: 'Coordenação e independência dos dedos',
      category: 'technique',
      subskills: ['finger independence', 'strength', 'flexibility', 'speed'],
      difficulty: 4,
      decayRate: 0.010,
      baselineProficiency: 20
    },
    {
      id: 'strumming-patterns',
      name: 'Padrões de Dedilhado',
      description: 'Execução de padrões rítmicos de dedilhado',
      category: 'technique',
      subskills: ['downstrokes', 'upstrokes', 'muted', 'accented', 'complex patterns'],
      difficulty: 5,
      decayRate: 0.009,
      baselineProficiency: 12
    },
    {
      id: 'picking-technique',
      name: 'Técnica de Pestana',
      description: 'Execução de linhas de pestana e fingerpicking',
      category: 'technique',
      subskills: ['fingerpicking', 'flatpicking', 'hybrid', 'travis', 'classical'],
      difficulty: 7,
      decayRate: 0.011,
      baselineProficiency: 8
    },

    // Teoria (2 competências)
    {
      id: 'music-theory-basics',
      name: 'Teoria Básica',
      description: 'Conceitos fundamentais de teoria musical',
      category: 'theory',
      subskills: ['notas', 'intervalos', 'escalas', 'acordes', 'tonalidades'],
      difficulty: 4,
      decayRate: 0.004,
      baselineProficiency: 25
    },
    {
      id: 'music-theory-advanced',
      name: 'Teoria Avançada',
      description: 'Conceitos avançados de teoria musical',
      category: 'theory',
      subskills: ['modulação', 'contraponto', 'análise funcional', 'composição'],
      difficulty: 8,
      decayRate: 0.005,
      baselineProficiency: 5
    },

    // Leitura (2 competências)
    {
      id: 'chord-reading',
      name: 'Leitura de Cifras',
      description: 'Interpretar notação de acordes rapidamente',
      category: 'reading',
      subskills: ['chord names', 'diagrams', 'slash chords', 'complex symbols'],
      difficulty: 3,
      decayRate: 0.003,
      baselineProficiency: 40
    },
    {
      id: 'tablature-reading',
      name: 'Leitura de Tablatura',
      description: 'Interpretar tablatura e notação rítmica',
      category: 'reading',
      subskills: ['basic tabs', 'rhythmic notation', 'finger numbers', 'techniques'],
      difficulty: 4,
      decayRate: 0.004,
      baselineProficiency: 30
    },

    // Ouvido (1 competência abrangente)
    {
      id: 'ear-training',
      name: 'Treinamento Auditivo',
      description: 'Reconhecer elementos musicais pelo ouvido',
      category: 'ear',
      subskills: ['intervals', 'chords', 'scales', 'rhythm', 'melodies', 'harmony'],
      difficulty: 6,
      decayRate: 0.007,
      baselineProficiency: 15
    }
  ];

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): CompetenceSystem {
    if (!CompetenceSystem.instance) {
      CompetenceSystem.instance = new CompetenceSystem();
    }
    return CompetenceSystem.instance;
  }

  /**
   * Registra um evento de prática para uma competência
   */
  recordEvent(event: Omit<CompetenceEvent, 'id' | 'timestamp'>): void {
    const competenceEvent: CompetenceEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random()}`,
      timestamp: new Date()
    };

    this.eventHistory.push(competenceEvent);
    this.updateProficiency(event.competenceId, event.performance, event.context);

    // Manter apenas últimos 1000 eventos para performance
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }

    this.saveToStorage();
  }

  /**
   * Atualiza proficiência de uma competência usando média ponderada exponencial
   */
  private updateProficiency(
    competenceId: string,
    newPerformance: number,
    context: CompetenceEvent['context']
  ): void {
    const definition = this.competenceDefinitions.find(c => c.id === competenceId);
    if (!definition) return;

    if (!this.profile[competenceId]) {
      this.profile[competenceId] = {
        currentProficiency: definition.baselineProficiency,
        lastUpdated: new Date(),
        totalEvents: 0,
        recentPerformance: [],
        riskOfDecay: false,
        decayRate: definition.decayRate
      };
    }

    const profile = this.profile[competenceId];

    // Adicionar nova performance ao histórico recente
    profile.recentPerformance.push(newPerformance);
    if (profile.recentPerformance.length > 10) {
      profile.recentPerformance.shift();
    }

    // Calcular nova proficiência usando média ponderada exponencial
    const weightNew = 0.3; // 30% peso para nova performance
    const weightPrevious = 0.7; // 70% peso para proficiência anterior

    // Ajustar por dificuldade (performances em exercícios difíceis contam mais)
    const difficultyMultiplier = Math.min(1 + (context.difficulty - 5) * 0.1, 1.5);

    const adjustedPerformance = (newPerformance * 100) * difficultyMultiplier;
    const newProficiency = (profile.currentProficiency * weightPrevious) +
                          (adjustedPerformance * weightNew);

    profile.currentProficiency = Math.max(0, Math.min(100, newProficiency));
    profile.lastUpdated = new Date();
    profile.totalEvents++;

    // Verificar risco de decaimento
    const daysSinceLastUpdate = (Date.now() - profile.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    profile.riskOfDecay = daysSinceLastUpdate > 7; // 7 dias sem prática
  }

  /**
   * Aplica decaimento temporal às competências não praticadas
   */
  applyTemporalDecay(): void {
    const now = new Date();

    Object.keys(this.profile).forEach(competenceId => {
      const profile = this.profile[competenceId];
      const hoursSinceUpdate = (now.getTime() - profile.lastUpdated.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate > 24) { // Só aplicar decaimento após 24h
        const decayAmount = profile.decayRate * (hoursSinceUpdate / 24);
        profile.currentProficiency = Math.max(0, profile.currentProficiency - decayAmount);
        profile.lastUpdated = now;
      }
    });

    this.saveToStorage();
  }

  /**
   * Obtém perfil completo de competências
   */
  getCompetenceProfile(): CompetenceProfile {
    return { ...this.profile };
  }

  /**
   * Obtém definição de uma competência específica
   */
  getCompetenceDefinition(competenceId: string): CompetenceDefinition | undefined {
    return this.competenceDefinitions.find(c => c.id === competenceId);
  }

  /**
   * Obtém todas as definições de competências
   */
  getAllCompetenceDefinitions(): CompetenceDefinition[] {
    return [...this.competenceDefinitions];
  }

  /**
   * Identifica competências que precisam de prática (zonas de desenvolvimento proximal)
   */
  getCompetencesNeedingPractice(targetLevel: number = 70): string[] {
    return Object.entries(this.profile)
      .filter(([_, profile]) => profile.currentProficiency < targetLevel)
      .sort((a, b) => a[1].currentProficiency - b[1].currentProficiency)
      .slice(0, 3) // Top 3 que mais precisam
      .map(([id]) => id);
  }

  /**
   * Identifica competências em risco de decaimento
   */
  getDecayingCompetences(): string[] {
    return Object.entries(this.profile)
      .filter(([_, profile]) => profile.riskOfDecay)
      .map(([id]) => id);
  }

  /**
   * Calcula nível geral do usuário baseado em competências
   */
  getOverallLevel(): number {
    const activeCompetences = Object.values(this.profile);
    if (activeCompetences.length === 0) return 1;

    const avgProficiency = activeCompetences.reduce(
      (sum, profile) => sum + profile.currentProficiency,
      0
    ) / activeCompetences.length;

    // Converter proficiência média para nível (1-10)
    return Math.max(1, Math.min(10, Math.round(avgProficiency / 10)));
  }

  /**
   * Obtém estatísticas detalhadas de uma competência
   */
  getCompetenceStats(competenceId: string): {
    currentProficiency: number;
    trend: 'improving' | 'stable' | 'declining';
    daysSinceLastPractice: number;
    totalPracticeTime: number;
    averagePerformance: number;
  } | null {
    const profile = this.profile[competenceId];
    if (!profile) return null;

    const recentPerformances = profile.recentPerformance;
    const averagePerformance = recentPerformances.length > 0
      ? recentPerformances.reduce((a, b) => a + b, 0) / recentPerformances.length
      : 0;

    // Calcular tendência
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentPerformances.length >= 3) {
      const firstHalf = recentPerformances.slice(0, Math.floor(recentPerformances.length / 2));
      const secondHalf = recentPerformances.slice(Math.floor(recentPerformances.length / 2));

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      if (secondAvg > firstAvg + 0.05) trend = 'improving';
      else if (secondAvg < firstAvg - 0.05) trend = 'declining';
    }

    const daysSinceLastPractice = Math.floor(
      (Date.now() - profile.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      currentProficiency: profile.currentProficiency,
      trend,
      daysSinceLastPractice,
      totalPracticeTime: profile.totalEvents * 5, // Estimativa de 5 min por evento
      averagePerformance: averagePerformance * 100
    };
  }

  /**
   * Reseta competências (para desenvolvimento/debugging)
   */
  resetCompetences(): void {
    this.profile = {};
    this.eventHistory = [];
    localStorage.removeItem('musictutor_competence_profile');
    localStorage.removeItem('musictutor_competence_history');
  }

  /**
   * Carrega dados do localStorage
   */
  private loadFromStorage(): void {
    try {
      const profileData = localStorage.getItem('musictutor_competence_profile');
      const historyData = localStorage.getItem('musictutor_competence_history');

      if (profileData) {
        const parsed = JSON.parse(profileData);
        // Converter strings de data para objetos Date
        Object.keys(parsed).forEach(key => {
          parsed[key].lastUpdated = new Date(parsed[key].lastUpdated);
        });
        this.profile = parsed;
      }

      if (historyData) {
        const parsed = JSON.parse(historyData);
        this.eventHistory = parsed.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading competence data:', error);
    }
  }

  /**
   * Salva dados no localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('musictutor_competence_profile', JSON.stringify(this.profile));
      localStorage.setItem('musictutor_competence_history', JSON.stringify(this.eventHistory));
    } catch (error) {
      console.error('Error saving competence data:', error);
    }
  }
}

export const competenceSystem = CompetenceSystem.getInstance();