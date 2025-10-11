import { useEffect, useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';
import { usePS1Texture } from '../../hooks/usePS1Texture';
import { FADE_THRESHOLD, FADE_RANGE } from '../../constants/gameConfig';

interface WindowProps {
  hellFactor: number;
}

function WindowContent({ hellFactor }: WindowProps) {
  const frameMaterial = useCorruptionMaterial({
    normalColor: 0xffffff,
    hellColor: 0x330000,
  });

  const normalGlassMaterial = useCorruptionMaterial({
    normalColor: 0x87ceeb,
    hellColor: 0x1a0000,
    transparent: true,
  });

  const hellGlassMaterial = useCorruptionMaterial({
    normalColor: 0x8b0000,
    hellColor: 0x330000,
    transparent: true,
  });

  // Load the hell screen texture with PS1 settings
  const hellScreenTexture = usePS1Texture('/src/assets/textures/hellscreen.png');

  // Create a material for the hell screen texture
  const hellScreenMaterial = useMemo(() => {
    if (!hellScreenTexture) return null;

    return new THREE.MeshBasicMaterial({
      map: hellScreenTexture,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      // Disable depth write for transparency sorting
      depthWrite: false,
      // Additive blending for glowing effect
      blending: THREE.AdditiveBlending,
    });
  }, [hellScreenTexture]);

  const normalGlassRef = useRef<THREE.Mesh>(null);
  const hellGlassRef = useRef<THREE.Mesh>(null);
  const hellScreenRef = useRef<THREE.Mesh>(null);

  // Update hell factor
  if (frameMaterial.uniforms) frameMaterial.uniforms.hellFactor.value = hellFactor;
  if (normalGlassMaterial.uniforms) normalGlassMaterial.uniforms.hellFactor.value = hellFactor;
  if (hellGlassMaterial.uniforms) hellGlassMaterial.uniforms.hellFactor.value = hellFactor;

  // Configure glass materials
  normalGlassMaterial.side = THREE.DoubleSide;
  normalGlassMaterial.polygonOffset = true;
  normalGlassMaterial.polygonOffsetFactor = -1;
  normalGlassMaterial.polygonOffsetUnits = -1;

  hellGlassMaterial.side = THREE.DoubleSide;
  hellGlassMaterial.polygonOffset = true;
  hellGlassMaterial.polygonOffsetFactor = -1;
  hellGlassMaterial.polygonOffsetUnits = -1;

  // Handle swapping opacity based on corruption
  useEffect(() => {
    let normalOpacity: number, hellOpacity: number, hellScreenOpacity: number;

    // Hell screen appears at very high corruption (70%+)
    const hellScreenThreshold = 0.7;
    const hellScreenFadeRange = 0.2;

    if (hellFactor < FADE_THRESHOLD) {
      normalOpacity = 1.0;
      hellOpacity = 0.0;
      hellScreenOpacity = 0.0;
    } else if (hellFactor > FADE_THRESHOLD + FADE_RANGE) {
      normalOpacity = 0.0;
      hellOpacity = 1.0;

      // Fade in hell screen at very high corruption
      if (hellFactor < hellScreenThreshold) {
        hellScreenOpacity = 0.0;
      } else if (hellFactor > hellScreenThreshold + hellScreenFadeRange) {
        hellScreenOpacity = 1.0;
      } else {
        const screenProgress = (hellFactor - hellScreenThreshold) / hellScreenFadeRange;
        hellScreenOpacity = screenProgress;
      }
    } else {
      const fadeProgress = (hellFactor - FADE_THRESHOLD) / FADE_RANGE;
      normalOpacity = 1.0 - fadeProgress;
      hellOpacity = fadeProgress;
      hellScreenOpacity = 0.0;
    }

    if (normalGlassMaterial.uniforms) {
      normalGlassMaterial.uniforms.opacity.value = normalOpacity;
    }
    if (hellGlassMaterial.uniforms) {
      hellGlassMaterial.uniforms.opacity.value = hellOpacity;
    }
    if (hellScreenMaterial) {
      hellScreenMaterial.opacity = hellScreenOpacity * 0.8; // Cap at 80% for better blending
    }

    if (normalGlassRef.current) {
      normalGlassRef.current.visible = normalOpacity > 0.01;
    }
    if (hellGlassRef.current) {
      hellGlassRef.current.visible = hellOpacity > 0.01;
    }
    if (hellScreenRef.current) {
      hellScreenRef.current.visible = hellScreenOpacity > 0.01;
    }
  }, [hellFactor, normalGlassMaterial, hellGlassMaterial, hellScreenMaterial]);

  return (
    <group>
      {/* Frame */}
      <mesh position={[3, 2.5, -4.9]} material={frameMaterial}>
        <boxGeometry args={[2, 2, 0.2]} />
      </mesh>

      {/* Normal glass */}
      <mesh ref={normalGlassRef} position={[3, 2.5, -4.75]} material={normalGlassMaterial}>
        <planeGeometry args={[1.8, 1.8]} />
      </mesh>

      {/* Hell glass */}
      <mesh ref={hellGlassRef} position={[3, 2.5, -4.74]} material={hellGlassMaterial}>
        <planeGeometry args={[1.8, 1.8]} />
      </mesh>

      {/* Hell screen texture layer - appears at very high corruption */}
      {hellScreenMaterial && (
        <mesh ref={hellScreenRef} position={[3, 2.5, -4.73]} material={hellScreenMaterial}>
          <planeGeometry args={[1.8, 1.8]} />
        </mesh>
      )}
    </group>
  );
}

// Main Window component with Suspense for texture loading
export function Window(props: WindowProps) {
  return (
    <Suspense fallback={null}>
      <WindowContent {...props} />
    </Suspense>
  );
}

export default Window;
