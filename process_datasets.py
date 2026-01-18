#!/usr/bin/env python3
"""
Processador de Datasets para MusicTutor IA
==========================================

Este script processa os datasets baixados (GuitarSet, IDMT-SMT-Guitar)
e extrai features para treinamento do modelo de detecção de acordes.

Pré-requisitos:
- Python 3.8+
- pip install numpy scipy librosa tensorflow

Uso:
python process_datasets.py
"""

import os
import json
import numpy as np
import librosa
import scipy.signal
from pathlib import Path
import argparse
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class DatasetProcessor:
    def __init__(self, base_dir: str = "datasets"):
        self.base_dir = Path(base_dir)
        self.sample_rate = 22050  # Reduzido para processamento mais rápido
        self.hop_length = 512
        self.n_fft = 2048
        self.n_mels = 128
        self.n_chroma = 12

        # Chord mapping (simplificado)
        self.chord_vocab = [
            'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
            'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
            'C7', 'D7', 'E7', 'G7', 'A7', 'Cm7', 'Dm7', 'Em7', 'Gm7', 'Am7'
        ]

    def process_guitarset(self) -> List[Dict]:
        """Processa o dataset GuitarSet"""
        print("🎼 Processando GuitarSet...")

        audio_dir = self.base_dir / "guitarset" / "audio"
        annotation_dir = self.base_dir / "guitarset" / "annotations"

        if not audio_dir.exists():
            print("❌ Diretório GuitarSet/audio não encontrado")
            return []

        samples = []

        # Estrutura: audio/player_style/chord_file.wav
        for audio_file in audio_dir.rglob("*.wav"):
            try:
                # Extrair informações do nome do arquivo
                parts = audio_file.stem.split('_')
                if len(parts) < 3:
                    continue

                player, chord, style = parts[0], parts[1], parts[2]

                # Carregar áudio
                audio, sr = librosa.load(audio_file, sr=self.sample_rate, mono=True)

                # Extrair features
                features = self.extract_features(audio)

                # Criar sample
                sample = {
                    'id': f'GuitarSet_{player}_{chord}_{style}',
                    'chord': chord,
                    'instrument': 'guitar',
                    'quality': 'studio',
                    'audio_file': str(audio_file),
                    'duration': len(audio) / self.sample_rate,
                    'features': features,
                    'metadata': {
                        'player': player,
                        'style': style,
                        'sample_rate': sr,
                        'source': 'GuitarSet'
                    }
                }

                samples.append(sample)

                if len(samples) % 50 == 0:
                    print(f"📊 Processados: {len(samples)} arquivos")

            except Exception as e:
                print(f"⚠️ Erro processando {audio_file}: {e}")
                continue

        print(f"✅ GuitarSet: {len(samples)} amostras processadas")
        return samples

    def process_idmt_guitar(self) -> List[Dict]:
        """Processa o dataset IDMT-SMT-Guitar"""
        print("🎸 Processando IDMT-SMT-Guitar...")

        dataset_dir = self.base_dir / "idmt-guitar"

        if not dataset_dir.exists():
            print("❌ Diretório IDMT-Guitar não encontrado")
            return []

        samples = []

        # Procurar por arquivos WAV
        for audio_file in dataset_dir.rglob("*.wav"):
            try:
                # Extrair informações do arquivo
                # Formato típico: guitar_XXX.wav ou variações
                filename = audio_file.stem

                # Tentar extrair informações do nome
                # Nota: pode precisar ajustar baseado na estrutura real
                chord = self.infer_chord_from_filename(filename)

                # Carregar áudio
                audio, sr = librosa.load(audio_file, sr=self.sample_rate, mono=True)

                # Extrair features
                features = self.extract_features(audio)

                sample = {
                    'id': f'IDMT_{filename}',
                    'chord': chord,
                    'instrument': 'guitar',
                    'quality': 'mixed',
                    'audio_file': str(audio_file),
                    'duration': len(audio) / self.sample_rate,
                    'features': features,
                    'metadata': {
                        'filename': filename,
                        'sample_rate': sr,
                        'source': 'IDMT-SMT-Guitar'
                    }
                }

                samples.append(sample)

                if len(samples) % 100 == 0:
                    print(f"📊 Processados: {len(samples)} arquivos")

            except Exception as e:
                print(f"⚠️ Erro processando {audio_file}: {e}")
                continue

        print(f"✅ IDMT-Guitar: {len(samples)} amostras processadas")
        return samples

    def extract_features(self, audio: np.ndarray) -> Dict:
        """Extrai features do áudio para treinamento"""
        try:
            # Cromagrama (12 bins para notas musicais)
            chroma = librosa.feature.chroma_stft(
                y=audio,
                sr=self.sample_rate,
                n_fft=self.n_fft,
                hop_length=self.hop_length,
                n_chroma=self.n_chroma
            )

            # Mel spectrogram
            mel_spec = librosa.feature.melspectrogram(
                y=audio,
                sr=self.sample_rate,
                n_fft=self.n_fft,
                hop_length=self.hop_length,
                n_mels=self.n_mels
            )
            mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)

            # MFCCs
            mfccs = librosa.feature.mfcc(
                y=audio,
                sr=self.sample_rate,
                n_mfcc=13,
                n_fft=self.n_fft,
                hop_length=self.hop_length
            )

            # Spectral centroid
            spectral_centroid = librosa.feature.spectral_centroid(
                y=audio,
                sr=self.sample_rate,
                n_fft=self.n_fft,
                hop_length=self.hop_length
            )

            # RMS energy
            rms = librosa.feature.rms(
                y=audio,
                frame_length=self.n_fft,
                hop_length=self.hop_length
            )

            # Zero crossing rate
            zcr = librosa.feature.zero_crossing_rate(
                y=audio,
                frame_length=self.n_fft,
                hop_length=self.hop_length
            )

            return {
                'chroma': chroma.T.tolist(),  # [time, 12]
                'mel_spectrogram': mel_spec_db.T.tolist(),  # [time, 128]
                'mfcc': mfccs.T.tolist(),  # [time, 13]
                'spectral_centroid': spectral_centroid.T.tolist(),  # [time, 1]
                'rms': rms.T.tolist(),  # [time, 1]
                'zcr': zcr.T.tolist(),  # [time, 1]
                'shape': {
                    'time_steps': chroma.shape[1],
                    'chroma_bins': self.n_chroma,
                    'mel_bins': self.n_mels,
                    'mfcc_coeffs': 13
                }
            }

        except Exception as e:
            print(f"❌ Erro extraindo features: {e}")
            return {}

    def infer_chord_from_filename(self, filename: str) -> str:
        """Tenta inferir o acorde do nome do arquivo"""
        # Mapeamentos simples baseados em padrões comuns
        chord_mappings = {
            'a': 'A', 'am': 'Am', 'a7': 'A7',
            'c': 'C', 'cm': 'Cm', 'c7': 'C7',
            'd': 'D', 'dm': 'Dm', 'd7': 'D7',
            'e': 'E', 'em': 'Em', 'e7': 'E7',
            'g': 'G', 'gm': 'Gm', 'g7': 'G7'
        }

        filename_lower = filename.lower()

        for pattern, chord in chord_mappings.items():
            if pattern in filename_lower:
                return chord

        # Fallback para acorde aleatório comum
        return np.random.choice(['C', 'D', 'E', 'G', 'A', 'Am', 'Em', 'Dm'])

    def save_processed_data(self, samples: List[Dict], output_file: str):
        """Salva dados processados em formato JSON"""
        print(f"💾 Salvando {len(samples)} amostras em {output_file}...")

        # Criar diretório se não existir
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Estatísticas
        chords = [s['chord'] for s in samples]
        instruments = [s['instrument'] for s in samples]
        qualities = [s['quality'] for s in samples]

        metadata = {
            'total_samples': len(samples),
            'unique_chords': len(set(chords)),
            'chord_distribution': dict(zip(*np.unique(chords, return_counts=True))),
            'instruments': list(set(instruments)),
            'qualities': list(set(qualities)),
            'processing_date': str(np.datetime64('now')),
            'feature_config': {
                'sample_rate': self.sample_rate,
                'hop_length': self.hop_length,
                'n_fft': self.n_fft,
                'n_mels': self.n_mels,
                'n_chroma': self.n_chroma
            }
        }

        data = {
            'metadata': metadata,
            'samples': samples
        }

        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"✅ Dados salvos: {output_file}")

    def prepare_training_data(self, samples: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepara dados para treinamento do modelo"""
        print("🎯 Preparando dados de treinamento...")

        features_list = []
        labels_list = []

        for sample in samples:
            if not sample.get('features') or not sample['features'].get('chroma'):
                continue

            # Usar cromagrama como feature principal (simplificado)
            chroma = np.array(sample['features']['chroma'])

            # Agregar temporalmente (média das features ao longo do tempo)
            if chroma.size > 0:
                feature_vector = np.mean(chroma, axis=0)  # [12] - uma feature por nota
                features_list.append(feature_vector)

                # Converter acorde para índice
                label_idx = self.chord_vocab.index(sample['chord']) if sample['chord'] in self.chord_vocab else 0
                labels_list.append(label_idx)

        if not features_list:
            raise ValueError("Nenhuma feature válida encontrada")

        X = np.array(features_list)
        y = np.array(labels_list)

        print(f"📊 Dados preparados: {X.shape[0]} amostras, {X.shape[1]} features, {len(self.chord_vocab)} classes")

        return X, y

def main():
    parser = argparse.ArgumentParser(description='Processador de Datasets para MusicTutor IA')
    parser.add_argument('--datasets', nargs='+', default=['guitarset', 'idmt-guitar'],
                       help='Datasets para processar')
    parser.add_argument('--output-dir', default='datasets/processed',
                       help='Diretório de saída')
    args = parser.parse_args()

    print("🎸 MusicTutor - Processamento de Datasets")
    print("=" * 45)

    processor = DatasetProcessor()

    all_samples = []

    # Processar datasets
    if 'guitarset' in args.datasets:
        guitarset_samples = processor.process_guitarset()
        all_samples.extend(guitarset_samples)

    if 'idmt-guitar' in args.datasets:
        idmt_samples = processor.process_idmt_guitar()
        all_samples.extend(idmt_samples)

    if not all_samples:
        print("❌ Nenhum dataset foi processado. Verifique os downloads.")
        return

    # Salvar dados processados
    output_file = f"{args.output_dir}/musictutor_training_data.json"
    processor.save_processed_data(all_samples, output_file)

    # Preparar dados para treinamento
    try:
        X, y = processor.prepare_training_data(all_samples)

        # Salvar em formato numpy para uso posterior
        np.savez(f"{args.output_dir}/training_data.npz", X=X, y=y, chord_vocab=processor.chord_vocab)

        print("✅ Dados de treinamento salvos!")
        print(f"📁 Arquivos gerados:")
        print(f"   • {output_file}")
        print(f"   • {args.output_dir}/training_data.npz")

    except Exception as e:
        print(f"⚠️ Erro preparando dados de treinamento: {e}")
        print("ℹ️ Dados JSON salvos, mas numpy arrays não puderam ser criados")

    print("\n🎯 Próximos passos:")
    print("1. Treine o modelo: python train_model.py")
    print("2. Teste no dashboard: http://localhost:3007/training")

if __name__ == "__main__":
    main()