import { ReactNode } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3 } from 'three';

/**
 * Collision shape definitions
 */
export type CollisionShape =
  | { type: 'box'; size: [number, number, number]; offset?: [number, number, number] }
  | { type: 'compound'; shapes: CollisionShape[] };

/**
 * Physical object configuration
 */
export interface PhysicalObjectConfig {
  position: [number, number, number];
  collision: CollisionShape;
  friction?: number;
  restitution?: number;
  mass?: number; // If undefined, object is static (type="fixed")
  rotation?: [number, number, number];
}

interface PhysicalObjectProps extends PhysicalObjectConfig {
  children: ReactNode;
}

/**
 * PhysicalObject Component
 *
 * A wrapper that combines visual geometry with collision geometry.
 * Ensures that collision boxes always match the visual object's position.
 *
 * Usage:
 * ```tsx
 * <PhysicalObject
 *   position={[0, 0.5, 0]}
 *   collision={{ type: 'box', size: [1, 1, 1] }}
 *   friction={0.6}
 * >
 *   <mesh>
 *     <boxGeometry args={[1, 1, 1]} />
 *     <meshStandardMaterial />
 *   </mesh>
 * </PhysicalObject>
 * ```
 */
export function PhysicalObject({
  position,
  collision,
  friction = 0.5,
  restitution = 0.2,
  mass,
  rotation,
  children,
}: PhysicalObjectProps) {
  const renderCollider = (shape: CollisionShape, index: number = 0) => {
    if (shape.type === 'box') {
      const offset = shape.offset || [0, 0, 0];
      return (
        <CuboidCollider
          key={index}
          args={shape.size.map(s => s / 2) as [number, number, number]}
          position={offset}
        />
      );
    } else if (shape.type === 'compound') {
      return shape.shapes.map((s, i) => renderCollider(s, i));
    }
    return null;
  };

  return (
    <RigidBody
      type={mass === undefined ? 'fixed' : 'dynamic'}
      position={position}
      rotation={rotation}
      friction={friction}
      restitution={restitution}
      mass={mass}
    >
      {/* Collision geometry */}
      {renderCollider(collision)}

      {/* Visual geometry */}
      <group>
        {children}
      </group>
    </RigidBody>
  );
}

export default PhysicalObject;
