import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { PhysicalObject } from '../physics/PhysicalObject';
import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';
import { RECEPTACLE_DIMENSIONS } from '../../constants/receptacleConfig';

interface DiceReceptacleProps {
  position: [number, number, number];
  hellFactor: number;
  spotlightHeight?: number;
  spotlightIntensity?: number;
  spotlightAngle?: number;
}

/**
 * Dice Receptacle Component
 *
 * A large, shallow wooden box/tray for rolling dice into.
 * Classic dice tray design with raised edges to keep dice contained.
 *
 * Uses PhysicalObject to ensure collision geometry stays synchronized with visual geometry.
 * Dimensions are defined in receptacleConfig.ts for consistency with DiceManager.
 */
export function DiceReceptacle({
  position,
  hellFactor,
  spotlightHeight = 0.5,
  spotlightIntensity = 0.8,
  spotlightAngle = Math.PI / 6
}: DiceReceptacleProps) {
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  // Outer wood frame material
  const frameMaterial = useCorruptionMaterial({
    normalColor: 0x654321, // Dark brown wood
    hellColor: 0x1a0000,
  });

  // Inner felt/fabric surface material
  const feltMaterial = useCorruptionMaterial({
    normalColor: 0x2d5016, // Dark green felt
    hellColor: 0x0d0000,
  });

  // Update hell factor
  if (frameMaterial.uniforms) frameMaterial.uniforms.hellFactor.value = hellFactor;
  if (feltMaterial.uniforms) feltMaterial.uniforms.hellFactor.value = hellFactor;

  // Set spotlight target
  useEffect(() => {
    if (spotLightRef.current && targetRef.current) {
      spotLightRef.current.target = targetRef.current;
    }
  }, []);

  // Tray dimensions from centralized config
  const { width: trayWidth, depth: trayDepth, baseThickness: trayBaseThickness, wallHeight, wallThickness } = RECEPTACLE_DIMENSIONS;

  // Debug: Log receptacle setup once
  console.log('🎲 DiceReceptacle setup:', {
    position,
    dimensions: { trayWidth, trayDepth, wallHeight, wallThickness },
    innerDimensions: {
      width: trayWidth - wallThickness * 2,
      depth: trayDepth - wallThickness * 2
    }
  });

  return (
    <PhysicalObject
      position={position}
      collision={{
        type: 'compound',
        shapes: [
          // Base - thin floor at bottom
          {
            type: 'box',
            size: [trayWidth, trayBaseThickness, trayDepth],
            offset: [0, trayBaseThickness / 2, 0],
          },
          // Front wall
          {
            type: 'box',
            size: [trayWidth, wallHeight, wallThickness],
            offset: [0, trayBaseThickness + wallHeight / 2, trayDepth / 2 - wallThickness / 2],
          },
          // Back wall
          {
            type: 'box',
            size: [trayWidth, wallHeight, wallThickness],
            offset: [0, trayBaseThickness + wallHeight / 2, -(trayDepth / 2 - wallThickness / 2)],
          },
          // Left wall
          {
            type: 'box',
            size: [wallThickness, wallHeight, trayDepth - wallThickness * 2],
            offset: [-(trayWidth / 2 - wallThickness / 2), trayBaseThickness + wallHeight / 2, 0],
          },
          // Right wall
          {
            type: 'box',
            size: [wallThickness, wallHeight, trayDepth - wallThickness * 2],
            offset: [trayWidth / 2 - wallThickness / 2, trayBaseThickness + wallHeight / 2, 0],
          },
        ],
      }}
      friction={0.8}
      restitution={0.15}
    >
      {/* Visual meshes */}
      {/* Base (bottom of tray) */}
      <mesh position={[0, trayBaseThickness / 2, 0]} material={frameMaterial}>
        <boxGeometry args={[trayWidth, trayBaseThickness, trayDepth]} />
      </mesh>

      {/* Felt surface on top of base */}
      <mesh position={[0, trayBaseThickness + 0.005, 0]} material={feltMaterial}>
        <boxGeometry args={[trayWidth - wallThickness * 2, 0.01, trayDepth - wallThickness * 2]} />
      </mesh>

      {/* Front wall (towards player, closer Z) */}
      <mesh
        position={[0, trayBaseThickness + wallHeight / 2, trayDepth / 2 - wallThickness / 2]}
        material={frameMaterial}
      >
        <boxGeometry args={[trayWidth, wallHeight, wallThickness]} />
      </mesh>

      {/* Back wall */}
      <mesh
        position={[0, trayBaseThickness + wallHeight / 2, -(trayDepth / 2 - wallThickness / 2)]}
        material={frameMaterial}
      >
        <boxGeometry args={[trayWidth, wallHeight, wallThickness]} />
      </mesh>

      {/* Left wall */}
      <mesh
        position={[-(trayWidth / 2 - wallThickness / 2), trayBaseThickness + wallHeight / 2, 0]}
        material={frameMaterial}
      >
        <boxGeometry args={[wallThickness, wallHeight, trayDepth - wallThickness * 2]} />
      </mesh>

      {/* Right wall */}
      <mesh
        position={[trayWidth / 2 - wallThickness / 2, trayBaseThickness + wallHeight / 2, 0]}
        material={frameMaterial}
      >
        <boxGeometry args={[wallThickness, wallHeight, trayDepth - wallThickness * 2]} />
      </mesh>

      {/* Focused spotlight above the receptacle to illuminate dice faces */}
      {/* Uses a warm neutral tone to enhance contrast rather than wash out details */}
      <spotLight
        ref={spotLightRef}
        position={[0, spotlightHeight, 0]} // Height controlled by DevPanel
        intensity={hellFactor > 0.5 ? spotlightIntensity * 0.75 : spotlightIntensity} // Dimmer in hell mode
        color={hellFactor > 0.5 ? 0xff6633 : 0xffeedd} // Warm neutral (not pure white) for better contrast
        angle={spotlightAngle} // Cone angle controlled by DevPanel
        penumbra={0.2} // Slight edge softness for more natural look
        distance={spotlightHeight * 2.5} // Distance scales with height
        decay={2} // Natural light falloff
        castShadow={true} // Enable shadows for depth and contrast
        shadow-mapSize-width={512} // Lower res shadows for performance
        shadow-mapSize-height={512}
        shadow-bias={-0.0001}
      />

      {/* Invisible target object for spotlight to aim at */}
      <object3D ref={targetRef} position={[0, 0, 0]} />
    </PhysicalObject>
  );
}

export default DiceReceptacle;
