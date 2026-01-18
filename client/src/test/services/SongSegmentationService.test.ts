import { describe, it, expect, beforeEach } from 'vitest';
import { songSegmentationService } from '@/services/SongSegmentationService';

describe('SongSegmentationService', () => {
  describe('Song Analysis', () => {
    it('should analyze song structure correctly', () => {
      const songData = {
        title: 'Test Song',
        artist: 'Test Artist',
        chordSheet: `
[Intro]
C G Am F

[Verse 1]
C          G
This is a test
Am         F
Song structure

[Chorus]
C     G     Am    F
This is the chorus part

[Verse 2]
C          G
Another verse here
Am         F
With different words

[Outro]
C G Am F
        `,
        tempo: 120,
        key: 'C',
        capo: 0
      };

      const analysis = songSegmentationService.analyzeSong(songData);

      expect(analysis).toBeDefined();
      expect(analysis.title).toBe('Test Song');
      expect(analysis.artist).toBe('Test Artist');
      expect(analysis.tempo).toBe(120);
      expect(analysis.key).toBe('C');
      expect(analysis.capo).toBe(0);
      expect(analysis.sections).toBeDefined();
      expect(analysis.sections.length).toBeGreaterThan(0);
    });

    it('should identify different section types', () => {
      const songData = {
        title: 'Test Song',
        artist: 'Test Artist',
        chordSheet: `
[Intro]
C G

[Verse]
Am F

[Chorus]
C G Am F

[Bridge]
Dm G

[Outro]
C G
        `,
        tempo: 120,
        key: 'C'
      };

      const analysis = songSegmentationService.analyzeSong(songData);

      const sectionTypes = analysis.sections.map(s => s.type);
      expect(sectionTypes).toContain('intro');
      expect(sectionTypes).toContain('verse');
      expect(sectionTypes).toContain('chorus');
      expect(sectionTypes).toContain('bridge');
      expect(sectionTypes).toContain('outro');
    });

    it('should calculate difficulty metrics', () => {
      const songData = {
        title: 'Complex Song',
        artist: 'Test Artist',
        chordSheet: `
[Intro]
Cmaj7 Dm7 Gm7 C7

[Verse]
Fm7 Bb7 Ebmaj7 Ab7

[Chorus]
Cmaj7 B7 Bb7 A7
        `,
        tempo: 160,
        key: 'C'
      };

      const analysis = songSegmentationService.analyzeSong(songData);

      expect(analysis.difficulty.overall).toBeGreaterThan(0);
      expect(analysis.difficulty.harmonicComplexity).toBeGreaterThan(0);
      expect(analysis.difficulty.rhythmicComplexity).toBeGreaterThan(0);
      expect(analysis.difficulty.technicalDemand).toBeGreaterThan(0);
      expect(analysis.difficulty.learningCurve).toBeGreaterThan(0);

      // Should be more difficult due to complex chords and fast tempo
      expect(analysis.difficulty.overall).toBeGreaterThan(5);
    });

    it('should extract unique chords', () => {
      const songData = {
        title: 'Simple Song',
        artist: 'Test Artist',
        chordSheet: `
[Verse]
C G Am F

[Chorus]
C G Am F

[Bridge]
C G
        `,
        tempo: 120,
        key: 'C'
      };

      const analysis = songSegmentationService.analyzeSong(songData);

      expect(analysis.uniqueChords).toContain('C');
      expect(analysis.uniqueChords).toContain('G');
      expect(analysis.uniqueChords).toContain('Am');
      expect(analysis.uniqueChords).toContain('F');
      expect(analysis.uniqueChords).toHaveLength(4);
    });

    it('should calculate recommended pace based on difficulty', () => {
      const songData = {
        title: 'Easy Song',
        artist: 'Test Artist',
        chordSheet: `
[Verse]
C G Am F

[Chorus]
C G Am F
        `,
        tempo: 100,
        key: 'C'
      };

      const analysis = songSegmentationService.analyzeSong(songData);

      expect(analysis.recommendedPace.beginner).toBeDefined();
      expect(analysis.recommendedPace.intermediate).toBeDefined();
      expect(analysis.recommendedPace.advanced).toBeDefined();

      // Beginner should take longer than advanced
      expect(analysis.recommendedPace.beginner[0]).toBeGreaterThan(analysis.recommendedPace.advanced[0]);
    });
  });

  describe('Learning Journey Creation', () => {
    it('should create learning journey for song', () => {
      const songData = {
        title: 'Journey Song',
        artist: 'Test Artist',
        chordSheet: `
[Intro]
C G

[Verse]
Am F

[Chorus]
C G Am F

[Bridge]
Dm G

[Outro]
C G
        `,
        tempo: 120,
        key: 'C'
      };

      const analysis = songSegmentationService.analyzeSong(songData);
      const journey = songSegmentationService.createLearningJourney(analysis, 2);

      expect(journey).toBeDefined();
      expect(journey.phases).toBeDefined();
      expect(journey.phases.length).toBe(3); // Familiarização, Construção, Refinamento
      expect(journey.totalDuration).toBeGreaterThan(0);
      expect(journey.milestones).toBeDefined();
      expect(journey.prerequisites).toBeDefined();
    });

    it('should adapt journey to user level', () => {
      const songData = {
        title: 'Adaptive Song',
        artist: 'Test Artist',
        chordSheet: `
[Verse]
C G Am F

[Chorus]
C G Am F
        `,
        tempo: 120,
        key: 'C'
      };

      const analysis = songSegmentationService.analyzeSong(songData);

      const beginnerJourney = songSegmentationService.createLearningJourney(analysis, 1);
      const advancedJourney = songSegmentationService.createLearningJourney(analysis, 4);

      // Advanced should take less time
      expect(beginnerJourney.totalDuration).toBeGreaterThan(advancedJourney.totalDuration);
    });

    it('should generate phase-specific content', () => {
      const songData = {
        title: 'Phase Song',
        artist: 'Test Artist',
        chordSheet: `
[Intro]
C

[Verse]
G Am

[Chorus]
F C G Am

[Outro]
F C
        `,
        tempo: 120,
        key: 'C'
      };

      const analysis = songSegmentationService.analyzeSong(songData);
      const journey = songSegmentationService.createLearningJourney(analysis, 2);

      journey.phases.forEach(phase => {
        expect(phase.name).toBeDefined();
        expect(phase.description).toBeDefined();
        expect(phase.duration).toBeGreaterThan(0);
        expect(phase.objectives).toBeDefined();
        expect(phase.objectives.length).toBeGreaterThan(0);
        expect(phase.sectionsToPractice).toBeDefined();
        expect(phase.skillsToDevelop).toBeDefined();
        expect(phase.successCriteria).toBeDefined();
        expect(phase.practiceStructure).toBeDefined();
      });
    });

    it('should identify prerequisites', () => {
      const songData = {
        title: 'Prerequisite Song',
        artist: 'Test Artist',
        chordSheet: `
[Verse]
F C G Am

[Chorus]
Bb F C G
        `,
        tempo: 120,
        key: 'C'
      };

      const analysis = songSegmentationService.analyzeSong(songData);
      const journey = songSegmentationService.createLearningJourney(analysis, 2);

      expect(journey.prerequisites).toBeDefined();
      expect(journey.prerequisites.length).toBeGreaterThan(0);
      expect(journey.prerequisites[0]).toContain('acordes'); // Should mention chords
    });
  });

  describe('Practice Recommendations', () => {
    it('should identify sections needing practice', () => {
      const songData = {
        title: 'Practice Song',
        artist: 'Test Artist',
        chordSheet: `
[Intro]
C G Am F

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

      // Mock user proficiency - low on bridge (difficult section)
      const userProficiency: Record<string, number> = {
        'C': 80,
        'G': 80,
        'Am': 80,
        'F': 80,
        'Bb': 30 // Low proficiency on Bb
      };

      const sectionsNeedingPractice = songSegmentationService.getSectionsNeedingPractice(
        analysis,
        userProficiency
      );

      expect(sectionsNeedingPractice).toBeDefined();
      expect(sectionsNeedingPractice.length).toBeGreaterThan(0);

      // Should prioritize sections with low user proficiency
      const bridgeSection = sectionsNeedingPractice.find(s => s.type === 'bridge');
      expect(bridgeSection).toBeDefined();
      expect(bridgeSection!.userProficiency).toBeLessThan(70);
    });

    it('should generate practice loops', () => {
      const mockSection = {
        id: 'test_section',
        name: 'Test Section',
        type: 'verse' as const,
        chords: ['C', 'G', 'Am', 'F'],
        chordChanges: 3,
        difficulty: {
          harmonic: 3,
          rhythmic: 2,
          technical: 3,
          overall: 3
        },
        repetitionCount: 2,
        practicePriority: 7
      };

      const practiceLoop = songSegmentationService.generatePracticeLoop(mockSection, 2);

      expect(practiceLoop).toBeDefined();
      expect(practiceLoop.repetitions).toBeGreaterThan(0);
      expect(practiceLoop.tempo).toBeGreaterThan(0);
      expect(practiceLoop.focusAreas).toBeDefined();
      expect(typeof practiceLoop.withBackingTrack).toBe('boolean');
    });

    it('should adapt practice loop to user level', () => {
      const mockSection = {
        id: 'test_section',
        name: 'Test Section',
        type: 'verse' as const,
        chords: ['C', 'G', 'Am', 'F'],
        chordChanges: 3,
        difficulty: {
          harmonic: 3,
          rhythmic: 2,
          technical: 3,
          overall: 3
        },
        repetitionCount: 2,
        practicePriority: 7
      };

      const beginnerLoop = songSegmentationService.generatePracticeLoop(mockSection, 1);
      const advancedLoop = songSegmentationService.generatePracticeLoop(mockSection, 4);

      // Advanced should have higher tempo and fewer repetitions
      expect(beginnerLoop.tempo).toBeLessThanOrEqual(advancedLoop.tempo);
      expect(beginnerLoop.repetitions).toBeGreaterThanOrEqual(advancedLoop.repetitions);
    });
  });

  describe('Chord Sheet Parsing', () => {
    it('should parse simple chord sheet', () => {
      const chordSheet = `
[Verse]
C G Am F

[Chorus]
C G Am F
      `;

      const sections = songSegmentationService.analyzeSong({
        title: 'Test',
        artist: 'Test',
        chordSheet,
        tempo: 120,
        key: 'C'
      }).sections;

      expect(sections).toHaveLength(2);
      expect(sections[0].type).toBe('verse');
      expect(sections[1].type).toBe('chorus');
      expect(sections[0].chords).toEqual(['C', 'G', 'Am', 'F']);
    });

    it('should handle complex chord progressions', () => {
      const chordSheet = `
[Intro]
Cmaj7 Dm7 Gm7 C7 Fmaj7

[Bridge]
Bb7 Eb7 Ab7 Db7 Gb7 B7
      `;

      const analysis = songSegmentationService.analyzeSong({
        title: 'Complex',
        artist: 'Test',
        chordSheet,
        tempo: 120,
        key: 'C'
      });

      expect(analysis.uniqueChords).toContain('Cmaj7');
      expect(analysis.uniqueChords).toContain('B7');
      expect(analysis.difficulty.harmonicComplexity).toBeGreaterThan(5);
    });

    it('should infer time signature', () => {
      const analysis = songSegmentationService.analyzeSong({
        title: 'Test',
        artist: 'Test',
        chordSheet: '[Verse]\nC G Am F',
        tempo: 120,
        key: 'C'
      });

      expect(analysis.timeSignature).toBeDefined();
      expect(['4/4', '3/4', '2/4', '6/8']).toContain(analysis.timeSignature);
    });
  });

  describe('Difficulty Assessment', () => {
    it('should assess harmonic difficulty', () => {
      // Simple song
      const simpleAnalysis = songSegmentationService.analyzeSong({
        title: 'Simple',
        artist: 'Test',
        chordSheet: '[Verse]\nC G Am F',
        tempo: 100,
        key: 'C'
      });

      // Complex song
      const complexAnalysis = songSegmentationService.analyzeSong({
        title: 'Complex',
        artist: 'Test',
        chordSheet: '[Verse]\nCmaj7 Dm7 Gm7 C7 Fmaj7 Bb7',
        tempo: 160,
        key: 'C'
      });

      expect(simpleAnalysis.difficulty.harmonicComplexity).toBeLessThan(
        complexAnalysis.difficulty.harmonicComplexity
      );
      expect(simpleAnalysis.difficulty.overall).toBeLessThan(
        complexAnalysis.difficulty.overall
      );
    });

    it('should consider tempo in difficulty', () => {
      const slowAnalysis = songSegmentationService.analyzeSong({
        title: 'Slow',
        artist: 'Test',
        chordSheet: '[Verse]\nC G Am F',
        tempo: 80,
        key: 'C'
      });

      const fastAnalysis = songSegmentationService.analyzeSong({
        title: 'Fast',
        artist: 'Test',
        chordSheet: '[Verse]\nC G Am F',
        tempo: 160,
        key: 'C'
      });

      expect(slowAnalysis.difficulty.rhythmicComplexity).toBeLessThan(
        fastAnalysis.difficulty.rhythmicComplexity
      );
    });
  });
});