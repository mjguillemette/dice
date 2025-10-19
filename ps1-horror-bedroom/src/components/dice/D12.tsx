import * as THREE from "three";
import DiceBase from "./DiceBase";
import type { DiceProps, DiceHandle } from "./Dice.types";
import { forwardRef, useMemo } from "react";
import { BallCollider } from "@react-three/rapier";

/**
 * D12 (Dodecahedron) - 12-sided die
 * Uses dodecahedron geometry with 12 pentagonal faces
 */
const D12 = forwardRef<DiceHandle, DiceProps>((props, ref) => {
  const baseDiceSize = 0.04 * (props.sizeMultiplier ?? 1);

  // Create dodecahedron geometry and materials
  const { geometry, materials } = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(baseDiceSize, 0);

    // Create materials for 12 faces
    const faceColors = [
      '#e8d4b8', '#dcc8b0', '#d0bca8', '#c4b0a0',
      '#b8a498', '#ac9890', '#a08c88', '#948080',
      '#887478', '#7c6870', '#705c68', '#645060'
    ];

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
      ctx.fillText((index + 1).toString(), 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      return new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.4,
        metalness: 0.1
      });
    });

    return { geometry: geo, materials: mats };
  }, [baseDiceSize]);

  return (
    <DiceBase
      ref={ref}
      {...props}
      maxValue={12}
      geometry={<primitive object={geometry} />}
      collider={
        // Use ball collider for dodecahedron
        <BallCollider args={[baseDiceSize * 0.95]} />
      }
      materials={materials}
    />
  );
});

D12.displayName = "DiceD12";
export default D12;
