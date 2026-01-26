import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_DEPS = [
  "tone",
  "soundfont-player",
  "@tensorflow/tfjs",
  "@tensorflow/tfjs-converter"
];

const lockfilePath = path.join(__dirname, '..', 'pnpm-lock.yaml');

if (!fs.existsSync(lockfilePath)) {
  console.error('❌ pnpm-lock.yaml not found');
  process.exit(1);
}

const lockfileContent = fs.readFileSync(lockfilePath, 'utf-8');

for (const dep of AUDIO_DEPS) {
  if (!lockfileContent.includes(dep)) {
    console.error(`❌ Missing audio dependency: ${dep}`);
    process.exit(1);
  }
}

console.log('✅ Audio dependencies OK');
