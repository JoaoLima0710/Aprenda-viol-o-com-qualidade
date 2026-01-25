# 🔊 Volume Control - Controle de Volume Global

## Implementação

Sistema de controle de volume global, consistente e sempre acessível em todo o app.

## Características

### Controle Único Global
- **Localização:** `client/src/components/audio/VolumeControl.tsx`
- **Posição:** Canto superior direito (fixo, sempre visível)
- **Integração:** Conectado ao store global `useAudioSettingsStore`

### Estado de Volume

**Onde vive:**
- **Store Global:** `useAudioSettingsStore.masterVolume` (0.0 a 1.0)
- **Persistência:** Automática via Zustand persist middleware
- **Sincronização:** Bidirecional entre store e AudioMixer

**Fluxo:**
```
Usuário ajusta volume
    ↓
VolumeControl atualiza store
    ↓
Store persiste em localStorage
    ↓
AudioMixer sincroniza com store
    ↓
Volume aplicado imediatamente
```

### Feedback Visual Imediato

**Ao ajustar volume:**
- Toast discreto mostrando porcentagem (ex: "70%")
- Duração: 500ms
- Posição: top-center
- Estilo: Fundo escuro, texto branco

**Ao mutar/desmutar:**
- Toast mostrando estado (ex: "Mudo" ou "Som ativado")
- Duração: 500ms
- Posição: top-center

### Persistência por Sessão

**Como funciona:**
- Store usa `persist` middleware do Zustand
- Nome da storage: `'audio-settings-storage'`
- Volume persiste entre:
  - Navegação de rotas
  - Recarregamento da página
  - Sessões do navegador

**Garantias:**
- ✅ Volume não reseta ao trocar de tela
- ✅ Volume mantém valor entre sessões
- ✅ AudioMixer sincroniza ao inicializar

## Pontos de Integração

### 1. VolumeControl Component

**Localização:** `client/src/components/audio/VolumeControl.tsx`

**Uso:**
```tsx
<VolumeControl className="..." />
```

**Características:**
- Usa `useAudioSettingsStore` para estado
- Sincroniza com `AudioMixer` automaticamente
- Feedback visual via toast
- Slider aparece ao hover

**Código:**
```typescript
const { masterVolume, setMasterVolume } = useAudioSettingsStore();

// Converter para 0-100 para exibição
const volume = Math.round(masterVolume * 100);

// Atualizar store e AudioMixer
const handleVolumeChange = (newVolume: number) => {
  const volumeNormalized = newVolume / 100;
  setMasterVolume(volumeNormalized); // Store (persistido)
  
  const mixer = getAudioMixer();
  if (mixer) {
    mixer.setMasterVolume(volumeNormalized); // AudioMixer (aplicado)
  }
};
```

### 2. AudioMixer Sincronização

**Localização:** `client/src/audio/AudioMixer.ts`

**Quando sincroniza:**
- Ao inicializar (`initialize()`)
- Quando `setMasterVolume()` é chamado

**Código:**
```typescript
public async initialize(): Promise<void> {
  // ... criar canais ...
  
  // Sincronizar com store global
  const store = useAudioSettingsStore.getState();
  if (store.masterVolume !== undefined) {
    this.masterVolume = store.masterVolume;
    this.audioEngine.setMasterVolume(this.masterVolume);
  }
}
```

### 3. Settings Page

**Localização:** `client/src/pages/Settings.tsx`

**Integração:**
- Usa mesmo store global
- Sincroniza com AudioMixer ao ajustar
- Mantém consistência com VolumeControl

**Código:**
```typescript
<Slider
  value={[masterVolume * 100]}
  onValueChange={(value) => {
    const newVolume = value[0] / 100;
    setMasterVolume(newVolume); // Store
    // Sincronizar AudioMixer
    const mixer = getAudioMixer();
    if (mixer) {
      mixer.setMasterVolume(newVolume);
    }
  }}
/>
```

## Garantias

### 1. Não Reseta ao Trocar de Tela
- ✅ Store persiste em localStorage
- ✅ VolumeControl lê do store ao montar
- ✅ AudioMixer sincroniza ao inicializar
- ✅ Nenhum reset explícito em navegação

### 2. Feedback Visual Imediato
- ✅ Toast mostra porcentagem ao ajustar
- ✅ Toast mostra estado ao mutar/desmutar
- ✅ Ícone muda baseado em volume/mute
- ✅ Slider mostra valor atual

### 3. Persistência por Sessão
- ✅ Zustand persist middleware
- ✅ localStorage automático
- ✅ Restauração ao carregar app
- ✅ Sincronização com AudioMixer

### 4. Controle Único Global
- ✅ Apenas um VolumeControl no App.tsx
- ✅ Store global único
- ✅ Sem duplicação de sliders
- ✅ Consistência entre Settings e VolumeControl

## Como o Usuário Percebe a Mudança

### Visual
1. **Ícone muda:**
   - VolumeX (mudo ou 0%)
   - Volume1 (1-49%)
   - Volume2 (50-100%)

2. **Toast aparece:**
   - Mostra porcentagem (ex: "70%")
   - Duração curta (500ms)
   - Não intrusivo

3. **Slider mostra valor:**
   - Posição do slider reflete volume
   - Valor numérico exibido
   - Atualização em tempo real

### Auditivo
1. **Volume muda imediatamente:**
   - AudioMixer aplica mudança
   - Sons ativos refletem novo volume
   - Sem delay perceptível

2. **Mute instantâneo:**
   - AudioMixer.toggleMute()
   - Volume vai para 0 imediatamente
   - Restaura volume anterior ao desmutar

## Fluxo Completo

```
Usuário ajusta slider no VolumeControl
    ↓
handleVolumeChange(newVolume)
    ↓
setMasterVolume(volumeNormalized) → Store (persistido)
    ↓
mixer.setMasterVolume(volumeNormalized) → AudioMixer (aplicado)
    ↓
toast.success(`${volume}%`) → Feedback visual
    ↓
Ícone atualiza baseado em volume
    ↓
Volume aplicado em todos os sons ativos
```

## Resultado

- ✅ Controle único global sempre acessível
- ✅ Volume não reseta ao trocar de tela
- ✅ Feedback visual imediato
- ✅ Persistência por sessão
- ✅ Sincronização bidirecional store ↔ AudioMixer
- ✅ Consistência entre VolumeControl e Settings
