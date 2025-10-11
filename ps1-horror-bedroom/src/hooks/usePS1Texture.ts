import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

/**
 * Custom hook to load and configure a texture with PS1-style rendering
 * @param texturePath - Path to the texture file
 * @returns Configured THREE.Texture with PS1 settings
 */
export function usePS1Texture(texturePath: string) {
  const texture = useLoader(THREE.TextureLoader, texturePath);
  const [ps1Texture, setPS1Texture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (texture) {
      // Clone the texture to avoid modifying the cached version
      const configuredTexture = texture.clone();

      // PS1-style texture settings
      // Use nearest neighbor filtering for pixelated look
      configuredTexture.minFilter = THREE.NearestFilter;
      configuredTexture.magFilter = THREE.NearestFilter;

      // Disable mipmaps for authentic PS1 look
      configuredTexture.generateMipmaps = false;

      // Repeat/wrap settings - clamp to edge to avoid artifacts
      configuredTexture.wrapS = THREE.ClampToEdgeWrapping;
      configuredTexture.wrapT = THREE.ClampToEdgeWrapping;

      // Enable anisotropic filtering set to 1 for PS1 authenticity
      configuredTexture.anisotropy = 1;

      configuredTexture.needsUpdate = true;

      setPS1Texture(configuredTexture);
    }
  }, [texture]);

  return ps1Texture;
}

export default usePS1Texture;
