# 🔄 Audio Lifecycle Manager - Documentação

## Implementação

Sistema robusto de gerenciamento de ciclo de vida do áudio para garantir retomada previsível após interrupções.

## Mapeamento de Estados

### Estados Auditivos

| Estado | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| `idle` | Nenhum áudio ativo | Inicial ou após reset |
| `playing` | Áudio tocando normalmente | Treino/exercício ativo |
| `paused` | Áudio pausado pelo usuário | Usuário clicou em pausar |
| `suspended` | Áudio suspenso | App minimizado/aba trocada |
| `stopped` | Áudio parado | Navegação ou fim de sessão |

### Contextos Auditivos

| Contexto | Descrição | Prioridade |
|----------|-----------|------------|
| `none` | Sem contexto | - |
| `training` | Treino ativo | Máxima |
| `auditory_perception` | Percepção auditiva | Alta |
| `music_theory` | Teoria musical | Média |
| `interface` | Interface/gamificação | Baixa |

## Solução Robusta para Lifecycle

### Fluxo de Estados

```
idle
  ↓ (startSession)
playing
  ↓ (pauseSession)
paused
  ↓ (suspendSession)
suspended
  ↓ (resumeSession - se válido)
playing/paused
  ↓ (stopSession)
stopped
  ↓ (reset)
idle
```

### Regras de Retomada

**Pode retomar se:**
1. ✅ Estado atual é `suspended`
2. ✅ Sessão foi iniciada pelo usuário (`wasUserInitiated === true`)
3. ✅ Há estado anterior válido (`previousState !== null`)
4. ✅ Retomada foi iniciada pelo usuário (`userInitiated === true`)
5. ✅ Componente que iniciou ainda é o mesmo (`componentId` corresponde)

**Não retoma se:**
- ❌ Estado não é `suspended`
- ❌ Sessão não foi iniciada pelo usuário
- ❌ Não há estado anterior válido
- ❌ Retomada não foi iniciada pelo usuário
- ❌ Componente mudou (navegação)

### Cenários de Uso

#### 1. Minimizar App

```
Usuário inicia treino
  ↓
startSession('training', 'RhythmTraining', true)
  ↓
Estado: playing
  ↓
App minimizado (visibilitychange)
  ↓
suspendSession()
  ↓
Estado: suspended (previousState: 'playing')
  ↓
App volta ao foco
  ↓
Usuário clica em retomar
  ↓
resumeSession(true)
  ↓
Estado: playing (retomado)
```

#### 2. Trocar de Aba

```
Usuário inicia treino
  ↓
startSession('training', 'RhythmTraining', true)
  ↓
Estado: playing
  ↓
Troca de aba (document.hidden = true)
  ↓
suspendSession()
  ↓
Estado: suspended
  ↓
Volta para aba
  ↓
Usuário clica em retomar
  ↓
resumeSession(true)
  ↓
Estado: playing (retomado)
```

#### 3. Pausar Treino

```
Usuário inicia treino
  ↓
startSession('training', 'RhythmTraining', true)
  ↓
Estado: playing
  ↓
Usuário clica em pausar
  ↓
pauseSession()
  ↓
Estado: paused (previousState: 'playing')
  ↓
Usuário clica em retomar
  ↓
resumeSession(true) - NÃO funciona (estado não é suspended)
  ↓
Usuário precisa iniciar novamente ou componente gerencia retomada
```

#### 4. Retornar à Tela Anterior

```
Usuário inicia treino
  ↓
startSession('training', 'RhythmTraining', true)
  ↓
Estado: playing
  ↓
Navegação (mudança de rota)
  ↓
stopSession()
  ↓
Estado: stopped
  ↓
Volta para tela de treino
  ↓
Nova sessão precisa ser iniciada (não retoma automaticamente)
```

## Pontos de Integração

### 1. Componentes de Treino

**Localização:** `client/src/components/practice/*.tsx`

**Ao iniciar:**
```typescript
const { audioLifecycleManager } = await import('@/services/AudioLifecycleManager');
audioLifecycleManager.startSession('training', 'RhythmTraining', true);
```

**Ao pausar:**
```typescript
audioLifecycleManager.pauseSession();
```

**Ao retomar (se necessário):**
```typescript
const { useAudioResume } = await import('@/hooks/useAudioResume');
const { canResume, resume } = useAudioResume('RhythmTraining', () => {
  // Callback quando retomado
  metronomeService.start(bpm, '4/4');
});
```

### 2. useAudioNavigationGuard

**Localização:** `client/src/hooks/useAudioNavigationGuard.ts`

**Ao trocar de rota:**
```typescript
audioLifecycleManager.stopSession();
```

**Ao esconder app:**
```typescript
audioLifecycleManager.suspendSession();
```

### 3. useAudioResume Hook

**Localização:** `client/src/hooks/useAudioResume.ts`

**Uso:**
```typescript
const { canResume, audioState, resume } = useAudioResume('RhythmTraining', () => {
  // Retomar metrônomo, etc.
});

// Em botão de retomar
<Button onClick={() => resume(true)} disabled={!canResume}>
  Retomar
</Button>
```

## Garantias

### 1. Não Toca Áudio Inesperado
- ✅ Retoma apenas se usuário iniciou antes
- ✅ Retoma apenas se usuário clica explicitamente
- ✅ Não retoma automaticamente ao voltar ao app

### 2. Retoma Apenas se Usuário Iniciou Antes
- ✅ `wasUserInitiated` deve ser `true`
- ✅ Verificação em `resumeSession()`

### 3. Estado Auditivo Consistente
- ✅ Estados claros e mapeados
- ✅ Transições previsíveis
- ✅ Rastreamento de contexto

## Resultado

- ✅ Mapeamento de estados completo
- ✅ Solução robusta para lifecycle
- ✅ Retomada previsível e segura
- ✅ Não toca áudio inesperado
- ✅ Retoma apenas se usuário iniciou antes
- ✅ Estado auditivo consistente
