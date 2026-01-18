/**
 * Serviço de Segmentação Inteligente de Músicas - 2026
 * Análise automática de estrutura musical e criação de jornadas de aprendizado
 */

export interface SongSection {
  id: string;
  name: string;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'solo' | 'pre-chorus' | 'instrumental';
  startTime?: number; // segundos
  duration?: number; // segundos
  chords: string[];
  chordChanges: number; // quantidade de mudanças
  difficulty: {
    harmonic: number; // 1-10
    rhythmic: number; // 1-10
    technical: number; // 1-10
    overall: number; // 1-10
  };
  repetitionCount: number; // quantas vezes se repete na música
  practicePriority: number; // 1-10, prioridade para prática
}

export interface SongAnalysis {
  title: string;
  artist: string;
  key: string;
  tempo: number; // BPM
  timeSignature: string; // "4/4", "3/4", etc.
  capo?: number;
  totalDuration: number; // segundos
  sections: SongSection[];
  uniqueChords: string[];
  chordProgression: string[];
  difficulty: {
    overall: number;
    harmonicComplexity: number;
    rhythmicComplexity: number;
    technicalDemand: number;
    learningCurve: number;
  };
  recommendedPace: {
    beginner: number[]; // semanas para completar cada fase
    intermediate: number[]; // semanas
    advanced: number[]; // semanas
  };
}

export interface LearningJourney {
  phases: LearningPhase[];
  totalDuration: number; // semanas
  milestones: string[];
  prerequisites: string[];
}

export interface LearningPhase {
  name: string;
  description: string;
  duration: number; // semanas
  objectives: string[];
  sectionsToPractice: string[]; // IDs das seções
  skillsToDevelop: string[];
  successCriteria: string[];
  practiceStructure: {
    warmup: string[];
    mainPractice: string[];
    cooldown: string[];
  };
}

export class SongSegmentationService {
  private static instance: SongSegmentationService;

  // Padrões musicais comuns para identificação automática
  private musicalPatterns = {
    chordProgressions: {
      'I-IV-V-I': ['C', 'F', 'G', 'C'],
      'I-V-vi-IV': ['C', 'G', 'Am', 'F'],
      'vi-IV-I-V': ['Am', 'F', 'C', 'G'],
      'I-vi-IV-V': ['C', 'Am', 'F', 'G']
    },
    sectionPatterns: {
      intro: {
        length: [4, 8, 16], // compassos típicos
        chordVariety: 'low',
        repetition: 'high'
      },
      verse: {
        length: [4, 8, 12],
        chordVariety: 'medium',
        repetition: 'medium'
      },
      chorus: {
        length: [4, 8, 16],
        chordVariety: 'low',
        repetition: 'high'
      },
      bridge: {
        length: [2, 4, 8],
        chordVariety: 'high',
        repetition: 'low'
      }
    }
  };

  private constructor() {}

  static getInstance(): SongSegmentationService {
    if (!SongSegmentationService.instance) {
      SongSegmentationService.instance = new SongSegmentationService();
    }
    return SongSegmentationService.instance;
  }

  /**
   * Analisa uma música a partir da cifra e metadados
   */
  analyzeSong(songData: {
    title: string;
    artist: string;
    chordSheet: string;
    tempo?: number;
    key?: string;
    capo?: number;
  }): SongAnalysis {
    const { title, artist, chordSheet, tempo = 120, key = 'C', capo = 0 } = songData;

    // Parse da cifra
    const parsedSections = this.parseChordSheet(chordSheet);

    // Análise de acordes únicos
    const uniqueChords = this.extractUniqueChords(parsedSections);
    const chordProgression = this.extractChordProgression(parsedSections);

    // Cálculo de dificuldade
    const difficulty = this.calculateSongDifficulty(parsedSections, uniqueChords, tempo);

    // Identificação de seções
    const sections = this.identifySections(parsedSections);

    // Calcular duração estimada (assumindo 4 compassos por seção)
    const totalDuration = sections.reduce((sum, section) => sum + (section.duration || 16), 0);

    // Ritmo estimado baseado na progressão
    const timeSignature = this.inferTimeSignature(sections);

    // Jornada de aprendizado recomendada
    const recommendedPace = this.calculateRecommendedPace(difficulty, sections.length);

    return {
      title,
      artist,
      key,
      tempo,
      timeSignature,
      capo,
      totalDuration,
      sections,
      uniqueChords,
      chordProgression,
      difficulty,
      recommendedPace
    };
  }

  /**
   * Cria jornada de aprendizado estruturada para uma música
   */
  createLearningJourney(analysis: SongAnalysis, userLevel: number): LearningJourney {
    const phases = this.generateLearningPhases(analysis, userLevel);
    const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);

