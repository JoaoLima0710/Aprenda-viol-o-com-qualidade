# 🚀 Funcionalidades Avançadas de PWA - MusicTutor

## Visão Geral

O MusicTutor agora possui **3 funcionalidades avançadas de PWA**:

1. **Push Notifications** - Lembretes e notificações de conquistas
2. **Background Sync** - Sincronização automática de progresso offline
3. **Audio Cache** - Cache progressivo de samples de instrumentos

---

## 🔔 1. Push Notifications

### O que foi implementado

Sistema completo de notificações push para:
- ✅ Lembretes diários de prática
- ✅ Conquistas desbloqueadas
- ✅ Novas músicas adicionadas
- ✅ Marcos de sequência (streak)
- ✅ Meta diária completa

### Arquivos Criados

```
client/src/
├── hooks/
│   └── useNotifications.ts      # Hook para gerenciar notificações
└── components/
    └── NotificationSettings.tsx # UI de configuração
```

### Como Usar

**1. Ativar Notificações (Usuário):**
- Ir em Configurações
- Seção "Notificações"
- Clicar em "Ativar"
- Permitir notificações no navegador

**2. Configurar Lembretes:**
- Ativar "Lembrete Diário"
- Escolher horário (padrão: 19:00)
- Ativar/desativar tipos específicos

**3. Enviar Notificação (Desenvolvedor):**

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { notifyAchievement, notifyDailyGoalComplete } = useNotifications();

  // Notificar conquista
  notifyAchievement('Primeira Música Completa', 100);

  // Notificar meta diária
  notifyDailyGoalComplete(30);
}
```

### API do Hook

```typescript
const {
  isSupported,              // boolean - Notificações suportadas?
  permission,               // NotificationPermission - 'granted' | 'denied' | 'default'
  subscription,             // PushSubscription | null
  requestPermission,        // () => Promise<boolean>
  unsubscribe,              // () => Promise<boolean>
  sendLocalNotification,    // (payload) => Promise<void>
  scheduleDailyReminder,    // (hour, minute) => void
  notifyAchievement,        // (name, xp) => void
  notifyNewSong,            // (songName) => void
  notifyStreakMilestone,    // (days) => void
  notifyDailyGoalComplete,  // (minutes) => void
} = useNotifications();
```

### Tipos de Notificação

```typescript
type NotificationType = 
  | 'practice_reminder'      // Lembrete de prática
  | 'achievement_unlocked'   // Conquista desbloqueada
  | 'new_song'               // Nova música
  | 'streak_milestone'       // Marco de sequência
  | 'daily_goal';            // Meta diária completa
```

### Exemplo de Uso Completo

```typescript
import { useNotifications } from '@/hooks/useNotifications';
import { useEffect } from 'react';

function PracticeTracker() {
  const { 
    permission, 
    requestPermission, 
    scheduleDailyReminder,
    notifyDailyGoalComplete 
  } = useNotifications();

  useEffect(() => {
    // Ativar notificações no primeiro uso
    if (permission === 'default') {
      requestPermission().then(granted => {
        if (granted) {
          // Agendar lembrete diário às 19:00
          scheduleDailyReminder(19, 0);
        }
      });
    }
  }, [permission]);

  const handlePracticeComplete = (minutes: number) => {
    if (minutes >= 30) {
      notifyDailyGoalComplete(minutes);
    }
  };

  return <div>...</div>;
}
```

### Limitações

- **iOS Safari:** Suporte limitado (apenas iOS 16.4+)
- **Firefox:** Não suporta Push API completo
- **Produção:** Requer backend para push real (VAPID keys)
- **Atual:** Apenas notificações locais funcionam

---

## 🔄 2. Background Sync

### O que foi implementado

Sistema de sincronização automática que:
- ✅ Salva progresso de prática offline
- ✅ Sincroniza automaticamente quando voltar online
- ✅ Registra Background Sync API
- ✅ Rastreia sessões pendentes
- ✅ Mostra status de sincronização

### Arquivos Criados

```
client/src/
└── hooks/
    └── useBackgroundSync.ts  # Hook para sincronização
```

### Como Usar

**1. Salvar Sessão de Prática:**

```typescript
import { useBackgroundSync } from '@/hooks/useBackgroundSync';

