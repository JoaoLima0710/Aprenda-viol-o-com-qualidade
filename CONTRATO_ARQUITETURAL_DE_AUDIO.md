# CONTRATO_ARQUITETURAL_DE_AUDIO

Este documento define as regras imutáveis para arquitetura de áudio do projeto, servindo como referência para desenvolvimento, testes e revisão de código.

## 1. AudioEngine
- Responsável exclusivo pela criação, inicialização e gerenciamento do contexto global de áudio (AudioContext).
- Garante singleton: apenas uma instância ativa por sessão.
- Expõe métodos para inicializar, suspender, retomar e destruir o contexto.
- Não manipula diretamente AudioNodes de processamento ou playback.

## 2. AudioBus
- Responsável por criar, rotear e gerenciar cadeias de AudioNodes para canais lógicos (ex: chords, scales, metronome).
- Realiza toda a criação de AudioNodes (GainNode, BufferSource, Oscillator, etc.) de forma encapsulada.
- Expõe métodos para playback, mute, volume e agendamento de eventos.
- Proíbe acesso direto a AudioNodes fora do escopo do AudioBus.

## 3. UnifiedAudioService
- Orquestra operações de áudio de alto nível (playback, stop, agendamento, integração com UI).
- Interage apenas com AudioBus e AudioEngine, nunca com AudioNodes diretamente.
- Implementa lógica de negócios: bloqueio de playback sem inicialização, controle de múltiplos canais, integração com eventos de navegação.
- Proíbe manipulação direta de AudioContext ou AudioNodes.

## 4. UI (Interface do Usuário)
- Pode apenas solicitar operações de áudio via UnifiedAudioService.
- Proibido acessar AudioEngine, AudioBus ou AudioNodes diretamente.
- Não pode criar, modificar ou conectar AudioNodes.
- Não pode inicializar ou destruir o contexto de áudio.

## 5. Cadeias de Áudio Permitidas (Grafo)
- **Buffer (chords):**
  - AudioBufferSourceNode → GainNode → (opcional: DynamicsCompressorNode) → AudioContext.destination
- **Oscillator:**
  - OscillatorNode → GainNode → (opcional: DynamicsCompressorNode) → AudioContext.destination
- Todos os nodes intermediários devem ser criados e conectados exclusivamente pelo AudioBus.

## 6. Regras Proibidas
- Proibido criar AudioNodes (GainNode, OscillatorNode, BufferSourceNode, etc.) fora do AudioBus.
- Proibido acessar ou modificar AudioContext diretamente fora do AudioEngine.
- Proibido manipular ou conectar AudioNodes diretamente na UI ou UnifiedAudioService.
- Proibido instanciar múltiplos AudioEngine.
- Proibido modificar o grafo de áudio fora dos métodos do AudioBus.

---
Este contrato é imutável e serve como base para todos os testes, revisões e integrações do sistema de áudio.