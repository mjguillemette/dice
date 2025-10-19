import * as THREE from "three";
import DiceBase from "./DiceBase";
import type { DiceProps, DiceHandle } from "./Dice.types";
import { forwardRef, useMemo } from "react";
import { CylinderCollider } from "@react-three/rapier";

/**
 * D8 (Octahedron) - 8-sided die
 * Uses octahedron geometry for a classic D8 shape
 */
const D8 = forwardRef<DiceHandle, DiceProps>((props, ref) => {
  const baseDiceSize = 0.035 * (props.sizeMultiplier ?? 1);

  // Create octahedron geometry and materials
  const { geometry, materials } = useMemo(() => {
    const geo = new THREE.OctahedronGeometry(baseDiceSize, 0);

    // Create materials for each face with numbers
    const faceColors = [
      '#e8d4b8', '#d4c4b0', '#c4b4a0', '#b4a490',
      '#a49480', '#948470', '#847460', '#746450'
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
      ctx.font = 'bold 80px monospace';
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
      maxValue={8}
      geometry={<primitive object={geometry} />}
      collider={
        // Use cylinder collider as approximation for octahedron
        <CylinderCollider
          args={[baseDiceSize * 0.7, baseDiceSize * 0.9]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      }
      materials={materials}
    />
  );
});

D8.displayName = "DiceD8";
export default D8;
