/**
 * Audio System
 *
 * Provides a centralized, scalable audio management system with:
 * - Sound categories (SFX, UI, Ambient, Music)
 * - Volume controls per category
 * - 3D positional audio support
 * - Sound pooling for performance
 * - Collision event integration
 * - Easy-to-use hook API
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { createPlaceholderSounds } from '../utils/generatePlaceholderSounds';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SoundCategory = 'sfx' | 'ui' | 'ambient' | 'music';

export interface SoundConfig {
  /** Sound file path relative to /public */
  src: string;
  /** Volume (0-1) */
  volume?: number;
  /** Whether to loop */
  loop?: boolean;
  /** Sound category for volume control */
  category?: SoundCategory;
  /** Playback rate (pitch) */
  playbackRate?: number;
  /** For 3D sounds: reference distance */
  refDistance?: number;
  /** For 3D sounds: max distance */
  maxDistance?: number;
  /** For 3D sounds: rolloff factor */
  rolloffFactor?: number;
}

export interface CollisionSoundConfig extends SoundConfig {
  /** Minimum velocity to trigger sound */
  minVelocity?: number;
  /** Maximum velocity for volume scaling */
  maxVelocity?: number;
  /** Cooldown between plays (ms) */
  cooldown?: number;
}

// ============================================================================
// SOUND REGISTRY
// ============================================================================

/**
 * Central registry of all game sounds
 * Add new sounds here for easy management
 */
export const SOUNDS = {
  // === DICE COLLISION SOUNDS ===
  dice: {
    wood: { src: '/sounds/dice/wood.mp3', category: 'sfx' as SoundCategory, volume: 0.5 },
    table: { src: '/sounds/dice/table.mp3', category: 'sfx' as SoundCategory, volume: 0.4 },
    dice: { src: '/sounds/dice/dice.mp3', category: 'sfx' as SoundCategory, volume: 0.3 },
  },

  // === UI SOUNDS ===
  ui: {
    click: { src: '/sounds/ui/click.mp3', category: 'ui' as SoundCategory, volume: 0.6 },
    hover: { src: '/sounds/ui/hover.mp3', category: 'ui' as SoundCategory, volume: 0.15 },
    itemHover: { src: '/sounds/ui/itemhover.mp3', category: 'ui' as SoundCategory, volume: 0.1 },
    itemSelect: { src: '/sounds/ui/itemselect.mp3', category: 'ui' as SoundCategory, volume: 0.4 },
    success: { src: '/sounds/ui/success.mp3', category: 'ui' as SoundCategory, volume: 0.7 },
    error: { src: '/sounds/ui/error.mp3', category: 'ui' as SoundCategory, volume: 0.5 },
    score: { src: '/sounds/ui/score.mp3', category: 'ui' as SoundCategory, volume: 0.6 },
    moneyGain: { src: '/sounds/ui/money.mp3', category: 'ui' as SoundCategory, volume: 0.5 },
    endOfDay: { src: '/sounds/ui/endofday.mp3', category: 'ui' as SoundCategory, volume: 0.7 },
  },

  // === COMBAT SOUNDS ===
  combat: {
    slash: { src: '/sounds/combat/slash.mp3', category: 'sfx' as SoundCategory, volume: 0.6 },
    hit: { src: '/sounds/combat/hit.mp3', category: 'sfx' as SoundCategory, volume: 0.5 },
  },

  // === AMBIENT SOUNDS ===
  ambient: {
    room: { src: '/sounds/ambient/room.mp3', category: 'ambient' as SoundCategory, volume: 0.2, loop: true },
    rain: { src: '/sounds/ambient/rain.mp3', category: 'ambient' as SoundCategory, volume: 0.3, loop: true },
    wind: { src: '/sounds/ambient/wind.mp3', category: 'ambient' as SoundCategory, volume: 0.25, loop: true },
  },

  // === MUSIC ===
  music: {
    menu: { src: '/sounds/music/menu.mp3', category: 'music' as SoundCategory, volume: 0.4, loop: true },
    gameplay: { src: '/sounds/music/gameplay.mp3', category: 'music' as SoundCategory, volume: 0.3, loop: true },
  },
} as const;

// ============================================================================
// AUDIO MANAGER (SINGLETON)
// ============================================================================

class AudioManager {
  private static instance: AudioManager;

  private listener: THREE.AudioListener | null = null;
  private audioContext: AudioContext | null = null;
  private loadedBuffers: Map<string, AudioBuffer> = new Map();
  private placeholderBuffers: Map<string, AudioBuffer> = new Map();
  private activeSounds: Map<string, THREE.Audio | THREE.PositionalAudio> = new Map();
  private usePlaceholders: boolean = true; // Use generated sounds by default
  private maxSimultaneousSounds: number = 8; // Limit concurrent sounds for performance
  private activeSoundCount: number = 0;

  // Volume controls per category
  private categoryVolumes: Record<SoundCategory, number> = {
    sfx: 1.0,
    ui: 1.0,
    ambient: 1.0,
    music: 1.0,
  };

