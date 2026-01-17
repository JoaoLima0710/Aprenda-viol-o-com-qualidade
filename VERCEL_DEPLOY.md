# 🚀 Deploy no Vercel - MusicTutor

## ✅ Configuração Corrigida

O MusicTutor é um projeto **web-static** (frontend-only) que NÃO precisa de servidor Express. A configuração foi corrigida para fazer deploy apenas do frontend.

---

## 📋 Pré-requisitos

1. Conta no Vercel (https://vercel.com)
2. Repositório GitHub com o código do MusicTutor
3. pnpm instalado (o Vercel detecta automaticamente)

---

## 🚀 Como Fazer Deploy

### Opção 1: Via Interface do Vercel (Recomendado)

1. **Acesse:** https://vercel.com/new

2. **Importe o Repositório:**
   - Clique em "Import Git Repository"
   - Selecione seu repositório GitHub do MusicTutor
   - Clique em "Import"

3. **Configure o Projeto:**
   - **Project Name:** `musictutor` (ou o nome que preferir)
   - **Framework Preset:** Other
   - **Root Directory:** `./` (deixe vazio)
   - **Build Command:** `pnpm run build:vercel`
   - **Output Directory:** `dist/public`
   - **Install Command:** `pnpm install`

4. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build (2-5 minutos)
   - Pronto! Seu app estará no ar

### Opção 2: Via CLI do Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
cd /caminho/para/musictutor
vercel

# Seguir prompts:
# - Set up and deploy? Y
# - Which scope? (sua conta)
# - Link to existing project? N
# - Project name? musictutor
# - In which directory? ./
# - Override settings? Y
# - Build Command? pnpm run build:vercel
# - Output Directory? dist/public

# Deploy para produção
vercel --prod
```

---

## 🔧 Arquivos de Configuração

### 1. `vercel.json`

Configura:
- ✅ Build command: `pnpm run build:vercel`
- ✅ Output directory: `dist/public`
- ✅ Rewrites para SPA (todas rotas → index.html)
- ✅ Headers de cache (assets, Service Worker)

### 2. `.vercelignore`

Ignora:
- ✅ Pasta `server/` (não usada)
- ✅ `node_modules/`
- ✅ Arquivos de desenvolvimento

### 3. `vite.config.vercel.ts`

Build otimizado:
- ✅ Sem plugins Manus
- ✅ Code splitting
- ✅ Sourcemaps desabilitados

---

## 🔍 Verificar Deploy

Após o deploy, verifique:

1. **URL do Deploy:**
   - Vercel fornece URL: `https://musictutor-xxx.vercel.app`

2. **Testar Funcionalidades:**
   - ✅ Página inicial carrega
   - ✅ Navegação entre páginas funciona
   - ✅ Áudio funciona (acordes, escalas)
   - ✅ PWA funciona (instalação, offline)
   - ✅ Service Worker registrado

3. **DevTools:**
   - F12 → Console → Sem erros
   - F12 → Network → Assets carregam
   - F12 → Application → Service Worker ativo

---

## 🐛 Troubleshooting

### Problema: "Server code detected" ou mostra código Express

**Causa:** Vercel está tentando executar código do servidor

**Solução:**
1. Verificar se `.vercelignore` existe e contém `server/`
2. Garantir que `vercel.json` tem `"buildCommand": "pnpm run build:vercel"`
3. NO VERCEL DASHBOARD:
   - Settings → General → Build & Development Settings
   - Build Command: `pnpm run build:vercel`
   - Output Directory: `dist/public`
   - Install Command: `pnpm install`
4. Limpar cache: Settings → General → Clear Cache
5. Redeploy

### Problema: "Build failed"

**Solução:**
```bash
# Testar build localmente
cd /caminho/para/musictutor
pnpm run build:vercel

# Se funcionar local, limpar cache do Vercel
vercel --force
```

### Problema: "404 Not Found" em rotas

**Solução:**
- Verificar se `vercel.json` existe no root
- Verificar se `rewrites` está configurado

### Problema: Service Worker não funciona

**Solução:**
- Verificar headers do `sw.js` no `vercel.json`
- Garantir HTTPS (Vercel usa por padrão)

---

## 🔄 Atualizações Automáticas

O Vercel faz deploy automático quando você:

1. **Push para GitHub:**
   ```bash
   git add .
   git commit -m "Atualização"
   git push origin main
   ```

2. **Vercel detecta push:**
   - Inicia build automaticamente
   - Deploy em 2-5 minutos
   - URL atualizada

---

## 📊 Otimizações Pós-Deploy

### 1. Domínio Customizado

```bash
# Via CLI
vercel domains add seudominio.com

# Via Interface
# Settings → Domains → Add Domain
```

### 2. Analytics

- Settings → Analytics → Enable

### 3. Performance

- ✅ Gzip automático
- ✅ HTTP/2
- ✅ CDN global
- ✅ Cache de assets

---

## ✅ Checklist de Deploy

- [x] `vercel.json` criado
- [x] `.vercelignore` criado
- [x] `vite.config.vercel.ts` criado
- [x] `build:vercel` script em `package.json`
- [x] Build testado localmente
- [x] Repositório GitHub atualizado
- [ ] Deploy no Vercel realizado
- [ ] URL testada e funcionando
- [ ] PWA testado (instalação, offline)

---

## 🎉 Pronto!

Seu MusicTutor está pronto para deploy! 🚀

**Próximos Passos:**
1. Push para GitHub
2. Importar no Vercel
3. Configurar build settings
4. Deploy!

**URL de Produção:** `https://musictutor.vercel.app` (ou seu domínio customizado)
