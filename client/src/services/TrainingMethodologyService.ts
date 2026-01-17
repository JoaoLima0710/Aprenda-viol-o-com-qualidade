import { useGamificationStore } from '@/stores/useGamificationStore';
import { aiAssistantService } from './AIAssistantService';

/**
 * Training Methodology Service
 * Baseado em princípios pedagógicos de educação musical
 */

export interface TrainingModule {
  id: string;
  category: 'chords' | 'scales' | 'rhythm' | 'ear-training' | 'songs' | 'technique';
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5; // 1=Iniciante, 5=Avançado
  duration: number; // minutos
  prerequisites: string[]; // IDs de módulos anteriores
  skills: string[]; // Habilidades desenvolvidas
  methodology: string; // Abordagem pedagógica
  icon: string;
}

export interface DailyTraining {
  date: string;
  modules: TrainingModule[];
  totalDuration: number;
  focus: string; // Área de foco do dia
  rationale: string; // Por que esses treinos hoje
  pedagogicalApproach: string; // Metodologia aplicada
}

export interface TrainingAnalysis {
  weakAreas: Array<{ area: string; severity: number; recommendation: string }>;
  strongAreas: Array<{ area: string; proficiency: number }>;
  suggestedFocus: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  progressionRate: 'slow' | 'steady' | 'fast';
  motivationLevel: 'low' | 'medium' | 'high';
  pedagogicalRecommendations: string[];
}

