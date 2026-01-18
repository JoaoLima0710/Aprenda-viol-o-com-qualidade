import { describe, it, expect, beforeEach, vi } from 'vitest';
import { competenceSystem } from '@/services/CompetenceSystem';
import { recommendationEngine } from '@/services/RecommendationEngine';
import { audioPerformanceAnalyzer } from '@/services/AudioPerformanceAnalyzer';
import { chordMasterySystem } from '@/services/ChordMasterySystem';
import { songSegmentationService } from '@/services/SongSegmentationService';

describe('System Integration', () => {
  beforeEach(() => {
    // Reset all systems
    competenceSystem.resetCompetences();
    localStorage.clear();
  });

  describe('Complete Learning Flow', () => {
    it('should handle complete exercise performance flow', () => {
      // 1. User performs exercise
      const audioData = new Float32Array(2048);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(i * 0.1) * 0.8; // Good quality audio
      }

      const context = {
        exerciseType: 'chord_formation' as const,
        expectedNotes: ['C4', 'E4', 'G4'],
        tempo: 120,
        targetDifficulty: 3,
        userLevel: 2
      };

      // 2. Analyze performance
      const performanceMetrics = audioPerformanceAnalyzer.analyzePerformance(
        audioData,
        44100,
        context
      );

      expect(performanceMetrics.overallScore).toBeGreaterThan(0);

      // 3. Convert to competence event
      const competenceEvent = audioPerformanceAnalyzer.convertToCompetenceEvent(
        performanceMetrics,
        context
      );

      // 4. Record in competence system
      competenceSystem.recordEvent(competenceEvent);

      // 5. Verify competence was updated
      const stats = competenceSystem.getCompetenceStats('chord-formation');
      expect(stats).toBeDefined();
      expect(stats!.currentProficiency).toBeGreaterThan(0);

      // 6. Get recommendation based on updated competence
      const userContext = {
        currentLevel: 2,
        availableTime: 15,
        preferredDifficulty: 'medium' as const,
        recentActivities: ['chord_formation_exercise'],
        goals: ['improve_chord_accuracy'],
        timeOfDay: 'morning' as const,
        dayOfWeek: 1
      };

      const recommendation = recommendationEngine.getNextExerciseRecommendation(userContext);
      expect(recommendation).toBeDefined();
    });

    it('should integrate chord mastery with competence system', () => {
      // 1. Record chord exercise performance
      chordMasterySystem.recordExerciseAttempt('C', 'form_chord_slowly', {
        accuracy: 0.85,
        speed: 100,
        consistency: 0.9,
        duration: 10
      });

      // 2. Check if chord progress was updated
      const chordProgress = chordMasterySystem.getChordProgress('C');
      expect(chordProgress).toBeDefined();
      expect(chordProgress!.overallProficiency).toBeGreaterThan(0);

      // 3. Verify competence system also reflects chord practice
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.85,
        context: {
          difficulty: 3,
          exerciseType: 'chord_practice',
          duration: 300
        }
      });

      const competenceStats = competenceSystem.getCompetenceStats('chord-formation');
      expect(competenceStats!.currentProficiency).toBeGreaterThan(0);

      // 4. Check if recommendations consider chord mastery
      const userContext = {
        currentLevel: 2,
        availableTime: 20,
        preferredDifficulty: 'medium' as const,
        recentActivities: [],
        goals: ['master_chords'],
        timeOfDay: 'afternoon' as const,
        dayOfWeek: 2
      };

      const recommendation = recommendationEngine.getNextExerciseRecommendation(userContext);
      expect(recommendation).toBeDefined();
    });
  });

  describe('Song Learning Integration', () => {
    it('should integrate song analysis with chord mastery', () => {
      // 1. Analyze a song
      const songData = {
        title: 'Integration Test Song',
        artist: 'Test Artist',
        chordSheet: `
[Verse]
C G Am F

[Chorus]
F C G Am

[Bridge]
Bb F C G
        `,
        tempo: 120,
        key: 'C'
      };

      const analysis = songSegmentationService.analyzeSong(songData);
      expect(analysis.sections.length).toBeGreaterThan(0);

      // 2. Create learning journey
      const journey = songSegmentationService.createLearningJourney(analysis, 2);
      expect(journey.phases.length).toBe(3);

      // 3. Check which chords need practice for this song
      const chordsNeedingPractice = chordMasterySystem.getChordsNeedingPractice();
      expect(chordsNeedingPractice.length).toBeGreaterThan(0);

      // 4. Verify song chords are in the system
      analysis.uniqueChords.forEach(chord => {
        const chordDef = chordMasterySystem.getChordDefinition(chord);
        expect(chordDef).toBeDefined();
      });
    });

    it('should adapt recommendations based on song learning', () => {
      // 1. Set up user with some chord progress
      chordMasterySystem.recordExerciseAttempt('C', 'identify_chord', {
        accuracy: 90,
        speed: 100,
        consistency: 95,
        duration: 5
      });

      chordMasterySystem.recordExerciseAttempt('G', 'identify_chord', {
        accuracy: 50, // Needs work
        speed: 100,
        consistency: 80,
        duration: 5
      });

      // 2. Analyze song that uses these chords
      const songData = {
        title: 'C G Song',
        artist: 'Test',
        chordSheet: '[Verse]\nC G Am F',
        tempo: 120,
        key: 'C'
      };

      const analysis = songSegmentationService.analyzeSong(songData);

      // 3. Get sections needing practice
      const userProficiency: Record<string, number> = {
        'C': chordMasterySystem.getChordProficiency('C'),
        'G': chordMasterySystem.getChordProficiency('G'),
        'Am': chordMasterySystem.getChordProficiency('Am'),
        'F': chordMasterySystem.getChordProficiency('F')
      };

      const sectionsNeedingPractice = songSegmentationService.getSectionsNeedingPractice(
        analysis,
        userProficiency
      );

      expect(sectionsNeedingPractice.length).toBeGreaterThan(0);

      // 4. Recommendations should consider song context
      const userContext = {
        currentLevel: 2,
        availableTime: 25,
        preferredDifficulty: 'medium' as const,
        recentActivities: [],
        goals: ['learn_songs'],
        timeOfDay: 'morning' as const,
        dayOfWeek: 3
      };

      const session = recommendationEngine.getSessionRecommendation(userContext);
      expect(session.exercises.length).toBeGreaterThan(0);
    });
  });

  describe('Progressive Learning Path', () => {
    it('should provide coherent learning progression', () => {
      // 1. Start with baseline assessment
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.3, // Beginner level
        context: {
          difficulty: 2,
          exerciseType: 'assessment',
          duration: 300
        }
      });

      competenceSystem.recordEvent({
        competenceId: 'rhythmic-precision',
        performance: 0.4,
        context: {
          difficulty: 2,
          exerciseType: 'assessment',
          duration: 300
        }
      });

      // 2. Get initial recommendations
      const initialContext = {
        currentLevel: 1,
        availableTime: 15,
        preferredDifficulty: 'easy' as const,
        recentActivities: [],
        goals: ['learn_basics'],
        timeOfDay: 'morning' as const,
        dayOfWeek: 1
      };

      const initialRecommendation = recommendationEngine.getNextExerciseRecommendation(initialContext);
      expect(initialRecommendation).toBeDefined();
      expect(initialRecommendation!.difficulty).toBeLessThanOrEqual(3);

      // 3. Simulate progress
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.7, // Improved
        context: {
          difficulty: 3,
          exerciseType: 'practice',
          duration: 300
        }
      });

      // 4. Get updated recommendations
      const progressContext = {
        ...initialContext,
        availableTime: 20,
        preferredDifficulty: 'medium' as const,
        recentActivities: [initialRecommendation!.id]
      };

      const progressRecommendation = recommendationEngine.getNextExerciseRecommendation(progressContext);
      expect(progressRecommendation).toBeDefined();

      // Should be different from initial or more challenging
      expect(progressRecommendation!.difficulty).toBeGreaterThanOrEqual(initialRecommendation!.difficulty);
    });

    it('should maintain learning streak and motivation', () => {
      // 1. Simulate consistent practice
      for (let i = 0; i < 5; i++) {
        competenceSystem.recordEvent({
          competenceId: 'chord-formation',
          performance: 0.6 + (i * 0.1), // Improving performance
          context: {
            difficulty: 3,
            exerciseType: 'daily_practice',
            duration: 300
          }
        });
      }

      // 2. Check if competence improved
      const stats = competenceSystem.getCompetenceStats('chord-formation');
      expect(stats!.currentProficiency).toBeGreaterThan(20);

      // 3. Verify no decay risk for recent practice
      expect(stats!.riskOfDecay).toBe(false);

      // 4. Get session recommendation for continued practice
      const sessionContext = {
        currentLevel: competenceSystem.getOverallLevel(),
        availableTime: 25,
        preferredDifficulty: 'medium' as const,
        recentActivities: [],
        goals: ['maintain_streak'],
        timeOfDay: 'evening' as const,
        dayOfWeek: 5
      };

      const session = recommendationEngine.getSessionRecommendation(sessionContext);
      expect(session.exercises.length).toBeGreaterThan(0);
      expect(session.totalDuration).toBeGreaterThan(0);
    });
  });

  describe('Cross-System Data Consistency', () => {
    it('should maintain consistent user level across systems', () => {
      // 1. Set competence data
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.8,
        context: { difficulty: 3, exerciseType: 'practice', duration: 300 }
      });

      competenceSystem.recordEvent({
        competenceId: 'chord-transitions',
        performance: 0.7,
        context: { difficulty: 4, exerciseType: 'practice', duration: 300 }
      });

      const overallLevel = competenceSystem.getOverallLevel();

      // 2. Recommendations should consider this level
      const context = {
        currentLevel: overallLevel,
        availableTime: 20,
        preferredDifficulty: 'medium' as const,
        recentActivities: [],
        goals: [],
        timeOfDay: 'afternoon' as const,
        dayOfWeek: 2
      };

      const recommendation = recommendationEngine.getNextExerciseRecommendation(context);
      expect(recommendation).toBeDefined();

      // 3. Session should be appropriate for level
      const session = recommendationEngine.getSessionRecommendation(context);
      expect(session.estimatedDifficulty).toBeCloseTo(overallLevel, 1);
    });

    it('should handle data persistence across sessions', () => {
      // 1. Create some data
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.75,
        context: { difficulty: 3, exerciseType: 'practice', duration: 300 }
      });

      chordMasterySystem.recordExerciseAttempt('C', 'identify_chord', {
        accuracy: 80,
        speed: 100,
        consistency: 90,
        duration: 5
      });

      // 2. Simulate app restart (data should persist)
      const savedCompetence = competenceSystem.getCompetenceStats('chord-formation');
      const savedChord = chordMasterySystem.getChordProgress('C');

      expect(savedCompetence).toBeDefined();
      expect(savedChord).toBeDefined();
      expect(savedCompetence!.currentProficiency).toBeGreaterThan(0);
      expect(savedChord!.overallProficiency).toBeGreaterThan(0);

      // 3. New recommendations should consider persisted data
      const context = {
        currentLevel: 2,
        availableTime: 15,
        preferredDifficulty: 'medium' as const,
        recentActivities: [],
        goals: ['continue_learning'],
        timeOfDay: 'morning' as const,
        dayOfWeek: 1
      };

      const recommendation = recommendationEngine.getNextExerciseRecommendation(context);
      expect(recommendation).toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle missing data gracefully', () => {
      // Test with no competence data
      const context = {
        currentLevel: 1,
        availableTime: 15,
        preferredDifficulty: 'easy' as const,
        recentActivities: [],
        goals: [],
        timeOfDay: 'morning' as const,
        dayOfWeek: 1
      };

      const recommendation = recommendationEngine.getNextExerciseRecommendation(context);
      expect(recommendation).toBeDefined(); // Should still provide recommendation

      // Test with no chord data
      const chordsNeedingPractice = chordMasterySystem.getChordsNeedingPractice();
      expect(Array.isArray(chordsNeedingPractice)).toBe(true);
    });

    it('should recover from corrupted data', () => {
      // Simulate corrupted localStorage data
      (localStorage.getItem as any).mockReturnValueOnce('invalid json');

      // Systems should handle gracefully
      const stats = competenceSystem.getCompetenceStats('chord-formation');
      expect(stats).toBeNull();

      const progress = chordMasterySystem.getChordProgress('C');
      expect(progress).toBeNull();

      // Should still function
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.5,
        context: { difficulty: 2, exerciseType: 'practice', duration: 300 }
      });

      const newStats = competenceSystem.getCompetenceStats('chord-formation');
      expect(newStats).toBeDefined();
    });

    it('should handle extreme performance values', () => {
      // Test perfect performance
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 1.0,
        context: { difficulty: 5, exerciseType: 'practice', duration: 300 }
      });

      let stats = competenceSystem.getCompetenceStats('chord-formation');
      expect(stats!.currentProficiency).toBeLessThanOrEqual(100);

      // Test very poor performance
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.0,
        context: { difficulty: 1, exerciseType: 'practice', duration: 300 }
      });

      stats = competenceSystem.getCompetenceStats('chord-formation');
      expect(stats!.currentProficiency).toBeGreaterThanOrEqual(0);

      // System should still function
      const recommendation = recommendationEngine.getNextExerciseRecommendation({
        currentLevel: 1,
        availableTime: 10,
        preferredDifficulty: 'easy' as const,
        recentActivities: [],
        goals: [],
        timeOfDay: 'morning' as const,
        dayOfWeek: 1
      });
      expect(recommendation).toBeDefined();
    });
  });
});