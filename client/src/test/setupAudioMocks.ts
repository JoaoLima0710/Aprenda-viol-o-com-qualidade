
import { vi } from 'vitest';

/**
 * Mock profissional de AudioContext para Vitest + jsdom
 * Compatível com AudioEngine, AudioBus, Mixer, Analyzer e WebAudio API
 */

class MockAudioNode {
	connect = vi.fn(() => this);
	disconnect = vi.fn();
}

class MockGainNode extends MockAudioNode {
	gain = { value: 1 };
}

class MockOscillatorNode extends MockAudioNode {
	frequency = { value: 440 };
	type: OscillatorType = 'sine';
	start = vi.fn();
	stop = vi.fn();
}

class MockAnalyserNode extends MockAudioNode {
	fftSize = 2048;
	getByteFrequencyData = vi.fn();
	getByteTimeDomainData = vi.fn();
}

class MockAudioBuffer {
	duration = 1;
	sampleRate = 44100;
	getChannelData = vi.fn(() => new Float32Array(44100));
}

class MockAudioBufferSourceNode extends MockAudioNode {
	buffer: AudioBuffer | null = null;
	start = vi.fn();
	stop = vi.fn();
}

class MockDynamicsCompressorNode extends MockAudioNode {
	threshold = { value: -24 };
	knee = { value: 30 };
	ratio = { value: 12 };
	attack = { value: 0.003 };
	release = { value: 0.25 };
}

class MockAudioContext {
	state: AudioContextState = 'running';
	currentTime = 0;
	destination = new MockAudioNode();

	resume = vi.fn(async () => {
		this.state = 'running';
	});

	suspend = vi.fn(async () => {
		this.state = 'suspended';
	});

	close = vi.fn(async () => {
		this.state = 'closed';
	});

	createGain() {
		return new MockGainNode();
	}

	createOscillator() {
		return new MockOscillatorNode();
	}

	createAnalyser() {
		return new MockAnalyserNode();
	}

	createBuffer(
		numberOfChannels: number,
		length: number,
		sampleRate: number
	) {
		return new MockAudioBuffer();
	}

	createBufferSource() {
		return new MockAudioBufferSourceNode();
	}

	createDynamicsCompressor() {
		return new MockDynamicsCompressorNode();
	}
}

/**
 * Mock global — precisa existir ANTES de qualquer import do AudioEngine
 */
vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext);
