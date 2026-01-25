# 🎓 Refatoração: Sons de Erro Pedagógicos

## Resumo da Refatoração

Os sons de erro foram refatorados para serem **pedagógicos e informativos**, não punitivos. Agora usam **intervalos musicais ascendentes** que sugerem "ajuste" ou "tente novamente", em vez de notas graves que podem soar punitivas.

## Definição Clara: Som de Erro vs Som de Acerto

### ✅ Som de Acerto (`success`)
- **Padrão:** Nota única
- **Frequência:** C5 (523.25 Hz) - aguda e positiva
- **Duração:** 120ms
- **Volume:** 0.15 (padrão)
- **Mensagem:** "Correto! Continue assim!"

### 🎓 Som de Erro de Execução (`error_execution`)
- **Padrão:** Intervalo de quarta justa ascendente
- **Frequência:** D4 → G4 (293.66 → 392.00 Hz)
- **Duração:** 100ms + 50ms + 100ms (~250ms total)
- **Volume:** 0.075 (muito baixo, 50% do padrão)
- **Mensagem:** "Ajuste necessário - tente novamente"

### 🎓 Som de Erro de Tempo (`error_timing`)
- **Padrão:** Intervalo de terça menor ascendente
- **Frequência:** E4 → G4 (329.63 → 392.00 Hz)
- **Duração:** 90ms + 40ms + 90ms (~220ms total)
- **Volume:** 0.0825 (muito baixo, 55% do padrão)
- **Mensagem:** "Ajuste sutil de timing necessário"

## Justificativa Pedagógica

### 1. Intervalos Ascendentes Sugerem Correção

**Por que intervalos ascendentes?**
- O movimento ascendente sugere "ajuste para cima" ou "tente novamente"
- Não são estáticos como uma nota única grave
- Comunicam ação positiva, não punição

**Analogia Musical:**
- Intervalo de quarta (D4 → G4): Sugere movimento, progresso, ajuste
- Intervalo de terça menor (E4 → G4): Sugere ajuste sutil, sincronização

### 2. Não Punitivo

**Características que evitam punição:**
- ✅ Frequências intermediárias (D4, E4, G4) - não graves que podem soar punitivos
- ✅ Volume muito baixo (0.075-0.0825) - não causa stress auditivo
- ✅ Tom suave (sine wave) - não agressivo ou abrupto
- ✅ Duração curta (90-100ms por nota) - não prolonga desconforto

### 3. Informativo

**Como comunica informação:**
- ✅ Diferencia claramente de som de acerto (nota única vs intervalo)
- ✅ Comunica que há algo a ajustar, não que está "errado"
- ✅ Encora tentativa novamente
- ✅ Não causa frustração ou desencorajamento

### 4. Sem Stress Auditivo

**Garantias técnicas:**
- Volume muito baixo (50-55% do volume padrão)
- Duração curta (90-100ms por nota)
- Tom suave (sine wave, não square ou sawtooth)
- Frequências confortáveis (não graves, não muito agudas)

## Onde os Sons são Disparados

### `error_execution` - Erro de Execução

**1. EnhancedChordPractice.tsx** (linha ~374)
```typescript
// Quando acorde é tocado incorretamente
if (!correct) {
  feedbackSoundService.playFeedback('error_execution', 0.12);
  // Feedback visual: mensagem pedagógica explicando o erro
}
```

**Contexto:**
- Usuário tentou tocar acorde mas execução está incorreta
- Feedback visual mostra mensagem explicativa (ex: "Revise a posição dos dedos")
- Som sugere "ajuste e tente novamente"

**2. PracticeMode.tsx** (linha ~168)
```typescript
// Quando acorde é tocado incorretamente
if (!isCorrect) {
  feedbackSoundService.playFeedback('error_execution', 0.12);
  // Feedback visual: mensagens explicativas baseadas em tentativas
}
```

**Contexto:**
- Treino de acordes, execução incorreta
- Feedback visual mostra mensagens progressivas baseadas em tentativas
- Som sugere "ajuste e tente novamente"

### `error_timing` - Erro de Tempo

**1. ChordProgressionPractice.tsx** (linhas ~232, ~256)
```typescript
// Quando usuário troca acorde no tempo errado
if (timingDiff < 0) {
  // Adiantou
  feedbackSoundService.playFeedback('error_timing', 0.12);
} else {
  // Atrasou
  feedbackSoundService.playFeedback('error_timing', 0.12);
}
```

**Contexto:**
- Treino de progressão de acordes com metrônomo
- Usuário trocou acorde no tempo errado (adiantou ou atrasou)
- Feedback visual indica se adiantou ou atrasou e por quanto tempo
- Som sugere "ajuste sutil de timing"

## Comparação: Antes vs Depois

### Antes (Punitivo)
- ❌ `error_execution`: C3 (130.81 Hz) - nota grave, pode soar punitivo
- ❌ `error_timing`: A3 (220 Hz) - nota única, neutra mas não informativa
- ❌ Volume: 0.09-0.0975 (ainda baixo, mas frequência grave pode soar mal)
- ❌ Mensagem implícita: "Errado" (punitivo)

### Depois (Pedagógico)
- ✅ `error_execution`: D4 → G4 - intervalo ascendente, sugere ajuste
- ✅ `error_timing`: E4 → G4 - intervalo ascendente menor, sugere ajuste sutil
- ✅ Volume: 0.075-0.0825 (muito baixo, não causa stress)
- ✅ Mensagem implícita: "Ajuste necessário" (informativo e encorajador)

## Garantias de Implementação

1. **Não aumenta volume:** Volume reduzido de 0.09-0.0975 para 0.075-0.0825
2. **Não usa sons agressivos:** Sine wave suave, frequências intermediárias
3. **Não é abrupto:** Envelope suave, duração curta mas não cortada
4. **Claramente distinto:** Padrão de intervalo vs nota única do acerto
5. **Mantém compatibilidade:** Mesma API, mesmos pontos de disparo

## Resultado Final

- ✅ Sons de erro são **pedagógicos e informativos**
- ✅ Sugerem **ajuste e tentativa novamente**
- ✅ **Não causam stress auditivo**
- ✅ **Claramente distintos** do som de acerto
- ✅ **Encora o aprendizado** em vez de desencorajar
