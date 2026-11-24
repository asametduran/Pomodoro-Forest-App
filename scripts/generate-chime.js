// Generates assets/sounds/chime.wav: a soft two-note bell (mono, 16-bit PCM, 22.05 kHz).
// Run with: node scripts/generate-chime.js
const fs = require('fs');
const path = require('path');

const sampleRate = 22050;
const notes = [
  { freq: 659.25, start: 0.0, length: 1.2 }, // E5
  { freq: 880.0, start: 0.28, length: 1.5 }, // A5
];
const totalSeconds = 1.9;
const samples = new Int16Array(Math.floor(sampleRate * totalSeconds));

for (const { freq, start, length } of notes) {
  const offset = Math.floor(start * sampleRate);
  const count = Math.floor(length * sampleRate);
  for (let i = 0; i < count && offset + i < samples.length; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, t / 0.01);
    const decay = Math.exp(-3.2 * t);
    const tone =
      Math.sin(2 * Math.PI * freq * t) +
      0.35 * Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-5 * t) +
      0.12 * Math.sin(2 * Math.PI * freq * 3.01 * t) * Math.exp(-8 * t);
    const value = tone * attack * decay * 0.32;
    samples[offset + i] = Math.max(-32767, Math.min(32767, samples[offset + i] + value * 32767));
  }
}

const dataSize = samples.length * 2;
const buffer = Buffer.alloc(44 + dataSize);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);
for (let i = 0; i < samples.length; i++) buffer.writeInt16LE(samples[i], 44 + i * 2);

const out = path.join(__dirname, '..', 'assets', 'sounds', 'chime.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buffer);
console.log(`Wrote ${out} (${buffer.length} bytes)`);
