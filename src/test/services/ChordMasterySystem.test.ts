import { describe, it, expect, beforeEach } from 'vitest';
import { chordMasterySystem } from '@/services/ChordMasterySystem';

describe('ChordMasterySystem', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Chord Database', () => {
    it('should have chord definitions', () => {
      const chords = chordMasterySystem.getAllChords();
      expect(chords).toHaveLength(8); // C, G, Am, F, Em, D, A, E

      // Check specific chord
      const cChord = chordMasterySystem.getChordDefinition('C');
      expect(cChord).toBeDefined();
      expect(cChord!.name).toBe('C');
      expect(cChord!.quality).toBe('major');
      expect(cChord!.difficulty).toBe(2);
    });

    it('should validate chord properties', () => {
      const chords = chordMasterySystem.getAllChords();

      chords.forEach(chord => {
        expect(chord.name).toBeDefined();
        expect(chord.root).toBeDefined();
        expect(chord.quality).toBeDefined();
        expect(['major', 'minor', 'dim', 'aug', 'sus4', 'sus2', '7', 'maj7', 'm7', 'dim7']).toContain(chord.quality);
        expect(chord.frets).toHaveLength(6);
        expect(chord.fingers).toHaveLength(6);
        expect(chord.difficulty).toBeGreaterThanOrEqual(1);
        expect(chord.difficulty).toBeLessThanOrEqual(10);
        expect(chord.commonness).toBeGreaterThanOrEqual(1);
        expect(chord.commonness).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Mastery Levels', () => {
    it('should have 4 mastery levels', () => {
      const levels = chordMasterySystem.getMasteryLevels();
      expect(levels).toHaveLength(4);

      expect(levels[0].level).toBe(1);
      expect(levels[1].level).toBe(2);
      expect(levels[2].level).toBe(3);
      expect(levels[3].level).toBe(4);
    });

    it('should have progressive difficulty requirements', () => {
      const levels = chordMasterySystem.getMasteryLevels();

      // Level 1 should be easiest
      expect(levels[0].requirements.accuracy).toBeLessThan(levels[1].requirements.accuracy);
      expect(levels[1].requirements.accuracy).toBeLessThan(levels[2].requirements.accuracy);
      expect(levels[2].requirements.accuracy).toBeLessThan(levels[3].requirements.accuracy);

      // Level 4 should have highest requirements
      expect(levels[3].requirements.accuracy).toBeGreaterThanOrEqual(85);
      expect(levels[3].requirements.speed).toBeGreaterThanOrEqual(120);
      expect(levels[3].requirements.consistency).toBeGreaterThanOrEqual(80);
    });

    it('should have exercises for each level', () => {
      const levels = chordMasterySystem.getMasteryLevels();

      levels.forEach(level => {
        expect(level.exercises).toBeDefined();
        expect(level.exercises.length).toBeGreaterThan(0);

        level.exercises.forEach(exercise => {
          expect(exercise.id).toBeDefined();
          expect(exercise.name).toBeDefined();
          expect(exercise.description).toBeDefined();
          expect(['knowledge', 'execution', 'transition', 'application']).toContain(exercise.type);
          expect(exercise.difficulty).toBeGreaterThanOrEqual(1);
          expect(exercise.estimatedDuration).toBeGreaterThan(0);
          expect(exercise.instructions).toBeDefined();
          expect(exercise.instructions.length).toBeGreaterThan(0);
          expect(exercise.successCriteria).toBeDefined();
          expect(exercise.successCriteria.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should initialize chord progress', () => {
      const progress = chordMasterySystem.getChordProgress('C');
      expect(progress).toBeNull(); // Should not exist initially

      // Trigger progress creation by recording an attempt
      chordMasterySystem.recordExerciseAttempt('C', 'identify_chord', {
        accuracy: 0.8,
        speed: 100,
        consistency: 0.9,
        duration: 10
      });

      const newProgress = chordMasterySystem.getChordProgress('C');
      expect(newProgress).toBeDefined();
      expect(newProgress!.chordName).toBe('C');
      expect(newProgress!.currentLevel).toBe(1);
      expect(newProgress!.overallProficiency).toBeGreaterThan(0);
    });

    it('should update progress with exercise attempts', () => {
      // Record successful attempt
      chordMasterySystem.recordExerciseAttempt('C', 'form_chord_slowly', {
        accuracy: 0.9,
        speed: 80,
        consistency: 0.95,
        duration: 15
      });

      const progress = chordMasterySystem.getChordProgress('C');
      expect(progress!.completedExercises).toContain('form_chord_slowly');
      expect(progress!.attempts).toBe(1);
      expect(progress!.timeSpent).toBe(8); // 2 minutes estimated
      expect(progress!.overallProficiency).toBeGreaterThan(0);
    });

    it('should advance levels when requirements are met', () => {
      // Level 1 exercises
      chordMasterySystem.recordExerciseAttempt('C', 'identify_chord', {
        accuracy: 100,
        speed: 100,
        consistency: 100,
        duration: 5
      });

      chordMasterySystem.recordExerciseAttempt('C', 'name_notes', {
        accuracy: 100,
        speed: 100,
        consistency: 100,
        duration: 8
      });

      let progress = chordMasterySystem.getChordProgress('C');
      expect(progress!.currentLevel).toBe(1);

      // Complete level 1 fully
      chordMasterySystem.recordExerciseAttempt('C', 'form_chord_slowly', {
        accuracy: 100,
        speed: 100,
        consistency: 100,
        duration: 10
      });

      // Should advance to level 2
      progress = chordMasterySystem.getChordProgress('C');
      expect(progress!.currentLevel).toBe(2);
    });

    it('should track best performance', () => {
      // First attempt
      chordMasterySystem.recordExerciseAttempt('C', 'form_chord_slowly', {
        accuracy: 0.7,
        speed: 90,
        consistency: 0.8,
        duration: 10
      });

      let progress = chordMasterySystem.getChordProgress('C');
      expect(progress!.bestPerformance.accuracy).toBe(0.7);

      // Better attempt
      chordMasterySystem.recordExerciseAttempt('C', 'form_chord_slowly', {
        accuracy: 0.9,
        speed: 110,
        consistency: 0.95,
        duration: 12
      });

      progress = chordMasterySystem.getChordProgress('C');
      expect(progress!.bestPerformance.accuracy).toBe(0.9);
      expect(progress!.bestPerformance.speed).toBe(110);
    });
  });

  describe('Exercise Recommendations', () => {
    it('should recommend next exercise for chord', () => {
      const nextExercise = chordMasterySystem.getNextExercise('C');
      expect(nextExercise).toBeDefined();
      expect(nextExercise!.id).toBe('identify_chord'); // First exercise of level 1
    });

    it('should recommend exercises in correct order', () => {
      // Complete first exercise
      chordMasterySystem.recordExerciseAttempt('C', 'identify_chord', {
        accuracy: 100,
        speed: 100,
        consistency: 100,
        duration: 5
      });

      const nextExercise = chordMasterySystem.getNextExercise('C');
      expect(nextExercise!.id).toBe('name_notes'); // Second exercise of level 1
    });

    it('should provide exercises for specific level', () => {
      const level1Exercises = chordMasterySystem.getExercisesForLevel('C', 1);
      expect(level1Exercises).toHaveLength(3); // identify_chord, name_notes, form_chord_slowly

      level1Exercises.forEach(exercise => {
        expect(exercise.name).toContain('C'); // Should be customized for the chord
        expect(exercise.type).toBe('knowledge'); // Level 1 is knowledge
      });
    });
  });

  describe('Proficiency Calculation', () => {
    it('should calculate chord proficiency', () => {
      // No progress yet
      let proficiency = chordMasterySystem.getChordProficiency('C');
      expect(proficiency).toBe(0);

      // Add some progress
      chordMasterySystem.recordExerciseAttempt('C', 'identify_chord', {
        accuracy: 80,
        speed: 100,
        consistency: 90,
        duration: 5
      });

      proficiency = chordMasterySystem.getChordProficiency('C');
      expect(proficiency).toBeGreaterThan(0);
      expect(proficiency).toBeLessThanOrEqual(100);
    });

    it('should identify chords needing practice', () => {
      // Set up different proficiency levels
      chordMasterySystem.recordExerciseAttempt('C', 'form_chord_slowly', {
        accuracy: 90,
        speed: 100,
        consistency: 95,
        duration: 10
      });

      chordMasterySystem.recordExerciseAttempt('G', 'identify_chord', {
        accuracy: 50,
        speed: 100,
        consistency: 80,
        duration: 5
      });

      const needingPractice = chordMasterySystem.getChordsNeedingPractice();
      expect(needingPractice).toContain('G'); // Lower proficiency
      expect(needingPractice.length).toBeGreaterThan(0);
    });
  });

  describe('Mastery Statistics', () => {
    it('should provide mastery statistics', () => {
      // Add some progress to multiple chords
      chordMasterySystem.recordExerciseAttempt('C', 'form_chord_slowly', {
        accuracy: 100,
        speed: 120,
        consistency: 100,
        duration: 10
      });

      chordMasterySystem.recordExerciseAttempt('C', 'sustain_chord', {
        accuracy: 100,
        speed: 120,
        consistency: 100,
        duration: 8
      });

      // Advance C to level 4 (mastery)
      chordMasterySystem.recordExerciseAttempt('C', 'chord_in_song', {
        accuracy: 95,
        speed: 140,
        consistency: 95,
        duration: 20
      });

      const stats = chordMasterySystem.getMasteryStats();

      expect(stats.totalChords).toBe(8);
      expect(stats.masteredChords).toBeGreaterThanOrEqual(1);
      expect(stats.learningChords).toBeLessThanOrEqual(7);
      expect(stats.totalPracticeTime).toBeGreaterThan(0);
      expect(stats.averageProficiency).toBeGreaterThan(0);
    });
  });

  describe('Data Persistence', () => {
    it('should persist progress to localStorage', () => {
      chordMasterySystem.recordExerciseAttempt('C', 'identify_chord', {
        accuracy: 80,
        speed: 100,
        consistency: 90,
        duration: 5
      });

      // Should have saved to localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'chord_mastery_C',
        expect.any(String)
      );
    });

    it('should load progress from localStorage', () => {
      // Mock existing progress
      const mockProgress = {
        chordName: 'C',
        currentLevel: 2,
        overallProficiency: 65,
        levelProgress: { knowledge: 80, execution: 70, transition: 50, application: 40 },
        completedExercises: ['identify_chord', 'name_notes'],
        attempts: 3,
        bestPerformance: { accuracy: 85, speed: 110, consistency: 90, date: new Date() },
        timeSpent: 15,
        lastPracticed: new Date(),
        streak: 2
      };

      (localStorage.getItem as any).mockReturnValue(JSON.stringify(mockProgress));

      // Create new instance to test loading
      const progress = chordMasterySystem.getChordProgress('C');
      expect(progress?.currentLevel).toBe(2);
      expect(progress?.overallProficiency).toBe(65);
      expect(progress?.completedExercises).toContain('identify_chord');
    });
  });
});