    // Identificar pré-requisitos baseados nos acordes
    const prerequisites = this.identifyPrerequisites(analysis.uniqueChords);

    // Criar milestones
    const milestones = phases.map(phase => phase.name);

    return {
      phases,
      totalDuration,
      milestones,
      prerequisites
    };
  }

  /**
   * Identifica seções que precisam mais prática
   */
  getSectionsNeedingPractice(analysis: SongAnalysis, userProficiency: Record<string, number>): SongSection[] {
    return analysis.sections
      .map(section => ({
        ...section,
        userProficiency: this.calculateSectionProficiency(section, userProficiency)
      }))
      .filter(section => section.userProficiency < 70)
      .sort((a, b) => a.userProficiency - b.userProficiency);
  }

  /**
   * Gera loop de prática otimizado para uma seção
   */
  generatePracticeLoop(section: SongSection, userLevel: number): {
    repetitions: number;
    tempo: number;
    withBackingTrack: boolean;
    focusAreas: string[];
  } {
    const baseTempo = 80; // BPM base para iniciantes
    const tempoMultiplier = Math.min(1 + (userLevel - 1) * 0.2, 2);

    const repetitions = Math.max(2, Math.min(8, 10 - userLevel));
    const tempo = Math.round(baseTempo * tempoMultiplier);

    const focusAreas = this.identifyFocusAreas(section, userLevel);

    return {
      repetitions,
      tempo,
      withBackingTrack: userLevel >= 3,
      focusAreas
    };
  }

  // Private methods

  private parseChordSheet(chordSheet: string): SongSection[] {
    const lines = chordSheet.split('\n');
    const sections: SongSection[] = [];
    let currentSection: Partial<SongSection> | null = null;

    for (const line of lines) {
      // Detectar marcadores de seção
      const sectionMatch = line.match(/^\[([^\]]+)\]/);
      if (sectionMatch) {
        // Salvar seção anterior se existir
        if (currentSection && currentSection.name) {
          sections.push(currentSection as SongSection);
        }

        // Iniciar nova seção
        const sectionName = sectionMatch[1].toLowerCase();
        currentSection = {
          id: `section_${sections.length}`,
          name: sectionName,
          type: this.classifySectionType(sectionName),
          chords: [],
          chordChanges: 0,
          repetitionCount: 1,
          practicePriority: 5
        };
      } else if (currentSection && line.trim()) {
        // Extrair acordes da linha
        const chords = this.extractChordsFromLine(line);
        if (chords.length > 0) {
          currentSection.chords = [...(currentSection.chords || []), ...chords];
          currentSection.chordChanges = (currentSection.chordChanges || 0) + (chords.length - 1);
        }
      }
    }

    // Adicionar última seção
    if (currentSection && currentSection.name) {
      sections.push(currentSection as SongSection);
    }

    // Calcular dificuldades e prioridades
    return sections.map(section => ({
      ...section,
      difficulty: this.calculateSectionDifficulty(section),
      practicePriority: this.calculatePracticePriority(section)
    }));
  }

  private classifySectionType(sectionName: string): SongSection['type'] {
    const name = sectionName.toLowerCase();
    if (name.includes('intro')) return 'intro';
    if (name.includes('verse') || name.includes('verso')) return 'verse';
    if (name.includes('chorus') || name.includes('refrão') || name.includes('coro')) return 'chorus';
    if (name.includes('bridge') || name.includes('ponte')) return 'bridge';
    if (name.includes('outro') || name.includes('final')) return 'outro';
    if (name.includes('solo')) return 'solo';
    if (name.includes('pre-chorus') || name.includes('pré-refrão')) return 'pre-chorus';
    return 'instrumental';
  }

  private extractChordsFromLine(line: string): string[] {
    const chordRegex = /\[([^\]]+)\]/g;
    const chords: string[] = [];
    let match;

    while ((match = chordRegex.exec(line)) !== null) {
      chords.push(match[1]);
    }

    return chords;
  }

  private extractUniqueChords(sections: SongSection[]): string[] {
    const allChords = sections.flatMap(section => section.chords);
    return [...new Set(allChords)];
  }

  private extractChordProgression(sections: SongSection[]): string[] {
    // Simplificação: pegar primeira seção como progressão principal
    const mainSection = sections.find(s => s.type === 'verse' || s.type === 'chorus') || sections[0];
    return mainSection?.chords || [];
  }

  private calculateSectionDifficulty(section: SongSection): SongSection['difficulty'] {
    // Complexidade harmônica
    const uniqueChords = new Set(section.chords).size;
    const chordVariety = uniqueChords / section.chords.length;
    const complexChords = section.chords.filter(chord =>
      chord.includes('7') || chord.includes('m7') || chord.includes('maj7') ||
      chord.includes('dim') || chord.includes('aug') || chord.length > 3
    ).length;

    const harmonic = Math.min(10, Math.round(
      (chordVariety * 3) + (complexChords * 2) + (section.chordChanges * 0.5)
    ));

    // Complexidade rítmica (estimativa baseada em mudanças)
    const rhythmic = Math.min(10, Math.round(section.chordChanges * 0.8));

    // Demanda técnica
    const technical = Math.min(10, Math.round(
      harmonic * 0.6 + rhythmic * 0.4 + (section.chords.length > 8 ? 2 : 0)
    ));

    const overall = Math.round((harmonic + rhythmic + technical) / 3);

    return { harmonic, rhythmic, technical, overall };
  }

  private calculatePracticePriority(section: SongSection): number {
    // Priorizar seções mais repetidas e menos complexas
    const basePriority = 10 - section.difficulty.overall;
    const repetitionBonus = section.repetitionCount * 2;
    const typeBonus = section.type === 'chorus' ? 3 :
                     section.type === 'verse' ? 2 :
                     section.type === 'intro' ? 1 : 0;

    return Math.min(10, Math.max(1, basePriority + repetitionBonus + typeBonus));
  }

  private calculateSongDifficulty(
    sections: SongSection[],
    uniqueChords: string[],
    tempo: number
  ): SongAnalysis['difficulty'] {
    const avgSectionDifficulty = sections.reduce((sum, s) => sum + s.difficulty.overall, 0) / sections.length;

    // Complexidade harmônica baseada na variedade de acordes
    const harmonicComplexity = Math.min(10, uniqueChords.length * 0.8);

    // Complexidade rítmica baseada no tempo e mudanças
    const avgChanges = sections.reduce((sum, s) => sum + s.chordChanges, 0) / sections.length;
    const rhythmicComplexity = Math.min(10, (tempo / 10) + (avgChanges * 0.5));

    // Demanda técnica
    const technicalDemand = Math.min(10, harmonicComplexity * 0.7 + rhythmicComplexity * 0.3);

    // Curva de aprendizado
    const learningCurve = Math.min(10, (uniqueChords.length * 2) + (sections.length * 0.5));

    const overall = Math.round((harmonicComplexity + rhythmicComplexity + technicalDemand) / 3);

    return {
      overall,
      harmonicComplexity,
      rhythmicComplexity,
      technicalDemand,
      learningCurve
    };
  }

  private identifySections(parsedSections: any[]): SongSection[] {
    // Esta é uma simplificação - em produção usaria análise mais sofisticada
    return parsedSections.map((section, index) => ({
      ...section,
      duration: section.chords.length * 4, // estimativa: 4 segundos por acorde
      repetitionCount: section.type === 'chorus' ? 3 : section.type === 'verse' ? 2 : 1
    }));
  }

  private inferTimeSignature(sections: SongSection[]): string {
    // Análise baseada no número típico de acordes por seção
    const avgChordsPerSection = sections.reduce((sum, s) => sum + s.chords.length, 0) / sections.length;

    if (avgChordsPerSection <= 2) return '2/4';
    if (avgChordsPerSection <= 4) return '4/4';
    if (avgChordsPerSection <= 6) return '6/8';
    return '4/4'; // padrão
  }

  private calculateRecommendedPace(difficulty: SongAnalysis['difficulty'], sectionCount: number): SongAnalysis['recommendedPace'] {
    const baseWeeks = Math.max(2, difficulty.learningCurve / 2);

    // Beginner: mais tempo
    const beginner = [
      Math.round(baseWeeks * 2), // fase 1
      Math.round(baseWeeks * 1.5), // fase 2
      Math.round(baseWeeks) // fase 3
    ];

    // Intermediate: tempo médio
    const intermediate = [
      Math.round(baseWeeks * 1.5),
      Math.round(baseWeeks),
      Math.round(baseWeeks * 0.7)
    ];

    // Advanced: tempo reduzido
    const advanced = [
      Math.round(baseWeeks),
      Math.round(baseWeeks * 0.7),
      Math.round(baseWeeks * 0.5)
    ];

    return { beginner, intermediate, advanced };
  }

  private generateLearningPhases(analysis: SongAnalysis, userLevel: number): LearningPhase[] {
    const phases: LearningPhase[] = [];

    // Fase 1: Familiarização
    phases.push({
      name: 'Familiarização',
      description: 'Conhecer a música e seus acordes',
      duration: analysis.recommendedPace.intermediate[0],
      objectives: [
        'Identificar todos os acordes da música',
        'Entender a estrutura básica',
        'Ouvir a música várias vezes'
      ],
      sectionsToPractice: analysis.sections
        .filter(s => s.difficulty.overall <= 3)
        .map(s => s.id),
      skillsToDevelop: ['chord_recognition', 'music_listening'],
      successCriteria: [
        'Reconhecer todos os acordes isoladamente',
        'Identificar seções principais',
        'Cantar a melodia básica'
      ],
      practiceStructure: {
        warmup: ['Ouça a música completa 2 vezes'],
        mainPractice: ['Pratique cada acorde isoladamente', 'Identifique progressões'],
        cooldown: ['Ouça a música novamente focando na harmonia']
      }
    });

    // Fase 2: Construção
    phases.push({
      name: 'Construção',
      description: 'Construir domínio seção por seção',
      duration: analysis.recommendedPace.intermediate[1],
      objectives: [
        'Dominar seções individuais',
        'Conectar seções suavemente',
        'Aumentar velocidade gradualmente'
      ],
      sectionsToPractice: analysis.sections
        .filter(s => s.practicePriority >= 5)
        .map(s => s.id),
      skillsToDevelop: ['chord_transitions', 'rhythmic_precision'],
      successCriteria: [
        'Tocar cada seção em tempo normal',
        'Transições suaves entre seções',
        'Música 70% completa'
      ],
      practiceStructure: {
        warmup: ['Acordes da seção do dia'],
        mainPractice: ['Seção em 50% velocidade', 'Seção em 75% velocidade', 'Seção completa'],
        cooldown: ['Revisão da seção anterior']
      }
    });

    // Fase 3: Refinamento
    phases.push({
      name: 'Refinamento',
      description: 'Polir performance e adicionar expressão',
      duration: analysis.recommendedPace.intermediate[2],
      objectives: [
        'Tocar música completa',
        'Adicionar dinâmica e expressão',
        'Preparar para performance'
      ],
      sectionsToPractice: analysis.sections.map(s => s.id),
      skillsToDevelop: ['performance', 'expression', 'consistency'],
      successCriteria: [
        'Música completa sem erros',
        'Ritmo consistente',
        'Adição de dinâmica pessoal'
      ],
      practiceStructure: {
        warmup: ['Revisão de transições difíceis'],
        mainPractice: ['Música completa', 'Foco em expressão', 'Gravação e análise'],
        cooldown: ['Ouvir gravação e identificar pontos de melhoria']
      }
    });

    return phases;
  }

  private identifyPrerequisites(uniqueChords: string[]): string[] {
    const prerequisites: string[] = [];

    // Verificar acordes básicos
    const basicChords = ['C', 'G', 'Am', 'F', 'Em', 'D', 'A'];
    const hasBasicChords = uniqueChords.some(chord => basicChords.includes(chord));

    if (hasBasicChords) {
      prerequisites.push('Domínio de acordes básicos (C, G, Am, F)');
    }

    // Verificar acordes com pestana
    const barreChords = uniqueChords.filter(chord =>
      chord.includes('F') || chord.includes('B') || chord.length > 2
    );

    if (barreChords.length > 0) {
      prerequisites.push('Técnica básica de pestana');
    }

    // Verificar acordes complexos
    const complexChords = uniqueChords.filter(chord =>
      chord.includes('7') || chord.includes('maj7') || chord.includes('m7')
    );

    if (complexChords.length > 0) {
      prerequisites.push('Conhecimento de extensões de acordes');
    }

    return prerequisites;
  }

  private calculateSectionProficiency(section: SongSection, userProficiency: Record<string, number>): number {
    // Calcular proficiência baseada nos acordes da seção
    const chordProficiencies = section.chords.map(chord => userProficiency[chord] || 0);
    const avgChordProficiency = chordProficiencies.reduce((a, b) => a + b, 0) / chordProficiencies.length;

    // Ajustar por dificuldade da seção
    const difficultyMultiplier = 1 - (section.difficulty.overall / 20); // redução de até 50% para seções difíceis

    return Math.round(avgChordProficiency * difficultyMultiplier);
  }

  private identifyFocusAreas(section: SongSection, userLevel: number): string[] {
    const focusAreas: string[] = [];

    if (section.chordChanges > section.chords.length * 0.5) {
      focusAreas.push('Transições rápidas');
    }

    if (section.difficulty.harmonic > 6) {
      focusAreas.push('Acordes complexos');
    }

    if (section.difficulty.rhythmic > 6) {
      focusAreas.push('Ritmo preciso');
    }

    if (userLevel <= 2) {
      focusAreas.push('Formação correta');
    }

    return focusAreas.length > 0 ? focusAreas : ['Execução geral'];
  }
}

export const songSegmentationService = SongSegmentationService.getInstance();