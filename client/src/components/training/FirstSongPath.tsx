import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, CheckCircle2, Lock, Calendar, Music, Guitar, Clock, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useChordStore } from '@/stores/useChordStore';
import { useSongStore } from '@/stores/useSongStore';
import { songs } from '@/data/songs';

interface DayTask {
  id: string;
  day: number;
  title: string;
  description: string;
  tasks: Array<{
    id: string;
    type: 'chord' | 'metronome' | 'transition' | 'song';
    title: string;
    duration: number; // minutos
    target?: string; // ex: "Em/Am" para transições
  }>;
  unlocked: boolean;
  completed: boolean;
  rewardSong?: string; // ID da música que será desbloqueada ao completar
}

const firstSongPath: DayTask[] = [
  {
    id: 'day-1',
    day: 1,
    title: 'Postura e Primeiros Acordes',
    description: 'Aprenda a postura correta e seus primeiros dois acordes',
    tasks: [
      { id: 'posture', type: 'chord', title: 'Aprender postura correta', duration: 5 },
      { id: 'em-chord', type: 'chord', title: 'Praticar acorde Em', duration: 5 },
      { id: 'am-chord', type: 'chord', title: 'Praticar acorde Am', duration: 5 },
      { id: 'metronome', type: 'metronome', title: '2 minutos com metrônomo (60 BPM)', duration: 2 },
    ],
    unlocked: true,
    completed: false,
  },
  {
    id: 'day-2',
    day: 2,
    title: 'Primeira Troca de Acordes',
    description: 'Aprenda a trocar entre Em e Am suavemente',
    tasks: [
      { id: 'review-chords', type: 'chord', title: 'Revisar Em e Am', duration: 3 },
      { id: 'transition', type: 'transition', title: 'Trocar Em → Am (lento)', duration: 5, target: 'Em/Am' },
      { id: 'transition-reverse', type: 'transition', title: 'Trocar Am → Em (lento)', duration: 5, target: 'Am/Em' },
      { id: 'metronome', type: 'metronome', title: '3 minutos com metrônomo (60 BPM)', duration: 3 },
    ],
    unlocked: false,
    completed: false,
  },
  {
    id: 'day-3',
    day: 3,
    title: 'Novo Acorde: C',
    description: 'Adicione o acorde C ao seu repertório',
    tasks: [
      { id: 'c-chord', type: 'chord', title: 'Praticar acorde C', duration: 5 },
      { id: 'transition-em-c', type: 'transition', title: 'Trocar Em → C', duration: 5, target: 'Em/C' },
      { id: 'transition-am-c', type: 'transition', title: 'Trocar Am → C', duration: 5, target: 'Am/C' },
      { id: 'metronome', type: 'metronome', title: '3 minutos com metrônomo (70 BPM)', duration: 3 },
    ],
    unlocked: false,
    completed: false,
  },
  {
    id: 'day-4',
    day: 4,
    title: 'Ritmo Básico',
    description: 'Aprenda sua primeira batida simples',
    tasks: [
      { id: 'review-chords', type: 'chord', title: 'Revisar Em, Am, C', duration: 5 },
      { id: 'rhythm', type: 'metronome', title: 'Batida simples: baixo-cima (60 BPM)', duration: 10 },
      { id: 'transition-all', type: 'transition', title: 'Trocar entre todos os acordes', duration: 5 },
    ],
    unlocked: false,
    completed: false,
  },
  {
    id: 'day-5',
    day: 5,
    title: 'Novo Acorde: G',
    description: 'Adicione o acorde G e pratique progressões',
    tasks: [
      { id: 'g-chord', type: 'chord', title: 'Praticar acorde G', duration: 5 },
      { id: 'progression', type: 'transition', title: 'Progressão: Em-C-G-Am', duration: 10 },
      { id: 'metronome', type: 'metronome', title: '5 minutos com metrônomo (80 BPM)', duration: 5 },
    ],
    unlocked: false,
    completed: false,
  },
  {
    id: 'day-6',
    day: 6,
    title: 'Preparação para a Música',
    description: 'Pratique a progressão da sua primeira música',
    tasks: [
      { id: 'review-all', type: 'chord', title: 'Revisar todos os acordes', duration: 5 },
      { id: 'song-progression', type: 'transition', title: 'Progressão da música (lento)', duration: 10 },
      { id: 'rhythm-song', type: 'metronome', title: 'Batida da música (70 BPM)', duration: 10 },
    ],
    unlocked: false,
    completed: false,
    rewardSong: 'trem-das-onze', // Música simples para iniciantes
  },
  {
    id: 'day-7',
    day: 7,
    title: 'Sua Primeira Música!',
    description: 'Toque sua primeira música completa',
    tasks: [
      { id: 'warmup', type: 'chord', title: 'Aquecimento: todos os acordes', duration: 5 },
      { id: 'song-practice', type: 'song', title: 'Praticar música completa (lento)', duration: 10 },
      { id: 'song-performance', type: 'song', title: 'Tocar música completa (velocidade normal)', duration: 5 },
    ],
    unlocked: false,
    completed: false,
    rewardSong: 'trem-das-onze',
  },
];

