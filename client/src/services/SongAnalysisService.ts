import { Song } from '@/data/songs';
import { useChordStore } from '@/stores/useChordStore';
import { useScaleProgressionStore } from '@/stores/useScaleProgressionStore';

export interface SongComplexity {
  overall: 'beginner' | 'intermediate' | 'advanced';
  chordComplexity: number; // 0-100
  rhythmComplexity: number; // 0-100
  techniqueRequired: string[];
  estimatedPracticeTime: number; // minutes
}

export interface SkillRequirement {
  type: 'chord' | 'scale' | 'technique' | 'rhythm';
  name: string;
  description: string;
  mastered: boolean;
  practiceUrl?: string;
}

export interface SongSkillTree {
  songId: string;
  songTitle: string;
  prerequisites: SkillRequirement[];
  microChallenges: Array<{
    id: string;
    title: string;
    description: string;
    type: 'riff' | 'chord-progression' | 'rhythm' | 'transition';
    target: string; // e.g., "Intro riff", "C7M -> Am7"
    difficulty: number; // 1-5
    estimatedTime: number; // minutes
    unlocked: boolean;
  }>;
  recommendedOrder: string[]; // IDs dos desafios em ordem
}

class SongAnalysisService {
  /**
   * Analisa a complexidade de uma música
   */
  analyzeComplexity(song: Song): SongComplexity {
    const chordComplexity = this.calculateChordComplexity(song.chords);
    const rhythmComplexity = this.calculateRhythmComplexity(song.bpm, song.genre);
    const techniqueRequired = this.detectRequiredTechniques(song);
    
    // Calcular complexidade geral
    const avgComplexity = (chordComplexity + rhythmComplexity) / 2;
    let overall: 'beginner' | 'intermediate' | 'advanced';
    
    if (avgComplexity < 40) {
      overall = 'beginner';
    } else if (avgComplexity < 70) {
      overall = 'intermediate';
    } else {
      overall = 'advanced';
    }
    
    // Tempo estimado de prática baseado na complexidade
    const estimatedPracticeTime = Math.ceil(
      (chordComplexity * 0.3) + (rhythmComplexity * 0.2) + (techniqueRequired.length * 10)
    );
    
    return {
      overall,
      chordComplexity,
      rhythmComplexity,
      techniqueRequired,
      estimatedPracticeTime: Math.max(15, Math.min(estimatedPracticeTime, 120)),
    };
  }
  
  /**
   * Calcula complexidade de acordes
   */
  private calculateChordComplexity(chords: string[]): number {
    let complexity = 0;
    const uniqueChords = new Set(chords);
    
    uniqueChords.forEach(chord => {
      // Acordes básicos (0-20 pontos)
      if (['C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em'].includes(chord)) {
        complexity += 5;
      }
      // Acordes com sétima (20-40 pontos)
      else if (chord.includes('7') || chord.includes('maj7') || chord.includes('m7')) {
        complexity += 25;
      }
      // Acordes com tensões (40-60 pontos)
      else if (chord.includes('9') || chord.includes('11') || chord.includes('13')) {
        complexity += 45;
      }
      // Acordes com alterações (60-80 pontos)
      else if (chord.includes('#') || chord.includes('b') || chord.includes('sus')) {
        complexity += 60;
      }
      // Acordes complexos (80-100 pontos)
      else if (chord.includes('dim') || chord.includes('aug') || chord.includes('add')) {
        complexity += 80;
      }
      else {
        complexity += 15; // Acordes intermediários
      }
    });
    
    // Normalizar para 0-100
    const avgComplexity = complexity / uniqueChords.size;
    return Math.min(100, Math.round(avgComplexity));
  }
  
  /**
   * Calcula complexidade rítmica
   */
  private calculateRhythmComplexity(bpm: number, genre: string): number {
    let complexity = 0;
    
    // BPM impact
    if (bpm < 80) complexity += 10;
    else if (bpm < 100) complexity += 20;
    else if (bpm < 120) complexity += 40;
    else if (bpm < 140) complexity += 60;
    else complexity += 80;
    
    // Genre impact
    const genreComplexity: Record<string, number> = {
      'Bossa Nova': 70,
      'Samba': 65,
      'Rock': 50,
      'MPB': 45,
      'Sertanejo': 35,
      'Forró': 40,
    };
    
    complexity += genreComplexity[genre] || 30;
    
    return Math.min(100, Math.round(complexity / 2));
  }
  
  /**
   * Detecta técnicas necessárias
   */
  private detectRequiredTechniques(song: Song): string[] {
    const techniques: string[] = [];
    
    // Analisar acordes para detectar técnicas
    song.chords.forEach(chord => {
      if (chord.includes('7') || chord.includes('maj7')) {
        if (!techniques.includes('Acordes com Sétima')) {
          techniques.push('Acordes com Sétima');
        }
      }
      
      if (chord.includes('m') && !chord.includes('m7') && !chord.includes('maj')) {
        if (!techniques.includes('Acordes Menores')) {
          techniques.push('Acordes Menores');
        }
      }
      
      // Detectar pestana (acordes como Bm, F, etc)
      const barreChords = ['B', 'F', 'Bb', 'F#', 'Bm', 'Fm'];
      if (barreChords.some(bc => chord.startsWith(bc))) {
        if (!techniques.includes('Pestana')) {
          techniques.push('Pestana');
        }
      }
    });
    
    // Analisar BPM para detectar técnicas rítmicas
    if (song.bpm > 120) {
      if (!techniques.includes('Ritmo Rápido')) {
        techniques.push('Ritmo Rápido');
      }
    }
    
    // Analisar gênero
    if (song.genre === 'Bossa Nova') {
      if (!techniques.includes('Batida de Bossa Nova')) {
        techniques.push('Batida de Bossa Nova');
      }
    } else if (song.genre === 'Samba') {
      if (!techniques.includes('Batida de Samba')) {
        techniques.push('Batida de Samba');
      }
    } else if (song.genre === 'Rock') {
      if (!techniques.includes('Batida de Rock')) {
        techniques.push('Batida de Rock');
      }
    }
    
    return techniques;
  }
  
