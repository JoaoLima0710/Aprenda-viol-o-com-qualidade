import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ChordDiagram, ChordTheory } from '@/components/chords';
import { Button } from '@/components/ui/button';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useChordStore } from '@/stores/useChordStore';
import { useUserStore } from '@/stores/useUserStore';
import { useChordProgressionStore } from '@/stores/useChordProgressionStore';
import { useAdaptiveDifficultyStore } from '@/stores/useAdaptiveDifficultyStore';
import { chords, getChordsByDifficulty } from '@/data/chords';
import { Play, Check, StopCircle, Lock, Calendar, TrendingUp } from 'lucide-react';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { useAudioSettingsStore } from '@/stores/useAudioSettingsStore';
import type { InstrumentType } from '@/services/AudioServiceWithSamples';
import { RealtimeAudioFeedback } from '@/components/audio/RealtimeAudioFeedback';
import { ChordPracticeTimer } from '@/components/practice';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Chords() {
  const [, setLocation] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedChord, setSelectedChord] = useState(chords[0]);
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [activeTab, setActiveTab] = useState<'practice' | 'theory'>('theory');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { instrument, setInstrument: setGlobalInstrument } = useAudioSettingsStore();
  
  const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();
  const { progress, setCurrentChord, markAsPracticed, getChordProgress } = useChordStore();
  const { user } = useUserStore();
  const {
    currentWeek,
    isChordUnlocked,
    completeChord,
    getWeekProgress,
    isWeekUnlocked,
    getUnlockedChordsForWeek,
  } = useChordProgressionStore();
  const { recordAttempt } = useAdaptiveDifficultyStore();
  
  const userName = user?.name || "Usuário";
  
  // Filtrar acordes por dificuldade E desbloqueio semanal (para iniciantes)
  let filteredChords = filter === 'all' ? chords : getChordsByDifficulty(filter);
  
  // Se é iniciante, mostrar apenas acordes desbloqueados da semana atual
  const isBeginner = filter === 'beginner' || filter === 'all';
  if (isBeginner) {
    filteredChords = filteredChords.filter(chord => {
      // Acordes intermediários/avançados sempre desbloqueados
      if (chord.difficulty !== 'beginner') return true;
      // Acordes básicos: verificar desbloqueio semanal
      return isChordUnlocked(chord.id);
    });
  }
  
  // Obter progresso da semana atual
  const weekProgress = getWeekProgress(currentWeek);
  
  const handleChordClick = (chord: typeof chords[0]) => {
    setSelectedChord(chord);
    setCurrentChord(chord.id);
  };
  
  const handlePlayChord = async () => {
    try {
      setIsPlaying(true);
      
      // CRÍTICO para tablets: Inicializar áudio primeiro
      // A inicialização precisa acontecer em resposta a um gesto do usuário
      await unifiedAudioService.initialize();
      
      // Pequeno delay para garantir que o AudioContext está pronto
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('🎸 Tocando acorde:', selectedChord.name);
      await unifiedAudioService.playChord(selectedChord.name, 2.5);
      
      setTimeout(() => setIsPlaying(false), 2500);
    } catch (error) {
      console.error('Erro ao tocar acorde:', error);
      setIsPlaying(false);
    }
  };
  
  // Initialize audio service with saved instrument on mount
  useEffect(() => {
    unifiedAudioService.setInstrument(instrument);
  }, [instrument]);
  
  const handleInstrumentChange = (newInstrument: InstrumentType) => {
    setGlobalInstrument(newInstrument);
    unifiedAudioService.setInstrument(newInstrument);
  };
  
  const handleStopChord = () => {
    unifiedAudioService.stopAll();
    setIsPlaying(false);
  };
  
  const handlePractice = () => {
    setLocation(`/practice?chord=${selectedChord.id}`);
  };
  
  const handleChordComplete = (chordId: string, accuracy: number) => {
    // Marcar como praticado no store de acordes
    markAsPracticed(chordId, accuracy);
    // Completar no sistema de progressão semanal
    completeChord(chordId, accuracy);
    // Registrar para dificuldade adaptativa
    const chord = chords.find(c => c.id === chordId);
    const difficulty = chord?.difficulty === 'advanced' ? 5 : chord?.difficulty === 'intermediate' ? 3 : 2;
    recordAttempt(chordId, 'chord', difficulty as any, accuracy);
    
    // Verificar se acorde foi dominado e adicionar à revisão espaçada
    const chordProgress = getChordProgress(chordId);
    if (chordProgress && chordProgress.accuracy >= 85 && chordProgress.attempts >= 5) {
      import('@/stores/useSpacedRepetitionStore').then(({ useSpacedRepetitionStore }) => {
        const spacedStore = useSpacedRepetitionStore.getState();
        if (!spacedStore.isInQueue(chordId, 'chord')) {
          spacedStore.addItem(chordId, 'chord', chord?.name || chordId);
        }
      });
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
          <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Header */}
            <header>
              <h1 className="text-4xl font-bold text-white mb-2">Biblioteca de Acordes</h1>
              <p className="text-gray-400">Aprenda e pratique acordes de violão</p>
            </header>
            
            {/* Instrument Selector */}
            <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#1a1a2e]/80 to-[#2a2a3e]/60 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center text-2xl animate-pulse">
                  {[
                    { value: 'nylon-guitar', icon: '🎸' },
                    { value: 'steel-guitar', icon: '🎼' },
                    { value: 'piano', icon: '🎹' },
                  ].find(i => i.value === instrument)?.icon}
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Instrumento Ativo</span>
                  <p className="text-base font-bold text-white">
                    {[
                      { value: 'nylon-guitar', label: 'Violão Nylon' },
                      { value: 'steel-guitar', label: 'Violão Aço' },
                      { value: 'piano', label: 'Piano' },
                    ].find(i => i.value === instrument)?.label}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {[
                  { value: 'nylon-guitar', label: 'Nylon', icon: '🎸', desc: 'Suave e quente' },
                  { value: 'steel-guitar', label: 'Aço', icon: '🎼', desc: 'Brilhante' },
                  { value: 'piano', label: 'Piano', icon: '🎹', desc: 'Percussivo' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => handleInstrumentChange(item.value as InstrumentType)}
                    className={
                      instrument === item.value
                        ? 'relative px-4 py-3 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white font-semibold shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all scale-105'
                        : 'px-4 py-3 rounded-xl bg-[#2a2a3e]/60 border border-white/10 text-gray-300 hover:bg-[#323246] hover:border-white/20 transition-all'
                    }
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-xs font-semibold">{item.label}</span>
                      {instrument === item.value && (
                        <span className="text-[10px] text-cyan-200">{item.desc}</span>
                      )}
                    </div>
                    {instrument === item.value && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-3 mb-6">
              <Button
                onClick={() => setActiveTab('theory')}
                variant={activeTab === 'theory' ? 'default' : 'outline'}
                className={
                  activeTab === 'theory'
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white'
                    : 'bg-transparent border-white/20 text-gray-300 hover:bg-white/5'
                }
              >
                📚 Teoria
              </Button>
              <Button
                onClick={() => setActiveTab('practice')}
                variant={activeTab === 'practice' ? 'default' : 'outline'}
                className={
                  activeTab === 'practice'
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white'
                    : 'bg-transparent border-white/20 text-gray-300 hover:bg-white/5'
                }
              >
                🎸 Prática
              </Button>
            </div>
            
            {activeTab === 'theory' ? (
              <ChordTheory />
            ) : (
              <>
            {/* Filters */}
            <div className="flex gap-3">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'beginner', label: 'Iniciante' },
                { value: 'intermediate', label: 'Intermediário' },
                { value: 'advanced', label: 'Avançado' },
              ].map((item) => (
                <Button
                  key={item.value}
                  onClick={() => setFilter(item.value as any)}
                  variant={filter === item.value ? 'default' : 'outline'}
                  className={
                    filter === item.value
                      ? 'bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white'
                      : 'bg-transparent border-white/20 text-gray-300 hover:bg-white/5'
                  }
                >
                  {item.label}
                </Button>
              ))}
            </div>
            
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chord List */}
              <div className="lg:col-span-1 space-y-3">
                <h2 className="text-xl font-bold text-white mb-4">Acordes ({filteredChords.length})</h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {filteredChords.map((chord) => {
                    const isCompleted = progress[chord.id]?.practiced;
                    const isSelected = selectedChord.id === chord.id;
                    
                    return (
                      <button
                        key={chord.id}
                        onClick={() => handleChordClick(chord)}
                        className={`
                          w-full p-4 rounded-xl text-left transition-all
                          ${isSelected
                            ? 'bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                            : 'bg-[#1a1a2e] hover:bg-[#232338]'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-white">{chord.name}</h3>
                            <p className="text-sm text-gray-400">{chord.fullName}</p>
                          </div>
                          {isCompleted && (
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Chord Detail */}
              <div className="lg:col-span-2">
                <div className="rounded-3xl p-8 backdrop-blur-xl bg-[#1a1a2e]/60 border border-white/10">
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Diagram */}
                    <div className="flex-shrink-0 flex justify-center">
                      <ChordDiagram
                        frets={selectedChord.frets}
                        fingers={selectedChord.fingers}
                        name={selectedChord.name}
                        size="lg"
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 space-y-6">
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{selectedChord.fullName}</h2>
                        <p className="text-gray-300">{selectedChord.description}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Dicas</h3>
                        <ul className="space-y-2">
                          {selectedChord.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-300">
                              <span className="text-[#06b6d4] mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Acordes Relacionados</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedChord.relatedChords.map((relatedId) => (
                            <button
                              key={relatedId}
                              onClick={() => {
                                const related = chords.find(c => c.id === relatedId);
                                if (related) handleChordClick(related);
                              }}
                              className="px-4 py-2 rounded-lg bg-[#2a2a3e] hover:bg-[#323246] text-white transition-colors"
                            >
                              {relatedId}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        {!isPlaying ? (
                          <Button 
                            onClick={handlePlayChord}
                            className="flex-1 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#22d3ee] hover:to-[#06b6d4] text-white font-semibold"
                          >
                            <Play className="w-5 h-5 mr-2" />
                            Ouvir Acorde
                          </Button>
                        ) : (
                          <Button 
                            onClick={handleStopChord}
                            className="flex-1 bg-gradient-to-r from-[#ef4444] to-[#dc2626] hover:from-[#f87171] hover:to-[#ef4444] text-white font-semibold"
                          >
                            <StopCircle className="w-5 h-5 mr-2" />
                            Parar
                          </Button>
                        )}
                        <Button 
                          onClick={handlePractice}
                          className="flex-1 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] hover:from-[#c084fc] hover:to-[#a855f7] text-white font-semibold"
                        >
                          Praticar
                        </Button>
                      </div>
                      
                      {/* Timer de Prática (se estiver na aba de prática) */}
                      {activeTab === 'practice' && (
                        <div className="mt-6">
                          <ChordPracticeTimer
                            suggestedDuration={selectedChord.difficulty === 'beginner' ? 5 : selectedChord.difficulty === 'intermediate' ? 10 : 15}
                            chordName={selectedChord.name}
                            onComplete={() => {
                              // Marcar acorde como praticado
                              handleChordComplete(selectedChord.id, 85); // 85% de precisão estimada
                            }}
                            onSkip={() => {
                              console.log('Prática pulada - não conta para XP');
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Feedback de Áudio em Tempo Real */}
                      <div className="mt-6">
                        <RealtimeAudioFeedback
                          practiceType="chord"
                          target={selectedChord.name}
                          difficulty={selectedChord.difficulty === 'beginner' ? 'beginner' : selectedChord.difficulty === 'intermediate' ? 'intermediate' : 'advanced'}
                          showControls={true}
                          showDetailedFeedback={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              </>
            )}
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
          <Breadcrumbs />
          <header>
            <h1 className="text-2xl font-bold text-white mb-1">Acordes</h1>
            <p className="text-sm text-gray-400">Biblioteca completa</p>
          </header>
          
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'beginner', label: 'Iniciante' },
              { value: 'intermediate', label: 'Intermediário' },
              { value: 'advanced', label: 'Avançado' },
            ].map((item) => (
              <Button
                key={item.value}
                onClick={() => setFilter(item.value as any)}
                size="sm"
                variant={filter === item.value ? 'default' : 'outline'}
                className={
                  filter === item.value
                    ? 'bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white whitespace-nowrap'
                    : 'bg-transparent border-white/20 text-gray-300 whitespace-nowrap'
                }
              >
                {item.label}
              </Button>
            ))}
          </div>
          
          {/* Selected Chord */}
          <div className="rounded-3xl p-6 backdrop-blur-xl bg-[#1a1a2e]/60 border border-white/10">
            <div className="flex justify-center mb-6">
              <ChordDiagram
                frets={selectedChord.frets}
                fingers={selectedChord.fingers}
                name={selectedChord.name}
                size="md"
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedChord.fullName}</h2>
                <p className="text-sm text-gray-300">{selectedChord.description}</p>
              </div>
              
              <div className="flex gap-2">
                {!isPlaying ? (
                  <Button 
                    onClick={handlePlayChord}
                    className="flex-1 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white font-semibold"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Ouvir
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStopChord}
                    className="flex-1 bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white font-semibold"
                  >
                    <StopCircle className="w-4 h-4 mr-2" />
                    Parar
                  </Button>
                )}
                <Button 
                  onClick={handlePractice}
                  className="flex-1 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white font-semibold"
                >
                  Praticar
                </Button>
              </div>
            </div>
          </div>
          
          {/* Chord Grid - 2 colunas para melhor legibilidade mobile */}
          {/* Indicador de Progressão Semanal (apenas para iniciantes) */}
          {isBeginner && currentWeek <= 3 && (
            <Card className="p-4 mb-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white">
                    Semana {currentWeek} de 3
                  </h3>
                </div>
                <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                  {weekProgress.completed}/{weekProgress.total} acordes
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Progresso da Semana</span>
                  <span className="text-blue-400 font-semibold">
                    {Math.round((weekProgress.completed / weekProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                    style={{ width: `${(weekProgress.completed / weekProgress.total) * 100}%` }}
                  />
                </div>
                {weekProgress.averageAccuracy > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Precisão média: {Math.round(weekProgress.averageAccuracy)}%</span>
                    {weekProgress.averageAccuracy >= 80 && (
                      <span className="text-green-400">✓ Pronto para próxima semana!</span>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredChords.map((chord) => {
              const isCompleted = progress[chord.id]?.practiced;
              const isSelected = selectedChord.id === chord.id;
              const isUnlocked = isChordUnlocked(chord.id);
              const isLocked = chord.difficulty === 'beginner' && !isUnlocked;
              
              return (
                <button
                  key={chord.id}
                  onClick={() => isLocked ? null : handleChordClick(chord)}
                  disabled={isLocked}
                  className={`
                    p-3 rounded-xl transition-all relative
                    ${isLocked
                      ? 'bg-gray-800/50 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] ring-2 ring-purple-400'
                      : 'bg-[#1a1a2e] hover:bg-[#232338]'
                    }
                  `}
                >
                  {isLocked && (
                    <div className="absolute top-1 right-1">
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{chord.name}</div>
                    <div className="text-xs text-gray-400 truncate">{chord.fullName}</div>
                    {isCompleted && !isLocked && (
                      <Check className="w-4 h-4 text-green-400 mx-auto mt-1" />
                    )}
                    {isLocked && (
                      <div className="text-xs text-gray-500 mt-1">Bloqueado</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </main>
        
        <MobileBottomNav />
      </div>
    </>
  );
}
