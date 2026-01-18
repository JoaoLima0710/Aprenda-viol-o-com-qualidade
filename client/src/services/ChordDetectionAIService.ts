/**
 * ServiÃ§o de IA para DetecÃ§Ã£o de Acordes - TensorFlow.js
 * Arquitetura baseada em ML especializado para anÃ¡lise de Ã¡udio em tempo real
 */

import * as tf from '@tensorflow/tfjs';
import { datasetManager, TrainingData } from './DatasetManager';

export interface ChromagramData {
  data: number[][];
  timeSteps: number;
  frequencyBins: number;
  sampleRate: number;
}

export interface ChordClassificationResult {
  chord: string;
  confidence: number;
  probabilities: Record<string, number>;
  timestamp: number;
  processingTime: number;
}

export interface AIAudioFeatures {
  chromagram: ChromagramData;
  spectralCentroid: number[];
  spectralRolloff: number[];
  spectralFlux: number[];
  rms: number[];
  zeroCrossingRate: number[];
}

export class ChordDetectionAIService {
  private static instance: ChordDetectionAIService;
  private model: tf.LayersModel | null = null;
  private isInitialized = false;
  private isLoading = false;

  // VocabulÃ¡rio de acordes (inicial - 20 acordes essenciais)
  private chordVocabulary = [
    'C', 'D', 'E', 'G', 'A',     // Maiores abertos
    'Am', 'Dm', 'Em', 'Bm',      // Menores abertos
    'F', 'B',                    // Com pestana
    'C7', 'D7', 'E7', 'A7', 'G7', // SÃ©ptimas
    'Cm', 'Gm', 'Fm',            // Menores com pestana
    'Bb', 'Eb', 'Ab',            // Outros maiores
    'no_chord'                   // Sem acorde detectado
  ];

  // ConfiguraÃ§Ãµes do modelo
  private config = {
    sampleRate: 44100,
    fftSize: 2048,
    hopLength: 512,
    nMels: 128,
    nChroma: 12,
    bufferLength: 1024, // ~23ms de Ã¡udio
    modelPath: '/models/chord-detection/model.json'
  };

  private constructor() {}

  static getInstance(): ChordDetectionAIService {
    if (!ChordDetectionAIService.instance) {
      ChordDetectionAIService.instance = new ChordDetectionAIService();
    }
    return ChordDetectionAIService.instance;
  }

  /**
   * Inicializa o serviÃ§o de IA
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized || this.isLoading) return this.isInitialized;

    try {
      this.isLoading = true;
      console.log('ðŸŽ¸ Inicializando serviÃ§o de detecÃ§Ã£o de acordes com IA...');

      // Configurar TensorFlow.js para usar WebGL
      await tf.setBackend('webgl');
      await tf.ready();

      // Carregar modelo (por enquanto usamos placeholder atÃ© ter modelo treinado)
      await this.loadModel();

      this.isInitialized = true;
      console.log('âœ… ServiÃ§o de IA para detecÃ§Ã£o de acordes inicializado');

      return true;
    } catch (error) {
      console.error('âŒ Erro ao inicializar serviÃ§o de IA:', error);
      return false;
    } finally {
      this.isLoading = false;
    }
  }


  /**
   * Carrega o modelo de ML (placeholder por enquanto)
   */
  private async loadModel(): Promise<void> {
    try {
      // Por enquanto, criamos um modelo simples como placeholder
      // Em produÃ§Ã£o, carregaremos um modelo treinado
      this.model = await this.createPlaceholderModel();

      console.log('âœ… Modelo de detecÃ§Ã£o carregado (placeholder)');
    } catch (error) {
      console.error('âŒ Erro ao carregar modelo:', error);
      throw error;
    }
  }

