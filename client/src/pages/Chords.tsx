import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ChordDiagram } from '@/components/chords/ChordDiagram';
import { Button } from '@/components/ui/button';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useChordStore } from '@/stores/useChordStore';
import { chords, getChordsByDifficulty } from '@/data/chords';
import { Play, Check, Lock, Volume2, StopCircle } from 'lucide-react';
import { audioService } from '@/services/AudioService';

export default function Chords() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedChord, setSelectedChord] = useState(chords[0]);
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();
  const { progress, setCurrentChord } = useChordStore();
  
  const userName = "João";
  
  const filteredChords = filter === 'all' ? chords : getChordsByDifficulty(filter);
  
  const handleChordClick = (chord: typeof chords[0]) => {
    setSelectedChord(chord);
    setCurrentChord(chord.id);
  };
  
  const handlePlayChord = async () => {
    setIsPlaying(true);
    await audioService.playChord(selectedChord.name, 2.5);
    setTimeout(() => setIsPlaying(false), 2500);
  };
  
  const handleStopChord = () => {
    audioService.stopAll();
    setIsPlaying(false);
  };
  
  const handlePractice = () => {
    // Navigate to practice mode with selected chord
    window.location.href = `/practice?chord=${selectedChord.id}`;
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                <Button className="flex-1 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white font-semibold">
                  Praticar
                </Button>
              </div>
            </div>
          </div>
          
          {/* Chord Grid */}
          <div className="grid grid-cols-3 gap-3">
            {filteredChords.map((chord) => {
              const isCompleted = progress[chord.id]?.practiced;
              const isSelected = selectedChord.id === chord.id;
              
              return (
                <button
                  key={chord.id}
                  onClick={() => handleChordClick(chord)}
                  className={`
                    p-4 rounded-xl transition-all
                    ${isSelected
                      ? 'bg-gradient-to-r from-[#a855f7] to-[#8b5cf6]'
                      : 'bg-[#1a1a2e]'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">{chord.name}</div>
                    {isCompleted && (
                      <Check className="w-4 h-4 text-green-400 mx-auto" />
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
