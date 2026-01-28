import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AudioEngineType = 'synthesis' | 'samples' | 'guitarset' | 'philharmonia';
export type InstrumentType =
  | 'nylon-guitar'
  | 'steel-guitar'
  | 'piano'
  | 'violin'
  | 'viola'
  | 'cello'
  | 'double-bass'
  | 'flute'
  | 'oboe'
  | 'clarinet'
  | 'saxophone'
  | 'trumpet'
  | 'french-horn'
  | 'trombone'
  | 'guitar'
  | 'mandolin'
  | 'banjo';
export type EQPreset = 'balanced' | 'bass-boost' | 'treble-boost' | 'custom';

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

  // EQ Settings
  eqPreset: EQPreset;
  setEQPreset: (preset: EQPreset) => void;
  bassGain: number;
  setBassGain: (gain: number) => void;
  midGain: number;
  setMidGain: (gain: number) => void;
  trebleGain: number;
  setTrebleGain: (gain: number) => void;

  // Low Latency Mode
  lowLatencyMode: boolean;
  setLowLatencyMode: (enabled: boolean) => void;

  // MIDI Mode (apenas para acordes)
  useMIDI: boolean;
  setUseMIDI: (enabled: boolean) => void;

  // Measured Latency
  measuredLatency: number | null;
  setMeasuredLatency: (latency: number | null) => void;
}

export const useAudioSettingsStore = create<AudioSettingsState>()(
  persist(
    (set) => ({
      // Defaults
      audioEngine: 'guitarset', // Use real GuitarSet samples by default
      instrument: 'nylon-guitar',
      masterVolume: 0.7,
      enableReverb: true,
      reverbAmount: 0.3,
      eqPreset: 'balanced',
      bassGain: 0,
      midGain: 0,
      trebleGain: 0,
      lowLatencyMode: false,
      measuredLatency: null,

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
        console.log('🏛️ Reverb amount changed to:', amount);
        set({ reverbAmount: amount });
      },

      setEQPreset: (preset) => {
        console.log('🎵 EQ preset changed to:', preset);
        set({ eqPreset: preset });
        // Apply preset values
        if (preset === 'balanced') {
          set({ bassGain: 0, midGain: 0, trebleGain: 0 });
        } else if (preset === 'bass-boost') {
          set({ bassGain: 6, midGain: 0, trebleGain: -2 });
        } else if (preset === 'treble-boost') {
          set({ bassGain: -2, midGain: 0, trebleGain: 6 });
        }
      },

      setBassGain: (gain) => {
        console.log('🔊 Bass gain changed to:', gain);
        set({ bassGain: gain, eqPreset: 'custom' });
      },

      setMidGain: (gain) => {
        console.log('🔊 Mid gain changed to:', gain);
        set({ midGain: gain, eqPreset: 'custom' });
      },

      setTrebleGain: (gain) => {
        console.log('🔊 Treble gain changed to:', gain);
        set({ trebleGain: gain, eqPreset: 'custom' });
      },

      setLowLatencyMode: (enabled) => {
        console.log('⚡ Low latency mode:', enabled);
        set({ lowLatencyMode: enabled });
      },

      setMeasuredLatency: (latency) => {
        set({ measuredLatency: latency });
      },
    }),
    {
      name: 'audio-settings-storage',
    }
  )
);
