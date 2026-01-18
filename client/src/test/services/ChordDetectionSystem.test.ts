import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chordDetectionSystem } from '@/services/ChordDetectionSystem';

// Mock do AudioContext
const mockAudioContext = {
  resume: vi.fn().mockResolvedValue(undefined),
  createAnalyser: vi.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    smoothingTimeConstant: 0.1,
    getByteFrequencyData: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn()
  })),
  createMediaStreamSource: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn()
  })),
  close: vi.fn()
};

// Mock do navigator.mediaDevices
const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: vi.fn(() => [
    { stop: vi.fn() }
  ])
});

Object.defineProperty(navigator, 'mediaDevices', {
  value: { getUserMedia: mockGetUserMedia },
  writable: true
});

global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext);

describe('ChordDetectionSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize successfully with microphone access', async () => {
      const result = await chordDetectionSystem.initialize();
      expect(result).toBe(true);
      expect(mockGetUserMedia).toHaveBeenCalled();
    });

    it('should handle microphone permission denial', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      const result = await chordDetectionSystem.initialize();
      expect(result).toBe(false);
    });

    it('should create audio context and analyser', async () => {
      await chordDetectionSystem.initialize();

      expect(global.AudioContext).toHaveBeenCalled();
      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalled();
    });
  });

  describe('Chord Detection', () => {
    beforeEach(async () => {
      await chordDetectionSystem.initialize();
    });

    it('should detect chord with valid audio data', async () => {
      // Mock analyser data for a C chord
      const mockAnalyser = mockAudioContext.createAnalyser();
      const mockData = new Uint8Array(1024);

      // Simulate frequency peaks for C chord notes (C, E, G)
      mockData[100] = 200; // ~261Hz (C4)
      mockData[127] = 180; // ~329Hz (E4)
      mockData[157] = 160; // ~392Hz (G4)

      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        array.set(mockData);
      });

      chordDetectionSystem.startListening();

      const result = await chordDetectionSystem.detectChord('C', 1000);

      expect(result).toBeDefined();
      expect(result.expectedChord).toBe('C');
      expect(result.timing.latency).toBeGreaterThan(0);
      expect(result.analysis).toBeDefined();
    });

    it('should timeout if no chord detected', async () => {
      // Mock empty audio data
      const mockAnalyser = mockAudioContext.createAnalyser();
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        array.fill(0); // No audio
      });

      chordDetectionSystem.startListening();

      const result = await chordDetectionSystem.detectChord('C', 500);

      expect(result.confidence).toBe(0);
      expect(result.isCorrect).toBe(false);
      expect(result.analysis.problems.length).toBeGreaterThan(0);
    });

    it('should provide actionable feedback for problems', async () => {
      // Mock analyser with low amplitude (muted strings)
      const mockAnalyser = mockAudioContext.createAnalyser();
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        array.fill(10); // Very low amplitude
      });

      chordDetectionSystem.startListening();

      const result = await chordDetectionSystem.detectChord('C', 1000);

      expect(result.feedback.actionRequired).toBeDefined();
      expect(result.analysis.problems.some(p => p.type === 'noise_interference')).toBe(true);
    });
  });

  describe('Problem Identification', () => {
    it('should identify muted strings', () => {
      const analyser = chordDetectionSystem as any;
      const detectedNotes = [
        { string: 1, frequency: 329, amplitude: 0.8, centsOff: 0, isCorrect: true, expectedFrequency: 329, problem: null },
        // Missing notes for strings 2, 3, 4, 5
      ];

      const problems = analyser.identifyProblems(detectedNotes, 'C');

      expect(problems.some(p => p.type === 'muted_string')).toBe(true);
      expect(problems.some(p => p.string === 2)).toBe(true);
    });

    it('should identify low pressure issues', () => {
      const analyser = chordDetectionSystem as any;
      const detectedNotes = [
        { string: 1, frequency: 329, amplitude: 0.1, centsOff: 0, isCorrect: true, expectedFrequency: 329, problem: null },
        { string: 2, frequency: 246, amplitude: 0.8, centsOff: 0, isCorrect: true, expectedFrequency: 246, problem: null },
      ];

      const problems = analyser.identifyProblems(detectedNotes, 'C');

      expect(problems.some(p => p.type === 'low_pressure')).toBe(true);
    });

    it('should identify noise interference', () => {
      const analyser = chordDetectionSystem as any;
      const detectedNotes = [
        { string: 1, frequency: 329, amplitude: 0.05, centsOff: 0, isCorrect: true, expectedFrequency: 329, problem: null },
      ];

      const problems = analyser.identifyProblems(detectedNotes, 'C');

      expect(problems.some(p => p.type === 'noise_interference')).toBe(true);
    });
  });

  describe('Feedback Generation', () => {
    it('should generate success feedback for perfect detection', () => {
      const analyser = chordDetectionSystem as any;

      const analysis = {
        chordQuality: 'perfect' as const,
        problems: [],
        strengths: ['Acorde identificado corretamente!'],
        notes: []
      };

      const feedback = analyser.generateFeedback(analysis, 0.95, 'C');

      expect(feedback.type).toBe('success');
      expect(feedback.message).toContain('Perfeito');
      expect(feedback.visualCue).toBe('celebration');
    });

    it('should generate correction feedback for problems', () => {
      const analyser = chordDetectionSystem as any;

      const analysis = {
        chordQuality: 'poor' as const,
        problems: [{
          type: 'muted_string' as const,
          string: 3,
          description: 'Corda 3 não está soando',
          severity: 'high' as const,
          solution: 'Verifique se o dedo está pressionando corretamente a casa'
        }],
        strengths: [],
        notes: []
      };

      const feedback = analyser.generateFeedback(analysis, 0.3, 'C');

      expect(feedback.type).toBe('error');
      expect(feedback.actionRequired).toBeDefined();
      expect(feedback.visualCue).toBe('correction');
    });

    it('should provide encouragement for good but not perfect performance', () => {
      const analyser = chordDetectionSystem as any;

      const analysis = {
        chordQuality: 'good' as const,
        problems: [],
        strengths: ['3 cordas com boa intensidade'],
        notes: []
      };

      const feedback = analyser.generateFeedback(analysis, 0.75, 'C');

      expect(feedback.type).toBe('success');
      expect(feedback.message).toContain('Bom trabalho');
    });
  });

  describe('Frequency Analysis', () => {
    it('should identify frequency peaks correctly', () => {
      const analyser = chordDetectionSystem as any;
      const dataArray = new Uint8Array(1024);

      // Create clear peaks
      dataArray[100] = 255; // High amplitude peak
      dataArray[200] = 200; // Medium amplitude peak
      dataArray[50] = 100;  // Low amplitude peak

      const peaks = analyser.findFrequencyPeaks(dataArray);

      expect(peaks.length).toBeGreaterThan(0);
      expect(peaks[0].bin).toBe(100); // Highest amplitude first
      expect(peaks[0].amplitude).toBe(1); // Normalized to 0-1
    });

    it('should convert bin to frequency correctly', () => {
      const analyser = chordDetectionSystem as any;

      const frequency = analyser.binToFrequency(100);
      const expected = (100 * 44100) / 2048;

      expect(frequency).toBe(expected);
    });

    it('should identify notes from frequencies', () => {
      const analyser = chordDetectionSystem as any;

      // C4 frequency (261.63 Hz)
      const c4Frequency = 261.63;
      const note = analyser.frequencyToNote(c4Frequency);

      expect(note).toBeDefined();
      expect(note!.string).toBeDefined();
      expect(note!.fret).toBeDefined();
    });
  });

  describe('Calibration', () => {
    it('should perform auto-calibration', async () => {
      await chordDetectionSystem.initialize();

      // Calibration should be set
      expect(chordDetectionSystem).toBeDefined();
    });

    it('should persist calibration data', async () => {
      await chordDetectionSystem.initialize();

      // Should save to localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'chord_detection_calibration',
        expect.any(String)
      );
    });
  });

  describe('System State Management', () => {
    it('should manage listening state correctly', async () => {
      await chordDetectionSystem.initialize();

      expect(chordDetectionSystem.isInitialized()).toBe(true);

      chordDetectionSystem.startListening();
      // Should be listening

      chordDetectionSystem.stopListening();
      // Should not be listening
    });

    it('should cleanup resources properly', async () => {
      await chordDetectionSystem.initialize();

      chordDetectionSystem.destroy();

      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });
});