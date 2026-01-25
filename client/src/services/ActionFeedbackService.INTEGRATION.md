# 🎯 Action Feedback Service - Guia de Integração

## Ações Cobertas

O `ActionFeedbackService` fornece feedback sonoro consistente para as seguintes ações:

1. **`button_click`** - Clique em botão genérico
   - Som: D4 (293.66 Hz), 80ms, volume 0.08
   - Uso: Botões de ação, navegação, seleção

2. **`training_start`** - Início de treino
   - Som: C4 → E4 (261.63 → 329.63 Hz), 100ms cada, volume 0.08
   - Uso: Quando um treino/exercício é iniciado

3. **`confirmation`** - Confirmação de escolha
   - Som: F5 (698.46 Hz), 100ms, volume 0.08
   - Uso: Confirmação de resposta, seleção, submit

4. **`step_progress`** - Avanço de etapa
   - Som: G4 (392.00 Hz), 120ms, volume 0.072
   - Uso: Avanço em onboarding, wizard, etapas de treino

## Função Centralizada de Disparo

### Importação

```typescript
import { actionFeedbackService } from '@/services/ActionFeedbackService';
// ou
import { useActionFeedback } from '@/hooks/useActionFeedback';
```

### Uso Direto

```typescript
// Disparo direto
await actionFeedbackService.playActionFeedback('button_click');
await actionFeedbackService.playActionFeedback('training_start');
await actionFeedbackService.playActionFeedback('confirmation');
await actionFeedbackService.playActionFeedback('step_progress');
```

### Uso com Hook

```typescript
function MyComponent() {
  const { playButtonClick, playTrainingStart, playConfirmation, playStepProgress } = useActionFeedback();
  
  const handleClick = () => {
    playButtonClick();
    // ... lógica do botão
  };
  
  const handleStart = () => {
    playTrainingStart();
    // ... lógica de início
  };
}
```

## Pontos de Integração

### 1. Clique em Botão

**Local:** Componentes que usam `Button` do `@/components/ui/button`

**Exemplo:**
```typescript
import { useActionFeedback } from '@/hooks/useActionFeedback';

function MyComponent() {
  const { playButtonClick } = useActionFeedback();
  
  return (
    <Button onClick={() => {
      playButtonClick();
      handleAction();
    }}>
      Ação
    </Button>
  );
}
```

**Ações cobertas:**
- Botões de navegação
- Botões de ação (salvar, deletar, etc.)
- Botões de seleção
- Botões de toggle

**NÃO tocar em:**
- Botões desabilitados (`disabled={true}`)
- Botões que não alteram estado
- Botões de cancelar/fechar (opcional)

### 2. Início de Treino

**Local:** Componentes de treino quando `handleStart` é chamado

**Exemplo:**
```typescript
import { useActionFeedback } from '@/hooks/useActionFeedback';

function RhythmTraining() {
  const { playTrainingStart } = useActionFeedback();
  
  const handleStart = async () => {
    playTrainingStart(); // Feedback sonoro
    // ... lógica de início
  };
}
```

**Componentes a integrar:**
- `RhythmTraining.tsx` - `handleStart`
- `ChordProgressionPractice.tsx` - `handleStart`
- `EnhancedChordPractice.tsx` - início de prática
- `EssentialIntervalTraining.tsx` - início de exercício
- `ActiveRhythmTraining.tsx` - `startListening`
- `AdaptiveExercise.tsx` - `handleStart`
- `MotorCoordinationExercises.tsx` - início de exercício

### 3. Confirmação de Escolha

**Local:** Quando usuário confirma uma escolha/resposta

**Exemplo:**
```typescript
import { useActionFeedback } from '@/hooks/useActionFeedback';

function QuizComponent() {
  const { playConfirmation } = useActionFeedback();
  
  const handleConfirm = () => {
    playConfirmation(); // Feedback sonoro
    // ... lógica de confirmação
  };
}
```

**Componentes a integrar:**
- `SpacedRepetitionReview.tsx` - `handleConfirm`
- `MajorMinorChordTraining.tsx` - `checkAnswer` (quando correto)
- `EssentialIntervalTraining.tsx` - `checkAnswer` (quando correto)
- `TheoryQuiz.tsx` - confirmação de resposta
- `CompetenceAssessment.tsx` - confirmação de resposta

### 4. Avanço de Etapa

**Local:** Quando usuário avança para próxima etapa/passo

**Exemplo:**
```typescript
import { useActionFeedback } from '@/hooks/useActionFeedback';

function OnboardingComponent() {
  const { playStepProgress } = useActionFeedback();
  
  const nextStep = () => {
    playStepProgress(); // Feedback sonoro
    // ... lógica de avanço
  };
}
```

**Componentes a integrar:**
- `HandsOnOnboarding.tsx` - `completeStep`
- `WelcomeTraining.tsx` - `completeStep`
- `GuidedSession.tsx` - `nextStep`
- `CompleteOnboarding.tsx` - avanço de etapa

## Garantia de Não Sobreposição

O serviço implementa prevenção automática de sobreposição:

- **Intervalo mínimo:** 50ms entre sons
- **Cache de AudioBus:** Reduz latência
- **Verificação de estado:** Só toca se AudioEngine estiver pronto
- **Fallback silencioso:** Falhas não interrompem o fluxo

## Sons Existentes (NÃO Duplicar)

### FeedbackSoundService
- `success` - C5 (523.25 Hz), 120ms
- `error_execution` - C3 (130.81 Hz), 150ms
- `error_timing` - A3 (220 Hz), 140ms

### GamificationSoundService
- `xp_gain` - E5 (659.25 Hz), 100ms
- `xp_bonus` - C5 + E5, 120ms cada
- `level_up` - C5-E5-G5 arpejo
- `achievement` - C5 (523.25 Hz), 180ms
- `mission_complete` - G4 + C5, 120ms cada
- `streak_milestone` - A4 (440 Hz), 150ms

### ActionFeedbackService (NOVO)
- `button_click` - D4 (293.66 Hz), 80ms
- `training_start` - C4 → E4, 100ms cada
- `confirmation` - F5 (698.46 Hz), 100ms
- `step_progress` - G4 (392.00 Hz), 120ms

## Checklist de Integração

- [ ] Importar `useActionFeedback` ou `actionFeedbackService`
- [ ] Adicionar chamada antes da ação (não depois)
- [ ] Verificar se ação é válida (não desabilitada)
- [ ] Não tocar em ações de cancelar/fechar (opcional)
- [ ] Testar que não há sobreposição com outros sons
- [ ] Verificar que volume está adequado

## Exemplo Completo

```typescript
import { useActionFeedback } from '@/hooks/useActionFeedback';

function TrainingComponent() {
  const { playTrainingStart, playStepProgress, playConfirmation } = useActionFeedback();
  
  const handleStart = async () => {
    if (isDisabled) return; // Não tocar se desabilitado
    
    playTrainingStart(); // Feedback sonoro
    setIsPlaying(true);
    // ... resto da lógica
  };
  
  const handleNextStep = () => {
    playStepProgress(); // Feedback sonoro
    setCurrentStep(prev => prev + 1);
  };
  
  const handleConfirm = () => {
    playConfirmation(); // Feedback sonoro
    submitAnswer();
  };
  
  return (
    <Button onClick={handleStart} disabled={isDisabled}>
      Iniciar
    </Button>
  );
}
```
