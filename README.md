# 🎸 MusicTutor - Aprenda Violão com Gamificação

Aplicativo web educacional gamificado para aprendizado de violão, com treino de acordes, escalas, músicas brasileiras e sistema completo de XP, níveis, missões e conquistas.

## 🎯 Características Principais

### 🎨 Design Premium
- **Tema Escuro Moderno**: Background #0f0f1a com gradientes neon
- **Cores Vibrantes**: Violet (#a855f7), Cyan (#06b6d4), Orange (#f97316), Pink (#ec4899), Green (#10b981)
- **Componentes com Glassmorphism**: Backdrop blur e bordas sutis
- **Animações Suaves**: Transições e hover effects
- **Totalmente Responsivo**: Desktop (sidebar) + Mobile (bottom nav)

### 📱 Progressive Web App (PWA)
- ✅ **Instalável**: Adicione à tela inicial como app nativo
- ✅ **Offline-First**: Funciona sem internet após primeira carga
- ✅ **Performance Nativa**: Carregamento instantâneo, animações suaves
- ✅ **Notificações Push**: Lembretes de prática (futuro)
- ✅ **Compatibilidade Total**: Desktop, Android, iOS
- ✅ **Cache Inteligente**: Service Worker otimizado

### 🚀 Deploy no Vercel
- ✅ **Deploy Automático**: Git push = deploy instantâneo
- ✅ **CDN Global**: Carregamento ultra-rápido worldwide
- ✅ **SSL Automático**: HTTPS por padrão
- ✅ **Analytics Integrado**: Métricas de performance
- ✅ **Rollback Instantâneo**: Voltar versão anterior facilmente

### 🎵 Módulos Educacionais

#### 1. **Acordes** (`/chords`)
- ✅ **17 acordes implementados**: Maiores, menores, sétima, suspensos, pestana
- ✅ **Diagramas interativos**: Visualização clara das posições dos dedos
- ✅ **Sistema de dificuldade**: Iniciante, Intermediário, Avançado
- ✅ **Filtros**: Por dificuldade e categoria
- ✅ **Dicas pedagógicas**: Tips para cada acorde
- ✅ **Acordes relacionados**: Sugestões de progressões
- ✅ **Progresso persistente**: Zustand + localStorage

#### 2. **Escalas** (`/scales`)
- ✅ **6 escalas implementadas**: Pentatônicas, Blues, Maior, Menor, Modos
- ✅ **Visualização por cores**: Cada escala com gradiente único
- ✅ **Sistema de dificuldade**: Progressão pedagógica
- 🔜 **ScaleClock**: Visualização circular (código já criado)
- 🔜 **Posições CAGED**: Padrões no braço
- 🔜 **Padrões de prática**: Ascendente, descendente, terças, quartas

#### 3. **Músicas** (🔜 Próxima implementação)
- 🔜 Repertório brasileiro (MPB, Bossa Nova, Samba)
- 🔜 Cifras completas + letra sincronizada
- 🔜 Player com controles (velocidade, loop)
- 🔜 Análise harmônica

### 🏆 Sistema de Gamificação

#### XP e Níveis
- ✅ **Sistema de XP**: Ganhe pontos praticando
- ✅ **20 níveis**: Progressão exponencial
- ✅ **Barra de progresso**: Visual claro do avanço
- ✅ **Títulos desbloqueáveis**: Cada nível tem um título

#### Missões Diárias
- ✅ **3 missões por dia**: Praticar acordes, escalas, tempo
- ✅ **Progresso rastreado**: Barra de progresso em tempo real
- ✅ **Recompensas em XP**: 50-100 XP por missão
- ✅ **Reset automático**: A cada 24h

#### Conquistas
- ✅ **30+ conquistas**: Primeira nota, colecionador, dedicado
- ✅ **Sistema de raridade**: Common → Legendary
- ✅ **Badges visuais**: Ícones emoji + gradientes
- ✅ **Recompensas**: XP + Badge + Título
- ✅ **Histórico**: Data de desbloqueio

#### Streak
- ✅ **Contador de dias consecutivos**: Pratique todos os dias
- ✅ **Streak máximo**: Recorde pessoal
- ✅ **Multiplicador de XP**: Até 1.5x com streak alto
- ✅ **Visual destacado**: Card com gradiente laranja + ícone de fogo

### 📱 Interface Responsiva

#### Desktop (≥1024px)
- **Sidebar fixa**: Navegação + perfil + streak
- **Layout amplo**: 2-3 colunas para conteúdo
- **Diagramas grandes**: Visualização detalhada

#### Mobile (<1024px)
- **Header compacto**: Menu hambúrguer + notificações
- **Bottom Navigation**: 4 itens principais
- **Sidebar deslizante**: Overlay com perfil completo
- **Layout vertical**: Cards empilhados

## 🛠️ Stack Tecnológica

### Frontend
- **React 19**: Biblioteca UI
- **TypeScript**: Type safety
- **Vite**: Build tool ultra-rápido
- **Tailwind CSS 4**: Utility-first CSS
- **Wouter**: Roteamento leve
- **Zustand**: State management
- **Framer Motion**: Animações (pronto para uso)
- **Lucide React**: Ícones modernos
- **shadcn/ui**: Componentes base

### Persistência
- **Zustand Persist**: localStorage automático
- **IndexedDB**: Futuro (para áudio)

### Áudio (🔜 Próxima fase)
- **Web Audio API**: Síntese de áudio
- **Tone.js**: Alternativa (mais fácil)
- **Pitch Detection**: Feedback em tempo real

## 📁 Estrutura do Projeto

```
musictutor/
├── client/
│   ├── public/              # Assets estáticos
│   ├── src/
│   │   ├── components/
│   │   │   ├── chords/      # Componentes de acordes
│   │   │   │   └── ChordDiagram.tsx
│   │   │   ├── scales/      # Componentes de escalas (🔜)
│   │   │   ├── gamification/# Componentes de gamificação
│   │   │   │   ├── DailyGoalCard.tsx
│   │   │   │   ├── ChallengeCard.tsx
│   │   │   │   ├── ContinueLearning.tsx
│   │   │   │   └── TrainingModule.tsx
│   │   │   ├── layout/      # Layout components
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── MobileHeader.tsx
│   │   │   │   ├── MobileSidebar.tsx
│   │   │   │   └── MobileBottomNav.tsx
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── data/
│   │   │   ├── chords.ts    # 17 acordes
│   │   │   └── scales.ts    # 18 escalas (código criado)
│   │   ├── stores/
│   │   │   ├── useGamificationStore.ts  # XP, níveis, missões, conquistas
│   │   │   ├── useChordStore.ts         # Progresso de acordes
│   │   │   └── useScaleStore.ts         # Progresso de escalas (código criado)
│   │   ├── hooks/
│   │   │   └── useScaleCompletion.ts    # Integração gamificação (código criado)
│   │   ├── pages/
│   │   │   ├── Home.tsx         # Dashboard principal
│   │   │   ├── Chords.tsx       # Biblioteca de acordes
│   │   │   ├── Scales.tsx       # Biblioteca de escalas
│   │   │   ├── Missions.tsx     # Missões diárias
│   │   │   ├── Achievements.tsx # Conquistas
│   │   │   └── Profile.tsx      # Perfil do usuário
│   │   ├── App.tsx              # Rotas
│   │   ├── index.css            # Tema + cores
│   │   └── main.tsx             # Entry point
│   └── index.html
├── package.json
└── README.md
```

## 🚀 Como Executar

### Desenvolvimento
```bash
cd musictutor
pnpm install
pnpm dev
```

Acesse: `http://localhost:3000`

### Build para Produção
```bash
pnpm build
pnpm start
```

## 🎨 Paleta de Cores

### Cores Principais
- **Background**: `#0f0f1a` (Charcoal escuro)
- **Card**: `#1a1a2e` (Charcoal médio)
- **Card Elevated**: `#232338` (Charcoal claro)

### Cores Neon
- **Primary (Violet)**: `#a855f7` → `#c084fc`
- **Secondary (Cyan)**: `#06b6d4` → `#22d3ee`
- **Orange**: `#f97316` → `#fb923c`
- **Pink**: `#ec4899` → `#f472b6`
- **Green**: `#10b981` → `#34d399`

### Bordas e Overlays
- **Border**: `rgba(255, 255, 255, 0.1)`
- **Input**: `rgba(255, 255, 255, 0.05)`

## 📊 Estado Atual

### ✅ Implementado
- [x] Sistema de design premium (tema escuro + neon)
- [x] Layout responsivo (desktop + mobile)
- [x] Navegação completa (sidebar + bottom nav)
- [x] Sistema de gamificação (XP, níveis, streak)
- [x] Missões diárias (3 missões)
- [x] Conquistas (30+ conquistas)
- [x] Módulo de Acordes (17 acordes + diagramas)
- [x] Módulo de Escalas (6 escalas + visualização)
- [x] Página de Perfil (estatísticas + progresso)
- [x] Persistência de dados (Zustand + localStorage)

### 🔜 Próximas Implementações

#### Fase 1: Áudio (Alta Prioridade)
- [ ] Integrar Web Audio API ou Tone.js
- [ ] Sintetizar sons de acordes
- [ ] Sintetizar sons de escalas
- [ ] Player de áudio com controles
- [ ] Feedback visual durante reprodução

#### Fase 2: Escalas Avançadas
- [ ] Implementar ScaleClock (código já criado)
- [ ] Implementar ScaleFretboard com posições CAGED
- [ ] Adicionar padrões de prática
- [ ] Sistema de desbloqueio progressivo

#### Fase 3: Módulo de Músicas
- [ ] Banco de dados de 50+ músicas brasileiras
- [ ] Componente de cifra com letra sincronizada
- [ ] Player de música com controles
- [ ] Análise harmônica
- [ ] Sistema de favoritos

#### Fase 4: Prática Interativa
- [ ] Metrônomo visual + áudio
- [ ] Sessões de prática guiadas
- [ ] Exercícios de técnica
- [ ] Histórico de prática
- [ ] Gráficos de progresso

#### Fase 5: Features Avançadas
- [ ] Pitch detection (feedback em tempo real)
- [ ] Gravação de áudio
- [ ] Compartilhamento social
- [ ] Leaderboard online (requer backend)
- [ ] Modo escuro/claro (toggle)

## 🎯 Roadmap Completo

### MVP (✅ Concluído - 6 semanas)
- ✅ Design system + layout
- ✅ Navegação + rotas
- ✅ Gamificação básica (XP, níveis, streak)
- ✅ Módulo de Acordes
- ✅ Missões e Conquistas

### Fase 2: Escalas (🔜 4 semanas)
- 🔜 Módulo completo de escalas
- 🔜 ScaleClock + ScaleFretboard
- 🔜 Padrões de prática

### Fase 3: Músicas (🔜 5 semanas)
- 🔜 Banco de dados de músicas
- 🔜 Player + cifras
- 🔜 Sistema de favoritos

### Fase 4: Áudio (🔜 4 semanas)
- 🔜 Síntese de áudio
- 🔜 Metrônomo
- 🔜 Pitch detection

### Fase 5: Backend (🔜 8 semanas)
- 🔜 API Node.js + PostgreSQL
- 🔜 Autenticação
- 🔜 Leaderboard online
- 🔜 Sincronização multi-dispositivo

## 📝 Notas de Desenvolvimento

### Decisões de Design
1. **Tema escuro por padrão**: Melhor para uso prolongado e foco
2. **Gradientes neon**: Visual moderno e atraente para jovens
3. **Glassmorphism**: Profundidade e sofisticação
4. **Responsividade mobile-first**: Maioria dos usuários em mobile

### Decisões Técnicas
1. **Zustand**: Mais leve que Redux, perfeito para este escopo
2. **Wouter**: Roteador minimalista, sem overhead
3. **Tailwind CSS 4**: Utility-first, rápido para prototipagem
4. **shadcn/ui**: Componentes copiáveis, sem dependência

### Performance
- **Lazy loading**: Rotas carregadas sob demanda
- **Memoização**: Componentes otimizados com React.memo
- **Debounce**: Inputs com debounce para evitar re-renders
- **Virtual scrolling**: Para listas longas (futuro)

## 🚀 Instalação e Deploy

### Desenvolvimento Local
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/musictutor.git
cd musictutor

# Instale as dependências
pnpm install

# Rode o servidor de desenvolvimento
pnpm run dev

# Acesse http://localhost:3007
```

### 🏗️ Build para Produção
```bash
# Build otimizado
pnpm run build

# Preview local
pnpm run preview
```

### 🚀 Deploy no Vercel
```bash
# Deploy automático (recomendado)
# 1. Importe o repositório no Vercel (vercel.com/new)
# 2. Configure:
#    - Framework: Other
#    - Build Command: pnpm run build:vercel
#    - Output Directory: dist/public

# Ou deploy manual com script
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

### 📱 Instalação PWA

#### Desktop (Chrome/Edge/Firefox):
1. Abra o site no navegador
2. Clique no ícone de instalação na barra de endereços
3. Ou clique em "Instalar MusicTutor" na página

#### Android:
1. Abra no Chrome/Edge
2. Toque em "Instalar" ou menu → "Adicionar à tela inicial"

#### iOS (Safari):
1. Abra no Safari
2. Toque no botão compartilhar → "Adicionar à Tela Inicial"

### ✅ Verificação PWA
- Abra DevTools → Lighthouse → Progressive Web App
- Deve ter score > 90 em todas as métricas
- Deve funcionar offline após primeira carga

## 🤝 Contribuindo

Este é um projeto educacional. Sugestões e melhorias são bem-vindas!

### Como Contribuir
1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Add NovaFeature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT © 2026 MusicTutor

---

**Desenvolvido com 🎸 e ❤️ para democratizar o aprendizado de violão no Brasil**
