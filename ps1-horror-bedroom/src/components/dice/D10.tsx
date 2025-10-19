import * as THREE from "three";
import DiceBase from "./DiceBase";
import type { DiceProps, DiceHandle } from "./Dice.types";
import { forwardRef, useMemo } from "react";
import { CylinderCollider } from "@react-three/rapier";

/**
 * D10 (Pentagonal Trapezohedron) - 10-sided die
 * Numbers 0-9 or 1-10
 */
const D10 = forwardRef<DiceHandle, DiceProps>((props, ref) => {
  const baseDiceSize = 0.035 * (props.sizeMultiplier ?? 1);

  // Create custom D10 geometry and materials
  const { geometry, materials } = useMemo(() => {
    // Create pentagonal trapezohedron (10 kite-shaped faces)
    const radius = baseDiceSize;
    const height = baseDiceSize * 1.2;

    // Simplified D10 using a custom geometry
    const geo = new THREE.CylinderGeometry(
      radius * 0.6,  // top radius
      radius * 0.6,  // bottom radius
      height,
      10,  // 10 segments for pentagonal shape
      1
    );

    // Make it more pointy at top and bottom
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (Math.abs(y) > height * 0.4) {
        const scale = 0.3;
        positions.setX(i, positions.getX(i) * scale);
        positions.setZ(i, positions.getZ(i) * scale);
      }
    }
    positions.needsUpdate = true;
    geo.computeVertexNormals();

    // Create materials for 10 faces (numbered 0-9 or 1-10)
    const faceColors = [
      '#e8d4b8', '#d8c8b4', '#c8b8a4', '#b8a894',
      '#a89884', '#988874', '#887864', '#786854',
      '#685844', '#584834'
    ];

    const mats = faceColors.map((color, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 128, 128);

      // Number (0-9 for D10)
      ctx.fillStyle = '#2a2018';
      ctx.font = 'bold 80px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(index.toString(), 64, 64);

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
      maxValue={10}
      geometry={<primitive object={geometry} />}
      collider={
        // Use cylinder collider as approximation
        <CylinderCollider
          args={[baseDiceSize * 0.6, baseDiceSize * 0.7]}
        />
      }
      materials={materials}
    />
  );
});

D10.displayName = "DiceD10";
export default D10;
