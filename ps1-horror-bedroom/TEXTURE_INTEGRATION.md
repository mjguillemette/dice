# Texture Integration - Hell Screen

## Overview

The `hellscreen.png` texture (32x32 pixels) has been integrated into the window at very high corruption levels, using PS1-style texture rendering for an authentic retro look.

## Implementation Details

### PS1 Texture Hook (`usePS1Texture.ts`)

Created a custom hook that loads and configures textures with PS1-specific settings:

```typescript
- Nearest neighbor filtering (NearestFilter) - creates pixelated, blocky look
- Mipmaps disabled - authentic PS1 rendering
- Clamp to edge wrapping - prevents texture bleeding
- Anisotropic filtering = 1 - minimal filtering for PS1 accuracy
```

These settings ensure the 32x32 texture stretches with visible pixels, exactly like PS1 games.

### Window Component Updates

The window now has **3 layers**:

1. **Normal Glass** (0-30% corruption)
   - Sky blue color (#87ceeb)
   - Visible at low corruption
   - Uses corruption shader

2. **Hell Glass** (30-70% corruption)
   - Blood red color (#8b0000)
   - Fades in as corruption increases
   - Uses corruption shader with procedural effects

3. **Hell Screen Texture** (70-100% corruption)
   - Loads `hellscreen.png` from `/src/assets/textures/`
   - Appears only at very high corruption (70%+)
   - Fades in over 20% range (70-90%)
   - Max opacity capped at 80% for blending
   - Uses additive blending for glowing effect
   - Positioned slightly in front (Z: -4.73)

### Corruption Timeline

```
0%        30%       70%       90%      100%
|---------|---------|---------|---------|
  Normal     Fading    Hell     Texture
  Glass      Glass   +Texture  Fully
                      Fades In  Visible
```

## Technical Features

### PS1-Style Rendering
- **Pixelated stretching**: The 32x32 texture stretches to fill 1.8x1.8 world units
- **No filtering**: Each pixel is clearly visible and blocky
- **Additive blending**: Creates glowing/supernatural effect
- **Transparent**: Blends with underlying hell glass layer

### Shader Compatibility
The texture layer works alongside our custom corruption shaders:
- Positioned in front of shader-based glass layers
- Uses standard MeshBasicMaterial (no custom shaders needed)
- Respects depth sorting with `depthWrite: false`
- Additive blending creates composite effect with background

### Performance
- **Lazy loading**: Texture only loads when needed (Suspense wrapper)
- **Efficient**: Uses standard Three.js texture loader
- **Cached**: Texture is loaded once and reused
- **Conditional rendering**: Only visible when opacity > 0.01

## Customization

### Adjust Fade Timing
In `Window.tsx`, modify these constants:
```typescript
const hellScreenThreshold = 0.7;  // When texture starts appearing (0-1)
const hellScreenFadeRange = 0.2;   // How long fade-in takes (0-1)
```

### Adjust Opacity
```typescript
hellScreenMaterial.opacity = hellScreenOpacity * 0.8; // Change 0.8 to desired max
```

### Change Blending Mode
```typescript
blending: THREE.AdditiveBlending,  // Try NormalBlending, MultiplyBlending, etc.
```

## Replacing the Texture

To use a different texture:

1. Place new 32x32 PNG in `/src/assets/textures/`
2. Update path in `Window.tsx`:
```typescript
const hellScreenTexture = usePS1Texture('/src/assets/textures/your-texture.png');
```

## Viewing the Effect

1. Start the dev server: `npm run dev`
2. Open http://localhost:5174
3. Press **E** repeatedly to increase corruption to 70%+
4. Or press **T** to enable auto-corruption and wait
5. The hell screen texture will fade in over the window

The texture will appear pixelated and stretched, creating an authentic PS1 horror aesthetic!

## Notes

- The texture is loaded asynchronously with Suspense
- If texture fails to load, the window still functions (fallback to hell glass)
- The 32x32 resolution ensures visible pixels when stretched
- Additive blending makes it glow against the dark background
- Works seamlessly with all existing corruption shader effects
