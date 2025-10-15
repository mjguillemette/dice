import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { CylinderCollider } from "@react-three/rapier";
import DiceBase from "./DiceBase";
import type { DiceProps, DiceHandle } from "./Dice.types";
import coinHeads from "../../assets/textures/coinheads.png";
import coinTails from "../../assets/textures/cointails.png";
import { forwardRef, useMemo } from "react";

const Coin = forwardRef<DiceHandle, DiceProps>((props, ref) => {
  const diceSize = 0.03 * (props.sizeMultiplier ?? 1);
  const [heads, tails] = useLoader(THREE.TextureLoader, [coinHeads, coinTails]);

  const materials = useMemo(
    () => [
      new THREE.MeshStandardMaterial({
        map: heads,
        roughness: 0.2,
        metalness: 0.8
      }),
      new THREE.MeshStandardMaterial({
        map: heads,
        roughness: 0.2,
        metalness: 0.8
      }),
      new THREE.MeshStandardMaterial({
        map: tails,
        roughness: 0.2,
        metalness: 0.8
      })
    ],
    [heads, tails]
  );

  return (
    <DiceBase
      ref={ref}
      {...props}
      maxValue={2}
      geometry={
        <cylinderGeometry
          args={[diceSize * 0.8, diceSize * 0.8, diceSize * 0.3, 16]}
        />
      }
      collider={
        <CylinderCollider args={[(diceSize * 0.3) / 2, diceSize * 0.8]} />
      }
      materials={materials}
    />
  );
});

Coin.displayName = "Coin";
export default Coin;
