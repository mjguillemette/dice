/**
 * Utility to generate placeholder audio files for testing
 * These are simple synthesized sounds that don't require actual audio files
 */

/**
 * Generate a simple tone with envelope
 */
function generateTone(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  attack: number = 0.01,
  decay: number = 0.1,
  sustain: number = 0.7,
  release: number = 0.1
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  const attackSamples = Math.floor(attack * sampleRate);
  const decaySamples = Math.floor(decay * sampleRate);
  const releaseSamples = Math.floor(release * sampleRate);
  const sustainSamples = length - attackSamples - decaySamples - releaseSamples;

  for (let i = 0; i < length; i++) {
    let amplitude = 1.0;

    // Envelope
    if (i < attackSamples) {
      // Attack
      amplitude = i / attackSamples;
    } else if (i < attackSamples + decaySamples) {
      // Decay
      const decayProgress = (i - attackSamples) / decaySamples;
      amplitude = 1.0 - (1.0 - sustain) * decayProgress;
    } else if (i < attackSamples + decaySamples + sustainSamples) {
      // Sustain
      amplitude = sustain;
    } else {
      // Release
      const releaseProgress = (i - attackSamples - decaySamples - sustainSamples) / releaseSamples;
      amplitude = sustain * (1.0 - releaseProgress);
    }

    // Generate waveform
    const t = i / sampleRate;
    let sample = 0;

    switch (type) {
      case 'sine':
        sample = Math.sin(2 * Math.PI * frequency * t);
        break;
      case 'square':
        sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
        break;
      case 'sawtooth':
        sample = 2 * ((frequency * t) % 1) - 1;
        break;
      case 'triangle':
        sample = 4 * Math.abs((frequency * t) % 1 - 0.5) - 1;
        break;
    }

    data[i] = sample * amplitude * 0.3; // Scale down to prevent clipping
  }

  return buffer;
}

/**
 * Generate all placeholder sounds and return as data URIs
 */