  private masterVolume: number = 1.0;
  private muted: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize the audio system with a Three.js listener
   */
  async initialize(listener: THREE.AudioListener) {
    this.listener = listener;
    this.audioContext = THREE.AudioContext.getContext();

    // Generate placeholder sounds
    if (this.usePlaceholders) {
      this.placeholderBuffers = await createPlaceholderSounds(this.audioContext);
      console.log('🔊 Audio system initialized with placeholder sounds');
    } else {
      console.log('🔊 Audio system initialized');
    }
  }

  /**
   * Toggle between placeholder and real sounds
   */
  setUsePlaceholders(use: boolean) {
    this.usePlaceholders = use;
  }

  /**
   * Load an audio file and cache the buffer
   */
  async loadSound(src: string): Promise<AudioBuffer | null> {
    // Check if we should use placeholder
    if (this.usePlaceholders && this.placeholderBuffers.has(src)) {
      return this.placeholderBuffers.get(src)!;
    }

    if (this.loadedBuffers.has(src)) {
      return this.loadedBuffers.get(src)!;
    }

    try {
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      this.loadedBuffers.set(src, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.warn(`Failed to load sound: ${src}`, error);
      // Fall back to placeholder if available
      if (this.placeholderBuffers.has(src)) {
        console.log(`Using placeholder for: ${src}`);
        return this.placeholderBuffers.get(src)!;
      }
      return null;
    }
  }

  /**
   * Play a 2D sound (non-positional)
   */
  async playSound(config: SoundConfig): Promise<THREE.Audio | null> {
    if (!this.listener || this.muted) return null;

    // Limit simultaneous sounds for performance
    if (this.activeSoundCount >= this.maxSimultaneousSounds && config.category === 'sfx') {
      return null;
    }

    const buffer = await this.loadSound(config.src);
    if (!buffer) return null;

    const sound = new THREE.Audio(this.listener);
    sound.setBuffer(buffer);

    const category = config.category || 'sfx';
    const finalVolume = (config.volume || 1.0) * this.categoryVolumes[category] * this.masterVolume;

    sound.setVolume(finalVolume);
    sound.setLoop(config.loop || false);
    sound.setPlaybackRate(config.playbackRate || 1.0);

    sound.play();
    this.activeSoundCount++;

    // Auto-cleanup when finished
    if (!config.loop) {
      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        this.activeSoundCount--;
        sound.disconnect();
      };

      sound.onEnded = cleanup;

      // Fallback timeout in case onEnded doesn't fire (THREE.js bug)
      const duration = buffer.duration || 1.0;
      setTimeout(cleanup, (duration + 0.1) * 1000);
    }

    return sound;
  }

  /**
   * Play a 3D positional sound
   */
  async playPositionalSound(
    config: SoundConfig,
    position: THREE.Vector3
  ): Promise<THREE.PositionalAudio | null> {
    if (!this.listener || this.muted) return null;

    // Limit simultaneous sounds for performance
    if (this.activeSoundCount >= this.maxSimultaneousSounds && config.category === 'sfx') {
      return null;
    }

    const buffer = await this.loadSound(config.src);
    if (!buffer) return null;

    const sound = new THREE.PositionalAudio(this.listener);
    sound.setBuffer(buffer);

    const category = config.category || 'sfx';
    const finalVolume = (config.volume || 1.0) * this.categoryVolumes[category] * this.masterVolume;

    sound.setVolume(finalVolume);
    sound.setLoop(config.loop || false);
    sound.setPlaybackRate(config.playbackRate || 1.0);
    sound.setRefDistance(config.refDistance || 1);
    sound.setMaxDistance(config.maxDistance || 10);
    sound.setRolloffFactor(config.rolloffFactor || 1);

    // Set position
    sound.position.copy(position);

    sound.play();
    this.activeSoundCount++;

    // Auto-cleanup when finished
    if (!config.loop) {
      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        this.activeSoundCount--;
        sound.disconnect();
      };

      sound.onEnded = cleanup;

      // Fallback timeout in case onEnded doesn't fire (THREE.js bug)
      // Collision sounds are very short, so use buffer duration
      const duration = buffer.duration || 0.2;
      setTimeout(cleanup, (duration + 0.05) * 1000);
    }

    return sound;
  }

  /**
   * Stop a specific sound
   */
  stopSound(sound: THREE.Audio | THREE.PositionalAudio) {
    if (sound.isPlaying) {
      sound.stop();
    }
    sound.disconnect();
  }

  /**
   * Stop all sounds in a category
   */
  stopCategory(category: SoundCategory) {
    this.activeSounds.forEach((sound, key) => {
      if (key.startsWith(category)) {
        this.stopSound(sound);
        this.activeSounds.delete(key);
      }
    });
  }

  /**
   * Set volume for a category
   */
  setCategoryVolume(category: SoundCategory, volume: number) {
    this.categoryVolumes[category] = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Mute/unmute all audio
   */
  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.activeSounds.forEach(sound => {
        if (sound.isPlaying) sound.pause();
      });
    } else {
      this.activeSounds.forEach(sound => {
        if (!sound.isPlaying) sound.play();
      });
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      masterVolume: this.masterVolume,
      categoryVolumes: { ...this.categoryVolumes },
      muted: this.muted,
    };
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook to initialize audio system (call once in root component)
 */
