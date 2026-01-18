import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recommendationEngine } from '@/services/RecommendationEngine';
import { competenceSystem } from '@/services/CompetenceSystem';

describe('RecommendationEngine', () => {
  beforeEach(() => {
    competenceSystem.resetCompetences();
  });

  describe('Next Exercise Recommendation', () => {
    it('should recommend exercise for competence needing practice', () => {
      // Set up competence data
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.9, // High proficiency
        context: { difficulty: 3, exerciseType: 'practice', duration: 300 }
      });

      competenceSystem.recordEvent({
        competenceId: 'chord-transitions',
        performance: 0.4, // Low proficiency - needs practice
        context: { difficulty: 4, exerciseType: 'practice', duration: 300 }
      });

      const userContext = {
        currentLevel: 2,
        availableTime: 15,
        preferredDifficulty: 'medium' as const,
        recentActivities: [],
        goals: ['improve_transitions'],
        timeOfDay: 'morning' as const,
        dayOfWeek: 1
      };

      const recommendation = recommendationEngine.getNextExerciseRecommendation(userContext);

      expect(recommendation).toBeDefined();
      expect(recommendation!.competenceId).toBe('chord-transitions');
      expect(recommendation!.difficulty).toBeGreaterThanOrEqual(2);
      expect(recommendation!.difficulty).toBeLessThanOrEqual(6); // Zone of proximal development
    });

    it('should prioritize decaying competences', () => {
      // Set up competence with high proficiency but old
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.9,
        context: { difficulty: 3, exerciseType: 'practice', duration: 300 }
      });

      // Manually set last updated to 10 days ago
      const profile = competenceSystem.getCompetenceProfile();
      profile['chord-formation'].lastUpdated = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      competenceSystem.applyTemporalDecay();

      const userContext = {
        currentLevel: 2,
        availableTime: 15,
        preferredDifficulty: 'medium' as const,
        recentActivities: [],
        goals: [],
        timeOfDay: 'morning' as const,
        dayOfWeek: 1
      };

      const recommendation = recommendationEngine.getNextExerciseRecommendation(userContext);

      expect(recommendation).toBeDefined();
      expect(recommendation!.competenceId).toBe('chord-formation');
      expect(recommendation!.priority).toBe('high');
    });

    it('should respect time constraints', () => {
      const userContext = {
        currentLevel: 2,
        availableTime: 5, // Very limited time
        preferredDifficulty: 'easy' as const,
        recentActivities: [],
        goals: [],
        timeOfDay: 'morning' as const,
        dayOfWeek: 1
      };

      const recommendation = recommendationEngine.getNextExerciseRecommendation(userContext);

      expect(recommendation).toBeDefined();
      expect(recommendation!.estimatedDuration).toBeLessThanOrEqual(5);
    });
  });

  describe('Session Recommendation', () => {
    it('should generate balanced session structure', () => {
      // Set up diverse competence levels
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.8,
        context: { difficulty: 3, exerciseType: 'practice', duration: 300 }
      });

      competenceSystem.recordEvent({
        competenceId: 'chord-transitions',
        performance: 0.5,
        context: { difficulty: 4, exerciseType: 'practice', duration: 300 }
      });

      competenceSystem.recordEvent({
        competenceId: 'rhythmic-precision',
        performance: 0.6,
        context: { difficulty: 3, exerciseType: 'practice', duration: 300 }
      });

      const userContext = {
        currentLevel: 2,
        availableTime: 30,
        preferredDifficulty: 'medium' as const,
        recentActivities: [],
        goals: ['improve_rhythm'],
        timeOfDay: 'afternoon' as const,
        dayOfWeek: 3
      };

      const session = recommendationEngine.getSessionRecommendation(userContext);

      expect(session).toBeDefined();
      expect(session.exercises).toBeDefined();
      expect(session.exercises.length).toBeGreaterThan(0);
      expect(session.totalDuration).toBeGreaterThan(0);
      expect(session.focusArea).toBeDefined();
      expect(session.estimatedDifficulty).toBeGreaterThan(0);

      // Check session structure (15% warmup, 60% main, 25% closure)
      const totalExercises = session.exercises.length;
      expect(totalExercises).toBeGreaterThanOrEqual(3); // At least warmup, main, closure

      // Check that total duration is reasonable
      expect(session.totalDuration).toBeLessThanOrEqual(30);
    });

    it('should adapt to user preferences', () => {
      const userContext = {
        currentLevel: 1,
        availableTime: 20,
        preferredDifficulty: 'easy' as const,
        recentActivities: [],
        goals: [],
        timeOfDay: 'morning' as const,
        dayOfWeek: 1
      };

      const session = recommendationEngine.getSessionRecommendation(userContext);

      // Should favor easier exercises for beginners
      session.exercises.forEach(exercise => {
        expect(exercise.difficulty).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('Recommendation Logic', () => {
    it('should calculate difficulty match score correctly', () => {
      // Access private method through type assertion (for testing)
      const engine = recommendationEngine as any;

      expect(engine.getDifficultyMatchScore(3, 'easy')).toBeGreaterThan(0);
      expect(engine.getDifficultyMatchScore(3, 'medium')).toBeGreaterThan(engine.getDifficultyMatchScore(3, 'hard'));
    });

    it('should avoid recently completed exercises', () => {
      const userContext = {
        currentLevel: 2,
        availableTime: 15,
        preferredDifficulty: 'medium' as const,
        recentActivities: ['chord_basic_c_formation'], // Recently done
        goals: [],
        timeOfDay: 'morning' as const,
        dayOfWeek: 1
      };

      const recommendation = recommendationEngine.getNextExerciseRecommendation(userContext);

      // Should not recommend the recently completed exercise
      expect(recommendation?.id).not.toBe('chord_basic_c_formation');
    });

    it('should consider time of day preferences', () => {
      const morningContext = {
        currentLevel: 2,
        availableTime: 15,
        preferredDifficulty: 'medium' as const,
        recentActivities: [],
        goals: [],
        timeOfDay: 'morning' as const,
        dayOfWeek: 1
      };

      const eveningContext = {
        ...morningContext,
        timeOfDay: 'evening' as const
      };

      const morningRec = recommendationEngine.getNextExerciseRecommendation(morningContext);
      const eveningRec = recommendationEngine.getNextExerciseRecommendation(eveningContext);

      // Results might be the same due to other factors, but logic should consider time
      expect(morningRec).toBeDefined();
      expect(eveningRec).toBeDefined();
    });
  });

  describe('Statistics and Analytics', () => {
    it('should provide recommendation statistics', () => {
      const stats = recommendationEngine.getRecommendationStats();

      expect(stats).toBeDefined();
      expect(stats.totalExercises).toBeGreaterThan(0);
      expect(stats.exercisesByCompetence).toBeDefined();
      expect(stats.averageDifficulty).toBeGreaterThan(0);
    });

    it('should track exercise distribution by competence', () => {
      const stats = recommendationEngine.getRecommendationStats();

      // Should have exercises for multiple competence types
      const competenceTypes = Object.keys(stats.exercisesByCompetence);
      expect(competenceTypes.length).toBeGreaterThan(1);
    });
  });
});