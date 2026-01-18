import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ChordSheetWithPlayer } from '@/components/songs/ChordSheetWithPlayer';
import { KaraokeMode } from '@/components/songs/KaraokeMode';
import { PerformanceMode } from '@/components/songs/PerformanceMode';
import { SheetMusicMode } from '@/components/songs/SheetMusicMode';
import { Metronome } from '@/components/practice/Metronome';
import { PracticeMode } from '@/components/practice/PracticeMode';
import { AudioRecorder } from '@/components/practice/AudioRecorder';
import { Button } from '@/components/ui/button';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useSongStore } from '@/stores/useSongStore';
import { useSongUnlockStore } from '@/stores/useSongUnlockStore';
import { getSongById } from '@/data/songs';
import { PdfExportService } from '@/services/PdfExportService';
import { cifraClubService } from '@/services/CifraClubService';
import { songAnalysisService } from '@/services/SongAnalysisService';
import { getRecommendedPreset } from '@/services/MetronomePresets';
import { SongSkillTreeComponent } from '@/components/songs/SongSkillTree';
import { toast } from 'sonner';
import { ArrowLeft, Heart, Play, Music, Clock, TrendingUp, Lightbulb, Mic, Maximize2, Download, ExternalLink, Lock, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const genreColors: Record<string, string> = {
  'MPB': 'from-[#a855f7] to-[#8b5cf6]',
  'Bossa Nova': 'from-[#06b6d4] to-[#0891b2]',
  'Samba': 'from-[#f97316] to-[#ea580c]',
  'Rock': 'from-[#ec4899] to-[#db2777]',
  'Sertanejo': 'from-[#10b981] to-[#059669]',
  'Forró': 'from-[#eab308] to-[#ca8a04]',
};

const difficultyLabels: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export default function SongDetail() {
  const [, params] = useRoute('/songs/:id');
  const [, setLocation] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showMetronome, setShowMetronome] = useState(false);
  const [showPracticeMode, setShowPracticeMode] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showKaraoke, setShowKaraoke] = useState(false);
  const [showPerformanceMode, setShowPerformanceMode] = useState(false);
  const [showSheetMusic, setShowSheetMusic] = useState(false);
  const [transposition, setTransposition] = useState(0); // Semitons: -12 to +12
  const [capo, setCapo] = useState(0); // Capo position: 0 to 12
  const [simplified, setSimplified] = useState(false);
  
  const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();
  const { isFavorite, toggleFavorite, markAsPracticed } = useSongStore();
  const { isSongUnlocked, getUnlockRequirements } = useSongUnlockStore();
  
  const userName = "João";
  const songId = params?.id || '';
  const song = getSongById(songId);
  
  useEffect(() => {
    if (!song) {
      setLocation('/songs');
    }
  }, [song, setLocation]);
  
  if (!song) {
    return null;
  }
  
  const favorite = isFavorite(song.id);
  const isUnlocked = isSongUnlocked(song.id);
  const unlockRequirements = getUnlockRequirements(song.id);
  const complexity = songAnalysisService.analyzeComplexity(song);
  const skillTree = songAnalysisService.createSkillTree(song);
  const readiness = songAnalysisService.isUserReadyForSong(song);
  
  // Transpose chords
  const transposeChord = (chord: string, semitones: number): string => {
    // Simplified transposition - would need full chord library for accurate transposition
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseNote = chord.match(/^[A-G]#?b?/)?.[0] || 'C';
    const noteIndex = notes.indexOf(baseNote);
    if (noteIndex === -1) return chord;
    
    const newIndex = (noteIndex + semitones + 12) % 12;
    const newNote = notes[newIndex];
    return chord.replace(baseNote, newNote);
  };
  
  const getTransposedChords = () => {
    if (transposition === 0 && capo === 0) return song.chords;
    const totalSemitones = transposition + capo;
    return song.chords.map(chord => transposeChord(chord, totalSemitones));
  };
  
  const handlePractice = () => {
    if (!isUnlocked) {
      toast.error('Esta música ainda está bloqueada. Complete os requisitos para desbloqueá-la!');
      return;
    }
    markAsPracticed(song.id);
    setShowPerformanceMode(true);
  };
  
  const handleExportPdf = async () => {
    try {
      toast.loading('Gerando PDF...');
      await PdfExportService.exportChordSheet(song);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };
  
  return (
    <>
      {/* DESKTOP VERSION */}
      <div className="hidden lg:flex h-screen bg-[#0f0f1a] text-white overflow-hidden">
        <Sidebar 
          userName={userName}
          userLevel={level}
          currentXP={xp}
          xpToNextLevel={xpToNextLevel}
          streak={currentStreak}
        />
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-8 space-y-8">
            {/* Back Button */}
            <Button
              onClick={() => setLocation('/songs')}
              variant="outline"
              className="bg-transparent border-white/20 text-gray-300 hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Músicas
            </Button>
            
            {/* Header Card */}
            <motion.div
              className="relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl bg-[#1a1a2e]/60 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${genreColors[song.genre]} opacity-10`}></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`px-4 py-1.5 rounded-lg bg-gradient-to-r ${genreColors[song.genre]} text-white text-sm font-semibold`}>
                        {song.genre}
                      </div>
                      <div className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-sm font-semibold">
                        {difficultyLabels[song.difficulty]}
                      </div>
                    </div>
                    
                    <h1 className="text-4xl font-bold text-white mb-2">{song.title}</h1>
                    <p className="text-xl text-gray-300">{song.artist}</p>
                  </div>
                  
                  <button
                    onClick={() => toggleFavorite(song.id)}
                    className="p-3 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <Heart
                      className={`w-7 h-7 ${favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                    />
                  </button>
                </div>
                
                <p className="text-gray-300 mb-6">{song.description}</p>
                
                {/* Info Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                    <Music className="w-5 h-5 text-[#06b6d4]" />
                    <div>
                      <p className="text-xs text-gray-400">Tom</p>
                      <p className="text-lg font-bold text-white">{song.key}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                    <Clock className="w-5 h-5 text-[#f97316]" />
                    <div>
                      <p className="text-xs text-gray-400">BPM</p>
                      <p className="text-lg font-bold text-white">{song.bpm}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                    <TrendingUp className="w-5 h-5 text-[#10b981]" />
                    <div>
                      <p className="text-xs text-gray-400">Acordes</p>
                      <p className="text-lg font-bold text-white">{song.chords.length}</p>
                    </div>
                  </div>
                </div>
                
                {/* Lock Status */}
                {!isUnlocked && (
                  <div className="mb-6 p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-lg font-bold text-yellow-400">Música Bloqueada</h3>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">Complete os requisitos para desbloquear:</p>
                    <ul className="space-y-2">
                      {unlockRequirements.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <span className={req.met ? 'text-green-400' : 'text-gray-400'}>
                            {req.met ? '✓' : '○'}
                          </span>
                          <span className={req.met ? 'text-gray-300 line-through' : 'text-gray-300'}>
                            {req.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Transposition & Capo Controls */}
                <div className="mb-6 p-4 rounded-xl bg-[#1a1a2e]/60 border border-white/10">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Ajustar Tom</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Transposition */}
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">Transposição</label>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setTransposition(Math.max(-12, transposition - 1))}
                          variant="outline"
                          size="sm"
                          className="bg-transparent border-white/20 text-white"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <span className="px-3 py-1 bg-white/10 rounded text-white font-mono text-sm min-w-[3rem] text-center">
                          {transposition > 0 ? `+${transposition}` : transposition}
                        </span>
                        <Button
                          onClick={() => setTransposition(Math.min(12, transposition + 1))}
                          variant="outline"
                          size="sm"
                          className="bg-transparent border-white/20 text-white"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Capo */}
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">Capotraste</label>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setCapo(Math.max(0, capo - 1))}
                          variant="outline"
                          size="sm"
                          className="bg-transparent border-white/20 text-white"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <span className="px-3 py-1 bg-white/10 rounded text-white font-mono text-sm min-w-[3rem] text-center">
                          {capo}
                        </span>
                        <Button
                          onClick={() => setCapo(Math.min(12, capo + 1))}
                          variant="outline"
                          size="sm"
                          className="bg-transparent border-white/20 text-white"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Simplify */}
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">Simplificar</label>
                      <Button
                        onClick={() => setSimplified(!simplified)}
                        variant={simplified ? 'default' : 'outline'}
                        size="sm"
                        className={simplified ? 'bg-purple-500 text-white' : 'bg-transparent border-white/20 text-white'}
                      >
                        {simplified ? 'Ativo' : 'Inativo'}
                      </Button>
                    </div>
                  </div>
                  
                  {(transposition !== 0 || capo !== 0) && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-400 mb-2">Acordes Transpostos:</p>
                      <div className="flex flex-wrap gap-2">
                        {getTransposedChords().map((chord, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-mono text-sm font-bold"
                          >
                            {chord}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Chords */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Acordes Usados</h3>
                  <div className="flex flex-wrap gap-2">
                    {song.chords.map((chord, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 rounded-lg bg-white/10 text-white font-mono font-bold"
                      >
                        {chord}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handlePractice}
                      disabled={!isUnlocked}
                      className={`bg-gradient-to-r ${genreColors[song.genre]} text-white font-semibold text-lg py-6 ${!isUnlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      {isUnlocked ? 'Modo Performance' : 'Bloqueada'}
                    </Button>
                    <Button
                      onClick={() => setShowKaraoke(true)}
                      className="bg-gradient-to-r from-[#ec4899] to-[#db2777] text-white font-semibold text-lg py-6"
                    >
                      <Maximize2 className="w-5 h-5 mr-2" />
                      Karaokê
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setShowSheetMusic(true)}
                      variant="outline"
                      className="bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50 font-semibold text-lg py-6"
                    >
                      📄 Modo Partitura
                    </Button>
                    <Button
                      onClick={() => setShowPerformanceMode(true)}
                      disabled={!isUnlocked}
                      className={`bg-gradient-to-r ${genreColors[song.genre]} text-white font-semibold text-lg py-6 ${!isUnlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      🎭 Performance
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => cifraClubService.openCifraClub(song.artist, song.title)}
                    variant="outline"
                    className="w-full bg-transparent border-white/20 text-white hover:bg-white/5 py-6 text-lg"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Ver Cifra Completa no Cifra Club
                  </Button>
                  <Button
                    onClick={handleExportPdf}
                    variant="outline"
                    className="w-full bg-[#1a1a2e]/60 border-white/20 text-white hover:bg-white/10 font-semibold text-lg py-6"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Exportar Cifra em PDF
                  </Button>
                </div>
              </div>
            </motion.div>
            
            {/* Song Skill Tree */}
            <div className="rounded-2xl p-6 bg-gradient-to-br from-[#8b5cf6]/20 to-[#a855f7]/10 border border-[#8b5cf6]/30">
              <SongSkillTreeComponent 
                skillTree={skillTree}
                onChallengeStart={(challengeId) => {
                  // TODO: Implementar navegação para desafio específico
                  setShowPracticeMode(true);
                }}
              />
            </div>
            
            {/* Practice Mode Toggle */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowPracticeMode(!showPracticeMode)}
                size="lg"
                className="flex-1 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] hover:from-[#c084fc] hover:to-[#a855f7] text-white font-bold"
              >
                <Play className="w-5 h-5 mr-2" />
                {showPracticeMode ? 'Ocultar Prática' : 'Modo de Prática'}
              </Button>
              <Button
                onClick={() => setShowMetronome(!showMetronome)}
                variant="outline"
                className="bg-transparent border-white/20 text-gray-300 hover:bg-white/5"
              >
                <Clock className="w-4 h-4 mr-2" />
                {showMetronome ? 'Ocultar Metrônomo' : 'Mostrar Metrônomo'}
              </Button>
            </div>
            
            {/* Practice Mode */}
            {showPracticeMode && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Prática Interativa</h2>
                <PracticeMode
                  chords={song.chords}
                  bpm={song.bpm}
                  onComplete={(accuracy) => {
                    console.log('Practice completed with accuracy:', accuracy);
                    markAsPracticed(song.id);
                  }}
                />
              </div>
            )}
            
            {/* Audio Recorder */}
            <div>
              <Button
                onClick={() => setShowRecorder(!showRecorder)}
                variant="outline"
                className="bg-transparent border-white/20 text-gray-300 hover:bg-white/5"
              >
                <Mic className="w-4 h-4 mr-2" />
                {showRecorder ? 'Ocultar Gravador' : 'Gravar Sessão'}
              </Button>
            </div>
            
            {showRecorder && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Gravação de Áudio</h2>
                <AudioRecorder
                  songId={song.id}
                  songName={song.title}
                />
              </div>
            )}
            
            {/* Metronome */}
            {showMetronome && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">Metrônomo</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      Preset: {getRecommendedPreset(song.bpm, song.genre).name}
                    </span>
                  </div>
                </div>
                <Metronome defaultBpm={song.bpm} />
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-400 mb-2">
                    💡 Dica: Esta música usa ritmo de {song.genre} com backbeat nos tempos 2 e 4
                  </p>
                  <p className="text-xs text-gray-500">
                    Mantenha o groove constante em {song.bpm} BPM
                  </p>
                </div>
              </div>
            )}
            
            {/* Chord Sheet */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Cifra Completa</h2>
              <ChordSheetWithPlayer 
                chordSheet={song.chordSheet} 
                bpm={song.bpm}
                title={song.title}
              />
            </div>
            
            {/* Tips */}
            <motion.div
              className="rounded-2xl p-6 bg-[#1a1a2e]/60 backdrop-blur-xl border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-6 h-6 text-[#fbbf24]" />
                <h2 className="text-2xl font-bold text-white">Dicas de Execução</h2>
              </div>
              
              <ul className="space-y-3">
                {song.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-gray-300 leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* MOBILE VERSION */}
      <div className="lg:hidden min-h-screen bg-[#0f0f1a] text-white">
        <MobileSidebar 
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          userName={userName}
          userLevel={level}
          currentXP={xp}
          xpToNextLevel={xpToNextLevel}
          streak={currentStreak}
        />
        
        <MobileHeader 
          userName={userName}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        
        <main className="px-5 py-5 space-y-6 pb-24">
          {/* Back Button */}
          <Button
            onClick={() => setLocation('/songs')}
            variant="outline"
            size="sm"
            className="bg-transparent border-white/20 text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-[#1a1a2e]/60 border border-white/10">
            <div className={`absolute inset-0 bg-gradient-to-br ${genreColors[song.genre]} opacity-10`}></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${genreColors[song.genre]} text-white text-xs font-semibold`}>
                      {song.genre}
                    </div>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-white mb-1">{song.title}</h1>
                  <p className="text-base text-gray-300">{song.artist}</p>
                </div>
                
                <button
                  onClick={() => toggleFavorite(song.id)}
                  className="p-2 rounded-full hover:bg-white/10"
                >
                  <Heart
                    className={`w-6 h-6 ${favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                  />
                </button>
              </div>
              
              <p className="text-sm text-gray-300 mb-4">{song.description}</p>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="px-3 py-2 rounded-lg bg-white/5 text-center">
                  <p className="text-xs text-gray-400">Tom</p>
                  <p className="text-base font-bold text-white">{song.key}</p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-white/5 text-center">
                  <p className="text-xs text-gray-400">BPM</p>
                  <p className="text-base font-bold text-white">{song.bpm}</p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-white/5 text-center">
                  <p className="text-xs text-gray-400">Acordes</p>
                  <p className="text-base font-bold text-white">{song.chords.length}</p>
                </div>
              </div>
              
              <Button
                onClick={handlePractice}
                className={`w-full bg-gradient-to-r ${genreColors[song.genre]} text-white font-semibold`}
              >
                <Play className="w-4 h-4 mr-2" />
                Praticar Agora
              </Button>
            </div>
          </div>
          
          {/* Chords */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Acordes</h3>
            <div className="flex flex-wrap gap-2">
              {song.chords.map((chord, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-mono text-sm font-bold"
                >
                  {chord}
                </span>
              ))}
            </div>
          </div>
          
          {/* Metronome Toggle */}
          <div>
            <Button
              onClick={() => setShowMetronome(!showMetronome)}
              size="sm"
              variant="outline"
              className="w-full bg-transparent border-white/20 text-gray-300"
            >
              <Clock className="w-4 h-4 mr-2" />
              {showMetronome ? 'Ocultar Metrônomo' : 'Mostrar Metrônomo'}
            </Button>
          </div>
          
          {/* Metronome */}
          {showMetronome && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Metrônomo</h3>
              <Metronome defaultBpm={song.bpm} />
            </div>
          )}
          
          {/* Chord Sheet */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Cifra</h3>
            <ChordSheetWithPlayer 
              chordSheet={song.chordSheet} 
              bpm={song.bpm}
              title={song.title}
            />
          </div>
          
          {/* Tips */}
          <div className="rounded-2xl p-5 bg-[#1a1a2e]/60 backdrop-blur-xl border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-[#fbbf24]" />
              <h3 className="text-lg font-bold text-white">Dicas</h3>
            </div>
            
            <ul className="space-y-2">
              {song.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-gray-300">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </main>
        
        <MobileBottomNav />
      </div>
      
      {/* Karaoke Mode */}
      {showKaraoke && (
        <KaraokeMode
          chordSheet={song.chordSheet}
          bpm={song.bpm}
          title={song.title}
          artist={song.artist}
          onClose={() => setShowKaraoke(false)}
        />
      )}
      
      {/* Performance Mode */}
      {showPerformanceMode && (
        <div className="fixed inset-0 z-50 bg-[#0f0f1a]">
          <PerformanceMode
            songTitle={song.title}
            artist={song.artist}
            chordSheet={song.chordSheet}
            bpm={song.bpm}
            onClose={() => setShowPerformanceMode(false)}
          />
        </div>
      )}
      
      {/* Sheet Music Mode */}
      {showSheetMusic && (
        <div className="fixed inset-0 z-50">
          <SheetMusicMode
            chordSheet={song.chordSheet}
            title={song.title}
            artist={song.artist}
            onClose={() => setShowSheetMusic(false)}
          />
        </div>
      )}
    </>
  );
}
