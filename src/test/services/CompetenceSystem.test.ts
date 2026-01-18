import { describe, it, expect, beforeEach, vi } from 'vitest';
import { competenceSystem } from '@/services/CompetenceSystem';

describe('CompetenceSystem', () => {
  beforeEach(() => {
    // Reset the singleton instance
    competenceSystem.resetCompetences();
  });

  describe('Competence Definitions', () => {
    it('should have all required competence definitions', () => {
      const definitions = competenceSystem.getAllCompetenceDefinitions();
      expect(definitions).toHaveLength(18);

      // Check for specific categories
      const categories = definitions.map(d => d.category);
      expect(categories).toContain('harmony');
      expect(categories).toContain('rhythm');
      expect(categories).toContain('technique');
      expect(categories).toContain('theory');
      expect(categories).toContain('reading');
      expect(categories).toContain('ear');
    });

    it('should have valid competence properties', () => {
      const definitions = competenceSystem.getAllCompetenceDefinitions();

      definitions.forEach(def => {
        expect(def.id).toBeDefined();
        expect(def.name).toBeDefined();
        expect(def.description).toBeDefined();
        expect(def.category).toBeDefined();
        expect(def.subskills).toBeDefined();
        expect(def.difficulty).toBeGreaterThanOrEqual(1);
        expect(def.difficulty).toBeLessThanOrEqual(10);
        expect(def.decayRate).toBeGreaterThan(0);
        expect(def.baselineProficiency).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Event Recording', () => {
    it('should record competence events correctly', () => {
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.8,
        context: {
          difficulty: 3,
          exerciseType: 'chord_practice',
          duration: 300
        }
      });

      const stats = competenceSystem.getCompetenceStats('chord-formation');
      expect(stats).toBeDefined();
      expect(stats?.currentProficiency).toBeGreaterThan(0);
      expect(stats?.totalPracticeTime).toBe(5); // 1 event * 5 min
    });

    it('should update proficiency with exponential weighted average', () => {
      // First event
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.5,
        context: {
          difficulty: 3,
          exerciseType: 'chord_practice',
          duration: 300
        }
      });

      let stats = competenceSystem.getCompetenceStats('chord-formation');
      expect(stats?.currentProficiency).toBeGreaterThan(0);

      const firstProficiency = stats!.currentProficiency;

      // Second event with better performance
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.9,
        context: {
          difficulty: 3,
          exerciseType: 'chord_practice',
          duration: 300
        }
      });

      stats = competenceSystem.getCompetenceStats('chord-formation');
      const secondProficiency = stats!.currentProficiency;

      // Should be higher than first, but not just the new performance
      expect(secondProficiency).toBeGreaterThan(firstProficiency);
      expect(secondProficiency).toBeLessThan(100); // Should be balanced
    });

    it('should adjust performance based on difficulty', () => {
      // Easy exercise
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.8,
        context: {
          difficulty: 2, // Easy
          exerciseType: 'chord_practice',
          duration: 300
        }
      });

      const easyStats = competenceSystem.getCompetenceStats('chord-formation');

      competenceSystem.resetCompetences();

      // Difficult exercise
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.8,
        context: {
          difficulty: 8, // Difficult
          exerciseType: 'chord_practice',
          duration: 300
        }
      });

      const difficultStats = competenceSystem.getCompetenceStats('chord-formation');

      // Difficult exercise should give higher proficiency for same performance
      expect(difficultStats!.currentProficiency).toBeGreaterThan(easyStats!.currentProficiency);
    });
  });

  describe('Temporal Decay', () => {
    it('should apply temporal decay to unused competences', () => {
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.8,
        context: {
          difficulty: 3,
          exerciseType: 'chord_practice',
          duration: 300
        }
      });

      const initialStats = competenceSystem.getCompetenceStats('chord-formation');
      const initialProficiency = initialStats!.currentProficiency;

      // Simulate 8 days of decay (more than 7 day threshold)
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      // Manually set last updated to 8 days ago
      const profile = competenceSystem.getCompetenceProfile();
      profile['chord-formation'].lastUpdated = eightDaysAgo;

      competenceSystem.applyTemporalDecay();

      const decayedStats = competenceSystem.getCompetenceStats('chord-formation');
      expect(decayedStats!.currentProficiency).toBeLessThan(initialProficiency);
      expect(decayedStats!.riskOfDecay).toBe(true);
    });
  });

  describe('Competence Analysis', () => {
    beforeEach(() => {
      // Set up some competence data
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.9,
        context: { difficulty: 3, exerciseType: 'practice', duration: 300 }
      });
      competenceSystem.recordEvent({
        competenceId: 'chord-transitions',
        performance: 0.6,
        context: { difficulty: 4, exerciseType: 'practice', duration: 300 }
      });
      competenceSystem.recordEvent({
        competenceId: 'rhythmic-precision',
        performance: 0.7,
        context: { difficulty: 3, exerciseType: 'practice', duration: 300 }
      });
    });

    it('should identify competences needing practice', () => {
      const needingPractice = competenceSystem.getCompetencesNeedingPractice();
      expect(needingPractice).toContain('chord-transitions'); // Lower proficiency
      expect(needingPractice).not.toContain('chord-formation'); // High proficiency
    });

    it('should calculate overall level correctly', () => {
      const overallLevel = competenceSystem.getOverallLevel();
      expect(overallLevel).toBeGreaterThanOrEqual(1);
      expect(overallLevel).toBeLessThanOrEqual(10);
    });

    it('should provide detailed competence statistics', () => {
      const stats = competenceSystem.getCompetenceStats('chord-formation');
      expect(stats).toBeDefined();
      expect(stats!.currentProficiency).toBeGreaterThan(0);
      expect(stats!.trend).toBeDefined();
      expect(stats!.daysSinceLastPractice).toBeDefined();
      expect(['improving', 'stable', 'declining']).toContain(stats!.trend);
    });
  });

  describe('Data Persistence', () => {
    it('should persist data to localStorage', () => {
      competenceSystem.recordEvent({
        competenceId: 'chord-formation',
        performance: 0.8,
        context: { difficulty: 3, exerciseType: 'practice', duration: 300 }
      });

      // Should have called localStorage.setItem
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should load data from localStorage on initialization', () => {
      // Mock localStorage with existing data
      const mockData = {
        'chord-formation': {
          currentProficiency: 75,
          lastUpdated: new Date().toISOString(),
          totalEvents: 5,
          recentPerformance: [0.8, 0.9, 0.7],
          riskOfDecay: false,
          decayRate: 0.005
        }
      };

      (localStorage.getItem as any).mockReturnValue(JSON.stringify(mockData));

      // Create new instance to test loading
      const newInstance = competenceSystem; // This should load the mock data

      const stats = newInstance.getCompetenceStats('chord-formation');
      expect(stats?.currentProficiency).toBe(75);
      expect(stats?.totalPracticeTime).toBe(25); // 5 events * 5 min
    });
  });
});