export function FirstSongPath() {
  const [, setLocation] = useLocation();
  const { level } = useGamificationStore();
  const { progress: chordProgress } = useChordStore();
  const { progress: songProgress } = useSongStore();
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [currentDay, setCurrentDay] = useState(1);
  
  // Verificar quais dias estão completos
  useEffect(() => {
    const completed = new Set<string>();
    
    firstSongPath.forEach((dayTask) => {
      let allTasksCompleted = true;
      
      dayTask.tasks.forEach((task) => {
        if (task.type === 'chord') {
          // Verificar se acorde foi praticado
          const chordId = task.title.toLowerCase().includes('em') ? 'em' :
                         task.title.toLowerCase().includes('am') ? 'am' :
                         task.title.toLowerCase().includes('c') ? 'c' :
                         task.title.toLowerCase().includes('g') ? 'g' : null;
          
          if (chordId && !chordProgress[chordId]?.practiced) {
            allTasksCompleted = false;
          }
        } else if (task.type === 'song' && dayTask.rewardSong) {
          // Verificar se música foi praticada
          if (!songProgress[dayTask.rewardSong]?.practiced) {
            allTasksCompleted = false;
          }
        }
      });
      
      if (allTasksCompleted) {
        completed.add(dayTask.id);
      }
    });
    
    setCompletedDays(completed);
    
    // Determinar dia atual (primeiro não completo)
    const firstIncomplete = firstSongPath.findIndex(day => !completed.has(day.id));
    setCurrentDay(firstIncomplete >= 0 ? firstIncomplete + 1 : 7);
  }, [chordProgress, songProgress]);
  
  // Verificar quais dias estão desbloqueados
  const isDayUnlocked = (dayIndex: number): boolean => {
    if (dayIndex === 0) return true;
    return completedDays.has(firstSongPath[dayIndex - 1].id);
  };
  
  const handleTaskClick = (task: DayTask['tasks'][0], dayTask: DayTask) => {
    if (task.type === 'chord') {
      setLocation('/chords');
    } else if (task.type === 'metronome' || task.type === 'transition') {
      setLocation('/practice');
    } else if (task.type === 'song' && dayTask.rewardSong) {
      setLocation(`/songs/${dayTask.rewardSong}`);
    }
  };
  
  const overallProgress = (completedDays.size / firstSongPath.length) * 100;
  const targetSong = songs.find(s => s.id === 'trem-das-onze');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl bg-gradient-to-br from-[#8b5cf6]/30 via-[#a855f7]/20 to-transparent border border-[#8b5cf6]/40 shadow-[0_0_35px_rgba(139,92,246,0.3)]">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#8b5cf6] opacity-10 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] flex items-center justify-center text-2xl">
              🎸
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Primeira Música em 7 Dias</h2>
              <p className="text-sm text-gray-300">Sua jornada do zero à primeira música</p>
            </div>
          </div>
          
          {targetSong && (
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Music className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-white">Música Alvo:</span>
              </div>
              <p className="text-lg font-bold text-white">{targetSong.title}</p>
              <p className="text-sm text-gray-400">{targetSong.artist}</p>
            </div>
          )}
          
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Progresso Geral</span>
              <span className="font-bold text-white">{completedDays.size} / {firstSongPath.length} dias</span>
            </div>
            <Progress value={overallProgress} className="h-3 bg-white/10" />
          </div>
        </div>
      </div>
      
      {/* Days */}
      <div className="space-y-4">
        {firstSongPath.map((dayTask, index) => {
          const unlocked = isDayUnlocked(index);
          const completed = completedDays.has(dayTask.id);
          const isCurrentDay = index + 1 === currentDay;
          
          return (
            <motion.div
              key={dayTask.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 bg-white/5 border ${
                isCurrentDay && !completed
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : completed
                  ? 'border-green-500/30 bg-green-500/5'
                  : !unlocked
                  ? 'border-white/10 opacity-50'
                  : 'border-white/10'
              }`}>
                {/* Day Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    completed
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : isCurrentDay && unlocked
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : !unlocked
                      ? 'bg-gray-600/20 text-gray-500 border border-gray-600/30'
                      : 'bg-white/10 text-gray-300 border border-white/20'
                  }`}>
                    {completed ? <CheckCircle2 className="w-6 h-6" /> : dayTask.day}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">{dayTask.title}</h3>
                      {isCurrentDay && !completed && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold">
                          Dia Atual
                        </span>
                      )}
                      {completed && (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                          Concluído
                        </span>
                      )}
                      {!unlocked && (
                        <Lock className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{dayTask.description}</p>
                  </div>
                </div>
                
                {/* Tasks */}
                {unlocked && (
                  <div className="space-y-2">
                    {dayTask.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task, dayTask)}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold">
                            {task.type === 'chord' ? '🎸' : task.type === 'metronome' ? '🥁' : task.type === 'transition' ? '🔄' : '🎵'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{task.title}</p>
                            {task.target && (
                              <p className="text-xs text-gray-400">{task.target}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-400">{task.duration} min</span>
                          <Play className="w-4 h-4 text-purple-400" />
                        </div>
                      </div>
                    ))}
                    
                    {/* Reward Song */}
                    {dayTask.rewardSong && (
                      <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-purple-400" />
                          <span className="font-semibold text-white">Recompensa:</span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">
                          Ao completar este dia, você desbloqueará uma nova música!
                        </p>
                        <Button
                          onClick={() => setLocation(`/songs/${dayTask.rewardSong}`)}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm"
                          disabled={!completed}
                        >
                          {completed ? 'Ver Música' : 'Complete o dia primeiro'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {!unlocked && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Complete o dia anterior para desbloquear
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
