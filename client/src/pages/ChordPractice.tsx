import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealTimeChordPractice } from '@/components/practice/RealTimeChordPractice';
import { chordMasterySystem } from '@/services/ChordMasterySystem';
import { ArrowLeft, Music, Trophy, Target, Clock } from 'lucide-react';

export function ChordPractice() {
  const [location, setLocation] = useLocation();
  const [selectedChord, setSelectedChord] = useState<string>('');
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);

  // Get available chords
  const availableChords = chordMasterySystem.getAllChords();

  // Get practice recommendations
  const recommendedChords = chordMasterySystem.getChordsNeedingPractice();

  useEffect(() => {
    // Load practice history from localStorage
    const history = localStorage.getItem('chordPracticeHistory');
    if (history) {
      setPracticeHistory(JSON.parse(history));
    }
  }, []);

  const startPractice = (chordName: string) => {
    setSelectedChord(chordName);
    setIsPracticing(true);
  };

  const finishPractice = (success: boolean, performance: any) => {
    // Save to history
    const newHistory = [{
      chord: selectedChord,
      success,
      performance,
      timestamp: Date.now()
    }, ...practiceHistory.slice(0, 9)]; // Keep last 10

    setPracticeHistory(newHistory);
    localStorage.setItem('chordPracticeHistory', JSON.stringify(newHistory));

    setIsPracticing(false);
    setSelectedChord('');
  };

  const getChordStats = (chordName: string) => {
    const progress = chordMasterySystem.getChordProgress(chordName);
    return {
      level: progress?.currentLevel || 1,
      proficiency: Math.round((progress?.overallProficiency || 0) * 100),
      lastPracticed: progress?.lastPracticed,
      attempts: progress?.attempts || 0
    };
  };

  if (isPracticing && selectedChord) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] p-4">
        <div className="max-w-4xl mx-auto">
          <RealTimeChordPractice
            chordName={selectedChord}
            onComplete={finishPractice}
            onExit={() => setIsPracticing(false)}
            autoStart={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/practice')}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Prática de Acordes</h1>
              <p className="text-gray-400">Detecção em tempo real com feedback inteligente</p>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-6 h-6" />
              Prática Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Music className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="font-semibold text-white mb-1">Detecção em Tempo Real</h4>
                <p className="text-sm text-gray-400">Análise instantânea do que você toca</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="font-semibold text-white mb-1">Feedback Acionável</h4>
                <p className="text-sm text-gray-400">Sugestões específicas para correção</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-green-400" />
                </div>
                <h4 className="font-semibold text-white mb-1">Progressão Adaptativa</h4>
                <p className="text-sm text-gray-400">Dificuldade ajustada ao seu nível</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chord Selection */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Escolher Acorde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-white font-semibold mb-3">Recomendados para Você</h4>
                <div className="space-y-2">
                  {recommendedChords.slice(0, 5).map(chordName => {
                    const stats = getChordStats(chordName);
                    return (
                      <div
                        key={chordName}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                        onClick={() => startPractice(chordName)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-purple-400">{chordName}</span>
                          <Badge variant="outline" className="text-xs">
                            Nível {stats.level}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">{stats.proficiency}%</div>
                          <div className="text-xs text-gray-500">{stats.attempts} tentativas</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3">Todos os Acordes</h4>
                <Select onValueChange={startPractice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um acorde" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChords.map(chord => (
                      <SelectItem key={chord.name} value={chord.name}>
                        {chord.name} ({chord.quality}) - Dificuldade {chord.difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Practice History */}
        {practiceHistory.length > 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Histórico Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {practiceHistory.slice(0, 5).map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">{session.chord}</span>
                      <Badge
                        variant={session.success ? "default" : "secondary"}
                        className={session.success ? "bg-green-500" : "bg-gray-500"}
                      >
                        {session.success ? 'Sucesso' : 'Em Progresso'}
                      </Badge>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div>{Math.round(session.performance.bestAccuracy * 100)}% precisão</div>
                      <div>{Math.round(session.performance.totalTime / 1000)}s</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-6">
            <h3 className="text-blue-400 font-semibold mb-3">Como Funciona a Prática Inteligente</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-2">Antes de Começar:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Permita acesso ao microfone quando solicitado</li>
                  <li>• Posicione o violão a 20-30cm do microfone</li>
                  <li>• Certifique-se de que o ambiente não está muito barulhento</li>
                  <li>• Teste o volume e ajuste se necessário</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Durante a Prática:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Observe o feedback visual das cordas (verde/vermelho)</li>
                  <li>• Leia as mensagens de orientação específicas</li>
                  <li>• Ajuste a posição dos dedos conforme as sugestões</li>
                  <li>• Mantenha o acorde pressionado por alguns segundos</li>
                  <li>• Celebre quando conseguir o "Perfeito!"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}