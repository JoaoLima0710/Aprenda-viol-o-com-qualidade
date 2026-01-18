import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extende os matchers do Jest DOM
expect.extend(matchers);

// Limpa após cada teste
afterEach(() => {
  cleanup();
  // Limpa localStorage
  localStorage.clear();
  // Limpa mocks
  vi.clearAllMocks();
});

// Mock de navigator.mediaDevices.getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn(() => [
        { stop: vi.fn() }
      ])
    })
  },
  writable: true
});

// Mock de AudioContext
global.AudioContext = vi.fn().mockImplementation(() => ({
  createAnalyser: vi.fn(),
  createGain: vi.fn(),
  createOscillator: vi.fn(),
  destination: {},
  state: 'running'
}));

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock de console methods para reduzir noise nos testes
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock de performance.now
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),
};

// Mock de requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn(id => clearTimeout(id));

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));