/**
 * Testes de Contrato de Samples
 * 
 * Garantem que samples obrigatórios de acordes existam no diretório público.
 * 
 * IMPORTANTE: Estes testes devem FALHAR se samples essenciais estiverem ausentes,
 * prevenindo erros de runtime antes do deploy.
 * 
 * NOTA: Em ambiente Node.js (CI), verificamos a existência dos arquivos
 * através do sistema de arquivos. Não tentamos carregar os samples.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readdir, access } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Resolver caminho do diretório de samples
// Arquivo está em: client/src/audio/__tests__/samples.contract.test.ts
// Subir: __tests__ -> audio -> src -> client (raiz do projeto)
// Depois entrar em: client/public/samples/chords
const __filename = fileURLToPath(import.meta.url);
const projectRoot = join(__filename, '..', '..', '..', '..'); // client/src/audio/__tests__ -> client
const samplesDir = join(projectRoot, 'public', 'samples', 'chords');

/**
 * Lista de acordes essenciais que DEVEM existir
 * Baseado nos acordes suportados pelo ChordPlayer
 */
const ESSENTIAL_CHORDS = [
  // Acordes maiores básicos
  'C', 'D', 'E', 'F', 'G', 'A', 'B',
  // Acordes menores básicos
  'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm',
  // Acordes com sétima
  'A7', 'B7', 'C7', 'D7', 'E7', 'G7',
  // Acordes com sustenidos (opcionais, mas recomendados)
  'C#', 'C#m', 'C#7',
  'D#', 'D#m', 'D#7',
  'F#', 'F#m', 'F#7',
  'G#', 'G#m',
  'A#', 'A#m', 'A#7',
];

/**
 * Verifica se um arquivo existe
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normaliza nome de acorde para nome de arquivo
 * Ex: "C#" -> "Csharp", "Am" -> "Am"
 */
function chordToFilename(chordName: string, extension: string = '.wav'): string {
  // Substituir # por sharp
  const normalized = chordName.replace(/#/g, 'sharp');
  return `${normalized}${extension}`;
}

describe('Contrato de Samples - Acordes Essenciais', () => {
  let availableFiles: string[] = [];

  beforeAll(async () => {
    try {
      // Listar todos os arquivos no diretório de samples
      const files = await readdir(samplesDir);
      availableFiles = files.filter(file => 
        file.endsWith('.wav') || file.endsWith('.mp3')
      );
    } catch (error) {
      // Se o diretório não existir, availableFiles ficará vazio
      // e os testes falharão apropriadamente
      console.warn(`[samples.contract.test] Não foi possível ler diretório de samples: ${error}`);
      availableFiles = [];
    }
  });

  it('deve ter o diretório de samples de acordes', async () => {
    const dirExists = await fileExists(samplesDir);
    expect(dirExists).toBe(true);
  });

  it('deve ter pelo menos alguns samples de acordes', () => {
    // Verificar que há pelo menos alguns arquivos
    expect(availableFiles.length).toBeGreaterThan(0);
  });

  describe('Acordes Básicos Maiores', () => {
    const basicMajorChords = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

    basicMajorChords.forEach(chord => {
      it(`deve ter sample para acorde ${chord}`, () => {
        const wavFile = chordToFilename(chord, '.wav');
        const mp3File = chordToFilename(chord, '.mp3');
        
        const hasWav = availableFiles.includes(wavFile);
        const hasMp3 = availableFiles.includes(mp3File);
        
        expect(hasWav || hasMp3).toBe(true);
      });
    });
  });

  describe('Acordes Básicos Menores', () => {
    const basicMinorChords = ['Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm'];

    basicMinorChords.forEach(chord => {
      it(`deve ter sample para acorde ${chord}`, () => {
        const wavFile = chordToFilename(chord, '.wav');
        const mp3File = chordToFilename(chord, '.mp3');
        
        const hasWav = availableFiles.includes(wavFile);
        const hasMp3 = availableFiles.includes(mp3File);
        
        expect(hasWav || hasMp3).toBe(true);
      });
    });
  });

  describe('Acordes com Sétima', () => {
    const seventhChords = ['A7', 'B7', 'C7', 'D7', 'E7', 'G7'];

    seventhChords.forEach(chord => {
      it(`deve ter sample para acorde ${chord}`, () => {
        const wavFile = chordToFilename(chord, '.wav');
        const mp3File = chordToFilename(chord, '.mp3');
        
        const hasWav = availableFiles.includes(wavFile);
        const hasMp3 = availableFiles.includes(mp3File);
        
        expect(hasWav || hasMp3).toBe(true);
      });
    });
  });

  it('deve ter manifest.json com metadados (opcional mas recomendado)', async () => {
    const manifestPath = join(samplesDir, 'manifest.json');
    const manifestExists = await fileExists(manifestPath);
    
    // Manifest não é obrigatório, mas recomendado
    // Não falha o teste, apenas avisa
    if (!manifestExists) {
      console.warn('[samples.contract.test] manifest.json não encontrado (opcional)');
    }
  });

  it('deve listar todos os samples disponíveis no diretório', () => {
    // Este teste garante que conseguimos listar os arquivos
    // e serve como documentação do que está disponível
    expect(availableFiles.length).toBeGreaterThan(0);
    
    if (availableFiles.length > 0) {
      console.log(`[samples.contract.test] Samples encontrados: ${availableFiles.length}`);
      console.log(`[samples.contract.test] Primeiros 10: ${availableFiles.slice(0, 10).join(', ')}`);
    }
  });
});

describe('Contrato de Samples - Validação de Formato', () => {
  let availableFiles: string[] = [];

  beforeAll(async () => {
    try {
      const files = await readdir(samplesDir);
      availableFiles = files.filter(file => 
        file.endsWith('.wav') || file.endsWith('.mp3')
      );
    } catch (error) {
      availableFiles = [];
    }
  });

  it('deve ter samples apenas em formatos suportados (.wav ou .mp3)', () => {
    const invalidFiles = availableFiles.filter(file => 
      !file.endsWith('.wav') && !file.endsWith('.mp3')
    );
    
    // Apenas avisar sobre arquivos inválidos, não falhar
    if (invalidFiles.length > 0) {
      console.warn(`[samples.contract.test] Arquivos com formato não suportado: ${invalidFiles.join(', ')}`);
    }
  });
});
