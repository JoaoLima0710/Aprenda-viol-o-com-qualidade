import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AudioEngineType = 'synthesis' | 'samples';
export type InstrumentType = 'nylon-guitar' | 'steel-guitar' | 'piano';

interface AudioSettingsState {
  // Audio Engine
  audioEngine: AudioEngineType;
  setAudioEngine: (engine: AudioEngineType) => void;
  
  // Instrument
  instrument: InstrumentType;
  setInstrument: (instrument: InstrumentType) => void;
  
  // Volume
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
  
  // Other settings
  enableReverb: boolean;
  setEnableReverb: (enabled: boolean) => void;
  
  reverbAmount: number;
  setReverbAmount: (amount: number) => void;
}

export const useAudioSettingsStore = create<AudioSettingsState>()(
  persist(
    (set) => ({
      // Defaults
      audioEngine: 'synthesis',
      instrument: 'nylon-guitar',
      masterVolume: 0.7,
      enableReverb: true,
      reverbAmount: 0.3,
      
      // Actions
      setAudioEngine: (engine) => {
        console.log('🎵 Audio engine changed to:', engine);
        set({ audioEngine: engine });
      },
      
      setInstrument: (instrument) => {
        console.log('🎸 Instrument changed to:', instrument);
        set({ instrument });
      },
      
      setMasterVolume: (volume) => {
        console.log('🔊 Master volume changed to:', volume);
        set({ masterVolume: volume });
      },
      
      setEnableReverb: (enabled) => {
        console.log('🎛️ Reverb enabled:', enabled);
        set({ enableReverb: enabled });
      },
      
      setReverbAmount: (amount) => {
        console.log('🎛️ Reverb amount changed to:', amount);
        set({ reverbAmount: amount });
      },
    }),
    {
      name: 'audio-settings-storage',
    }
  )
);
