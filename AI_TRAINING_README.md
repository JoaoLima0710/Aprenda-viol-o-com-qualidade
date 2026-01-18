# 🎸 MusicTutor - Sistema de IA para Detecção de Acordes

## Visão Geral

O MusicTutor implementa um sistema avançado de **Inteligência Artificial para detecção de acordes em tempo real**, treinada com datasets públicos de alta qualidade. O sistema usa aprendizado de máquina para analisar áudio e identificar acordes tocados por violão ou guitarra.

## 🏗️ Arquitetura Técnica

### Modelo de IA
- **Framework**: TensorFlow.js (para execução no navegador)
- **Arquitetura**: Rede Neural Convolucional (CNN)
- **Entrada**: Features extraídas do áudio (cromagrama, espectrograma mel, MFCCs)
- **Saída**: Probabilidades para cada acorde no vocabulário
- **Latência**: < 200ms para feedback em tempo real

### Features de Áudio
- **Cromagrama**: 12 bins para notas musicais (C, C#, D, etc.)
- **Espectrograma Mel**: 128 bins para características de timbre
- **MFCCs**: 13 coeficientes para características de voz/formantes
- **Centróide Espectral**: Frequência média do sinal
- **RMS Energy**: Nível de energia do sinal
- **Zero Crossing Rate**: Taxa de cruzamento por zero

## 📊 Datasets de Treinamento

### GuitarSet (Recomendado)
- **Fonte**: Universidade da Queen Mary, Londres
- **Tamanho**: ~2.3GB (360 gravações)
- **Qualidade**: Gravações profissionais em estúdio
- **Músicos**: 6 diferentes guitarristas profissionais
- **Acordes**: 24 acordes + variações (C, Cm, C7, etc.)
- **Estilos**: comp (acompanhamento), slow, fast

### IDMT-SMT-Guitar
- **Fonte**: Universidade Técnica de Ilmenau
- **Tamanho**: ~8.2GB
- **Qualidade**: Gravações mistas (estúdio + ao vivo)
- **Instrumentos**: Guitarra elétrica
- **Técnicas**: Normal, mute, bend, slide, vibrato

## 🚀 Guia de Instalação e Uso

### Pré-requisitos
```bash
# Python 3.8+
python --version

# Node.js 18+
node --version

# Instalar dependências Python
pip install numpy scipy librosa tensorflow scikit-learn matplotlib seaborn

# Instalar dependências Node.js
npm install
```

### 1. Download dos Datasets
```bash
# Executar script de download
chmod +x download_datasets.sh
./download_datasets.sh

# Ou baixar manualmente:
# GuitarSet: https://zenodo.org/record/3371780
# IDMT-Guitar: https://zenodo.org/record/7544117
```

### 2. Processamento dos Dados
```bash
# Processar datasets e extrair features
python process_datasets.py --datasets guitarset idmt-guitar
```

### 3. Treinamento do Modelo
```bash
# Treinar modelo com dados processados
python train_model.py --epochs 50 --batch-size 32
```

### 4. Implantação no Navegador
```bash
# Converter modelo para TensorFlow.js
tensorflowjs_converter models/chord_detector/chord_detector_final.h5 models/web_model

# Copiar para o projeto
cp -r models/web_model client/public/models/

# Iniciar aplicação
npm run dev
```

## 🎯 Como Usar no MusicTutor

### Dashboard de Treinamento
Acesse `http://localhost:3007/training` para:
- **Baixar datasets** (simulado para navegador)
- **Treinar modelo** (requer backend Python)
- **Testar detecção** em tempo real
- **Visualizar métricas** de performance

### Exercícios Adaptativos
O sistema se integra automaticamente aos exercícios:
```typescript
// Exemplo de uso no código
const chordDetector = new ChordDetectionAIService();
await chordDetector.initialize();

// Detectar acorde em tempo real
const result = await chordDetector.detectChord(audioBuffer);
console.log(`Acorde detectado: ${result.chord} (${result.confidence})`);
```

### Feedback em Tempo Real
- **Latência**: < 200ms
- **Precisão**: > 85% em condições ideais
- **Feedback**: Sugestões específicas por corda
- **Adaptação**: Modelo aprende com correções do usuário

## 📈 Métricas de Performance

### Acurácia por Acorde (Esperada)
| Acorde | Acurácia | Confiança |
|--------|----------|-----------|
| C, G, D | 90-95% | Alta |
| Am, Em, Dm | 85-90% | Alta |
| C7, D7, G7 | 80-85% | Média |
| Acordes complexos | 75-80% | Média |

### Condições de Teste
- **Microfone**: Qualidade média ou superior
- **Ambiente**: Ruído < 40dB
- **Distância**: 30-50cm do instrumento
- **Volume**: Nível consistente

## 🔧 Configuração Avançada

### Hiperparâmetros do Modelo
```python
# Arquivo: train_model.py
EPOCHS = 50
BATCH_SIZE = 32
LEARNING_RATE = 0.001
DROPOUT_RATE = 0.3
```

### Vocabulário de Acordes
```python
CHORD_VOCAB = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
    'C7', 'D7', 'E7', 'G7', 'A7', 'Cm7', 'Dm7', 'Em7', 'Gm7', 'Am7'
]
```

### Otimização para Mobile
- **Modelo comprimido**: < 5MB
- **Quantização**: 8-bit weights
- **WebGL acceleration**: GPU utilization
- **Offline-first**: Funciona sem internet

## 🐛 Troubleshooting

### Problemas Comuns

#### Modelo não carrega
```bash
# Verificar se arquivos existem
ls -la client/public/models/

# Verificar logs do console do navegador
# F12 > Console > Erros relacionados a TensorFlow.js
```

#### Baixo desempenho
```bash
# Verificar recursos do sistema
top  # CPU/Memória

# Otimizar modelo
python optimize_model.py --quantize
```

#### Dados de treinamento insuficientes
```bash
# Adicionar mais datasets
python process_datasets.py --datasets guitarset idmt-guitar your-dataset

# Aumentar dados (data augmentation)
python augment_data.py --techniques pitch_shift time_stretch noise_addition
```

## 🔬 Pesquisa e Desenvolvimento

### Melhorias Futuras
- **Transformer Architecture**: Para sequências musicais
- **Multi-instrument**: Suporte para baixo, ukulele, cavaquinho
- **Real-time Adaptation**: Aprendizado contínuo durante uso
- **Polyphonic Detection**: Múltiplos acordes simultâneos

### Contribuição
1. Fork o repositório
2. Crie uma branch para sua feature
3. Adicione testes
4. Submit pull request

### Referências
- [GuitarSet Paper](https://archives.ismir.net/ismir2019/paper/000033.pdf)
- [IDMT-SMT-Guitar Dataset](https://www.idmt.fraunhofer.de/en/business_units/m2d/smt/guitar.html)
- [TensorFlow.js Audio](https://www.tensorflow.org/js/guide/audio)

---

## 📞 Suporte

Para questões sobre o sistema de IA:
- **Discord**: [MusicTutor Community](https://discord.gg/musictutor)
- **Issues**: [GitHub Issues](https://github.com/musictutor/issues)
- **Documentação**: [AI Architecture Docs](docs/ai_architecture.md)

---

*🎸 Desenvolvido com ❤️ para revolucionar o aprendizado musical*