export function useAudioSystem(camera: THREE.Camera) {
  useEffect(() => {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    audioManager.initialize(listener);

    return () => {
      camera.remove(listener);
    };
  }, [camera]);
}

/**
 * Hook to play sounds easily from components
 */
export function useSound() {
  const play = useCallback(async (config: SoundConfig) => {
    return audioManager.playSound(config);
  }, []);

  const playPositional = useCallback(async (config: SoundConfig, position: THREE.Vector3) => {
    return audioManager.playPositionalSound(config, position);
  }, []);

  const stop = useCallback((sound: THREE.Audio | THREE.PositionalAudio) => {
    audioManager.stopSound(sound);
  }, []);

  return { play, playPositional, stop };
}

/**
 * Hook for collision sounds with velocity-based volume and cooldown
 * Optimized to reduce overhead and prevent audio spam
 */
export function useCollisionSound(config: CollisionSoundConfig) {
  const lastPlayTime = useRef<number>(0);
  const soundQueueRef = useRef<{ position: THREE.Vector3; velocity: number } | null>(null);
  const { playPositional } = useSound();

  // Memoize the config values to prevent dependency changes
  const cooldown = useMemo(() => config.cooldown || 100, [config.cooldown]);
  const minVel = useMemo(() => config.minVelocity || 0.5, [config.minVelocity]);
  const maxVel = useMemo(() => config.maxVelocity || 10, [config.maxVelocity]);
  const baseVolume = useMemo(() => config.volume || 0.5, [config.volume]);

  const playCollisionSound = useCallback(
    (position: THREE.Vector3, velocity: number) => {
      const now = Date.now();

      // Check minimum velocity (early exit for performance)
      if (velocity < minVel) {
        return;
      }

      // If we're in cooldown, queue the strongest impact
      if (now - lastPlayTime.current < cooldown) {
        if (!soundQueueRef.current || velocity > soundQueueRef.current.velocity) {
          soundQueueRef.current = { position: position.clone(), velocity };
        }
        return;
      }

      // Play queued sound if it's stronger than current
      let finalVelocity = velocity;
      let finalPosition = position;

      if (soundQueueRef.current && soundQueueRef.current.velocity > velocity) {
        finalVelocity = soundQueueRef.current.velocity;
        finalPosition = soundQueueRef.current.position;
      }
      soundQueueRef.current = null;

      // Scale volume based on velocity (capped for performance)
      const velocityFactor = Math.min(finalVelocity / maxVel, 1);

      // Play sound with velocity-scaled volume
      playPositional(
        {
          ...config,
          volume: baseVolume * velocityFactor,
        },
        finalPosition
      );

      lastPlayTime.current = now;
    },
    [config, cooldown, minVel, maxVel, baseVolume, playPositional]
  );

  return playCollisionSound;
}

/**
 * Hook for UI sounds (click, hover, etc.)
 */
export function useUISound() {
  const { play } = useSound();

  const playClick = useCallback(() => play(SOUNDS.ui.click), [play]);
  const playHover = useCallback(() => play(SOUNDS.ui.hover), [play]);
  const playItemHover = useCallback(() => play(SOUNDS.ui.itemHover), [play]);
  const playItemSelect = useCallback(() => play(SOUNDS.ui.itemSelect), [play]);
  const playSuccess = useCallback(() => play(SOUNDS.ui.success), [play]);
  const playError = useCallback(() => play(SOUNDS.ui.error), [play]);
  const playScore = useCallback(() => play(SOUNDS.ui.score), [play]);
  const playMoneyGain = useCallback(() => play(SOUNDS.ui.moneyGain), [play]);
  const playEndOfDay = useCallback(() => play(SOUNDS.ui.endOfDay), [play]);

  return {
    playClick,
    playHover,
    playItemHover,
    playItemSelect,
    playSuccess,
    playError,
    playScore,
    playMoneyGain,
    playEndOfDay,
  };
}

/**
 * Hook for combat sounds (slash, hit, etc.)
 */
export function useCombatSound() {
  const { play } = useSound();

  const playSlash = useCallback(() => play(SOUNDS.combat.slash), [play]);
  const playHit = useCallback(() => play(SOUNDS.combat.hit), [play]);

  return {
    playSlash,
    playHit,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Helper to calculate collision velocity magnitude
 */
export function getCollisionVelocity(
  linearVelocity: { x: number; y: number; z: number }
): number {
  return Math.sqrt(
    linearVelocity.x ** 2 +
    linearVelocity.y ** 2 +
    linearVelocity.z ** 2
  );
}

/**
 * Generate a simple beep tone (for placeholder testing)
 */
export function generatePlaceholderBeep(
  frequency: number = 440,
  duration: number = 0.1
): AudioBuffer {
  const audioContext = THREE.AudioContext.getContext();
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
  }

  return buffer;
}