class TrainingMethodologyService {
  private modules: TrainingModule[] = [
    // ACORDES - Progressão Gradual
    {
      id: 'chords-basic-open',
      category: 'chords',
      name: 'Acordes Abertos Básicos',
      description: 'Domine os 7 acordes fundamentais (C, D, E, G, A, Am, Em)',
      difficulty: 1,
      duration: 15,
      prerequisites: [],
      skills: ['Posicionamento de dedos', 'Transição entre acordes', 'Memória muscular'],
      methodology: 'Prática repetitiva com feedback visual. Foco em precisão antes de velocidade.',
      icon: '🎸',
    },
    {
      id: 'chords-transitions',
      category: 'chords',
      name: 'Transições Suaves',
      description: 'Treine mudanças rápidas entre acordes comuns',
      difficulty: 2,
      duration: 20,
      prerequisites: ['chords-basic-open'],
      skills: ['Velocidade', 'Fluidez', 'Coordenação motora'],
      methodology: 'Método do metrônomo progressivo. Aumentar BPM gradualmente.',
      icon: '⚡',
    },
    {
      id: 'chords-barre',
      category: 'chords',
      name: 'Acordes com Pestana',
      description: 'Desenvolva força e técnica para acordes com pestana',
      difficulty: 3,
      duration: 25,
      prerequisites: ['chords-basic-open', 'chords-transitions'],
      skills: ['Força de dedo', 'Resistência', 'Técnica avançada'],
      methodology: 'Progressão incremental de dificuldade. Exercícios de fortalecimento.',
      icon: '💪',
    },

    // ESCALAS - Construção de Base Teórica
    {
      id: 'scales-major-pentatonic',
      category: 'scales',
      name: 'Escala Pentatônica Maior',
      description: 'A escala mais versátil para improvisação',
      difficulty: 2,
      duration: 15,
      prerequisites: ['chords-basic-open'],
      skills: ['Improvisação', 'Teoria musical', 'Coordenação'],
      methodology: 'Aprendizagem por padrões visuais. Aplicação prática em músicas.',
      icon: '🎵',
    },
    {
      id: 'scales-minor-pentatonic',
      category: 'scales',
      name: 'Escala Pentatônica Menor',
      description: 'Base para blues e rock',
      difficulty: 2,
      duration: 15,
      prerequisites: ['scales-major-pentatonic'],
      skills: ['Expressão musical', 'Blues', 'Improvisação'],
      methodology: 'Contextualização em estilos musicais. Prática com backing tracks.',
      icon: '🎸',
    },

    // RITMO - Fundação Temporal
    {
      id: 'rhythm-basic-strumming',
      category: 'rhythm',
      name: 'Batidas Básicas',
      description: 'Padrões rítmicos fundamentais',
      difficulty: 1,
      duration: 10,
      prerequisites: [],
      skills: ['Senso rítmico', 'Coordenação mão direita', 'Timing'],
      methodology: 'Prática com metrônomo. Subdivisão rítmica consciente.',
      icon: '🥁',
    },
    {
      id: 'rhythm-fingerpicking',
      category: 'rhythm',
      name: 'Dedilhado Básico',
      description: 'Padrões de dedilhado para iniciantes',
      difficulty: 2,
      duration: 20,
      prerequisites: ['rhythm-basic-strumming'],
      skills: ['Independência de dedos', 'Precisão', 'Controle dinâmico'],
      methodology: 'Exercícios de independência digital. Progressão lenta para rápida.',
      icon: '👆',
    },

    // TREINO DE OUVIDO - Desenvolvimento Auditivo
    {
      id: 'ear-intervals',
      category: 'ear-training',
      name: 'Reconhecimento de Intervalos',
      description: 'Identifique intervalos musicais pelo som',
      difficulty: 2,
      duration: 15,
      prerequisites: [],
      skills: ['Percepção auditiva', 'Teoria musical', 'Ouvido relativo'],
      methodology: 'Repetição espaçada. Associação com melodias conhecidas.',
      icon: '👂',
    },
    {
      id: 'ear-chords',
      category: 'ear-training',
      name: 'Reconhecimento de Acordes',
      description: 'Identifique acordes maiores, menores e dominantes',
      difficulty: 3,
      duration: 20,
      prerequisites: ['ear-intervals'],
      skills: ['Harmonia', 'Análise musical', 'Transcrição'],
      methodology: 'Prática contextualizada. Análise de músicas reais.',
      icon: '🎹',
    },

    // MÚSICAS - Aplicação Prática
    {
      id: 'songs-beginner',
      category: 'songs',
      name: 'Primeira Música Completa',
      description: 'Aprenda uma música do início ao fim',
      difficulty: 1,
      duration: 30,
      prerequisites: ['chords-basic-open', 'rhythm-basic-strumming'],
      skills: ['Aplicação prática', 'Memorização', 'Performance'],
      methodology: 'Aprendizagem por chunking. Divisão em seções pequenas.',
      icon: '🎤',
    },

    // TÉCNICA - Refinamento
    {
      id: 'technique-posture',
      category: 'technique',
      name: 'Postura e Ergonomia',
      description: 'Fundamentos para tocar sem lesões',
      difficulty: 1,
      duration: 10,
      prerequisites: [],
      skills: ['Saúde', 'Prevenção de lesões', 'Eficiência'],
      methodology: 'Consciência corporal. Exercícios de alongamento.',
      icon: '🧘',
    },
  ];

