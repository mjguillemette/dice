import { useState, useReducer, useCallback, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import DevPanel from "./components/DevPanel";
import Crosshair from "./components/ui/Crosshair";
import ScoreDisplay from "./components/ui/ScoreDisplay";
import { gameStateReducer, initialGameState } from "./systems/gameStateSystem";
import {
  type PlayerInventory,
  INITIAL_INVENTORY,
  generateItemChoices,
  applyItemToInventory,
  type ItemDefinition
} from "./systems/itemSystem";
import "./App.css";

function App() {
  const [cameraName, setCameraName] = useState("First Person");
  const [cinematicMode, setCinematicMode] = useState(false); // Start in first-person mode
  const [hellFactor, setHellFactor] = useState(0);
  const [autoCorruption, setAutoCorruption] = useState(true);
  const [diceCount, setDiceCount] = useState(2);
  const [coinCount, setCoinCount] = useState(1);
  const [d3Count, setD3Count] = useState(0);
  const [d4Count, setD4Count] = useState(0);
  const [thumbTackCount, setThumbTackCount] = useState(2);
  const [diceScore, setDiceScore] = useState(0);
  const [diceShaderEnabled, setDiceShaderEnabled] = useState(true);
  const [towerCardEnabled, setTowerCardEnabled] = useState(false);
  const [sunCardEnabled, setSunCardEnabled] = useState(false);
  const [diceOnTowerCard, setDiceOnTowerCard] = useState<number[]>([]);
  const [diceOnSunCard, setDiceOnSunCard] = useState<number[]>([]);
  const [showCardDebugBounds, setShowCardDebugBounds] = useState(false);
  const [rollHistory, setRollHistory] = useState<number[]>([]); // Track last completed roll scores
  const [diceSettled, setDiceSettled] = useState(false); // Track if dice are currently settled

  // Spotlight settings
  const [spotlightHeight, setSpotlightHeight] = useState(0.5);
  const [spotlightIntensity, setSpotlightIntensity] = useState(0.8);
  const [spotlightAngle, setSpotlightAngle] = useState(Math.PI / 6);

  // Game state machine
  const [gameState, dispatch] = useReducer(gameStateReducer, initialGameState);

  // Item system - player inventory
  const [inventory, setInventory] =
    useState<PlayerInventory>(INITIAL_INVENTORY);
  const [itemChoices, setItemChoices] = useState<ItemDefinition[]>([]);

  console.log("🎮 App render - Game State:", {
    phase: gameState.phase,
    timeOfDay: gameState.timeOfDay,
    daysMarked: gameState.daysMarked,
    successfulRolls: gameState.successfulRolls,
    currentAttempts: gameState.currentAttempts
  });

  // Handle successful roll completion (all dice settled in receptacle)
  const handleSuccessfulRoll = useCallback(() => {
    console.log("✅ App: Successful roll detected");

    // Add current score to history
    if (diceScore > 0) {
      setRollHistory((prev) => [...prev, diceScore]);
    }

    // Reset current score for next round
    setDiceScore(0);
    setDiceSettled(false);

    dispatch({ type: "SUCCESSFUL_ROLL" });
  }, [diceScore]);

  // Handle failed roll (some dice outside receptacle)
  const handleFailedRoll = useCallback(() => {
    console.log("❌ App: Failed roll detected");

    // Add current score to history even on failure (0 if no dice in receptacle)
    setRollHistory((prev) => [...prev, diceScore]);

    // Reset current score for next attempt/round
    setDiceScore(0);
    setDiceSettled(false);

    dispatch({ type: "FAILED_ROLL" });
  }, [diceScore]);

  // Handle dice throw attempt
  const handleAttempt = useCallback(() => {
    console.log("🎲 App: Throw attempt");
    dispatch({ type: "THROW_DICE" });
  }, []);

  // Handle dice settled
  const handleDiceSettled = useCallback(() => {
    console.log("⏸️ App: Dice settled");
    setDiceSettled(true);
    dispatch({ type: "DICE_SETTLED" });
  }, []);

  // Handle item selection
  const handleItemSelected = useCallback(
    (item: ItemDefinition) => {
      console.log("🎁 Item selected:", item.name);

      // Apply item to inventory
      const newInventory = applyItemToInventory(inventory, item);
      setInventory(newInventory);

      // Clear choices and return to gameplay
      setItemChoices([]);
      dispatch({ type: "ITEM_SELECTED" });
    },
    [inventory]
  );

  // Generate item choices when entering item selection phase
  useEffect(() => {
    if (gameState.phase === "item_selection" && itemChoices.length === 0) {
      console.log("🎁 Generating item choices for day", gameState.daysMarked);
      const choices = generateItemChoices(inventory, 3);
      setItemChoices(choices);
    }
  }, [gameState.phase, gameState.daysMarked, inventory, itemChoices.length]);

  // Sync inventory with dice counts (for now - this maintains dev panel functionality)
  useEffect(() => {
    setDiceCount(inventory.dice.d6);
    setCoinCount(inventory.dice.coins);
    setThumbTackCount(inventory.dice.thumbtacks);
    setD3Count(inventory.dice.d3);
    setD4Count(inventory.dice.d4);
    setTowerCardEnabled(inventory.cards.tower);
    setSunCardEnabled(inventory.cards.sun);
  }, [inventory]);

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
      {/* Crosshair - only show in first-person mode */}
      {!cinematicMode && <Crosshair />}

      {/* Score Display - always visible */}
      <ScoreDisplay
        currentScore={diceScore}
        rollHistory={rollHistory}
        currentAttempt={gameState.currentAttempts}
        maxAttempts={2}
        isSettled={diceSettled}
      />

      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.6, 5] }}
        gl={{ antialias: false }}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          imageRendering: "pixelated"
        }}
        dpr={0.5}
      >
        <Scene
          onCameraNameChange={setCameraName}
          onCameraModeChange={setCinematicMode}
          onHellFactorChange={setHellFactor}
          onAutoCorruptionChange={setAutoCorruption}
          diceCount={diceCount}
          coinCount={coinCount}
          d3Count={d3Count}
          d4Count={d4Count}
          thumbTackCount={thumbTackCount}
          onDiceScoreChange={setDiceScore}
          diceShaderEnabled={diceShaderEnabled}
          towerCardEnabled={towerCardEnabled}
          sunCardEnabled={sunCardEnabled}
          onTowerCardItemsChange={setDiceOnTowerCard}
          onSunCardItemsChange={setDiceOnSunCard}
          showCardDebugBounds={showCardDebugBounds}
          spotlightHeight={spotlightHeight}
          spotlightIntensity={spotlightIntensity}
          spotlightAngle={spotlightAngle}
          onSuccessfulRoll={handleSuccessfulRoll}
          onFailedRoll={handleFailedRoll}
          onAttempt={handleAttempt}
          onDiceSettled={handleDiceSettled}
          daysMarked={gameState.daysMarked}
          currentAttempts={gameState.currentAttempts}
          timeOfDay={gameState.timeOfDay}
          successfulRolls={gameState.successfulRolls}
          itemChoices={gameState.phase === "item_selection" ? itemChoices : []}
          onItemSelected={handleItemSelected}
        />
      </Canvas>
      <DevPanel
        cameraName={cameraName}
        cinematicMode={cinematicMode}
        hellFactor={hellFactor}
        autoCorruption={autoCorruption}
        diceCount={diceCount}
        coinCount={coinCount}
        d3Count={d3Count}
        d4Count={d4Count}
        thumbTackCount={thumbTackCount}
        diceScore={diceScore}
        diceShaderEnabled={diceShaderEnabled}
        towerCardEnabled={towerCardEnabled}
        sunCardEnabled={sunCardEnabled}
        diceOnTowerCard={diceOnTowerCard}
        diceOnSunCard={diceOnSunCard}
        showCardDebugBounds={showCardDebugBounds}
        spotlightHeight={spotlightHeight}
        spotlightIntensity={spotlightIntensity}
        spotlightAngle={spotlightAngle}
        timeOfDay={gameState.timeOfDay}
        daysMarked={gameState.daysMarked}
        successfulRolls={gameState.successfulRolls}
        currentAttempts={gameState.currentAttempts}
        gamePhase={gameState.phase}
        onDiceCountChange={setDiceCount}
        onCoinCountChange={setCoinCount}
        onD3CountChange={setD3Count}
        onD4CountChange={setD4Count}
        onThumbTackCountChange={setThumbTackCount}
        onDiceShaderToggle={() => setDiceShaderEnabled(!diceShaderEnabled)}
        onTowerCardToggle={() => setTowerCardEnabled(!towerCardEnabled)}
        onSunCardToggle={() => setSunCardEnabled(!sunCardEnabled)}
        onCardDebugToggle={() => setShowCardDebugBounds(!showCardDebugBounds)}
        onSpotlightHeightChange={setSpotlightHeight}
        onSpotlightIntensityChange={setSpotlightIntensity}
        onSpotlightAngleChange={setSpotlightAngle}
        onTestSuccessfulRoll={handleSuccessfulRoll}
      />
    </div>
  );
}

export default App;
