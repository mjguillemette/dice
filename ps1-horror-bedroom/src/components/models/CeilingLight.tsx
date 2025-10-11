import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';
import { FADE_THRESHOLD, FADE_RANGE } from '../../constants/gameConfig';

interface CeilingLightProps {
  hellFactor: number;
}

export function CeilingLight({ hellFactor }: CeilingLightProps) {
  const normalLightMaterial = useCorruptionMaterial({
    normalColor: 0xffffe0,
    hellColor: 0xff0000,
    transparent: true,
  });

  const hellLightMaterial = useCorruptionMaterial({
    normalColor: 0xff0000,
    hellColor: 0x8b0000,
    transparent: true,
  });

  const normalLightRef = useRef<THREE.Mesh>(null);
  const hellLightRef = useRef<THREE.Mesh>(null);

  // Update hell factor
  if (normalLightMaterial.uniforms) normalLightMaterial.uniforms.hellFactor.value = hellFactor;
  if (hellLightMaterial.uniforms) hellLightMaterial.uniforms.hellFactor.value = hellFactor;

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

    if (normalLightMaterial.uniforms) {
      normalLightMaterial.uniforms.opacity.value = normalOpacity;
    }
    if (hellLightMaterial.uniforms) {
      hellLightMaterial.uniforms.opacity.value = hellOpacity;
    }

    if (normalLightRef.current) {
      normalLightRef.current.visible = normalOpacity > 0.01;
    }
    if (hellLightRef.current) {
      hellLightRef.current.visible = hellOpacity > 0.01;
    }
  }, [hellFactor, normalLightMaterial, hellLightMaterial]);

  return (
    <group>
      {/* Normal light fixture */}
      <mesh ref={normalLightRef} position={[0, 4.7, 0]} renderOrder={3} material={normalLightMaterial}>
        <sphereGeometry args={[0.3, 8, 8]} />
      </mesh>

      {/* Hell light fixture */}
      <mesh ref={hellLightRef} position={[0, 4.7, 0]} renderOrder={3} material={hellLightMaterial}>
        <sphereGeometry args={[0.3, 8, 8]} />
      </mesh>
    </group>
  );
}

export default CeilingLight;
