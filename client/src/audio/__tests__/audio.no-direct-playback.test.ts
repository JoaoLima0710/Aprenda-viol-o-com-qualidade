/**
 * Teste de arquitetura: Previne uso direto de AudioBufferSourceNode e OscillatorNode
 * 
 * Este teste verifica que nenhum código fora do AudioBus cria ou inicia
 * AudioBufferSourceNode ou OscillatorNode diretamente.
 * 
 * IMPORTANTE: Este teste garante que toda criação e inicialização de nodes
 * passa pelo AudioBus, mantendo a arquitetura centralizada.
 * 
 * EXCEÇÕES DOCUMENTADAS:
 * - AudioEngine.ts: Usa createBufferSource() para unlock de áudio em iOS (caso especial)
 * 
 * VIOLAÇÕES CONHECIDAS (precisam ser refatoradas):
 * - MetronomeEngine.ts: Deve usar AudioBus.playBuffer() em vez de createBufferSource()
 * - ScalePlayer.ts: Deve usar AudioBus.playOscillator() em vez de createOscillator()
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

// Diretório a ser verificado
const AUDIO_DIR = join(process.cwd(), 'client/src/audio');

// Arquivos permitidos para criar nodes diretamente
const ALLOWED_FILES = [
  'AudioBus.ts',
  'AudioBus.js',
  // AudioEngine precisa criar source para unlock de áudio (caso especial)
  'AudioEngine.ts',
  'AudioEngine.js',
];

// Extensões de arquivo a verificar
const FILE_EXTENSIONS = ['.ts', '.js', '.tsx', '.jsx'];

// Padrões proibidos (fora do AudioBus)
const FORBIDDEN_PATTERNS = [
  // Criação direta de AudioBufferSourceNode
  {
    pattern: /\.createBufferSource\s*\(/,
    description: 'createBufferSource() chamado diretamente',
    allowedIn: ALLOWED_FILES,
  },
  // Inicialização direta de source
  {
    pattern: /(?:source|bufferSource|audioSource)\.start\s*\(/,
    description: 'source.start() chamado diretamente',
    allowedIn: ALLOWED_FILES,
  },
  // Criação direta de OscillatorNode
  {
    pattern: /\.createOscillator\s*\(/,
    description: 'createOscillator() chamado diretamente',
    allowedIn: ALLOWED_FILES,
  },
  // Inicialização direta de oscillator
  {
    pattern: /oscillator\.start\s*\(/,
    description: 'oscillator.start() chamado diretamente',
    allowedIn: ALLOWED_FILES,
  },
];

/**
 * Recursivamente lê todos os arquivos em um diretório
 */
function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Pular diretórios de teste e node_modules
      if (file !== '__tests__' && file !== 'node_modules' && !file.startsWith('.')) {
        getAllFiles(filePath, fileList);
      }
    } else if (FILE_EXTENSIONS.includes(extname(file))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Verifica se um arquivo está na lista de permitidos
 */
function isAllowedFile(filePath: string): boolean {
  const fileName = filePath.split(/[/\\]/).pop() || '';
  return ALLOWED_FILES.some(allowed => fileName === allowed || fileName.endsWith(allowed));
}

describe('Arquitetura: Prevenção de uso direto de AudioNodes', () => {
  it('prevents direct AudioBufferSourceNode usage', () => {
    const files = getAllFiles(AUDIO_DIR);
    const violations: Array<{ file: string; pattern: string; line: number; content: string }> = [];

    files.forEach((filePath) => {
      // Pular arquivos permitidos
      if (isAllowedFile(filePath)) {
        return;
      }

      try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          FORBIDDEN_PATTERNS.forEach(({ pattern, description }) => {
            if (pattern.test(line)) {
              // Verificar se não está em um comentário
              const commentIndex = line.indexOf('//');
              const patternIndex = line.search(pattern);
              
              if (patternIndex !== -1 && (commentIndex === -1 || patternIndex < commentIndex)) {
                violations.push({
                  file: filePath.replace(process.cwd() + '/', ''),
                  pattern: description,
                  line: index + 1,
                  content: line.trim(),
                });
              }
            }
          });
        });
      } catch (error) {
        // Ignorar erros de leitura (arquivos que podem não existir)
        console.warn(`Could not read file ${filePath}:`, error);
      }
    });

    if (violations.length > 0) {
      const violationMessages = violations.map(
        (v) => `  ${v.file}:${v.line} - ${v.pattern}\n    ${v.content}`
      );
      
      const errorMessage = 
        `Found ${violations.length} violation(s) of direct AudioNode usage:\n${violationMessages.join('\n')}\n\n` +
        `All AudioNode creation and initialization must go through AudioBus.\n\n` +
        `To fix:\n` +
        `- Replace createBufferSource() with AudioBus.playBuffer()\n` +
        `- Replace createOscillator() with AudioBus.playOscillator()\n` +
        `- Replace source.start() / oscillator.start() with AudioBus methods\n\n` +
        `See: client/src/audio/__tests__/README.md for architecture guidelines.`;
      
      expect.fail(errorMessage);
    }

    // Se chegou aqui, não há violações
    expect(violations.length).toBe(0);
  });

  it('prevents direct OscillatorNode usage', () => {
    // Este teste está coberto pelo teste anterior, mas mantemos para clareza
    const files = getAllFiles(AUDIO_DIR);
    const oscillatorViolations: Array<{ file: string; line: number; content: string }> = [];

    files.forEach((filePath) => {
      if (isAllowedFile(filePath)) {
        return;
      }

      try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Verificar createOscillator
          if (/\.createOscillator\s*\(/.test(line)) {
            const commentIndex = line.indexOf('//');
            const patternIndex = line.search(/\.createOscillator\s*\(/);
            
            if (patternIndex !== -1 && (commentIndex === -1 || patternIndex < commentIndex)) {
              oscillatorViolations.push({
                file: filePath.replace(process.cwd() + '/', ''),
                line: index + 1,
                content: line.trim(),
              });
            }
          }

          // Verificar oscillator.start()
          if (/oscillator\.start\s*\(/.test(line)) {
            const commentIndex = line.indexOf('//');
            const patternIndex = line.search(/oscillator\.start\s*\(/);
            
            if (patternIndex !== -1 && (commentIndex === -1 || patternIndex < commentIndex)) {
              oscillatorViolations.push({
                file: filePath.replace(process.cwd() + '/', ''),
                line: index + 1,
                content: line.trim(),
              });
            }
          }
        });
      } catch (error) {
        console.warn(`Could not read file ${filePath}:`, error);
      }
    });

    if (oscillatorViolations.length > 0) {
      const violationMessages = oscillatorViolations.map(
        (v) => `  ${v.file}:${v.line}\n    ${v.content}`
      );
      
      const errorMessage = 
        `Found ${oscillatorViolations.length} violation(s) of direct OscillatorNode usage:\n${violationMessages.join('\n')}\n\n` +
        `All OscillatorNode creation and initialization must go through AudioBus.\n\n` +
        `To fix:\n` +
        `- Replace createOscillator() with AudioBus.playOscillator()\n` +
        `- Replace oscillator.start() with AudioBus.playOscillator()\n\n` +
        `See: client/src/audio/__tests__/README.md for architecture guidelines.`;
      
      expect.fail(errorMessage);
    }

    expect(oscillatorViolations.length).toBe(0);
  });
});
