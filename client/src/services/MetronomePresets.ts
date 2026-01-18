import { TimeSignature } from './MetronomeService';

export interface MetronomePreset {
  id: string;
  name: string;
  bpm: number;
  timeSignature: TimeSignature;
  genre?: string;
  artist?: string;
  description: string;
  accentPattern?: number[]; // Which beats to accent (1-indexed)
}

export const metronomePresets: MetronomePreset[] = [
  // Rock Presets
  {
    id: 'rock-standard',
    name: 'Rock Padrão',
    bpm: 120,
    timeSignature: '4/4',
    genre: 'Rock',
    description: 'Ritmo de rock clássico',
    accentPattern: [1, 3], // Backbeat nos tempos 2 e 4 (visual)
  },
  {
    id: 'legiao-urbana',
    name: 'Legião Urbana',
    bpm: 120,
    timeSignature: '4/4',
    genre: 'Rock',
    artist: 'Legião Urbana',
    description: 'Estilo Legião Urbana - 120 BPM',
    accentPattern: [1, 3],
  },
  {
    id: 'rock-fast',
    name: 'Rock Rápido',
    bpm: 160,
    timeSignature: '4/4',
    genre: 'Rock',
    description: 'Rock energético e rápido',
    accentPattern: [1, 3],
  },
  
  // Bossa Nova Presets
  {
    id: 'bossa-nova',
    name: 'Bossa Nova',
    bpm: 130,
    timeSignature: '4/4',
    genre: 'Bossa Nova',
    description: 'Swing característico da bossa nova',
    accentPattern: [1, 3],
  },
  {
    id: 'tom-jobim',
    name: 'Tom Jobim',
    bpm: 140,
    timeSignature: '4/4',
    genre: 'Bossa Nova',
    artist: 'Tom Jobim',
    description: 'Estilo Tom Jobim - 140 BPM',
    accentPattern: [1, 3],
  },
  
  // Samba Presets
  {
    id: 'samba-traditional',
    name: 'Samba Tradicional',
    bpm: 100,
    timeSignature: '2/4',
    genre: 'Samba',
    description: 'Samba tradicional brasileiro',
    accentPattern: [1],
  },
  {
    id: 'samba-fast',
    name: 'Samba Rápido',
    bpm: 140,
    timeSignature: '2/4',
    genre: 'Samba',
    description: 'Samba acelerado',
    accentPattern: [1],
  },
  
  // Sertanejo Presets
  {
    id: 'sertanejo-ballad',
    name: 'Sertanejo Romântico',
    bpm: 80,
    timeSignature: '4/4',
    genre: 'Sertanejo',
    description: 'Balada sertaneja',
    accentPattern: [1],
  },
  {
    id: 'sertanejo-upbeat',
    name: 'Sertanejo Animado',
    bpm: 110,
    timeSignature: '4/4',
    genre: 'Sertanejo',
    description: 'Sertanejo mais rápido',
    accentPattern: [1, 3],
  },
  
  // Forró Presets
  {
    id: 'forro',
    name: 'Forró',
    bpm: 120,
    timeSignature: '2/4',
    genre: 'Forró',
    description: 'Ritmo de forró nordestino',
    accentPattern: [1],
  },
  
  // MPB Presets
  {
    id: 'mpb-ballad',
    name: 'MPB Balada',
    bpm: 70,
    timeSignature: '4/4',
    genre: 'MPB',
    description: 'MPB suave e contemplativa',
    accentPattern: [1],
  },
  {
    id: 'mpb-upbeat',
    name: 'MPB Animada',
    bpm: 120,
    timeSignature: '4/4',
    genre: 'MPB',
    description: 'MPB com mais energia',
    accentPattern: [1, 3],
  },
];

export function getPresetsByGenre(genre: string): MetronomePreset[] {
  return metronomePresets.filter(p => p.genre === genre);
}

export function getPresetByArtist(artist: string): MetronomePreset | undefined {
  return metronomePresets.find(p => p.artist?.toLowerCase().includes(artist.toLowerCase()));
}

export function getPresetById(id: string): MetronomePreset | undefined {
  return metronomePresets.find(p => p.id === id);
}

export function getRecommendedPreset(songBpm: number, songGenre: string): MetronomePreset {
  // Encontrar preset mais próximo do BPM e gênero da música
  const genrePresets = getPresetsByGenre(songGenre);
  
  if (genrePresets.length > 0) {
    // Encontrar o mais próximo do BPM
    const closest = genrePresets.reduce((prev, curr) => {
      return Math.abs(curr.bpm - songBpm) < Math.abs(prev.bpm - songBpm) ? curr : prev;
    });
    return closest;
  }
  
  // Fallback para rock padrão
  return metronomePresets.find(p => p.id === 'rock-standard') || metronomePresets[0];
}
