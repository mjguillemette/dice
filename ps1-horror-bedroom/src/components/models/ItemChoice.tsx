import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { type ItemDefinition } from '../../systems/itemSystem';

interface ItemChoiceProps {
  item: ItemDefinition;
  position: [number, number, number];
  onSelect: () => void;
}

/**
 * ItemChoice - 3D representation of an item choice
 * Displays item as a hoverable 3D object with rarity-colored outline
 */
export function ItemChoice({ item, position, onSelect }: ItemChoiceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const outlineRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { camera, raycaster } = useThree();

  // Rarity color mapping
  const rarityColors: Record<ItemDefinition['rarity'], number> = {
    common: 0x999999,
    uncommon: 0x4488ff,
    rare: 0xffd700,
  };

  const rarityColor = rarityColors[item.rarity];

  // Size based on item type
  const getItemSize = (): [number, number, number] => {
    switch (item.effect.type) {
      case 'add_dice':
        return [0.04, 0.04, 0.04]; // Small cube for dice
      case 'add_card':
        return [0.08, 0.001, 0.12]; // Flat rectangle for cards
      case 'add_decoration':
        return [0.05, 0.08, 0.05]; // Tall box for decorations
      default:
        return [0.05, 0.05, 0.05];
    }
  };

  const itemSize = getItemSize();

  // Check for hover using raycaster
  useFrame(() => {
    if (!meshRef.current) return;

    // Get mouse position in normalized device coordinates
    const mouse = new THREE.Vector2();
    // Center of screen for first-person crosshair
    mouse.x = 0;
    mouse.y = 0;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(meshRef.current);

    const wasHovered = isHovered;
    const nowHovered = intersects.length > 0;

    if (nowHovered !== wasHovered) {
      setIsHovered(nowHovered);
    }

    // Animate outline
    if (outlineRef.current) {
      outlineRef.current.visible = isHovered;
      if (isHovered) {
        // Pulsing effect
        const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
        outlineRef.current.scale.setScalar(1 + pulse * 0.1);
      }
    }

    // Floating animation
    if (meshRef.current) {
      const float = Math.sin(Date.now() * 0.001 + position[0]) * 0.02;
      meshRef.current.position.y = position[1] + float;
    }
  });

  // Handle click
  const handleClick = () => {
    if (isHovered) {
      console.log('🎁 Selected item:', item.name);
      onSelect();
    }
  };

  // Item color based on type
  const getItemColor = (): number => {
    switch (item.effect.type) {
      case 'add_dice':
        return 0xffffff; // White for dice
      case 'add_card':
        return 0xaa88ff; // Purple for cards
      case 'add_decoration':
        return 0x88ccff; // Light blue for decorations
      default:
        return 0xcccccc;
    }
  };

  return (
    <group position={position}>
      {/* Outline (only visible when hovered) */}
      <mesh ref={outlineRef} visible={false}>
        <boxGeometry args={[itemSize[0] * 1.2, itemSize[1] * 1.2, itemSize[2] * 1.2]} />
        <meshBasicMaterial
          color={rarityColor}
          transparent
          opacity={0.5}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main item mesh */}
      <RigidBody type="fixed" colliders={false}>
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        >
          {item.effect.type === 'add_card' ? (
            <boxGeometry args={itemSize} />
          ) : (
            <boxGeometry args={itemSize} />
          )}
          <meshStandardMaterial
            color={getItemColor()}
            emissive={rarityColor}
            emissiveIntensity={isHovered ? 0.5 : 0.2}
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
      </RigidBody>

      {/* Floating text label (item name) */}
      {isHovered && (
        <group position={[0, itemSize[1] + 0.08, 0]}>
          <mesh>
            <planeGeometry args={[0.3, 0.08]} />
            <meshBasicMaterial
              color={0x000000}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Text would go here - for now we rely on console logs */}
        </group>
      )}

      {/* Pedestal / base */}
      <mesh position={[0, -0.025, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.01, 16]} />
        <meshStandardMaterial
          color={rarityColor}
          emissive={rarityColor}
          emissiveIntensity={0.3}
          roughness={0.5}
          metalness={0.7}
        />
      </mesh>

      {/* Glow ring effect */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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
