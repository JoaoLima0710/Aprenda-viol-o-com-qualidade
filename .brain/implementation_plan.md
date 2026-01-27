# Implementation Plan - Training & Theory Refactoring

# Goal Description
Refactor the `Practice` and `Theory` sections to reduce code duplication (approx. 40% reduction expected in main files), improve component organization, and separate content from presentation. This will create a solid foundation for adding new modules and features.

## User Review Required
> [!IMPORTANT]
> **Breaking Changes**: This refactor involves moving many files. I will update all imports, but please ensure no other branches are actively modifying `client/src/components/practice` to avoid merge conflicts.

## Proposed Changes

### Phase 0: Audio System Audit & Fixes (Completed)
Comprehensive audit and repair of the audio playback system to resolve "missing sound" issues.

#### [MODIFY] [UnifiedAudioService.ts](file:///Users/joao/.gemini/antigravity/scratch/tutor-music/client/src/services/UnifiedAudioService.ts)
-   Implemented `playSimpleFallback` in `AudioResilienceService`.
-   Fixed typos in `mobileOptimizations` config.
-   Corrected type casting for `setInstrument`.
-   Ensured `markUserInteraction` resume logic is robust.

#### [MODIFY] [Audio Buttons](file:///Users/joao/.gemini/antigravity/scratch/tutor-music/client/src/components/audio/AudioPlayChordButton.tsx)
-   **Critical Fix**: Unconditionally await `markUserInteraction()` on click to satisfy Chrome Autoplay Policy.
-   Applied same fix to `AudioPlayScaleButton.tsx` and `ScaleBuilder.tsx`.

### Phase 1: Layout Unification & deduplication
Create a shared layout component to handle the responsive Sidebar/MobileNav logic, which is currently duplicated in every page.

#### [NEW] [PageLayout.tsx](file:///Users/joao/.gemini/antigravity/scratch/tutor-music/client/src/components/layout/PageLayout.tsx)
-   Wraps `Sidebar`, `MobileSidebar`, `MobileHeader`, `MobileBottomNav`.
-   Accepts `children` (desktop) and `mobileChildren` (optional, if distinct) or uses `children` for both with responsive classes.

#### [MODIFY] [Practice.tsx](file:///Users/joao/.gemini/antigravity/scratch/tutor-music/client/src/pages/Practice.tsx)
-   Refactor to use `PageLayout`.
-   Remove manual specific Mobile/Desktop `div` blocks where possible.

#### [MODIFY] [Theory.tsx](file:///Users/joao/.gemini/antigravity/scratch/tutor-music/client/src/pages/Theory.tsx)
-   Refactor to use `PageLayout`.

### Phase 2: Component Organization & Renaming
Clean up the flat `components/practice` directory.

#### [MOVE] Directory Restructuring
-   `client/src/components/practice/`
    -   `rhythm/` <- `Metronome.tsx`, `RhythmTraining.tsx`, `ActiveRhythmTraining.tsx`
    -   `ear/` <- `EarTraining.tsx`, `IntervalTraining.tsx`, `PitchDetector.tsx`
    -   `chords/` <- `ChordPractice.tsx`, `ChordBuilder.tsx` (if movable)
    -   `tools/` <- `Tuner.tsx`, `SpectrumVisualizer.tsx`

#### [RENAME] Component Renaming
-   `RhythmTraining.tsx` -> `RhythmTimingPractice.tsx` (execution focus)
-   `ActiveRhythmTraining.tsx` -> `RhythmListeningPractice.tsx` (perception focus)

### Phase 3: Content Extraction (Theory)
Decouple content from the view component.

#### [NEW] [theory-modules.tsx](file:///Users/joao/.gemini/antigravity/scratch/tutor-music/client/src/data/theory-modules.tsx)
-   Move `THEORY_MODULES` constant here.
-   Ensure context-aware content functions are preserved.

## Verification Plan

### Automated Tests
-   `npm run build` to ensure all path updates are correct.
-   Static analysis to check for unused imports after moves.

### Manual Verification
1.  **Layout Check**: Verify `Sidebar` and `MobileNav` work correctly on `/practice` and `/theory`.
2.  **Route Check**: Verify all practice tools load from their new paths.
3.  **Regression Check**: Verify `Theory` modules still load correct content (using the fixes from the previous session).
