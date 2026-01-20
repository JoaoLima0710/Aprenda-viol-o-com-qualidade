/**
 * Componente de Teste do Sistema de IA
 * Permite testar o sistema diretamente na interface
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Send, TestTube } from 'lucide-react';
import { advancedAIService } from '@/services/AdvancedAIService';
import { freeLLMService } from '@/services/FreeLLMService';
import type { ConversationContext } from '@/services/AdvancedAIService';
import { aiAssistantService } from '@/services/AIAssistantService';

export function AISystemTester() {
  const [testQuestion, setTestQuestion] = useState('Olá! Como posso melhorar minha técnica?');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    response?: string;
    duration?: number;
    confidence?: number;
    error?: string;
  } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | null>(null);

  const handleTestConnection = async () => {
    setConnectionStatus('checking');
    try {
      const isConnected = await freeLLMService.testProvider('openrouter');
      setConnectionStatus(isConnected ? 'connected' : 'error');
    } catch (error) {
      setConnectionStatus('error');
      console.error('Erro ao testar conexão:', error);
    }
  };

  const handleTestAI = async () => {
    if (!testQuestion.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const startTime = Date.now();
      
      // Obter perfil do usuário real
      const userProfile = aiAssistantService.getUserProfile();
      const recentSessions = aiAssistantService.getPracticeHistory().slice(-5);

      const context: ConversationContext = {
        userMessage: testQuestion,
        userProfile,
        recentSessions,
        currentMood: 'neutral',
        context: []
      };

      const response = await advancedAIService.getConversationalResponse(context);
      
      const duration = Date.now() - startTime;

      setTestResult({
        success: true,
        response: response.response,
        duration,
        confidence: response.confidence
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const config = freeLLMService.getConfig();

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Teste do Sistema de IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Configuração */}
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Provedor:</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {config.provider === 'openrouter' ? 'OpenRouter (Automático)' : config.provider}
            </Badge>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Modelo:</span>
            <span className="text-sm text-white">{config.model || 'padrão'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Status:</span>
            {connectionStatus === null && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestConnection}
                className="text-xs"
              >
                Testar Conexão
              </Button>
            )}
            {connectionStatus === 'checking' && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                Verificando...
              </div>
            )}
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                Conectado
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <XCircle className="w-3 h-3" />
                Erro na conexão
              </div>
            )}
          </div>
        </div>

        {/* Campo de Teste */}
        <div className="space-y-2">
          <label className="text-sm text-white">Pergunta de Teste:</label>
          <div className="flex gap-2">
            <Input
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              placeholder="Digite uma pergunta para o Tutor IA..."
              className="bg-slate-800 border-slate-700 text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isTesting) {
                  handleTestAI();
                }
              }}
            />
            <Button
              onClick={handleTestAI}
              disabled={isTesting || !testQuestion.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Testar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Resultado do Teste */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            {testResult.success ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-white font-semibold">Teste Bem-Sucedido!</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {testResult.duration && (
                      <span>⏱️ {testResult.duration}ms</span>
                    )}
                    {testResult.confidence && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {(testResult.confidence * 100).toFixed(0)}% confiança
                      </Badge>
                    )}
                  </div>
                </div>
                {testResult.response && (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {testResult.response}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white font-semibold">Erro no Teste</p>
                  <p className="text-sm text-red-400 mt-1">{testResult.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Perguntas de Exemplo */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400">Perguntas de exemplo:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'Como melhorar minha técnica?',
              'Estou com dificuldade no acorde F',
              'Qual escala devo praticar?',
              'Como manter a motivação?'
            ].map((example, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                onClick={() => setTestQuestion(example)}
                className="text-xs bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
