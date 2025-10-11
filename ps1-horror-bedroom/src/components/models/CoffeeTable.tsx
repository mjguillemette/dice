import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';
import { COFFEE_TABLE } from '../../constants/modelPositions';

interface CoffeeTableProps {
  hellFactor: number;
}

/**
 * Coffee Table Component
 *
 * Simple wooden coffee table with four legs and a top surface
 */
export function CoffeeTable({ hellFactor }: CoffeeTableProps) {
  // Wood material for table
  const woodMaterial = useCorruptionMaterial({
    normalColor: 0x8B4513, // Saddle brown
    hellColor: 0x2a0a0a,
  });

  // Update hell factor
  if (woodMaterial.uniforms) {
    woodMaterial.uniforms.hellFactor.value = hellFactor;
  }

  const { width, height, depth } = COFFEE_TABLE.dimensions;
  const legWidth = COFFEE_TABLE.legWidth;
  const legHeight = COFFEE_TABLE.legHeight;
  const topThickness = height - legHeight;

  // Calculate leg positions (inset from edges)
  const legInset = 0.15;
  const legPositions: [number, number, number][] = [
    [-width / 2 + legInset, legHeight / 2, -depth / 2 + legInset], // Front left
    [width / 2 - legInset, legHeight / 2, -depth / 2 + legInset], // Front right
    [-width / 2 + legInset, legHeight / 2, depth / 2 - legInset], // Back left
    [width / 2 - legInset, legHeight / 2, depth / 2 - legInset], // Back right
  ];

  return (
    <group position={COFFEE_TABLE.position}>
      {/* Table top */}
      <mesh position={[0, legHeight + topThickness / 2, 0]} material={woodMaterial}>
        <boxGeometry args={[width, topThickness, depth]} />
      </mesh>

      {/* Table legs */}
      {legPositions.map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos} material={woodMaterial}>
          <boxGeometry args={[legWidth, legHeight, legWidth]} />
        </mesh>
      ))}
    </group>
  );
}

export default CoffeeTable;
