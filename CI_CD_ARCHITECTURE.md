# 🏗️ Arquitetura CI/CD - Proteção de Áudio

## 📋 Visão Geral

Este projeto implementa uma arquitetura de CI/CD que **protege a arquitetura de áudio** através de testes automatizados. A regra de ouro é:

> **PR que quebra áudio não passa CI**

## 🔄 Fluxo de CI/CD

### 1. GitHub Actions (CI) - Roda ANTES do deploy

**Arquivo:** `.github/workflows/ci.yml`

**Pipeline Otimizado (Jobs Paralelos):**
```
typecheck ──┐
            ├──→ build
test    ────┘

architecture-only (opcional, para PRs rápidos)
```

**Ganho de Performance:** 20-40% mais rápido com jobs paralelos

**Jobs:**

1. **typecheck** (paralelo)
   - ✅ Instala dependências
   - ✅ Verifica TypeScript (`pnpm run check`)

2. **test** (paralelo)
   - ✅ Instala dependências
   - ✅ Roda todos os testes (`pnpm run test:ci`)
     - Testes unitários (`AudioBus.test.ts`)
     - Testes de integração (`AudioBus.integration.test.ts`)
     - Testes de contrato (`ChordPlayer.contract.test.ts`)
     - **Testes arquiteturais** (`audioArchitecture.guard.test.ts`) ⚠️ **CRÍTICO**

3. **build** (depende de typecheck + test)
   - ✅ Instala dependências
   - ✅ Verifica se o build funciona (`pnpm run build`)

4. **architecture-only** (opcional, apenas PRs)
   - ✅ Roda apenas testes arquiteturais (`pnpm run test:architecture`)
   - ⚡ Útil para: PRs de refatoração, PRs de IA, mudanças rápidas

**Quando roda:**
- Em cada Pull Request
- Em cada push para `main` ou `master`

**Resultado:**
- ❌ Se qualquer teste falhar → CI falha → PR não pode ser mergeado
- ✅ Se todos passarem → CI passa → PR pode ser mergeado

### 2. Vercel (Deploy) - Roda DEPOIS do CI passar

**Arquivo:** `vercel.json`

**Pipeline:**
```
install → build (apenas)
```

**O que faz:**
- ✅ Instala dependências (`pnpm install`)
- ✅ Faz build do frontend (`pnpm run build:vercel`)
- ❌ **NÃO roda testes** (já rodaram no CI)

**Por que não roda testes no Vercel?**
- ✅ Build mais rápido
- ✅ Evita falsos positivos
- ✅ Evita deploy quebrado (testes já validaram antes)
- ✅ Testes rodam no CI, que é o lugar certo

## 🧱 Arquitetura Governada

### Ponto Único de Playback

**AudioBus** é o único lugar onde:
- `AudioBufferSourceNode` pode ser criado
- `OscillatorNode` pode ser criado
- `source.start()` pode ser chamado
- `osc.start()` pode ser chamado

### Testes que Protegem Decisões

Os testes não protegem apenas linhas de código, mas **decisões arquiteturais**:

1. **AudioBus.test.ts** - Valida que AudioBus funciona corretamente
2. **AudioBus.integration.test.ts** - Valida integração com AudioMixer
3. **ChordPlayer.contract.test.ts** - Garante que ChordPlayer não viola arquitetura
4. **audioArchitecture.guard.test.ts** - ⚠️ **DETECTA violações arquiteturais**

### Proteção Contra Regressão Silenciosa

O teste `audioArchitecture.guard.test.ts` usa **spies globais** para detectar:
- Criação de `AudioBufferSourceNode` fora do AudioBus
- Criação de `OscillatorNode` fora do AudioBus
- Chamadas de `source.start()` fora do AudioBus
- Chamadas de `osc.start()` fora do AudioBus

**Se alguém tentar burlar o AudioBus:**
- ❌ Teste falha
- ❌ CI falha
- ❌ PR não pode ser mergeado

## 📊 Estado Final do Projeto

Você agora tem:

✅ **Arquitetura governada** - AudioBus é o ponto único de playback  
✅ **Ponto único de playback** - Tudo passa pelo AudioBus  
✅ **Testes que protegem decisões** - Não apenas linhas, mas arquitetura  
✅ **CI que impede regressão silenciosa** - PR quebrado não passa  

## 🚀 Como Usar

### Desenvolvimento Local

```bash
# Rodar testes
pnpm run test

# Rodar testes em modo watch
pnpm run test

# Rodar testes com UI
pnpm run test:ui

# Verificar TypeScript
pnpm run check

# Build
pnpm run build
```

### Criar um PR

1. Faça suas mudanças
2. Commit e push
3. Abra um PR
4. **GitHub Actions roda automaticamente**
5. Se CI passar → PR pode ser mergeado
6. Se CI falhar → Corrija os problemas

### Deploy no Vercel

1. Merge o PR (após CI passar)
2. Vercel detecta push para `main`
3. Vercel faz build (sem testes)
4. Deploy automático

## ⚠️ Regras Importantes

1. **Nunca criar AudioNodes fora do AudioBus**
   - Use `audioBus.playBuffer()` ou `audioBus.playOscillator()`
   - Nunca chame `audioContext.createBufferSource()` diretamente

2. **Nunca chamar start() fora do AudioBus**
   - O AudioBus gerencia o ciclo de vida dos nodes
   - Nunca chame `source.start()` ou `osc.start()` diretamente

3. **Sempre rodar testes antes de fazer PR**
   - `pnpm run test:ci` localmente
   - Se falhar local, vai falhar no CI

4. **Se CI falhar, não fazer merge**
   - Corrija os problemas primeiro
   - CI existe para proteger a arquitetura

## 🔍 Troubleshooting

### CI falha com "test failed"

1. Rode localmente: `pnpm run test:ci`
2. Veja qual teste falhou
3. Corrija o problema
4. Commit e push novamente

### CI falha com "typecheck failed"

1. Rode localmente: `pnpm run check`
2. Corrija erros de TypeScript
3. Commit e push novamente

### Build falha no Vercel

1. Verifique se CI passou (deve ter passado)
2. Rode build local: `pnpm run build:vercel`
3. Se funcionar local, pode ser cache do Vercel
4. Limpe cache no Vercel Dashboard

## 📚 Referências

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [AudioBus Architecture](./client/src/audio/__tests__/README.md)
