#!/usr/bin/env python3
"""
Treinamento do Modelo de IA para MusicTutor
===========================================

Script para treinar o modelo de detecção de acordes usando TensorFlow/Keras
com dados processados dos datasets públicos.

Pré-requisitos:
- Python 3.8+
- pip install numpy tensorflow scikit-learn matplotlib seaborn

Uso:
python train_model.py --data datasets/processed/training_data.npz
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import argparse
import json
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

class ChordDetectionModel:
    def __init__(self, input_shape: tuple, num_classes: int):
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.model = None

    def build_model(self):
        """Constrói o modelo CNN para detecção de acordes"""
        print(f"🏗️ Construindo modelo: input {self.input_shape}, {self.num_classes} classes")

        model = keras.Sequential([
            # Camada de entrada
            layers.Input(shape=self.input_shape),

            # Camadas convolucionais para extrair padrões
            layers.Conv1D(32, kernel_size=3, activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling1D(pool_size=2),

            layers.Conv1D(64, kernel_size=3, activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling1D(pool_size=2),

            layers.Conv1D(128, kernel_size=3, activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling1D(pool_size=2),

            # Flatten para camadas densas
            layers.Flatten(),

            # Camadas densas para classificação
            layers.Dense(256, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.3),

            layers.Dense(128, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.2),

            # Camada de saída
            layers.Dense(self.num_classes, activation='softmax')
        ])

        # Compilar modelo
        model.compile(
            optimizer='adam',
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=3)]
        )

        self.model = model
        return model

    def train(self, X_train, y_train, X_val, y_val,
              epochs=50, batch_size=32, save_path="models/chord_detector"):
        """Treina o modelo"""
        if self.model is None:
            raise ValueError("Modelo não foi construído")

        print("🚀 Iniciando treinamento...")
        print(f"📊 Dados: {X_train.shape[0]} treino, {X_val.shape[0]} validação")
        print(f"⚙️ Config: {epochs} epochs, batch {batch_size}")

        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_accuracy',
                patience=10,
                restore_best_weights=True,
                mode='max'
            ),
            keras.callbacks.ModelCheckpoint(
                filepath=f"{save_path}_best.h5",
                monitor='val_accuracy',
                save_best_only=True,
                mode='max'
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-6
            )
        ]

        # Treinar
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )

        # Salvar modelo final
        os.makedirs(save_path, exist_ok=True)
        self.model.save(f"{save_path}/chord_detector_final.h5")

        # Salvar em formato TensorFlow.js
        self.save_for_web(save_path)

        return history

    def save_for_web(self, save_path: str):
        """Salva modelo em formato compatível com TensorFlow.js"""
        try:
            import tensorflowjs as tfjs

            web_model_path = f"{save_path}/web_model"
            tfjs.converters.save_keras_model(self.model, web_model_path)

            print(f"🌐 Modelo salvo para web: {web_model_path}")

        except ImportError:
            print("⚠️ tensorflowjs não instalado. Instale com: pip install tensorflowjs")
            print("💡 Modelo salvo apenas em formato Keras (.h5)")

    def evaluate(self, X_test, y_test):
        """Avalia o modelo nos dados de teste"""
        if self.model is None:
            raise ValueError("Modelo não foi treinado")

        print("📊 Avaliando modelo...")

        # Previsões
        y_pred_prob = self.model.predict(X_test)
        y_pred = np.argmax(y_pred_prob, axis=1)

        # Métricas
        loss, accuracy, top3_accuracy = self.model.evaluate(X_test, y_test, verbose=0)

        print(".2f"        print(".2f"        print(".2f"
        return {
            'loss': loss,
            'accuracy': accuracy,
            'top3_accuracy': top3_accuracy,
            'predictions': y_pred,
            'probabilities': y_pred_prob
        }

    def plot_training_history(self, history, save_path="models"):
        """Plota o histórico de treinamento"""
        os.makedirs(save_path, exist_ok=True)

        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 8))

        # Accuracy
        ax1.plot(history.history['accuracy'], label='Treino')
        ax1.plot(history.history['val_accuracy'], label='Validação')
        ax1.set_title('Acurácia')
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Acurácia')
        ax1.legend()

        # Loss
        ax2.plot(history.history['loss'], label='Treino')
        ax2.plot(history.history['val_loss'], label='Validação')
        ax2.set_title('Loss')
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('Loss')
        ax2.legend()

        # Top-3 Accuracy
        if 'top_k_categorical_accuracy' in history.history:
            ax3.plot(history.history['top_k_categorical_accuracy'], label='Treino')
            ax3.plot(history.history['val_top_k_categorical_accuracy'], label='Validação')
            ax3.set_title('Top-3 Acurácia')
            ax3.set_xlabel('Epoch')
            ax3.set_ylabel('Top-3 Acurácia')
            ax3.legend()

        # Learning Rate
        if hasattr(history, 'lr') and history.lr is not None:
            ax4.plot(history.lr, label='Learning Rate')
            ax4.set_title('Taxa de Aprendizado')
            ax4.set_xlabel('Epoch')
            ax4.set_ylabel('LR')
            ax4.set_yscale('log')

        plt.tight_layout()
        plt.savefig(f"{save_path}/training_history.png", dpi=300, bbox_inches='tight')
        plt.close()

        print(f"📈 Gráfico salvo: {save_path}/training_history.png")

def load_training_data(data_path: str):
    """Carrega dados de treinamento"""
    print(f"📂 Carregando dados: {data_path}")

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Arquivo não encontrado: {data_path}")

    data = np.load(data_path)
    X = data['X']
    y = data['y']
    chord_vocab = data['chord_vocab']

    print(f"✅ Dados carregados: {X.shape[0]} amostras, {X.shape[1]} features")
    print(f"🎼 Vocabulário: {len(chord_vocab)} acordes")

    return X, y, chord_vocab

def main():
    parser = argparse.ArgumentParser(description='Treinamento do Modelo de Detecção de Acordes')
    parser.add_argument('--data', default='datasets/processed/training_data.npz',
                       help='Caminho para dados de treinamento')
    parser.add_argument('--model-dir', default='models/chord_detector',
                       help='Diretório para salvar modelo')
    parser.add_argument('--epochs', type=int, default=50,
                       help='Número de epochs')
    parser.add_argument('--batch-size', type=int, default=32,
                       help='Tamanho do batch')
    parser.add_argument('--test-split', type=float, default=0.2,
                       help='Proporção dos dados para teste')
    parser.add_argument('--val-split', type=float, default=0.2,
                       help='Proporção dos dados para validação')

    args = parser.parse_args()

    print("🎸 MusicTutor - Treinamento de IA")
    print("=" * 40)

    try:
        # Carregar dados
        X, y, chord_vocab = load_training_data(args.data)

        # Dividir dados
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=args.test_split + args.val_split, random_state=42
        )

        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=args.test_split/(args.test_split + args.val_split),
            random_state=42
        )

        print(f"📊 Divisão dos dados:")
        print(f"   Treino: {X_train.shape[0]} amostras")
        print(f"   Validação: {X_val.shape[0]} amostras")
        print(f"   Teste: {X_test.shape[0]} amostras")

        # Criar modelo
        input_shape = (X_train.shape[1],)
        num_classes = len(chord_vocab)

        model = ChordDetectionModel(input_shape, num_classes)
        model.build_model()

        print("\n📋 Resumo do Modelo:")
        model.model.summary()

        # Treinar
        history = model.train(
            X_train, y_train, X_val, y_val,
            epochs=args.epochs,
            batch_size=args.batch_size,
            save_path=args.model_dir
        )

        # Avaliar
        results = model.evaluate(X_test, y_test)

        # Plotar histórico
        model.plot_training_history(history, args.model_dir)

        # Salvar métricas
        metrics = {
            'training_config': {
                'epochs': args.epochs,
                'batch_size': args.batch_size,
                'data_splits': {
                    'train': len(X_train),
                    'val': len(X_val),
                    'test': len(X_test)
                }
            },
            'final_metrics': results,
            'chord_vocabulary': chord_vocab.tolist(),
            'model_summary': {
                'input_shape': input_shape,
                'num_classes': num_classes,
                'parameters': model.model.count_params()
            }
        }

        with open(f"{args.model_dir}/training_metrics.json", 'w') as f:
            json.dump(metrics, f, indent=2)

        print("
🎉 Treinamento concluído!"        print(f"💾 Modelo salvo em: {args.model_dir}")
        print(".2f"        print(".2f"        print(".2f"
        print("
🌐 Para usar no navegador:"        print(f"   1. Copie {args.model_dir}/web_model/ para public/models/")
        print("   2. Atualize o caminho no ChordDetectionAIService.ts"
        print("   3. Teste no dashboard: http://localhost:3007/training"

    except Exception as e:
        print(f"❌ Erro durante treinamento: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()