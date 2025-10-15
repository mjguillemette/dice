// components/Dice/D3.tsx
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { CylinderCollider } from "@react-three/rapier";
import { forwardRef, useMemo } from "react";
import DiceBase from "./DiceBase";
import type { DiceProps, DiceHandle } from "./Dice.types";

// Optional gritty PS1 texture for D3 (replace with your asset)
import d3Texture from "../../assets/textures/d3.png";

const D3 = forwardRef<DiceHandle, DiceProps>((props, ref) => {
  const size = 0.03 * (props.sizeMultiplier ?? 1);
  // Try to load a single texture to apply to all faces (PS1/gritty look)
  const [tex] = useLoader(THREE.TextureLoader, [d3Texture]);

  const materials = useMemo(() => {
    if (tex) {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;

      // Use same texture on all surfaces but keep a standard material wrapper
      return new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.45,
        metalness: 0.05
      });
    }

    // Fallback solid material (light-blue)
    return new THREE.MeshStandardMaterial({
      color: "#4AA3FF",
      roughness: 0.45,
      metalness: 0.05
    });
  }, [tex]);

  // Geometry: triangular prism (cylinder with 3 radial segments)
  const geometry = (
    <cylinderGeometry args={[size * 0.7, size * 0.7, size, 3]} />
  );

  // Collider: approximated by a cylinder collider with same dimensions
  const collider = <CylinderCollider args={[(size * 1) / 2, size * 0.7]} />;

  return (
    <DiceBase
      ref={ref}
      {...props}
      maxValue={3}
      geometry={geometry}
      collider={collider}
      materials={materials}
    />
  );
});

D3.displayName = "D3";
export default D3;