  /**
   * Gera treino do dia personalizado baseado em análise pedagógica
   */
  async generateDailyTraining(): Promise<DailyTraining> {
    const analysis = await this.analyzeStudent();
    const availableModules = this.getAvailableModules();
    
    // Selecionar módulos baseado em:
    // 1. Áreas fracas (60% do tempo)
    // 2. Revisão de áreas fortes (20% do tempo)
    // 3. Novo conteúdo (20% do tempo)
    
    const selectedModules: TrainingModule[] = [];
    let totalDuration = 0;
    const targetDuration = 45; // 45 minutos de treino diário
    
    // 1. Focar em áreas fracas
    const weakAreaModules = availableModules.filter(m => 
      analysis.weakAreas.some(w => this.moduleAddressesWeakness(m, w.area))
    );
    
    if (weakAreaModules.length > 0) {
      const priorityModule = weakAreaModules[0];
      selectedModules.push(priorityModule);
      totalDuration += priorityModule.duration;
    }
    
    // 2. Adicionar módulo de revisão
    const reviewModules = availableModules.filter(m => 
      analysis.strongAreas.some(s => m.category === s.area.toLowerCase())
    );
    
    if (reviewModules.length > 0 && totalDuration < targetDuration) {
      const reviewModule = reviewModules[Math.floor(Math.random() * reviewModules.length)];
      selectedModules.push(reviewModule);
      totalDuration += reviewModule.duration;
    }
    
    // 3. Adicionar novo conteúdo (se houver tempo)
    const newModules = availableModules.filter(m => 
      !selectedModules.includes(m) && totalDuration + m.duration <= targetDuration
    );
    
    if (newModules.length > 0) {
      const newModule = newModules[0];
      selectedModules.push(newModule);
      totalDuration += newModule.duration;
    }
    
    // Determinar foco do dia
    const focus = this.determineDailyFocus(analysis, selectedModules);
    
    return {
      date: new Date().toISOString().split('T')[0],
      modules: selectedModules,
      totalDuration,
      focus,
      rationale: this.generateRationale(analysis, selectedModules),
      pedagogicalApproach: this.describePedagogicalApproach(selectedModules),
    };
  }

  /**
   * Analisa o estudante baseado em histórico de prática
   */
  private async analyzeStudent(): Promise<TrainingAnalysis> {
    const stats = useGamificationStore.getState();
    const aiAnalysis = aiAssistantService.getInsights();
    
    // Analisar áreas fracas baseado em performance
    const weakAreas = this.identifyWeakAreas();
    const strongAreas = this.identifyStrongAreas();
    
    // Determinar estilo de aprendizagem
    const learningStyle = this.determineLearningStyle();
    
    // Taxa de progressão
    const progressionRate = this.calculateProgressionRate();
    
    // Nível de motivação (baseado em streak e frequência)
    const motivationLevel = (stats as any).streak > 7 ? 'high' : (stats as any).streak > 3 ? 'medium' : 'low';
    
    return {
      weakAreas,
      strongAreas,
      suggestedFocus: weakAreas[0]?.area || 'Acordes',
      learningStyle,
      progressionRate,
      motivationLevel,
      pedagogicalRecommendations: this.generatePedagogicalRecommendations(weakAreas, learningStyle, motivationLevel),
    };
  }

  private identifyWeakAreas(): Array<{ area: string; severity: number; recommendation: string }> {
    // Analisar histórico de prática
    // Por enquanto, retornar áreas comuns de dificuldade
    return [
      {
        area: 'Transições de Acordes',
        severity: 3,
        recommendation: 'Pratique transições específicas com metrônomo em velocidade reduzida',
      },
      {
        area: 'Ritmo',
        severity: 2,
        recommendation: 'Use metrônomo em todas as práticas para desenvolver timing',
      },
    ];
  }

  private identifyStrongAreas(): Array<{ area: string; proficiency: number }> {
    return [
      { area: 'Acordes Básicos', proficiency: 75 },
      { area: 'Leitura de Cifras', proficiency: 80 },
    ];
  }

  private determineLearningStyle(): 'visual' | 'auditory' | 'kinesthetic' | 'mixed' {
    // Analisar padrões de uso
    // Por enquanto, retornar mixed
    return 'mixed';
  }

  private calculateProgressionRate(): 'slow' | 'steady' | 'fast' {
    const stats = useGamificationStore.getState();
    const practiceFrequency = (stats as any).streak || 0;
    
    if (practiceFrequency >= 14) return 'fast';
    if (practiceFrequency >= 7) return 'steady';
    return 'slow';
  }

