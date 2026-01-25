import { useState, useEffect } from 'react';
import { useAudio } from '@/hooks/useAudio';
import { useChordPlayer } from '@/hooks/useChordPlayer';
import { AudioPlayChordButton } from '@/components/audio/AudioPlayChordButton';
import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useUserStore } from '@/stores/useUserStore';
import { Book, Music, Activity, Target, Waves, TrendingUp, Play, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import {
  TheoryQuiz,
  CircleOfFifths,
  ProgressionBuilder,
  IntervalBuilder,
  ChordBuilder,
  ScaleBuilder,
} from '@/components/theory';
import { FullFretboardView } from '@/components/scales/FullFretboardView';
import { ContextualNavigation } from '@/components/navigation/ContextualNavigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { useTheoryProgressionStore } from '@/stores/useTheoryProgressionStore';
import { usePracticeUnlockStore } from '@/stores/usePracticeUnlockStore';
import { Lock, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface TheoryModule {
  id: string;
  title: string;
  icon: any;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  level: 'basic' | 'intermediate' | 'advanced'; // Nível teórico
  prerequisites: string[]; // IDs de módulos pré-requisitos
  minAccuracy?: number; // Precisão mínima para desbloquear (padrão 70%)
  topics: string[];
  content: React.ReactNode | ((currentLevel: 'basic' | 'intermediate' | 'advanced') => React.ReactNode);
  practicalApplication?: React.ReactNode | ((currentLevel: 'basic' | 'intermediate' | 'advanced') => React.ReactNode); // Seção "Na Prática"
  quiz?: QuizQuestion[];
}

// Helper para verificar se é nível intermediário ou avançado
const isIntermediateOrAdvanced = (level: 'basic' | 'intermediate' | 'advanced') => {
  return level === 'intermediate' || level === 'advanced';
};

// Componente simples de exercício de fixação
function SimpleFixationExercise({ 
  question, 
  options, 
  correctAnswer, 
  explanation 
}: { 
  question: string; 
  options: string[]; 
  correctAnswer: number; 
  explanation: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelected(index);
    setShowResult(true);
  };

  const reset = () => {
    setSelected(null);
    setShowResult(false);
  };

  const isCorrect = selected === correctAnswer;

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <p className="text-sm font-semibold text-white mb-3">{question}</p>
      <div className="space-y-2 mb-3">
        {options.map((option, index) => {
          let bgColor = 'bg-white/5 hover:bg-white/10';
          let borderColor = 'border-white/10';
          
          if (showResult && selected === index) {
            bgColor = isCorrect ? 'bg-green-500/20' : 'bg-red-500/20';
            borderColor = isCorrect ? 'border-green-500/50' : 'border-red-500/50';
          }
          
          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={`w-full text-left p-3 rounded border ${bgColor} ${borderColor} transition-colors ${
                showResult ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 w-6">{String.fromCharCode(65 + index)}.</span>
                <span className="text-sm text-gray-300">{option}</span>
                {showResult && selected === index && (
                  isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 ml-auto" />
                  )
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {showResult && (
        <div className={`p-3 rounded mb-3 ${
          isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <p className={`text-sm font-semibold mb-1 ${
            isCorrect ? 'text-green-400' : 'text-red-400'
          }`}>
            {isCorrect ? '✅ Correto!' : '❌ Revise isso:'}
          </p>
          <p className="text-xs text-gray-300">{explanation}</p>
        </div>
      )}
      
      {showResult && (
        <button
          onClick={reset}
          className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}

const THEORY_MODULES: TheoryModule[] = [
  // 1. FUNDAMENTOS - Base de tudo
  {
    id: 'fundamentals',
    title: 'Fundamentos da Música',
    icon: Book,
    description: 'Entenda os 3 elementos essenciais: Ritmo, Melodia e Harmonia',
    duration: '10 min',
    difficulty: 'beginner',
    level: 'basic',
    prerequisites: [],
    topics: ['Ritmo', 'Melodia', 'Harmonia', 'Função dos elementos'],
    content: (
      <div className="space-y-6">
        {/* INDICADOR: Esta teoria destrava treinos */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border-l-4 border-emerald-500 mb-6">
          <div className="flex items-start gap-3">
            <Play className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-200 font-semibold mb-1">Esta teoria destrava treinos práticos:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/practice">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Treino de Ritmo
                  </span>
                </Link>
                <Link href="/songs">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Tocar Músicas
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* MICRO LIÇÃO 1: Introdução Visual */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] flex items-center justify-center">
              <span className="text-2xl font-bold text-white">1</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Os 3 Elementos da Música</h3>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-6">
            <p className="text-gray-300 text-sm leading-relaxed">
              Toda música tem <strong className="text-white">três partes</strong> que trabalham juntas.
            </p>
            <p className="text-gray-300 text-sm mt-2">
              Entender isso serve para você conseguir tocar qualquer música no violão!
            </p>
          </div>

          {/* PERGUNTA REFLEXIVA */}
          <div className="p-4 rounded-lg bg-yellow-500/10 border-l-4 border-yellow-500 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤔</span>
              <div>
                <p className="text-yellow-200 font-semibold mb-2">Pense antes de continuar:</p>
                <p className="text-gray-300 text-sm">
                  Escolha uma música que você conhece. Consegue identificar 3 coisas diferentes nela? 
                  (Não precisa saber os nomes ainda - apenas observe!)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* MICRO LIÇÃO 2: Ritmo */}
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#06b6d4]/20 to-transparent border-l-4 border-[#06b6d4]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#06b6d4]/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#06b6d4]" />
                </div>
                <h4 className="text-xl font-bold text-white">1. Ritmo</h4>
              </div>
              
              <div className="space-y-3">
                <p className="text-gray-300">
                  O <span className="text-[#06b6d4] font-semibold">ritmo</span> é quando você bate o pé ou balança a cabeça na música.
                </p>
                <p className="text-gray-300">
                  É o <strong className="text-white">"quando"</strong> tocar - a batida que organiza tudo.
                </p>
                
                <div className="p-3 rounded bg-[#06b6d4]/10 border border-[#06b6d4]/30">
                  <p className="text-sm text-gray-300 mb-2">
                    <strong className="text-[#06b6d4]">Isso serve para você conseguir:</strong>
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>Tocar no tempo certo</li>
                    <li>Sem adiantar ou atrasar</li>
                    <li>É o primeiro erro que as pessoas percebem!</li>
                  </ul>
                </div>
                
                <div className="p-3 rounded bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-[#06b6d4]">💡 Exemplo:</span> Bateria, palmas, o "tum-tum-tum" que você sente na música.
                  </p>
                </div>
              </div>
            </div>

            {/* MICRO LIÇÃO 3: Melodia */}
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#8b5cf6]/20 to-transparent border-l-4 border-[#8b5cf6]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/30 flex items-center justify-center">
                  <Music className="w-5 h-5 text-[#8b5cf6]" />
                </div>
                <h4 className="text-xl font-bold text-white">2. Melodia</h4>
              </div>
              
              <div className="space-y-3">
                <p className="text-gray-300">
                  A <span className="text-[#8b5cf6] font-semibold">melodia</span> é o que você canta ou assobia.
                </p>
                <p className="text-gray-300">
                  É a <strong className="text-white">"música"</strong> que fica na cabeça - notas tocadas uma depois da outra.
                </p>
                
                <div className="p-3 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/30">
                  <p className="text-sm text-gray-300 mb-2">
                    <strong className="text-[#8b5cf6]">Isso serve para você conseguir:</strong>
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>Tocar solos</li>
                    <li>Improvisar</li>
                    <li>Entender qual nota vem depois</li>
                    <li>É o que você toca com a mão direita no violão</li>
                  </ul>
                </div>
                
                <div className="p-3 rounded bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-[#8b5cf6]">💡 Exemplo:</span> A voz do cantor, um solo de guitarra, a parte que você canta junto.
                  </p>
                </div>
              </div>
            </div>

            {/* MICRO LIÇÃO 4: Harmonia */}
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#10b981]/20 to-transparent border-l-4 border-[#10b981]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#10b981]/30 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#10b981]" />
                </div>
                <h4 className="text-xl font-bold text-white">3. Harmonia</h4>
              </div>
              
              <div className="space-y-3">
                <p className="text-gray-300">
                  A <span className="text-[#10b981] font-semibold">harmonia</span> são os acordes.
                </p>
                <p className="text-gray-300">
                  Várias notas tocadas juntas que criam o <strong className="text-white">"clima"</strong> da música.
                </p>
                <p className="text-gray-300">
                  É a base que sustenta a melodia.
                </p>
                
                <div className="p-3 rounded bg-[#10b981]/10 border border-[#10b981]/30">
                  <p className="text-sm text-gray-300 mb-2">
                    <strong className="text-[#10b981]">Isso serve para você conseguir:</strong>
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>Acompanhar músicas</li>
                    <li>Criar o "clima" (alegre, triste, tenso)</li>
                    <li>Entender por que alguns acordes combinam</li>
                  </ul>
                </div>
                
                <div className="p-3 rounded bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-[#10b981]">💡 Exemplo:</span> Os acordes que você toca no violão enquanto alguém canta a melodia.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SEPARADOR VISUAL */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span className="text-xs text-gray-400 font-semibold">RESUMO VISUAL</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          {/* MICRO LIÇÃO 5: Visualização da Prioridade */}
          <div className="mt-6 p-5 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎯</span>
              <h4 className="text-lg font-bold text-white">Por que isso importa?</h4>
            </div>
            
            <p className="text-gray-300 mb-4 text-sm">
              Quando você toca errado, as pessoas percebem nesta ordem:
            </p>
            
            {/* BLOCO VISUAL: Fluxo de Erros */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="flex flex-col items-center p-4 rounded-lg bg-[#ef4444]/20 border-2 border-[#ef4444]/50">
                <div className="w-12 h-12 rounded-full bg-[#ef4444] flex items-center justify-center mb-2">
                  <span className="text-white font-bold">1º</span>
                </div>
                <p className="text-sm font-bold text-white mb-1">Ritmo</p>
                <p className="text-xs text-gray-400 text-center">Erro mais óbvio</p>
              </div>
              
              <div className="flex items-center justify-center">
                <span className="text-2xl text-gray-500">→</span>
              </div>
              
              <div className="flex flex-col items-center p-4 rounded-lg bg-[#f97316]/20 border-2 border-[#f97316]/50">
                <div className="w-12 h-12 rounded-full bg-[#f97316] flex items-center justify-center mb-2">
                  <span className="text-white font-bold">2º</span>
                </div>
                <p className="text-sm font-bold text-white mb-1">Melodia</p>
                <p className="text-xs text-gray-400 text-center">Nota errada</p>
              </div>
            </div>
            
            <div className="flex justify-center mb-4">
              <span className="text-2xl text-gray-500">↓</span>
            </div>
            
            <div className="flex justify-center">
              <div className="flex flex-col items-center p-4 rounded-lg bg-[#eab308]/20 border-2 border-[#eab308]/50">
                <div className="w-12 h-12 rounded-full bg-[#eab308] flex items-center justify-center mb-2">
                  <span className="text-white font-bold">3º</span>
                </div>
                <p className="text-sm font-bold text-white mb-1">Harmonia</p>
                <p className="text-xs text-gray-400 text-center">Acorde errado</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded bg-yellow-500/20 border border-yellow-500/30">
              <p className="text-xs text-gray-300 text-center">
                <strong className="text-yellow-200">💡 Dica:</strong> Comece sempre pelo ritmo! 
                Se você tocar no tempo certo, mesmo com nota errada, já soa melhor.
              </p>
            </div>
          </div>

          {/* PERGUNTA REFLEXIVA 2 */}
          <div className="mt-6 p-4 rounded-lg bg-indigo-500/10 border-l-4 border-indigo-500">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💭</span>
              <div>
                <p className="text-indigo-200 font-semibold mb-2">Reflita:</p>
                <p className="text-gray-300 text-sm mb-2">
                  Qual dos 3 elementos você acha mais fácil de perceber quando ouve uma música?
                </p>
                <p className="text-gray-400 text-xs">
                  (Não há resposta certa - apenas observe sua própria percepção!)
                </p>
              </div>
            </div>
          </div>

          {/* CONTEÚDO COMPLEMENTAR - Apenas para Intermediários */}
          {isIntermediateOrAdvanced(currentLevel) && (
            <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/30 text-purple-200">
                  Aprofundamento
                </span>
                <h4 className="text-lg font-bold text-white">💡 Relação entre os Elementos</h4>
              </div>
              <p className="text-gray-300 mb-3 text-sm">
                <strong>Para iniciantes:</strong> Foque em dominar cada elemento separadamente antes de combiná-los.
              </p>
              <p className="text-gray-300 mb-3 text-sm">
                <strong>Para intermediários:</strong> Os 3 elementos trabalham juntos de forma interdependente. 
                A harmonia define a escala, a melodia segue a harmonia, e o ritmo organiza tudo. 
                Entender essas relações permite criar músicas mais coesas e expressivas.
              </p>
              <div className="p-3 rounded bg-purple-500/10">
                <p className="text-xs text-gray-300">
                  <strong>Exemplo prático:</strong> Em uma progressão C-G-Am-F, a melodia deve usar principalmente 
                  notas da escala de Dó Maior (harmonia), organizadas em frases rítmicas que respiram (ritmo).
                </p>
              </div>
            </div>
          )}

          {/* AÇÃO PRÁTICA IMEDIATA */}
          <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-green-400" />
              <h4 className="text-2xl font-bold text-white">🎸 Agora toque isso no violão</h4>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 1: Pratique o Ritmo</p>
                <p className="text-sm mb-3">
                  Pegue seu violão e faça isso AGORA:
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Bata palmas 4 vezes de forma regular (1, 2, 3, 4)</li>
                  <li>Agora toque a corda 6 (E grave) aberta no mesmo ritmo</li>
                  <li>Conte em voz alta: "1, 2, 3, 4" enquanto toca</li>
                  <li>Repita até sentir o ritmo constante</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Por quê?</strong> Isso treina seu senso de ritmo - a base de tudo!
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 2: Identifique os 3 Elementos</p>
                <p className="text-sm mb-3">
                  Escolha uma música que você conhece e identifique:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><strong>Ritmo:</strong> Bata o pé ou palmas seguindo a música</li>
                  <li><strong>Melodia:</strong> Cante ou assobie a parte principal</li>
                  <li><strong>Harmonia:</strong> Toque um acorde simples (C ou Am) enquanto canta</li>
                </ul>
              </div>
            </div>
          </div>

          {/* MECANISMO DE FIXAÇÃO: Exercícios Simples */}
          <div className="mt-6 space-y-4">
            <div className="p-5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-indigo-400" />
                <h4 className="text-lg font-bold text-white">Fixação: Teste seu conhecimento</h4>
              </div>
              
              <div className="space-y-4">
                <SimpleFixationExercise
                  question="Qual é a ordem de percepção de erros quando você toca?"
                  options={[
                    "Ritmo → Melodia → Harmonia",
                    "Melodia → Ritmo → Harmonia",
                    "Harmonia → Ritmo → Melodia",
                    "Todas são percebidas igualmente"
                  ]}
                  correctAnswer={0}
                  explanation="O ritmo é o primeiro erro que as pessoas percebem. Por isso, sempre comece praticando o ritmo antes de se preocupar com notas ou acordes!"
                />
                
                <SimpleFixationExercise
                  question="Qual dos 3 elementos da música é o 'quando' tocar?"
                  options={[
                    "Ritmo",
                    "Melodia",
                    "Harmonia",
                    "Todos os três"
                  ]}
                  correctAnswer={0}
                  explanation="O ritmo é o 'quando' tocar - organiza o tempo e a batida. Melodia é o 'o quê' tocar (notas), e Harmonia é o 'clima' (acordes)."
                />
                
                <SimpleFixationExercise
                  question="Por que é importante começar praticando o ritmo?"
                  options={[
                    "Porque é o mais difícil",
                    "Porque é o primeiro erro que as pessoas percebem - se o ritmo estiver certo, mesmo com nota errada, já soa melhor",
                    "Porque é o mais fácil",
                    "Não é importante"
                  ]}
                  correctAnswer={1}
                  explanation="O ritmo é o primeiro erro perceptível. Se você tocar no tempo certo, mesmo com nota ou acorde errado, já soa muito melhor do que o contrário!"
                />
              </div>
            </div>
          </div>

          {/* CONCEITOS-CHAVE */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔑</span>
              <h4 className="text-lg font-bold text-white">Conceitos-Chave para Lembrar</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Ritmo:</strong> O "quando" tocar - é o erro mais perceptível
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Melodia:</strong> O "o quê" tocar - notas uma depois da outra
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Harmonia:</strong> O "clima" - acordes que sustentam a melodia
                </p>
              </div>
            </div>
          </div>

          {/* CONEXÃO COM PRÁTICA */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xl font-bold text-white">🎯 Esta teoria destrava treinos práticos</h4>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Agora que você entendeu os fundamentos, você pode praticar:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/practice">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Treino de Ritmo</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Pratique batidas básicas e desenvolva seu senso rítmico
                  </p>
                </div>
              </Link>
              <Link href="/songs">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Tocar Músicas</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Aplique os 3 elementos em músicas reais
                  </p>
                </div>
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              <strong className="text-emerald-400">💡 Dica:</strong> A teoria que você acabou de aprender é a base de todos os treinos!
            </p>
          </div>

          {/* FECHAMENTO PARA INICIANTES */}
          {currentLevel === 'basic' && (
            <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <h4 className="text-lg font-bold text-white mb-3">✅ Você completou os Fundamentos!</h4>
              <p className="text-gray-300 text-sm mb-2">
                Agora você entende os 3 elementos básicos da música. Isso é suficiente para começar a tocar!
              </p>
              <p className="text-gray-300 text-sm">
                <strong>Próximo passo:</strong> Continue para "Notas no Braço" para aprender onde estão as notas no violão.
              </p>
            </div>
          )}
        </div>
      </div>
    ),
  },
  
  // 2. NOTAS NO BRAÇO - Primeiro passo prático
  {
    id: 'fretboard-notes',
    title: 'Notas no Braço do Violão',
    icon: Target,
    description: 'Aprenda onde estão as notas no braço do violão',
    duration: '15 min',
    difficulty: 'beginner',
    level: 'basic',
    prerequisites: ['fundamentals'],
    minAccuracy: 70,
    topics: ['Cordas abertas', 'Localização de notas', 'Padrões no braço', 'Oitavas'],
    practicalApplication: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-lg font-bold text-white mb-3">🎸 Explore o Braço</h4>
            <p className="text-gray-300 mb-3 text-sm">
            Use o diagrama acima para encontrar notas. Clique em qualquer posição para ouvir a nota!
            <strong className="text-white"> Isso serve para você conseguir:</strong> Memorizar onde cada nota está e encontrar rapidamente qualquer nota no braço.
          </p>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong className="text-green-400">1. Cordas abertas:</strong> E, A, D, G, B, E (da mais grave para mais aguda). 
              Memorize essas 6 notas primeiro!</p>
            <p><strong className="text-green-400">2. Cada traste:</strong> Aumenta 1 semitom (meio tom). 
              É como subir um degrau na escada musical.</p>
            <p><strong className="text-green-400">3. Padrão:</strong> A cada 12 trastes, a mesma nota se repete (oitava). 
              Isso serve para encontrar a mesma nota em vários lugares.</p>
            <p><strong className="text-green-400">4. Pratique:</strong> Encontre todas as notas Dó (C) no braço. 
              Isso treina sua memória visual!</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs text-gray-300">
            <strong className="text-blue-400">💡 Dica:</strong> Comece memorizando as notas nas cordas 5 (A) e 6 (E grave). 
            <strong className="text-white"> Isso serve para você conseguir:</strong> Encontrar qualquer nota rapidamente, 
            pois essas cordas são muito usadas como "referência" no violão.
          </p>
        </div>
      </div>
    ),
    content: (
      <div className="space-y-6">
        {/* INDICADOR: Esta teoria destrava treinos */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border-l-4 border-emerald-500 mb-6">
          <div className="flex items-start gap-3">
            <Play className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-200 font-semibold mb-1">Esta teoria destrava treinos práticos:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/scales">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Treino de Escalas
                  </span>
                </Link>
                <Link href="/practice">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Treino de Ouvido
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* MICRO LIÇÃO 1: Introdução */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#10b981] flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">O Braço do Violão</h3>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              O braço do violão é como um <span className="text-[#06b6d4] font-semibold">mapa</span>.
            </p>
            <p className="text-gray-300 text-sm mt-2">
              Cada lugar (corda + traste) tem uma nota.
            </p>
          </div>

          <div className="p-3 rounded bg-green-500/10 border-l-4 border-green-500 mb-6">
            <p className="text-sm text-gray-300">
              <strong className="text-green-400">Isso serve para você conseguir:</strong>
            </p>
            <ul className="text-sm text-gray-300 mt-2 space-y-1 list-disc list-inside">
              <li>Encontrar qualquer nota rapidamente</li>
              <li>Tocar acordes em diferentes lugares do braço</li>
              <li>Entender por que o mesmo acorde pode ser tocado de várias formas</li>
            </ul>
          </div>

          {/* PERGUNTA REFLEXIVA */}
          <div className="p-4 rounded-lg bg-yellow-500/10 border-l-4 border-yellow-500 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤔</span>
              <div>
                <p className="text-yellow-200 font-semibold mb-2">Antes de continuar:</p>
                <p className="text-gray-300 text-sm">
                  Olhe para o braço do seu violão. Quantas cordas você vê? 
                  Consegue contar quantos trastes há até o corpo do violão?
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <FullFretboardView 
              scaleName="Cromática"
              root="C"
              intervals={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}
            />
          </div>

          <div className="space-y-4">
            {/* MICRO LIÇÃO 2: Cordas Abertas - Visual */}
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#06b6d4]/20 to-transparent border-l-4 border-[#06b6d4]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#06b6d4]/30 flex items-center justify-center">
                  <span className="text-xl">🎸</span>
                </div>
                <h4 className="text-xl font-bold text-white">Cordas Abertas</h4>
              </div>
              
              <p className="text-gray-300 mb-4 text-sm">
                As 6 cordas do violão (da mais grave para mais aguda):
              </p>
              
              {/* BLOCO VISUAL: Grid de Cordas */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { num: '6ª', note: 'E', name: 'Mi grave', color: 'from-red-500/20 to-red-600/20' },
                  { num: '5ª', note: 'A', name: 'Lá', color: 'from-orange-500/20 to-orange-600/20' },
                  { num: '4ª', note: 'D', name: 'Ré', color: 'from-yellow-500/20 to-yellow-600/20' },
                  { num: '3ª', note: 'G', name: 'Sol', color: 'from-green-500/20 to-green-600/20' },
                  { num: '2ª', note: 'B', name: 'Si', color: 'from-blue-500/20 to-blue-600/20' },
                  { num: '1ª', note: 'E', name: 'Mi agudo', color: 'from-purple-500/20 to-purple-600/20' },
                ].map((corda) => (
                  <div key={corda.num} className={`p-3 rounded-lg bg-gradient-to-br ${corda.color} border border-white/10`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-400">{corda.num}</span>
                      <span className="text-lg font-bold text-white">{corda.note}</span>
                    </div>
                    <p className="text-xs text-gray-300">{corda.name}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 rounded bg-[#06b6d4]/10 border border-[#06b6d4]/30">
                <p className="text-xs text-gray-300">
                  <strong className="text-[#06b6d4]">💡 Dica:</strong> Memorize essa sequência: 
                  <span className="font-mono text-white ml-1">E-A-D-G-B-E</span>
                </p>
              </div>
            </div>

            {/* MICRO LIÇÃO 3: Como Funciona - Dividido */}
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#8b5cf6]/20 to-transparent border-l-4 border-[#8b5cf6]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/30 flex items-center justify-center">
                  <span className="text-xl">📏</span>
                </div>
                <h4 className="text-xl font-bold text-white">Como Funciona</h4>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 rounded bg-white/5 border border-white/10">
                  <p className="text-sm font-semibold text-white mb-2">Cada traste:</p>
                  <p className="text-sm text-gray-300">
                    Aumenta a nota em <strong className="text-white">1 semitom</strong> (meio tom).
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    É como subir um degrau na escada musical.
                  </p>
                </div>
                
                <div className="p-3 rounded bg-white/5 border border-white/10">
                  <p className="text-sm font-semibold text-white mb-2">Exemplo prático:</p>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="px-2 py-1 rounded bg-[#8b5cf6]/20 text-white font-mono">E</span>
                    <span>→</span>
                    <span className="px-2 py-1 rounded bg-[#8b5cf6]/20 text-white font-mono">F</span>
                    <span>→</span>
                    <span className="px-2 py-1 rounded bg-[#8b5cf6]/20 text-white font-mono">F#</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Corda 6 (E) aberta = E. No 1º traste = F. No 2º traste = F#.
                  </p>
                </div>
                
                <div className="p-3 rounded bg-white/5 border border-white/10">
                  <p className="text-sm font-semibold text-white mb-2">Oitava:</p>
                  <p className="text-sm text-gray-300">
                    A cada <strong className="text-white">12 trastes</strong>, a mesma nota se repete (mais aguda).
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Isso serve para encontrar a mesma nota em vários lugares.
                  </p>
                </div>
                
                <div className="p-3 rounded bg-white/5 border border-white/10">
                  <p className="text-sm font-semibold text-white mb-2">Padrão:</p>
                  <p className="text-sm text-gray-300">
                    O mesmo padrão de notas se repete em todas as cordas.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Se você sabe onde está uma nota em uma corda, pode encontrar nas outras!
                  </p>
                </div>
              </div>
            </div>

            {/* MICRO LIÇÃO 4: Memorização Visual */}
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#10b981]/20 to-transparent border-l-4 border-[#10b981]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#10b981]/30 flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
                <h4 className="text-xl font-bold text-white">Dica de Memorização</h4>
              </div>
              
              <p className="text-gray-300 mb-4 text-sm">
                Memorize estas posições importantes primeiro:
              </p>
              
              {/* BLOCO VISUAL: Posições Importantes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { corda: '5ª (A)', traste: '3º', nota: 'C', nome: 'Dó' },
                  { corda: '5ª (A)', traste: '5º', nota: 'D', nome: 'Ré' },
                  { corda: '5ª (A)', traste: '7º', nota: 'E', nome: 'Mi' },
                  { corda: '6ª (E)', traste: '1º', nota: 'F', nome: 'Fá' },
                  { corda: '6ª (E)', traste: '3º', nota: 'G', nome: 'Sol' },
                ].map((pos, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{pos.corda} • {pos.traste} traste</span>
                      <span className="text-lg font-bold text-white">{pos.nota}</span>
                    </div>
                    <p className="text-xs text-gray-300">{pos.nome}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* PERGUNTA REFLEXIVA */}
            <div className="mt-6 p-4 rounded-lg bg-indigo-500/10 border-l-4 border-indigo-500">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💭</span>
                <div>
                  <p className="text-indigo-200 font-semibold mb-2">Pense:</p>
                  <p className="text-gray-300 text-sm">
                    Por que você acha que é importante memorizar essas posições específicas? 
                    (Dica: elas são muito usadas como referência!)
                  </p>
                </div>
              </div>
            </div>

            {/* CONTEÚDO COMPLEMENTAR - Apenas para Intermediários */}
            {isIntermediateOrAdvanced(currentLevel) && (
              <div className="p-5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/30 text-purple-200">
                    Aprofundamento
                  </span>
                  <h4 className="text-lg font-bold text-white">📐 Padrões e Oitavas no Braço</h4>
                </div>
                <p className="text-gray-300 mb-3 text-sm">
                  <strong>Padrão de Oitavas:</strong> A mesma nota aparece em vários lugares do braço seguindo padrões fixos.
                </p>
                <div className="p-3 rounded bg-purple-500/10">
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• <strong>Padrão 1:</strong> 2 cordas acima, 2 trastes à direita (ex: C na 5ª corda, 3º traste → C na 3ª corda, 5º traste)</li>
                    <li>• <strong>Padrão 2:</strong> 3 cordas acima, 3 trastes à esquerda (ex: C na 5ª corda, 3º traste → C na 2ª corda, 1º traste)</li>
                    <li>• <strong>Padrão 3:</strong> 1 corda acima, 5 trastes à direita (ex: C na 6ª corda, 8º traste → C na 5ª corda, 3º traste)</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Isso serve para:</strong> Encontrar qualquer nota rapidamente e tocar acordes em diferentes posições do braço.
                </p>
              </div>
            )}
          </div>

          {/* AÇÃO PRÁTICA IMEDIATA */}
          <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-green-400" />
              <h4 className="text-2xl font-bold text-white">🎸 Agora toque isso no violão</h4>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 1: Localize 5 notas no braço</p>
                <p className="text-sm mb-3">
                  Use o diagrama acima e seu violão. Faça isso AGORA:
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Encontre a nota <strong>C (Dó)</strong> na corda 5, 3º traste - toque e ouça</li>
                  <li>Encontre a nota <strong>D (Ré)</strong> na corda 5, 5º traste - toque e ouça</li>
                  <li>Encontre a nota <strong>E (Mi)</strong> na corda 5, 7º traste - toque e ouça</li>
                  <li>Encontre a nota <strong>F (Fá)</strong> na corda 6, 1º traste - toque e ouça</li>
                  <li>Encontre a nota <strong>G (Sol)</strong> na corda 6, 3º traste - toque e ouça</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Dica:</strong> Clique nas notas no diagrama acima para ouvir o som e comparar!
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 2: Encontre todas as notas C</p>
                <p className="text-sm mb-3">
                  Desafio: encontre TODAS as notas C (Dó) no braço do seu violão. 
                  Use o diagrama para verificar. Quantas você encontrou?
                </p>
                <p className="text-xs text-gray-400">
                  <strong>Resposta:</strong> Existem várias! Isso mostra que a mesma nota aparece em vários lugares.
                </p>
              </div>
            </div>
          </div>

          {/* MECANISMO DE FIXAÇÃO: Exercícios Simples */}
          <div className="mt-6 space-y-4">
            <div className="p-5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-indigo-400" />
                <h4 className="text-lg font-bold text-white">Fixação: Teste seu conhecimento</h4>
              </div>
              
              <div className="space-y-4">
                <SimpleFixationExercise
                  question="Quantos semitons (meios tons) há em uma oitava?"
                  options={[
                    "10 semitons",
                    "12 semitons",
                    "14 semitons",
                    "7 semitons"
                  ]}
                  correctAnswer={1}
                  explanation="Uma oitava tem exatamente 12 semitons. Isso significa que a cada 12 trastes, a mesma nota se repete (mais aguda ou mais grave)."
                />
                
                <SimpleFixationExercise
                  question="Qual é a sequência das cordas abertas do violão (da mais grave para mais aguda)?"
                  options={[
                    "E-A-D-G-B-E",
                    "A-D-G-B-E-A",
                    "E-B-G-D-A-E",
                    "C-D-E-F-G-A"
                  ]}
                  correctAnswer={0}
                  explanation="As cordas abertas do violão são E-A-D-G-B-E (da mais grave para mais aguda). Memorize essa sequência - é fundamental para encontrar notas no braço!"
                />
                
                <SimpleFixationExercise
                  question="Cada traste no violão aumenta a nota em quanto?"
                  options={[
                    "1 tom (2 semitons)",
                    "1 semitom (meio tom)",
                    "2 tons",
                    "Não aumenta, apenas muda a corda"
                  ]}
                  correctAnswer={1}
                  explanation="Cada traste aumenta a nota em exatamente 1 semitom (meio tom). É como subir um degrau na escada musical!"
                />
              </div>
            </div>
          </div>

          {/* CONCEITOS-CHAVE */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔑</span>
              <h4 className="text-lg font-bold text-white">Conceitos-Chave para Lembrar</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Cada traste:</strong> Aumenta 1 semitom (meio tom)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Cordas abertas:</strong> E-A-D-G-B-E (da mais grave para mais aguda)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Oitava:</strong> 12 trastes = mesma nota, mais aguda ou grave
                </p>
              </div>
            </div>
          </div>

          {/* LEMBRE-SE: Conexão com módulo anterior */}
          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border-l-4 border-blue-500">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-blue-200 font-semibold mb-1">Lembre-se:</p>
                <p className="text-sm text-gray-300">
                  Você já aprendeu sobre <strong className="text-white">Ritmo, Melodia e Harmonia</strong> no módulo anterior. 
                  Agora você está aprendendo onde estão as <strong className="text-white">notas</strong> no braço - 
                  isso é essencial para tocar tanto <strong className="text-white">melodias</strong> quanto <strong className="text-white">harmonias</strong> (acordes)!
                </p>
              </div>
            </div>
          </div>

          {/* CONEXÃO COM PRÁTICA */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xl font-bold text-white">🎯 Esta teoria destrava treinos práticos</h4>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Agora que você sabe onde estão as notas, você pode:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/scales">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Treino de Escalas</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Use o conhecimento das notas para tocar escalas
                  </p>
                </div>
              </Link>
              <Link href="/practice">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Treino de Ouvido</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Identifique notas pelo som usando o braço
                  </p>
                </div>
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              <strong className="text-emerald-400">💡 Dica:</strong> Saber onde estão as notas é essencial para todos os treinos de técnica!
            </p>
          </div>

          {/* FECHAMENTO PARA INICIANTES */}
          {currentLevel === 'basic' && (
            <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <h4 className="text-lg font-bold text-white mb-3">✅ Você aprendeu as Notas no Braço!</h4>
              <p className="text-gray-300 text-sm mb-2">
                Agora você sabe onde estão as notas principais. Pratique localizando C, D, E, F, G no braço.
              </p>
              <p className="text-gray-300 text-sm">
                <strong>Próximo passo:</strong> Continue para "Acordes Básicos" para aprender a formar acordes.
              </p>
            </div>
          )}
        </div>
      </div>
    ),
  },
  
  // 3. ACORDES BÁSICOS - Aplicação prática imediata
  {
    id: 'chord-formation',
    title: 'Acordes Básicos',
    icon: Target,
    description: 'Descubra como acordes são construídos e toque seus primeiros acordes',
    duration: '20 min',
    difficulty: 'beginner',
    level: 'basic',
    prerequisites: ['fundamentals', 'fretboard-notes'],
    minAccuracy: 70,
    topics: ['Tríades', 'Acordes maiores', 'Acordes menores', 'Formas básicas'],
    practicalApplication: (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-lg font-bold text-white mb-4">🎸 Dó Maior (C) em 3 Formas Diferentes</h4>
          <p className="text-gray-300 mb-4 text-sm">
            Agora que você sabe que Dó Maior é formado por C-E-G, veja 3 formas diferentes de tocar no violão:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <h5 className="font-bold text-white mb-2">Forma 1: Posição Aberta</h5>
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">x 3 2 0 1 0</div>
                <div className="text-sm text-gray-300">
                  <p>• Corda 5 (A) no 3º traste</p>
                  <p>• Corda 4 (D) no 2º traste</p>
                  <p>• Corda 2 (B) no 1º traste</p>
                  <p>• Corda 1 (E) e 3 (G) abertas</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Som: Brilhante e aberto. 
                <strong className="text-white"> Serve para:</strong> Início de músicas e criar sensação de abertura.</p>
            </div>
            
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <h5 className="font-bold text-white mb-2">Forma 2: Com Pestana (3º traste)</h5>
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">x 3 5 5 5 3</div>
                <div className="text-sm text-gray-300">
                  <p>• Pestana no 3º traste</p>
                  <p>• Dedos 2, 3, 4 nas cordas 3, 4, 5</p>
                  <p>• Mesmas notas, som mais cheio</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Som: Mais encorpado. 
                <strong className="text-white"> Serve para:</strong> Solos e acompanhamentos com som mais cheio.</p>
            </div>
            
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <h5 className="font-bold text-white mb-2">Forma 3: Inversão (8º traste)</h5>
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">x x 5 5 5 8</div>
                <div className="text-sm text-gray-300">
                  <p>• E no 8º traste (corda 1)</p>
                  <p>• G e C nas cordas 3, 4, 5</p>
                  <p>• Inversão: E-G-C (não C-E-G)</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Som: Mais agudo. 
                <strong className="text-white"> Serve para:</strong> Criar movimento e variação, evitando repetição monótona.</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <p className="text-sm text-gray-300">
              <strong className="text-cyan-400">💡 Dica:</strong> Todas as 3 formas são o mesmo acorde C (C-E-G), 
              mas cada uma tem um "sabor" diferente. 
              <strong className="text-white"> Isso serve para você conseguir:</strong> Variar o som do mesmo acorde 
              e escolher a forma mais fácil para trocar entre acordes.
            </p>
          </div>

          {/* AÇÃO PRÁTICA IMEDIATA */}
          <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-green-400" />
              <h4 className="text-2xl font-bold text-white">🎸 Agora toque isso no violão</h4>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 1: Toque o acorde C (Dó Maior)</p>
                <p className="text-sm mb-3">
                  Use a <strong>Forma 1 (Posição Aberta)</strong> descrita acima. Faça isso AGORA:
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Coloque o dedo 3 na corda 5 (A), 3º traste</li>
                  <li>Coloque o dedo 2 na corda 4 (D), 2º traste</li>
                  <li>Coloque o dedo 1 na corda 2 (B), 1º traste</li>
                  <li>Toque todas as cordas (exceto a 6ª) de uma vez</li>
                  <li>Ouça o som - deve soar "alegre" e brilhante!</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Dica:</strong> Use o construtor de acordes acima para ver as notas C-E-G e entender melhor!
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 2: Compare C maior com Am menor</p>
                <p className="text-sm mb-3">
                  Agora toque o acorde <strong>Am (Lá menor)</strong>:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Corda 5 (A) aberta</li>
                  <li>Corda 4 (D) no 2º traste (dedo 2)</li>
                  <li>Corda 3 (G) no 2º traste (dedo 3)</li>
                  <li>Corda 2 (B) no 1º traste (dedo 1)</li>
                  <li>Cordas 1 e 6 abertas</li>
                </ul>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Compare:</strong> C soa "alegre", Am soa "triste". A diferença é só uma nota (a terça)!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    content: (
      <div className="space-y-6">
        {/* INDICADOR: Esta teoria destrava treinos */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border-l-4 border-emerald-500 mb-6">
          <div className="flex items-start gap-3">
            <Play className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-200 font-semibold mb-1">Esta teoria destrava treinos práticos:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/chords">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Treino de Acordes
                  </span>
                </Link>
                <Link href="/practice">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Treino de Ouvido - Acordes
                  </span>
                </Link>
              </div>
              <p className="text-xs text-emerald-300/80 mt-2">
                💡 Completar com 75% desbloqueia: Treino de Ouvido para Acordes
              </p>
            </div>
          </div>
        </div>

        <ChordBuilder />
        
        <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10">
          <h3 className="text-2xl font-bold text-white mb-4">Como Acordes são Construídos?</h3>
          <p className="text-gray-300 mb-6">
            Acordes são <span className="text-[#06b6d4] font-semibold">3 ou mais notas tocadas juntas</span>. 
            <strong className="text-white"> Isso serve para você conseguir:</strong> Entender por que um acorde C tem as notas C-E-G, 
            criar seus próprios acordes e saber quais notas tocar quando vê um acorde escrito.
          </p>

          <div className="space-y-4">
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#10b981]/20 to-transparent border-l-4 border-[#10b981]">
              <h4 className="text-xl font-bold text-white mb-3">🎸 Acorde Maior (som alegre)</h4>
              <p className="text-gray-300 mb-3">
                3 notas: <span className="text-[#10b981] font-semibold">Nota base + 3ª maior + 5ª justa</span>
              </p>
              <p className="text-gray-300 mb-3 text-sm">
                <strong className="text-[#10b981]">Isso serve para você conseguir:</strong> Tocar acordes maiores (C, G, F, D, etc.) 
                e entender por que eles têm som "alegre" ou "brilhante".
              </p>
              <div className="p-3 rounded bg-[#10b981]/10 mb-3">
                <p className="text-sm text-gray-300 mb-2">
                  <span className="font-semibold">Exemplo (Acorde de Dó - C):</span>
                </p>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <span className="px-3 py-1 rounded bg-[#10b981]/30 text-white font-bold">C</span>
                  <span className="text-gray-400">+</span>
                  <span className="px-3 py-1 rounded bg-[#10b981]/30 text-white font-bold">E</span>
                  <span className="text-gray-400">+</span>
                  <span className="px-3 py-1 rounded bg-[#10b981]/30 text-white font-bold">G</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  (C = nota base, E = 4 semitons acima, G = 3 semitons acima de E)
                </p>
                <AudioPlayChordButton chordNotes={["C4", "E4", "G4"]} duration={0.5} label="🎵 Ouvir Acorde Maior (C)" />
              </div>
              
              {/* AÇÃO PRÁTICA IMEDIATA - Acorde Maior */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-xs font-semibold text-green-400 mb-2">🎸 Agora toque:</p>
                <p className="text-xs text-gray-300 mb-2">
                  <strong>1. Ouça</strong> o acorde C acima - perceba o som alegre e brilhante! 
                  <strong> 2. Identifique</strong> as 3 notas: C-E-G. 
                  <strong> 3. Toque</strong> no violão: corda 5, 3º traste (C) + corda 4, 2º traste (E) + corda 3 aberta (G).
                </p>
                <p className="text-xs text-gray-400">
                  <strong>Dica:</strong> Use o construtor de acordes acima para ver a posição completa no braço!
                </p>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-gradient-to-r from-[#3b82f6]/20 to-transparent border-l-4 border-[#3b82f6]">
              <h4 className="text-xl font-bold text-white mb-3">🎸 Acorde Menor (som triste/melancólico)</h4>
              <p className="text-gray-300 mb-3">
                3 notas: <span className="text-[#3b82f6] font-semibold">Nota base + 3ª menor + 5ª justa</span>
              </p>
              <p className="text-gray-300 mb-3 text-sm">
                <strong className="text-[#3b82f6]">Isso serve para você conseguir:</strong> Tocar acordes menores (Am, Dm, Em, etc.) 
                e entender por que eles têm som "triste" ou "melancólico".
              </p>
              <div className="p-3 rounded bg-[#3b82f6]/10 mb-3">
                <p className="text-sm text-gray-300 mb-2">
                  <span className="font-semibold">Exemplo (Acorde de Lá menor - Am):</span>
                </p>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <span className="px-3 py-1 rounded bg-[#3b82f6]/30 text-white font-bold">A</span>
                  <span className="text-gray-400">+</span>
                  <span className="px-3 py-1 rounded bg-[#3b82f6]/30 text-white font-bold">C</span>
                  <span className="text-gray-400">+</span>
                  <span className="px-3 py-1 rounded bg-[#3b82f6]/30 text-white font-bold">E</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  (A = nota base, C = 3 semitons acima, E = 4 semitons acima de C)
                </p>
                <AudioPlayChordButton chordNotes={["A3", "C4", "E4"]} duration={0.5} label="🎵 Ouvir Acorde Menor (Am)" />
              </div>
              
              {/* AÇÃO PRÁTICA IMEDIATA - Acorde Menor */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-xs font-semibold text-green-400 mb-2">🎸 Agora toque:</p>
                <p className="text-xs text-gray-300 mb-2">
                  <strong>1. Ouça</strong> o acorde Am acima e <strong>compare</strong> com C - perceba a diferença de "clima"! 
                  <strong> 2. Identifique</strong> o som triste/melancólico. 
                  <strong> 3. Toque</strong> no violão: corda 5 aberta (A) + corda 4, 2º traste (C) + corda 3, 2º traste (E).
                </p>
                <p className="text-xs text-gray-400">
                  <strong>Dica:</strong> A diferença entre C (alegre) e Am (triste) é só uma nota - a terça! Por isso é importante entender intervalos.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
              <h4 className="text-lg font-bold text-white mb-3">💡 Diferença Simples</h4>
              <p className="text-gray-300 mb-2">
                A única diferença entre <span className="font-semibold">Maior</span> e <span className="font-semibold">Menor</span> 
                é a segunda nota (a "terça"):
              </p>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li><strong>Maior:</strong> 2ª nota fica 4 semitons acima da base (som alegre)</li>
                <li><strong>Menor:</strong> 2ª nota fica 3 semitons acima da base (som triste)</li>
              </ul>
              <p className="text-xs text-gray-400 mt-2">
                Por isso C (C-E-G) soa alegre e Am (A-C-E) soa triste - só muda uma nota!
              </p>
            </div>

            {/* CONTEÚDO COMPLEMENTAR - Apenas para Intermediários */}
            {isIntermediateOrAdvanced(currentLevel) && (
              <div className="p-5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/30 text-purple-200">
                    Aprofundamento
                  </span>
                  <h4 className="text-lg font-bold text-white">🎹 Acordes com 4 ou mais notas</h4>
                </div>
                <p className="text-gray-300 mb-3 text-sm">
                  Além das tríades (3 notas), existem acordes mais complexos:
                </p>
                <div className="p-3 rounded bg-purple-500/10">
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>
                      <strong>7ª Dominante (C7):</strong> C-E-G-Bb. Adiciona uma 7ª menor. 
                      Usado em blues e cria tensão que resolve.
                    </li>
                    <li>
                      <strong>7ª Maior (Cmaj7):</strong> C-E-G-B. Adiciona uma 7ª maior. 
                      Som mais suave e sofisticado, usado em jazz.
                    </li>
                    <li>
                      <strong>Suspenso (Csus2, Csus4):</strong> Substitui a terça por 2ª ou 4ª. 
                      Som neutro, sem sensação de maior ou menor.
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Isso serve para:</strong> Criar mais variedade harmônica e entender acordes em músicas mais complexas.
                </p>
              </div>
            )}
          </div>

          {/* MECANISMO DE FIXAÇÃO: Exercícios Simples */}
          <div className="mt-6 space-y-4">
            <div className="p-5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-indigo-400" />
                <h4 className="text-lg font-bold text-white">Fixação: Teste seu conhecimento</h4>
              </div>
              
              <div className="space-y-4">
                <SimpleFixationExercise
                  question="Qual é a diferença entre um acorde Maior e um acorde Menor?"
                  options={[
                    "O número de notas (maior tem mais notas)",
                    "A segunda nota: maior = 4 semitons, menor = 3 semitons",
                    "A posição no braço do violão",
                    "Não há diferença, são a mesma coisa"
                  ]}
                  correctAnswer={1}
                  explanation="A única diferença é a terça (segunda nota): Maior tem terça maior (4 semitons = som alegre), Menor tem terça menor (3 semitons = som triste)."
                />
                
                <SimpleFixationExercise
                  question="Quantas notas formam uma tríade (acorde básico)?"
                  options={[
                    "2 notas",
                    "3 notas",
                    "4 notas",
                    "5 notas"
                  ]}
                  correctAnswer={1}
                  explanation="Uma tríade tem exatamente 3 notas: fundamental, terça (maior ou menor) e quinta justa. Exemplo: C (C-E-G) ou Am (A-C-E)."
                />
                
                <SimpleFixationExercise
                  question="Por que acordes maiores soam 'alegres' e menores soam 'tristes'?"
                  options={[
                    "Porque têm notas diferentes",
                    "Porque a terça maior (4 semitons) cria som brilhante, e a terça menor (3 semitons) cria som melancólico",
                    "Porque são tocados em posições diferentes",
                    "Não há diferença de som"
                  ]}
                  correctAnswer={1}
                  explanation="A diferença de apenas 1 semitom na terça (3ª maior vs 3ª menor) muda completamente o 'clima' do acorde. Maior = alegre/brilhante, Menor = triste/melancólico!"
                />
              </div>
            </div>
          </div>

          {/* CONCEITOS-CHAVE */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔑</span>
              <h4 className="text-lg font-bold text-white">Conceitos-Chave para Lembrar</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Acorde Maior:</strong> Fundamental + 3ª maior (4 semitons) + 5ª justa = som alegre
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Acorde Menor:</strong> Fundamental + 3ª menor (3 semitons) + 5ª justa = som triste
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Exemplo:</strong> C (C-E-G) é maior, Am (A-C-E) é menor
                </p>
              </div>
            </div>
          </div>

          {/* LEMBRE-SE: Conexão com módulos anteriores */}
          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border-l-4 border-blue-500">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-blue-200 font-semibold mb-1">Lembre-se:</p>
                <p className="text-sm text-gray-300">
                  Você já sabe onde estão as <strong className="text-white">notas no braço</strong>. 
                  Agora você está aprendendo a <strong className="text-white">combinar notas</strong> para formar acordes. 
                  Isso é a <strong className="text-white">harmonia</strong> que você viu nos Fundamentos!
                </p>
              </div>
            </div>
          </div>

          {/* CONEXÃO COM PRÁTICA */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xl font-bold text-white">🎯 Esta teoria destrava treinos práticos</h4>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Agora que você entende como acordes são formados, você pode praticar:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/chords">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Treino de Acordes</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Pratique acordes básicos e transições
                  </p>
                </div>
              </Link>
              <Link href="/practice">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Treino de Ouvido - Acordes</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Identifique acordes maiores e menores pelo som
                  </p>
                </div>
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              <strong className="text-emerald-400">💡 Dica:</strong> Completar este módulo com 75% de precisão desbloqueia o treino de ouvido para acordes!
            </p>
          </div>

          {/* FECHAMENTO PARA INICIANTES */}
          {currentLevel === 'basic' && (
            <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <h4 className="text-lg font-bold text-white mb-3">✅ Você aprendeu Acordes Básicos!</h4>
              <p className="text-gray-300 text-sm mb-2">
                Agora você entende como acordes são formados e pode tocar C e Am. Pratique essas duas formas!
              </p>
              <p className="text-gray-300 text-sm">
                <strong>Próximo passo:</strong> Continue para "Ritmo Prático" para aprender a diferença entre Straight e Swing.
              </p>
            </div>
          )}
        </div>
      </div>
    ),
  },
  
  // 4. RITMO PRÁTICO - Desenvolver pulso
  {
    id: 'straight-swing',
    title: 'Ritmo Prático',
    icon: Waves,
    description: 'Aprenda a diferenciar os dois principais tipos de pulsação musical',
    duration: '15 min',
    difficulty: 'beginner',
    level: 'basic',
    prerequisites: ['fundamentals'],
    minAccuracy: 70,
    topics: ['Straight', 'Swing', 'Identificação', 'Exemplos práticos'],
    content: (currentLevel: 'basic' | 'intermediate' | 'advanced') => (
      <div className="space-y-6">
        {/* INDICADOR: Esta teoria destrava treinos */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border-l-4 border-emerald-500 mb-6">
          <div className="flex items-start gap-3">
            <Play className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-200 font-semibold mb-1">Esta teoria destrava treinos práticos:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/practice">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Treino de Ritmo
                  </span>
                </Link>
                <Link href="/songs">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Tocar Músicas
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10">
          <h3 className="text-2xl font-bold text-white mb-4">Straight vs Swing</h3>
          <p className="text-gray-300 mb-6">
            Existem dois tipos principais de "feeling" rítmico. 
            <strong className="text-white"> Isso serve para você conseguir:</strong> Tocar no estilo certo da música, 
            não misturar ritmos diferentes e entender por que algumas músicas "balançam" e outras não.
          </p>
          
          <div className="space-y-4">
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#06b6d4]/20 to-transparent border-l-4 border-[#06b6d4]">
              <h4 className="text-xl font-bold text-white mb-3">📏 Straight (Reto) - Ritmo "matemático"</h4>
              <p className="text-gray-300 mb-3">
                Pulsação <span className="text-[#06b6d4] font-semibold">perfeitamente regular</span>, como um relógio. 
                Cada batida tem o mesmo espaço de tempo.
              </p>
              <div className="p-3 rounded bg-[#06b6d4]/10 mb-3">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-[#06b6d4]">Como identificar:</span> Imagine tocando um chocalho. 
                  Se sua mão se move sempre no mesmo ritmo, igualzinho → <span className="font-bold">STRAIGHT</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-[#06b6d4]/20 text-[#06b6d4] text-sm">Samba</span>
                <span className="px-3 py-1 rounded-full bg-[#06b6d4]/20 text-[#06b6d4] text-sm">Rock</span>
                <span className="px-3 py-1 rounded-full bg-[#06b6d4]/20 text-[#06b6d4] text-sm">Pop</span>
                <span className="px-3 py-1 rounded-full bg-[#06b6d4]/20 text-[#06b6d4] text-sm">Funk</span>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-gradient-to-r from-[#8b5cf6]/20 to-transparent border-l-4 border-[#8b5cf6]">
              <h4 className="text-xl font-bold text-white mb-3">🎵 Swing - Ritmo "balançado"</h4>
              <p className="text-gray-300 mb-3">
                Pulsação com <span className="text-[#8b5cf6] font-semibold">"balanço" natural</span>. 
                Não é matemático - tem um leve atraso que cria o "swing".
              </p>
              <div className="p-3 rounded bg-[#8b5cf6]/10 mb-3">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-[#8b5cf6]">Como identificar:</span> Se sua mão se move como "de 2 em 2" 
                  com um balanço natural, tipo dançar → <span className="font-bold">SWING</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] text-sm">Jazz</span>
                <span className="px-3 py-1 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] text-sm">Blues</span>
                <span className="px-3 py-1 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] text-sm">Bossa Nova (algumas)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-5 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
            <h4 className="text-lg font-bold text-white mb-3">💡 Dica Prática</h4>
            <p className="text-gray-300">
              Algumas músicas <span className="font-semibold">mudam de feeling</span> no meio! 
              Podem começar em Straight e depois ir para Swing, ou vice-versa. 
              <strong className="text-white"> Isso serve para você conseguir:</strong> Identificar quando mudar seu estilo de tocar 
              para acompanhar a música corretamente.
            </p>
          </div>

          {/* CONTEÚDO COMPLEMENTAR - Apenas para Intermediários */}
          {isIntermediateOrAdvanced(currentLevel) && (
            <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/30 text-purple-200">
                  Aprofundamento
                </span>
                <h4 className="text-lg font-bold text-white">🎼 Subdivisões e Síncopes</h4>
              </div>
              <p className="text-gray-300 mb-3 text-sm">
                Além de Straight e Swing, existem outros conceitos rítmicos importantes:
              </p>
              <div className="p-3 rounded bg-purple-500/10">
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>
                    <strong>Subdivisões:</strong> Dividir cada batida em partes menores (ex: 1-e-&-a). 
                    Permite criar ritmos mais complexos e interessantes.
                  </li>
                  <li>
                    <strong>Síncope:</strong> Acentuar notas que não estão na batida forte. 
                    Cria "surpresa" e movimento na música.
                  </li>
                  <li>
                    <strong>Polirritmia:</strong> Tocar dois ritmos diferentes ao mesmo tempo 
                    (ex: 3 contra 2). Usado em jazz e música clássica.
                  </li>
                </ul>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                <strong>Isso serve para:</strong> Criar ritmos mais interessantes e entender músicas mais complexas.
              </p>
            </div>
          )}

          {/* CONTEÚDO COMPLEMENTAR - Apenas para Intermediários */}
          {isIntermediateOrAdvanced(currentLevel) && (
            <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/30 text-purple-200">
                  Aprofundamento
                </span>
                <h4 className="text-lg font-bold text-white">🎼 Subdivisões e Síncopes</h4>
              </div>
              <p className="text-gray-300 mb-3 text-sm">
                Além de Straight e Swing, existem outros conceitos rítmicos importantes:
              </p>
              <div className="p-3 rounded bg-purple-500/10">
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>
                    <strong>Subdivisões:</strong> Dividir cada batida em partes menores (ex: 1-e-&-a). 
                    Permite criar ritmos mais complexos e interessantes.
                  </li>
                  <li>
                    <strong>Síncope:</strong> Acentuar notas que não estão na batida forte. 
                    Cria "surpresa" e movimento na música.
                  </li>
                  <li>
                    <strong>Polirritmia:</strong> Tocar dois ritmos diferentes ao mesmo tempo 
                    (ex: 3 contra 2). Usado em jazz e música clássica.
                  </li>
                </ul>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                <strong>Isso serve para:</strong> Criar ritmos mais interessantes e entender músicas mais complexas.
              </p>
            </div>
          )}

          {/* AÇÃO PRÁTICA IMEDIATA */}
          <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-green-400" />
              <h4 className="text-2xl font-bold text-white">🎸 Agora toque isso no violão</h4>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 1: Pratique Straight (ritmo reto)</p>
                <p className="text-sm mb-3">
                  Faça isso AGORA no seu violão:
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Toque a corda 6 (E grave) aberta 4 vezes, cada batida igual (1, 2, 3, 4)</li>
                  <li>Conte em voz alta: "um, dois, três, quatro" - cada palavra no mesmo ritmo</li>
                  <li>Repita até sentir que está perfeitamente regular, como um relógio</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Isso é Straight:</strong> Ritmo matemático, cada batida igual à outra.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 2: Pratique Swing (ritmo balançado)</p>
                <p className="text-sm mb-3">
                  Agora tente o Swing:
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Toque a mesma corda, mas agora com "balanço"</li>
                  <li>Conte: "um-e, dois-e, três-e, quatro-e" - o "e" fica um pouco atrasado</li>
                  <li>Imagine que está dançando - não é matemático, tem balanço natural</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Isso é Swing:</strong> Ritmo orgânico, com leve atraso que cria o "balanço".
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 3: Identifique em músicas</p>
                <p className="text-sm mb-3">
                  Escolha 3 músicas que você conhece e identifique:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Qual tem ritmo Straight? (rock, pop, samba)</li>
                  <li>Qual tem ritmo Swing? (jazz, blues, algumas bossas)</li>
                  <li>Tente tocar no mesmo feeling da música!</li>
                </ul>
              </div>
            </div>
          </div>

          {/* MECANISMO DE FIXAÇÃO: Exercícios Simples */}
          <div className="mt-6 space-y-4">
            <div className="p-5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-indigo-400" />
                <h4 className="text-lg font-bold text-white">Fixação: Teste seu conhecimento</h4>
              </div>
              
              <div className="space-y-4">
                <SimpleFixationExercise
                  question="Qual é a principal diferença entre ritmo Straight e Swing?"
                  options={[
                    "Straight é mais rápido que Swing",
                    "Straight é matemático/regular, Swing tem balanço natural",
                    "Swing usa mais instrumentos",
                    "Não há diferença"
                  ]}
                  correctAnswer={1}
                  explanation="Straight é perfeitamente regular (como um relógio), enquanto Swing tem um balanço natural com leve atraso que cria o 'swing'. Ambos são importantes em diferentes estilos musicais."
                />
                
                <SimpleFixationExercise
                  question="Qual estilo musical geralmente usa ritmo Straight?"
                  options={[
                    "Jazz e Blues",
                    "Rock, Pop e Samba",
                    "Apenas música clássica",
                    "Todos os estilos usam Swing"
                  ]}
                  correctAnswer={1}
                  explanation="Rock, Pop e Samba geralmente usam ritmo Straight (matemático e regular). Jazz e Blues usam mais o Swing (balançado)."
                />
                
                <SimpleFixationExercise
                  question="Por que é importante identificar o tipo de ritmo (Straight vs Swing) em uma música?"
                  options={[
                    "Para tocar mais rápido",
                    "Para tocar no 'feeling' certo da música",
                    "Para usar mais acordes",
                    "Não é importante"
                  ]}
                  correctAnswer={1}
                  explanation="Identificar o tipo de ritmo é essencial para tocar no 'feeling' certo. Tocar Straight em uma música Swing (ou vice-versa) soa errado, mesmo que as notas estejam corretas!"
                />
              </div>
            </div>
          </div>

          {/* CONCEITOS-CHAVE */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔑</span>
              <h4 className="text-lg font-bold text-white">Conceitos-Chave para Lembrar</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Straight:</strong> Ritmo matemático, regular (rock, pop, samba)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Swing:</strong> Ritmo balançado, orgânico (jazz, blues)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Dica:</strong> O ritmo é o primeiro erro que as pessoas percebem (você viu isso nos Fundamentos!)
                </p>
              </div>
            </div>
          </div>

          {/* LEMBRE-SE: Conexão com módulos anteriores */}
          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border-l-4 border-blue-500">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-blue-200 font-semibold mb-1">Lembre-se:</p>
                <p className="text-sm text-gray-300">
                  Você já aprendeu que o <strong className="text-white">ritmo</strong> é um dos 3 elementos fundamentais da música 
                  e é o <strong className="text-white">erro mais perceptível</strong>. Agora você está aprendendo os dois tipos principais de ritmo!
                </p>
              </div>
            </div>
          </div>

          {/* CONEXÃO COM PRÁTICA */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xl font-bold text-white">🎯 Esta teoria destrava treinos práticos</h4>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Agora que você entende Straight e Swing, você pode praticar:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/practice">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Treino de Ritmo</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Pratique batidas Straight e Swing com metrônomo
                  </p>
                </div>
              </Link>
              <Link href="/songs">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Tocar Músicas</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Aplique o feeling certo em músicas reais
                  </p>
                </div>
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              <strong className="text-emerald-400">💡 Dica:</strong> Saber identificar Straight vs Swing ajuda você a tocar no estilo certo de cada música!
            </p>
          </div>
        </div>
      </div>
    ),
  },
  
  // 5. ESCALAS APLICADAS - Melodias e solos
  {
    id: 'scales',
    title: 'Escalas Aplicadas',
    icon: Music,
    description: 'Aprenda como as escalas são construídas e como usá-las no violão',
    duration: '25 min',
    difficulty: 'intermediate',
    level: 'intermediate',
    prerequisites: ['fundamentals', 'fretboard-notes', 'chord-formation'],
    minAccuracy: 75,
    topics: ['Escala maior', 'Escala menor', 'Pentatônica', 'Modos gregos'],
    practicalApplication: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-lg font-bold text-white mb-3">🎸 Improvise com Escala Maior</h4>
          <p className="text-gray-300 mb-3 text-sm">
            Agora que você sabe a Escala Maior de Dó (C-D-E-F-G-A-B), use-a para improvisar:
          </p>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong className="text-green-400">1. Toque a escala:</strong> Pratique subindo e descendo. 
              <strong className="text-white"> Serve para:</strong> Memorizar as notas e treinar coordenação.</p>
            <p><strong className="text-green-400">2. Crie melodias:</strong> Toque notas da escala em ordem aleatória. 
              <strong className="text-white"> Serve para:</strong> Começar a improvisar sem errar muito.</p>
            <p><strong className="text-green-400">3. Use sobre acordes:</strong> Escala de C funciona sobre acorde C, F, G. 
              <strong className="text-white"> Serve para:</strong> Saber quais notas tocar quando alguém está tocando esses acordes.</p>
            <p><strong className="text-green-400">4. Experimente ritmos:</strong> Toque rápido, lento, com pausas. 
              <strong className="text-white"> Serve para:</strong> Criar variação e expressão no seu solo.</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <p className="text-xs text-gray-300">
            <strong className="text-purple-400">💡 Dica:</strong> Comece com a Escala Pentatônica Maior (C-D-E-G-A). 
            <strong className="text-white"> Isso serve para você conseguir:</strong> Improvisar mais fácil, 
            pois tem menos notas (5 em vez de 7) e soa bem sobre qualquer acorde maior!
          </p>
        </div>
      </div>
    ),
    content: (currentLevel: 'basic' | 'intermediate' | 'advanced') => (
      <div className="space-y-6">
        {/* INDICADOR: Esta teoria destrava treinos */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border-l-4 border-emerald-500 mb-6">
          <div className="flex items-start gap-3">
            <Play className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-200 font-semibold mb-1">Esta teoria destrava treinos práticos:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/scales">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Treino de Escalas
                  </span>
                </Link>
                <Link href="/practice">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Improvisação
                  </span>
                </Link>
              </div>
              <p className="text-xs text-emerald-300/80 mt-2">
                💡 Completar com 75% desbloqueia: Improvisação com Escalas
              </p>
            </div>
          </div>
        </div>

        <ScaleBuilder />
        
        <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10">
          <h3 className="text-2xl font-bold text-white mb-4">O que são Escalas?</h3>
          <p className="text-gray-300 mb-6">
            Escalas são <span className="text-[#06b6d4] font-semibold">grupos de notas que combinam entre si</span>, 
            como um "alfabeto musical". <strong className="text-white"> Isso serve para você conseguir:</strong> 
            Saber quais notas tocar em um solo, improvisar sem errar e entender por que algumas notas soam bem juntas 
            e outras não.
          </p>

          <div className="space-y-4">
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#06b6d4]/20 to-transparent border-l-4 border-[#06b6d4]">
              <h4 className="text-xl font-bold text-white mb-3">🎶 Escala Maior (som alegre)</h4>
              <p className="text-gray-300 mb-3">
                A escala mais comum! Som <span className="text-[#06b6d4] font-semibold">alegre e brilhante</span>.
                <strong className="text-white"> Isso serve para você conseguir:</strong> Tocar solos em músicas alegres, 
                improvisar sobre acordes maiores e entender a base da maioria das músicas populares.
              </p>
              <div className="p-3 rounded bg-[#06b6d4]/10 mb-3">
                <p className="text-sm text-gray-300 mb-2">
                  <span className="font-semibold">Padrão:</span> Tom - Tom - Semitom - Tom - Tom - Tom - Semitom
                  <span className="text-gray-400 text-xs ml-2">(Tom = 2 semitons, Semitom = 1 semitom)</span>
                </p>
                <p className="text-sm text-gray-300 mb-3">
                  <span className="font-semibold">Exemplo (Dó Maior):</span> C - D - E - F - G - A - B - C
                </p>
                <AudioPlayChordButton chordNotes={["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]} duration={0.3} sequential label="🎵 Ouvir Escala Maior" />
              </div>
              
              {/* AÇÃO PRÁTICA IMEDIATA - Escala Maior */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-xs font-semibold text-green-400 mb-2">🎸 Agora toque:</p>
                <p className="text-xs text-gray-300 mb-2">
                  <strong>1. Ouça</strong> a escala acima clicando no botão. <strong>2. Identifique</strong> o som alegre e brilhante. 
                  <strong> 3. Toque</strong> no violão: corda 5 (A), 3º traste (C) → 5º traste (D) → 7º traste (E) → corda 4 aberta (F).
                </p>
                <p className="text-xs text-gray-400">
                  <strong>Por quê?</strong> Ouvir antes de tocar ajuda seu cérebro a entender o som que você quer criar!
                </p>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-gradient-to-r from-[#8b5cf6]/20 to-transparent border-l-4 border-[#8b5cf6]">
              <h4 className="text-xl font-bold text-white mb-3">🎶 Escala Menor (som triste/melancólico)</h4>
              <p className="text-gray-300 mb-3">
                Som <span className="text-[#8b5cf6] font-semibold">melancólico e introspectivo</span>.
                <strong className="text-white"> Isso serve para você conseguir:</strong> Tocar solos em músicas tristes, 
                improvisar sobre acordes menores e criar melodias mais emocionais.
              </p>
              <div className="p-3 rounded bg-[#8b5cf6]/10 mb-3">
                <p className="text-sm text-gray-300 mb-2">
                  <span className="font-semibold">Padrão:</span> Tom - Semitom - Tom - Tom - Semitom - Tom - Tom
                </p>
                <p className="text-sm text-gray-300 mb-3">
                  <span className="font-semibold">Exemplo (Lá Menor):</span> A - B - C - D - E - F - G - A
                </p>
                <AudioPlayChordButton chordNotes={["A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4"]} duration={0.3} sequential label="🎵 Ouvir Escala Menor" />
              </div>
              
              {/* AÇÃO PRÁTICA IMEDIATA - Escala Menor */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-xs font-semibold text-green-400 mb-2">🎸 Agora toque:</p>
                <p className="text-xs text-gray-300 mb-2">
                  <strong>1. Ouça</strong> a escala acima e <strong>compare</strong> com a escala maior - perceba a diferença de "clima". 
                  <strong> 2. Identifique</strong> o som melancólico. <strong>3. Toque</strong> no violão: corda 5 aberta (A) → 2º traste (B) → 3º traste (C).
                </p>
                <p className="text-xs text-gray-400">
                  <strong>Dica:</strong> A diferença de apenas algumas notas muda completamente o "clima" - maior = alegre, menor = triste!
                </p>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-gradient-to-r from-[#10b981]/20 to-transparent border-l-4 border-[#10b981]">
              <h4 className="text-xl font-bold text-white mb-3">🎶 Escala Pentatônica (5 notas - mais fácil!)</h4>
              <p className="text-gray-300 mb-3">
                Apenas 5 notas! <span className="text-[#10b981] font-semibold">Fácil de usar e versátil</span>. 
                <strong className="text-white"> Isso serve para você conseguir:</strong> Começar a improvisar sem errar muito, 
                tocar solos de blues e rock, e entender escalas de forma mais simples.
              </p>
              <div className="p-3 rounded bg-[#10b981]/10 mb-3">
                <p className="text-sm text-gray-300 mb-3">
                  <span className="font-semibold">Exemplo (Pentatônica Menor de Lá):</span> A - C - D - E - G
                  <span className="text-gray-400 text-xs ml-2">(Menos notas = mais difícil errar!)</span>
                </p>
                <AudioPlayChordButton chordNotes={["A3", "C4", "D4", "E4", "G4"]} duration={0.3} sequential label="🎵 Ouvir Pentatônica" />
              </div>
              
              {/* AÇÃO PRÁTICA IMEDIATA - Pentatônica */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-xs font-semibold text-green-400 mb-2">🎸 Agora toque:</p>
                <p className="text-xs text-gray-300 mb-2">
                  <strong>1. Ouça</strong> a pentatônica acima - perceba como soa bem mesmo sendo simples! 
                  <strong> 2. Identifique</strong> que tem apenas 5 notas (mais fácil!). 
                  <strong> 3. Toque</strong> no violão: corda 5 aberta (A) → 3º traste (C) → 5º traste (D) → 7º traste (E) → corda 4, 2º traste (G).
                </p>
                <p className="text-xs text-gray-400">
                  <strong>Por quê?</strong> Com apenas 5 notas, é muito mais difícil errar. Perfeita para começar a improvisar!
                </p>
              </div>
            </div>
          </div>

          {/* AÇÃO PRÁTICA IMEDIATA */}
          <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-green-400" />
              <h4 className="text-2xl font-bold text-white">🎸 Agora toque isso no violão</h4>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 1: Toque a Escala Maior de Dó</p>
                <p className="text-sm mb-3">
                  Use o construtor acima para ver a escala, depois toque no violão. Faça isso AGORA:
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Comece na corda 5 (A), 3º traste = C (Dó)</li>
                  <li>Suba um tom: corda 5, 5º traste = D (Ré)</li>
                  <li>Suba um tom: corda 5, 7º traste = E (Mi)</li>
                  <li>Suba meio tom: corda 4 (D), 0 (aberta) = F (Fá)</li>
                  <li>Continue seguindo o padrão: Tom-Tom-Semitom-Tom-Tom-Tom-Semitom</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Dica:</strong> Use o construtor de escalas acima para ver todas as notas e ouvir o som!
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 2: Toque a Pentatônica (mais fácil!)</p>
                <p className="text-sm mb-3">
                  A Pentatônica tem apenas 5 notas - mais fácil de tocar:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Pentatônica Maior de C: C-D-E-G-A</li>
                  <li>Toque essas 5 notas em ordem, subindo e descendo</li>
                  <li>Experimente tocar rápido, lento, com pausas</li>
                </ul>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Por quê?</strong> Com menos notas, é mais difícil errar. Perfeito para começar a improvisar!
                </p>
              </div>
            </div>
          </div>

          {/* MECANISMO DE FIXAÇÃO: Exercícios Simples */}
          <div className="mt-6 space-y-4">
            <div className="p-5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-indigo-400" />
                <h4 className="text-lg font-bold text-white">Fixação: Teste seu conhecimento</h4>
              </div>
              
              <div className="space-y-4">
                <SimpleFixationExercise
                  question="Quantas notas tem a Escala Pentatônica?"
                  options={[
                    "7 notas (como a escala maior)",
                    "5 notas",
                    "12 notas (todas as notas)",
                    "3 notas"
                  ]}
                  correctAnswer={1}
                  explanation="A Pentatônica tem apenas 5 notas, por isso é mais fácil de usar e menos provável de errar. É perfeita para começar a improvisar!"
                />
                
                <SimpleFixationExercise
                  question="Qual é o padrão da Escala Maior?"
                  options={[
                    "Tom-Tom-Semitom-Tom-Tom-Tom-Semitom",
                    "Tom-Semitom-Tom-Tom-Semitom-Tom-Tom",
                    "Semitom-Tom-Tom-Semitom-Tom-Tom-Tom",
                    "Tom-Tom-Tom-Semitom-Tom-Tom-Semitom"
                  ]}
                  correctAnswer={0}
                  explanation="O padrão da Escala Maior é: Tom-Tom-Semitom-Tom-Tom-Tom-Semitom. Isso cria o som alegre e brilhante característico das escalas maiores!"
                />
                
                <SimpleFixationExercise
                  question="Por que a Pentatônica é mais fácil para iniciantes?"
                  options={[
                    "Tem mais notas que outras escalas",
                    "Tem apenas 5 notas - menos chance de errar",
                    "É mais rápida de tocar",
                    "Não precisa de dedilhado"
                  ]}
                  correctAnswer={1}
                  explanation="A Pentatônica tem apenas 5 notas (em vez de 7), então há menos chance de tocar uma nota errada. Por isso é perfeita para começar a improvisar!"
                />
              </div>
            </div>
          </div>

          {/* CONCEITOS-CHAVE */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔑</span>
              <h4 className="text-lg font-bold text-white">Conceitos-Chave para Lembrar</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Escala Maior:</strong> Padrão: Tom-Tom-Semitom-Tom-Tom-Tom-Semitom (som alegre)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Escala Menor:</strong> Padrão: Tom-Semitom-Tom-Tom-Semitom-Tom-Tom (som triste)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Pentatônica:</strong> Apenas 5 notas - mais fácil e versátil
                </p>
              </div>
            </div>
          </div>

          {/* LEMBRE-SE: Conexão com módulos anteriores */}
          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border-l-4 border-blue-500">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-blue-200 font-semibold mb-1">Lembre-se:</p>
                <p className="text-sm text-gray-300">
                  Você já aprendeu sobre <strong className="text-white">notas no braço</strong> e <strong className="text-white">acordes</strong>. 
                  As escalas são grupos de notas que você pode usar para criar <strong className="text-white">melodias</strong> 
                  (um dos 3 elementos fundamentais que você viu no início)!
                </p>
              </div>
            </div>
          </div>

          {/* CONEXÃO COM PRÁTICA */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xl font-bold text-white">🎯 Esta teoria destrava treinos práticos</h4>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Agora que você entende escalas, você pode praticar:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/scales">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Treino de Escalas</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Pratique escalas maiores, menores e pentatônicas
                  </p>
                </div>
              </Link>
              <Link href="/practice">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Improvisação com Escalas</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Use escalas para criar solos e improvisar
                  </p>
                </div>
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              <strong className="text-emerald-400">💡 Dica:</strong> Completar este módulo com 75% de precisão desbloqueia o treino de improvisação com escalas!
            </p>
          </div>
        </div>
      </div>
    ),
  },
  
  // 6. INTERVALOS (OUVINDO) - Desenvolver ouvido
  {
    id: 'intervals',
    title: 'Intervalos (Ouvindo)',
    icon: TrendingUp,
    description: 'Entenda a distância entre notas ouvindo e identificando intervalos',
    duration: '20 min',
    difficulty: 'intermediate',
    level: 'intermediate',
    prerequisites: ['fundamentals', 'fretboard-notes', 'scales'],
    minAccuracy: 75,
    topics: ['Intervalos maiores', 'Intervalos menores', 'Intervalos justos', 'Aplicação prática'],
    practicalApplication: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-lg font-bold text-white mb-3">🎸 Toque Intervalos no Violão</h4>
          <p className="text-gray-300 mb-3 text-sm">
            Agora que você entendeu intervalos, pratique tocando-os no violão:
          </p>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <strong className="text-green-400">3ª Maior (C → E):</strong>
              <p className="mt-1">Corda 5 (A) no 3º traste → Corda 4 (D) no 2º traste</p>
            </div>
            <div>
              <strong className="text-green-400">5ª Justa (C → G):</strong>
              <p className="mt-1">Corda 5 (A) no 3º traste → Corda 3 (G) aberta</p>
            </div>
            <div>
              <strong className="text-green-400">Oitava (C → C):</strong>
              <p className="mt-1">Corda 5 (A) no 3º traste → Corda 2 (B) no 1º traste</p>
            </div>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-xs text-gray-300">
            <strong className="text-blue-400">💡 Dica:</strong> Pratique identificando intervalos em músicas que você conhece. 
            <strong className="text-white"> Isso serve para você conseguir:</strong> Reconhecer notas pelo som, 
            tocar músicas de ouvido e desenvolver seu "ouvido musical" - uma das habilidades mais importantes para um músico!
          </p>
        </div>
      </div>
    ),
    content: (currentLevel: 'basic' | 'intermediate' | 'advanced') => (
      <div className="space-y-6">
        {/* INDICADOR: Esta teoria destrava treinos */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border-l-4 border-emerald-500 mb-6">
          <div className="flex items-start gap-3">
            <Play className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-200 font-semibold mb-1">Esta teoria destrava treinos práticos:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/practice">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Treino de Ouvido - Intervalos
                  </span>
                </Link>
                <Link href="/practice">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Toque Intervalos
                  </span>
                </Link>
              </div>
              <p className="text-xs text-emerald-300/80 mt-2">
                💡 Completar com 70% desbloqueia: Treino de Ouvido para Intervalos
              </p>
            </div>
          </div>
        </div>

        <IntervalBuilder />
        
        <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10">
          <h3 className="text-2xl font-bold text-white mb-4">O que são Intervalos?</h3>
          <p className="text-gray-300 mb-6">
            Intervalos são a <span className="text-[#06b6d4] font-semibold">distância entre duas notas</span>. 
            <strong className="text-white"> Isso serve para você conseguir:</strong> Reconhecer notas pelo som (treinar ouvido), 
            entender como acordes são feitos e saber quais notas tocar juntas para criar diferentes sensações (alegre, triste, tenso).
          </p>

          <div className="space-y-4">
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#10b981]/20 to-transparent border-l-4 border-[#10b981]">
              <h4 className="text-xl font-bold text-white mb-3">🎵 Intervalos Principais</h4>
              <div className="space-y-3">
                <div className="p-3 rounded bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white">Segunda Menor</span>
                    <span className="text-sm text-gray-400">1 semitom (meio tom)</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Som:</strong> Tenso, como no tema de "Tubarão" (dó-dó#). 
                    <strong className="text-white"> Serve para:</strong> Criar suspense e tensão na música.
                  </p>
                  <AudioPlayChordButton chordNotes={["C4", "C#4"]} duration={0.5} label="🎵 Ouvir 2ª Menor" />
                  <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-gray-300">
                      <strong className="text-green-400">🎸 Toque:</strong> Corda 5, 3º traste (C) → 4º traste (C#). 
                      <strong> Identifique</strong> a tensão - soa como suspense!
                    </p>
                  </div>
                </div>
                
                <div className="p-3 rounded bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white">Terça Maior</span>
                    <span className="text-sm text-gray-400">4 semitons</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Som:</strong> Alegre e brilhante. 
                    <strong className="text-white"> Serve para:</strong> Formar acordes maiores (C, G, F, etc.) e criar sensação de felicidade.
                  </p>
                  <AudioPlayChordButton chordNotes={["C4", "E4"]} duration={0.5} label="🎵 Ouvir 3ª Maior" />
                  <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-gray-300">
                      <strong className="text-green-400">🎸 Toque:</strong> Corda 5, 3º traste (C) → Corda 4, 2º traste (E). 
                      <strong> Identifique</strong> o som alegre - é a base dos acordes maiores!
                    </p>
                  </div>
                </div>
                
                <div className="p-3 rounded bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white">Quinta Justa</span>
                    <span className="text-sm text-gray-400">7 semitons</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Som:</strong> Estável e poderoso. 
                    <strong className="text-white"> Serve para:</strong> Criar power chords (muito usados no rock) e dar força aos acordes.
                  </p>
                  <AudioPlayChordButton chordNotes={["C4", "G4"]} duration={0.5} label="🎵 Ouvir 5ª Justa" />
                  <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-gray-300">
                      <strong className="text-green-400">🎸 Toque:</strong> Corda 5, 3º traste (C) → Corda 3 aberta (G). 
                      <strong> Identifique</strong> o som poderoso - é o power chord do rock!
                    </p>
                  </div>
                </div>
                
                <div className="p-3 rounded bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white">Oitava</span>
                    <span className="text-sm text-gray-400">12 semitons</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Som:</strong> Mesma nota, só que mais aguda ou grave. 
                    <strong className="text-white"> Serve para:</strong> Encontrar a mesma nota em outro lugar do braço e criar som mais cheio.
                  </p>
                  <AudioPlayChordButton chordNotes={["C4", "C5"]} duration={0.5} label="🎵 Ouvir Oitava" />
                  <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-gray-300">
                      <strong className="text-green-400">🎸 Toque:</strong> Corda 5, 3º traste (C) → Corda 2, 1º traste (C). 
                      <strong> Identifique</strong> que é a mesma nota, só mais aguda - isso ajuda a encontrar notas em vários lugares!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navegação Contextual */}
            <ContextualNavigation
              type="ear-training"
              title="Praticar Intervalos"
              description="Aplique o que aprendeu identificando intervalos pelo som"
              practicePath="/practice"
              className="mb-6"
            />

            <div className="p-5 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/30">
              <h4 className="text-lg font-bold text-white mb-3">🎯 Como Memorizar</h4>
              <p className="text-gray-300 mb-2">
                Associe intervalos com músicas que você conhece! 
                <strong className="text-white"> Isso serve para você conseguir:</strong> Reconhecer intervalos pelo som rapidamente.
              </p>
              <p className="text-sm text-gray-300">
                <strong>Exemplo:</strong> <span className="font-semibold">Quinta Justa</span> = início de "Parabéns pra Você" (Pa-ra-béns). 
                Quando ouvir esse som, você já sabe que é uma quinta justa!
              </p>
            </div>

            {/* CONTEÚDO COMPLEMENTAR - Apenas para Intermediários */}
            {isIntermediateOrAdvanced(currentLevel) && (
              <div className="p-5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/30 text-purple-200">
                    Aprofundamento
                  </span>
                  <h4 className="text-lg font-bold text-white">🎼 Intervalos Compostos e Inversões</h4>
                </div>
                <p className="text-gray-300 mb-3 text-sm">
                  Além dos intervalos básicos, existem conceitos mais avançados:
                </p>
                <div className="p-3 rounded bg-purple-500/10">
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>
                      <strong>Intervalos Compostos:</strong> Maiores que uma oitava (ex: 9ª, 11ª, 13ª). 
                      Usados em acordes estendidos (C9, Cmaj7, etc.).
                    </li>
                    <li>
                      <strong>Inversão de Intervalos:</strong> Trocar a ordem das notas (ex: C-E vira E-C). 
                      A soma sempre dá 9 (3ª maior invertida = 6ª menor).
                    </li>
                    <li>
                      <strong>Intervalos Aumentados/Diminutos:</strong> Variações dos intervalos justos e maiores/menores. 
                      Criam tensão e movimento harmônico.
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Isso serve para:</strong> Entender acordes mais complexos e criar harmonias mais sofisticadas.
                </p>
              </div>
            )}
          </div>

          {/* AÇÃO PRÁTICA IMEDIATA */}
          <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-green-400" />
              <h4 className="text-2xl font-bold text-white">🎸 Agora toque isso no violão</h4>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 1: Toque intervalos no violão</p>
                <p className="text-sm mb-3">
                  Use o construtor acima para ouvir, depois toque no violão. Faça isso AGORA:
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li><strong>3ª Maior (C → E):</strong> Corda 5, 3º traste (C) → Corda 4, 2º traste (E). Toque as duas notas juntas!</li>
                  <li><strong>5ª Justa (C → G):</strong> Corda 5, 3º traste (C) → Corda 3 aberta (G). Toque as duas notas juntas!</li>
                  <li><strong>Oitava (C → C):</strong> Corda 5, 3º traste (C) → Corda 2, 1º traste (C). Toque as duas notas juntas!</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Dica:</strong> Use o construtor de intervalos acima para ouvir cada intervalo antes de tocar!
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 2: Identifique intervalos em músicas</p>
                <p className="text-sm mb-3">
                  Escolha uma música que você conhece e tente identificar:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>O início da música - que intervalo é? (geralmente 3ª ou 5ª)</li>
                  <li>Tente tocar esse intervalo no violão</li>
                  <li>Compare com o som da música original</li>
                </ul>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Por quê?</strong> Isso treina seu ouvido - uma das habilidades mais importantes para um músico!
                </p>
              </div>
            </div>
          </div>

          {/* MECANISMO DE FIXAÇÃO: Exercício Simples */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-indigo-400" />
              <h4 className="text-lg font-bold text-white">Fixação: Teste seu conhecimento</h4>
            </div>
            <SimpleFixationExercise
              question="Quantos semitons tem uma Terça Maior?"
              options={[
                "2 semitons",
                "3 semitons",
                "4 semitons",
                "5 semitons"
              ]}
              correctAnswer={2}
              explanation="A Terça Maior tem 4 semitons. Por exemplo, de C (Dó) até E (Mi) = 4 semitons. Essa é a base dos acordes maiores que você já aprendeu!"
            />
          </div>

          {/* CONCEITOS-CHAVE */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔑</span>
              <h4 className="text-lg font-bold text-white">Conceitos-Chave para Lembrar</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Intervalo:</strong> Distância entre duas notas
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">3ª Maior:</strong> 4 semitons - base dos acordes maiores
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">5ª Justa:</strong> 7 semitons - usada em power chords
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Oitava:</strong> 12 semitons - mesma nota, mais aguda ou grave
                </p>
              </div>
            </div>
          </div>

          {/* LEMBRE-SE: Conexão com módulos anteriores */}
          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border-l-4 border-blue-500">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-blue-200 font-semibold mb-1">Lembre-se:</p>
                <p className="text-sm text-gray-300">
                  Você já aprendeu que <strong className="text-white">acordes são formados por intervalos</strong> (3ª e 5ª). 
                  Agora você está aprendendo a reconhecer esses intervalos pelo som - isso ajuda a entender melhor os acordes!
                </p>
              </div>
            </div>
          </div>

          {/* CONEXÃO COM PRÁTICA */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xl font-bold text-white">🎯 Esta teoria destrava treinos práticos</h4>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Agora que você entende intervalos, você pode praticar:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/practice">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Treino de Ouvido - Intervalos</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Identifique intervalos pelo som
                  </p>
                </div>
              </Link>
              <Link href="/practice">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Toque Intervalos no Violão</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Pratique tocar intervalos no braço
                  </p>
                </div>
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              <strong className="text-emerald-400">💡 Dica:</strong> Completar este módulo com 70% de precisão desbloqueia o treino de ouvido para intervalos!
            </p>
          </div>
        </div>
      </div>
    ),
    quiz: [
      {
        question: 'Quantos semitons tem uma Terça Maior?',
        options: ['2 semitons', '3 semitons', '4 semitons', '5 semitons'],
        correctAnswer: 2,
        explanation: 'A Terça Maior tem 4 semitons. Exemplo prático: de Dó (C) até Mi (E) = 4 semitons. Isso serve para formar acordes maiores (C, G, F, etc.).'
      },
      {
        question: 'Qual intervalo é conhecido como "power chord" no rock?',
        options: ['Terça Maior', 'Quinta Justa', 'Oitava', 'Segunda Menor'],
        correctAnswer: 1,
        explanation: 'A Quinta Justa (7 semitons) é a base dos power chords, muito usados no rock. Tem som poderoso e estável. Isso serve para criar acordes fortes sem a terça (maior ou menor).'
      },
      {
        question: 'Qual intervalo cria uma sensação de tensão, como no tema de "Tubarão"?',
        options: ['Oitava', 'Quinta Justa', 'Segunda Menor', 'Terça Maior'],
        correctAnswer: 2,
        explanation: 'A Segunda Menor (1 semitom) cria tensão. O tema de "Tubarão" usa esse intervalo (dó-dó#) para criar suspense. Isso serve para criar momentos de tensão na música.'
      },
      {
        question: 'Quantos semitons separam uma nota de sua oitava?',
        options: ['7 semitons', '10 semitons', '12 semitons', '14 semitons'],
        correctAnswer: 2,
        explanation: 'Uma oitava tem 12 semitons. É a mesma nota, só que mais aguda ou grave. Isso serve para encontrar a mesma nota em outro lugar do braço e criar som mais cheio.'
      },
      {
        question: 'Qual intervalo forma a base dos acordes maiores?',
        options: ['Segunda Maior', 'Terça Maior', 'Quinta Justa', 'Sétima Maior'],
        correctAnswer: 1,
        explanation: 'A Terça Maior (4 semitons) é fundamental nos acordes maiores, dando o som "alegre" característico. Isso serve para diferenciar acordes maiores (alegres) de menores (tristes).'
      }
    ],
  },
  
  // 7. CAMPO HARMÔNICO APLICADO - Progressões e relações
  {
    id: 'progressions',
    title: 'Campo Harmônico Aplicado',
    icon: Waves,
    description: 'Aprenda a encadear acordes e criar progressões musicais reais',
    duration: '30 min',
    difficulty: 'intermediate',
    level: 'intermediate',
    prerequisites: ['chord-formation', 'scales'],
    minAccuracy: 75,
    topics: ['Função harmônica', 'Progressões comuns', 'Análise', 'Composição'],
    content: (currentLevel: 'basic' | 'intermediate' | 'advanced') => (
      <div className="space-y-6">
        {/* INDICADOR: Esta teoria destrava treinos */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border-l-4 border-emerald-500 mb-6">
          <div className="flex items-start gap-3">
            <Play className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-200 font-semibold mb-1">Esta teoria destrava treinos práticos:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/practice">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Treino de Troca de Acordes
                  </span>
                </Link>
                <Link href="/practice">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Treino de Ouvido - Progressões
                  </span>
                </Link>
                <Link href="/songs">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Tocar Músicas
                  </span>
                </Link>
              </div>
              <p className="text-xs text-emerald-300/80 mt-2">
                💡 Completar com 75% desbloqueia: Treino de Ouvido para Progressões
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10">
          <h3 className="text-2xl font-bold text-white mb-4">Campo Harmônico e Progressões</h3>
          <p className="text-gray-300 mb-6">
            Progressões são <span className="text-[#06b6d4] font-semibold">sequências de acordes</span> que criam movimento na música. 
            <strong className="text-white"> Isso serve para você conseguir:</strong> Acompanhar músicas conhecendo os acordes que vêm depois, 
            entender por que algumas sequências de acordes são tão comuns e criar suas próprias músicas.
          </p>

          <div className="mb-6">
            <ProgressionBuilder />
          </div>

          <div className="space-y-4 mt-6">
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#10b981]/20 to-transparent border-l-4 border-[#10b981]">
              <h4 className="text-xl font-bold text-white mb-3">🎯 Função dos Acordes (o que cada um faz)</h4>
              <p className="text-gray-300 mb-3 text-sm">
                Cada acorde tem uma "função" - um papel na música. 
                <strong className="text-white"> Isso serve para você conseguir:</strong> Saber qual acorde vem depois e entender o "caminho" da música.
              </p>
              <div className="space-y-3 text-gray-300">
                <div>
                  <strong className="text-green-400">Tônica (I, vi):</strong> O "casa" - sensação de repouso e estabilidade. 
                  É para onde a música quer voltar.
                </div>
                <div>
                  <strong className="text-blue-400">Subdominante (IV, ii):</strong> O "passeio" - afasta da tônica, prepara para voltar. 
                  Cria movimento.
                </div>
                <div>
                  <strong className="text-amber-400">Dominante (V, vii°):</strong> O "tensão" - cria vontade de voltar para a tônica. 
                  É como uma pergunta que precisa de resposta.
                </div>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-gradient-to-r from-[#8b5cf6]/20 to-transparent border-l-4 border-[#8b5cf6]">
              <h4 className="text-xl font-bold text-white mb-3">💡 Progressões Comuns (que você já ouviu!)</h4>
              <p className="text-gray-300 mb-3 text-sm">
                <strong className="text-white">Isso serve para você conseguir:</strong> Reconhecer essas progressões em músicas famosas 
                e tocar milhares de músicas conhecendo apenas alguns padrões.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li><strong>I-IV-V:</strong> Blues clássico (C-F-G). Usada em centenas de músicas de blues e rock.</li>
                <li><strong>I-V-vi-IV:</strong> Pop (C-G-Am-F). A progressão mais famosa do pop! "Let It Be", "No Woman No Cry", etc.</li>
                {isIntermediateOrAdvanced(currentLevel) && (
                  <>
                    <li><strong>ii-V-I:</strong> Jazz (Dm7-G7-Cmaj7). Base do jazz. "Autumn Leaves" usa isso.</li>
                    <li><strong>I-vi-IV-V:</strong> Doo-wop (C-Am-F-G). "Stand By Me", "Earth Angel" e muitas outras.</li>
                  </>
                )}
              </ul>
            </div>

            {/* CONTEÚDO COMPLEMENTAR - Apenas para Intermediários */}
            {isIntermediateOrAdvanced(currentLevel) && (
              <div className="p-5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/30 text-purple-200">
                    Aprofundamento
                  </span>
                  <h4 className="text-lg font-bold text-white">🎹 Substituições e Extensões Harmônicas</h4>
                </div>
                <p className="text-gray-300 mb-3 text-sm">
                  Técnicas avançadas para criar progressões mais interessantes:
                </p>
                <div className="p-3 rounded bg-purple-500/10">
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>
                      <strong>Substituição de Trítono:</strong> Trocar V7 por outro acorde dominante (ex: G7 por Db7). 
                      Mantém a função dominante com som diferente.
                    </li>
                    <li>
                      <strong>Acordes de Empréstimo Modal:</strong> Usar acordes de outros modos da mesma tônica 
                      (ex: bVII, bVI em progressões maiores). Cria cores diferentes.
                    </li>
                    <li>
                      <strong>Progressões Secundárias:</strong> Criar "mini-progressões" dentro da progressão principal. 
                      Usado em jazz e música clássica.
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Isso serve para:</strong> Criar harmonias mais sofisticadas e entender músicas mais complexas.
                </p>
              </div>
            )}
          </div>

          {/* AÇÃO PRÁTICA IMEDIATA */}
          <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-green-400" />
              <h4 className="text-2xl font-bold text-white">🎸 Agora toque isso no violão</h4>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 1: Toque a progressão I-V-vi-IV (C-G-Am-F)</p>
                <p className="text-sm mb-3">
                  Use o construtor acima para ver a progressão, depois toque no violão. Faça isso AGORA:
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Toque <strong>C</strong> (4 batidas) - sensação de "casa"</li>
                  <li>Toque <strong>G</strong> (4 batidas) - sensação de "tensão"</li>
                  <li>Toque <strong>Am</strong> (4 batidas) - sensação de "passeio"</li>
                  <li>Toque <strong>F</strong> (4 batidas) - prepara para voltar</li>
                  <li>Repita várias vezes e sinta o "caminho" da música!</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Dica:</strong> Use o construtor de progressões acima para ouvir a progressão completa!
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 2: Toque a progressão de Blues (C-F-G)</p>
                <p className="text-sm mb-3">
                  A progressão mais simples e poderosa:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Toque <strong>C</strong> (4 batidas)</li>
                  <li>Toque <strong>F</strong> (4 batidas)</li>
                  <li>Toque <strong>G</strong> (4 batidas)</li>
                  <li>Volte para <strong>C</strong> e repita</li>
                </ul>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Por quê?</strong> Essa progressão é usada em MILHARES de músicas. Se você souber tocar isso, 
                  já consegue acompanhar muitas músicas!
                </p>
              </div>
            </div>
          </div>

          {/* MECANISMO DE FIXAÇÃO: Exercícios Simples */}
          <div className="mt-6 space-y-4">
            <div className="p-5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-indigo-400" />
                <h4 className="text-lg font-bold text-white">Fixação: Teste seu conhecimento</h4>
              </div>
              
              <div className="space-y-4">
                <SimpleFixationExercise
                  question="Qual é a função do acorde V (dominante) em uma progressão?"
                  options={[
                    "Criar sensação de repouso",
                    "Criar tensão que quer resolver para a tônica",
                    "Preparar para afastar da tônica",
                    "Não tem função específica"
                  ]}
                  correctAnswer={1}
                  explanation="O acorde V (dominante) cria tensão que naturalmente quer resolver para a tônica (I). É como uma pergunta que precisa de resposta - por isso progressões V-I são tão fortes!"
                />
                
                <SimpleFixationExercise
                  question="Qual progressão é conhecida como 'a progressão mais famosa do pop'?"
                  options={[
                    "I-IV-V (C-F-G)",
                    "I-V-vi-IV (C-G-Am-F)",
                    "ii-V-I (Dm-G-C)",
                    "I-vi-IV-V (C-Am-F-G)"
                  ]}
                  correctAnswer={1}
                  explanation="A progressão I-V-vi-IV (C-G-Am-F) é usada em centenas de músicas pop famosas como 'Let It Be', 'No Woman No Cry' e muitas outras!"
                />
                
                <SimpleFixationExercise
                  question="Qual acorde cria sensação de 'casa' ou repouso em uma progressão?"
                  options={[
                    "O acorde V (dominante)",
                    "O acorde I (tônica)",
                    "O acorde IV (subdominante)",
                    "O acorde vi (relativa menor)"
                  ]}
                  correctAnswer={1}
                  explanation="O acorde I (tônica) cria sensação de 'casa' - é para onde a música quer voltar. É o ponto de repouso e estabilidade na progressão!"
                />
              </div>
            </div>
          </div>

          {/* CONCEITOS-CHAVE */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔑</span>
              <h4 className="text-lg font-bold text-white">Conceitos-Chave para Lembrar</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Tônica (I):</strong> Sensação de "casa" - repouso e estabilidade
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Subdominante (IV):</strong> Sensação de "passeio" - afasta da tônica
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Dominante (V):</strong> Sensação de "tensão" - quer voltar para tônica
                </p>
              </div>
            </div>
          </div>

          {/* LEMBRE-SE: Conexão com módulos anteriores */}
          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border-l-4 border-blue-500">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-blue-200 font-semibold mb-1">Lembre-se:</p>
                <p className="text-sm text-gray-300">
                  Você já aprendeu sobre <strong className="text-white">acordes</strong> (como são formados) e 
                  <strong className="text-white"> escalas</strong> (grupos de notas). As progressões são sequências de acordes 
                  que criam movimento - isso é a <strong className="text-white">harmonia</strong> em ação!
                </p>
              </div>
            </div>
          </div>

          {/* CONEXÃO COM PRÁTICA */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xl font-bold text-white">🎯 Esta teoria destrava treinos práticos</h4>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Agora que você entende progressões harmônicas, você pode praticar:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/practice">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Treino de Troca de Acordes</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Pratique progressões reais (C-G-Am-F, etc.)
                  </p>
                </div>
              </Link>
              <Link href="/practice">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Treino de Ouvido - Progressões</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Identifique progressões em músicas reais
                  </p>
                </div>
              </Link>
            </div>
            <div className="mt-3">
              <Link href="/songs">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Tocar Músicas Completas</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Aplique progressões em músicas reais
                  </p>
                </div>
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              <strong className="text-emerald-400">💡 Dica:</strong> Completar este módulo com 75% de precisão desbloqueia o treino de ouvido para progressões!
            </p>
          </div>
        </div>
      </div>
    ),
  },
  
  {
    id: 'circle-of-fifths',
    title: 'Círculo das Quintas',
    icon: Music,
    description: 'Entenda as relações entre tonalidades e armaduras de clave',
    duration: '15 min',
    difficulty: 'intermediate',
    level: 'advanced',
    prerequisites: ['scales', 'progressions'],
    minAccuracy: 80,
    topics: ['Tonalidades', 'Armaduras', 'Relativas', 'Modulação'],
    content: (currentLevel: 'basic' | 'intermediate' | 'advanced') => (
      <div className="space-y-6">
        {/* INDICADOR: Esta teoria destrava treinos */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border-l-4 border-emerald-500 mb-6">
          <div className="flex items-start gap-3">
            <Play className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-200 font-semibold mb-1">Esta teoria destrava treinos práticos:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/songs">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Transpor Músicas
                  </span>
                </Link>
                <Link href="/practice">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer">
                    Criar Progressões
                  </span>
                </Link>
              </div>
              <p className="text-xs text-emerald-300/80 mt-2">
                💡 Use o círculo para entender relações entre tonalidades e criar música!
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10">
          <h3 className="text-2xl font-bold text-white mb-4">O Círculo das Quintas</h3>
          <p className="text-gray-300 mb-6">
            O <span className="text-[#06b6d4] font-semibold">Círculo das Quintas</span> é um "mapa" que mostra como todas as tonalidades se relacionam. 
            <strong className="text-white"> Isso serve para você conseguir:</strong> Saber quais acordes combinam, 
            entender por que algumas músicas mudam de tom (modulação) e encontrar escalas relacionadas rapidamente.
          </p>

          {/* CONTEÚDO ESSENCIAL - Visível para todos */}
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs text-gray-300">
              <strong className="text-blue-400">💡 Para Iniciantes:</strong> Foque em entender que acordes próximos no círculo combinam bem. 
              Isso já é suficiente para tocar muitas músicas!
            </p>
          </div>

          <div className="mb-6">
            <CircleOfFifths interactive={true} showChords={true} />
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#06b6d4]/20 to-transparent border-l-4 border-[#06b6d4]">
              <h4 className="text-xl font-bold text-white mb-3">🎯 Como Funciona?</h4>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li><strong>Sentido horário:</strong> Cada passo = quinta acima (C → G → D → A...). 
                  <strong className="text-white"> Serve para:</strong> Encontrar acordes que combinam bem.</li>
                <li><strong>Sentido anti-horário:</strong> Cada passo = quarta acima (C → F → Bb → Eb...). 
                  <strong className="text-white"> Serve para:</strong> Encontrar acordes relacionados na direção oposta.</li>
                <li><strong>Relativas:</strong> Cada maior tem uma menor "irmã" (C ↔ Am, G ↔ Em). 
                  <strong className="text-white"> Serve para:</strong> Usar a mesma escala em acordes maiores e menores relacionados.</li>
                <li><strong>Armaduras:</strong> Quanto mais longe do C, mais sustenidos (#) ou bemóis (b) a escala tem. 
                  <strong className="text-white"> Serve para:</strong> Saber quais notas tocar em cada tonalidade.</li>
              </ul>
            </div>

            <div className="p-5 rounded-lg bg-gradient-to-r from-[#10b981]/20 to-transparent border-l-4 border-[#10b981]">
              <h4 className="text-xl font-bold text-white mb-3">💡 Como Usar na Prática</h4>
              <ul className="text-gray-300 space-y-2">
                <li><strong>Mudar de tom (modulação):</strong> Tonalidades vizinhas no círculo são fáceis de mudar. 
                  <strong className="text-white"> Serve para:</strong> Transpor músicas para tons mais fáceis de tocar.</li>
                <li><strong>Progressões fortes:</strong> Movimento por quintas (V → I) é mais forte. 
                  <strong className="text-white"> Serve para:</strong> Criar progressões que "resolvem" bem.</li>
                {isIntermediateOrAdvanced(currentLevel) && (
                  <>
                    <li><strong>Criar músicas:</strong> Escolha tonalidades próximas no círculo para transições suaves. 
                      <strong className="text-white"> Serve para:</strong> Compor sem criar "choques" harmônicos.</li>
                    <li><strong>Analisar músicas:</strong> Identifique relações entre acordes usando o círculo. 
                      <strong className="text-white"> Serve para:</strong> Entender por que algumas músicas soam bem.</li>
                  </>
                )}
              </ul>
            </div>

            {/* CONTEÚDO COMPLEMENTAR - Apenas para Intermediários */}
            {isIntermediateOrAdvanced(currentLevel) && (
              <div className="p-5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/30 text-purple-200">
                    Aprofundamento
                  </span>
                  <h4 className="text-lg font-bold text-white">🎹 Modulação e Relações Avançadas</h4>
                </div>
                <p className="text-gray-300 mb-3 text-sm">
                  Técnicas avançadas usando o Círculo das Quintas:
                </p>
                <div className="p-3 rounded bg-purple-500/10">
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>
                      <strong>Modulação por Terça:</strong> Mudar para tonalidade relativa (ex: C → Am). 
                      Mantém as mesmas notas, apenas muda a tônica.
                    </li>
                    <li>
                      <strong>Modulação Cromática:</strong> Mudar para tonalidade meio tom acima/abaixo. 
                      Cria efeito dramático.
                    </li>
                    <li>
                      <strong>Análise de Armaduras:</strong> Usar o círculo para identificar quantos sustenidos/bemóis 
                      cada tonalidade tem, facilitando leitura de partituras.
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Isso serve para:</strong> Compor músicas mais complexas e entender modulações em músicas avançadas.
                </p>
              </div>
            )}
          </div>

          {/* AÇÃO PRÁTICA IMEDIATA */}
          <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-green-400" />
              <h4 className="text-2xl font-bold text-white">🎸 Agora toque isso no violão</h4>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 1: Explore tonalidades relacionadas</p>
                <p className="text-sm mb-3">
                  Use o círculo acima e seu violão. Faça isso AGORA:
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Toque a progressão <strong>C-G-Am-F</strong> (em Dó)</li>
                  <li>Agora toque a mesma progressão, mas em <strong>G</strong>: <strong>G-D-Em-C</strong></li>
                  <li>Compare os dois - soam parecidos, mas em tons diferentes!</li>
                  <li>Use o círculo para ver que G está ao lado de C (relacionadas!)</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Dica:</strong> Tonalidades vizinhas no círculo são fáceis de trocar - perfeito para transpor músicas!
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-semibold text-white mb-2">Ação 2: Encontre acordes relacionados</p>
                <p className="text-sm mb-3">
                  Escolha um acorde (ex: C) e encontre seus "vizinhos" no círculo:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>No círculo, C está entre <strong>F</strong> (esquerda) e <strong>G</strong> (direita)</li>
                  <li>Toque a progressão <strong>F-C-G</strong> - soa natural!</li>
                  <li>Isso é porque F e G são "vizinhos" de C no círculo</li>
                </ul>
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Por quê?</strong> Acordes vizinhos no círculo combinam bem - use isso para criar suas próprias progressões!
                </p>
              </div>
            </div>
          </div>

          {/* MECANISMO DE FIXAÇÃO: Exercício Simples */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-indigo-400" />
              <h4 className="text-lg font-bold text-white">Fixação: Teste seu conhecimento</h4>
            </div>
            <SimpleFixationExercise
              question="No Círculo das Quintas, tonalidades vizinhas (ex: C e G) são fáceis de trocar porque:"
              options={[
                "Têm o mesmo número de notas",
                "São relacionadas por quintas - compartilham muitas notas",
                "Têm o mesmo som",
                "Não há diferença entre elas"
              ]}
              correctAnswer={1}
              explanation="Tonalidades vizinhas no círculo são relacionadas por quintas e compartilham muitas notas. Por isso, é fácil transpor músicas entre elas - perfeito para adaptar músicas para tons mais fáceis de tocar!"
            />
          </div>

          {/* CONCEITOS-CHAVE */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔑</span>
              <h4 className="text-lg font-bold text-white">Conceitos-Chave para Lembrar</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Círculo das Quintas:</strong> Mapa que mostra relações entre tonalidades
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Tonalidades vizinhas:</strong> Fáceis de trocar (ex: C ↔ G)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Relativas:</strong> Cada maior tem uma menor "irmã" (ex: C ↔ Am)
                </p>
              </div>
            </div>
          </div>

          {/* LEMBRE-SE: Conexão com módulos anteriores */}
          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border-l-4 border-blue-500">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-blue-200 font-semibold mb-1">Lembre-se:</p>
                <p className="text-sm text-gray-300">
                  Você já aprendeu sobre <strong className="text-white">escalas</strong>, <strong className="text-white">acordes</strong> e 
                  <strong className="text-white"> progressões</strong>. O Círculo das Quintas conecta tudo isso - 
                  mostra como escalas, acordes e progressões se relacionam entre diferentes tonalidades!
                </p>
              </div>
            </div>
          </div>

          {/* CONEXÃO COM PRÁTICA */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xl font-bold text-white">🎯 Esta teoria destrava treinos práticos</h4>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Agora que você entende o Círculo das Quintas, você pode:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/songs">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Transpor Músicas</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Use o círculo para mudar músicas para tons mais fáceis
                  </p>
                </div>
              </Link>
              <Link href="/practice">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Criar Progressões</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Use relações do círculo para criar suas próprias progressões
                  </p>
                </div>
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              <strong className="text-emerald-400">💡 Dica:</strong> O Círculo das Quintas é uma ferramenta poderosa para entender e criar música!
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function Theory() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TheoryModule | null>(null);

  // Parar todo áudio quando navegar entre módulos
  useEffect(() => {
    if (selectedModule !== null) {
      // Parar áudio ao mudar de módulo
      try {
        unifiedAudioService.stopAll();
      } catch (error) {
        console.error('Erro ao parar áudio na navegação:', error);
      }
    }
  }, [selectedModule]);
  const [showQuiz, setShowQuiz] = useState(false);
  const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();
  const { user } = useUserStore();
  const {
    currentLevel,
    isModuleUnlocked,
    completeModule,
    getMissingRequirements,
  } = useTheoryProgressionStore();
  
  const { checkAndUnlockFromTheory } = usePracticeUnlockStore();
  
  const userName = user?.name || "Usuário";
  
  // Filtrar módulos por nível e desbloqueio
  const availableModules = THEORY_MODULES.filter(module => {
    // Verificar se está no nível correto
    if (module.level === 'advanced' && currentLevel !== 'advanced') return false;
    if (module.level === 'intermediate' && currentLevel === 'basic') return false;
    
    // Verificar desbloqueio
    return isModuleUnlocked(module.id, module.prerequisites, module.minAccuracy);
  });
  
  const lockedModules = THEORY_MODULES.filter(module => {
    return !isModuleUnlocked(module.id, module.prerequisites, module.minAccuracy);
  });

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
            <Breadcrumbs />
            {/* Header */}
            <header>
              <h1 className="text-4xl font-bold text-white mb-2">📚 Teoria Musical</h1>
              <p className="text-gray-400">Aprenda os fundamentos da música de forma prática e visual</p>
            </header>

            {selectedModule ? (
              <div className="space-y-6">
                <Button
                  onClick={() => setSelectedModule(null)}
                  variant="outline"
                  className="bg-transparent border-white/20 text-gray-300 hover:bg-white/5"
                >
                  ← Voltar aos Módulos
                </Button>

                <Card className="p-8 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#a855f7]">
                      <selectedModule.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">{selectedModule.title}</h2>
                      <p className="text-gray-400">{selectedModule.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mb-8 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Activity className="w-4 h-4" />
                      <span>{selectedModule.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedModule.difficulty === 'beginner' ? 'bg-[#10b981]/20 text-[#10b981]' :
                        selectedModule.difficulty === 'intermediate' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                        'bg-[#ef4444]/20 text-[#ef4444]'
                      }`}>
                        {selectedModule.difficulty === 'beginner' ? 'Iniciante' :
                         selectedModule.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                      </span>
                    </div>
                  </div>

                  {showQuiz && selectedModule.quiz ? (
                    <TheoryQuiz
                      moduleId={selectedModule.id}
                      moduleTitle={selectedModule.title}
                      questions={selectedModule.quiz}
                      onComplete={() => setShowQuiz(false)}
                    />
                  ) : (
                    <>
                      {typeof selectedModule.content === 'function' 
                        ? selectedModule.content(currentLevel)
                        : selectedModule.content}
                      
                      {/* Seção "Na Prática" */}
                      {selectedModule.practicalApplication && (
                        <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
                          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Play className="w-6 h-6 text-green-400" />
                            Na Prática
                          </h3>
                          <p className="text-gray-300 mb-4">
                            Agora que você entendeu a teoria, veja como aplicar no violão:
                          </p>
                          {typeof selectedModule.practicalApplication === 'function'
                            ? selectedModule.practicalApplication(currentLevel)
                            : selectedModule.practicalApplication}
                        </div>
                      )}
                      
                      {/* Botões de Ação */}
                      <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                        {selectedModule.quiz && (
                          <Button
                            onClick={() => setShowQuiz(true)}
                            className="w-full bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#d97706] hover:to-[#b45309] text-white py-6 text-lg"
                          >
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Fazer Quiz
                          </Button>
                        )}
                        
                        {/* Botão de Prática baseado no módulo */}
                        {(() => {
                          const practiceRoutes: Record<string, { path: string; label: string }> = {
                            'fundamentals': { path: '/practice', label: 'Treino de Ritmo' },
                            'fretboard-notes': { path: '/scales', label: 'Treino de Escalas' },
                            'chord-formation': { path: '/chords', label: 'Treino de Acordes' },
                            'straight-swing': { path: '/practice', label: 'Treino de Ritmo' },
                            'scales': { path: '/scales', label: 'Treino de Escalas' },
                            'intervals': { path: '/practice', label: 'Treino de Ouvido' },
                            'progressions': { path: '/songs', label: 'Tocar Músicas' },
                            'circle-of-fifths': { path: '/songs', label: 'Explorar Músicas' },
                          };
                          
                          const practice = practiceRoutes[selectedModule.id];
                          
                          return practice ? (
                            <Link href={practice.path}>
                              <Button
                                onClick={() => {
                                  // Completar módulo e desbloquear práticas relacionadas
                                  completeModule(selectedModule.id, 100);
                                  checkAndUnlockFromTheory(selectedModule.id, 100);
                                }}
                                className="w-full bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white py-6 text-lg"
                              >
                                <Play className="w-5 h-5 mr-2" />
                                Ir para {practice.label}
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              onClick={() => {
                                completeModule(selectedModule.id, 100);
                                checkAndUnlockFromTheory(selectedModule.id, 100);
                              }}
                              className="w-full bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white py-6 text-lg"
                            >
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Marcar como Completo
                            </Button>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Indicador de Nível Atual */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Nível Teórico Atual</p>
                      <p className="text-xl font-bold text-white">
                        {currentLevel === 'basic' ? 'Básico' : currentLevel === 'intermediate' ? 'Intermediário' : 'Avançado'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Módulos Desbloqueados</p>
                      <p className="text-xl font-bold text-green-400">{availableModules.length}/{THEORY_MODULES.length}</p>
                    </div>
                  </div>
                </div>

                {/* Módulos Disponíveis */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Módulos Disponíveis</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableModules.map((module) => (
                      <Card
                        key={module.id}
                        className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10 hover:border-[#8b5cf6]/50 transition-all cursor-pointer group"
                        onClick={() => setSelectedModule(module)}
                      >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] group-hover:scale-110 transition-transform">
                        <module.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                        <p className="text-sm text-gray-400 mb-3">{module.description}</p>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-xs text-gray-500">{module.duration}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            module.difficulty === 'beginner' ? 'bg-[#10b981]/20 text-[#10b981]' :
                            module.difficulty === 'intermediate' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                            'bg-[#ef4444]/20 text-[#ef4444]'
                          }`}>
                            {module.difficulty === 'beginner' ? 'Iniciante' :
                             module.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {module.topics.map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-1 rounded bg-white/5 text-xs text-gray-400"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea] text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Começar Módulo
                    </Button>
                  </Card>
                    ))}
                  </div>
                </div>

                {/* Módulos Bloqueados */}
                {lockedModules.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      <Lock className="w-6 h-6 text-gray-400" />
                      Módulos Bloqueados
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {lockedModules.map((module) => {
                        const missingReqs = getMissingRequirements(
                          module.id,
                          module.prerequisites,
                          module.minAccuracy
                        );
                        
                        return (
                          <Card
                            key={module.id}
                            className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 opacity-60 cursor-not-allowed"
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-3 rounded-lg bg-gray-700/50">
                                <module.icon className="w-6 h-6 text-gray-500" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-gray-400">{module.title}</h3>
                                  <Lock className="w-4 h-4 text-gray-500" />
                                </div>
                                <p className="text-sm text-gray-500">{module.description}</p>
                              </div>
                            </div>

                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-amber-400 mb-1">Requisitos não atendidos:</p>
                                  <ul className="text-xs text-gray-400 space-y-1">
                                    {missingReqs.length > 0 ? (
                                      missingReqs.map((req, idx) => (
                                        <li key={idx} className="list-disc list-inside">{req}</li>
                                      ))
                                    ) : (
                                      <li>Complete módulos anteriores com {module.minAccuracy || 70}% de precisão</li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                module.level === 'basic' ? 'bg-blue-500/20 text-blue-400' :
                                module.level === 'intermediate' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {module.level === 'basic' ? 'Básico' :
                                 module.level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                              </span>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE VERSION */}
      <div className="lg:hidden min-h-screen bg-[#0f0f1a] text-white pb-20">
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

        <div className="p-4 space-y-6">
          <Breadcrumbs />
          {selectedModule ? (
            <div className="space-y-4">
              <Button
                onClick={() => setSelectedModule(null)}
                variant="outline"
                className="bg-transparent border-white/20 text-gray-300"
              >
                ← Voltar
              </Button>

              <Card className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#a855f7]">
                    <selectedModule.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedModule.title}</h2>
                  </div>
                </div>

                {showQuiz && selectedModule.quiz ? (
                  <TheoryQuiz
                    moduleId={selectedModule.id}
                    moduleTitle={selectedModule.title}
                    questions={selectedModule.quiz}
                    onComplete={() => setShowQuiz(false)}
                  />
                ) : (
                  <>
                    {selectedModule.content}
                    
                    {/* Botões de Ação */}
                    <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                      {selectedModule.quiz && (
                        <Button
                          onClick={() => setShowQuiz(true)}
                          className="w-full bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#d97706] hover:to-[#b45309] text-white py-6 text-lg"
                        >
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Fazer Quiz
                        </Button>
                      )}
                      
                        <Button
                          onClick={() => {
                            // Completar módulo ao sair
                            completeModule(selectedModule.id, 100); // Assumir 100% se completou visualização
                            
                            if (selectedModule.id === 'intervals') window.location.href = '/practice';
                            if (selectedModule.id === 'scales') window.location.href = '/scales';
                            if (selectedModule.id === 'chord-formation') window.location.href = '/chords';
                            if (selectedModule.id === 'progressions') window.location.href = '/songs';
                          }}
                          className="w-full bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white py-6 text-lg"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Praticar Agora
                        </Button>
                    </div>
                  </>
                )}
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {THEORY_MODULES.map((module) => (
                <Card
                  key={module.id}
                  className="p-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10"
                  onClick={() => setSelectedModule(module)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#a855f7]">
                      <module.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{module.title}</h3>
                      <p className="text-sm text-gray-400 mb-2">{module.description}</p>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-gray-500">{module.duration}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          module.difficulty === 'beginner' ? 'bg-[#10b981]/20 text-[#10b981]' :
                          module.difficulty === 'intermediate' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                          'bg-[#ef4444]/20 text-[#ef4444]'
                        }`}>
                          {module.difficulty === 'beginner' ? 'Iniciante' :
                           module.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white text-sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Começar
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        <MobileBottomNav />
      </div>
    </>
  );
}
