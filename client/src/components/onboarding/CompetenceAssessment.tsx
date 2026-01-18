import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  CheckCircle2,
  X,
  Guitar,
  Clock,
  Target,
  Zap,
  Music,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { competenceSystem, CompetenceDefinition } from '@/services/CompetenceSystem';

interface AssessmentQuestion {
  id: string;
  competenceId: string;
  type: 'practical' | 'theoretical' | 'recognition';
  question: string;
  description: string;
  options?: string[];
  expectedAnswer?: any;
  difficulty: number;
  timeLimit: number; // segundos
  media?: {
    type: 'chord' | 'scale' | 'rhythm' | 'audio';
    data: any;
  };
}

interface AssessmentResult {
  competenceId: string;
  score: number; // 0-100
  timeTaken: number;
  attempts: number;
  confidence: number; // 0-1, baseado em tempo e tentativas
}

interface CompetenceAssessmentProps {
  onComplete: (results: AssessmentResult[]) => void;
  onSkip: () => void;
}

export function CompetenceAssessment({ onComplete, onSkip }: CompetenceAssessmentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, any>>(new Map());
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Questões de avaliação calibradas por nível
  const assessmentQuestions: AssessmentQuestion[] = [
    // Nível Básico - Iniciante Real
    {
      id: 'chord_basic_recognition',
      competenceId: 'chord-recognition',
      type: 'recognition',
      question: 'Qual acorde é mostrado no diagrama?',
      description: 'Identifique o acorde básico',
      options: ['C', 'G', 'Am', 'F'],
      expectedAnswer: 'C',
      difficulty: 1,
      timeLimit: 15,
      media: {
        type: 'chord',
        data: { name: 'C', frets: [0, 1, 0, 2, 3, 0], fingers: [0, 1, 0, 2, 3, 0] }
      }
    },
    {
      id: 'rhythm_basic_steadiness',
      competenceId: 'rhythmic-precision',
      type: 'practical',
      question: 'Toque no ritmo do metrônomo por 10 segundos',
      description: 'Mantenha o tempo constante em 80 BPM',
      difficulty: 2,
      timeLimit: 15,
      media: {
        type: 'rhythm',
        data: { bpm: 80, pattern: 'quarter_notes', duration: 10 }
      }
    },
    {
      id: 'technique_basic_transition',
      competenceId: 'chord-transitions',
      type: 'practical',
      question: 'Alterne entre C e G lentamente',
      description: '4 batidas em cada acorde, 3 vezes',
      difficulty: 2,
      timeLimit: 30,
      media: {
        type: 'chord',
        data: { sequence: ['C', 'G'], repetitions: 3, holdTime: 4 }
      }
    },
    {
      id: 'theory_basic_notes',
      competenceId: 'music-theory-basics',
      type: 'theoretical',
      question: 'Quantas cordas tem um violão padrão?',
      description: 'Conhecimento básico sobre o instrumento',
      options: ['4', '5', '6', '7'],
      expectedAnswer: '6',
      difficulty: 1,
      timeLimit: 10
    },
    // Nível Intermediário
    {
      id: 'chord_intermediate_recognition',
      competenceId: 'chord-recognition',
      type: 'recognition',
      question: 'Qual acorde é este?',
      description: 'Identifique o acorde com pestana',
      options: ['F', 'Fm', 'Fmaj7', 'F7'],
      expectedAnswer: 'F',
      difficulty: 3,
      timeLimit: 20,
      media: {
        type: 'chord',
        data: { name: 'F', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 3, 2, 1, 1] }
      }
    },
    {
      id: 'rhythm_intermediate_subdivision',
      competenceId: 'rhythmic-subdivision',
      type: 'practical',
      question: 'Toque semicolcheias no ritmo do metrônomo',
      description: 'Sinta as subdivisões em 120 BPM',
      difficulty: 4,
      timeLimit: 20,
      media: {
        type: 'rhythm',
        data: { bpm: 120, pattern: 'sixteenth_notes', subdivision: 'sixteenth' }
      }
    },
    {
      id: 'technique_intermediate_strumming',
      competenceId: 'strumming-patterns',
      type: 'practical',
      question: 'Execute o padrão D-DU-UDU',
      description: 'Padrão comum em músicas pop/rock',
      difficulty: 4,
      timeLimit: 25,
      media: {
        type: 'rhythm',
        data: { bpm: 100, pattern: 'DDUUDU', strumming: true }
      }
    },
    {
      id: 'ear_intermediate_intervals',
      competenceId: 'ear-training',
      type: 'practical',
      question: 'Qual intervalo você ouviu?',
      description: 'Identifique o intervalo reproduzido',
      options: ['Terça menor', 'Terça maior', 'Quarta justa', 'Quinta justa'],
      expectedAnswer: 'Terça maior',
      difficulty: 5,
      timeLimit: 15,
      media: {
        type: 'audio',
        data: { interval: 'major_third', notes: ['C4', 'E4'] }
      }
    }
  ];

  const currentQuestion = assessmentQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessmentQuestions.length) * 100;

  // Timer para questões
  useEffect(() => {
    if (!currentQuestion || !questionStartTime) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - questionStartTime.getTime()) / 1000;
      const remaining = Math.max(0, currentQuestion.timeLimit - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        // Tempo esgotado - passar para próxima
        handleNext();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentQuestion, questionStartTime]);

  // Iniciar avaliação
  useEffect(() => {
    setStartTime(new Date());
    setQuestionStartTime(new Date());
  }, []);

  const handleAnswer = (answer: any) => {
    if (!currentQuestion || !questionStartTime) return;

    const timeTaken = (Date.now() - questionStartTime.getTime()) / 1000;
    const isCorrect = answer === currentQuestion.expectedAnswer;
    const attempts = 1;

    // Calcular score baseado em tempo, dificuldade e acerto
    const timeBonus = Math.max(0, (currentQuestion.timeLimit - timeTaken) / currentQuestion.timeLimit);
    const difficultyMultiplier = currentQuestion.difficulty / 5;
    const baseScore = isCorrect ? 100 : Math.max(20, 100 - (timeTaken * 5));

    const finalScore = Math.round(baseScore * (0.5 + 0.3 * timeBonus + 0.2 * difficultyMultiplier));

    const result: AssessmentResult = {
      competenceId: currentQuestion.competenceId,
      score: finalScore,
      timeTaken,
      attempts,
      confidence: Math.max(0.1, Math.min(1, 1 - (timeTaken / currentQuestion.timeLimit)))
    };

    setResults(prev => [...prev, result]);
    setAnswers(prev => new Map(prev.set(currentQuestion.id, answer)));

    handleNext();
  };

  const handleNext = () => {
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(new Date());
    } else {
      finalizeAssessment();
    }
  };

  const finalizeAssessment = () => {
    // Calcular baseline de competências baseado nos resultados
    const competenceScores = new Map<string, number[]>();

    results.forEach(result => {
      if (!competenceScores.has(result.competenceId)) {
        competenceScores.set(result.competenceId, []);
      }
      competenceScores.get(result.competenceId)!.push(result.score);
    });

    // Calcular média por competência e registrar baseline
    competenceScores.forEach((scores, competenceId) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      // Registrar evento de baseline para o sistema de competências
      competenceSystem.recordEvent({
        competenceId,
        performance: avgScore / 100,
        context: {
          difficulty: 3, // dificuldade média para baseline
          exerciseType: 'assessment_baseline',
          duration: 0
        }
      });
    });

    onComplete(results);
  };

  const getTimeColor = () => {
    if (timeRemaining > currentQuestion.timeLimit * 0.5) return 'text-green-400';
    if (timeRemaining > currentQuestion.timeLimit * 0.25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="space-y-6"
      >
        {/* Header com timer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={`text-2xl font-mono font-bold ${getTimeColor()}`}>
              {Math.ceil(timeRemaining)}s
            </div>
            <Badge variant="outline">
              {currentQuestion.type === 'practical' ? 'Prático' :
               currentQuestion.type === 'theoretical' ? 'Teórico' : 'Reconhecimento'}
            </Badge>
          </div>
        </div>

        {/* Questão */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">{currentQuestion.question}</CardTitle>
            <p className="text-gray-400 text-sm">{currentQuestion.description}</p>
          </CardHeader>
          <CardContent>
            {/* Renderizar mídia baseada no tipo */}
            {renderMedia()}

            {/* Opções de resposta */}
            {currentQuestion.options && (
              <div className="grid grid-cols-2 gap-3 mt-6">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    variant="outline"
                    className="h-12 text-left justify-start"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

            {/* Controles para questões práticas */}
            {currentQuestion.type === 'practical' && (
              <div className="flex justify-center gap-4 mt-6">
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                  size="lg"
                >
                  {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                  {isPlaying ? 'Pausar' : 'Iniciar'}
                </Button>
                <Button
                  onClick={() => handleAnswer('completed')}
                  variant="outline"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Concluído
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instruções específicas */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">Como responder:</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  {currentQuestion.type === 'practical' && (
                    <>
                      <li>• Pegue seu instrumento</li>
                      <li>• Execute o exercício solicitado</li>
                      <li>• Clique em "Concluído" quando terminar</li>
                    </>
                  )}
                  {currentQuestion.type === 'recognition' && (
                    <>
                      <li>• Observe o diagrama atentamente</li>
                      <li>• Identifique qual acorde é mostrado</li>
                      <li>• Selecione a opção correta</li>
                    </>
                  )}
                  {currentQuestion.type === 'theoretical' && (
                    <>
                      <li>• Leia a pergunta com atenção</li>
                      <li>• Selecione a resposta que você acredita estar correta</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderMedia = () => {
    if (!currentQuestion.media) return null;

    switch (currentQuestion.media.type) {
      case 'chord':
        return (
          <div className="text-center py-4">
            <div className="inline-block bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-white mb-2">
                {currentQuestion.media.data.name}
              </div>
              {/* Simplified chord diagram */}
              <div className="text-xs text-gray-400">
                Diagrama: {currentQuestion.media.data.frets?.join('-')}
              </div>
            </div>
          </div>
        );

      case 'rhythm':
        return (
          <div className="text-center py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-mono">
                  {currentQuestion.media.data.bpm} BPM
                </span>
              </div>
              {currentQuestion.media.data.pattern && (
                <div className="text-2xl font-mono text-white">
                  {currentQuestion.media.data.pattern}
                </div>
              )}
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="text-center py-4">
            <div className="space-y-3">
              <Volume2 className="w-8 h-8 text-green-400 mx-auto" />
              <p className="text-gray-400">Ouça o intervalo e identifique</p>
              <Button variant="outline" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Tocar novamente
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white">Avaliação de Competências</h1>
              <Button onClick={onSkip} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <Progress value={progress} className="h-2 mb-2" />
            <div className="flex justify-between text-sm text-gray-400">
              <span>{currentQuestionIndex + 1} de {assessmentQuestions.length}</span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
          </div>

          {/* Main content */}
          <AnimatePresence mode="wait">
            {renderQuestion()}
          </AnimatePresence>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              Esta avaliação nos ajuda a personalizar seu aprendizado.
              Responda com calma - não há respostas erradas!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook para usar a avaliação de competências
export function useCompetenceAssessment() {
  const [showAssessment, setShowAssessment] = useState(false);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Verificar se já foi feita
    const completed = localStorage.getItem('musictutor_competence_assessment_completed');
    const storedResults = localStorage.getItem('musictutor_competence_assessment_results');

    if (completed === 'true' && storedResults) {
      setResults(JSON.parse(storedResults));
      setIsCompleted(true);
    } else {
      // Mostrar avaliação se ainda não foi feita
      setShowAssessment(true);
    }
  }, []);

  const completeAssessment = (assessmentResults: AssessmentResult[]) => {
    setResults(assessmentResults);
    setIsCompleted(true);
    setShowAssessment(false);

    // Salvar no localStorage
    localStorage.setItem('musictutor_competence_assessment_completed', 'true');
    localStorage.setItem('musictutor_competence_assessment_results', JSON.stringify(assessmentResults));
  };

  const skipAssessment = () => {
    setShowAssessment(false);
    setIsCompleted(true);
    localStorage.setItem('musictutor_assessment_skipped', 'true');
  };

  const resetAssessment = () => {
    localStorage.removeItem('musictutor_competence_assessment_completed');
    localStorage.removeItem('musictutor_competence_assessment_results');
    localStorage.removeItem('musictutor_assessment_skipped');
    setResults([]);
    setIsCompleted(false);
    setShowAssessment(true);
  };

  return {
    showAssessment,
    results,
    isCompleted,
    completeAssessment,
    skipAssessment,
    resetAssessment
  };
}