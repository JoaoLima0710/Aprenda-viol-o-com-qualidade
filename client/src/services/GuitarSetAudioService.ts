/**
 * GuitarSetAudioService
 * 
 * Usa samples reais extraídos do dataset GuitarSet para reprodução de áudio.
 * Oferece som autêntico de guitarra gravada por profissionais.
 */

import type { InstrumentType } from './AudioServiceWithSamples';

interface ChordManifest {
  [chordName: string]: {
    file: string;
    duration: number;
  };
}

interface NoteManifest {
  [noteName: string]: {
    file: string;
    duration: number;
  };
}

class GuitarSetAudioService {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private isLoading = false;
  private chordBuffers: Map<string, AudioBuffer> = new Map();
  private noteBuffers: Map<string, AudioBuffer> = new Map();
  private chordManifest: ChordManifest | null = null;
  private noteManifest: NoteManifest | null = null;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private gainNode: GainNode | null = null;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      // CRÍTICO: Sempre tentar resumir AudioContext em tablets/mobile
      if (this.audioContext) {
        try {
          if (this.audioContext.state === 'suspended') {
            console.log('📱 Resuming suspended AudioContext...');
            await this.audioContext.resume();
          }
          // Verificar se realmente está rodando
          if (this.audioContext.state !== 'running') {
            console.warn('⚠️ AudioContext not running, state:', this.audioContext.state);
            // Forçar recriação se não estiver rodando
            this.isInitialized = false;
          } else {
            return true;
          }
        } catch (e) {
          console.warn('⚠️ Error resuming AudioContext:', e);
          this.isInitialized = false;
        }
      }
    }

    if (this.isLoading) {
      console.log('⏳ Already loading GuitarSet samples...');
      // Aguardar o carregamento atual
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.isInitialized;
    }

    this.isLoading = true;

    try {
      // Detectar se é tablet/mobile para otimizações
      const isTablet = /ipad|android(?!.*mobile)/i.test(navigator.userAgent.toLowerCase());
      const isMobile = /android|iphone|ipod/i.test(navigator.userAgent.toLowerCase());
      
      console.log('🎵 Initializing GuitarSet for', isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop');

      // Create AudioContext with optimized settings for tablets
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      // Configurações otimizadas para cada dispositivo
      const contextOptions: AudioContextOptions = {
        sampleRate: 44100,
        latencyHint: isTablet ? 'playback' : 'interactive', // Tablets precisam de 'playback' para estabilidade
      };
      
      this.audioContext = new AudioContextClass(contextOptions);
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 1.0; // Volume máximo para tablets

      // CRÍTICO para tablets: Forçar resume múltiplas vezes se necessário
      let attempts = 0;
      while (this.audioContext.state !== 'running' && attempts < 5) {
        console.log(`📱 Attempt ${attempts + 1} to resume AudioContext...`);
        try {
          await this.audioContext.resume();
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          console.warn('Resume attempt failed:', e);
        }
        attempts++;
      }

      console.log('🎵 AudioContext created for GuitarSet samples, state:', this.audioContext.state);

      // Load manifests
      await this.loadManifests();

      // Preload essential samples (chords) - critical for smooth playback
      await this.preloadChords();

      this.isInitialized = true;
      console.log('✅ GuitarSetAudioService initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing GuitarSetAudioService:', error);
      this.isInitialized = false;
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  private async loadManifests(): Promise<void> {
    try {
      // Load chord manifest
      const chordManifestResponse = await fetch('/samples/chords/manifest.json');
      if (chordManifestResponse.ok) {
        this.chordManifest = await chordManifestResponse.json();
        console.log(`📋 Loaded chord manifest: ${Object.keys(this.chordManifest!).length} chords`);
      } else {
        console.warn('⚠️ Chord manifest not found');
      }

      // Load note manifest (if exists)
      try {
        const noteManifestResponse = await fetch('/samples/notes/manifest.json');
        if (noteManifestResponse.ok) {
          this.noteManifest = await noteManifestResponse.json();
          console.log(`📋 Loaded note manifest: ${Object.keys(this.noteManifest!).length} notes`);
        }
      } catch (e) {
        // Notes manifest is optional
        console.log('ℹ️ Note manifest not available');
      }
    } catch (error) {
      console.error('❌ Error loading manifests:', error);
    }
  }

  private async preloadChords(): Promise<void> {
    if (!this.chordManifest || !this.audioContext) return;

    console.log('📦 Preloading essential chord samples...');

    // Preload common chords (C, D, E, G, A, Am, Em)
    // Expanded list for better tablet performance
    const essentialChords = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Dm', 'Em', 'Gm', 'C7', 'D7', 'G7', 'A7'];
    
    // Load chords sequentially for tablets to prevent buffer issues
    // This ensures each chord is fully loaded before starting the next
    for (const chord of essentialChords) {
      if (this.chordManifest![chord]) {
        try {
          await this.loadChordSample(chord);
          // Small delay between loads to prevent overwhelming the tablet's audio system
          await new Promise(resolve => setTimeout(resolve, 10));
        } catch (error) {
          console.warn(`⚠️ Failed to preload chord ${chord}:`, error);
        }
      }
    }

    console.log('✅ Essential chords preloaded');
  }

  private async loadChordSample(chordName: string): Promise<AudioBuffer | null> {
    if (this.chordBuffers.has(chordName)) {
      return this.chordBuffers.get(chordName)!;
    }

    if (!this.chordManifest || !this.chordManifest[chordName]) {
      console.warn(`⚠️ Chord sample not found: ${chordName}`);
      return null;
    }

    if (!this.audioContext) {
      console.error('❌ AudioContext not initialized');
      return null;
    }

    try {
      const file = this.chordManifest[chordName].file;
      // Arquivos com sustenido usam 'sharp' no nome (ex: Asharp.wav)
      const response = await fetch(`/samples/chords/${file}`);
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to load chord sample: ${file}`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.chordBuffers.set(chordName, audioBuffer);
      console.log(`✅ Loaded chord sample: ${chordName}`);
      
      return audioBuffer;
    } catch (error) {
      console.error(`❌ Error loading chord sample ${chordName}:`, error);
      return null;
    }
  }

  private async loadNoteSample(noteName: string): Promise<AudioBuffer | null> {
    // CRÍTICO: Validar que é uma nota individual (deve ter oitava)
    // Notas individuais SEMPRE têm formato como "F2", "E4", etc.
    // Se não tiver oitava, pode ser um acorde e NÃO deve ser usado
    if (!/\d/.test(noteName)) {
      console.error(`❌ ERRO CRÍTICO: Tentativa de carregar sample sem oitava: ${noteName}. Isso pode ser um acorde!`);
      return null;
    }

    if (this.noteBuffers.has(noteName)) {
      return this.noteBuffers.get(noteName)!;
    }

    if (!this.noteManifest || !this.noteManifest[noteName]) {
      console.warn(`⚠️ Note sample not found in manifest: ${noteName}`);
      return null;
    }

    if (!this.audioContext) {
      console.error('❌ AudioContext not initialized');
      return null;
    }

    try {
      const file = this.noteManifest[noteName].file;
      
      // Validação adicional: garantir que o arquivo está na pasta de notas
      if (!file.endsWith('.wav')) {
        console.error(`❌ ERRO: Arquivo de nota inválido: ${file}`);
        return null;
      }
      
      // Arquivos com sustenido usam 'sharp' no nome (ex: Asharp2.wav)
      const response = await fetch(`/samples/notes/${file}`);
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to load note sample: ${file} (HTTP ${response.status})`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Validação crítica para F2: verificar se o sample está correto
      if (noteName === 'F2') {
        // F2 problemático geralmente tem duração > 3s (característica de acorde)
        if (audioBuffer.duration > 3.0) {
          console.error(`❌ F2 DETECTADO COMO ACORDE: duração de ${audioBuffer.duration.toFixed(2)}s é muito longa para nota individual!`);
          console.error(`❌ O sample F2.wav precisa ser reextraído do dataset com uma nota individual limpa.`);
          // Retornar null para não usar sample incorreto
          return null;
        }
        console.log(`✅ F2 validado: duração=${audioBuffer.duration.toFixed(2)}s (correto para nota individual)`);
      }
      
      // Validação geral: verificar se o buffer tem duração razoável (notas individuais são mais curtas que acordes)
      
      // Validação geral: verificar se o buffer tem duração razoável (notas individuais são mais curtas que acordes)
      // Acordes geralmente têm mais de 2s, notas individuais são mais curtas
      if (audioBuffer.duration > 3.0) {
        console.warn(`⚠️ AVISO: Sample ${noteName} tem duração muito longa (${audioBuffer.duration.toFixed(2)}s). Pode ser um acorde ao invés de nota individual!`);
      }
      
      this.noteBuffers.set(noteName, audioBuffer);
      console.log(`✅ Loaded note sample: ${noteName} (duration: ${audioBuffer.duration.toFixed(2)}s)`);
      
      return audioBuffer;
    } catch (error) {
      console.error(`❌ Error loading note sample ${noteName}:`, error);
      return null;
    }
  }

  private async playBuffer(buffer: AudioBuffer, startTime?: number, duration?: number, normalizationGain: number = 1.0): Promise<void> {
    if (!this.audioContext || !this.gainNode) {
      console.error('❌ AudioContext not initialized');
      return;
    }

    // Verificar estado do AudioContext
    console.log('🎵 playBuffer: AudioContext state:', this.audioContext.state);

    // CRÍTICO para tablets: Verificar se o contexto está fechado
    if (this.audioContext.state === 'closed') {
      console.error('❌ AudioContext is closed, cannot play');
      return;
    }

    // CRÍTICO: Para acordes em tablets, NÃO parar fontes anteriores
    // Isso permite que o acorde completo seja tocado
    // Apenas parar para notas individuais (implementado em playNote)
    const activeCount = this.activeSources.size;
    if (activeCount > 3) {
      // Só limpar se tiver muitas fontes ativas (evitar memory leak)
      console.warn(`⚠️ Muitas fontes ativas (${activeCount}), limpando...`);
      this.stopAll();
    }

    // Resume context if suspended (critical for tablets)
    if (this.audioContext.state === 'suspended') {
      console.log('📱 Resuming suspended AudioContext before playback...');
      this.audioContext.resume().then(() => {
        console.log('✅ AudioContext resumed, state:', this.audioContext?.state);
      }).catch(err => {
        console.error('❌ Failed to resume AudioContext:', err);
      });
    }

    // Criar NOVA fonte de áudio - cada nota precisa de sua própria fonte
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Criar gain para normalização de volume (aplicado antes do envelope)
    const normalizationGainNode = this.audioContext.createGain();
    normalizationGainNode.gain.value = normalizationGain;
    
    // Criar um GainNode separado para envelope ADSR (melhor controle de volume)
    // Cada fonte tem seu próprio envelope para evitar interferência
    const envelopeGain = this.audioContext.createGain();
    
    // Conectar: source -> normalizationGain -> envelopeGain -> gainNode -> destination
    source.connect(normalizationGainNode);
    normalizationGainNode.connect(envelopeGain);
    envelopeGain.connect(this.gainNode);

    // Track active sources for cleanup
    this.activeSources.add(source);

    source.onended = () => {
      // Limpar quando a fonte terminar
      try {
        source.disconnect();
        normalizationGainNode.disconnect();
        envelopeGain.disconnect();
      } catch (e) {
        // Pode já estar desconectado
      }
      this.activeSources.delete(source);
    };

    // Use a small lookahead time for smoother playback
    // Isso garante que o sistema de áudio tenha tempo para preparar
    const lookaheadTime = 0.05; // 50ms lookahead - mais tempo para garantir limpeza
    const baseTime = this.audioContext.currentTime;
    const actualStartTime = startTime ?? (baseTime + lookaheadTime);

    // Calcular duração real - usar a maior entre a duração solicitada e a do buffer
    const bufferDuration = buffer.duration;
    let actualDuration = duration;
    
    // Se não especificada duração, usar a duração completa do buffer
    if (!actualDuration) {
      actualDuration = bufferDuration;
    } else if (actualDuration > bufferDuration) {
      // Se a duração solicitada for maior que o buffer, usar o buffer completo
      actualDuration = bufferDuration;
    }

    // Aplicar envelope ADSR padrão se normalização foi aplicada (indica que é acorde)
    // Caso contrário, usar envelope simplificado para notas individuais
    const isChord = normalizationGain !== 1.0;
    
    try {
      if (isChord) {
        // Envelope ADSR padrão para acordes (garante consistência)
        const { applyADSREnvelope } = await import('./ChordNormalizer');
        applyADSREnvelope(envelopeGain, this.audioContext, actualStartTime, actualDuration);
      } else {
        // Envelope ultra-simplificado para notas individuais
        // Mínima complexidade para evitar qualquer sobreposição ou som de acorde
        const attackTime = 0.003; // 3ms - ataque quase instantâneo
        const releaseTime = Math.min(0.2, actualDuration * 0.06); // Release suave, máximo 200ms
        
        const envelopeStart = actualStartTime;
        const envelopePeak = envelopeStart + attackTime;
        const envelopeEnd = envelopeStart + actualDuration;
        const envelopeReleaseStart = Math.max(envelopePeak, envelopeEnd - releaseTime);
        
        // Envelope mínimo: Ataque quase instantâneo + Sustain máximo + Release suave
        // Garante que cada nota seja PERFEITAMENTE clara, única e identificável
        // Sem qualquer complexidade que possa causar sobreposição
        
        // Iniciar em 0
        envelopeGain.gain.setValueAtTime(0, envelopeStart);
        
        // Ataque quase instantâneo para volume máximo
        envelopeGain.gain.linearRampToValueAtTime(1.0, envelopePeak);
        
        // Sustain - volume máximo durante quase toda a nota
        if (envelopeReleaseStart > envelopePeak) {
          envelopeGain.gain.setValueAtTime(1.0, envelopeReleaseStart);
        }
        
        // Release suave apenas no final - fade out natural
        envelopeGain.gain.linearRampToValueAtTime(0, envelopeEnd);
      }

      // Iniciar a fonte
      source.start(actualStartTime);
      
      // Parar a fonte no final exato da duração
      // O envelope já fez o fade out, então não haverá click
      const envelopeEnd = actualStartTime + actualDuration;
      source.stop(envelopeEnd);
      
      console.log(`🎵 Playing buffer: start=${actualStartTime.toFixed(3)}, end=${envelopeEnd.toFixed(3)}, duration=${actualDuration.toFixed(3)}, normalized=${isChord}`);
      
    } catch (error) {
      console.error('❌ Error starting audio source:', error);
      // Limpar em caso de erro
      try {
        source.disconnect();
        envelopeGain.disconnect();
      } catch (e) {
        // Ignorar
      }
      this.activeSources.delete(source);
    }
  }

  async playChord(chordName: string, duration?: number): Promise<void> {
    console.log('🎸 GuitarSet: Playing chord:', chordName);

    // CRÍTICO: Garantir inicialização antes de qualquer operação
    const initialized = await this.initialize();
    if (!initialized) {
      console.error('❌ GuitarSetAudioService not initialized');
      // Tentar reinicializar uma vez
      this.isInitialized = false;
      const retryInit = await this.initialize();
      if (!retryInit) {
        console.error('❌ Falha na reinicialização');
        return;
      }
    }

    // CRÍTICO para tablets: Garantir AudioContext ativo
    if (this.audioContext) {
      const state = this.audioContext.state;
      console.log('📱 AudioContext state before playing:', state);
      
      if (state !== 'running') {
        console.log('📱 AudioContext not running, attempting to resume...');
        try {
          await this.audioContext.resume();
          // Delay extra para tablets
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Verificar novamente
          if (this.audioContext.state !== 'running') {
            console.error('❌ AudioContext still not running after resume:', this.audioContext.state);
            // Última tentativa: recriar AudioContext
            await this.recreateAudioContext();
          }
        } catch (error) {
          console.error('❌ Failed to resume AudioContext:', error);
          await this.recreateAudioContext();
        }
      }
    } else {
      console.error('❌ No AudioContext available');
      return;
    }

    // Normalize chord name (handle variations)
    const normalizedChord = this.normalizeChordName(chordName);
    console.log('🎵 Normalized chord:', normalizedChord);
    
    // Load sample if not already loaded (pre-loading is critical for smooth playback)
    let buffer = await this.loadChordSample(normalizedChord);
    
    if (!buffer) {
      console.warn(`⚠️ Chord sample not available: ${normalizedChord}, trying fallback...`);
      // Try without suffix (e.g., "C" instead of "Cmaj")
      const root = normalizedChord.replace(/[m7#b]/g, '');
      buffer = await this.loadChordSample(root);
      
      if (!buffer) {
        console.error(`❌ No sample available for chord: ${chordName}`);
        return;
      }
    }

    // Verificar se o buffer é válido
    if (buffer.length === 0 || buffer.duration === 0) {
      console.error('❌ Buffer inválido:', buffer);
      return;
    }

    console.log('🎵 Buffer loaded:', buffer.duration.toFixed(2), 's, channels:', buffer.numberOfChannels);

    // Normalizar volume do buffer usando ChordNormalizer
    // Isso garante que todos os acordes tenham loudness consistente
    const { chordNormalizer } = await import('./ChordNormalizer');
    const normalizationGain = chordNormalizer.analyzeAndNormalize(buffer, normalizedChord);
    
    // Para tablets: usar duração completa do sample
    const fullDuration = duration || buffer.duration;
    
    // Play the buffer with normalized gain and full duration
    // O envelope ADSR será aplicado automaticamente no playBuffer quando normalizationGain !== 1.0
    await this.playBuffer(buffer, undefined, fullDuration, normalizationGain);
    console.log(`✅ Chord played: ${normalizedChord}, duration: ${fullDuration.toFixed(2)}s, gain: ${normalizationGain.toFixed(3)}`);
  }

  /**
   * Recriar AudioContext (fallback para tablets com problemas)
   */
  private async recreateAudioContext(): Promise<void> {
    console.log('🔄 Recreating AudioContext...');
    
    try {
      // Fechar contexto antigo se existir
      if (this.audioContext) {
        try {
          await this.audioContext.close();
        } catch (e) {
          // Ignorar erros ao fechar
        }
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        sampleRate: 44100,
        latencyHint: 'playback',
      });

      // Recriar gain node
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 1.0;

      // Resumir
      await this.audioContext.resume();
      console.log('✅ AudioContext recreated, state:', this.audioContext.state);
    } catch (error) {
      console.error('❌ Failed to recreate AudioContext:', error);
    }
  }

  async playChordStrummed(chordName: string, duration?: number): Promise<void> {
    // For strummed, we play the same sample but can add slight delay between strings
    // For now, just play normally (the samples are already strummed)
    await this.playChord(chordName, duration);
  }

  async playScale(scaleName: string, root: string, intervals: number[], duration: number = 0.5): Promise<void> {
    console.log('🎵 GuitarSet: Playing scale:', scaleName, 'from', root);

    const initialized = await this.initialize();
    if (!initialized) {
      console.error('❌ GuitarSetAudioService not initialized');
      return;
    }

    // Convert intervals to note names
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = NOTES.indexOf(root.toUpperCase());
    
    if (rootIndex === -1) {
      console.error('❌ Invalid root note:', root);
      return;
    }

    // Generate scale notes
    const scaleNotes = intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return NOTES[noteIndex];
    });

    // Add octave return
    scaleNotes.push(root.toUpperCase());

    // Play notes in sequence
    const startTime = this.audioContext!.currentTime;
    
    for (let i = 0; i < scaleNotes.length; i++) {
      const noteName = scaleNotes[i];
      const noteWithOctave = noteName + '4'; // Use octave 4 for consistency
      
      // CRÍTICO: Validar que a nota tem oitava antes de carregar
      if (!/\d/.test(noteWithOctave)) {
        console.error(`❌ ERRO: Nota sem oitava na escala: ${noteWithOctave}`);
        continue;
      }

      // Try to load note sample - APENAS com oitava
      let buffer = await this.loadNoteSample(noteWithOctave);
      
      // Tentar variações de oitava se não encontrar
      if (!buffer) {
        const noteBase = noteWithOctave.replace(/\d+$/, '');
        const currentOctave = parseInt(noteWithOctave.match(/\d+$/)?.[0] || '4');
        const variations = [
          `${noteBase}${currentOctave + 1}`,
          `${noteBase}${currentOctave - 1}`,
        ];
        
        for (const variation of variations) {
          if (variation.match(/\d/) && this.noteManifest?.[variation]) {
            buffer = await this.loadNoteSample(variation);
            if (buffer) break;
          }
        }
      }

      if (buffer) {
        // Validação: garantir que não é acorde
        if (buffer.duration > 3.0) {
          console.error(`❌ ERRO: Sample ${noteWithOctave} parece ser acorde (duração: ${buffer.duration.toFixed(2)}s)`);
          continue;
        }
        
        const noteStartTime = startTime + (i * duration);
        await this.playBuffer(buffer, noteStartTime, duration);
      } else {
        console.warn(`⚠️ Note sample not available: ${noteWithOctave}`);
      }
    }

    console.log('✅ Scale played:', scaleNotes.length, 'notes');
  }

  async playNote(note: string, duration?: number): Promise<void> {
    console.log('🎵 GuitarSet: Playing note:', note, 'duration:', duration || 'full');

    const initialized = await this.initialize();
    if (!initialized) {
      console.error('❌ GuitarSetAudioService not initialized');
      return;
    }

    // CRÍTICO: Parar todas as notas anteriores para evitar sobreposição
    // Isso garante que apenas uma nota toque por vez, sem soar como acorde
    this.stopAll();
    
    // Delay adicional para garantir que o stop foi completamente processado
    // Isso é especialmente importante para evitar qualquer resíduo de áudio anterior
    await new Promise(resolve => setTimeout(resolve, 50));

    // Ensure AudioContext is active before playing (critical for tablets)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        // Small delay to ensure context is fully active
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error('❌ Failed to resume AudioContext:', error);
      }
    }

    // Verificar novamente se não há fontes ativas (segurança extra)
    if (this.activeSources.size > 0) {
      console.warn(`⚠️ Ainda há ${this.activeSources.size} fontes ativas após stopAll, limpando...`);
      this.stopAll();
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    // CRÍTICO: Validar formato da nota antes de carregar
    // Notas individuais DEVEM ter oitava (ex: F2, E4)
    if (!/\d/.test(note)) {
      console.error(`❌ ERRO CRÍTICO: Nota sem oitava: ${note}. Não é possível tocar nota individual sem oitava!`);
      return;
    }

    // Carregar o sample da nota solicitada (sem substituições - cada nota é única)
    let buffer = await this.loadNoteSample(note);
    
    if (!buffer) {
      console.error(`❌ ERRO: Note sample não disponível: ${note}. Verifique se o sample existe em /samples/notes/`);
      return;
    }
    
    // Validação final: garantir que não é um acorde
    // Se o sample tiver duração > 3s, provavelmente é um acorde e não deve ser tocado
    if (buffer.duration > 3.0) {
      console.error(`❌ ERRO CRÍTICO: Sample ${note} tem duração de ${buffer.duration.toFixed(2)}s, muito longa para nota individual! Este sample parece ser um acorde e não será tocado.`);
      console.error(`❌ AÇÃO NECESSÁRIA: O sample ${note}.wav precisa ser extraído novamente do dataset com um sample de nota individual limpa.`);
      return;
    }

    // Para notas individuais, usar duração mínima de 3.0s se não especificada
    // Isso garante que a nota seja claramente audível e identificável
    const noteDuration = duration || Math.max(3.0, buffer.duration);
    
    // Garantir que não há fontes ativas antes de tocar
    if (this.activeSources.size > 0) {
      console.error('❌ ERRO CRÍTICO: Ainda há fontes ativas antes de tocar nova nota!');
      this.stopAll();
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    await this.playBuffer(buffer, undefined, noteDuration);
    console.log('✅ Note played:', note, 'duration:', noteDuration.toFixed(2), 's', 'active sources:', this.activeSources.size);
  }

  private normalizeChordName(chordName: string): string {
    // Parse chord name (e.g., "C", "Am", "G7", "C#m")
    const match = chordName.match(/^([A-G][#b]?)(.*)/);
    if (!match) {
      return chordName;
    }

    const root = match[1];
    let suffix = match[2] || '';

    // Normalize suffix
    if (suffix === 'm' || suffix === 'min') {
      suffix = 'm';
    } else if (suffix === '7') {
      suffix = '7';
    } else if (suffix === '' || suffix === 'maj' || suffix === 'major') {
      suffix = ''; // Major chord has no suffix in our naming
    }

    return root + suffix;
  }

  async setInstrument(instrument: InstrumentType): Promise<void> {
    // GuitarSet samples are always guitar, so this is a no-op
    // But we keep the interface for compatibility
    console.log('ℹ️ GuitarSet samples are always guitar, ignoring instrument change:', instrument);
  }

  getInstrument(): InstrumentType {
    return 'nylon-guitar'; // GuitarSet samples are guitar
  }

  stopAll(): void {
    console.log('🛑 Stopping all GuitarSet audio...');
    
    // Stop all active sources imediatamente - CRÍTICO para evitar sobreposição
    const sourcesToStop = Array.from(this.activeSources);
    const now = this.audioContext ? this.audioContext.currentTime : 0;
    
    sourcesToStop.forEach(source => {
      try {
        // Desconectar todos os nós de áudio primeiro
        if (source.buffer) {
          // Desconectar todos os nós conectados
          try {
            source.disconnect();
          } catch (e) {
            // Pode já estar desconectado
          }
        }
        
        // Parar imediatamente no tempo atual (ou antes se possível)
        // Usar um tempo ligeiramente no passado para garantir parada imediata
        const stopTime = this.audioContext ? Math.max(0, now - 0.001) : 0;
        source.stop(stopTime);
      } catch (e) {
        // Source may have already ended or been stopped
        // Ignorar erro silenciosamente
      }
    });
    
    // Limpar o set imediatamente
    this.activeSources.clear();
    
    // Garantir que o gainNode também seja resetado se necessário
    if (this.gainNode && this.audioContext) {
      try {
        // Resetar ganho para evitar qualquer resíduo
        this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.gainNode.gain.setValueAtTime(0.95, this.audioContext.currentTime + 0.001);
      } catch (e) {
        // Ignorar se houver erro
      }
    }
    
    console.log('✅ All audio stopped and disconnected');
  }

  setEQ(bassGain: number, midGain: number, trebleGain: number): void {
    // EQ not implemented for samples (would require audio processing)
    // Could be added with BiquadFilterNode if needed
    console.log('ℹ️ EQ not available for GuitarSet samples');
  }

  async dispose(): Promise<void> {
    console.log('🗑️ Disposing GuitarSetAudioService...');
    
    this.stopAll();
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.chordBuffers.clear();
    this.noteBuffers.clear();
    this.isInitialized = false;
    
    console.log('✅ GuitarSetAudioService disposed');
  }
}

export const guitarSetAudioService = new GuitarSetAudioService();
