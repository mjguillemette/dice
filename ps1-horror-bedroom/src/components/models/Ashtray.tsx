import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';
import { usePS1Texture } from '../../hooks/usePS1Texture';
import { BUREAU } from '../../constants/modelPositions';

interface AshtrayProps {
  hellFactor: number;
  cigaretteCount?: number; // Number of cigarettes acquired (butts to show)
}

function AshtrayContent({ hellFactor, cigaretteCount = 0 }: AshtrayProps) {
  // Ashtray base - ceramic/glass material
  const ashtrayMaterial = useCorruptionMaterial({
    normalColor: 0x8b8680, // Grayish ceramic
    hellColor: 0x2a0a0a,   // Dark corrupted
  });

  // Cigarette paper/filter
  const cigaretteMaterial = useCorruptionMaterial({
    normalColor: 0xf5f5dc, // Beige/cream
    hellColor: 0x1a0000,   // Dark corrupted
  });

  // Cigarette tip (lit ember) - swappable for corruption
  const normalEmberMaterial = useCorruptionMaterial({
    normalColor: 0xff4500, // Orange-red ember
    hellColor: 0xff0000,   // Bright red
    transparent: true,
  });

  const hellEmberMaterial = useCorruptionMaterial({
    normalColor: 0x00ff00, // Sickly green
    hellColor: 0x00aa00,   // Dark green
    transparent: true,
  });

  // Ash color
  const ashMaterial = useCorruptionMaterial({
    normalColor: 0x696969, // Dark gray ash
    hellColor: 0x330000,   // Blood-tinged ash
  });

  // Load the green glow texture with PS1 settings
  const greenGlowTexture = usePS1Texture('greenglow.png');

  // Create a material for the green glow texture
  const greenGlowMaterial = useMemo(() => {
    if (!greenGlowTexture) return null;

    return new THREE.MeshBasicMaterial({
      map: greenGlowTexture,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false, // Render on top
      blending: THREE.AdditiveBlending,
    });
  }, [greenGlowTexture]);

  // Update hell factor for all materials
  if (ashtrayMaterial.uniforms) ashtrayMaterial.uniforms.hellFactor.value = hellFactor;
  if (cigaretteMaterial.uniforms) cigaretteMaterial.uniforms.hellFactor.value = hellFactor;
  if (normalEmberMaterial.uniforms) normalEmberMaterial.uniforms.hellFactor.value = hellFactor;
  if (hellEmberMaterial.uniforms) hellEmberMaterial.uniforms.hellFactor.value = hellFactor;
  if (ashMaterial.uniforms) ashMaterial.uniforms.hellFactor.value = hellFactor;

  // Ember swapping logic
  const emberThreshold = 0.5;
  let normalEmberOpacity = 1.0;
  let hellEmberOpacity = 0.0;

  if (hellFactor > emberThreshold) {
    const fadeProgress = (hellFactor - emberThreshold) / (1.0 - emberThreshold);
    normalEmberOpacity = 1.0 - fadeProgress;
    hellEmberOpacity = fadeProgress;
  }

  if (normalEmberMaterial.uniforms) {
    normalEmberMaterial.uniforms.opacity.value = normalEmberOpacity;
  }
  if (hellEmberMaterial.uniforms) {
    hellEmberMaterial.uniforms.opacity.value = hellEmberOpacity;
  }

  // Green glow appears at very high corruption (70%+)
  const greenGlowThreshold = 0.7;
  const greenGlowFadeRange = 0.2;
  let greenGlowOpacity = 0.0;

  if (hellFactor < greenGlowThreshold) {
    greenGlowOpacity = 0.0;
  } else if (hellFactor > greenGlowThreshold + greenGlowFadeRange) {
    greenGlowOpacity = 1.0;
  } else {
    const glowProgress = (hellFactor - greenGlowThreshold) / greenGlowFadeRange;
    greenGlowOpacity = glowProgress;
  }

  if (greenGlowMaterial) {
    greenGlowMaterial.opacity = greenGlowOpacity * 0.9; // Cap at 90% for blending
  }

  // Position on top of dresser
  // All values come from modelPositions.ts - change there to move both bureau and ashtray!
  const posX = BUREAU.position[0]; // Centered on bureau X
  const posY = BUREAU.topSurfaceY + 0.05; // On top surface + small offset
  const posZ = BUREAU.position[2]; // Aligned with bureau center

  return (
    <group position={[posX, posY, posZ]}>
      {/* Ashtray base - shallow cylinder */}
      <mesh material={ashtrayMaterial}>
        <cylinderGeometry args={[0.12, 0.14, 0.04, 8]} />
      </mesh>

      {/* Ashtray rim detail - torus rotated to be horizontal */}
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={ashtrayMaterial}>
        <torusGeometry args={[0.13, 0.01, 6, 8]} />
      </mesh>

      {/* Cigarette body - small cylinder at an angle */}
      <group position={[0.05, 0.03, 0]} rotation={[0, 0, Math.PI / 6]}>
        {/* Main cigarette body */}
        <mesh material={cigaretteMaterial}>
          <cylinderGeometry args={[0.01, 0.01, 0.15, 6]} />
        </mesh>

        {/* Filter end (slightly thicker, orange tint) */}
        <mesh position={[0, -0.06, 0]} material={cigaretteMaterial}>
          <cylinderGeometry args={[0.012, 0.01, 0.03, 6]} />
        </mesh>

        {/* Burnt tip (black/dark) */}
        <mesh position={[0, 0.08, 0]} material={ashMaterial}>
          <cylinderGeometry args={[0.008, 0.01, 0.01, 6]} />
        </mesh>

        {/* Normal ember glow (orange-red) */}
        <mesh
          position={[0, 0.085, 0]}
          material={normalEmberMaterial}
          visible={normalEmberOpacity > 0.01}
        >
          <sphereGeometry args={[0.012, 6, 6]} />
        </mesh>

        {/* Hell ember glow (sickly green) */}
        <mesh
          position={[0, 0.085, 0]}
          material={hellEmberMaterial}
          visible={hellEmberOpacity > 0.01}
        >
          <sphereGeometry args={[0.012, 6, 6]} />
        </mesh>
      </group>

      {/* Ash pile in ashtray */}
      <mesh position={[0, -0.01, 0]} material={ashMaterial}>
        <cylinderGeometry args={[0.06, 0.08, 0.02, 8]} />
      </mesh>

      {/* Dynamic cigarette butts based on cigarette count */}
      {Array.from({ length: Math.min(cigaretteCount, 20) }).map((_, index) => {
        // Arrange butts in a circular pattern within the ashtray
        const angle = (index / 20) * Math.PI * 2;
        const radius = 0.05 + (index % 3) * 0.02; // Vary radius for stacking effect
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const rotation = angle + (Math.random() - 0.5) * 0.5; // Random rotation variation

        return (
          <mesh
            key={index}
            position={[x, 0.005, z]}
            rotation={[0, 0, rotation]}
            material={index % 2 === 0 ? cigaretteMaterial : ashMaterial}
          >
            <cylinderGeometry args={[0.008, 0.008, 0.03 + Math.random() * 0.01, 6]} />
          </mesh>
        );
      })}

      {/* Green glow texture in center - appears at very high corruption */}
      {greenGlowMaterial && (
        <mesh
          position={[0, 0.04, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={greenGlowMaterial}
          visible={greenGlowOpacity > 0.01}
          renderOrder={1000}
        >
          <planeGeometry args={[0.2, 0.2]} />
        </mesh>
      )}
    </group>
  );
}

// Main Ashtray component with Suspense for texture loading
export function Ashtray(props: AshtrayProps) {
  return (
    <Suspense fallback={null}>
      <AshtrayContent {...props} />
    </Suspense>
  );
}

export default Ashtray;
