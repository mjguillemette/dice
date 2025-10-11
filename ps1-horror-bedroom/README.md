# PS1 Horror Bedroom - React Three Fiber

A professional React Three Fiber migration of a PS1-style horror bedroom scene with progressive corruption mechanics.

## Features

- **PS1-Style Graphics**: Custom GLSL shaders with vertex snapping and low-poly aesthetic
- **Progressive Corruption System**: 5-stage transformation from normal to hellish
- **Cinematic Camera**: 10 predefined camera angles that auto-rotate through the scene
- **Dynamic Lighting**: Lights change color and intensity based on corruption level
- **Swappable Objects**: Certain objects (window, ceiling light, teddy bear, lamp) transform during corruption
- **Free Camera Mode**: WASD movement with mouse look
- **Procedural Textures**: Wood grain, fabric, and PS1-style dithering

## Controls

- **C**: Toggle between cinematic and free camera modes
- **N**: Next cinematic camera angle (cinematic mode only)
- **WASD**: Move camera (free mode only)
- **Mouse**: Look around (free mode only)
- **Q/E**: Manually decrease/increase corruption level
- **T**: Toggle auto-corruption
- **H**: Toggle UI visibility

## Corruption Stages

1. **Dust** (0.0 - 0.3): Light dust particles appear
2. **Grime** (0.2 - 0.5): Dirt, stains, and mold spread
3. **Rust** (0.4 - 0.7): Rust and oxidation
4. **Blood** (0.6 - 0.9): Blood stains and veins emerge
5. **Pulse** (0.8 - 1.0): Pulsating demonic energy

## Project Structure

```
src/
├── components/
│   ├── models/         # 3D object components
│   │   ├── Bed.tsx
│   │   ├── Bureau.tsx
│   │   ├── TVStand.tsx
│   │   ├── Window.tsx
│   │   ├── CeilingLight.tsx
│   │   ├── Decorations.tsx
│   │   └── Room.tsx
│   ├── lighting/       # Lighting system
│   │   └── LightingRig.tsx
│   ├── camera/         # Camera system
│   │   └── CameraSystem.tsx
│   ├── Scene.tsx       # Main scene component
│   └── UI.tsx          # UI overlay
├── shaders/            # GLSL shader files
│   ├── vertex.glsl
│   └── fragment.glsl
├── systems/            # Game systems
│   ├── corruptionSystem.ts
│   └── inputSystem.ts
├── hooks/              # Custom React hooks
│   └── useCorruptionMaterial.ts
├── constants/          # Configuration
│   └── gameConfig.ts
└── App.tsx             # Main app component
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open http://localhost:5174 in your browser.

## Build

```bash
npm run build
```

## Technical Details

### Shader System

The custom shader material (`useCorruptionMaterial` hook) provides:
- PS1-style vertex snapping in screen space
- Procedural noise functions for organic corruption effects
- Material-aware texturing (wood, fabric, walls)
- 5-stage progressive corruption blending
- Time-based animations

### Architecture

- **Modular Components**: Each 3D object is a separate React component
- **Separation of Concerns**: Systems (input, corruption) are isolated
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized with useFrame and refs
- **Maintainability**: Clean component composition

### Camera System

- **Cinematic Mode**: Auto-rotates through 10 carefully positioned angles
- **Smooth Transitions**: Ease-in-out interpolation between angles
- **Free Camera**: First-person style WASD + mouse controls
- **Bounded Movement**: Keeps camera within room boundaries

### Lighting System

- Dynamic color interpolation based on corruption
- 6 main lights (ambient, ceiling, window, desk lamp, TV, corners)
- 5 hell lights that fade in during corruption
- Pulsating effect on demonic lights

## Configuration

All game constants are in `src/constants/gameConfig.ts`:
- Camera angles and transitions
- Corruption speed and thresholds
- Light positions and colors
- Movement speed and bounds

## Future Enhancements

This codebase provides a foundation for:
- Additional room objects and decorations
- More corruption stages
- Sound effects and ambient audio
- Multiple rooms/scenes
- Inventory system
- Story/narrative elements
- Save/load system

## Credits

Migrated from a vanilla Three.js prototype to a professional React Three Fiber application with clean architecture and modular components.
