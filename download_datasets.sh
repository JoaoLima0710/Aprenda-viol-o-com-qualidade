#!/bin/bash

# Script para baixar e preparar datasets de treinamento para MusicTutor IA
# Execute este script em um ambiente com acesso à internet e espaço em disco

echo "🎸 MusicTutor - Download de Datasets para IA"
echo "=============================================="
echo ""

# Criar estrutura de diretórios
echo "📁 Criando estrutura de diretórios..."
mkdir -p datasets/{guitarset, idmt-guitar, processed}
cd datasets

# Dataset 1: GuitarSet
echo ""
echo "🎼 Baixando GuitarSet (360 gravações de violão)..."
echo "📊 Tamanho: ~2.3GB"
echo "🔗 Fonte: https://zenodo.org/record/3371780"

if [ ! -f guitarset/GuitarSet_audio.zip ]; then
    echo "📥 Baixando áudio..."
    wget -O guitarset/GuitarSet_audio.zip "https://zenodo.org/record/3371780/files/GuitarSet_audio.zip"
else
    echo "✅ Áudio já baixado"
fi

if [ ! -f guitarset/GuitarSet_annotation.zip ]; then
    echo "📥 Baixando anotações..."
    wget -O guitarset/GuitarSet_annotation.zip "https://zenodo.org/record/3371780/files/GuitarSet_annotation.zip"
else
    echo "✅ Anotações já baixadas"
fi

echo "📦 Extraindo GuitarSet..."
unzip -q guitarset/GuitarSet_audio.zip -d guitarset/audio/
unzip -q guitarset/GuitarSet_annotation.zip -d guitarset/annotations/

echo "✅ GuitarSet pronto!"

# Dataset 2: IDMT-SMT-Guitar
echo ""
echo "🎸 Baixando IDMT-SMT-Guitar (guitarra elétrica)..."
echo "📊 Tamanho: ~8.2GB"
echo "🔗 Fonte: https://zenodo.org/record/7544117"

if [ ! -f idmt-guitar/IDMT-SMT-GUITAR_V2.zip ]; then
    echo "📥 Baixando dataset..."
    wget -O idmt-guitar/IDMT-SMT-GUITAR_V2.zip "https://zenodo.org/record/7544117/files/IDMT-SMT-GUITAR_V2.zip"
else
    echo "✅ Dataset já baixado"
fi

echo "📦 Extraindo IDMT-Guitar..."
unzip -q idmt-guitar/IDMT-SMT-GUITAR_V2.zip -d idmt-guitar/

echo "✅ IDMT-SMT-Guitar pronto!"

# Verificar downloads
echo ""
echo "📊 Resumo dos Downloads:"
echo "========================"

if [ -d "guitarset/audio" ]; then
    guitarset_files=$(find guitarset/audio -name "*.wav" | wc -l)
    echo "🎼 GuitarSet: $guitarset_files arquivos de áudio"
fi

if [ -d "idmt-guitar" ]; then
    idmt_files=$(find idmt-guitar -name "*.wav" 2>/dev/null | wc -l)
    echo "🎸 IDMT-Guitar: $idmt_files arquivos de áudio"
fi

total_size=$(du -sh . | cut -f1)
echo "💾 Espaço total usado: $total_size"

echo ""
echo "🎯 Próximos passos:"
echo "==================="
echo "1. Execute o script de processamento: ./process_datasets.py"
echo "2. Treine o modelo: npm run train-ai"
echo "3. Teste no dashboard: http://localhost:3007/training"

echo ""
echo "✅ Downloads concluídos! Datasets prontos para treinamento de IA."