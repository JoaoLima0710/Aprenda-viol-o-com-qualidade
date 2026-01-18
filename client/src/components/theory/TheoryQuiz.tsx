import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Trophy, Award } from 'lucide-react';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { toast } from 'sonner';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface TheoryQuizProps {
  moduleId: string;
  moduleTitle: string;
  questions: QuizQuestion[];
  onComplete: () => void;
}

export function TheoryQuiz({ moduleId, moduleTitle, questions, onComplete }: TheoryQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(new Array(questions.length).fill(false));
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  const { addXP } = useGamificationStore();

  const handleAnswer = (answerIndex: number) => {
    if (answeredQuestions[currentQuestion]) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    const isCorrect = answerIndex === questions[currentQuestion].correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }
    
    const newAnswered = [...answeredQuestions];
    newAnswered[currentQuestion] = true;
    setAnsweredQuestions(newAnswered);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completo
      const finalScore = score + (selectedAnswer === questions[currentQuestion].correctAnswer ? 1 : 0);
      const percentage = (finalScore / questions.length) * 100;
      
      // Dar XP baseado na performance
      const xpEarned = Math.floor(percentage * 2); // Máximo 200 XP para 100%
      addXP(xpEarned);
      
      setQuizCompleted(true);
      
      if (percentage >= 80) {
        toast.success(`🏆 Parabéns! Você conquistou o certificado de ${moduleTitle}!`);
      } else {
        toast.info(`Você acertou ${percentage.toFixed(0)}%. Tente novamente para conseguir o certificado!`);
      }
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnsweredQuestions(new Array(questions.length).fill(false));
    setQuizCompleted(false);
  };

  if (quizCompleted) {
    const percentage = (score / questions.length) * 100;
    const passed = percentage >= 80;
    
    return (
      <Card className="p-8 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10 text-center">
        <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
          passed ? 'bg-gradient-to-br from-[#10b981] to-[#059669]' : 'bg-gradient-to-br from-[#f59e0b] to-[#d97706]'
        }`}>
          {passed ? <Trophy className="w-12 h-12 text-white" /> : <Award className="w-12 h-12 text-white" />}
        </div>
        
        <h3 className="text-3xl font-bold text-white mb-2">
          {passed ? 'Parabéns! 🎉' : 'Quase lá! 💪'}
        </h3>
        
        <p className="text-xl text-gray-300 mb-6">
          Você acertou <span className="font-bold text-[#06b6d4]">{score}/{questions.length}</span> questões
          <br />
          <span className="text-2xl font-bold">{percentage.toFixed(0)}%</span>
        </p>
        
        {passed ? (
          <div className="p-6 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 mb-6">
            <h4 className="text-lg font-bold text-white mb-2">✅ Certificado Conquistado!</h4>
            <p className="text-gray-300">
              Você dominou o módulo <span className="font-semibold">{moduleTitle}</span>
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 mb-6">
            <h4 className="text-lg font-bold text-white mb-2">📚 Continue Estudando</h4>
            <p className="text-gray-300">
              Você precisa de 80% para conquistar o certificado. Revise o conteúdo e tente novamente!
            </p>
          </div>
        )}
        
        <div className="flex gap-3">
          <Button
            onClick={restartQuiz}
            variant="outline"
            className="flex-1 bg-transparent border-white/20 text-gray-300"
          >
            Tentar Novamente
          </Button>
          <Button
            onClick={onComplete}
            className="flex-1 bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea] text-white"
          >
            Voltar ao Módulo
          </Button>
        </div>
      </Card>
    );
  }

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">
          Questão {currentQuestion + 1} de {questions.length}
        </span>
        <span className="text-sm font-semibold text-white">
          Pontuação: {score}/{questions.length}
        </span>
      </div>
      
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <Card className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-white/10">
        <h3 className="text-xl font-bold text-white mb-6">{question.question}</h3>
        
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectOption = index === question.correctAnswer;
            
            let bgClass = 'bg-white/5 hover:bg-white/10';
            let borderClass = 'border-white/10';
            let iconClass = '';
            
            if (showResult && isSelected) {
              if (isCorrect) {
                bgClass = 'bg-[#10b981]/20';
                borderClass = 'border-[#10b981]';
                iconClass = 'text-[#10b981]';
              } else {
                bgClass = 'bg-[#ef4444]/20';
                borderClass = 'border-[#ef4444]';
                iconClass = 'text-[#ef4444]';
              }
            } else if (showResult && isCorrectOption) {
              bgClass = 'bg-[#10b981]/20';
              borderClass = 'border-[#10b981]';
              iconClass = 'text-[#10b981]';
            }
            
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${bgClass} ${borderClass} ${
                  showResult ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{option}</span>
                  {showResult && (isSelected || isCorrectOption) && (
                    <div>
                      {(isSelected && isCorrect) || isCorrectOption ? (
                        <CheckCircle2 className={`w-6 h-6 ${iconClass}`} />
                      ) : (
                        <XCircle className={`w-6 h-6 ${iconClass}`} />
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showResult && (
          <div className={`mt-6 p-4 rounded-xl ${
            isCorrect ? 'bg-[#10b981]/10 border border-[#10b981]/30' : 'bg-[#f59e0b]/10 border border-[#f59e0b]/30'
          }`}>
            <h4 className="font-bold text-white mb-2">
              {isCorrect ? '✅ Correto!' : '💡 Explicação'}
            </h4>
            <p className="text-gray-300 text-sm">{question.explanation}</p>
          </div>
        )}
      </Card>

      {/* Next Button */}
      {showResult && (
        <Button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea] text-white py-6"
        >
          {currentQuestion < questions.length - 1 ? 'Próxima Questão →' : 'Ver Resultado'}
        </Button>
      )}
    </div>
  );
}
