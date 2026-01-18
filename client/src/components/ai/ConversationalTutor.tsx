import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  Bot,
  User,
  Lightbulb,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { advancedAIService, LLMResponse, ConversationContext } from '@/services/AdvancedAIService';
import { llmIntegrationService, SentimentAnalysis } from '@/services/LLMIntegrationService';
import { aiGamificationService } from '@/services/AIGamificationService';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { aiAssistantService } from '@/services/AIAssistantService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  recommendations?: any[];
  actions?: string[];
  nextSteps?: string[];
  confidence?: number;
  xpGained?: number;
}

interface ConversationalTutorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationalTutor({ isOpen, onClose }: ConversationalTutorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentMood, setCurrentMood] = useState<'frustrated' | 'motivated' | 'confused' | 'confident' | 'neutral'>('neutral');
  const [sentimentAnalysis, setSentimentAnalysis] = useState<SentimentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { xp, level } = useGamificationStore();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Mensagem de boas-vindas inicial
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Olá! 👋 Sou seu tutor de música inteligente. Estou aqui para te ajudar em sua jornada musical.

Posso ajudar com:
• Exercícios personalizados baseados no seu progresso
• Dicas técnicas específicas
• Motivação e orientação
• Análise do seu desempenho
• Sugestões de músicas para praticar

