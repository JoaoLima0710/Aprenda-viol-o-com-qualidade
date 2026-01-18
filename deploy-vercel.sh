#!/bin/bash

# Script de Deploy MusicTutor PWA no Vercel
# ==========================================

echo "🎸 MusicTutor - Deploy PWA no Vercel"
echo "===================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script do diretório raiz do projeto"
    exit 1
fi

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Verificar se está logado
echo "🔐 Verificando autenticação Vercel..."
if ! vercel whoami &> /dev/null; then
    echo "❌ Você precisa fazer login no Vercel primeiro:"
    echo "   vercel login"
    exit 1
fi

echo "✅ Autenticação verificada"

# Verificar se projeto já existe
if [ -f ".vercel/project.json" ]; then
    echo "📁 Projeto Vercel encontrado"
else
    echo "🆕 Criando novo projeto Vercel..."
fi

# Deploy de produção
echo ""
echo "🚀 Fazendo deploy de produção..."
echo "================================="

# Configurar variáveis de ambiente
export VERCEL_PROJECT_NAME="musictutor"
export VERCEL_ORG_ID="" # Configure se necessário

# Deploy
vercel --prod --yes

# Verificar se deploy foi bem-sucedido
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deploy concluído com sucesso!"
    echo "=================================="

    # Obter URL do deploy
    DEPLOY_URL=$(vercel ls --prod | grep "https://" | head -1 | awk '{print $2}')

    if [ ! -z "$DEPLOY_URL" ]; then
        echo "🌐 URL de Produção: $DEPLOY_URL"
        echo ""
        echo "📱 Teste PWA:"
        echo "   • Abra no navegador: $DEPLOY_URL"
        echo "   • Procure pelo banner de instalação"
        echo "   • Teste funcionalidades offline"
        echo ""
        echo "🔍 Validação PWA:"
        echo "   • Lighthouse PWA Score > 90"
        echo "   • Deve funcionar offline"
        echo "   • Instalável em desktop/mobile"
    else
        echo "⚠️ Deploy realizado, mas não foi possível obter a URL automaticamente"
        echo "   Verifique no dashboard do Vercel: https://vercel.com/dashboard"
    fi

    echo ""
    echo "📋 Checklist Pós-Deploy:"
    echo "========================"
    echo "□ Testar instalação PWA no desktop"
    echo "□ Testar instalação PWA no Android"
    echo "□ Testar instalação PWA no iOS"
    echo "□ Verificar funcionamento offline"
    echo "□ Testar notificações push (futuro)"
    echo "□ Validar performance no Lighthouse"

else
    echo ""
    echo "❌ Erro no deploy!"
    echo "=================="
    echo "Verifique os logs acima para detalhes do erro."
    echo ""
    echo "🔧 Possíveis soluções:"
    echo "   • Verifique se o build está funcionando: pnpm run build:vercel"
    echo "   • Teste localmente: pnpm run dev"
    echo "   • Verifique configurações no vercel.json"
    exit 1
fi

echo ""
echo "🎸 MusicTutor PWA está no ar!"
echo "📖 Leia o guia completo: VERCEL_DEPLOY_GUIDE.md"