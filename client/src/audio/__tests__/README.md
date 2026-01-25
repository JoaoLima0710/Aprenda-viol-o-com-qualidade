# Testes do Sistema de Áudio

## Visão Geral

Estes testes protegem a arquitetura do sistema de áudio, garantindo que:
- O `AudioBus` seja a única camada de autoridade de playback
- Nenhum player crie `AudioNodes` diretamente
- Todo roteamento passe pelo `AudioMixer`
- Validações de estado sejam respeitadas

## Estrutura de Testes

### 1. `AudioBus.test.ts` - Testes Unitários
**Foco**: Validações de estado e contratos de execução

**Cobre**:
- `playBuffer()` retorna `false` quando:
  - AudioEngine não está pronto
  - Canal não existe no AudioMixer
  - Buffer é inválido
- `playBuffer()` retorna `true` quando condições são válidas
- `playOscillator()` valida frequência, duração e canal
- Volume é aplicado corretamente
- Conexões são feitas corretamente (source -> volumeGain -> channelGain)

### 2. `AudioBus.integration.test.ts` - Testes de Integração
**Foco**: Integração entre AudioBus e AudioMixer

**Cobre**:
- Roteamento para canais corretos (chords, scales, metronome)
- Volumes são respeitados por canal
- Múltiplos playbacks simultâneos
- Agendamento com `when` correto

### 3. `ChordPlayer.contract.test.ts` - Testes de Contrato
**Foco**: Garantir que ChordPlayer não viola arquitetura

**Cobre**:
- ChordPlayer NÃO cria `AudioBufferSourceNode` diretamente
- ChordPlayer NÃO chama `source.start()` diretamente
- ChordPlayer delega exclusivamente ao AudioBus
- ChordPlayer usa o canal correto ('chords')
- ChordPlayer respeita volume configurado

### 4. `audioArchitecture.guard.test.ts` - Testes de Regressão
**Foco**: Proteção contra refatorações perigosas

**Cobre**:
- Detecta criação de `AudioBufferSourceNode` fora do AudioBus
- Detecta criação de `OscillatorNode` fora do AudioBus
- Detecta conexões diretas ao `masterGain`
- Detecta padrões perigosos de uso

## Mocks

### `mocks/audioContext.mock.ts`

Fornece mocks completos para:
- `AudioContext`
- `AudioBuffer`
- `AudioBufferSourceNode`
- `OscillatorNode`
- `GainNode`
- `AudioParam`

**Importante**: Nenhum áudio real é tocado durante os testes.

## Executando os Testes

```bash
# Todos os testes de áudio
pnpm test client/src/audio/__tests__

# Teste específico
pnpm test client/src/audio/__tests__/AudioBus.test.ts

# Com cobertura
pnpm test --coverage client/src/audio/__tests__
```

## Regras Arquiteturais Protegidas

1. **AudioBus é único criador de AudioNodes**
   - Apenas `AudioBus` pode criar `AudioBufferSourceNode` e `OscillatorNode`
   - Testes falham se qualquer outro código criar esses nodes

2. **Todo roteamento passa pelo AudioMixer**
   - Nenhuma conexão direta ao `masterGain` é permitida
   - Tudo deve passar por um canal do `AudioMixer`

3. **Validações obrigatórias**
   - `AudioEngine.isReady()` deve ser verificado antes de tocar
   - Canais devem existir no `AudioMixer`
   - Parâmetros devem ser válidos (frequência > 0, duração > 0, etc.)

4. **Retorno de sucesso/falha**
   - Todos os métodos de playback retornam `boolean`
   - Logs claros em caso de falha

## Notas Importantes

- **Não testa UI**: Estes testes focam em comportamento e contratos, não em componentes React
- **Não usa Web Audio API real**: Todos os testes usam mocks
- **Falha se regras forem quebradas**: Testes de regressão arquitetural devem falhar se alguém tentar burlar o AudioBus
- **Cobertura focada**: Prioriza comportamento crítico sobre cobertura numérica

## Adicionando Novos Testes

Ao adicionar novos players ou funcionalidades:

1. **Testes de Contrato**: Garanta que o novo player não cria AudioNodes diretamente
2. **Testes de Integração**: Verifique que o novo player usa o canal correto
3. **Testes de Regressão**: Adicione casos específicos se necessário

## Troubleshooting

### Testes falhando após refatoração

Se os testes de regressão arquitetural falharem:
1. Verifique se você está criando AudioNodes fora do AudioBus
2. Verifique se está conectando diretamente ao masterGain
3. Use o AudioBus para todo playback

### Mocks não funcionando

Se os mocks não estiverem funcionando corretamente:
1. Verifique se `vi.mock()` está sendo chamado antes dos imports
2. Verifique se os mocks estão retornando os tipos corretos
3. Use `vi.clearAllMocks()` no `beforeEach`
