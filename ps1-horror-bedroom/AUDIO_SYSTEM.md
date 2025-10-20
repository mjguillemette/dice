# Audio System Documentation

## Overview

The game now includes a comprehensive, scalable audio system with support for:

- **Collision sounds** with velocity-based volume scaling
- **UI sounds** for score achievements, money gains, clicks, etc.
- **3D positional audio** for spatial sound effects
- **Sound categories** (SFX, UI, Ambient, Music) with independent volume controls
- **Placeholder audio generation** for testing without actual audio files
- **Sound pooling** for performance optimization

## Architecture

### Core Components

1. **AudioManager** (`src/systems/audioSystem.ts`)
   - Singleton class managing all audio playback
   - Handles sound loading, caching, and playback
   - Supports both 2D and 3D positional audio
   - Provides category-based volume control

2. **React Hooks** (`src/systems/audioSystem.ts`)
   - `useAudioSystem(camera)` - Initialize audio system (call once in Scene)
   - `useSound()` - Play generic sounds
   - `useCollisionSound(config)` - Play collision sounds with velocity scaling
   - `useUISound()` - Play UI sounds (click, hover, success, etc.)

3. **Placeholder Sound Generator** (`src/utils/generatePlaceholderSounds.ts`)
   - Synthesizes audio programmatically for testing
   - No audio files required
   - Can be toggled on/off

## Usage Examples

### Playing Collision Sounds

Collision sounds are automatically integrated into the `Dice` component:

```typescript
const playTableSound = useCollisionSound({
  ...SOUNDS.dice.table,
  minVelocity: 0.5,    // Minimum velocity to trigger
  maxVelocity: 8,      // Velocity for max volume
  cooldown: 100,       // Milliseconds between plays
});

// In collision handler
const handleCollision = (event) => {
  const velocity = getCollisionVelocity(rigidBody.linvel());
  const position = new THREE.Vector3(...);
  playTableSound(position, velocity);
};
```

### Playing UI Sounds

UI sounds are integrated into the `GameHUD` component:

```typescript
const { playScore, playMoneyGain } = useUISound();

// Play when score achieved
useEffect(() => {
  if (newScoreAchieved) {
    playScore();
  }
}, [scores]);

// Play when money gained
useEffect(() => {
  if (balance > prevBalance) {
    playMoneyGain();
  }
}, [balance]);
```

### Playing Custom Sounds

```typescript
const { play, playPositional } = useSound();

// Play 2D sound
play({
  src: '/sounds/custom.mp3',
  volume: 0.5,
  category: 'sfx',
});

// Play 3D positional sound
playPositional(
  {
    src: '/sounds/custom.mp3',
    volume: 0.5,
    category: 'sfx',
    refDistance: 1,
    maxDistance: 10,
  },
  new THREE.Vector3(x, y, z)
);
```

## Sound Registry

All game sounds are centralized in the `SOUNDS` object for easy management:

```typescript
export const SOUNDS = {
  dice: {
    wood: { src: '/sounds/dice/wood.mp3', category: 'sfx', volume: 0.5 },
    table: { src: '/sounds/dice/table.mp3', category: 'sfx', volume: 0.4 },
    dice: { src: '/sounds/dice/dice.mp3', category: 'sfx', volume: 0.3 },
  },
  ui: {
    click: { src: '/sounds/ui/click.mp3', category: 'ui', volume: 0.6 },
    hover: { src: '/sounds/ui/hover.mp3', category: 'ui', volume: 0.3 },
    success: { src: '/sounds/ui/success.mp3', category: 'ui', volume: 0.7 },
    // ... more UI sounds
  },
  // ... more categories
};
```

## Current Implementation Status

### ✅ Implemented

- **Dice Collision Sounds**
  - Dice vs Table
  - Dice vs Dice
  - Dice vs Furniture (wood)
  - Velocity-based volume scaling
  - Cooldown to prevent sound spam

- **UI Sounds**
  - Score achievement
  - Money gain
  - Ready for: click, hover, success, error

- **Audio System Features**
  - 3D positional audio with distance attenuation
  - Sound categories with volume control
  - Placeholder sound generation (currently active)
  - Sound caching and pooling
  - Master volume and mute controls

