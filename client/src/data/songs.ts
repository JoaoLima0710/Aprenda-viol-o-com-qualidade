export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: 'MPB' | 'Bossa Nova' | 'Samba' | 'Rock' | 'Sertanejo' | 'Forró';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  bpm: number;
  key: string;
  chords: string[];
  lyrics: string;
  chordSheet: string; // Cifra com letra
  videoUrl?: string;
  spotifyUrl?: string;
  description: string;
  tips: string[];
  vocalRange?: {
    lowestNote: string;  // Ex: "C3"
    highestNote: string; // Ex: "G4"
    rangeInSemitones: number;
  };
}

export const songs: Song[] = [
  // MPB - Iniciante
  {
    id: 'asa-branca',
    title: 'Asa Branca',
    artist: 'Luiz Gonzaga',
    genre: 'Forró',
    difficulty: 'beginner',
    bpm: 120,
    key: 'G',
    chords: ['G', 'C', 'D', 'Em'],
    lyrics: 'Quando olhei a terra ardendo...',
    chordSheet: `[G]Quando olhei a terra ar[C]dendo
Qual fo[D]gueira de São [G]João
Eu per[G]guntei a Deus do [C]céu, ai
Por [D]que tamanha judi[G]ação`,
    description: 'Clássico do forró nordestino, perfeito para iniciantes',
    tips: [
      'Ritmo de baião: baixo-cima-baixo-cima',
      'Acentue os tempos fortes',
      'Pratique a transição G-C-D',
    ],
    vocalRange: {
      lowestNote: 'D3',
      highestNote: 'A4',
      rangeInSemitones: 19,
    },
  },
  {
    id: 'trem-das-onze',
    title: 'Trem das Onze',
    artist: 'Adoniran Barbosa',
    genre: 'Samba',
    difficulty: 'beginner',
    bpm: 100,
    key: 'Am',
    chords: ['Am', 'Dm', 'E7', 'G', 'C'],
    lyrics: 'Não posso ficar nem mais um minuto com você...',
    chordSheet: `[Am]Não posso ficar nem mais um mi[Dm]nuto com você
[E7]Sinto muito amor mas não pode [Am]ser
[Am]Moro em Jaçanã se eu per[Dm]der esse trem
Que [E7]sai agora às onze [Am]horas
[G]Só amanhã de ma[C]nhã`,
    description: 'Samba paulista icônico, ótimo para praticar ritmo',
    tips: [
      'Batida de samba: baixo-cima-abafa-cima-baixo-cima',
      'Mantenha o tempo constante',
      'Destaque o baixo nos acordes',
    ],
    vocalRange: {
      lowestNote: 'C3',
      highestNote: 'F4',
      rangeInSemitones: 17,
    },
  },
  
  // Bossa Nova - Iniciante
  {
    id: 'garota-de-ipanema',
    title: 'Garota de Ipanema',
    artist: 'Tom Jobim',
    genre: 'Bossa Nova',
    difficulty: 'intermediate',
    bpm: 130,
    key: 'F',
    chords: ['Fmaj7', 'G7', 'Gm7', 'Gb7', 'Fmaj7', 'Gbmaj7'],
    lyrics: 'Olha que coisa mais linda...',
    chordSheet: `[Fmaj7]Olha que coisa mais [G7]linda
Mais cheia de [Gm7]graça
É ela menina que [Gb7]vem e que [Fmaj7]passa
Num doce ba[Gb7]lanço a caminho do [Fmaj7]mar`,
    description: 'Bossa nova clássica, requer acordes com sétima',
    tips: [
      'Batida de bossa: polegar-indicador-polegar-indicador',
      'Suavize as batidas',
      'Pratique os acordes com sétima separadamente',
    ],
    vocalRange: {
      lowestNote: 'C3',
      highestNote: 'E4',
      rangeInSemitones: 16,
    },
  },
  {
    id: 'chega-de-saudade',
    title: 'Chega de Saudade',
    artist: 'Tom Jobim',
    genre: 'Bossa Nova',
    difficulty: 'intermediate',
    bpm: 140,
    key: 'Dm',
    chords: ['Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7', 'Am7'],
    lyrics: 'Vai minha tristeza...',
    chordSheet: `[Dm7]Vai minha tris[G7]teza
E diz a [Cmaj7]ela que sem [Fmaj7]ela
Não [Bm7b5]pode [E7]ser
Diz-lhe numa [Am7]prece`,
    description: 'Marco da bossa nova, harmonia rica',
    tips: [
      'Estude a progressão ii-V-I',
      'Mantenha o swing característico',
      'Use pestana para Bm7b5',
    ],
  },
  
  // MPB - Intermediário
  {
    id: 'eduardo-e-monica',
    title: 'Eduardo e Mônica',
    artist: 'Legião Urbana',
    genre: 'Rock',
    difficulty: 'beginner',
    bpm: 120,
    key: 'D',
    chords: ['D', 'A', 'G', 'Bm', 'Em'],
    lyrics: 'Quem um dia irá dizer...',
    chordSheet: `[D]Quem um dia irá dizer
Que existe [A]razão
Nas coisas [G]feitas pelo cora[D]ção?
E quem irá [A]dizer
Que não existe [G]razão?`,
    description: 'Rock brasileiro clássico dos anos 80',
    tips: [
      'Dedilhado suave nos versos',
      'Batida mais forte no refrão',
      'Transição suave entre D e A',
    ],
  },
  {
    id: 'como-e-grande-o-meu-amor-por-voce',
    title: 'Como É Grande o Meu Amor Por Você',
    artist: 'Roberto Carlos',
    genre: 'MPB',
    difficulty: 'beginner',
    bpm: 80,
    key: 'C',
    chords: ['C', 'Am', 'Dm', 'G7', 'F', 'Em'],
    lyrics: 'Eu tenho tanto pra lhe falar...',
    chordSheet: `[C]Eu tenho tanto pra lhe [Am]falar
Mas com pa[Dm]lavras não sei di[G7]zer
Como é [C]grande o meu amor por [F]você
[Em]E não há [Dm]nada pra compa[G7]rar`,
    description: 'Balada romântica brasileira',
    tips: [
      'Dedilhado romântico: p-i-m-a-m-i',
      'Dinâmica suave',
      'Enfatize as notas do baixo',
    ],
  },
  
  // Samba - Intermediário
  {
    id: 'aquarela-do-brasil',
    title: 'Aquarela do Brasil',
    artist: 'Ary Barroso',
    genre: 'Samba',
    difficulty: 'intermediate',
    bpm: 140,
    key: 'G',
    chords: ['G', 'D7', 'Am7', 'Cm', 'G7', 'C', 'A7'],
    lyrics: 'Brasil, meu Brasil brasileiro...',
    chordSheet: `[G]Brasil, meu Brasil brasi[D7]leiro
Meu mulato ina[Am7]to
Vou cantar-te nos meus [Cm]versos
[G]Ô Brasil, samba que [G7]dá
Bamboleio que [C]faz gingar`,
    description: 'Samba exaltação, símbolo do Brasil',
    tips: [
      'Batida de samba tradicional',
      'Acentue o segundo tempo',
      'Pratique o ritmo sincopado',
    ],
  },
  {
    id: 'mas-que-nada',
    title: 'Mas Que Nada',
    artist: 'Jorge Ben Jor',
    genre: 'Samba',
    difficulty: 'intermediate',
    bpm: 130,
    key: 'Dm',
    chords: ['Dm', 'A7', 'Gm', 'C7', 'F', 'Bb'],
    lyrics: 'Ô ariá raiô...',
    chordSheet: `[Dm]Ô ariá raiô
Ô ariá rai[A7]á
[Dm]Mas que nada
Sai da minha [Gm]frente
Que eu quero pas[C7]sar`,
    description: 'Samba-rock contagiante',
    tips: [
      'Groove marcado e constante',
      'Abafe as cordas no tempo',
      'Swing característico do samba-rock',
    ],
  },
  
  // Sertanejo - Iniciante
  {
    id: 'evidencias',
    title: 'Evidências',
    artist: 'Chitãozinho & Xororó',
    genre: 'Sertanejo',
    difficulty: 'beginner',
    bpm: 90,
    key: 'G',
    chords: ['G', 'D', 'Em', 'C', 'Am', 'Bm'],
    lyrics: 'Quando eu digo que deixei de te amar...',
    chordSheet: `[G]Quando eu digo que deixei de te a[D]mar
É porque eu te [Em]amo
Quando eu [C]digo que não quero mais vo[G]cê
É porque eu te [Am]quero`,
    description: 'Clássico sertanejo, muito popular',
    tips: [
      'Dedilhado romântico',
      'Transições suaves',
      'Cante junto para pegar o ritmo',
    ],
  },
  {
    id: 'tocando-em-frente',
    title: 'Tocando em Frente',
    artist: 'Almir Sater',
    genre: 'Sertanejo',
    difficulty: 'beginner',
    bpm: 70,
    key: 'D',
    chords: ['D', 'A', 'Bm', 'G', 'Em'],
    lyrics: 'Ando devagar porque já tive pressa...',
    chordSheet: `[D]Ando devagar porque já tive [A]pressa
E levo esse sor[Bm]riso
Porque já chorei de[G]mais
[D]Hoje me sinto mais [A]forte
Mais feliz quem [Bm]sabe
Só levo a cer[G]teza
De que muito pouco eu [D]sei`,
    description: 'Música reflexiva, ótima para dedilhado',
    tips: [
      'Dedilhado suave e contemplativo',
      'Deixe as notas respirarem',
      'Foco na expressão',
    ],
  },
  
  // Rock - Intermediário
  {
    id: 'faroeste-caboclo',
    title: 'Faroeste Caboclo',
    artist: 'Legião Urbana',
    genre: 'Rock',
    difficulty: 'intermediate',
    bpm: 140,
    key: 'Am',
    chords: ['Am', 'G', 'F', 'C', 'Dm', 'E'],
    lyrics: 'Não tinha medo o tal João de Santo Cristo...',
    chordSheet: `[Am]Não tinha medo o tal João de Santo [G]Cristo
Era o [F]maior dos bandidos daquelas [C]redondezas
[Am]E o João de Santo Cristo [G]logo cedo
Se [F]tornou rei dos bandidos [C]lá da Ceilândia`,
    description: 'Épico do rock brasileiro, história longa',
    tips: [
      'Batida constante e energética',
      'Mantenha o ritmo por toda a música',
      'Pratique as transições rápidas',
    ],
  },
  {
    id: 'tempo-perdido',
    title: 'Tempo Perdido',
    artist: 'Legião Urbana',
    genre: 'Rock',
    difficulty: 'beginner',
    bpm: 120,
    key: 'G',
    chords: ['G', 'D', 'C', 'Em', 'Am'],
    lyrics: 'Todos os dias quando acordo...',
    chordSheet: `[G]Todos os dias quando a[D]cordo
Não tenho mais o [C]tempo que pas[G]sou
Mas tenho [Em]muito tempo
Temos [Am]todo o tempo do [D]mundo`,
    description: 'Rock brasileiro dos anos 80',
    tips: [
      'Batida de rock: baixo-cima-abafa-cima',
      'Energia constante',
      'Transições marcadas',
    ],
  },
  
  // MPB - Avançado
  {
    id: 'construcao',
    title: 'Construção',
    artist: 'Chico Buarque',
    genre: 'MPB',
    difficulty: 'advanced',
    bpm: 110,
    key: 'Dm',
    chords: ['Dm', 'A7', 'Gm', 'C7', 'F', 'Bb', 'E7', 'Am'],
    lyrics: 'Amou daquela vez como se fosse a última...',
    chordSheet: `[Dm]Amou daquela vez como se fosse a [A7]última
[Dm]Beijou sua mulher como se fosse a [Gm]última
E cada filho seu como se fosse o [C7]único
E atravessou a [F]rua com seu passo [Bb]tímido`,
    description: 'Obra-prima da MPB, complexa e poética',
    tips: [
      'Ritmo peculiar e sincopado',
      'Atenção às mudanças de compasso',
      'Estude a letra para entender o ritmo',
    ],
  },
  {
    id: 'o-quereres',
    title: 'O Quereres',
    artist: 'Caetano Veloso',
    genre: 'MPB',
    difficulty: 'advanced',
    bpm: 100,
    key: 'Am',
    chords: ['Am', 'Dm', 'G', 'C', 'F', 'E7', 'Bm7b5'],
    lyrics: 'Onde queres prazer sou o que dói...',
    chordSheet: `[Am]Onde queres prazer sou o que [Dm]dói
E onde queres tortura man[G]sinho e ternura
Onde queres um lar tenho uma [C]rua
Onde queres bandido sou [F]herói`,
    description: 'MPB sofisticada, harmonia rica',
    tips: [
      'Harmonia complexa',
      'Transições suaves entre acordes',
      'Expressão e dinâmica são essenciais',
    ],
  },
  
  // Bossa Nova - Avançado
  {
    id: 'desafinado',
    title: 'Desafinado',
    artist: 'Tom Jobim',
    genre: 'Bossa Nova',
    difficulty: 'advanced',
    bpm: 140,
    key: 'F',
    chords: ['Fmaj7', 'G7', 'Gm7', 'C7', 'Am7', 'D7', 'Dm7', 'Bb7'],
    lyrics: 'Se você disser que eu desafino amor...',
    chordSheet: `[Fmaj7]Se você disser que eu desa[G7]fino amor
Saiba que isso em [Gm7]mim provoca imen[C7]sa dor
[Fmaj7]Privilegiados têm ouvidos [Am7]iguais aos [D7]seus
[Dm7]Eu possuo apenas o que [G7]Deus me [C7]deu`,
    description: 'Bossa nova complexa, harmonia jazzística',
    tips: [
      'Domine os acordes com tensões',
      'Batida de bossa precisa',
      'Estude a harmonia antes de tocar',
    ],
  },
  
  // Mais músicas populares
  {
    id: 'ainda-e-cedo',
    title: 'Ainda É Cedo',
    artist: 'Legião Urbana',
    genre: 'Rock',
    difficulty: 'beginner',
    bpm: 130,
    key: 'E',
    chords: ['E', 'A', 'B', 'C#m'],
    lyrics: 'Ainda é cedo amor...',
    chordSheet: `[E]Ainda é cedo a[A]mor
Mal começou o [B]nosso dia
[E]Dá tempo de es[A]quecer
Dá tempo de per[B]doar`,
    description: 'Rock brasileiro energético',
    tips: [
      'Batida de rock constante',
      'Power chords no refrão',
      'Energia do início ao fim',
    ],
  },
  {
    id: 'pais-e-filhos',
    title: 'Pais e Filhos',
    artist: 'Legião Urbana',
    genre: 'Rock',
    difficulty: 'beginner',
    bpm: 90,
    key: 'G',
    chords: ['G', 'D', 'C', 'Em', 'Am'],
    lyrics: 'Estátuas e cofres e paredes pintadas...',
    chordSheet: `[G]Estátuas e cofres e [D]paredes pintadas
[C]Ninguém sabe o que acon[G]teceu
[Em]Ela se jogou da [Am]janela do quinto an[D]dar`,
    description: 'Balada rock reflexiva',
    tips: [
      'Dedilhado nos versos',
      'Batida no refrão',
      'Dinâmica é fundamental',
    ],
  },
  {
    id: 'que-pais-e-esse',
    title: 'Que País É Esse',
    artist: 'Legião Urbana',
    genre: 'Rock',
    difficulty: 'beginner',
    bpm: 150,
    key: 'D',
    chords: ['D', 'A', 'G', 'Bm'],
    lyrics: 'Nas favelas, no Senado...',
    chordSheet: `[D]Nas favelas, no Se[A]nado
[G]Sujeira pra todo [D]lado
[Bm]Ninguém respeita a Consti[A]tuição
Mas [G]todos acreditam no fu[D]turo da nação`,
    description: 'Rock protesto brasileiro',
    tips: [
      'Batida punk rock',
      'Energia e atitude',
      'Ritmo acelerado',
    ],
  },
  {
    id: 'perfeicao',
    title: 'Perfeição',
    artist: 'Legião Urbana',
    genre: 'Rock',
    difficulty: 'intermediate',
    bpm: 100,
    key: 'Am',
    chords: ['Am', 'F', 'C', 'G', 'Dm', 'E'],
    lyrics: 'Vamos celebrar a estupidez humana...',
    chordSheet: `[Am]Vamos celebrar a estu[F]pidez humana
A [C]estupidez de todas as na[G]ções
[Am]O meu país e o seu [F]país
O [C]país da violência e da [G]impunição`,
    description: 'Crítica social em forma de rock',
    tips: [
      'Ritmo marcado',
      'Transições precisas',
      'Interpretação expressiva',
    ],
  },
];

// Helper functions
export function getSongsByGenre(genre: Song['genre']): Song[] {
  return songs.filter(song => song.genre === genre);
}

export function getSongsByDifficulty(difficulty: Song['difficulty']): Song[] {
  return songs.filter(song => song.difficulty === difficulty);
}

export function getSongsByArtist(artist: string): Song[] {
  return songs.filter(song => song.artist.toLowerCase().includes(artist.toLowerCase()));
}

export function searchSongs(query: string): Song[] {
  const lowerQuery = query.toLowerCase();
  return songs.filter(
    song =>
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      song.lyrics.toLowerCase().includes(lowerQuery)
  );
}

export function getSongById(id: string): Song | undefined {
  return songs.find(song => song.id === id);
}

export const genres: Song['genre'][] = ['MPB', 'Bossa Nova', 'Samba', 'Rock', 'Sertanejo', 'Forró'];
export const difficulties: Song['difficulty'][] = ['beginner', 'intermediate', 'advanced'];
