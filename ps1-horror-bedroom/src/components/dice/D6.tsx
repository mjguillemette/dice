import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import DiceBase from "./DiceBase";
import type { DiceProps, DiceHandle } from "./Dice.types";
import { forwardRef, useMemo } from "react";
import normal1 from "../../assets/textures/normal-1.png";
import normal2 from "../../assets/textures/normal-2.png";
import normal3 from "../../assets/textures/normal-3.png";
import normal4 from "../../assets/textures/normal-4.png";
import normal5 from "../../assets/textures/normal-5.png";
import normal6 from "../../assets/textures/normal-6.png";
import { CuboidCollider } from "@react-three/rapier";

const D6 = forwardRef<DiceHandle, DiceProps>((props, ref) => {
  const baseDiceSize = 0.03 * (props.sizeMultiplier ?? 1);
  const textures = useLoader(THREE.TextureLoader, [
    normal1,
    normal2,
    normal3,
    normal4,
    normal5,
    normal6
  ]);

  const materials = useMemo(
    () =>
      textures.map(
        (t) =>
          new THREE.MeshStandardMaterial({
            map: t,
            roughness: 0.3,
            metalness: 0.1
          })
      ),
    [textures]
  );

  return (
    <DiceBase
      ref={ref}
      {...props}
      maxValue={6}
      geometry={
        <boxGeometry args={[baseDiceSize, baseDiceSize, baseDiceSize]} />
      }
      collider={
        <CuboidCollider
          args={[baseDiceSize / 2, baseDiceSize / 2, baseDiceSize / 2]}
        />
      }
      materials={materials}
    />
  );
});

D6.displayName = "DiceD6";
export default D6;
