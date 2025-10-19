import * as THREE from "three";
import DiceBase from "./DiceBase";
import type { DiceProps, DiceHandle } from "./Dice.types";
import { forwardRef, useMemo } from "react";
import { BallCollider } from "@react-three/rapier";

/**
 * D20 (Icosahedron) - 20-sided die
 * Uses icosahedron geometry with 20 triangular faces
 * The classic RPG die!
 */
const D20 = forwardRef<DiceHandle, DiceProps>((props, ref) => {
  const baseDiceSize = 0.042 * (props.sizeMultiplier ?? 1);

  // Create icosahedron geometry and materials
  const { geometry, materials } = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(baseDiceSize, 0);

    // Create materials for 20 faces
    const faceColors = Array.from({ length: 20 }, (_, i) => {
      // Gradient from light to dark
      const lightness = 232 - (i * 6);
      return `rgb(${lightness}, ${lightness - 20}, ${lightness - 40})`;
    });

    const mats = faceColors.map((color, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 128, 128);

      // Number
      ctx.fillStyle = '#2a2018';
      ctx.font = 'bold 70px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const num = index + 1;
      // Special coloring for nat 20
      if (num === 20) {
        ctx.fillStyle = '#ff6b4a';
        ctx.font = 'bold 75px monospace';
      }
      // Special coloring for nat 1
      if (num === 1) {
        ctx.fillStyle = '#8B0000';
        ctx.font = 'bold 75px monospace';
      }

      ctx.fillText(num.toString(), 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      return new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.35,
        metalness: 0.15
      });
    });

    return { geometry: geo, materials: mats };
  }, [baseDiceSize]);

  return (
    <DiceBase
      ref={ref}
      {...props}
      maxValue={20}
      geometry={<primitive object={geometry} />}
      collider={
        // Use ball collider for icosahedron
        <BallCollider args={[baseDiceSize * 0.98]} />
      }
      materials={materials}
    />
  );
});

D20.displayName = "DiceD20";
export default D20;
