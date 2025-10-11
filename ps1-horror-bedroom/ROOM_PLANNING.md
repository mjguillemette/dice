# Room Planning Framework

## Design Principles

1. **Standard Door Size**: 1.0m wide x 2.2m tall
2. **Wall Thickness**: 0.15m (constant)
3. **Player Size**: 0.6m diameter (0.3m radius)
4. **Minimum Hallway Width**: 1.5m
5. **Room Connections**: Always through doorways, never overlapping walls

## Split Level House Layout

### Upper Level (Y: 0)
**Existing Bedroom**: 10m x 10m
- Position: Center at (0, 0, 0)
- Bounds: X: -5 to 5, Z: -5 to 5
- Door to hallway: Front wall (Z: 5) center opening 1m wide

**Hallway**: 2m x 4m
- Position: (0, 0, 7) - directly in front of bedroom door
- Bounds: X: -1 to 1, Z: 5 to 9
- Door from bedroom: Z: 5 (opening in front wall)
- Door to stairs: Z: 9 (leads to stairwell)

**Stairwell (Upper to Entry)**: 3m x 4m
- Position: (0, -0.7, 11)
- Bounds: X: -1.5 to 1.5, Z: 9 to 13
- Top of stairs: (0, 0, 9)
- Bottom of stairs: (0, -1.4, 13)
- Open at top (Z: 9) and bottom (Z: 13)

### Entry Level (Y: -1.4)
**Entry Hall**: 3m x 3m
- Position: (0, -1.4, 14.5)
- Bounds: X: -1.5 to 1.5, Z: 13 to 16
- Connection from upstairs: Z: 13
- Door to living room: X: -1.5 (west wall)

**Living Room**: 8m x 8m
- Position: (-5.5, -1.4, 14.5)
- Bounds: X: -9.5 to -1.5, Z: 10.5 to 18.5
- Door from entry hall: X: -1.5
- Door to basement stairs: X: -9.5, Z: 12

**Kitchen**: 6m x 6m
- Position: (4.5, -1.4, 14.5)
- Bounds: X: 1.5 to 7.5, Z: 11.5 to 17.5
- Door from entry hall: X: 1.5

**Stairwell (Entry to Lower)**: 3m x 4m
- Position: (-11, -2.1, 12)
- Bounds: X: -12.5 to -9.5, Z: 10 to 14
- Top of stairs: (-9.5, -1.4, 12)
- Bottom of stairs: (-12.5, -2.8, 12)
- Open at top and bottom

### Lower Level (Y: -2.8)
**Basement Main**: 10m x 10m
- Position: (-8, -2.8, 12)
- Bounds: X: -13 to -3, Z: 7 to 17
- Connection from stairs: X: -12.5

**Storage**: 6m x 6m
- Position: (3, -2.8, 12)
- Bounds: X: 0 to 6, Z: 9 to 15
- Door from basement: X: 0

## Navigation Flow

```
UPPER LEVEL (Y: 0)
┌──────────────────────┐
│     Bedroom          │
│    (10x10)           │
│      [Door]          │
└─────┬────────────────┘
      │ Hallway (2x4)
      │
┌─────▼────────────────┐
│   Stairs Down        │
│     (3x4)            │
└─────┬────────────────┘
      │
      │ Y: 0 → -1.4
      ▼

ENTRY LEVEL (Y: -1.4)
      ┌───────────────┐
      │  Entry Hall   │
      │    (3x3)      │
      └──┬────────┬───┘
         │        │
    ┌────▼──┐  ┌─▼──────┐
    │Living │  │Kitchen │
    │ Room  │  │ (6x6)  │
    │ (8x8) │  └────────┘
    └───┬───┘
        │
   ┌────▼───────┐
   │   Stairs   │
   │   Down     │
   └────┬───────┘
        │
        │ Y: -1.4 → -2.8
        ▼

LOWER LEVEL (Y: -2.8)
   ┌────────────┬──────────┐
   │  Basement  │ Storage  │
   │   Main     │  (6x6)   │
   │  (10x10)   │          │
   └────────────┴──────────┘
```

## Door Openings

All doorways are 1m wide openings in walls. Implementation:
- Split wall into two segments with gap in middle
- Gap positioned at center of wall or specified offset
- Each segment is a separate mesh

Example for 10m wall with center door:
```
Left segment: 4.5m wide, positioned at -2.75 from center
Gap: 1m (door opening)
Right segment: 4.5m wide, positioned at +2.75 from center
```

## Implementation Strategy

1. Create Room component that accepts:
   - Position (center point)
   - Dimensions (width x depth)
   - Floor Y level
   - Ceiling height
   - Door definitions: [{ wall: 'north'|'south'|'east'|'west', offset: number, width: number }]

2. Room component renders:
   - Floor plane
   - Ceiling plane
   - Four walls with door openings carved out

3. Collision boxes match visible walls, excluding door openings
