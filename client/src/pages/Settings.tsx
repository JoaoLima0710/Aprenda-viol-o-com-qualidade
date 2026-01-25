import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAudioSettingsStore } from '@/stores/useAudioSettingsStore';
// import { unifiedAudioService } from '@/services/UnifiedAudioService';
import { Settings as SettingsIcon, Music, Volume2, Waves, Sliders } from 'lucide-react';
import { NotificationSettings } from '@/components/NotificationSettings';
import { AudioCacheSettings } from '@/components/AudioCacheSettings';
import { LLMSettings } from '@/components/ai/LLMSettings';
import { hapticFeedbackService } from '@/services/HapticFeedbackService';
import { latencyMeasurementService } from '@/services/LatencyMeasurementService';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Smartphone, Gauge, Zap } from 'lucide-react';

export default function Settings() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();
  const { user } = useUserStore();
  const userName = user?.name || "Usuário";
  
  // Feedback tátil
  const [hapticEnabled, setHapticEnabled] = useState(hapticFeedbackService.getEnabled());
  
  const handleHapticToggle = (enabled: boolean) => {
    hapticFeedbackService.setEnabled(enabled);
    setHapticEnabled(enabled);
    if (enabled) {
      hapticFeedbackService.success(); // Teste de vibração
      toast.success('Feedback tátil habilitado');
    } else {
      toast.info('Feedback tátil desabilitado');
    }
  };
  
  const {
    audioEngine,
    setAudioEngine,
    instrument,
    setInstrument,
    masterVolume,
    setMasterVolume,
    enableReverb,
    setEnableReverb,
    reverbAmount,
    setReverbAmount,
    eqPreset,
    setEQPreset,
    bassGain,
    setBassGain,
    midGain,
    setMidGain,
    trebleGain,
    setTrebleGain,
    lowLatencyMode,
    setLowLatencyMode,
    measuredLatency,
    setMeasuredLatency,
  } = useAudioSettingsStore();
  
  const [isMeasuringLatency, setIsMeasuringLatency] = useState(false);
  
  const handleMeasureLatency = async () => {
    setIsMeasuringLatency(true);
    try {
      const latency = await latencyMeasurementService.measureLatency();
      if (latency !== null) {
        setMeasuredLatency(latency);
        toast.success(`Latência medida: ${latency.toFixed(1)}ms`);
      } else {
        toast.error('Não foi possível medir a latência');
      }
    } catch (error) {
      console.error('Erro ao medir latência:', error);
      toast.error('Erro ao medir latência');
    } finally {
      setIsMeasuringLatency(false);
    }
  };
  
  const handleLowLatencyToggle = (enabled: boolean) => {
    setLowLatencyMode(enabled);
    if (enabled) {
      toast.success('Modo de baixa latência habilitado. Reinicie o áudio para aplicar.');
    } else {
      toast.info('Modo de baixa latência desabilitado');
    }
  };

  const handleAudioEngineChange = (engine: 'synthesis' | 'samples' | 'guitarset' | 'philharmonia') => {
    setAudioEngine(engine);
    const messages = {
      synthesis: 'Usando síntese de áudio (leve)',
      samples: 'Usando samples Soundfont (autêntico)',
      guitarset: 'Usando samples reais do GuitarSet (profissional)',
      philharmonia: 'Usando samples do Philharmonia Orchestra (orquestral)'
    };
    toast.success(messages[engine]);
  };

  const handleInstrumentChange = (newInstrument: any) => {
    setInstrument(newInstrument);
    toast.success(`Instrumento alterado para ${getInstrumentLabel(newInstrument)}`);
  };

  // Apply EQ whenever values change
  // TODO: Migrar EQ para novo sistema de áudio
  // useEffect(() => {
  //   audioEngineInstance.setEQ(bassGain, midGain, trebleGain);
  // }, [bassGain, midGain, trebleGain]);

  const getInstrumentLabel = (inst: string) => {
    const labels: Record<string, string> = {
      'nylon-guitar': 'Violão Nylon',
      'steel-guitar': 'Violão Aço',
      'piano': 'Piano',
      'violin': 'Violino',
      'viola': 'Viola',
      'cello': 'Violoncelo',
      'double-bass': 'Contrabaixo',
      'flute': 'Flauta',
      'oboe': 'Oboé',
      'clarinet': 'Clarinete',
      'saxophone': 'Saxofone',
      'trumpet': 'Trompete',
      'french-horn': 'Trompa',
      'trombone': 'Trombone',
      'guitar': 'Guitarra',
      'mandolin': 'Bandolim',
      'banjo': 'Banjo',
    };
    return labels[inst] || inst;
  };

  const getAvailableInstruments = () => {
    if (audioEngine === 'philharmonia') {
      return [
        'violin',
        'viola',
        'cello',
        'double-bass',
        'flute',
        'oboe',
        'clarinet',
        'saxophone',
        'trumpet',
        'french-horn',
        'trombone',
        'guitar',
        'mandolin',
        'banjo',
      ];
    } else if (audioEngine === 'guitarset') {
      return ['nylon-guitar']; // GuitarSet só tem guitarra
    } else {
      return ['nylon-guitar', 'steel-guitar', 'piano'];
    }
  };

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
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center">
                <SettingsIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white">Configurações</h1>
                <p className="text-gray-400 text-lg">Personalize sua experiência</p>
              </div>
            </div>

            {/* Notification Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <NotificationSettings />
            </motion.div>

            {/* Audio Cache Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
            <AudioCacheSettings />
          </motion.div>

            {/* Audio Performance Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-bold text-white">Performance de Áudio</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Modo de Baixa Latência */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">Modo de Baixa Latência</p>
                      <p className="text-sm text-gray-400">
                        Reduz latência para &lt;30ms (desabilita reverb e reduz efeitos)
                      </p>
                    </div>
                    <Switch
                      checked={lowLatencyMode}
                      onCheckedChange={handleLowLatencyToggle}
                    />
                  </div>
                  
                  {/* Medição de Latência */}
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-white font-medium mb-1">Latência Medida</p>
                        <p className="text-sm text-gray-400">
                          {measuredLatency !== null 
                            ? `Latência atual: ${measuredLatency.toFixed(1)}ms`
                            : 'Ainda não medida'}
                        </p>
                      </div>
                      <Button
                        onClick={handleMeasureLatency}
                        disabled={isMeasuringLatency}
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Gauge className="w-4 h-4 mr-2" />
                        {isMeasuringLatency ? 'Medindo...' : 'Medir Latência'}
                      </Button>
                    </div>
                    
                    {measuredLatency !== null && (
                      <div className="mt-3">
                        <div className={`p-3 rounded-lg ${
                          measuredLatency < 30 
                            ? 'bg-green-500/20 border border-green-500/30'
                            : measuredLatency < 50
                            ? 'bg-yellow-500/20 border border-yellow-500/30'
                            : 'bg-red-500/20 border border-red-500/30'
                        }`}>
                          <p className={`text-sm ${
                            measuredLatency < 30 
                              ? 'text-green-300'
                              : measuredLatency < 50
                              ? 'text-yellow-300'
                              : 'text-red-300'
                          }`}>
                            {measuredLatency < 30 
                              ? '✅ Latência excelente! Ideal para performance em tempo real.'
                              : measuredLatency < 50
                              ? '⚠️ Latência aceitável, mas pode ser melhorada.'
                              : '❌ Latência alta. Considere habilitar modo de baixa latência.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Volume Normalization Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-6"
            >
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Volume2 className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-bold text-white">Normalização de Volume</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">Normalizar Volume dos Samples</p>
                      <p className="text-sm text-gray-400">
                        Equaliza o volume de cada nota para consistência automática
                      </p>
                    </div>
                    <Switch
                      defaultChecked={true}
                      onCheckedChange={(enabled) => {
                        import('@/services/AudioServiceWithSamples').then(({ audioServiceWithSamples }) => {
                          audioServiceWithSamples.setNormalizationEnabled(enabled);
                          toast.success(enabled ? 'Normalização ativada' : 'Normalização desativada');
                        });
                      }}
                    />
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-sm text-gray-300 mb-2">
                      A normalização analisa o volume (RMS) de cada sample e ajusta automaticamente o ganho para manter consistência entre todas as notas.
                    </p>
                    <p className="text-xs text-gray-400">
                      Isso garante que acordes e escalas soem com volume uniforme, melhorando significativamente a experiência de aprendizado. A normalização ocorre automaticamente em background.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Haptic Feedback Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-6"
            >
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Feedback Tátil (Vibração)</h3>
                </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">Vibração em Dispositivos Móveis</p>
                    <p className="text-sm text-gray-400">
                      Receba feedback tátil ao acertar, completar módulos e subir de nível
                    </p>
                  </div>
                  <Switch
                    checked={hapticEnabled}
                    onCheckedChange={handleHapticToggle}
                    disabled={!hapticFeedbackService.isAvailable()}
                  />
                </div>
                
                {!hapticFeedbackService.isAvailable() && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-300">
                      ⚠️ Feedback tátil não está disponível neste dispositivo ou navegador
                    </p>
                  </div>
                )}
                
                {hapticFeedbackService.isAvailable() && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                      ✓ Vibração disponível. Você receberá feedback ao:
                    </p>
                    <ul className="text-xs text-blue-200 mt-2 space-y-1 ml-4 list-disc">
                      <li>Acertar exercícios (vibração curta)</li>
                      <li>Completar módulos (vibração dupla)</li>
                      <li>Subir de nível (vibração longa)</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* LLM Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <LLMSettings />
          </motion.div>

          {/* Audio Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#2a2a3e] rounded-3xl p-8 border border-white/10 mb-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Music className="w-6 h-6 text-[#06b6d4]" />
                <h2 className="text-2xl font-bold text-white">Configurações de Áudio</h2>
              </div>

              {/* Audio Engine Selection */}
              <div className="space-y-6">
                <div className="p-6 bg-white/5 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">Motor de Áudio</h3>
                  <div className={`grid gap-3 ${audioEngine === 'philharmonia' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    <Button
                      onClick={() => handleAudioEngineChange('synthesis')}
                      className={`h-20 flex flex-col items-center justify-center gap-1 ${
                        audioEngine === 'synthesis'
                          ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/50'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20 border-2 border-transparent'
                      }`}
                    >
                      <span className="text-xl">🎹</span>
                      <span className="text-xs font-semibold">Síntese</span>
                      <span className="text-[10px] text-gray-500">Leve</span>
                    </Button>
                    <Button
                      onClick={() => handleAudioEngineChange('samples')}
                      className={`h-20 flex flex-col items-center justify-center gap-1 ${
                        audioEngine === 'samples'
                          ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/50'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20 border-2 border-transparent'
                      }`}
                    >
                      <span className="text-xl">🎼</span>
                      <span className="text-xs font-semibold">Soundfont</span>
                      <span className="text-[10px] text-gray-500">Autêntico</span>
                    </Button>
                    <Button
                      onClick={() => handleAudioEngineChange('guitarset')}
                      className={`h-20 flex flex-col items-center justify-center gap-1 ${
                        audioEngine === 'guitarset'
                          ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/50'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20 border-2 border-transparent'
                      }`}
                    >
                      <span className="text-xl">🎸</span>
                      <span className="text-xs font-semibold">GuitarSet</span>
                      <span className="text-[10px] text-gray-500">Profissional</span>
                    </Button>
                    <Button
                      onClick={() => handleAudioEngineChange('philharmonia')}
                      className={`h-20 flex flex-col items-center justify-center gap-1 ${
                        audioEngine === 'philharmonia'
                          ? 'bg-gradient-to-br from-[#a855f7] to-[#9333ea] text-white border-2 border-purple-400 shadow-lg shadow-purple-500/50'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20 border-2 border-transparent'
                      }`}
                    >
                      <span className="text-xl">🎻</span>
                      <span className="text-xs font-semibold">Orquestra</span>
                      <span className="text-[10px] text-gray-500">Clássico</span>
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    {audioEngine === 'synthesis' && 'Som gerado em tempo real, mais leve e rápido'}
                    {audioEngine === 'samples' && 'Samples de instrumentos via Soundfont, som autêntico'}
                    {audioEngine === 'guitarset' && 'Samples reais extraídos do dataset GuitarSet, qualidade profissional'}
                    {audioEngine === 'philharmonia' && 'Samples de instrumentos orquestrais do Philharmonia Orchestra, qualidade profissional'}
                  </p>
                </div>

                {/* Instrument Selection */}
                <div className="p-6 bg-white/5 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">Instrumento</h3>
                  <div className={`grid gap-4 ${audioEngine === 'philharmonia' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    {getAvailableInstruments().map((inst) => (
                      <Button
                        key={inst}
                        onClick={() => handleInstrumentChange(inst)}
                        className={`h-24 flex flex-col items-center justify-center gap-2 ${
                          instrument === inst
                            ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/50'
                            : 'bg-white/10 text-gray-400 hover:bg-white/20 border-2 border-transparent'
                        }`}
                      >
                        <Music className="w-6 h-6" />
                        <span className="font-semibold text-sm">{getInstrumentLabel(inst)}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Master Volume */}
                <div className="p-6 bg-white/5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-[#06b6d4]" />
                      <h3 className="text-lg font-bold text-white">Volume Geral</h3>
                    </div>
                    <span className="text-cyan-400 font-bold">{Math.round(masterVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[masterVolume * 100]}
                    onValueChange={(value) => setMasterVolume(value[0] / 100)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Reverb Settings */}
                <div className="p-6 bg-white/5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Waves className="w-5 h-5 text-[#06b6d4]" />
                      <h3 className="text-lg font-bold text-white">Reverb</h3>
                    </div>
                    <Switch
                      checked={enableReverb}
                      onCheckedChange={setEnableReverb}
                    />
                  </div>
                  
                  {enableReverb && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Intensidade</span>
                        <span className="text-cyan-400 font-bold">{Math.round(reverbAmount * 100)}%</span>
                      </div>
                      <Slider
                        value={[reverbAmount * 100]}
                        onValueChange={(value) => setReverbAmount(value[0] / 100)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* EQ Settings */}
                <div className="p-6 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Sliders className="w-5 h-5 text-[#06b6d4]" />
                    <h3 className="text-lg font-bold text-white">Equalização (EQ)</h3>
                  </div>
                  
                  {/* EQ Presets */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { value: 'balanced', label: 'Balanceado', icon: '⚖️', desc: 'Som natural' },
                      { value: 'bass-boost', label: 'Graves', icon: '🔊', desc: 'Mais corpo' },
                      { value: 'treble-boost', label: 'Agudos', icon: '✨', desc: 'Mais brilho' },
                    ].map((preset) => (
                      <Button
                        key={preset.value}
                        onClick={() => setEQPreset(preset.value as any)}
                        className={`h-20 flex flex-col items-center justify-center gap-1 ${
                          eqPreset === preset.value
                            ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/50'
                            : 'bg-white/10 text-gray-400 hover:bg-white/20 border-2 border-transparent'
                        }`}
                      >
                        <span className="text-2xl">{preset.icon}</span>
                        <span className="text-xs font-semibold">{preset.label}</span>
                        {eqPreset === preset.value && (
                          <span className="text-[10px] text-cyan-200">{preset.desc}</span>
                        )}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Custom EQ Controls */}
                  {eqPreset === 'custom' && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Graves (Bass)</span>
                          <span className="text-cyan-400 font-bold">{bassGain > 0 ? '+' : ''}{bassGain} dB</span>
                        </div>
                        <Slider
                          value={[bassGain]}
                          onValueChange={(value) => setBassGain(value[0])}
                          min={-12}
                          max={12}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Médios (Mid)</span>
                          <span className="text-cyan-400 font-bold">{midGain > 0 ? '+' : ''}{midGain} dB</span>
                        </div>
                        <Slider
                          value={[midGain]}
                          onValueChange={(value) => setMidGain(value[0])}
                          min={-12}
                          max={12}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Agudos (Treble)</span>
                          <span className="text-cyan-400 font-bold">{trebleGain > 0 ? '+' : ''}{trebleGain} dB</span>
                        </div>
                        <Slider
                          value={[trebleGain]}
                          onValueChange={(value) => setTrebleGain(value[0])}
                          min={-12}
                          max={12}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* MOBILE VERSION */}
      <div className="lg:hidden flex flex-col h-screen bg-[#0f0f1a] text-white">
        <MobileHeader 
          userName={userName}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          userName={userName}
          userLevel={level}
          currentXP={xp}
          xpToNextLevel={xpToNextLevel}
          streak={currentStreak}
        />
        
        <main className="flex-1 overflow-y-auto pb-20 px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6 pt-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Configurações</h1>
              <p className="text-gray-400 text-sm">Personalize sua experiência</p>
            </div>
          </div>

          {/* Audio Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#1a1a2e] to-[#2a2a3e] rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <Music className="w-5 h-5 text-[#06b6d4]" />
              <h2 className="text-xl font-bold text-white">Áudio</h2>
            </div>

            <div className="space-y-4">
              {/* Audio Engine */}
              <div className="p-4 bg-white/5 rounded-xl">
                <h3 className="text-base font-bold text-white mb-3">Motor de Áudio</h3>
                <div className={`grid gap-2 ${audioEngine === 'philharmonia' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  <Button
                    onClick={() => handleAudioEngineChange('synthesis')}
                    className={`h-16 flex flex-col items-center justify-center gap-1 text-xs ${
                      audioEngine === 'synthesis'
                        ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white border border-cyan-400'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-lg">🎹</span>
                    <span className="font-semibold">Síntese</span>
                  </Button>
                  <Button
                    onClick={() => handleAudioEngineChange('samples')}
                    className={`h-16 flex flex-col items-center justify-center gap-1 text-xs ${
                      audioEngine === 'samples'
                        ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white border border-cyan-400'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-lg">🎼</span>
                    <span className="font-semibold">Soundfont</span>
                  </Button>
                  <Button
                    onClick={() => handleAudioEngineChange('guitarset')}
                    className={`h-16 flex flex-col items-center justify-center gap-1 text-xs ${
                      audioEngine === 'guitarset'
                        ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white border border-cyan-400'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-lg">🎸</span>
                    <span className="font-semibold">GuitarSet</span>
                  </Button>
                  <Button
                    onClick={() => handleAudioEngineChange('philharmonia')}
                    className={`h-16 flex flex-col items-center justify-center gap-1 text-xs ${
                      audioEngine === 'philharmonia'
                        ? 'bg-gradient-to-br from-[#a855f7] to-[#9333ea] text-white border border-purple-400'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-lg">🎻</span>
                    <span className="font-semibold">Orquestra</span>
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {audioEngine === 'synthesis' && 'Som gerado em tempo real'}
                  {audioEngine === 'samples' && 'Samples Soundfont'}
                  {audioEngine === 'guitarset' && 'Samples reais profissionais'}
                  {audioEngine === 'philharmonia' && 'Samples orquestrais profissionais'}
                </p>
              </div>

              {/* Instrument */}
              <div className="p-4 bg-white/5 rounded-xl">
                <h3 className="text-base font-bold text-white mb-3">Instrumento</h3>
                <div className={`grid gap-2 ${audioEngine === 'philharmonia' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {getAvailableInstruments().map((inst) => (
                    <Button
                      key={inst}
                      onClick={() => handleInstrumentChange(inst)}
                      className={`h-16 flex flex-col items-center justify-center gap-1 text-xs ${
                        instrument === inst
                          ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white border border-cyan-400'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      <Music className="w-4 h-4" />
                      <span className="font-semibold text-xs">{getInstrumentLabel(inst).split(' ')[0]}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#06b6d4]" />
                    <h3 className="text-base font-bold text-white">Volume</h3>
                  </div>
                  <span className="text-cyan-400 font-bold text-sm">{Math.round(masterVolume * 100)}%</span>
                </div>
                <Slider
                  value={[masterVolume * 100]}
                  onValueChange={(value) => {
                    const newVolume = value[0] / 100;
                    setMasterVolume(newVolume);
                    // Sincronizar com AudioMixer imediatamente
                    import('@/audio').then(({ getAudioMixer }) => {
                      const mixer = getAudioMixer();
                      if (mixer) {
                        mixer.setMasterVolume(newVolume);
                      }
                    }).catch(() => {});
                  }}
                  max={100}
                  step={1}
                />
              </div>

              {/* Reverb */}
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-[#06b6d4]" />
                    <h3 className="text-base font-bold text-white">Reverb</h3>
                  </div>
                  <Switch
                    checked={enableReverb}
                    onCheckedChange={setEnableReverb}
                  />
                </div>
                
                {enableReverb && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Intensidade</span>
                      <span className="text-cyan-400 font-bold text-sm">{Math.round(reverbAmount * 100)}%</span>
                    </div>
                    <Slider
                      value={[reverbAmount * 100]}
                      onValueChange={(value) => setReverbAmount(value[0] / 100)}
                      max={100}
                      step={1}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </main>
        
        <MobileBottomNav />
      </div>
    </>
  );
}
