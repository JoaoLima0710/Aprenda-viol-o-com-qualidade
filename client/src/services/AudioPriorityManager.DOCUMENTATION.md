# 🎚️ Audio Priority Manager - Hierarquia Sonora

## Definição de Prioridades

### Hierarquia (maior = mais prioridade)

1. **Treino (`training`)** - Prioridade 4 (MÁXIMA)
   - Sons de feedback durante exercícios práticos
   - Sons de acordes/notas durante treino
   - FeedbackSoundService (success, error_execution, error_timing)
   - Sons de metrônomo durante treino
   - **Regra:** Sempre toca, nunca é bloqueado

2. **Percepção Auditiva (`auditory_perception`)** - Prioridade 3
   - Exercícios de ear training
   - Intervalos, acordes, melodias
   - ShortTermMemoryTraining
   - EssentialIntervalTraining
   - ActiveAuditoryPerception
   - **Regra:** Não compete com treino, mas bloqueia interface

3. **Teoria Musical (`music_theory`)** - Prioridade 2
   - Exemplos sonoros em teoria
   - IntervalTheory
   - Sons explicativos
   - **Regra:** Permite pausa e repetição manual, bloqueada por treino

4. **Interface/Gamificação (`interface`)** - Prioridade 1 (MÍNIMA)
   - ActionFeedbackService (button_click, training_start, etc.)
   - GamificationSoundService (xp_gain, level_up, etc.)
   - **Regra:** Nunca compete com sons pedagógicos, sempre bloqueada durante treino

## Regras de Priorização

### Regra 1: Sons de Treino Sempre Tocam
```typescript
if (requestedContext === 'training') {
  return true; // Sempre permite
}
```

### Regra 2: Interface Nunca Compete com Pedagógicos
```typescript
if (requestedContext === 'interface') {
  // Bloquear se há treino ativo
  if (isTrainingActive) return false;
  // Bloquear se há percepção auditiva ativa
  if (currentContext === 'auditory_perception') return false;
  // Permitir durante teoria
  return true;
}
```

### Regra 3: Percepção Auditiva Não Compete com Treino
```typescript
if (requestedContext === 'auditory_perception') {
  // Bloquear se há treino ativo
  if (isTrainingActive) return false;
  // Permitir se não há contexto ou se é teoria/interface
  return true;
}
```

### Regra 4: Teoria Permite Pausa Manual
```typescript
if (requestedContext === 'music_theory') {
  // Se teoria está tocando, pode ser pausada manualmente
  if (isTheoryPlaying && currentContext === 'music_theory') {
    return true; // Permite pausa
  }
  // Bloquear se há treino ativo
  if (isTrainingActive) return false;
  // Permitir se não há contexto ou se é interface
  return true;
}
```

## Onde Cada Contexto é Definido

### `training` - Treino
**Componentes que definem:**
- `EnhancedChordPractice.tsx` - ao iniciar treino
- `PracticeMode.tsx` - ao iniciar treino
- `RhythmTraining.tsx` - ao iniciar treino
- `ChordProgressionPractice.tsx` - ao iniciar treino
- `GuidedSession.tsx` - durante sessão guiada

**Sons que usam:**
- `FeedbackSoundService` - success, error_execution, error_timing
- Sons de acordes durante treino
- Metrônomo durante treino

### `auditory_perception` - Percepção Auditiva
**Componentes que definem:**
- `EarTraining.tsx` - ao iniciar exercício
- `ShortTermMemoryTraining.tsx` - ao iniciar exercício
- `EssentialIntervalTraining.tsx` - ao iniciar exercício
- `ActiveAuditoryPerception.tsx` - ao iniciar exercício
- `ContextualEarTraining.tsx` - ao iniciar exercício

**Sons que usam:**
- Notas, intervalos, acordes de exercícios
- Sequências de memória auditiva

### `music_theory` - Teoria Musical
**Componentes que definem:**
- `IntervalTheory.tsx` - ao tocar exemplo
- Componentes de teoria com botões play/pause/repeat

**Sons que usam:**
- Exemplos sonoros de teoria
- Intervalos explicativos
- Acordes explicativos

### `interface` - Interface/Gamificação
**Componentes que usam (não definem contexto):**
- `ActionFeedbackService` - button_click, training_start, confirmation, step_progress
- `GamificationSoundService` - xp_gain, level_up, achievement, etc.

**Regra:** Nunca define contexto, apenas consulta antes de tocar

## Integração com Serviços Existentes

### FeedbackSoundService
```typescript
// Antes de tocar feedback
if (!audioPriorityManager.canPlaySound('training')) {
  return; // Bloqueia se não pode tocar
}
```

### ActionFeedbackService
```typescript
// Antes de tocar feedback de ação
if (!audioPriorityManager.canPlaySound('interface')) {
  return; // Bloqueia se treino está ativo
}
```

### GamificationSoundService
```typescript
// Antes de tocar som de gamificação
if (!audioPriorityManager.canPlaySound('interface')) {
  return; // Bloqueia se treino está ativo
}
```

## Exemplos de Uso

### Exemplo 1: Treino Bloqueia Gamificação
```typescript
// Durante treino de acordes
audioPriorityManager.setContext('training');

// Tentativa de tocar som de XP
if (audioPriorityManager.canPlaySound('interface')) {
  gamificationSoundService.playSound('xp_gain');
} else {
  // Bloqueado - não toca
}
```

### Exemplo 2: Percepção Auditiva Bloqueia Interface
```typescript
// Durante exercício de intervalos
audioPriorityManager.setContext('auditory_perception');

// Tentativa de tocar som de botão
if (audioPriorityManager.canPlaySound('interface')) {
  actionFeedbackService.playActionFeedback('button_click');
} else {
  // Bloqueado - não toca
}
```

### Exemplo 3: Teoria Permite Pausa Manual
```typescript
// Durante exemplo de teoria
audioPriorityManager.setContext('music_theory');
audioPriorityManager.setTheoryPlaying(true);

// Usuário clica em pausa
audioPriorityManager.setTheoryPlaying(false);
// Som pode ser pausado manualmente
```

## Garantias

1. ✅ **Sons de treino sempre tocam** - Prioridade máxima
2. ✅ **Sons de UI nunca competem com pedagógicos** - Bloqueados durante treino/percepção
3. ✅ **Teoria permite pausa manual** - Flag `isTheoryPlaying` controla
4. ✅ **Gamificação nunca interrompe aprendizado** - Bloqueada durante treino/percepção
5. ✅ **Não cria múltiplos AudioContexts** - Apenas gerencia prioridade
6. ✅ **Não reescreve sistema atual** - Apenas adiciona camada de consulta

## Fluxo de Decisão

```
Som quer tocar
    ↓
Verifica contexto atual
    ↓
Consulta prioridade
    ↓
Treino? → Sempre permite
Interface? → Bloqueia se treino/percepção ativo
Percepção? → Bloqueia se treino ativo
Teoria? → Permite pausa manual, bloqueia se treino ativo
    ↓
Toca ou bloqueia
```