export async function createPlaceholderSounds(audioContext: AudioContext): Promise<Map<string, AudioBuffer>> {
  const sounds = new Map<string, AudioBuffer>();

  // === DICE COLLISION SOUNDS ===
  // Wood impact - low frequency thud with slight resonance
  const woodBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.15, audioContext.sampleRate);
  const woodData = woodBuffer.getChannelData(0);
  for (let i = 0; i < woodBuffer.length; i++) {
    const t = i / audioContext.sampleRate;
    const envelope = Math.exp(-t * 15); // Decay envelope
    const noise = (Math.random() * 2 - 1) * 0.3;
    const tone = Math.sin(2 * Math.PI * 120 * t) * 0.2; // Low frequency component
    woodData[i] = (noise * 0.7 + tone * 0.3) * envelope;
  }
  sounds.set('/sounds/dice/wood.mp3', woodBuffer);

  // Table impact - crisp mid frequency tap
  const tableBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.08, audioContext.sampleRate);
  const tableData = tableBuffer.getChannelData(0);
  for (let i = 0; i < tableBuffer.length; i++) {
    const t = i / audioContext.sampleRate;
    const envelope = Math.exp(-t * 25); // Fast decay
    const noise = (Math.random() * 2 - 1) * 0.25;
    const tone = Math.sin(2 * Math.PI * 200 * t) * 0.15; // Mid frequency
    tableData[i] = (noise * 0.8 + tone * 0.2) * envelope;
  }
  sounds.set('/sounds/dice/table.mp3', tableBuffer);

  // Dice-to-dice collision - high frequency click/clack
  const diceBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.06, audioContext.sampleRate);
  const diceData = diceBuffer.getChannelData(0);
  for (let i = 0; i < diceBuffer.length; i++) {
    const t = i / audioContext.sampleRate;
    const envelope = Math.exp(-t * 40); // Very fast decay for plastic click
    const noise = (Math.random() * 2 - 1) * 0.3;
    const tone = Math.sin(2 * Math.PI * 800 * t) * 0.1; // Higher pitch
    diceData[i] = (noise * 0.9 + tone * 0.1) * envelope;
  }
  sounds.set('/sounds/dice/dice.mp3', diceBuffer);

  // === UI SOUNDS ===
  // Click - short beep
  sounds.set('/sounds/ui/click.mp3', generateTone(audioContext, 800, 0.08, 'sine', 0.01, 0.02, 0.5, 0.05));

  // Hover - subtle tone
  sounds.set('/sounds/ui/hover.mp3', generateTone(audioContext, 600, 0.05, 'sine', 0.01, 0.01, 0.6, 0.03));

  // Item hover - very subtle, high frequency
  sounds.set('/sounds/ui/itemhover.mp3', generateTone(audioContext, 1200, 0.04, 'sine', 0.005, 0.01, 0.3, 0.025));

  // Item select - pleasant confirm tone
  const itemSelectBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.12, audioContext.sampleRate);
  const itemSelectData = itemSelectBuffer.getChannelData(0);
  for (let i = 0; i < itemSelectBuffer.length; i++) {
    const t = i / audioContext.sampleRate;
    const freq = t < 0.06 ? 600 : 750; // Two-tone chirp
    const envelope = Math.max(0, 1 - t / 0.12);
    itemSelectData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
  }
  sounds.set('/sounds/ui/itemselect.mp3', itemSelectBuffer);

  // Success - rising two-tone
  const successBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate);
  const successData = successBuffer.getChannelData(0);
  for (let i = 0; i < successBuffer.length; i++) {
    const t = i / audioContext.sampleRate;
    const freq = 600 + (t / 0.2) * 200; // Rise from 600Hz to 800Hz
    const envelope = Math.max(0, 1 - t / 0.2);
    successData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
  }
  sounds.set('/sounds/ui/success.mp3', successBuffer);

  // Error - falling tone
  const errorBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.15, audioContext.sampleRate);
  const errorData = errorBuffer.getChannelData(0);
  for (let i = 0; i < errorBuffer.length; i++) {
    const t = i / audioContext.sampleRate;
    const freq = 400 - (t / 0.15) * 100; // Fall from 400Hz to 300Hz
    const envelope = Math.max(0, 1 - t / 0.15);
    errorData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
  }
  sounds.set('/sounds/ui/error.mp3', errorBuffer);

  // Score achieved - quick rising arpeggio
  const scoreBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate);
  const scoreData = scoreBuffer.getChannelData(0);
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  for (let i = 0; i < scoreBuffer.length; i++) {
    const t = i / audioContext.sampleRate;
    const noteIndex = Math.min(Math.floor(t / 0.1), 2);
    const freq = notes[noteIndex];
    const envelope = Math.max(0, 1 - (t % 0.1) / 0.1);
    scoreData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.25;
  }
  sounds.set('/sounds/ui/score.mp3', scoreBuffer);

  // Money gain - coin sound (two quick tones)
  const moneyBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.15, audioContext.sampleRate);
  const moneyData = moneyBuffer.getChannelData(0);
  for (let i = 0; i < moneyBuffer.length; i++) {
    const t = i / audioContext.sampleRate;
    const freq1 = 1000;
    const freq2 = 1200;
    const mix = t < 0.075 ? 1 : 0;
    const envelope = Math.max(0, 1 - (t % 0.075) / 0.075);
    const sample = mix * Math.sin(2 * Math.PI * freq1 * t) + (1 - mix) * Math.sin(2 * Math.PI * freq2 * t);
    moneyData[i] = sample * envelope * 0.25;
  }
  sounds.set('/sounds/ui/money.mp3', moneyBuffer);

  // End of day - atmospheric bell/chime sequence
  const endOfDayBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 1.5, audioContext.sampleRate);
  const endOfDayData = endOfDayBuffer.getChannelData(0);
  const bellFreqs = [440, 554.37, 659.25]; // A4, C#5, E5 (minor chord)
  for (let i = 0; i < endOfDayBuffer.length; i++) {
    const t = i / audioContext.sampleRate;
    let sample = 0;

    // Three bells in sequence
    for (let b = 0; b < bellFreqs.length; b++) {
      const bellStart = b * 0.3;
      const bellTime = t - bellStart;
      if (bellTime >= 0 && bellTime < 1.0) {
        const envelope = Math.exp(-bellTime * 2); // Slow decay for bell resonance
        sample += Math.sin(2 * Math.PI * bellFreqs[b] * bellTime) * envelope * 0.2;
        // Add harmonics for richer bell sound
        sample += Math.sin(2 * Math.PI * bellFreqs[b] * 2 * bellTime) * envelope * 0.1;
        sample += Math.sin(2 * Math.PI * bellFreqs[b] * 3 * bellTime) * envelope * 0.05;
      }
    }

    endOfDayData[i] = sample;
  }
  sounds.set('/sounds/ui/endofday.mp3', endOfDayBuffer);

  console.log('🎵 Generated placeholder sounds:', sounds.size);
  return sounds;
}
