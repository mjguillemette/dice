import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';
import { FADE_THRESHOLD, FADE_RANGE } from '../../constants/gameConfig';

interface DecorationsProps {
  hellFactor: number;
}

export function Decorations({ hellFactor }: DecorationsProps) {
  // Teddy bear materials
  const normalBearMaterial = useCorruptionMaterial({
    normalColor: 0xd2691e,
    hellColor: 0x8b4513,
    transparent: true,
  });

  const hellBearMaterial = useCorruptionMaterial({
    normalColor: 0x2d0000,
    hellColor: 0x000000,
    transparent: true,
  });

  // Lamp materials
  const normalLampMaterial = useCorruptionMaterial({
    normalColor: 0x8b7355,
    hellColor: 0x2d0000,
    transparent: true,
  });

  const hellLampMaterial = useCorruptionMaterial({
    normalColor: 0x4a4a4a,
    hellColor: 0x1a0000,
    transparent: true,
  });

  const normalBearRef = useRef<THREE.Mesh>(null);
  const hellBearRef = useRef<THREE.Mesh>(null);
  const normalLampRef = useRef<THREE.Mesh>(null);
  const hellLampRef = useRef<THREE.Mesh>(null);

  // Update hell factor
  if (normalBearMaterial.uniforms) normalBearMaterial.uniforms.hellFactor.value = hellFactor;
  if (hellBearMaterial.uniforms) hellBearMaterial.uniforms.hellFactor.value = hellFactor;
  if (normalLampMaterial.uniforms) normalLampMaterial.uniforms.hellFactor.value = hellFactor;
  if (hellLampMaterial.uniforms) hellLampMaterial.uniforms.hellFactor.value = hellFactor;

  // Handle swapping opacity based on corruption
  useEffect(() => {
    let normalOpacity: number, hellOpacity: number;

    if (hellFactor < FADE_THRESHOLD) {
      normalOpacity = 1.0;
      hellOpacity = 0.0;
    } else if (hellFactor > FADE_THRESHOLD + FADE_RANGE) {
      normalOpacity = 0.0;
      hellOpacity = 1.0;
    } else {
      const fadeProgress = (hellFactor - FADE_THRESHOLD) / FADE_RANGE;
      normalOpacity = 1.0 - fadeProgress;
      hellOpacity = fadeProgress;
    }

    // Update bear
    if (normalBearMaterial.uniforms) {
      normalBearMaterial.uniforms.opacity.value = normalOpacity;
    }
    if (hellBearMaterial.uniforms) {
      hellBearMaterial.uniforms.opacity.value = hellOpacity;
    }

    if (normalBearRef.current) {
      normalBearRef.current.visible = normalOpacity > 0.01;
    }
    if (hellBearRef.current) {
      hellBearRef.current.visible = hellOpacity > 0.01;
    }

    // Update lamp
    if (normalLampMaterial.uniforms) {
      normalLampMaterial.uniforms.opacity.value = normalOpacity;
    }
    if (hellLampMaterial.uniforms) {
      hellLampMaterial.uniforms.opacity.value = hellOpacity;
    }

    if (normalLampRef.current) {
      normalLampRef.current.visible = normalOpacity > 0.01;
    }
    if (hellLampRef.current) {
      hellLampRef.current.visible = hellOpacity > 0.01;
    }
  }, [hellFactor, normalBearMaterial, hellBearMaterial, normalLampMaterial, hellLampMaterial]);

  return (
    <group>
      {/* Normal teddy bear */}
      <mesh
        ref={normalBearRef}
        position={[-3, 0.8, -2]}
        renderOrder={4}
        material={normalBearMaterial}
      >
        <sphereGeometry args={[0.15, 8, 8]} />
      </mesh>

      {/* Hell teddy bear */}
      <mesh
        ref={hellBearRef}
        position={[-3, 0.8, -2]}
        renderOrder={4}
        material={hellBearMaterial}
      >
        <sphereGeometry args={[0.15, 8, 8]} />
      </mesh>

      {/* Normal lamp */}
      <mesh
        ref={normalLampRef}
        position={[3.6, 1.65, -3]}
        renderOrder={5}
        material={normalLampMaterial}
      >
        <cylinderGeometry args={[0.1, 0.15, 0.3, 8]} />
      </mesh>

      {/* Hell lamp */}
      <mesh
        ref={hellLampRef}
        position={[3.6, 1.65, -3]}
        renderOrder={5}
        material={hellLampMaterial}
      >
        <cylinderGeometry args={[0.1, 0.15, 0.3, 8]} />
      </mesh>
    </group>
  );
}

export default Decorations;
