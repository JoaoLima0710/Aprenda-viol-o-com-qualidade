import { describe, it, expect, beforeEach, vi } from 'vitest';
import { audioPerformanceAnalyzer } from '@/services/AudioPerformanceAnalyzer';

describe('AudioPerformanceAnalyzer', () => {
  describe('Performance Analysis', () => {
    it('should analyze performance with all metrics', () => {
      // Create mock audio data
      const audioData = new Float32Array(1024);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(i * 0.1) * 0.5; // Sine wave with some amplitude
      }

      const sampleRate = 44100;
      const context = {
        exerciseType: 'chord_formation' as const,
        expectedNotes: ['C4', 'E4', 'G4'],
        tempo: 120,
        targetDifficulty: 3,
        userLevel: 2
      };

      const result = audioPerformanceAnalyzer.analyzePerformance(audioData, sampleRate, context);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);

      // Check all metric categories exist
      expect(result.noteAccuracy).toBeDefined();
      expect(result.rhythmicAccuracy).toBeDefined();
      expect(result.soundClarity).toBeDefined();
      expect(result.dynamics).toBeDefined();
      expect(result.consistency).toBeDefined();
      expect(result.feedback).toBeDefined();
    });

    it('should handle empty audio data gracefully', () => {
      const audioData = new Float32Array(0);
      const sampleRate = 44100;
      const context = {
        exerciseType: 'chord_formation' as const,
        expectedNotes: ['C4'],
        tempo: 120,
        targetDifficulty: 1,
        userLevel: 1
      };

      const result = audioPerformanceAnalyzer.analyzePerformance(audioData, sampleRate, context);

      expect(result).toBeDefined();
      expect(result.noteAccuracy.overall).toBe(0);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should provide detailed feedback', () => {
      const audioData = new Float32Array(2048);
      const sampleRate = 44100;
      // Create audio with some issues (simulate poor performance)
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = (Math.random() - 0.5) * 0.1; // Low amplitude, noisy
      }

      const context = {
        exerciseType: 'chord_formation' as const,
        expectedNotes: ['C4', 'E4', 'G4'],
        tempo: 120,
        targetDifficulty: 3,
        userLevel: 2
      };

      const result = audioPerformanceAnalyzer.analyzePerformance(audioData, sampleRate, context);

      expect(result.feedback).toBeDefined();
      expect(result.feedback.strengths).toBeDefined();
      expect(result.feedback.weaknesses).toBeDefined();
      expect(result.feedback.recommendations).toBeDefined();
      expect(result.feedback.nextFocus).toBeDefined();

      // Should have some feedback content
      expect(result.feedback.strengths.length + result.feedback.weaknesses.length).toBeGreaterThan(0);
    });
  });

  describe('Note Accuracy Analysis', () => {
    it('should calculate note accuracy correctly', () => {
      const analyzer = audioPerformanceAnalyzer as any;

      // Mock detected notes with some accuracy issues
      const detectedNotes = [
        { note: 'C4', centsOff: 0, amplitude: 0.8 },
        { note: 'E4', centsOff: 15, amplitude: 0.6 },
        { note: 'G4', centsOff: -10, amplitude: 0.7 }
      ];
      const expectedNotes = ['C4', 'E4', 'G4'];

      const accuracy = analyzer.analyzeNoteAccuracy(detectedNotes, expectedNotes);

      expect(accuracy.overall).toBeGreaterThan(0);
      expect(accuracy.overall).toBeLessThanOrEqual(1);
      expect(accuracy.correctNotes).toBeGreaterThanOrEqual(1);
      expect(accuracy.totalNotes).toBe(3);
      expect(accuracy.individual).toHaveLength(3);
    });

    it('should handle mismatched note counts', () => {
      const analyzer = audioPerformanceAnalyzer as any;

      const detectedNotes = [
        { note: 'C4', centsOff: 0, amplitude: 0.8 }
      ];
      const expectedNotes = ['C4', 'E4', 'G4'];

      const accuracy = analyzer.analyzeNoteAccuracy(detectedNotes, expectedNotes);

      expect(accuracy.totalNotes).toBe(3);
      expect(accuracy.correctNotes).toBeLessThanOrEqual(1);
    });
  });

  describe('Rhythmic Accuracy Analysis', () => {
    it('should analyze rhythmic performance', () => {
      const analyzer = audioPerformanceAnalyzer as any;
      const audioData = new Float32Array(4096);
      const sampleRate = 44100;
      const context = {
        exerciseType: 'rhythm_practice' as const,
        tempo: 120,
        targetDifficulty: 3,
        userLevel: 2
      };

      const rhythmic = analyzer.analyzeRhythmicAccuracy(audioData, sampleRate, context);

      expect(rhythmic.overall).toBeGreaterThanOrEqual(0);
      expect(rhythmic.overall).toBeLessThanOrEqual(1);
      expect(rhythmic.averageDeviation).toBeDefined();
      expect(rhythmic.consistency).toBeGreaterThanOrEqual(0);
      expect(rhythmic.consistency).toBeLessThanOrEqual(1);
      expect(rhythmic.tempoStability).toBeGreaterThanOrEqual(0);
      expect(rhythmic.tempoStability).toBeLessThanOrEqual(1);
      expect(rhythmic.timingDeviations).toBeDefined();
      expect(Array.isArray(rhythmic.timingDeviations)).toBe(true);
    });
  });

  describe('Sound Clarity Analysis', () => {
    it('should detect sound quality issues', () => {
      const analyzer = audioPerformanceAnalyzer as any;

      // Test with clean sound
      const cleanAudio = new Float32Array(1024);
      for (let i = 0; i < cleanAudio.length; i++) {
        cleanAudio[i] = Math.sin(i * 0.1) * 0.8; // Clean sine wave
      }

      const cleanResult = analyzer.analyzeSoundClarity(cleanAudio, 44100, {
        exerciseType: 'chord_formation',
        targetDifficulty: 3,
        userLevel: 2
      });

      expect(cleanResult.overall).toBeGreaterThan(0.5); // Should be relatively good
      expect(cleanResult.buzzDetected).toBe(false);

      // Test with noisy sound
      const noisyAudio = new Float32Array(1024);
      for (let i = 0; i < noisyAudio.length; i++) {
        noisyAudio[i] = (Math.sin(i * 0.1) + Math.random() * 0.5) * 0.8; // Add noise
      }

      const noisyResult = analyzer.analyzeSoundClarity(noisyAudio, 44100, {
        exerciseType: 'chord_formation',
        targetDifficulty: 3,
        userLevel: 2
      });

      expect(noisyResult.unwantedNoise).toBeGreaterThan(cleanResult.unwantedNoise);
    });
  });

  describe('Overall Score Calculation', () => {
    it('should weight metrics appropriately', () => {
      const analyzer = audioPerformanceAnalyzer as any;

      // Perfect performance in all areas
      const perfectMetrics = {
        noteAccuracy: { overall: 1.0 },
        rhythmicAccuracy: { overall: 1.0 },
        soundClarity: { overall: 1.0 },
        dynamics: { overall: 1.0 },
        consistency: { overall: 1.0 }
      };

      const perfectScore = analyzer.calculateOverallScore(perfectMetrics);
      expect(perfectScore).toBe(100);

      // Poor performance in all areas
      const poorMetrics = {
        noteAccuracy: { overall: 0.0 },
        rhythmicAccuracy: { overall: 0.0 },
        soundClarity: { overall: 0.0 },
        dynamics: { overall: 0.0 },
        consistency: { overall: 0.0 }
      };

      const poorScore = analyzer.calculateOverallScore(poorMetrics);
      expect(poorScore).toBe(0);
    });

    it('should prioritize note accuracy', () => {
      const analyzer = audioPerformanceAnalyzer as any;

      // Good notes, poor rhythm
      const noteFocused = {
        noteAccuracy: { overall: 1.0 },
        rhythmicAccuracy: { overall: 0.0 },
        soundClarity: { overall: 0.5 },
        dynamics: { overall: 0.5 },
        consistency: { overall: 0.5 }
      };

      // Poor notes, good rhythm
      const rhythmFocused = {
        noteAccuracy: { overall: 0.0 },
        rhythmicAccuracy: { overall: 1.0 },
        soundClarity: { overall: 0.5 },
        dynamics: { overall: 0.5 },
        consistency: { overall: 0.5 }
      };

      const noteScore = analyzer.calculateOverallScore(noteFocused);
      const rhythmScore = analyzer.calculateOverallScore(rhythmFocused);

      // Note accuracy should have higher weight (35% vs 25%)
      expect(noteScore).toBeGreaterThan(rhythmScore);
    });
  });

  describe('Competence Event Conversion', () => {
    it('should convert performance metrics to competence events', () => {
      const metrics = {
        overallScore: 85,
        noteAccuracy: { overall: 0.9 },
        rhythmicAccuracy: { overall: 0.8 },
        soundClarity: { overall: 0.7 },
        dynamics: { overall: 0.8 },
        consistency: { overall: 0.9 },
        feedback: { strengths: [], weaknesses: [], recommendations: [], nextFocus: 'note_accuracy' }
      };

      const context = {
        exerciseType: 'chord_formation' as const,
        expectedNotes: ['C4', 'E4', 'G4'],
        tempo: 120,
        targetDifficulty: 3,
        userLevel: 2
      };

      const event = audioPerformanceAnalyzer.convertToCompetenceEvent(metrics, context);

      expect(event.competenceId).toBe('chord-formation');
      expect(event.performance).toBeGreaterThan(0);
      expect(event.performance).toBeLessThanOrEqual(1);
      expect(event.context.difficulty).toBe(3);
      expect(event.context.exerciseType).toBe('chord_formation');
      expect(event.context.metrics).toBeDefined();
    });

    it('should map exercise types to correct competences', () => {
      const context = {
        exerciseType: 'chord_transition' as const,
        targetDifficulty: 3,
        userLevel: 2
      };

      const metrics = {
        overallScore: 75,
        noteAccuracy: { overall: 0.8 },
        rhythmicAccuracy: { overall: 0.7 },
        soundClarity: { overall: 0.6 },
        dynamics: { overall: 0.7 },
        consistency: { overall: 0.8 },
        feedback: { strengths: [], weaknesses: [], recommendations: [], nextFocus: 'rhythm' }
      };

      const event = audioPerformanceAnalyzer.convertToCompetenceEvent(metrics, context);
      expect(event.competenceId).toBe('chord-transitions');
    });
  });

  describe('Feedback Generation', () => {
    it('should generate actionable feedback', () => {
      const analyzer = audioPerformanceAnalyzer as any;

      // Good performance
      const goodMetrics = {
        noteAccuracy: { overall: 0.95 },
        rhythmicAccuracy: { overall: 0.9, consistency: 0.95 },
        soundClarity: { overall: 0.9, buzzDetected: false, unwantedNoise: 0.1 },
        dynamics: { overall: 0.85 },
        consistency: { overall: 0.9, fatigueIndicators: false }
      };

      const goodFeedback = analyzer.generateDetailedFeedback(goodMetrics, {
        exerciseType: 'chord_formation',
        targetDifficulty: 3,
        userLevel: 2
      });

      expect(goodFeedback.strengths.length).toBeGreaterThan(0);
      expect(goodFeedback.weaknesses.length).toBeLessThanOrEqual(2);

      // Poor performance
      const poorMetrics = {
        noteAccuracy: { overall: 0.3 },
        rhythmicAccuracy: { overall: 0.4, consistency: 0.3 },
        soundClarity: { overall: 0.4, buzzDetected: true, unwantedNoise: 0.4 },
        dynamics: { overall: 0.5 },
        consistency: { overall: 0.4, fatigueIndicators: true }
      };

      const poorFeedback = analyzer.generateDetailedFeedback(poorMetrics, {
        exerciseType: 'chord_formation',
        targetDifficulty: 3,
        userLevel: 2
      });

      expect(poorFeedback.weaknesses.length).toBeGreaterThan(0);
      expect(poorFeedback.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide context-specific feedback', () => {
      const analyzer = audioPerformanceAnalyzer as any;

      const metrics = {
        noteAccuracy: { overall: 0.6 },
        rhythmicAccuracy: { overall: 0.7, consistency: 0.8 },
        soundClarity: { overall: 0.8, buzzDetected: false },
        dynamics: { overall: 0.7 },
        consistency: { overall: 0.8 }
      };

      // Chord formation context
      const chordFeedback = analyzer.generateDetailedFeedback(metrics, {
        exerciseType: 'chord_formation',
        targetDifficulty: 3,
        userLevel: 2
      });

      // Rhythm practice context
      const rhythmFeedback = analyzer.generateDetailedFeedback(metrics, {
        exerciseType: 'rhythm_practice',
        targetDifficulty: 3,
        userLevel: 2
      });

      // Feedback should be different based on exercise type
      expect(chordFeedback.recommendations).not.toEqual(rhythmFeedback.recommendations);
    });
  });
});