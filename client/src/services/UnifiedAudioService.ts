import { audioService } from './AudioService';
import { audioServiceWithSamples } from './AudioServiceWithSamples';
import { useAudioSettingsStore } from '@/stores/useAudioSettingsStore';
import type { InstrumentType } from './AudioServiceWithSamples';

/**
 * Unified Audio Service
 * Automatically switches between synthesis and samples based on user settings
 */
class UnifiedAudioService {
  private getCurrentService() {
    const { audioEngine } = useAudioSettingsStore.getState();
    return audioEngine === 'samples' ? audioServiceWithSamples : audioService;
  }

  async initialize() {
    const service = this.getCurrentService();
    return await service.initialize();
  }

  async setInstrument(instrument: InstrumentType) {
    const service = this.getCurrentService();
    await service.setInstrument(instrument);
  }

  getInstrument(): InstrumentType {
    const service = this.getCurrentService();
    return service.getInstrument();
  }

  async playChord(chordName: string, duration?: number) {
    const service = this.getCurrentService();
    await service.playChord(chordName, duration);
  }

  async playChordStrummed(chordName: string, duration?: number) {
    const service = this.getCurrentService();
    await service.playChordStrummed(chordName, duration);
  }

  async playScale(scaleName: string, root: string, intervals: number[], duration?: number) {
    const service = this.getCurrentService();
    await service.playScale(scaleName, root, intervals, duration);
  }

  stopAll() {
    // Stop both services to be safe
    audioService.stopAll();
    audioServiceWithSamples.stopAll();
  }

  dispose() {
    audioService.dispose();
    audioServiceWithSamples.dispose();
  }
}

export const unifiedAudioService = new UnifiedAudioService();
