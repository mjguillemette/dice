// components/Dice/D4.tsx
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { CuboidCollider } from "@react-three/rapier";
import { forwardRef, useMemo } from "react";
import DiceBase from "./DiceBase";
import type { DiceProps, DiceHandle } from "./Dice.types";

// Optional gritty PS1 texture for D4 (replace with your asset)
import d4Texture from "../../assets/textures/d4.png";

const D4 = forwardRef<DiceHandle, DiceProps>((props, ref) => {
  const size = 0.03 * (props.sizeMultiplier ?? 1);
  const [tex] = useLoader(THREE.TextureLoader, [d4Texture]);

  const materials = useMemo(() => {
    if (tex) {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;

      return new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.5,
        metalness: 0.06
      });
    }

    // Fallback purple-ish material (matching previous D4 style)
    return new THREE.MeshStandardMaterial({
      color: "#AA44FF",
      roughness: 0.5,
      metalness: 0.06
    });
  }, [tex]);

  // Geometry: tetrahedron
  const geometry = <tetrahedronGeometry args={[size * 0.9]} />;

  // Collider: use cuboid as a fallback approximation for tetrahedron
  const collider = <CuboidCollider args={[size / 2, size / 2, size / 2]} />;

  return (
    <DiceBase
      ref={ref}
      {...props}
      maxValue={4}
      geometry={geometry}
      collider={collider}
      materials={materials}
    />
  );
});

D4.displayName = "D4";
export default D4;
