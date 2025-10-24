import { Fragment } from "react";
import { Imp } from "../enemies/Imp";
import { Portal } from "../models/Portal";
import type { Enemy } from "../../types/combat.types";

interface EnemyRendererProps {
  enemies: Enemy[];
  selectedEnemyId: number | null;
  hoveredEnemyId: number | null;
  onEnemyClick: (enemyId: number) => void;
  onEnemyHover: (enemy: Enemy, event: MouseEvent) => void;
  onEnemyHoverEnd: () => void;
}

/**
 * EnemyRenderer - Handles rendering of all enemies in combat
 * Extracted from Scene.tsx to reduce complexity
 */
export function EnemyRenderer({
  enemies,
  selectedEnemyId,
  hoveredEnemyId,
  onEnemyClick,
  onEnemyHover,
  onEnemyHoverEnd
}: EnemyRendererProps) {
  return (
    <>
      {enemies.map((enemy, index) => (
        <Fragment key={enemy.id}>
          {/* Portal spawn animation */}
          {enemy.portalProgress > 0 && (
            <Portal
              progress={enemy.portalProgress}
              position={[
                enemy.position[0],
                enemy.position[1],
                enemy.position[2] + 0.01
              ]}
              scale={0.15} // Scale portal to match imp size (imp is 0.1, portal slightly larger)
            />
          )}

          {/* Enemy model - currently only Imp type */}
          <Imp
            position={enemy.position}
            scale={0.1}
            animationOffset={index}
            entranceAnimationProgress={enemy.entranceAnimationProgress}
            playEntranceAnimation={true}
            rotation={[0, Math.PI / (index * 0.2 - 1.1), 0]}
            sensor={enemy.entranceAnimationProgress < 1}
            onClick={() => onEnemyClick(enemy.id)}
            onPointerOver={(e) => {
              const mouseEvent = (e as any).nativeEvent || e;
              onEnemyHover(enemy, mouseEvent);
            }}
            onPointerOut={onEnemyHoverEnd}
            isSelected={selectedEnemyId === enemy.id}
            isHovered={hoveredEnemyId === enemy.id}
            enemyId={enemy.id}
            enemyData={enemy}
          />
        </Fragment>
      ))}
    </>
  );
}
