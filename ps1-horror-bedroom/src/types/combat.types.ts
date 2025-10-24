export interface Enemy {
  id: number;
  type: string;
  position: [number, number, number];
  hp: number;
  maxHp: number;
  portalProgress: number;
  entranceAnimationProgress: number;

  // Attack data
  attackRoll?: number; // Damage rolled for this round
  diceValue?: number; // Visual dice value shown (1-6)
}

export type CombatPhase =
  | "combat_enemy_spawn"    // Enemies spawning with portal animations
  | "combat_await_player"   // Waiting for player to throw dice to start next round
  | "combat_enemy_roll"     // Enemies rolling for attack damage
  | "combat_player_turn"    // Player selecting abilities and using them on enemies
  | "combat_resolve"        // Applying damage, removing defeated enemies
  | null;                   // No combat active

export interface CombatState {
  phase: CombatPhase;
  enemies: Enemy[];
  playerHP: number;
  maxPlayerHP: number;
  selectedAbility: string | null; // Category of ability selected (e.g., "pair", "three_of_kind")
  selectedEnemyId: number | null; // Enemy being targeted
  usedDiceIds: number[]; // Dice IDs that have been used this combat round
  currentDiceRoll: {
    values: number[];
    diceIds: number[];
    scoreMultipliers: number[];
  } | null; // Current dice roll for recalculating remaining abilities
}