  /**
   * Cria um modelo placeholder para desenvolvimento
   * Em produÃ§Ã£o, isso serÃ¡ substituÃ­do por um modelo treinado
   */
  private async createPlaceholderModel(): Promise<tf.LayersModel> {
    const model = tf.sequential();

    // Camada de entrada: espectrograma (tempo x frequÃªncia)
    model.add(tf.layers.inputLayer({ inputShape: [null, this.config.nChroma] }));

    // Camadas convolucionais para extrair padrÃµes
    model.add(tf.layers.conv1d({
      filters: 32,
      kernelSize: 3,
      activation: 'relu',
      padding: 'same'
    }));

    model.add(tf.layers.maxPooling1d({ poolSize: 2 }));

    model.add(tf.layers.conv1d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      padding: 'same'
    }));

    model.add(tf.layers.maxPooling1d({ poolSize: 2 }));

    model.add(tf.layers.conv1d({
      filters: 128,
      kernelSize: 3,
      activation: 'relu',
      padding: 'same'
    }));

    model.add(tf.layers.globalAveragePooling1d());

    // Camadas densas para classificaÃ§Ã£o
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Camada de saÃ­da: probabilidade para cada acorde
    model.add(tf.layers.dense({
      units: this.chordVocabulary.length,
      activation: 'softmax'
    }));

    // Compilar modelo
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    // Inicializar pesos (modelo nÃ£o treinado)
    await model.build();

    return model;
  }

  /**
   * Processa Ã¡udio em tempo real e detecta acordes
   */
  async detectChord(audioBuffer: Float32Array): Promise<ChordClassificationResult> {
    if (!this.isInitialized || !this.model) {
      throw new Error('ServiÃ§o de IA nÃ£o inicializado');
    }

    const startTime = performance.now();

    try {
      // Extrair features do Ã¡udio
      const features = await this.extractFeatures(audioBuffer);

      // Converter para tensor
      const inputTensor = tf.tensor3d([features.chromagram.data]);

      // Fazer inferÃªncia
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const predictionData = await prediction.data();
      const probabilities = new Float32Array(predictionData);

      // Liberar memÃ³ria
      inputTensor.dispose();
      prediction.dispose();

      // Interpretar resultado
      const result = this.interpretPrediction(probabilities);

      const processingTime = performance.now() - startTime;

      return {
        ...result,
        timestamp: Date.now(),
        processingTime
      };
    } catch (error) {
      console.error('Erro na detecÃ§Ã£o de acordes:', error);
      return {
        chord: 'unknown',
        confidence: 0,
        probabilities: {},
        timestamp: Date.now(),
        processingTime: performance.now() - startTime
      };
    }
  }

  /**
   * Extrai features do Ã¡udio (cromograma + outras features)
   */
  async extractFeatures(audioBuffer: Float32Array): Promise<AIAudioFeatures> {
    // Para desenvolvimento, criamos features simplificadas
    // Em produÃ§Ã£o, isso seria muito mais sofisticado

    const chromagram = this.extractChromagram(audioBuffer);
    const spectralCentroid = this.extractSpectralCentroid(audioBuffer);
    const spectralRolloff = this.extractSpectralRolloff(audioBuffer);
    const spectralFlux = this.extractSpectralFlux(audioBuffer);
    const rms = this.extractRMS(audioBuffer);
    const zeroCrossingRate = this.extractZeroCrossingRate(audioBuffer);

    return {
      chromagram,
      spectralCentroid,
      spectralRolloff,
      spectralFlux,
      rms,
      zeroCrossingRate
    };
  }

  /**
   * Extrai cromograma (12 bins para as 12 notas musicais)
   */
  private extractChromagram(audioBuffer: Float32Array): ChromagramData {
    // ImplementaÃ§Ã£o simplificada de cromograma
    // Em produÃ§Ã£o, usarÃ­amos bibliotecas especializadas como chroma-js

    const frameSize = 2048;
    const hopSize = 512;
    const sampleRate = this.config.sampleRate;

    const frames: number[][] = [];
    const numFrames = Math.floor((audioBuffer.length - frameSize) / hopSize) + 1;

    for (let i = 0; i < numFrames; i++) {
      const start = i * hopSize;
      const frame = audioBuffer.slice(start, start + frameSize);

      // FFT simplificada (apenas magnitude)
      const chromaFrame = this.frameToChroma(frame);
      frames.push(chromaFrame);
    }

    return {
      data: frames,
      timeSteps: frames.length,
      frequencyBins: 12,
      sampleRate
    };
  }

  /**
   * Converte um frame de Ã¡udio em representaÃ§Ã£o chroma (12 bins)
   */
  private frameToChroma(frame: Float32Array): number[] {
    // FFT simplificada - em produÃ§Ã£o usarÃ­amos FFT real
    const chroma = new Array(12).fill(0);

    // Detectar frequÃªncias fundamentais aproximadas
    const fundamentalFreq = this.detectFundamentalFrequency(frame);

    if (fundamentalFreq > 0) {
      // Mapear para nota (0-11 representando C a B)
      const midiNote = Math.round(12 * Math.log2(fundamentalFreq / 440) + 69);
      const chromaIndex = midiNote % 12;

      chroma[chromaIndex] = 1.0;
    }

    return chroma;
  }

  /**
   * DetecÃ§Ã£o simplificada de frequÃªncia fundamental
   */
  private detectFundamentalFrequency(frame: Float32Array): number {
    // AutocorrelaÃ§Ã£o simplificada
    const sampleRate = this.config.sampleRate;
    const minFreq = 80; // Mi grave
    const maxFreq = 1000; // Mi agudo

    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);

    let bestCorrelation = 0;
    let bestPeriod = 0;

    // Calcular autocorrelaÃ§Ã£o para diferentes lags
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;

      for (let i = 0; i < frame.length - period; i++) {
        correlation += frame[i] * frame[i + period];
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  /**
   * Extrai centroide espectral
   */
  private extractSpectralCentroid(audioBuffer: Float32Array): number[] {
    // Simplificado - apenas um valor mÃ©dio
    const centroid = audioBuffer.reduce((sum, sample) => sum + Math.abs(sample), 0) / audioBuffer.length;
    return [centroid];
  }

  /**
   * Extrai rolloff espectral
   */
  private extractSpectralRolloff(audioBuffer: Float32Array): number[] {
    const rolloff = audioBuffer.reduce((sum, sample) => sum + sample * sample, 0) / audioBuffer.length;
    return [Math.sqrt(rolloff)];
  }

  /**
   * Extrai fluxo espectral
   */
  private extractSpectralFlux(audioBuffer: Float32Array): number[] {
    let flux = 0;
    for (let i = 1; i < audioBuffer.length; i++) {
      flux += Math.abs(audioBuffer[i] - audioBuffer[i - 1]);
    }
    return [flux / audioBuffer.length];
  }

  /**
   * Extrai RMS (Root Mean Square)
   */
  private extractRMS(audioBuffer: Float32Array): number[] {
    const rms = Math.sqrt(
      audioBuffer.reduce((sum, sample) => sum + sample * sample, 0) / audioBuffer.length
    );
    return [rms];
  }

  /**
   * Extrai taxa de cruzamento por zero
   */
  private extractZeroCrossingRate(audioBuffer: Float32Array): number[] {
    let crossings = 0;
    for (let i = 1; i < audioBuffer.length; i++) {
      if ((audioBuffer[i] > 0 && audioBuffer[i - 1] <= 0) ||
          (audioBuffer[i] < 0 && audioBuffer[i - 1] >= 0)) {
        crossings++;
      }
    }
    return [crossings / audioBuffer.length];
  }

  /**
   * Interpreta as probabilidades do modelo
   */
  private interpretPrediction(probabilities: Float32Array): {
    chord: string;
    confidence: number;
    probabilities: Record<string, number>;
  } {
    // Encontrar a classe com maior probabilidade
    let maxProb = 0;
    let maxIndex = 0;

    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIndex = i;
      }
    }

    const chord = this.chordVocabulary[maxIndex];
    const confidence = maxProb;

    // Se a confianÃ§a for muito baixa, considerar como indeterminado
    const isLowConfidence = confidence < 0.3;

    // Converter para objeto de probabilidades
    const probObj: Record<string, number> = {};
    this.chordVocabulary.forEach((chordName, index) => {
      probObj[chordName] = probabilities[index];
    });

    return {
      chord: chord === 'no_chord' || isLowConfidence ? 'unknown' : chord,
      confidence: isLowConfidence ? 0 : confidence,
      probabilities: probObj
    };
  }

  /**
  /**
   * Treina o modelo com dados de datasets pÃºblicos
   */
  async trainWithPublicDatasets(): Promise<void> {
    console.log('ðŸŽ¯ Iniciando treinamento com datasets pÃºblicos...');

    try {
      // Baixar e processar datasets
      const guitarSetSamples = await datasetManager.downloadDataset('GuitarSet');
      const idmtSamples = await datasetManager.downloadDataset('IDMT-SMT-Guitar');

      const allSamples = [...guitarSetSamples, ...idmtSamples];
      console.log(`ðŸ“Š Total de amostras coletadas: ${allSamples.length}`);

      // Aplicar data augmentation
      const augmentedSamples = datasetManager.applyDataAugmentation(allSamples);
      console.log(`ðŸ”„ ApÃ³s augmentation: ${augmentedSamples.length} amostras`);

      // Preparar dados para treinamento
      const trainingData = await this.prepareTrainingData(augmentedSamples);
      console.log(`ðŸŽ¯ Dados preparados: ${trainingData.features.length} exemplos de treinamento`);

      // Treinar modelo
      await this.trainModel(trainingData);

      // Salvar modelo treinado
      await this.saveTrainedModel();

      console.log('âœ… Treinamento concluÃ­do com sucesso!');

    } catch (error) {
      console.error('âŒ Erro durante treinamento:', error);
      throw error;
    }
  }

  /**
   * Prepara dados para treinamento
   */
  private async prepareTrainingData(samples: any[]): Promise<TrainingData> {
    return datasetManager.prepareTrainingData(samples, this.chordVocabulary);
  }

  /**
   * Treina o modelo com dados preparados
   */
  private async trainModel(trainingData: TrainingData): Promise<void> {
    if (!this.model) throw new Error('Modelo nÃ£o inicializado');

    console.log('ðŸš€ Iniciando treinamento do modelo...');

    // Converter dados para tensores
    const xTrain = tf.tensor3d(trainingData.features);
    const yTrain = tf.tensor2d(trainingData.labels.map(label =>
      this.chordVocabulary.map((_, index) => index === label ? 1 : 0)
    ));

    // Treinar
    await this.model.fit(xTrain, yTrain, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if ((epoch + 1) % 10 === 0) {
            console.log(`ðŸ“ˆ Epoch ${epoch + 1}: loss = ${logs?.loss?.toFixed(4)}, accuracy = ${(logs?.acc ? (logs.acc * 100).toFixed(2) : 'N/A')}%`);
          }
        },
        onTrainEnd: () => {
          console.log('âœ… Treinamento finalizado');
        }
      }
    });

    // Limpar memÃ³ria
    xTrain.dispose();
    yTrain.dispose();

    console.log('ðŸŽ‰ Modelo treinado com sucesso!');
  }

  /**
   * Salva o modelo treinado
   */
  async saveTrainedModel(): Promise<void> {
    if (!this.model) throw new Error('Modelo nÃ£o inicializado');

    const modelName = `chord-detection-model-${Date.now()}`;

    try {
      await this.model.save(`localstorage://${modelName}`);
      localStorage.setItem('musictutor_trained_model', modelName);
      console.log(`ðŸ’¾ Modelo salvo: ${modelName}`);
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
      // Fallback: salvar como download
      await this.model.save('downloads://chord-detection-model');
    }
  }

  /**
   * Carrega um modelo treinado salvo localmente
   */
  async loadTrainedModel(): Promise<boolean> {
    try {
      const modelName = localStorage.getItem('musictutor_trained_model');

      if (modelName) {
        this.model = await tf.loadLayersModel(`localstorage://${modelName}`);
        console.log(`âœ… Modelo treinado carregado: ${modelName}`);
        return true;
      }

      console.log('â„¹ï¸ Nenhum modelo treinado encontrado');
      return false;
    } catch (error) {
      console.error('Erro ao carregar modelo treinado:', error);
      return false;
    }
  }

  /**
   * Salva o modelo para download
   */
  async saveModel(): Promise<void> {
    if (!this.model) throw new Error('Modelo nÃ£o inicializado');

    await this.model.save('downloads://chord-detection-model');
    console.log('âœ… Modelo exportado para download');
  }

  /**
   * Carrega modelo de URL externa
   */
  async loadModelFromUrl(modelUrl: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(modelUrl);
      console.log('âœ… Modelo carregado de URL externa');
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
      throw error;
    }
  }

  /**
   * ObtÃ©m estatÃ­sticas de performance
   */
  getPerformanceStats(): {
    isInitialized: boolean;
    modelLoaded: boolean;
    backend: string;
    memoryUsage: number;
  } {
    return {
      isInitialized: this.isInitialized,
      modelLoaded: !!this.model,
      backend: tf.getBackend(),
      memoryUsage: tf.memory().numBytes
    };
  }

  /**
   * Limpa recursos
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }

    this.isInitialized = false;
  }
}

export const chordDetectionAIService = ChordDetectionAIService.getInstance();