Como você está se sentindo hoje? O que gostaria de trabalhar?`,
        timestamp: Date.now(),
        confidence: 1.0
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll para o final quando novas mensagens chegam
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setIsAnalyzing(true);

    try {
      // Análise de sentimento em tempo real
      const sentiment = await llmIntegrationService.analyzeSentiment(userMessage.content);
      setSentimentAnalysis(sentiment);

      // Auto-ajustar humor baseado na análise de sentimento
      if (sentiment.sentiment !== currentMood && sentiment.confidence > 0.7) {
        setCurrentMood(sentiment.sentiment as any);
      }

      // Registrar interação para gamificação
      aiGamificationService.recordInteraction({
        type: 'conversation',
        sentiment,
        engagement: sentiment.confidence,
        value: sentiment.sentiment === 'positive' || sentiment.sentiment === 'motivated' ? 1 : 0.5,
        context: {
          topic: 'conversation',
          mood: sentiment.sentiment,
          success: sentiment.confidence > 0.7
        }
      });

      // Atualizar streak de conversação
      aiGamificationService.updateStreak('conversation', true);

      // Preparar contexto para o LLM
      const userProfile = aiAssistantService.getUserProfile();
      const recentSessions = aiAssistantService.getPracticeHistory().slice(-10);
      const conversationHistory = messages.slice(-4).map(m => `${m.role}: ${m.content}`);

      const context: ConversationContext = {
        userMessage: userMessage.content,
        userProfile,
        recentSessions,
        currentMood,
        context: conversationHistory
      };

      // Chamar serviço de IA avançado com LLM
      const response: LLMResponse = await advancedAIService.getConversationalResponse(context);

      // Calcular XP ganho baseado na interação
      const xpGained = sentiment.sentiment === 'positive' || sentiment.sentiment === 'motivated' ?
        Math.round(sentiment.confidence * 15) : Math.round(sentiment.confidence * 8);

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: Date.now(),
        recommendations: response.recommendations,
        actions: response.actions,
        nextSteps: response.nextSteps,
        confidence: response.confidence,
        xpGained: xpGained > 0 ? xpGained : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Erro ao obter resposta do tutor:', error);

      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, houve um problema técnico. Vamos tentar novamente? Você pode reformular sua pergunta.',
        timestamp: Date.now(),
        confidence: 0.5
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: Message) => {
    const isAssistant = message.role === 'assistant';

    return (
      <div key={message.id} className={`flex gap-3 mb-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
        {isAssistant && (
          <Avatar className="w-8 h-8 mt-1">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`max-w-[80%] ${isAssistant ? 'order-2' : 'order-1'}`}>
          <div className={`rounded-2xl px-4 py-3 ${
            isAssistant
              ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20'
              : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
          }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>

            {message.confidence && message.confidence < 0.8 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-yellow-400">
                <AlertTriangle className="w-3 h-3" />
                Resposta com menor confiança
              </div>
            )}

            {message.xpGained && message.xpGained > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                <Sparkles className="w-3 h-3" />
                +{message.xpGained} XP ganho!
              </div>
            )}
          </div>

          {/* Recomendações */}
          {message.recommendations && message.recommendations.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Lightbulb className="w-3 h-3" />
                Sugestões
              </div>
              {message.recommendations.slice(0, 2).map((rec: any, index: number) => (
                <Card key={index} className="bg-white/5 border-white/10">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm">{rec.title}</h4>
                        <p className="text-xs text-gray-300 mt-1">{rec.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {rec.estimatedTime}min
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              rec.priority > 7 ? 'border-red-400 text-red-400' :
                              rec.priority > 5 ? 'border-yellow-400 text-yellow-400' :
                              'border-green-400 text-green-400'
                            }`}
                          >
                            Prioridade {rec.priority}/10
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Ações sugeridas */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Target className="w-3 h-3" />
                Ações sugeridas
              </div>
              <div className="flex flex-wrap gap-1">
                {message.actions.map((action: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Próximos passos */}
          {message.nextSteps && message.nextSteps.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Sparkles className="w-3 h-3" />
                Próximos passos
              </div>
              <div className="space-y-1">
                {message.nextSteps.map((step: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-2">
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {!isAssistant && (
          <Avatar className="w-8 h-8 mt-1">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  const moodOptions = [
    { value: 'frustrated', label: 'Frustrado', emoji: '😤' },
    { value: 'motivated', label: 'Motivado', emoji: '💪' },
    { value: 'confused', label: 'Confuso', emoji: '🤔' },
    { value: 'confident', label: 'Confiante', emoji: '😊' },
    { value: 'neutral', label: 'Neutro', emoji: '😐' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed bottom-4 right-4 w-full max-w-md h-[600px] bg-[#0f0f1a] border border-white/20 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Bot className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-white">Tutor IA</h3>
              <p className="text-xs text-gray-400">Online • Nível {level}</p>
              {sentimentAnalysis && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">Estado:</span>
                  <Badge variant="outline" className={
                    sentimentAnalysis.sentiment === 'positive' ? 'border-green-400 text-green-400 text-xs' :
                    sentimentAnalysis.sentiment === 'motivated' ? 'border-blue-400 text-blue-400 text-xs' :
                    sentimentAnalysis.sentiment === 'frustrated' ? 'border-red-400 text-red-400 text-xs' :
                    sentimentAnalysis.sentiment === 'negative' ? 'border-orange-400 text-orange-400 text-xs' :
                    'border-gray-400 text-gray-400 text-xs'
                  }>
                    {sentimentAnalysis.sentiment === 'positive' ? '😊' :
                     sentimentAnalysis.sentiment === 'motivated' ? '💪' :
                     sentimentAnalysis.sentiment === 'frustrated' ? '😤' :
                     sentimentAnalysis.sentiment === 'negative' ? '😞' :
                     '😐'} {Math.round(sentimentAnalysis.confidence * 100)}%
                  </Badge>
                </div>
              )}
              {isAnalyzing && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-purple-400">Analisando sentimento...</span>
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            ✕
          </Button>
        </div>

        {/* Mood Selector */}
        <div className="px-4 py-2 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            Como você está se sentindo hoje?
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {moodOptions.map((mood) => (
              <Button
                key={mood.value}
                onClick={() => setCurrentMood(mood.value as any)}
                variant={currentMood === mood.value ? "default" : "outline"}
                size="sm"
                className={`text-xs whitespace-nowrap ${
                  currentMood === mood.value
                    ? 'bg-purple-500 text-white'
                    : 'border-white/20 text-gray-300 hover:bg-white/5'
                }`}
              >
                {mood.emoji} {mood.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map(renderMessage)}

            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-400">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isTyping ? "Aguarde a resposta..." :
                  sentimentAnalysis?.sentiment === 'frustrated' ? "Conte-me sobre suas dificuldades..." :
                  sentimentAnalysis?.sentiment === 'motivated' ? "Como está se sentindo motivado hoje?" :
                  "Pergunte sobre exercícios, técnicas ou motivação..."
                }
                className={`bg-white/5 border-white/20 text-white placeholder-gray-400 ${
                  sentimentAnalysis ? 'border-l-4 border-l-purple-500' : ''
                }`}
                disabled={isTyping}
              />
              {sentimentAnalysis && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className={`w-2 h-2 rounded-full ${
                    sentimentAnalysis.sentiment === 'positive' ? 'bg-green-400' :
                    sentimentAnalysis.sentiment === 'motivated' ? 'bg-blue-400' :
                    sentimentAnalysis.sentiment === 'frustrated' ? 'bg-red-400' :
                    sentimentAnalysis.sentiment === 'negative' ? 'bg-orange-400' :
                    'bg-gray-400'
                  }`} />
                </div>
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Pressione Enter para enviar • IA treinada para tutoria musical
          </div>
        </div>
      </div>
    </div>
  );
}
