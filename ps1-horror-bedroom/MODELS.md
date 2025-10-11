# 3D Models Documentation

## Overview

This document describes all the 3D models in the PS1 Horror Bedroom scene, including their corruption behaviors and technical details.

---

## Room Components

### Room (Room.tsx)
**Description:** Walls, floor, ceiling, and rug
**Position:** Encompasses entire scene
**Corruption:** Progressive shader-based decay

**Parts:**
- Floor (10x10 plane)
- Rug (4x3 plane, slight elevation)
- 4 Walls (box geometries)
- Ceiling (10x10 plane)

---

## Furniture

### Bed (Bed.tsx)
**Position:** (-2, 0.5, -2)
**Corruption:** Fabric and wood textures decay

**Parts:**
- Mattress (3x0.4x4 box) - Blue fabric → Dark purple
- Pillow (1x0.2x0.6 box) - White → Blood red
- Frame (3.2x0.3x4.2 box) - Brown wood → Black

### Bureau/Dresser (Bureau.tsx)
**Position:** (3, 0.75, -3)
**Corruption:** Wood grain darkens, handles corrode

**Parts:**
- Main body (2x1.5x1 box)
- 3 Drawers (1.8x0.4x0.1 boxes)
- 3 Handles (sphere geometry, 0.05 radius)

### TV Stand (TVStand.tsx)
**Position:** (0, 0.4, -4.5)
**Corruption:** Screen changes from blue to blood red

**Parts:**
- Stand base (2.5x0.8x0.8 box)
- TV body (2x1.2x0.15 box)
- Screen (1.8x1 plane) - Blue → Red

---

## Swappable Objects

These objects have dual versions that fade between normal and corrupted states.

### Window (Window.tsx)
**Position:** (3, 2.5, -4.9)
**Corruption:** 3-layer system with texture overlay

**Parts:**
- Frame (2x2x0.2 box)
- Normal glass (0-30%) - Sky blue
- Hell glass (30-70%) - Blood red
- Hell screen texture (70-100%) - Glowing texture overlay

**Special:** Uses hellscreen.png texture at high corruption

### Ceiling Light (CeilingLight.tsx)
**Position:** (0, 4.7, 0)
**Corruption:** Color transformation

**States:**
- Normal: Warm yellow glow
- Corrupted: Intense red/demonic

### Decorations (Decorations.tsx)
**Corruption:** Dual-state swappable objects

**Teddy Bear:**
- Position: (-3, 0.8, -2)
- Normal: Brown bear
- Corrupted: Black/void bear

**Lamp:**
- Position: (3.6, 1.65, -3)
- Normal: Wooden base
- Corrupted: Dark metallic

---

## New Models

### Ashtray (Ashtray.tsx) ✨ NEW
**Position:** (3.0, 1.55, -3.2) - On top of dresser
**Corruption:** Ember changes from orange to sickly green

**Parts:**
- Ashtray base (0.12-0.14 radius cylinder, 0.04 height)
- Rim detail (torus geometry)
- Active cigarette (angled cylinder, 0.15 length)
  - Main body (cream/beige)
  - Filter end (thicker section)
  - Burnt tip (dark ash)
  - Ember glow (swappable):
    - Normal: Orange-red (#ff4500)
    - Corrupted: Sickly green (#00ff00)
- Ash pile (irregular cylinder)
- 2 Old cigarette butts

**Corruption Behavior:**
- 0-50%: Normal orange ember
- 50-100%: Fades to supernatural green glow
- Ash becomes blood-tinged
- Ceramic darkens and corrupts

**Technical Details:**
- Uses low-poly cylinders (6-8 segments) for PS1 aesthetic
- Ember uses transparent materials with opacity swapping
- Positioned precisely on dresser surface
- Angled cigarette for visual interest

---

## Model Guidelines

### Creating New Models

When adding new models to the scene:

1. **Create component** in `src/components/models/`
2. **Use corruption materials** via `useCorruptionMaterial` hook
3. **Pass hellFactor** as prop
4. **Update materials** in render cycle
5. **Add to Scene.tsx** import and render

### Typical Structure

```typescript
interface ModelProps {
  hellFactor: number;
}

export function YourModel({ hellFactor }: ModelProps) {
  const material = useCorruptionMaterial({
    normalColor: 0xRRGGBB,
    hellColor: 0xRRGGBB,
  });

  if (material.uniforms) {
    material.uniforms.hellFactor.value = hellFactor;
  }

  return (
    <group position={[x, y, z]}>
      <mesh material={material}>
        <geometryType args={[...]} />
      </mesh>
    </group>
  );
}
```

### PS1 Aesthetic Guidelines

- **Low polygon count**: Use 6-8 segments for cylinders/spheres
- **Simple geometries**: Box, cylinder, sphere, plane
- **Visible vertices**: Embrace the angular look
- **Texture-free base**: Let shaders handle surface detail
- **Strategic detail**: Add detail where it matters (not everywhere)

### Corruption Best Practices

- **Color transitions**: Dark, desaturated colors for hell state
- **Swappable elements**: Use dual objects for dramatic changes
- **Threshold-based**: Trigger major changes at specific corruption levels
- **Gradual decay**: Let shaders handle progressive deterioration
- **Emission/glow**: Use transparent materials for glowing elements

---

## Model Positions Reference

Quick reference for positioning new objects:

```
Bureau top surface: Y = 1.5 (center of top)
Floor level: Y = 0
Bed height: Y = 0.5 (mattress top)
Ceiling: Y = 5
Window center: (3, 2.5, -4.9)
TV screen: (0, 1.4, -4.35)

Room bounds:
X: -5 to 5
Y: 0 to 5
Z: -5 to 5
```

---

## Future Model Ideas

Potential additions for the scene:
- Mirror on wall (reflection effects)
- Clock (stopped at significant time)
- Posters/pictures (decaying artwork)
- Books on bureau/floor
- Bottles/glasses
- Electrical outlets (sparking at high corruption)
- Cobwebs (appear during corruption)
- Stains on walls/floor (procedural decals)