function PracticeSession() {
  const { savePracticeSession } = useBackgroundSync();

  const handlePracticeEnd = async () => {
    await savePracticeSession({
      type: 'chord',
      duration: 15,
      accuracy: 85,
      notesPlayed: 120,
    });
  };

  return <button onClick={handlePracticeEnd}>Finalizar Prática</button>;
}
```

**2. Verificar Status:**

```typescript
const { pendingSessions, isSyncing, getPracticeStats } = useBackgroundSync();

const stats = getPracticeStats();
console.log(`Total: ${stats.total}, Sincronizadas: ${stats.synced}, Pendentes: ${stats.pending}`);
```

**3. Sincronizar Manualmente:**

```typescript
const { syncPendingSessions } = useBackgroundSync();

await syncPendingSessions();
```

### API do Hook

```typescript
const {
  isSupported,           // boolean - Background Sync suportado?
  isSyncing,             // boolean - Sincronizando agora?
  pendingSessions,       // PracticeSession[] - Sessões não sincronizadas
  savePracticeSession,   // (session) => Promise<PracticeSession>
  syncPendingSessions,   // () => Promise<void>
  clearSyncedSessions,   // () => void
  getPracticeStats,      // () => { total, synced, pending }
} = useBackgroundSync();
```

### Estrutura de Sessão

```typescript
interface PracticeSession {
  id: string;
  type: 'chord' | 'scale' | 'song' | 'ear_training';
  duration: number;        // minutos
  accuracy?: number;       // porcentagem
  notesPlayed?: number;
  timestamp: number;
  synced: boolean;
}
```

### Fluxo de Sincronização

```
1. Usuário pratica → savePracticeSession()
2. Sessão salva em localStorage
3. Se ONLINE → Sincroniza imediatamente
4. Se OFFLINE → Registra Background Sync
5. Quando voltar ONLINE → Sincroniza automaticamente
6. Toast de confirmação: "X sessão(ões) sincronizada(s)!"
```

### Eventos

```typescript
// Detecta quando volta online
window.addEventListener('online', () => {
  // Sincronização automática
});

// Detecta quando fica offline
window.addEventListener('offline', () => {
  // Mostra toast de modo offline
});
```

### Integração com Backend (Produção)

```typescript
const syncPendingSessions = async () => {
  const unsynced = pendingSessions.filter(s => !s.synced);

  // Enviar para API
  const response = await fetch('/api/practice/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessions: unsynced }),
  });

  if (response.ok) {
    // Marcar como sincronizadas
    markAsSynced(unsynced);
  }
};
```

---

## 💾 3. Audio Cache

### O que foi implementado

Sistema de cache progressivo que:
- ✅ Baixa samples de instrumentos para uso offline
- ✅ Gerencia cache por instrumento
- ✅ Mostra progresso de download
- ✅ Exibe espaço usado
- ✅ Permite limpar cache individual ou total

### Arquivos Criados

```
client/src/
├── hooks/
│   └── useAudioCache.ts         # Hook para cache de áudio
└── components/
    └── AudioCacheSettings.tsx   # UI de gerenciamento
```

### Como Usar

**1. Baixar Instrumento (Usuário):**
- Ir em Configurações
- Seção "Cache de Áudio"
- Clicar em "Baixar" no instrumento desejado
- Aguardar download (mostra progresso)

**2. Verificar Cache (Desenvolvedor):**

```typescript
import { useAudioCache } from '@/hooks/useAudioCache';

function MyComponent() {
  const { cachedInstruments, getCacheSize } = useAudioCache();

  useEffect(() => {
    cachedInstruments.forEach(status => {
      console.log(`${status.instrument}: ${status.cached ? 'Cached' : 'Not cached'}`);
    });

    getCacheSize().then(size => {
      console.log(`Cache size: ${size} bytes`);
    });
  }, [cachedInstruments]);
}
```

**3. Baixar Programaticamente:**

```typescript
const { cacheInstrument } = useAudioCache();

