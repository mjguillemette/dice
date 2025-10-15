// components/Dice/Thumbtack.tsx
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { ConeCollider } from "@react-three/rapier";
import { forwardRef, useMemo } from "react";
import DiceBase from "./DiceBase";
import type { DiceProps, DiceHandle } from "./Dice.types";

// Optional gritty PS1 texture for the thumbtack (replace with your asset)
import thumbTexture from "../../assets/textures/thumbtack.png";

const Thumbtack = forwardRef<DiceHandle, DiceProps>((props, ref) => {
  // Thumbtack is visually taller but narrow; treat as small cone
  const size = 0.03 * (props.sizeMultiplier ?? 1);

  const [tex] = useLoader(THREE.TextureLoader, [thumbTexture]);

  const materials = useMemo(() => {
    if (tex) {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;

      return new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.6,
        metalness: 0.35
      });
    }

    // Fallback dark-metal material
    return new THREE.MeshStandardMaterial({
      color: "#444444",
      roughness: 0.6,
      metalness: 0.4
    });
  }, [tex]);

  // Geometry: cone (head of the tack). We intentionally keep it simple/low-poly.
  const geometry = <coneGeometry args={[size * 0.5, size * 1.2, 8]} />;

  // Collider: ConeCollider (approximate the cone shape)
  const collider = (
    <ConeCollider
      args={[
        (size * 1.2) / 2, // half height
        size * 0.5 // radius
      ]}
    />
  );

  return (
    <DiceBase
      ref={ref}
      {...props}
      maxValue={1}
      geometry={geometry}
      collider={collider}
      materials={materials}
    />
  );
});

Thumbtack.displayName = "Thumbtack";
export default Thumbtack;
