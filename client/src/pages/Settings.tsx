import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useAudioSettingsStore } from '@/stores/useAudioSettingsStore';
import { Settings as SettingsIcon, Music, Volume2, Waves } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const userName = 'João';

export default function Settings() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();
  
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
  } = useAudioSettingsStore();

  const handleAudioEngineChange = (checked: boolean) => {
    const newEngine = checked ? 'samples' : 'synthesis';
    setAudioEngine(newEngine);
    toast.success(
      newEngine === 'samples'
        ? 'Usando samples reais de instrumentos'
        : 'Usando síntese de áudio'
    );
  };

  const handleInstrumentChange = (newInstrument: 'nylon-guitar' | 'steel-guitar' | 'piano') => {
    setInstrument(newInstrument);
    toast.success(`Instrumento alterado para ${getInstrumentLabel(newInstrument)}`);
  };

  const getInstrumentLabel = (inst: string) => {
    const labels: Record<string, string> = {
      'nylon-guitar': 'Violão Nylon',
      'steel-guitar': 'Violão Aço',
      'piano': 'Piano',
    };
    return labels[inst] || inst;
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
          <div className="container py-8">
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

            {/* Audio Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#2a2a3e] rounded-3xl p-8 border border-white/10 mb-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Music className="w-6 h-6 text-[#06b6d4]" />
                <h2 className="text-2xl font-bold text-white">Configurações de Áudio</h2>
              </div>

              {/* Audio Engine Toggle */}
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">Motor de Áudio</h3>
                    <p className="text-sm text-gray-400">
                      {audioEngine === 'synthesis' 
                        ? 'Síntese: Som gerado em tempo real (mais leve)'
                        : 'Samples: Gravações reais de instrumentos (mais autêntico)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-semibold ${audioEngine === 'synthesis' ? 'text-cyan-400' : 'text-gray-500'}`}>
                      Síntese
                    </span>
                    <Switch
                      checked={audioEngine === 'samples'}
                      onCheckedChange={handleAudioEngineChange}
                    />
                    <span className={`text-sm font-semibold ${audioEngine === 'samples' ? 'text-cyan-400' : 'text-gray-500'}`}>
                      Samples
                    </span>
                  </div>
                </div>

                {/* Instrument Selection */}
                <div className="p-6 bg-white/5 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">Instrumento</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(['nylon-guitar', 'steel-guitar', 'piano'] as const).map((inst) => (
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
                        <span className="font-semibold">{getInstrumentLabel(inst)}</span>
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
                <div className="mb-3">
                  <h3 className="text-base font-bold text-white mb-1">Motor de Áudio</h3>
                  <p className="text-xs text-gray-400">
                    {audioEngine === 'synthesis' ? 'Síntese (leve)' : 'Samples (autêntico)'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${audioEngine === 'synthesis' ? 'text-cyan-400' : 'text-gray-500'}`}>
                    Síntese
                  </span>
                  <Switch
                    checked={audioEngine === 'samples'}
                    onCheckedChange={handleAudioEngineChange}
                  />
                  <span className={`text-xs font-semibold ${audioEngine === 'samples' ? 'text-cyan-400' : 'text-gray-500'}`}>
                    Samples
                  </span>
                </div>
              </div>

              {/* Instrument */}
              <div className="p-4 bg-white/5 rounded-xl">
                <h3 className="text-base font-bold text-white mb-3">Instrumento</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['nylon-guitar', 'steel-guitar', 'piano'] as const).map((inst) => (
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
                      <span className="font-semibold">{getInstrumentLabel(inst).split(' ')[1]}</span>
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
                  onValueChange={(value) => setMasterVolume(value[0] / 100)}
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
