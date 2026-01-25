"""
Script para converter arquivos MIDI do diretório 'Gimme All Your Chords' para MP3
e copiar para client/public/samples/chords/ com os nomes corretos.

REQUISITOS:
- pip install midi2audio
- FluidSynth instalado no sistema (para Windows: baixar de https://www.fluidsynth.org/)

USO:
python convert_midi_to_mp3.py
"""

import os
import shutil
from pathlib import Path

# Mapeamento de nomes de acordes MIDI para nomes esperados pelo ChordPlayer
CHORD_NAME_MAPPING = {
    # Acordes maiores
    'C': 'C',
    'C ': 'C',  # C com espaço
    'D': 'D',
    'E': 'E',
    'F': 'F',
    'G': 'G',
    'A': 'A',
    'B': 'B',
    # Acordes menores
    'Cmin': 'Cm',
    'Dmin': 'Dm',
    'Emin': 'Em',
    'Fmin': 'Fm',
    'Gmin': 'Gm',
    'Amin': 'Am',
    'Bmin': 'Bm',
    # Acordes com sétima
    'C7': 'C7',
    'D7': 'D7',
    'E7': 'E7',
    'F7': 'F7',
    'G7': 'G7',
    'A7': 'A7',
    'B7': 'B7',
    # Acordes com sustenidos - maiores
    'C#': 'C#',
    'D#': 'D#',
    'F#': 'F#',
    'G#': 'G#',
    'A#': 'A#',
    # Acordes com sustenidos - menores
    'C#min': 'C#m',
    'D#min': 'D#m',
    'F#min': 'F#m',
    'G#min': 'G#m',
    'A#min': 'A#m',
    # Acordes com sustenidos - sétima
    'C#7': 'C#7',
    'D#7': 'D#7',
    'F#7': 'F#7',
    'A#7': 'A#7',
}

def normalize_chord_name(midi_name: str) -> str:
    """Normaliza nome do acorde do MIDI para o formato esperado pelo ChordPlayer"""
    # Remove extensão
    name = midi_name.replace('.mid', '').strip()
    
    # Aplica mapeamento
    if name in CHORD_NAME_MAPPING:
        return CHORD_NAME_MAPPING[name]
    
    # Fallback: retorna o nome original (pode precisar ajuste manual)
    return name

def convert_midi_to_mp3(midi_path: Path, output_path: Path):
    """Converte um arquivo MIDI para MP3 usando midi2audio"""
    try:
        from midi2audio import FluidSynth
        
        # Usar soundfont padrão (pode precisar ajuste)
        fs = FluidSynth()
        fs.midi_to_audio(str(midi_path), str(output_path))
        return True
    except ImportError:
        print("ERRO: midi2audio não instalado. Execute: pip install midi2audio")
        return False
    except Exception as e:
        print(f"ERRO ao converter {midi_path.name}: {e}")
        return False

def main():
    source_dir = Path(r"C:\Users\Joao\Desktop\Gimme All Your Chords (Vol. 1)\Gimme All Your Chords (Vol. 1)")
    target_dir = Path("client/public/samples/chords")
    
    if not source_dir.exists():
        print(f"ERRO: Diretório de origem não encontrado: {source_dir}")
        return
    
    # Criar diretório de destino se não existir
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # Processar cada pasta de acorde
    converted = 0
    skipped = 0
    
    for chord_folder in source_dir.iterdir():
        if not chord_folder.is_dir() or chord_folder.name.startswith('.'):
            continue
        
        # Encontrar arquivo principal do acorde (ex: C.mid, Amin.mid)
        main_midi = None
        for midi_file in chord_folder.glob("*.mid"):
            name = midi_file.stem.strip()
            # Priorizar arquivo principal (sem sufixos como 6, 7, 9, etc.)
            if name == chord_folder.name or name in ['C ', 'C']:
                main_midi = midi_file
                break
        
        # Se não encontrou principal, pegar o primeiro
        if not main_midi:
            midi_files = list(chord_folder.glob("*.mid"))
            if midi_files:
                main_midi = midi_files[0]
        
        if not main_midi:
            print(f"AVISO: Nenhum arquivo MIDI encontrado em {chord_folder.name}")
            continue
        
        # Normalizar nome do acorde
        chord_name = normalize_chord_name(main_midi.stem)
        output_file = target_dir / f"{chord_name}.mp3"
        
        # Verificar se já existe
        if output_file.exists():
            print(f"PULADO: {chord_name}.mp3 já existe")
            skipped += 1
            continue
        
        # Converter
        print(f"Convertendo: {main_midi.name} -> {chord_name}.mp3")
        if convert_midi_to_mp3(main_midi, output_file):
            converted += 1
        else:
            skipped += 1
    
    print(f"\n✅ Conversão concluída: {converted} arquivos convertidos, {skipped} pulados")

if __name__ == "__main__":
    main()
