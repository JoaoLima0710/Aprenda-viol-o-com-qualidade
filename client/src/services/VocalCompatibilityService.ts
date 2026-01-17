import { Song } from '@/data/songs';

export interface VocalRangeData {
  lowestNote: string;
  highestNote: string;
  rangeInSemitones: number;
}

export interface SongRecommendation {
  song: Song;
  compatibility: number; // 0-100
  reason: string;
}

export class VocalCompatibilityService {
  private static NOTE_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  /**
   * Converte uma nota (ex: "C3") em número MIDI
   */
  private static noteToMidi(note: string): number {
    const match = note.match(/^([A-G]#?)(\d+)$/);
    if (!match) return 0;
    
    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr);
    const noteIndex = this.NOTE_ORDER.indexOf(noteName);
    
    return (octave + 1) * 12 + noteIndex;
  }
  
  /**
   * Calcula a compatibilidade entre a extensão vocal do usuário e uma música
   */
  static calculateCompatibility(userRange: VocalRangeData, song: Song): number {
    if (!song.vocalRange) return 0;
    
    const userLowest = this.noteToMidi(userRange.lowestNote);
    const userHighest = this.noteToMidi(userRange.highestNote);
    const songLowest = this.noteToMidi(song.vocalRange.lowestNote);
    const songHighest = this.noteToMidi(song.vocalRange.highestNote);
    
    // Verifica se o usuário consegue cantar todas as notas da música
    const canSingLowest = userLowest <= songLowest;
    const canSingHighest = userHighest >= songHighest;
    
    if (canSingLowest && canSingHighest) {
      // Perfeito: usuário consegue cantar toda a música
      return 100;
    }
    
    // Calcula o quanto falta para o usuário conseguir cantar
    const lowestDiff = canSingLowest ? 0 : Math.abs(songLowest - userLowest);
    const highestDiff = canSingHighest ? 0 : Math.abs(songHighest - userHighest);
    const totalDiff = lowestDiff + highestDiff;
    
    // Quanto menor a diferença, maior a compatibilidade
    // 0 semitons = 100%, 12 semitons (1 oitava) = 0%
    const compatibility = Math.max(0, 100 - (totalDiff * 8.33));
    
    return Math.round(compatibility);
  }
  
  /**
   * Gera recomendações de músicas baseadas na extensão vocal do usuário
   */
  static getRecommendations(
    userRange: VocalRangeData,
    allSongs: Song[],
    limit: number = 10
  ): SongRecommendation[] {
    const recommendations: SongRecommendation[] = allSongs
      .filter(song => song.vocalRange) // Apenas músicas com extensão vocal definida
      .map(song => {
        const compatibility = this.calculateCompatibility(userRange, song);
        let reason = '';
        
        if (compatibility === 100) {
          reason = 'Perfeito para sua voz!';
        } else if (compatibility >= 80) {
          reason = 'Ótima compatibilidade';
        } else if (compatibility >= 60) {
          reason = 'Boa compatibilidade';
        } else if (compatibility >= 40) {
          reason = 'Desafiador, mas possível';
        } else {
          reason = 'Muito desafiador';
        }
        
        return {
          song,
          compatibility,
          reason,
        };
      })
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, limit);
    
    return recommendations;
  }
  
  /**
   * Analisa se o usuário precisa expandir sua extensão vocal
   */
  static getVocalAdvice(userRange: VocalRangeData, allSongs: Song[]): string {
    const perfectMatches = allSongs.filter(song => {
      if (!song.vocalRange) return false;
      return this.calculateCompatibility(userRange, song) === 100;
    }).length;
    
    const totalSongsWithRange = allSongs.filter(s => s.vocalRange).length;
    const percentage = (perfectMatches / totalSongsWithRange) * 100;
    
    if (percentage >= 80) {
      return 'Excelente! Você consegue cantar a maioria das músicas do repertório.';
    } else if (percentage >= 60) {
      return 'Boa extensão! Pratique exercícios vocais para expandir ainda mais.';
    } else if (percentage >= 40) {
      return 'Continue praticando! Trabalhe em expandir sua extensão vocal gradualmente.';
    } else {
      return 'Recomendamos aulas de canto para expandir sua extensão vocal com segurança.';
    }
  }
}
