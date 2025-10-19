import { useRef, useState, useMemo, useEffect } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { type ItemDefinition } from "../../systems/itemSystem";

import normalTexture1 from "../../assets/textures/normal-1.png";
import normalTexture2 from "../../assets/textures/normal-2.png";
import normalTexture3 from "../../assets/textures/normal-3.png";
import normalTexture4 from "../../assets/textures/normal-4.png";
import normalTexture5 from "../../assets/textures/normal-5.png";
import normalTexture6 from "../../assets/textures/normal-6.png";
import coinHeadsTexture from "../../assets/textures/coinheads.png";
import coinTailsTexture from "../../assets/textures/cointails.png";
import towerTexture from "../../assets/textures/tower.png";
import sunTexture from "../../assets/textures/sun.png";
import { Billboard, Text } from "@react-three/drei";

interface ItemChoiceProps {
  item: ItemDefinition & { price?: number };
  position: [number, number, number];
  spendCurrency: () => boolean;
  onPurchase: () => void; // Re-introduce onPurchase prop
}

const BASE_SCALE = 2.5;
const OUTLINE_THICKNESS = 1.15;

export function ItemChoice({
  item,
  position,
  spendCurrency,
  onPurchase
}: ItemChoiceProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const pedestalRef = useRef<THREE.Mesh>(null!);
  const [isHovered, setIsHovered] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const { camera, raycaster } = useThree();

  const rarityColors: Record<ItemDefinition["rarity"], number> = {
    common: 0x999999,
    uncommon: 0x4488ff,
    rare: 0xffd700,
    epic: 0xff44ff,
    legendary: 0xff0000
  };
  const rarityColor = rarityColors[item.rarity];

  const maxValue = item.effect.type === "add_dice" ? item.effect.maxValue : 6;

  const d6Textures =
    item.effect.type === "add_dice" && maxValue === 6
      ? useLoader(THREE.TextureLoader, [
          normalTexture1,
          normalTexture2,
          normalTexture3,
          normalTexture4,
          normalTexture5,
          normalTexture6
        ])
      : [];
  const coinTextures =
    item.effect.type === "add_dice" && maxValue === 2
      ? useLoader(THREE.TextureLoader, [coinHeadsTexture, coinTailsTexture])
      : [];
  const cardTexture =
    item.effect.type === "add_card"
      ? useLoader(
          THREE.TextureLoader,
          item.effect.cardType === "sun" ? sunTexture : towerTexture
        )
      : null;

  const materials = useMemo(() => {
    if (
      item.effect.type === "add_dice" &&
      maxValue === 6 &&
      d6Textures.length > 0
    ) {
      d6Textures.forEach((texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
      });
      return [
        new THREE.MeshStandardMaterial({
          map: d6Textures[0],
          roughness: 0.3,
          metalness: 0.1
        }),
        new THREE.MeshStandardMaterial({
          map: d6Textures[5],
          roughness: 0.3,
          metalness: 0.1
        }),
        new THREE.MeshStandardMaterial({
          map: d6Textures[1],
          roughness: 0.3,
          metalness: 0.1
        }),
        new THREE.MeshStandardMaterial({
          map: d6Textures[4],
          roughness: 0.3,
          metalness: 0.1
        }),
        new THREE.MeshStandardMaterial({
          map: d6Textures[2],
          roughness: 0.3,
          metalness: 0.1
        }),
        new THREE.MeshStandardMaterial({
          map: d6Textures[3],
          roughness: 0.3,
          metalness: 0.1
        })
      ];
    }
    if (
      item.effect.type === "add_dice" &&
      maxValue === 2 &&
      coinTextures.length > 0
    ) {
      coinTextures.forEach((texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
      });
      return [
        new THREE.MeshStandardMaterial({
          map: coinTextures[0],
          roughness: 0.2,
          metalness: 0.8
        }),
        new THREE.MeshStandardMaterial({
          map: coinTextures[0],
          roughness: 0.2,
          metalness: 0.8
        }),
        new THREE.MeshStandardMaterial({
          map: coinTextures[1],
          roughness: 0.2,
          metalness: 0.8
        })
      ];
    }
    if (item.effect.type === "add_card" && cardTexture) {
      cardTexture.magFilter = THREE.NearestFilter;
      cardTexture.minFilter = THREE.NearestFilter;
      cardTexture.generateMipmaps = false;
      return new THREE.MeshStandardMaterial({
        map: cardTexture,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
    }
    if (item.effect.type === "add_dice") {
      let color = "#FFFFFF";
      if (maxValue === 1) color = "#444444";
      if (maxValue === 3) color = "#4488FF";
      if (maxValue === 4) color = "#AA44FF";
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.1
      });
    }
    return new THREE.MeshStandardMaterial({
      color: "#FFFFFF",
      roughness: 0.3,
      metalness: 0.1
    });
  }, [item.effect, maxValue, d6Textures, coinTextures, cardTexture]);

  const { geometry, itemSize } = useMemo(() => {
    const diceSize = 0.03 * BASE_SCALE;
    let size: [number, number, number];
    let geom: THREE.BufferGeometry;

    if (item.effect.type === "add_dice") {
      switch (maxValue) {
        case 1:
          size = [diceSize * 0.5, diceSize * 1.2, diceSize * 0.5];
          geom = new THREE.ConeGeometry(size[0], size[1], 8);
          break;
        case 2:
          size = [diceSize * 0.9, diceSize * 0.2, diceSize * 0.9];
          geom = new THREE.CylinderGeometry(size[0], size[2], size[1], 32);
          break;
        case 3:
          size = [diceSize, diceSize, diceSize];
          geom = new THREE.CylinderGeometry(
            size[0] * 0.8,
            size[2] * 0.8,
            size[1],
            3
          );
          break;
        case 4:
          size = [diceSize, diceSize, diceSize];
          geom = new THREE.TetrahedronGeometry(size[0] * 0.9);
          break;
        case 6:
        default:
          size = [diceSize, diceSize, diceSize];
          geom = new THREE.BoxGeometry(size[0], size[1], size[2]);
          break;
      }
    } else if (item.effect.type === "add_card") {
      size = [0.165 * BASE_SCALE * 0.25, 0.005, 0.295 * BASE_SCALE * 0.25];
      geom = new THREE.BoxGeometry(size[0], size[1], size[2]);
    } else {
      size = [0.05 * BASE_SCALE, 0.05 * BASE_SCALE, 0.05 * BASE_SCALE];
      geom = new THREE.BoxGeometry(size[0], size[1], size[2]);
    }
    return { geometry: geom, itemSize: size };
  }, [item.effect, maxValue]);

  useEffect(() => {
    const handleClick = () => {
      if (!isHovered || isPurchased || isShaking) {
        return;
      }

      const success = spendCurrency();

      if (success) {
        setIsPurchased(true);
        onPurchase(); // Call onPurchase ONLY on success
        setTimeout(() => setIsPurchased(false), 500);
      } else {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [isHovered, isPurchased, isShaking, spendCurrency, onPurchase]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const group = groupRef.current;

    // Check for hover against both the item and its pedestal
    if (meshRef.current && pedestalRef.current && !isPurchased) {
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObjects(
        [meshRef.current, pedestalRef.current],
        true
      );
      const nowHovered = intersects.length > 0;
      if (nowHovered !== isHovered) {
        setIsHovered(nowHovered);
      }
    } else {
      setIsHovered(false);
    }

    // Purchase "poof" animation
    if (isPurchased) {
      group.scale.lerp(new THREE.Vector3(0.1, 0.1, 0.1), 0.2);
      group.rotation.y += delta * 15;
      return;
    }

    // Insufficient funds "shake" animation
    if (isShaking) {
      group.position.x = position[0] + Math.sin(time * 50) * 0.03;
      group.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      return;
    }

    // Return to default state after any animation
    group.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    group.position.x = THREE.MathUtils.lerp(group.position.x, position[0], 0.1);

    // Standard animations
    group.rotation.y += delta * 0.3;
    const targetY = position[1] + (isHovered ? 0.05 : 0);
    const float = Math.sin(time + position[0]) * 0.02;
    group.position.y = THREE.MathUtils.lerp(
      group.position.y,
      targetY + float,
      0.1
    );
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh
        geometry={geometry}
        visible={isHovered && !isPurchased && !isShaking}
        scale={[OUTLINE_THICKNESS, OUTLINE_THICKNESS, OUTLINE_THICKNESS]}
      >
        <meshBasicMaterial color={rarityColor} side={THREE.BackSide} />
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        <mesh
          ref={meshRef}
          geometry={geometry}
          material={materials}
          castShadow
          receiveShadow
        />
      </RigidBody>
      {/* Item name label - always shown when hovered */}
      {isHovered && item && (
        <Billboard
          position={[0, Math.max(itemSize[2], itemSize[1]) * 2.2, 0]}
          renderOrder={9999999}
        >
          <Text
            fontSize={0.035}
            color={"#ffffff"}
            outlineWidth={0.002}
            outlineColor={rarityColor}
            font="Jersey25-Regular.ttf"
            depthOffset={25555}
          >
            {item.name}
          </Text>
        </Billboard>
      )}
      {/* Item description tooltip - shown when hovered */}
      {isHovered && item && (
        <Billboard position={[0, Math.max(itemSize[2], itemSize[1]) * 1.5, 0]}>
          <Text
            fontSize={0.025}
            color={"#cccccc"}
            font="Jersey25-Regular.ttf"
            maxWidth={1.5}
            textAlign="center"
          >
            {item.description}
          </Text>
        </Billboard>
      )}
      {/* Price label - only shown for items with prices */}
      {isHovered &&
        item &&
        typeof item.price === "number" &&
        item.price > 0 && (
          <Billboard
            position={[0, Math.max(itemSize[2], itemSize[1]) * 2.18, 0]}
          >
            <Text
              fontSize={0.045}
              color={"#16161d"}
              outlineWidth={0.002}
              outlineColor={rarityColor}
              // pixel font mono
              font="Jersey25-Regular.ttf"
            >
              {(item.price / 100).toLocaleString("en-US", {
                style: "currency",
                currency: "USD"
              })}
            </Text>
          </Billboard>
        )}
      <mesh ref={pedestalRef} position={[0, -itemSize[1] * 0.7, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.01, 16]} />
        <meshStandardMaterial
          color={rarityColor}
          emissive={rarityColor}
          emissiveIntensity={0.3}
          roughness={0.5}
          metalness={0.7}
        />
      </mesh>

      <mesh
        position={[0, -itemSize[1] * 0.7 + 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.08, 0.12, 32]} />
        <meshBasicMaterial
          color={rarityColor}
          transparent
          opacity={isHovered ? 0.5 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default ItemChoice;
