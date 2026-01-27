# AUDIO_ARCHITECTURE.md

## Regras Obrigatórias

1. **AudioContext só pode ser criado via AudioBootstrap**
   - Nunca use `new AudioContext()` diretamente em componentes, hooks ou serviços.
   - A inicialização deve ocorrer apenas após gesto explícito do usuário (ex: click).
2. **Singleton absoluto para AudioEngine**
   - Sempre use `AudioEngine.getInstance()`.
   - Nunca instancie AudioEngine com `new`.
3. **Guarda global contra múltiplas criações**
   - O guard impede duplicidade e loga stacktrace em produção.
4. **Sem inicialização automática**
   - Nenhum serviço de áudio pode inicializar no mount ou em efeitos automáticos.
5. **Testes de arquitetura obrigatórios**
   - O CI deve falhar se qualquer arquivo tentar criar AudioContext fora do fluxo correto.

---

## Anti-padrões Proibidos

- `new AudioContext()` em qualquer lugar fora do AudioBootstrap
- Instanciar AudioEngine com `new AudioEngine()`
- Inicializar áudio em `useEffect` sem gesto do usuário
- Criar múltiplos AudioContext em componentes, hooks ou serviços
- Ignorar o guard global
- Testes que burlam o fluxo de inicialização

---

## Fluxo Correto de Inicialização

1. **Usuário realiza gesto (ex: click em botão "Ativar Áudio")**
2. **AudioBootstrap libera criação via `enableAudioContextCreation()`**
3. **AudioEngine é inicializado via singleton**
4. **AudioContext é criado uma única vez**
5. **Serviços e componentes dependem do contexto já inicializado**

---

## Exemplos

### Bom
```tsx
// Componente React
import { audioBootstrap } from '@/audio/AudioBootstrap';

function AtivarAudioButton() {
  return <button onClick={e => audioBootstrap.initialize(e)}>Ativar Áudio</button>;
}
```

```typescript
// Serviço
import { AudioEngine } from '@/audio/AudioEngine';
const engine = AudioEngine.getInstance();
const ctx = engine.getContext();
```

### Ruim
```tsx
// NÃO FAÇA
const ctx = new AudioContext(); // Proibido
```

```typescript
// NÃO FAÇA
const engine = new AudioEngine(); // Proibido
```

```tsx
// NÃO FAÇA
useEffect(() => {
  AudioEngine.getInstance().initialize(); // Proibido sem gesto do usuário
}, []);
```

---

## Observações
- Toda tentativa de burlar o fluxo será detectada por testes e pelo guard global.
- O fluxo é idêntico em dev e produção.
- Consulte este documento antes de integrar qualquer novo serviço ou componente de áudio.
