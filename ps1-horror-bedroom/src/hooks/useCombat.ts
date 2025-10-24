import { useFrame } from "@react-three/fiber";
import { combatSystem } from "../systems/combatSystem";
import { useGameState } from "../contexts/GameStateContext";

export const useCombat = () => {
  const { gameState, combatStart, combatEnd } = useGameState();

  // Get combat state from game state
  const { enemies, phase: combatPhase } = gameState.combat;

  const isCombatActive = combatPhase !== null;

  const startCombat = () => {
    const spawnedEnemies = combatSystem.startCombat();
    console.log("🐉 Starting combat with enemies:", spawnedEnemies);
    combatStart(spawnedEnemies);
  };

  const endCombat = () => {
    if (enemies.length > 0) {
      combatEnd();
    }
  };

  // REMOVED: Auto-trigger enemy roll after spawn
  // Enemies should only roll AFTER player throws dice, not immediately after spawning
  // useEffect(() => {
  //   if (combatPhase === "combat_enemy_spawn") {
  //     const allSpawned = enemies.every(
  //       (e) => e.portalProgress >= 1 && e.entranceAnimationProgress >= 1
  //     );
  //     if (allSpawned && enemies.length > 0) {
  //       console.log("✅ All enemies spawned - triggering enemy roll");
  //       const timer = setTimeout(() => {
  //         combatEnemyRoll();
  //       }, 500);
  //       return () => clearTimeout(timer);
  //     }
  //   }
  // }, [combatPhase, enemies, combatEnemyRoll]);

  useFrame(() => {
    // Animation logic updates portal and entrance progress
    if (!isCombatActive || enemies.length === 0 || combatPhase !== "combat_enemy_spawn") {
      return;
    }

    // Check if any enemies need animation updates
    const needsUpdate = enemies.some(
      (e) => e.portalProgress < 1 || e.entranceAnimationProgress < 1
    );

    if (!needsUpdate) return;

    // Update enemy animations (this will trigger a state update)
    // We need to dispatch an action to update enemy progress
    // For now, let's directly update via a new action
    // TODO: Add COMBAT_UPDATE_ENEMY_PROGRESS action
  });

  return { enemies, startCombat, endCombat, isCombatActive, combatPhase };
};
