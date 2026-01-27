import { vi } from 'vitest';
import { mockAudioContextFactory } from './client/src/audio/test/mocks/mockAudioContext';

vi.stubGlobal('AudioContext', mockAudioContextFactory);
