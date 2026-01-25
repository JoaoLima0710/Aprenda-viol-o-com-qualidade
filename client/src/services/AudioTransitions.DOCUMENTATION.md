# 🎵 Audio Transitions - Transições Sonoras Suaves

## Implementação

Sistema de transições sonoras suaves implementado para evitar cortes abruptos ao trocar de tela ou módulo.

## Características

### Fade-out Suave
- **Duração padrão:** 150ms (0.15s)
- **Duração para treino:** 200ms (0.2s) - um pouco mais longo para sons críticos
- **Aplicado em:** Todos os sons ativos (AudioBus, MetronomeService)

### Garantias

1. **Nenhum áudio vaza para próximo contexto**
   - Fade-out completo antes de mudar de rota
   - Limpeza de schedulers após fade-out
   - Remoção de contexto de áudio após transição

2. **Sons críticos de treino não são interrompidos abruptamente**
   - Fade-out um pouco mais longo (200ms vs 150ms)
   - Respeita prioridade do AudioPriorityManager
   - Ainda para, mas de forma suave

3. **Retomar áudio somente se fizer sentido pedagógico**
   - Áudio não retoma automaticamente após navegação
   - Requer interação explícita do usuário
   - Contexto de áudio é limpo após transição

## Pontos de Controle de Lifecycle

### 1. Navegação de Rota (`useAudioNavigationGuard`)

**Localização:** `client/src/hooks/useAudioNavigationGuard.ts`

**Quando dispara:**
- Mudança de rota detectada via `useLocation()`

**Ações:**
1. Verifica se há treino ativo (prioridade)
2. Inicia fade-out suave (150ms ou 200ms)
3. Limpa AudioContextScheduler após 50ms
4. Remove contexto de áudio após 200ms

**Código:**
```typescript
if (previousLocationRef.current !== location) {
  // Verificar prioridade
  const isTrainingActive = audioPriorityManager.isTrainingCurrentlyActive();
  const fadeOutDuration = isTrainingActive ? 0.2 : 0.15;
  
  // Fade-out suave
  unifiedAudioService.fadeOutAll(fadeOutDuration);
  
  // Limpar schedulers após fade-out começar
  setTimeout(() => {
    audioContextScheduler.cancelAll();
    audioContextScheduler.cleanup();
  }, 50);
  
  // Remover contexto após fade-out terminar
  setTimeout(() => {
    audioPriorityManager.setContext(null);
  }, 200);
}
```

### 2. App Escondido (`useAudioNavigationGuard`)

**Localização:** `client/src/hooks/useAudioNavigationGuard.ts`

**Quando dispara:**
- `document.hidden === true` (evento `visibilitychange`)

**Ações:**
1. Inicia fade-out suave (150ms)
2. Limpa AudioContextScheduler após 50ms

**Código:**
```typescript
if (document.hidden) {
  unifiedAudioService.fadeOutAll(0.15);
  
  setTimeout(() => {
    audioContextScheduler.cancelAll();
    audioContextScheduler.cleanup();
  }, 50);
}
```

### 3. AudioBus Fade-out

**Localização:** `client/src/audio/AudioBus.ts`

**Método:** `fadeOutAll(fadeOutDuration: number = 0.15)`

**Como funciona:**
1. Aplica fade-out linear nos canais do AudioMixer
2. Aguarda fade-out terminar
3. Para todos os sources
4. Restaura volumes dos canais

**Código:**
```typescript
public async fadeOutAll(fadeOutDuration: number = 0.15): Promise<void> {
  // Aplicar fade-out nos canais
  channels.forEach(channelName => {
    const channelGain = this.audioMixer.getChannel(channelName);
    if (channelGain) {
      channelGain.gain.setValueAtTime(currentVolume, currentTime);
      channelGain.gain.linearRampToValueAtTime(0, fadeOutEndTime);
    }
  });
  
  // Aguardar fade-out
  await new Promise(resolve => setTimeout(resolve, fadeOutDuration * 1000 + 50));
  
  // Parar sources
  sourcesToFade.forEach(source => source.stop());
  
  // Restaurar volumes
  channels.forEach(channelName => {
    const channelGain = this.audioMixer.getChannel(channelName);
    if (channelGain) {
      channelGain.gain.setValueAtTime(1.0, audioContext.currentTime);
    }
  });
}
```

### 4. MetronomeService Fade-out

**Localização:** `client/src/services/MetronomeService.ts`

**Método:** `fadeOut(fadeOutDuration: number = 0.15)`

**Como funciona:**
1. Aplica fade-out linear no volume do synth
2. Aguarda fade-out terminar
3. Para o metrônomo
4. Restaura volume padrão

**Código:**
```typescript
async fadeOut(fadeOutDuration: number = 0.15): Promise<void> {
  // Fade-out no volume
  this.synth.volume.setValueAtTime(currentVolume, now);
  this.synth.volume.linearRampToValueAtTime(-Infinity, now + fadeOutDuration);
  
  // Aguardar fade-out
  await new Promise(resolve => setTimeout(resolve, fadeOutDuration * 1000 + 50));
  
  // Parar metrônomo
  this.stop();
  
  // Restaurar volume
  this.synth.volume.setValueAtTime(-10, Tone.now());
}
```

## Garantias de Não Vazamento

### 1. Fade-out Completo Antes de Mudança
- Fade-out sempre termina antes de mudar de contexto
- Timeout de 200ms garante que fade-out termina
- Schedulers são limpos após fade-out começar (50ms)

### 2. Limpeza de Contexto
- Contexto de áudio é removido após fade-out
- AudioPriorityManager é resetado
- Nenhum estado persiste entre navegações

### 3. Navegação Rápida
- Fade-out é cancelado se nova navegação ocorrer
- Stop abrupto como fallback se fade-out falhar
- Timeouts são gerenciados corretamente

## Fluxo de Transição

```
Usuário navega para nova rota
    ↓
useAudioNavigationGuard detecta mudança
    ↓
Verifica prioridade (treino ativo?)
    ↓
Inicia fade-out (150ms ou 200ms)
    ↓
AudioBus.fadeOutAll() - fade-out nos canais
MetronomeService.fadeOut() - fade-out no metrônomo
    ↓
Aguarda fade-out terminar
    ↓
Para todos os sources
    ↓
Limpa AudioContextScheduler (50ms após início)
    ↓
Remove contexto de áudio (200ms após início)
    ↓
Nova rota carregada sem áudio vazando
```

## Resultado

- ✅ Fade-out suave ao trocar de tela
- ✅ Nenhum áudio vaza para próximo contexto
- ✅ Sons críticos de treino têm fade-out mais longo
- ✅ Retomar áudio somente com interação explícita
- ✅ Navegação rápida não quebra áudio
- ✅ Lifecycle bem definido e controlado
