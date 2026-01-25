# 🎓 Feedback Sound Service - Sons Pedagógicos

## Definição: Som de Erro vs Som de Acerto

### Som de Acerto (`success`)
- **Frequência:** C5 (523.25 Hz) - nota única aguda
- **Duração:** 120ms
- **Volume:** 0.15 (padrão)
- **Característica:** Nota única, aguda, positiva, clara
- **Mensagem implícita:** "Correto! Continue assim!"

### Som de Erro de Execução (`error_execution`)
- **Frequência:** D4 → G4 (293.66 → 392.00 Hz) - intervalo de quarta justa ascendente
- **Duração:** 100ms cada nota, 50ms entre notas (total ~250ms)
- **Volume:** 0.075 (muito baixo)
- **Característica:** Intervalo ascendente, movimento suave, informativo
- **Mensagem implícita:** "Ajuste necessário - tente novamente"

### Som de Erro de Tempo (`error_timing`)
- **Frequência:** E4 → G4 (329.63 → 392.00 Hz) - intervalo de terça menor ascendente
- **Duração:** 90ms cada nota, 40ms entre notas (total ~220ms)
- **Volume:** 0.0825 (muito baixo)
- **Característica:** Intervalo ascendente menor, movimento sutil, informativo
- **Mensagem implícita:** "Ajuste sutil de timing necessário"

## Justificativa Pedagógica

### Por que intervalos ascendentes?

1. **Sugestão de Movimento:**
   - Intervalos ascendentes sugerem "ajuste para cima" ou "tente novamente"
   - Não são estáticos como uma nota única grave
   - Comunicam ação, não punição

2. **Não Punitivo:**
   - Frequências intermediárias (D4, E4, G4) - não graves que podem soar punitivos
   - Volume muito baixo (0.075-0.0825) - não causa stress auditivo
   - Tom suave (sine wave) - não agressivo

3. **Informativo:**
   - Diferencia claramente de som de acerto (nota única aguda vs intervalo)
   - Comunica que há algo a ajustar, não que está "errado"
   - Encora a tentativa novamente

4. **Sem Stress Auditivo:**
   - Volume muito baixo (50-55% do volume padrão)
   - Duração curta (90-100ms por nota)
   - Tom suave (sine wave)
   - Não causa desconforto mesmo com repetições

### Diferença Clara entre Erro e Acerto

| Característica | Acerto | Erro de Execução | Erro de Tempo |
|----------------|--------|------------------|---------------|
| **Padrão** | Nota única | Intervalo ascendente | Intervalo ascendente menor |
| **Frequência** | C5 (523.25 Hz) | D4 → G4 (293.66 → 392.00 Hz) | E4 → G4 (329.63 → 392.00 Hz) |
| **Duração** | 120ms | 100ms + 50ms + 100ms (~250ms) | 90ms + 40ms + 90ms (~220ms) |
| **Volume** | 0.15 | 0.075 | 0.0825 |
| **Tom** | Agudo, positivo | Intermediário, informativo | Intermediário, sutil |
| **Mensagem** | "Correto!" | "Ajuste necessário" | "Ajuste sutil de timing" |

## Onde os Sons são Disparados

### `error_execution` - Erro de Execução

**Componentes:**
1. **`EnhancedChordPractice.tsx`** (linha ~374)
   - Quando: Acorde é tocado incorretamente
   - Contexto: Usuário tentou tocar acorde mas execução está incorreta
   - Feedback visual: Mensagem pedagógica explicando o erro
   - Som: Intervalo D4 → G4 sugere "ajuste e tente novamente"

2. **`PracticeMode.tsx`** (linha ~168)
   - Quando: Acorde é tocado incorretamente
   - Contexto: Treino de acordes, execução incorreta
   - Feedback visual: Mensagens explicativas baseadas em tentativas
   - Som: Intervalo D4 → G4 sugere "ajuste e tente novamente"

### `error_timing` - Erro de Tempo

**Componentes:**
1. **`ChordProgressionPractice.tsx`** (linhas ~232, ~256)
   - Quando: Usuário troca acorde no tempo errado (adiantou ou atrasou)
   - Contexto: Treino de progressão de acordes com metrônomo
   - Feedback visual: Mensagem indicando se adiantou ou atrasou
   - Som: Intervalo E4 → G4 sugere "ajuste sutil de timing"

## Comparação com Sons Existentes

### Não Duplica Sons de:
- **GamificationSoundService:** Sons de recompensa (XP, level up, achievements)
- **ActionFeedbackService:** Sons de ações (button_click, training_start, etc.)
- **Ritual de Ativação:** Som único de confirmação de sistema

### Mantém Consistência com:
- **Volume baixo:** Todos os feedbacks usam volume baixo (0.08-0.15)
- **Duração curta:** Todos os sons são curtos (<300ms)
- **Tom suave:** Todos usam sine wave para suavidade
- **Canal effects:** Todos usam canal 'effects' para não interferir

## Garantias de Não Stress Auditivo

1. **Volume Muito Baixo:**
   - Erro de execução: 0.075 (50% do volume padrão)
   - Erro de tempo: 0.0825 (55% do volume padrão)
   - Nunca excede 0.1 mesmo com volume máximo

2. **Duração Curta:**
   - Cada nota: 90-100ms
   - Total: ~220-250ms
   - Não prolonga desconforto

3. **Tom Suave:**
   - Sine wave (não square ou sawtooth)
   - Frequências intermediárias (não graves)
   - Envelope suave (sem ataque abrupto)

4. **Prevenção de Repetição:**
   - Rate limiting no ActionFeedbackService (50ms mínimo)
   - FeedbackSoundService não tem rate limiting próprio, mas volume baixo previne sobrecarga

## Exemplo de Uso

```typescript
// Quando acorde é tocado incorretamente
if (!isCorrect) {
  // Feedback sonoro pedagógico: sugere ajuste, não punição
  feedbackSoundService.playFeedback('error_execution', 0.12);
  
  // Feedback visual explicativo
  setFeedbackMessage('Revise a posição dos dedos...');
}
```

## Resultado Esperado

- ✅ Usuário ouve som informativo, não punitivo
- ✅ Som sugere "ajuste" em vez de "erro"
- ✅ Não causa stress auditivo mesmo com repetições
- ✅ Claramente distinto do som de acerto
- ✅ Encora tentativa novamente