### 🚧 Ready to Integrate

The following sounds are defined in the registry and ready to use:

- **UI Sounds**: click, hover, success, error
- **Ambient Sounds**: room ambience, rain, wind
- **Music**: menu music, gameplay music

### 📋 To Add Real Audio Files

1. Create sound files in these directories:
   - `public/sounds/dice/` (wood.mp3, table.mp3, dice.mp3)
   - `public/sounds/ui/` (click.mp3, hover.mp3, success.mp3, error.mp3, score.mp3, money.mp3)
   - `public/sounds/ambient/` (room.mp3, rain.mp3, wind.mp3)
   - `public/sounds/music/` (menu.mp3, gameplay.mp3)

2. Toggle placeholder mode off:
   ```typescript
   audioManager.setUsePlaceholders(false);
   ```

## Collision Sound Configuration

### Velocity-Based Volume

Collision sounds automatically scale volume based on impact velocity:

- **minVelocity**: Minimum velocity to trigger sound (prevents tiny bumps)
- **maxVelocity**: Velocity at which volume reaches maximum
- **Linear scaling**: Volume = baseVolume × (velocity / maxVelocity)

### Cooldown System

Each collision sound has a cooldown to prevent audio spam:

```typescript
const config = {
  cooldown: 100, // 100ms between sounds
};
```

This ensures:
- Smooth audio playback during continuous contact
- Prevents performance issues from too many simultaneous sounds
- More realistic audio behavior

## Performance Considerations

1. **Sound Pooling**: Sounds are automatically cleaned up when finished
2. **Caching**: Audio buffers are cached to avoid re-loading
3. **Cooldowns**: Prevent excessive simultaneous playback
4. **3D Audio**: Automatically attenuates with distance

## Volume Control

```typescript
// Set master volume (0-1)
audioManager.setMasterVolume(0.5);

// Set category volumes
audioManager.setCategoryVolume('sfx', 0.8);
audioManager.setCategoryVolume('ui', 1.0);
audioManager.setCategoryVolume('ambient', 0.3);
audioManager.setCategoryVolume('music', 0.6);

// Mute/unmute
audioManager.setMuted(true);
```

## Debugging

Audio system logs:
- `🔊 Audio system initialized` - System ready
- `🎵 Generated placeholder sounds: X` - Placeholder generation complete
- `Failed to load sound: ...` - Audio file loading errors

## Future Enhancements

Potential additions to the audio system:

1. **Music System**
   - Crossfading between tracks
   - Adaptive music based on game state
   - Stingers for key moments

2. **Advanced Effects**
   - Reverb zones for different rooms
   - Low-pass filtering for muffled sounds
   - Echo effects for special events

3. **Dynamic Mixing**
   - Ducking (lower music when UI sounds play)
   - Priority system for important sounds
   - Automatic balancing of multiple simultaneous sounds

4. **Audio Settings UI**
   - User-adjustable volume sliders
   - Accessibility options
   - Audio presets (quiet, balanced, loud)

## Integration Points

### Files Modified

1. **src/systems/audioSystem.ts** - Core audio system (NEW)
2. **src/utils/generatePlaceholderSounds.ts** - Placeholder generation (NEW)
3. **src/components/models/Dice.tsx** - Collision sound integration
4. **src/components/ui/GameHUD.tsx** - UI sound integration
5. **src/components/Scene.tsx** - Audio system initialization

### Key Integration Points

- **Dice collisions**: Rapier's `onCollisionEnter` callback
- **Score achievements**: GameHUD's score tracking effect
- **Money gains**: GameHUD's balance tracking effect
- **Audio listener**: Attached to Three.js camera for 3D audio

## Troubleshooting

### No sound playing
1. Check browser console for audio errors
2. Verify audio context is not blocked (browsers require user interaction)
3. Check volume levels (master and category)
4. Verify mute state

### Sounds too quiet/loud
1. Adjust category volumes
2. Tweak individual sound volumes in SOUNDS registry
3. Check velocity scaling parameters

### Performance issues
1. Increase cooldown times
2. Reduce max simultaneous sounds
3. Use 2D audio instead of 3D where spatial positioning isn't needed
