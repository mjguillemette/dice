import { type Enemy } from "../../types/combat.types";
import "./EnemyInfo.css";

export interface EnemyInfoData {
  enemy: Enemy;
  position: { x: number; y: number };
}

interface EnemyInfoProps {
  enemyData: EnemyInfoData | null;
}

export function EnemyInfo({ enemyData }: EnemyInfoProps) {
  if (!enemyData) return null;

  const { enemy, position } = enemyData;

  return (
    <div
      className="enemy-info-tooltip"
      style={{
        position: "fixed",
        left: `${position.x + 20}px`,
        top: `${position.y - 40}px`,
        pointerEvents: "none",
        zIndex: 10000
      }}
    >
      <div className="enemy-info-header">
        <span className="enemy-type">{enemy.type.toUpperCase()}</span>
        <span className="enemy-hp">
          {enemy.hp}/{enemy.maxHp} HP
        </span>
      </div>

      {enemy.attackRoll !== undefined && (
        <div className="enemy-attack-info">
          <span className="attack-label">Attack Damage:</span>
          <span className="attack-value">{enemy.attackRoll}</span>
          {enemy.diceValue && (
            <span className="dice-value">(Rolled {enemy.diceValue})</span>
          )}
        </div>
      )}
    </div>
  );
}

export default EnemyInfo;
