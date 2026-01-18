import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Download,
  Play,
  Save,
  Upload,
  Database,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  Cpu,
  HardDrive,
  Music
} from 'lucide-react';
import { datasetManager, DatasetInfo } from '@/services/DatasetManager';
import { chordDetectionAIService } from '@/services/ChordDetectionAIService';

export function TrainingDashboard() {
  const [availableDatasets, setAvailableDatasets] = useState<DatasetInfo[]>([]);
  const [downloadingDataset, setDownloadingDataset] = useState<string | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<string>('');
  const [datasetStats, setDatasetStats] = useState({
    available: 0,
    downloaded: 0,
    totalSamples: 0,
    instruments: [] as string[]
  });
  const [publicDatasets, setPublicDatasets] = useState({
    guitarset: { downloaded: false, samples: 360, size: '2.3GB' },
    idmt: { downloaded: false, samples: 1200, size: '8.2GB' }
  });
  const [modelStats, setModelStats] = useState({
    isInitialized: false,
    modelLoaded: false,
    backend: 'unknown',
    memoryUsage: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    setAvailableDatasets(datasetManager.getAvailableDatasets());
    setDatasetStats(datasetManager.getDatasetStats());
    updateModelStats();
  };

  const updateModelStats = () => {
    setModelStats(chordDetectionAIService.getPerformanceStats());
  };

  const handleDownloadDataset = async (datasetName: string) => {
    setDownloadingDataset(datasetName);
    try {
      await datasetManager.downloadDataset(datasetName);
      setDatasetStats(datasetManager.getDatasetStats());
      console.log(`✅ Dataset ${datasetName} baixado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao baixar dataset ${datasetName}:`, error);
    } finally {
      setDownloadingDataset(null);
    }
  };

  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingStatus('Preparando dados de treinamento...');

    try {
      // Interceptar console.log para atualizar progresso
      const originalLog = console.log;
      console.log = (...args) => {
        originalLog.apply(console, args);
        const message = args.join(' ');

        if (message.includes('Baixando dataset')) {
          setTrainingStatus('Baixando datasets...');
          setTrainingProgress(10);
        } else if (message.includes('Data augmentation')) {
          setTrainingStatus('Aplicando data augmentation...');
          setTrainingProgress(30);
        } else if (message.includes('Dados preparados')) {
          setTrainingStatus('Preparando dados para treinamento...');
          setTrainingProgress(50);
        } else if (message.includes('Iniciando treinamento')) {
          setTrainingStatus('Treinando modelo de IA...');
          setTrainingProgress(60);
        } else if (message.includes('Epoch')) {
          const epochMatch = message.match(/Epoch (\d+)/);
          if (epochMatch) {
            const epoch = parseInt(epochMatch[1]);
            const progress = 60 + (epoch / 50) * 35; // 50 epochs = 35% progress
            setTrainingProgress(progress);
            setTrainingStatus(`Treinando... Epoch ${epoch}/50`);
          }
        } else if (message.includes('Treinamento concluído')) {
          setTrainingStatus('Salvando modelo treinado...');
          setTrainingProgress(95);
        } else if (message.includes('Modelo salvo')) {
          setTrainingProgress(100);
          setTrainingStatus('Treinamento concluído com sucesso!');
        }
      };

      await chordDetectionAIService.trainWithPublicDatasets();

      // Restaurar console.log
      console.log = originalLog;

      updateModelStats();
      setDatasetStats(datasetManager.getDatasetStats());

    } catch (error) {
      console.error('Erro durante treinamento:', error);
      setTrainingStatus('Erro durante treinamento. Verifique o console.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleSaveModel = async () => {
    try {
      await chordDetectionAIService.saveModel();
      console.log('✅ Modelo exportado com sucesso');
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
    }
  };

  const handleLoadTrainedModel = async () => {
    try {
      const loaded = await chordDetectionAIService.loadTrainedModel();
      if (loaded) {
        updateModelStats();
        console.log('✅ Modelo treinado carregado');
      } else {
        console.log('ℹ️ Nenhum modelo treinado encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
    }
  };

  const handleClearData = () => {
    datasetManager.clearDownloadedData();
    setDatasetStats(datasetManager.getDatasetStats());
    console.log('🗑️ Dados limpos');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Dashboard de Treinamento IA</h1>
              <p className="text-xl text-gray-300">Treine o modelo de detecção de acordes com dados reais</p>
            </div>
          </div>

          {/* Status do Sistema */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium">Datasets</span>
                </div>
                <div className="text-2xl font-bold">{datasetStats.available}</div>
                <div className="text-xs text-gray-400">disponíveis</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium">Baixados</span>
                </div>
                <div className="text-2xl font-bold">{datasetStats.downloaded}</div>
                <div className="text-xs text-gray-400">datasets</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium">Amostras</span>
                </div>
                <div className="text-2xl font-bold">{datasetStats.totalSamples}</div>
                <div className="text-xs text-gray-400">treinamento</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium">Modelo</span>
                </div>
                <div className="text-2xl font-bold">
                  {modelStats.modelLoaded ? '✅' : '❌'}
                </div>
                <div className="text-xs text-gray-400">treinado</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Informações sobre Datasets */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-400/20 mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-300">
                <Music className="w-5 h-5" />
                Datasets Públicos para Treinamento
              </CardTitle>
              <CardDescription className="text-gray-300">
                O MusicTutor usa datasets científicos públicos para treinar IA de alta qualidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Music className="w-4 h-4 text-green-400" />
                    </div>
                    <h4 className="font-bold">GuitarSet</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 🎵 360 gravações profissionais</li>
                    <li>• 👥 6 guitarristas diferentes</li>
                    <li>• 🎼 24 acordes + variações</li>
                    <li>• 📊 ~2.3GB de dados</li>
                    <li>• 🏛️ Universidade Queen Mary</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-yellow-400" />
                    </div>
                    <h4 className="font-bold">IDMT-SMT-Guitar</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 🎸 Guitarra elétrica</li>
                    <li>• 🎯 ~1200 gravações</li>
                    <li>• 🎪 Técnicas: bend, slide, vibrato</li>
                    <li>• 📊 ~8.2GB de dados</li>
                    <li>• 🏛️ Fraunhofer Institute</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-400/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div className="text-sm">
                    <strong className="text-purple-300">Nota:</strong> Para treinamento real com dados completos,
                    execute os scripts Python no ambiente local. O dashboard simula o processo para demonstração.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Datasets Disponíveis */}
        <Card className="mb-6 bg-white/5 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Datasets Disponíveis (Simulação)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {availableDatasets.map((dataset) => (
                <Card key={dataset.name} className="bg-white/10 border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{dataset.name}</h3>
                        <p className="text-sm text-gray-400">{dataset.description}</p>
                      </div>
                      <Badge variant="outline" className={
                        dataset.quality === 'studio' ? 'border-green-400 text-green-300' :
                        dataset.quality === 'live' ? 'border-yellow-400 text-yellow-300' :
                        'border-blue-400 text-blue-300'
                      }>
                        {dataset.quality}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
                      <span>📊 {dataset.samples} amostras</span>
                      <span>💾 {dataset.size}</span>
                      <span>🎸 {dataset.instrument}</span>
                    </div>

                    <Button
                      onClick={() => handleDownloadDataset(dataset.name)}
                      disabled={downloadingDataset === dataset.name}
                      className="w-full"
                      size="sm"
                    >
                      {downloadingDataset === dataset.name ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Baixando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Baixar Dataset
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Treinamento do Modelo */}
        <Card className="mb-6 bg-white/5 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Treinamento do Modelo IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleTrainModel}
                  disabled={isTraining || datasetStats.downloaded === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isTraining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Treinando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Treinar Modelo
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleSaveModel}
                  disabled={!modelStats.modelLoaded}
                  variant="outline"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Exportar Modelo
                </Button>

                <Button
                  onClick={handleLoadTrainedModel}
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Carregar Modelo
                </Button>

                <Button
                  onClick={handleClearData}
                  variant="outline"
                  className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                >
                  🗑️ Limpar Dados
                </Button>
              </div>

              {isTraining && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{trainingStatus}</span>
                    <span className="text-sm text-gray-400">{trainingProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={trainingProgress} className="h-2" />
                </div>
              )}

              {trainingStatus && !isTraining && (
                <div className="flex items-center gap-2 text-sm">
                  {trainingStatus.includes('Erro') ? (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  <span className={
                    trainingStatus.includes('Erro') ? 'text-red-400' : 'text-green-400'
                  }>
                    {trainingStatus}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Técnicas */}
        <Card className="bg-white/5 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Informações Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Arquitetura do Modelo</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Camadas convolucionais para padrões de áudio</li>
                  <li>• Pooling para redução dimensional</li>
                  <li>• Camadas densas para classificação</li>
                  <li>• 20+ acordes no vocabulário</li>
                  <li>• Otimizado para TensorFlow.js</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Data Augmentation</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Ruído ambiente simulado</li>
                  <li>• Variações de volume</li>
                  <li>• Mudanças sutis de pitch</li>
                  <li>• Condições reais de uso</li>
                  <li>• Aumento 6x de dados</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-300">💡 Dica de Performance</h4>
              <p className="text-sm text-gray-300">
                O treinamento usa WebGL para aceleração GPU. Certifique-se de que seu navegador
                suporta WebGL e que a GPU está habilitada para melhores resultados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}