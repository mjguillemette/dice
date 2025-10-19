# Item & Model Audit Report
**Missing 3D Models and Inventory Issues**

Date: 2025-10-19

---

## Missing 3D Models

### Dice Types Defined in Item System

From `src/systems/itemSystem.ts`:
- ✅ **thumbtack** - Has model (`src/components/dice/Thumbtack.tsx`)
- ✅ **coin** - Has model (`src/components/dice/Coin.tsx`)
- ❓ **nickel** - No dedicated model (likely uses Coin model)
- ✅ **d3** - Has model (`src/components/dice/D3.tsx`)
- ✅ **d4** - Has model (`src/components/dice/D4.tsx`)
- ✅ **d6** - Has model (`src/components/dice/D6.tsx`)
- ❌ **d8** - NO MODEL (Octahedron Die)
- ❌ **d10** - NO MODEL (Decahedron Die)
- ❌ **d12** - NO MODEL (Dodecahedron Die)
- ❌ **d20** - NO MODEL (Icosahedron Die)

### Special Dice (Variants)
- ❌ **golden_pyramid** - NO MODEL (should be variant of D3)
- ❌ **caltrop** - NO MODEL (should be variant of D4)
- ❌ **casino_reject** - NO MODEL (should be variant of D6)
- ❌ **weighted_die** - NO MODEL (variant of D6)
- ❌ **loaded_coin** - NO MODEL (variant of Coin)
- ❌ **cursed_die** - NO MODEL (variant of D6)
- ❌ **split_die** - NO MODEL (variant of D6)
- ❌ **mirror_die** - NO MODEL (variant of D6)

### Non-Dice Items
- ✅ **tower_card** - Has model (`src/components/models/Card.tsx`)
- ❌ **sun_card** - NO MODEL (should use Card.tsx)
- ❌ **moon_card** - NO MODEL (should use Card.tsx)
- ✅ **hourglass** - Has model (`src/components/models/Hourglass.tsx`)
- ❌ **lucky_charm** - NO MODEL
- ❌ **rigged_die** - NO MODEL
- ✅ **cigarette** - Has model (`src/components/models/Cigarette.tsx`)
- ✅ **incense** - Has model (`src/components/models/IncenseStick.tsx`)

---

## Summary

### Total Items: 27
- ✅ **Have Models**: 8 (30%)
- ❌ **Missing Models**: 19 (70%)

### Critical Missing Models (in ITEM_POOL)
1. D8 (Uncommon dice)
2. D10 (Rare dice)
3. D12 (Epic dice - need to check if defined)
4. D20 (Legendary dice - need to check if defined)
5. Golden Pyramid (Rare - D3 variant)
6. Caltrop (Rare - D4 variant)
7. Loaded Coin (Rare - Coin variant)
8. Sun Card (Epic)
9. Moon Card (Legendary)

---

## Recommendations

### Priority 1: Core Dice (d8, d10, d12, d20)
These are standard polyhedral dice. Create proper 3D models with:
- Accurate geometry (8, 10, 12, 20 faces)
- Face numbering
- PS1 horror aesthetic

### Priority 2: Dice Variants
For variants like golden_pyramid, caltrop, loaded_coin:
- Reuse base geometry
- Apply different materials/textures
- Add visual indicators (gold material, sharp spikes, weighted appearance)

### Priority 3: Card Variants
Sun and Moon cards can reuse Card.tsx with:
- Different texture/material
- Different particle effects
- Different glow colors

### Priority 4: New Items
- Lucky Charm: Small 3D charm model
- Rigged Die: Visually distinct D6

---

## Throwable Items Not in Inventory Issue

Need to investigate:
1. Which items should be throwable (all dice types)
2. Check if inventory properly tracks all dice types
3. Verify DiceManager spawns all dice types correctly

---

## Action Items

1. **Create missing dice models** (d8, d10, d12, d20)
2. **Create dice variant materials** (golden, weighted, cursed visuals)
3. **Extend Card component** for Sun/Moon variants
4. **Audit inventory system** for dice addition logic
5. **Test each item** can be thrown after purchase/reward