  /**
   * Cria uma árvore de habilidades baseada na música
   */
  createSkillTree(song: Song): SongSkillTree {
    const complexity = this.analyzeComplexity(song);
    const chordStore = useChordStore.getState();
    const scaleStore = useScaleProgressionStore.getState();
    
    // Identificar pré-requisitos
    const prerequisites: SkillRequirement[] = [];
    
    // Acordes necessários
    const uniqueChords = new Set(song.chords);
    uniqueChords.forEach(chordName => {
      // Verificar se o acorde foi praticado (busca simplificada por nome)
      const practiced = Object.entries(chordStore.progress).some(([chordId, progress]) => {
        if (!progress?.practiced) return false;
        // Normalizar nomes para comparação
        const normalizedId = chordId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedName = chordName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedId.includes(normalizedName) || normalizedName.includes(normalizedId);
      });
      
      prerequisites.push({
        type: 'chord',
        name: chordName,
        description: `Dominar o acorde ${chordName}`,
        mastered: practiced,
        practiceUrl: `/chords`,
      });
    });
    
    // Técnicas necessárias
    complexity.techniqueRequired.forEach(technique => {
      prerequisites.push({
        type: 'technique',
        name: technique,
        description: `Aprender ${technique}`,
        mastered: false, // TODO: Verificar se técnica foi dominada
        practiceUrl: `/practice`,
      });
    });
    
    // Criar micro-desafios baseados na música
    const microChallenges: SongSkillTree['microChallenges'] = [];
    
    // Desafio 1: Acordes básicos
    if (song.chords.length > 0) {
      microChallenges.push({
        id: `${song.id}-chords`,
        title: `Acordes de ${song.title}`,
        description: `Pratique a progressão de acordes: ${song.chords.slice(0, 4).join(' → ')}`,
        type: 'chord-progression',
        target: song.chords.join(' → '),
        difficulty: complexity.chordComplexity < 40 ? 1 : complexity.chordComplexity < 70 ? 3 : 5,
        estimatedTime: Math.ceil(complexity.chordComplexity * 0.3),
        unlocked: prerequisites.filter(p => p.type === 'chord').every(p => p.mastered),
      });
    }
    
    // Desafio 2: Ritmo
    microChallenges.push({
      id: `${song.id}-rhythm`,
      title: `Ritmo de ${song.genre}`,
      description: `Mantenha o ritmo de ${song.bpm} BPM no estilo ${song.genre}`,
      type: 'rhythm',
      target: `${song.bpm} BPM - ${song.genre}`,
      difficulty: complexity.rhythmComplexity < 40 ? 1 : complexity.rhythmComplexity < 70 ? 3 : 5,
      estimatedTime: Math.ceil(complexity.rhythmComplexity * 0.2),
      unlocked: true, // Ritmo sempre desbloqueado
    });
    
    // Desafio 3: Transições (se houver acordes complexos)
    if (song.chords.length >= 2) {
      const transitions: string[] = [];
      for (let i = 0; i < song.chords.length - 1; i++) {
        transitions.push(`${song.chords[i]} → ${song.chords[i + 1]}`);
      }
      
      microChallenges.push({
        id: `${song.id}-transitions`,
        title: 'Transições Rápidas',
        description: `Pratique as transições: ${transitions.slice(0, 2).join(', ')}`,
        type: 'transition',
        target: transitions.join(', '),
        difficulty: complexity.chordComplexity < 40 ? 2 : complexity.chordComplexity < 70 ? 4 : 5,
        estimatedTime: Math.ceil(complexity.chordComplexity * 0.25),
        unlocked: microChallenges[0]?.unlocked || false,
      });
    }
    
    // Desafio 4: Música completa (sempre o último)
    microChallenges.push({
      id: `${song.id}-full`,
      title: `${song.title} Completa`,
      description: `Toque a música completa com precisão`,
      type: 'chord-progression',
      target: 'Música completa',
      difficulty: complexity.overall === 'beginner' ? 2 : complexity.overall === 'intermediate' ? 4 : 5,
      estimatedTime: complexity.estimatedPracticeTime,
      unlocked: microChallenges.slice(0, -1).every(c => c.unlocked),
    });
    
    return {
      songId: song.id,
      songTitle: song.title,
      prerequisites,
      microChallenges,
      recommendedOrder: microChallenges.map(c => c.id),
    };
  }
  
  /**
   * Verifica se o usuário está pronto para uma música
   */
  isUserReadyForSong(song: Song): {
    ready: boolean;
    missingSkills: SkillRequirement[];
    progress: number; // 0-100
  } {
    const skillTree = this.createSkillTree(song);
    const masteredPrerequisites = skillTree.prerequisites.filter(p => p.mastered);
    const progress = (masteredPrerequisites.length / skillTree.prerequisites.length) * 100;
    
    return {
      ready: progress >= 70, // 70% dos pré-requisitos
      missingSkills: skillTree.prerequisites.filter(p => !p.mastered),
      progress: Math.round(progress),
    };
  }
}

export const songAnalysisService = new SongAnalysisService();
