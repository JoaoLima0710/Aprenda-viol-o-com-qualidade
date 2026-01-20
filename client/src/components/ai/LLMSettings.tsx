import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Loader2, ExternalLink, Info } from 'lucide-react';
import { freeLLMService, FreeLLMProvider } from '@/services/FreeLLMService';
import { llmIntegrationService } from '@/services/LLMIntegrationService';
import { toast } from 'sonner';

export function LLMSettings() {
  const [config, setConfig] = useState(freeLLMService.getConfig());
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState<FreeLLMProvider | null>(null);
  const [testResults, setTestResults] = useState<Record<FreeLLMProvider, boolean | null>>({
    openrouter: null,
    groq: null,
    huggingface: null,
    gemini: null,
    ollama: null,
    simulated: null,
  });
  const [selectedModel, setSelectedModel] = useState(config.model || '');

  const providers = freeLLMService.getAvailableProviders();

  useEffect(() => {
    // Carregar API key do localStorage se existir
    const savedKey = localStorage.getItem(`musictutor_llm_${config.provider}_key`);
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, [config.provider]);

  const handleProviderChange = (provider: FreeLLMProvider) => {
    setConfig(prev => ({ ...prev, provider }));
    freeLLMService.updateConfig({ provider });
    llmIntegrationService.setFreeLLMProvider(provider);
    
    // Carregar API key salva para este provedor
    const savedKey = localStorage.getItem(`musictutor_llm_${provider}_key`);
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setApiKey('');
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      freeLLMService.updateConfig({ apiKey: apiKey.trim() });
      localStorage.setItem(`musictutor_llm_${config.provider}_key`, apiKey.trim());
      toast.success('API key salva com sucesso!');
    } else {
      toast.error('Por favor, insira uma API key válida');
    }
  };

  const handleTestProvider = async (provider: FreeLLMProvider) => {
    setTesting(provider);
    try {
      const result = await freeLLMService.testProvider(provider, {
        apiKey: provider === config.provider ? apiKey : undefined,
      });
      setTestResults(prev => ({ ...prev, [provider]: result }));
      
      if (result) {
        toast.success(`${provider} está funcionando!`);
      } else {
        toast.error(`${provider} não está disponível. Verifique a configuração.`);
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [provider]: false }));
      toast.error(`Erro ao testar ${provider}`);
    } finally {
      setTesting(null);
    }
  };

  const getProviderInfo = (provider: FreeLLMProvider) => {
    const info: Record<FreeLLMProvider, { name: string; url: string; description: string; free: boolean; needsApiKey: boolean }> = {
      openrouter: {
        name: 'OpenRouter (Automático)',
        url: 'https://openrouter.ai/keys',
        description: '✅ Funciona automaticamente! Múltiplos modelos gratuitos: Llama, Mistral, Gemma. 10.000+ tokens/dia grátis!',
        free: true,
        needsApiKey: false, // Não precisa - já configurado automaticamente
      },
      groq: {
        name: 'Groq',
        url: 'https://console.groq.com/',
        description: 'Muito rápido, gratuito com rate limits generosos',
        free: true,
        needsApiKey: true,
      },
      huggingface: {
        name: 'Hugging Face',
        url: 'https://huggingface.co/inference-api',
        description: 'Gratuito, sem necessidade de API key para modelos públicos',
        free: true,
        needsApiKey: false,
      },
      gemini: {
        name: 'Google Gemini',
        url: 'https://makersuite.google.com/app/apikey',
        description: 'Gratuito, boa qualidade de respostas',
        free: true,
        needsApiKey: true,
      },
      ollama: {
        name: 'Ollama',
        url: 'https://ollama.ai/',
        description: 'Totalmente local, requer instalação no seu computador',
        free: true,
        needsApiKey: false,
      },
      simulated: {
        name: 'Simulado',
        url: '',
        description: 'Respostas pré-programadas (fallback)',
        free: true,
        needsApiKey: false,
      },
    };
    return info[provider];
  };

  // Obtém os modelos disponíveis para o provedor atual
  const getModelsForCurrentProvider = () => {
    return freeLLMService.getModelsForProvider(config.provider);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    freeLLMService.updateConfig({ model });
    setConfig(prev => ({ ...prev, model }));
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Info className="w-5 h-5" />
          Configuração de LLM Gratuito
        </CardTitle>
        <CardDescription className="text-gray-400">
          Configure um provedor de LLM gratuito para respostas mais inteligentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mensagem de Status Automático */}
        {config.provider === 'openrouter' && (
          <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/40">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white font-semibold">OpenRouter Configurado Automaticamente!</p>
                <p className="text-sm text-gray-300 mt-1">
                  O sistema está pronto para usar. Não é necessário configurar nada. 
                  O Tutor IA já está funcionando com modelos gratuitos de alta qualidade.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Seleção de Provedor */}
        <div className="space-y-2">
          <Label className="text-white">Provedor LLM</Label>
          <Select
            value={config.provider}
            onValueChange={(value) => handleProviderChange(value as FreeLLMProvider)}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.provider} value={p.provider}>
                  <div className="flex items-center justify-between w-full">
                    <span>{p.name}</span>
                    {p.available && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Disponível
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Informações do Provedor */}
        {(() => {
          const info = getProviderInfo(config.provider);
          return (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-white font-semibold">{info.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{info.description}</p>
                </div>
                {info.free && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Gratuito
                  </Badge>
                )}
              </div>
              {info.url && (
                <a
                  href={info.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
                >
                  Obter API Key <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          );
        })()}

        {/* API Key (se necessário) */}
        {getProviderInfo(config.provider).needsApiKey && (
          <div className="space-y-2">
            <Label className="text-white">API Key</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua API key aqui"
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Button
                onClick={handleSaveApiKey}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Salvar
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Sua API key é armazenada localmente no navegador
            </p>
          </div>
        )}

        {/* Seleção de Modelo */}
        {getModelsForCurrentProvider().length > 0 && (
          <div className="space-y-2">
            <Label className="text-white">Modelo</Label>
            <Select
              value={selectedModel || getModelsForCurrentProvider()[0]}
              onValueChange={handleModelChange}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {getModelsForCurrentProvider().map((model) => (
                  <SelectItem key={model} value={model}>
                    <span className="text-sm">{model}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">
              {config.provider === 'openrouter' && 'Modelos com ":free" no nome são gratuitos'}
              {config.provider === 'groq' && 'Todos os modelos Groq têm inferência ultrarrápida'}
            </p>
          </div>
        )}

        {/* Ollama Base URL */}
        {config.provider === 'ollama' && (
          <div className="space-y-2">
            <Label className="text-white">URL Base do Ollama</Label>
            <Input
              value={config.baseUrl || 'http://localhost:11434'}
              onChange={(e) => {
                const newConfig = { ...config, baseUrl: e.target.value };
                setConfig(newConfig);
                freeLLMService.updateConfig(newConfig);
              }}
              placeholder="http://localhost:11434"
              className="bg-slate-800 border-slate-700 text-white"
            />
            <p className="text-xs text-gray-400">
              URL padrão: http://localhost:11434 (se Ollama estiver rodando localmente)
            </p>
          </div>
        )}

        {/* Teste de Conexão */}
        <div className="space-y-2">
          <Label className="text-white">Testar Conexão</Label>
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <Button
                key={p.provider}
                variant="outline"
                size="sm"
                onClick={() => handleTestProvider(p.provider)}
                disabled={testing === p.provider}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                {testing === p.provider ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : testResults[p.provider] === true ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                    {p.name}
                  </>
                ) : testResults[p.provider] === false ? (
                  <>
                    <XCircle className="w-4 h-4 mr-2 text-red-400" />
                    {p.name}
                  </>
                ) : (
                  p.name
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Status Atual */}
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Provedor Atual</p>
              <p className="text-white font-semibold">
                {getProviderInfo(config.provider).name}
              </p>
            </div>
            {testResults[config.provider] === true && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Funcionando
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