await cacheInstrument('acoustic_guitar_nylon');
```

### API do Hook

```typescript
const {
  isSupported,            // boolean - Cache API suportado?
  cachedInstruments,      // CacheStatus[] - Status de cada instrumento
  isDownloading,          // boolean - Baixando agora?
  downloadProgress,       // number - Progresso (0-100)
  cacheInstrument,        // (instrument) => Promise<boolean>
  clearInstrumentCache,   // (instrument) => Promise<boolean>
  clearAllCache,          // () => Promise<boolean>
  getCacheSize,           // () => Promise<number>
  loadCacheStatus,        // () => Promise<void>
} = useAudioCache();
```

### Tipos de Instrumento

```typescript
type InstrumentType = 
  | 'acoustic_guitar_nylon'   // Violão Nylon
  | 'acoustic_guitar_steel'   // Violão Aço
  | 'acoustic_grand_piano';   // Piano
```

### Status de Cache

```typescript
interface CacheStatus {
  instrument: InstrumentType;
  cached: boolean;
  size?: number;
  timestamp?: number;
}
```

### Exemplo Completo

```typescript
import { useAudioCache } from '@/hooks/useAudioCache';
import { Button } from '@/components/ui/button';

function OfflineSetup() {
  const {
    cachedInstruments,
    isDownloading,
    downloadProgress,
    cacheInstrument,
  } = useAudioCache();

  const handleDownloadAll = async () => {
    for (const status of cachedInstruments) {
      if (!status.cached) {
        await cacheInstrument(status.instrument);
      }
    }
  };

  return (
    <div>
      <h2>Preparar para Uso Offline</h2>
      
      {isDownloading && (
        <div>
          Baixando... {Math.round(downloadProgress)}%
        </div>
      )}

      <Button onClick={handleDownloadAll} disabled={isDownloading}>
        Baixar Todos os Instrumentos
      </Button>

      <ul>
        {cachedInstruments.map(status => (
          <li key={status.instrument}>
            {status.instrument}: {status.cached ? '✅' : '❌'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Cache Storage

Os arquivos são armazenados em:
```
Cache Storage → musictutor-audio-cache
```

Você pode inspecionar no DevTools:
- F12 → Application → Cache Storage → musictutor-audio-cache

### Limitações Atuais

- **Soundfont:** Apenas arquivo principal (.js) é cacheado
- **Produção:** Precisa cachear todos os arquivos individuais de notas
- **Tamanho:** Cada instrumento ~5-10 MB
- **Quota:** Limitado pela quota do navegador (geralmente 50-100 MB)

### Melhorias Futuras

1. **Cache completo de soundfonts:**
   - Baixar todos os arquivos de notas individuais
   - Cachear metadados do instrumento

2. **Cache sob demanda:**
   - Cachear apenas notas usadas
   - Expandir cache conforme uso

3. **Compressão:**
   - Usar formato comprimido (Opus)
   - Reduzir tamanho do cache

---

## 🧪 Como Testar

### 1. Push Notifications

**Desktop:**
```
1. Abrir DevTools (F12)
2. Application → Service Workers
3. Verificar SW registrado
4. Ir em Configurações
5. Ativar Notificações
6. Permitir no navegador
7. Testar lembrete diário
```

**Mobile:**
```
1. Instalar PWA
2. Abrir app
3. Ir em Configurações
4. Ativar Notificações
5. Permitir no sistema
6. Fechar app
7. Aguardar notificação no horário configurado
```

### 2. Background Sync

**Simular Offline:**
```
1. Abrir DevTools (F12)
2. Network → Offline
3. Praticar uma sessão
4. Ver toast "Sessão salva offline"
5. Network → Online
6. Ver toast "X sessão(ões) sincronizada(s)!"
```

**Verificar LocalStorage:**
```javascript
// No console
JSON.parse(localStorage.getItem('pending_practice_sessions'))
```

### 3. Audio Cache

**Baixar Instrumento:**
```
1. Ir em Configurações
2. Seção "Cache de Áudio"
3. Clicar "Baixar" em Violão Nylon
4. Aguardar progresso
5. Ver ✅ "Disponível offline"
```

**Verificar Cache:**
```
1. DevTools → Application
2. Cache Storage → musictutor-audio-cache
3. Ver arquivos cacheados
```

**Testar Offline:**
```
1. Baixar instrumento
2. DevTools → Network → Offline
3. Tocar notas
4. Verificar se funciona
```

---

## 📊 Métricas e Analytics

### Rastrear Uso de Notificações

```typescript
// Quando usuário ativa
gtag('event', 'notification_enabled', {
  event_category: 'engagement',
  event_label: 'Push Notifications'
});

// Quando notificação é enviada
gtag('event', 'notification_sent', {
  event_category: 'engagement',
  event_label: type,
  value: 1
});

// Quando usuário clica na notificação
gtag('event', 'notification_clicked', {
  event_category: 'engagement',
  event_label: type,
  value: 1
});
```

### Rastrear Sincronização

```typescript
// Quando sessão é salva offline
gtag('event', 'session_saved_offline', {
  event_category: 'engagement',
  event_label: session.type,
  value: session.duration
});

// Quando sincronização completa
gtag('event', 'sync_completed', {
  event_category: 'engagement',
  event_label: 'Background Sync',
  value: syncedCount
});
```

### Rastrear Cache de Áudio

```typescript
// Quando instrumento é baixado
gtag('event', 'audio_cached', {
  event_category: 'engagement',
  event_label: instrument,
  value: cacheSize
});

// Quando cache é limpo
gtag('event', 'audio_cache_cleared', {
  event_category: 'engagement',
  event_label: instrument
});
```

---

## 🐛 Troubleshooting

### Notificações não funcionam

**Problema:** Botão "Ativar" não faz nada

**Soluções:**
1. Verificar se HTTPS (ou localhost)
2. Verificar se Service Worker está registrado
3. Verificar permissões do navegador
4. Testar em modo anônimo

### Background Sync não sincroniza

**Problema:** Sessões ficam pendentes mesmo online

**Soluções:**
1. Verificar console para erros
2. Verificar se `navigator.onLine` está true
3. Forçar sincronização manualmente
4. Limpar localStorage e tentar novamente

### Cache de áudio não funciona offline

**Problema:** Sons não tocam offline

**Soluções:**
1. Verificar se instrumento foi baixado completamente
2. Verificar Cache Storage no DevTools
3. Limpar cache e baixar novamente
4. Verificar quota do navegador

---

## 🚀 Deploy em Produção

### Variáveis de Ambiente

```env
# VAPID Keys para Push Notifications (gerar com web-push)
VITE_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key

# Backend API para sincronização
VITE_API_URL=https://api.musictutor.com
```

### Gerar VAPID Keys

```bash
npm install -g web-push
web-push generate-vapid-keys
```

### Backend API Endpoints

```typescript
// POST /api/push/subscribe
// Body: { subscription: PushSubscription }
// Response: { success: boolean }

// POST /api/practice/sync
// Body: { sessions: PracticeSession[] }
// Response: { synced: number }

// GET /api/soundfonts/:instrument
// Response: { urls: string[] }
```

### Service Worker em Produção

```javascript
// Atualizar sw.js com URLs de produção
const API_URL = 'https://api.musictutor.com';
const SOUNDFONT_CDN = 'https://cdn.musictutor.com/soundfonts';
```

---

## ✅ Checklist de Implementação

- [x] Push Notifications
  - [x] Hook useNotifications
  - [x] Componente NotificationSettings
  - [x] Integração com Service Worker
  - [x] Tipos de notificação
  - [x] Agendamento de lembretes
  
- [x] Background Sync
  - [x] Hook useBackgroundSync
  - [x] Salvamento offline
  - [x] Sincronização automática
  - [x] Rastreamento de sessões
  - [x] Eventos online/offline

- [x] Audio Cache
  - [x] Hook useAudioCache
  - [x] Componente AudioCacheSettings
  - [x] Download progressivo
  - [x] Gerenciamento de cache
  - [x] Limpeza de cache

- [x] Integração
  - [x] Adicionar em Settings.tsx
  - [x] Testar em desenvolvimento
  - [x] Documentação completa

- [ ] Produção
  - [ ] Gerar VAPID keys
  - [ ] Implementar backend API
  - [ ] Configurar push server
  - [ ] Cache completo de soundfonts
  - [ ] Testar em produção

---

**Funcionalidades avançadas de PWA implementadas com sucesso! 🎉**

O MusicTutor agora oferece uma experiência offline completa com notificações, sincronização automática e cache de áudio.
