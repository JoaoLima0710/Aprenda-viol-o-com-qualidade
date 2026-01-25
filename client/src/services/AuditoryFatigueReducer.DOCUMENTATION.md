# 🎧 Auditory Fatigue Reducer - Redução de Fadiga Auditiva

## Implementação

Sistema para reduzir fadiga auditiva em sessões longas através de microvariações controladas e pausas naturais.

## Critério de Variação

### Microvariação Controlada

**Quando aplica:**
- Após 5 repetições idênticas do mesmo som
- Variação determinística (não aleatória)
- Baseada em hash do soundId + contador

**Tipos de Variação:**
1. **Pitch (Frequência):** ±15 cents (microvariação imperceptível como mudança de nota)
2. **Volume:** ±5% (variação sutil)
3. **Timing:** ±30ms (variação de início)

**Características:**
- ✅ Determinística: mesmo som sempre produz mesma variação
- ✅ Previsível: não randomiza de forma caótica
- ✅ Não altera timbre base: apenas microvariações
- ✅ Mantém identidade do som: ainda é reconhecível

### Pausas Auditivas Naturais

**Quando aplica:**
- Após 8 repetições do mesmo som
- Duração: 2 segundos de silêncio
- Reset contador após pausa

**Características:**
- ✅ Pausa natural: não abrupta
- ✅ Reset automático: contador volta a zero após pausa
- ✅ Prevenção de sobrecarga: evita fadiga auditiva

### Limite de Repetição Idêntica

**Configuração:**
- Máximo 5 repetições idênticas antes de aplicar variação
- Após 8 repetições, insere pausa de 2 segundos

**Garantias:**
- ✅ Mantém previsibilidade: primeiras 5 repetições são idênticas
- ✅ Reduz fadiga: variação após limite
- ✅ Pausa natural: evita sobrecarga auditiva

## Pontos de Aplicação

### 1. FeedbackSoundService

**Localização:** `client/src/services/FeedbackSoundService.ts`

**Sons afetados:**
- `success` - Som de sucesso
- `error_execution` - Som de erro de execução
- `error_timing` - Som de erro de tempo

**Como aplica:**
- Identificador: `feedback-${type}`
- Aplica variação de pitch, volume e timing
- Mantém intervalo relativo (para intervalos)

**Código:**
```typescript
const soundId = `feedback-${type}`;
const variation = auditoryFatigueReducer.getVariation(soundId);

if (variation === null) {
  return; // Pausa auditiva
}

// Aplicar variações
const variedFrequency = auditoryFatigueReducer.applyPitchVariation(baseFrequency, variation);
const variedVolume = auditoryFatigueReducer.applyVolumeVariation(clampedVolume, variation);
const timingDelay = Math.max(0, variation.timingVariation);
```

### 2. UnifiedAudioService.playChord

**Localização:** `client/src/services/UnifiedAudioService.ts`

**Sons afetados:**
- Todos os acordes tocados repetidamente
- Ex: `chord-C`, `chord-Dm`, etc.

**Como aplica:**
- Identificador: `chord-${chordName}`
- Aplica apenas variação de timing (não pitch - manter acorde correto)
- Volume seria aplicado se playChord aceitasse parâmetro de volume

**Código:**
```typescript
const soundId = `chord-${chordName}`;
const variation = auditoryFatigueReducer.getVariation(soundId);

if (variation === null) {
  return false; // Pausa auditiva
}

const timingDelay = Math.max(0, variation.timingVariation);
if (timingDelay > 0) {
  await new Promise(resolve => setTimeout(resolve, timingDelay));
}
```

### 3. UnifiedAudioService.playNote

**Localização:** `client/src/services/UnifiedAudioService.ts`

**Sons afetados:**
- Todas as notas tocadas repetidamente
- Ex: `note-C4`, `note-D4`, etc.

**Como aplica:**
- Identificador: `note-${note}`
- Aplica apenas variação de timing (microvariação de pitch seria aplicada no serviço de áudio)
- Mantém timbre base da nota

**Código:**
```typescript
const soundId = `note-${note}`;
const variation = auditoryFatigueReducer.getVariation(soundId);

if (variation === null) {
  return false; // Pausa auditiva
}

const timingDelay = Math.max(0, variation.timingVariation);
if (timingDelay > 0) {
  await new Promise(resolve => setTimeout(resolve, timingDelay));
}
```

## Exemplos de Uso

### Exemplo 1: Feedback Repetido

```
Usuário erra acorde 6 vezes seguidas
    ↓
FeedbackSoundService.playFeedback('error_execution')
    ↓
Repetição 1-5: Som idêntico (D4 → G4)
    ↓
Repetição 6: Microvariação aplicada
    - Pitch: D4 + 8 cents → G4 + 8 cents (mantém intervalo)
    - Volume: 0.075 → 0.071 (redução de 5%)
    - Timing: +15ms delay
    ↓
Repetição 7: Nova microvariação
    - Pitch: D4 - 12 cents → G4 - 12 cents
    - Volume: 0.075 → 0.079 (aumento de 5%)
    - Timing: -20ms delay
    ↓
Repetição 8: Pausa de 2 segundos
    ↓
Repetição 9: Reset contador, som idêntico novamente
```

### Exemplo 2: Acorde Repetido

```
Usuário toca acorde C 10 vezes seguidas
    ↓
Repetições 1-5: Acorde C idêntico
    ↓
Repetições 6-8: Acorde C com variação de timing (±30ms)
    ↓
Repetição 9: Pausa de 2 segundos
    ↓
Repetição 10: Reset contador, acorde C idêntico novamente
```

## Garantias

### 1. Não Randomiza de Forma Caótica
- ✅ Variação determinística baseada em hash
- ✅ Mesmo som sempre produz mesma variação
- ✅ Previsível e consistente

### 2. Não Altera Timbre Base
- ✅ Microvariação de pitch (±15 cents) - imperceptível como mudança de nota
- ✅ Mantém identidade do som
- ✅ Acordes mantêm intervalos relativos

### 3. Mantém Previsibilidade
- ✅ Primeiras 5 repetições são idênticas
- ✅ Variação aplicada apenas após limite
- ✅ Pausa previsível após 8 repetições

### 4. Reduz Fadiga Auditiva
- ✅ Microvariações evitam monotonia
- ✅ Pausas naturais previnem sobrecarga
- ✅ Limite de repetição idêntica

## Resultado

- ✅ Microvariação controlada de sons repetidos
- ✅ Pausas auditivas naturais
- ✅ Limite de repetição idêntica
- ✅ Mantém previsibilidade
- ✅ Não randomiza de forma caótica
- ✅ Não altera timbre base