  private generatePedagogicalRecommendations(
    weakAreas: Array<{ area: string; severity: number; recommendation: string }>,
    learningStyle: string,
    motivationLevel: string
  ): string[] {
    const recommendations: string[] = [];
    
    // Recomendações baseadas em áreas fracas
    weakAreas.forEach(weak => {
      recommendations.push(weak.recommendation);
    });
    
    // Recomendações baseadas em estilo de aprendizagem
    if (learningStyle === 'visual') {
      recommendations.push('Use diagramas de acordes e vídeos para reforçar aprendizado');
    } else if (learningStyle === 'auditory') {
      recommendations.push('Pratique com backing tracks e grave suas performances');
    } else if (learningStyle === 'kinesthetic') {
      recommendations.push('Foque em exercícios práticos e repetição física');
    }
    
    // Recomendações baseadas em motivação
    if (motivationLevel === 'low') {
      recommendations.push('Defina metas pequenas e celebre cada conquista');
      recommendations.push('Pratique músicas que você ama para manter motivação');
    } else if (motivationLevel === 'high') {
      recommendations.push('Desafie-se com técnicas mais avançadas');
      recommendations.push('Considere aprender teoria musical mais profunda');
    }
    
    return recommendations;
  }

  private getAvailableModules(): TrainingModule[] {
    // Filtrar módulos disponíveis baseado em pré-requisitos
    // Por enquanto, retornar todos os módulos de nível 1-2
    return this.modules.filter(m => m.difficulty <= 2);
  }

  private moduleAddressesWeakness(module: TrainingModule, weakness: string): boolean {
    const weaknessMap: Record<string, string[]> = {
      'Transições de Acordes': ['chords-transitions', 'chords-basic-open'],
      'Ritmo': ['rhythm-basic-strumming', 'rhythm-fingerpicking'],
      'Escalas': ['scales-major-pentatonic', 'scales-minor-pentatonic'],
      'Treino de Ouvido': ['ear-intervals', 'ear-chords'],
    };
    
    return weaknessMap[weakness]?.includes(module.id) || false;
  }

  private determineDailyFocus(analysis: TrainingAnalysis, modules: TrainingModule[]): string {
    if (modules.length === 0) return 'Revisão Geral';
    
    const categories = modules.map(m => m.category);
    const mostCommon = categories.sort((a, b) =>
      categories.filter(c => c === a).length - categories.filter(c => c === b).length
    ).pop();
    
    const focusMap: Record<string, string> = {
      'chords': 'Domínio de Acordes',
      'scales': 'Escalas e Improvisação',
      'rhythm': 'Desenvolvimento Rítmico',
      'ear-training': 'Percepção Auditiva',
      'songs': 'Repertório Musical',
      'technique': 'Refinamento Técnico',
    };
    
    return focusMap[mostCommon || 'chords'];
  }

  private generateRationale(analysis: TrainingAnalysis, modules: TrainingModule[]): string {
    const weakArea = analysis.weakAreas[0];
    const focus = this.determineDailyFocus(analysis, modules);
    
    return `Hoje focamos em ${focus} porque sua análise mostra que ${weakArea?.area} precisa de atenção. ` +
           `Os exercícios selecionados seguem uma progressão pedagógica que desenvolve ${modules.map(m => m.skills[0]).join(', ')}. ` +
           `Com sua taxa de progressão ${analysis.progressionRate === 'fast' ? 'rápida' : analysis.progressionRate === 'steady' ? 'constante' : 'gradual'}, ` +
           `esses treinos são ideais para seu nível atual.`;
  }

  private describePedagogicalApproach(modules: TrainingModule[]): string {
    const approaches = modules.map(m => m.methodology);
    const unique = Array.from(new Set(approaches));
    
    return `Metodologia aplicada: ${unique.join('. ')}. ` +
           `Esta abordagem combina teoria e prática, garantindo desenvolvimento equilibrado de habilidades técnicas e musicais.`;
  }

  getAllModules(): TrainingModule[] {
    return this.modules;
  }

  getModuleById(id: string): TrainingModule | undefined {
    return this.modules.find(m => m.id === id);
  }
}

export const trainingMethodologyService = new TrainingMethodologyService();
