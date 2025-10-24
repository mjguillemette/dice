import { useState, useCallback, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import DevPanel from "./components/DevPanel";
import Crosshair from "./components/ui/Crosshair";
import { type DiceData } from "./components/ui/DiceInfo";
import TableItemInfo, {
  type TableItemData
} from "./components/ui/TableItemInfo";
import EnemyInfo, { type EnemyInfoData } from "./components/ui/EnemyInfo";
import MobileControls from "./components/ui/MobileControls";
import { isMobileDevice } from "./utils/mobileDetection";
import { useUISound } from "./systems/audioSystem";
import { useWallet } from "./hooks/useWallet";
import { usePersistence } from "./hooks/usePersistence";
import { useDiceConfiguration } from "./hooks/useDiceConfiguration";
import { GameStateProvider, useGameState } from "./contexts/GameStateContext";
import {
  type PlayerInventory,
  INITIAL_INVENTORY,
  generateItemChoices,
  applyItemToInventory,
  type ItemDefinition,
  generateStoreChoices,
  activateConsumable,
  getItemPrice,
  isConsumableActive
} from "./systems/itemSystem";
import "./App.css";
import { CombinedMenu3D } from "./components/ui/3d/CombinedMenu3D";

function AppContent() {
  const {
    gameState,
    diceSettled: onDiceSettled,
    successfulRoll: onSuccessfulRoll,
    failedRoll: onFailedRoll,
    throwDice: onAttempt,
    itemSelected: onItemSelected,
    startGame: onStartGame
  } = useGameState();

  // Dice configuration - consolidated into single hook
  const [diceConfig, diceActions] = useDiceConfiguration();

  const [cameraName, setCameraName] = useState("First Person");
  const [cinematicMode, setCinematicMode] = useState(false);
  // Visual corruption state (hellFactor) - now driven by gameState.corruption in Scene
  const [hellFactor, setHellFactor] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_autoCorruption, _setAutoCorruption] = useState(false); // Unused - kept for future feature
  const [diceScore, setDiceScore] = useState(0);
  const [diceShaderEnabled, _setDiceShaderEnabled] = useState(false);
  const [towerCardEnabled, setTowerCardEnabled] = useState(false);
  const [sunCardEnabled, setSunCardEnabled] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_diceOnTowerCard, setDiceOnTowerCard] = useState<number[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_diceOnSunCard, setDiceOnSunCard] = useState<number[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showCardDebugBounds, _setShowCardDebugBounds] = useState(false);
  const [rollHistory, setRollHistory] = useState<number[]>([]);
  const [_diceSettled, setDiceSettled] = useState(false);
  const [_hoveredDice, setHoveredDice] = useState<DiceData | null>(null);
  const [hoveredTableItem, setHoveredTableItem] =
    useState<TableItemData | null>(null);
  const [hoveredEnemy, setHoveredEnemy] = useState<EnemyInfoData | null>(null);

  // Combat log state
  const [combatLogMessages, setCombatLogMessages] = useState<Array<{
    id: string;
    text: string;
    color?: string;
    timestamp: number;
  }>>([]);

  const addCombatLog = useCallback((text: string, color?: string) => {
    const newMessage = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      color,
      timestamp: Date.now()
    };
    setCombatLogMessages(prev => [...prev, newMessage]);
    console.log(`📜 Combat Log: ${text}`);
  }, []);

  // Expose addCombatLog for testing
  useEffect(() => {
    (window as any).addCombatLog = addCombatLog;
  }, [addCombatLog]);
  const [highlightedDiceIds, setHighlightedDiceIds] = useState<number[]>([]);

  // Track previous roll's achieved categories for combo detection
  const previousAchievedCategories = useRef<Set<string>>(new Set());

  // Track previous roll's full score data for trigger effects
  const previousScores = useRef<any[]>([]);

  // Audio hooks
  const { playItemHover, playItemSelect, playEndOfDay } = useUISound();

  // Mobile: Gyroscope controls
  const [hasGyroPermission, setHasGyroPermission] = useState(false);
  const recenterGyroRef = useRef<(() => void) | null>(null);
  const [isCursorLocked, setIsCursorLocked] = useState(false);
  const [devPanelVisible, setDevPanelVisible] = useState(false);
  const isMobile = useState(() => isMobileDevice())[0];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_spotlightHeight, _setSpotlightHeight] = useState(1.0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_spotlightIntensity, _setSpotlightIntensity] = useState(1.4);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_spotlightAngle, _setSpotlightAngle] = useState(Math.PI / 6);

  const { balances, addCurrency, spendCurrency, resetWallet } = useWallet({
    cents: 55
  });
  const {
    data: persistentData,
    recordGameOver,
    recordGameStart
  } = usePersistence();

  const [inventory, setInventory] =
    useState<PlayerInventory>(INITIAL_INVENTORY);

  // Wrap onAttempt to pass corruption per roll from inventory
  const handleAttempt = useCallback(() => {
    onAttempt(inventory.stats.corruptionPerRoll);
  }, [onAttempt, inventory.stats.corruptionPerRoll]);
  const [itemChoices, setItemChoices] = useState<ItemDefinition[]>([]);
  const [storeChoices, setStoreChoices] = useState<ItemDefinition[]>([]);

  const handleDieSettledForCurrency = useCallback(
    (type: string, amount: number) => {
      if (type === "coin" || type === "nickel") {
        addCurrency("cents", amount);
      }
    },
    [addCurrency]
  );

  // Touch rollHistory so as to not trigger TS warning
  useEffect(() => {
    console.log("Roll history updated:", rollHistory);
  }, [rollHistory]);

  const handlePurchase = useCallback(
    (item: ItemDefinition) => {
      const price = getItemPrice(item);
      if (price === 0) {
        console.log("Purchase failed: Item has no price.");
        return;
      }

      if (spendCurrency("cents", price)) {
        console.log("Purchase successful! Paid", price, "cents for", item.name);

        const newInventory = applyItemToInventory(inventory, item);
        setInventory(newInventory);
        onItemSelected();
        return newInventory;
      } else {
        console.log(
          "Purchase failed: Insufficient funds. Need",
          price,
          "cents, have",
          balances.cents
        );
      }
    },
    [spendCurrency, setInventory, inventory, onItemSelected, balances.cents]
  );

  const handleSuccessfulRoll = useCallback(() => {
    if (diceScore > 0) {
      setRollHistory((prev) => [...prev, diceScore]);
    }
    setDiceScore(0);
    setDiceSettled(false);

    // Calculate cigarette bonus if cigarette passive is active
    const cigaretteBonus = inventory.passiveEffects.cigarette
      ? gameState.corruption * 100
      : undefined;

    onSuccessfulRoll(cigaretteBonus);
  }, [
    diceScore,
    onSuccessfulRoll,
    inventory.passiveEffects.cigarette,
    gameState.corruption
  ]);

  const handleFailedRoll = useCallback(() => {
    setRollHistory((prev) => [...prev, diceScore]);
    setDiceScore(0);
    setDiceSettled(false);
    onFailedRoll();
  }, [diceScore, onFailedRoll]);

  const handleDiceSettled = useCallback(
    (
      diceValues?: number[],
      diceIds?: number[],
      scoreMultipliers?: number[]
    ) => {
      setDiceSettled(true);
      // Pass combo multiplier status if incense is active
      const incenseActive = isConsumableActive(inventory, "incense");
      const previousScores = incenseActive
        ? gameState.scoring.currentScores
        : undefined;
      onDiceSettled(
        diceValues,
        diceIds,
        scoreMultipliers,
        incenseActive,
        previousScores
      );
    },
    [onDiceSettled, inventory, gameState.scoring.currentScores]
  );

  const handleTableItemHover = useCallback(
    (itemId: "cigarette" | "incense" | null) => {
      if (!itemId) {
        setHoveredTableItem(null);
        return;
      }

      // Play subtle hover sound
      playItemHover();

      const itemData: TableItemData = {
        itemId,
        name: itemId === "cigarette" ? "Cigarette" : "Incense Stick",
        description:
          itemId === "cigarette"
            ? "Passive: +1% corruption per roll. Adds +1 to Highest Total per 1% corruption at end of day."
            : "Consumable (3 uses): Score categories triggered back-to-back gain +15% per consecutive combo.",
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      };

      // Calculate impacts
      if (itemId === "cigarette") {
        const corruptionPercent = Math.floor(gameState.corruption * 100);
        itemData.thisRoundImpact = `+${corruptionPercent} to Highest Total at end of day`;
        itemData.totalImpact = `${corruptionPercent}% total corruption accumulated`;
      } else if (itemId === "incense") {
        const incenseData = inventory.consumables.find(
          (c) => c.itemId === "incense"
        );
        const remainingUses = incenseData?.remainingUses || 0;
        const isActive = incenseData?.isActive || false;
        itemData.thisRoundImpact = isActive
          ? "Active - Combo bonuses enabled"
          : "Inactive";
        itemData.totalImpact = `${remainingUses} use${
          remainingUses !== 1 ? "s" : ""
        } remaining`;
      }

      setHoveredTableItem(itemData);
    },
    [gameState.corruption, inventory.consumables, playItemHover]
  );

  const handleItemSelected = useCallback(
    (item: ItemDefinition) => {
      playItemSelect(); // Play selection sound
      const newInventory = applyItemToInventory(inventory, item);
      setInventory(newInventory);
      setItemChoices([]);
      onItemSelected();
    },
    [inventory, onItemSelected, playItemSelect]
  );

  // Generate store choices once on mount
  useEffect(() => {
    const generatedStoreChoices = generateStoreChoices(
      inventory,
      gameState.daysMarked,
      5
    );
    setStoreChoices(generatedStoreChoices);
  }, []); // Empty dependency - only run once

  // Play end of day sound when entering item_selection phase
  useEffect(() => {
    if (gameState.phase === "item_selection" && gameState.daysMarked > 2) {
      // Don't play on the very first item selection (day 2)
      playEndOfDay();
    }
  }, [gameState.phase, gameState.daysMarked, playEndOfDay]);

  // Generate item choices when entering item_selection phase
  useEffect(() => {
    if (gameState.phase === "item_selection" && itemChoices.length === 0) {
      const choices = generateItemChoices(inventory, gameState.daysMarked, 3);
      setItemChoices(choices);
      console.log("🎁 Showing item selection:", choices);
    }
  }, [gameState.phase, inventory, itemChoices.length, gameState.daysMarked]);

  useEffect(() => {
    // Update dice configuration from inventory
    diceActions.setD6Count(inventory.dice.d6);
    diceActions.setCoinCount(inventory.dice.coins);
    diceActions.setNickelCount(inventory.dice.nickels);
    diceActions.setThumbTackCount(inventory.dice.thumbtacks);
    diceActions.setD3Count(inventory.dice.d3);
    diceActions.setD4Count(inventory.dice.d4);
    diceActions.setD8Count(inventory.dice.d8);
    diceActions.setD10Count(inventory.dice.d10);
    diceActions.setD12Count(inventory.dice.d12);
    diceActions.setD20Count(inventory.dice.d20);
    // Special dice
    diceActions.setGoldenPyramidCount(inventory.dice.golden_pyramid);
    diceActions.setCaltropCount(inventory.dice.caltrop);
    diceActions.setCasinoRejectCount(inventory.dice.casino_reject);
    diceActions.setWeightedDieCount(inventory.dice.weighted_die);
    diceActions.setLoadedCoinCount(inventory.dice.loaded_coin);
    diceActions.setCursedDieCount(inventory.dice.cursed_die);
    diceActions.setSplitDieCount(inventory.dice.split_die);
    diceActions.setMirrorDieCount(inventory.dice.mirror_die);
    diceActions.setRiggedDieCount(inventory.dice.rigged_die);
    // Cards
    setTowerCardEnabled(inventory.cards.tower);
    setSunCardEnabled(inventory.cards.sun);
  }, [inventory, diceActions]);

  // Auto-activate incense when first combo occurs
  useEffect(() => {
    // Check if player has incense
    const incenseData = inventory.consumables.find(
      (c) => c.itemId === "incense"
    );
    if (!incenseData) return;

    // Don't activate if already active or no uses remaining
    if (incenseData.isActive || incenseData.remainingUses === 0) return;

    // Get currently achieved categories (excluding highest_total which is always achieved)
    const currentAchieved = new Set(
      gameState.scoring.currentScores
        .filter((score) => score.achieved && score.category !== "highest_total")
        .map((score) => score.category)
    );

    // Check if any current category was also achieved in the previous roll
    const hasCombo = Array.from(currentAchieved).some((category) =>
      previousAchievedCategories.current.has(category)
    );

    if (hasCombo) {
      console.log("🔥 Combo detected! Auto-activating incense...");
      console.log(
        "  Previous categories:",
        Array.from(previousAchievedCategories.current)
      );
      console.log("  Current categories:", Array.from(currentAchieved));
      const newInventory = activateConsumable(inventory, "incense");
      setInventory(newInventory);
    }

    // Update previous achieved categories for next roll
    previousAchievedCategories.current = currentAchieved;

    // Also update the full score data for trigger effects
    previousScores.current = gameState.scoring.currentScores;
  }, [gameState.scoring.currentScores, inventory]);

  // Record game over to persistent storage
  useEffect(() => {
    if (gameState.isGameOver) {
      const daysSurvived = gameState.daysMarked - 1; // Subtract 1 because we mark the start of each day
      const totalScore = gameState.scoring.currentScores.reduce(
        (sum, score) => sum + score.score,
        0
      );
      recordGameOver(daysSurvived, totalScore);
      console.log(
        `💀 Game Over! Days survived: ${daysSurvived}, Total score: ${totalScore}`
      );
      console.log(
        `📊 Best days survived: ${persistentData.bestDaysSurvived}, Best score: ${persistentData.bestTotalScore}`
      );
    }
  }, [
    gameState.isGameOver,
    gameState.daysMarked,
    gameState.scoring.currentScores,
    recordGameOver,
    persistentData.bestDaysSurvived,
    persistentData.bestTotalScore
  ]);

  // Record game start when phase changes from menu to idle
  const previousPhaseRef = useRef(gameState.phase);
  useEffect(() => {
    if (previousPhaseRef.current === "menu" && gameState.phase === "idle") {
      recordGameStart();
      console.log("🎮 Game started!");
    }
    previousPhaseRef.current = gameState.phase;
  }, [gameState.phase, recordGameStart]);

  // Reset inventory, wallet, and other state when game restarts after game over
  const wasGameOverRef = useRef(false);
  useEffect(() => {
    // Track if we were in game over state
    if (gameState.isGameOver) {
      wasGameOverRef.current = true;
    }

    // Detect when game resets: WAS game over, NOW back to idle at day 2
    if (
      wasGameOverRef.current &&
      !gameState.isGameOver &&
      gameState.phase === "idle" &&
      gameState.daysMarked === 2
    ) {
      // Full reset detected
      console.log(
        "🔄 Full game reset detected - clearing inventory and wallet"
      );
      setInventory(INITIAL_INVENTORY);
      resetWallet();
      setItemChoices([]);
      setDiceScore(0);
      setDiceSettled(false);
      setRollHistory([]);
      wasGameOverRef.current = false; // Clear the flag

      // Regenerate store after reset
      const generatedStoreChoices = generateStoreChoices(
        INITIAL_INVENTORY,
        1,
        5
      );
      setStoreChoices(generatedStoreChoices);
      console.log("🏪 Regenerated store choices:", generatedStoreChoices);
    }
  }, [
    gameState.isGameOver,
    gameState.phase,
    gameState.daysMarked,
    resetWallet
  ]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden"
      }}
    >
      {/* 2D UI Components are rendered here, outside of the Canvas */}
      {gameState.phase === "menu" && !gameState.isGameOver && (
        <div
          className="menu-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            color: "white",
            textAlign: "center",
            fontFamily: "monospace",
            zIndex: 10,
            cursor: "pointer",
            transition: "opacity 0.5s ease",
            opacity: 1
          }}
          onClick={onStartGame}
          onTouchStart={onStartGame}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Tap to Start
          </h1>
          <p style={{ opacity: 0.6 }}>Press Enter on desktop</p>
          <p style={{ opacity: 0.5, marginTop: "2rem", fontSize: "0.9rem" }}>
            Press ESC for options
          </p>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState.isGameOver && (
        <div
          className="game-over-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(20, 19, 26, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            color: "var(--bw-taffy)",
            textAlign: "center",
            fontFamily: "monospace",
            zIndex: 1000,
            cursor: "pointer",
            animation: "fadeIn 1s ease-in"
          }}
          onClick={onStartGame}
          onTouchStart={onStartGame}
        >
          <h2
            style={{
              fontSize: "2rem",
              marginBottom: "1rem",
              color: "var(--bw-dress)"
            }}
          >
            GAME OVER
          </h2>
          <p
            style={{
              fontSize: "1.2rem",
              opacity: 0.8,
              marginBottom: "0.5rem",
              color: "var(--bw-plain)"
            }}
          >
            You survived {gameState.daysMarked - 1} days
          </p>
          {persistentData.bestDaysSurvived > 0 && (
            <p
              style={{
                fontSize: "1rem",
                opacity: 0.7,
                marginTop: "0.5rem",
                color: "var(--bw-lightgravel)"
              }}
            >
              Best: {persistentData.bestDaysSurvived} days
            </p>
          )}
          <p
            style={{
              fontSize: "1rem",
              opacity: 0.6,
              marginTop: "2rem",
              color: "var(--bw-lightgravel)"
            }}
          >
            Press Enter to try again
          </p>
        </div>
      )}

      {/* Cursor Unlock Overlay - shown when cursor is not locked during gameplay (desktop only) */}
      {!isMobile &&
        !isCursorLocked &&
        gameState.phase !== "menu" &&
        !gameState.isGameOver && (
          <div
            className="cursor-unlock-overlay"
            onClick={() => document.body.requestPointerLock()}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              color: "white",
              textAlign: "center",
              fontFamily: "monospace",
              zIndex: 100,
              cursor: "pointer"
            }}
          >
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Paused</h2>
            <p style={{ opacity: 0.8 }}>Press Enter or click to continue</p>
          </div>
        )}

      {gameState.phase !== "menu" && !cinematicMode && <Crosshair />}

      {/* Table Item Tooltip - shown when hovering cigarette or incense */}
      <TableItemInfo itemData={hoveredTableItem} />

      {/* Enemy Tooltip - shown when hovering enemies */}
      <EnemyInfo enemyData={hoveredEnemy} />

      {/* The Canvas is ONLY for 3D components */}
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.6, 5] }}
        gl={{ antialias: false }}
        style={{
          width: "100%",
          height: "100%",
          display: "block"
        }}
        dpr={1}
      >
        <Scene
          onCameraNameChange={setCameraName}
          onHellFactorChange={setHellFactor}
          onAutoCorruptionChange={_setAutoCorruption}
          onCursorLockChange={setIsCursorLocked}
          diceCount={diceConfig.d6Count}
          coinCount={diceConfig.coinCount}
          nickelCount={diceConfig.nickelCount}
          d3Count={diceConfig.d3Count}
          d4Count={diceConfig.d4Count}
          d8Count={diceConfig.d8Count}
          d10Count={diceConfig.d10Count}
          d12Count={diceConfig.d12Count}
          d20Count={diceConfig.d20Count}
          thumbTackCount={diceConfig.thumbTackCount}
          goldenPyramidCount={diceConfig.goldenPyramidCount}
          caltropCount={diceConfig.caltropCount}
          casinoRejectCount={diceConfig.casinoRejectCount}
          weightedDieCount={diceConfig.weightedDieCount}
          loadedCoinCount={diceConfig.loadedCoinCount}
          cursedDieCount={diceConfig.cursedDieCount}
          splitDieCount={diceConfig.splitDieCount}
          mirrorDieCount={diceConfig.mirrorDieCount}
          riggedDieCount={diceConfig.riggedDieCount}
          onDiceScoreChange={setDiceScore}
          diceShaderEnabled={diceShaderEnabled}
          towerCardEnabled={towerCardEnabled}
          sunCardEnabled={sunCardEnabled}
          onTowerCardItemsChange={setDiceOnTowerCard}
          onSunCardItemsChange={setDiceOnSunCard}
          showCardDebugBounds={_showCardDebugBounds}
          spotlightHeight={_spotlightHeight}
          spotlightIntensity={_spotlightIntensity}
          spotlightAngle={_spotlightAngle}
          onSuccessfulRoll={handleSuccessfulRoll}
          onFailedRoll={handleFailedRoll}
          onAttempt={handleAttempt}
          onDiceSettled={handleDiceSettled}
          daysMarked={gameState.daysMarked}
          currentAttempts={gameState.currentAttempts}
          timeOfDay={gameState.timeOfDay}
          successfulRolls={gameState.successfulRolls}
          itemChoices={itemChoices.length > 0 ? itemChoices : []}
          storeChoices={storeChoices || []}
          onItemSelected={handleItemSelected}
          isStoreOpen={true}
          onDieSettledForCurrency={handleDieSettledForCurrency}
          onPurchase={handlePurchase}
          onCloseStore={onItemSelected}
          spendCurrency={spendCurrency}
          playerBalance={balances.cents}
          gameState={gameState}
          inventory={inventory}
          onStartGame={onStartGame}
          onDiceHover={setHoveredDice}
          onTableItemHover={handleTableItemHover}
          highlightedDiceIds={highlightedDiceIds}
          onGyroPermissionChange={setHasGyroPermission}
          onRecenterGyroReady={(fn) => {
            recenterGyroRef.current = fn;
          }}
          currentScores={gameState.scoring.currentScores}
          previousScores={previousScores.current}
          onEnemyHover={setHoveredEnemy}
          onAbilityHover={setHighlightedDiceIds}
          combatLogMessages={combatLogMessages}
          addCombatLog={addCombatLog}
        />

        <CombinedMenu3D
          position={[-0.5, 1.1, 2.5]}
          rotation={[Math.PI / 12, 0, 0]}
          cameraName={cameraName}
          cinematicMode={cinematicMode}
          hellFactor={hellFactor}
          diceScore={diceScore}
          timeOfDay={gameState.timeOfDay}
          daysMarked={gameState.daysMarked}
          successfulRolls={gameState.successfulRolls}
          currentAttempts={gameState.currentAttempts}
          gamePhase={gameState.phase}
          onCinematicModeToggle={() => setCinematicMode(!cinematicMode)}
          onVisibilityChange={setDevPanelVisible}
          externalVisible={devPanelVisible}
          onRecenterGyro={() => recenterGyroRef.current?.()}
          isMobile={false}
          onClose={() => {}}
        />
      </Canvas>

      <MobileControls
        onRecenterGyro={() => recenterGyroRef.current?.()}
        hasGyroPermission={hasGyroPermission}
        onToggleDevPanel={() => setDevPanelVisible(!devPanelVisible)}
      />

      <DevPanel
        cameraName={cameraName}
        cinematicMode={cinematicMode}
        hellFactor={hellFactor}
        diceScore={diceScore}
        timeOfDay={gameState.timeOfDay}
        daysMarked={gameState.daysMarked}
        successfulRolls={gameState.successfulRolls}
        currentAttempts={gameState.currentAttempts}
        gamePhase={gameState.phase}
        onCinematicModeToggle={() => setCinematicMode(!cinematicMode)}
        onVisibilityChange={setDevPanelVisible}
        externalVisible={devPanelVisible}
        onRecenterGyro={() => recenterGyroRef.current?.()}
      />
    </div>
  );
}

function App() {
  return (
    <GameStateProvider>
      <AppContent />
    </GameStateProvider>
  );
}

export default App;
