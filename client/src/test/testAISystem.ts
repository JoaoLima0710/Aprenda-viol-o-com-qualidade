/**
 * Script de Teste do Sistema de IA
 * Testa a integração com OpenRouter e respostas do Tutor IA
 */

import { advancedAIService } from '../services/AdvancedAIService';
import { freeLLMService } from '../services/FreeLLMService';
import type { ConversationContext } from '../services/AdvancedAIService';
import type { UserProfile } from '../services/AIAssistantService';

/**
 * Testa o sistema de IA completo
 */
export async function testAISystem() {
  console.log('🧪 Iniciando testes do Sistema de IA...\n');

  // Teste 1: Verificar configuração do OpenRouter
  console.log('📋 Teste 1: Verificando configuração do OpenRouter...');
  const config = freeLLMService.getConfig();
  console.log('✅ Configuração:', {
    provider: config.provider,
    model: config.model,
    hasApiKey: !!config.apiKey
  });

  // Teste 2: Testar conexão com OpenRouter
  console.log('\n📋 Teste 2: Testando conexão com OpenRouter...');
  try {
    const isConnected = await freeLLMService.testProvider('openrouter');
    if (isConnected) {
      console.log('✅ OpenRouter está funcionando!');
    } else {
      console.log('❌ OpenRouter não está respondendo');
    }
  } catch (error) {
    console.error('❌ Erro ao testar OpenRouter:', error);
  }

  // Teste 3: Testar resposta do Tutor IA
  console.log('\n📋 Teste 3: Testando resposta do Tutor IA...');
  
  const mockUserProfile: UserProfile = {
    id: 'test-user',
    name: 'Usuário Teste',
    level: 3,
    totalPracticeTime: 3600, // 1 hora
    averageAccuracy: 75,
    learningPace: 'moderate',
    strongAreas: ['acordes básicos'],
    weakAreas: [
      {
        category: 'ritmo',
        severity: 'medium',
        lastPracticed: Date.now() - 7 * 24 * 60 * 60 * 1000
      }
    ],
    preferences: {
      favoriteGenres: ['pop', 'rock'],
      practiceTime: 'evening'
    }
  };

  const testContext: ConversationContext = {
    userMessage: 'Olá! Estou tendo dificuldade com o acorde F. Pode me ajudar?',
    userProfile: mockUserProfile,
    recentSessions: [
      {
        id: 'session-1',
        type: 'chord',
        itemName: 'C',
        accuracy: 80,
        duration: 300,
        timestamp: Date.now() - 24 * 60 * 60 * 1000
      }
    ],
    currentMood: 'frustrated',
    context: []
  };

  try {
    console.log('📤 Enviando mensagem de teste...');
    const startTime = Date.now();
    
    const response = await advancedAIService.getConversationalResponse(testContext);
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Resposta recebida!');
    console.log('⏱️  Tempo de resposta:', duration, 'ms');
    console.log('📊 Confiança:', (response.confidence * 100).toFixed(0) + '%');
    console.log('\n💬 Resposta do Tutor:');
    console.log('─'.repeat(60));
    console.log(response.response);
    console.log('─'.repeat(60));
    
    if (response.recommendations.length > 0) {
      console.log('\n📋 Recomendações:');
      response.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec.title} (Prioridade: ${rec.priority}/10)`);
      });
    }

    if (response.actions.length > 0) {
      console.log('\n🎯 Ações sugeridas:');
      response.actions.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action}`);
      });
    }

    if (response.nextSteps.length > 0) {
      console.log('\n➡️  Próximos passos:');
      response.nextSteps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
      });
    }

    return {
      success: true,
      duration,
      confidence: response.confidence,
      hasRecommendations: response.recommendations.length > 0,
      hasActions: response.actions.length > 0
    };
  } catch (error) {
    console.error('❌ Erro ao obter resposta do Tutor IA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Teste rápido de uma pergunta simples
 */
export async function quickTest(question: string) {
  console.log(`\n🚀 Teste Rápido: "${question}"\n`);
  
  const mockProfile: UserProfile = {
    id: 'test',
    name: 'Teste',
    level: 5,
    totalPracticeTime: 7200,
    averageAccuracy: 70,
    learningPace: 'moderate',
    strongAreas: [],
    weakAreas: [],
    preferences: {
      favoriteGenres: [],
      practiceTime: 'anytime'
    }
  };

  const context: ConversationContext = {
    userMessage: question,
    userProfile: mockProfile,
    recentSessions: [],
    currentMood: 'neutral',
    context: []
  };

  try {
    const response = await advancedAIService.getConversationalResponse(context);
    console.log('✅ Resposta:', response.response);
    return response;
  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

// Executar testes se rodado diretamente
if (typeof window === 'undefined') {
  // Node.js environment
  testAISystem().then(result => {
    console.log('\n📊 Resultado final:', result);
    process.exit(result.success ? 0 : 1);
  });
}
