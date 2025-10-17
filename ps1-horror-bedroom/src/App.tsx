import { useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import DevPanel from "./components/DevPanel";
import Crosshair from "./components/ui/Crosshair";
import GameHUD from "./components/ui/GameHUD";
import { type DiceData } from "./components/ui/DiceInfo";
import { useWallet } from "./hooks/useWallet";
import { GameStateProvider, useGameState } from "./contexts/GameStateContext";
import {
  type PlayerInventory,
  INITIAL_INVENTORY,
  generateItemChoices,
  applyItemToInventory,
  type ItemDefinition,
  generateStoreChoices
} from "./systems/itemSystem";
import "./App.css";

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

  const [cameraName, setCameraName] = useState("First Person");
  const [cinematicMode, setCinematicMode] = useState(false);
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
  const [rollHistory, setRollHistory] = useState<number[]>([]);
  const [diceSettled, setDiceSettled] = useState(false);
  const [hoveredDice, setHoveredDice] = useState<DiceData | null>(null);

  const [spotlightHeight, setSpotlightHeight] = useState(1.0);
  const [spotlightIntensity, setSpotlightIntensity] = useState(1.4);
  const [spotlightAngle, setSpotlightAngle] = useState(Math.PI / 6);

  const { balances, addCurrency, spendCurrency } = useWallet({ cents: 55 });

  const [inventory, setInventory] =
    useState<PlayerInventory>(INITIAL_INVENTORY);
  const [itemChoices, setItemChoices] = useState<ItemDefinition[]>([]);
  const [storeChoices, setStoreChoices] = useState<ItemDefinition[]>([]);

  const handleDieSettledForCurrency = useCallback(
    (type: string, amount: number) => {
      if (type === "coin") {
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
      if (item.price === undefined) {
        console.log("Purchase failed: Item price is undefined.");
        return;
      }

      if (spendCurrency("cents", item.price)) {
        console.log("Purchase successful!");

        const newInventory = applyItemToInventory(inventory, item);
        setInventory(newInventory);
        onItemSelected();
        return newInventory;
      } else {
        console.log("Purchase failed: Insufficient funds.");
      }
    },
    [spendCurrency, setInventory, inventory, onItemSelected]
  );

  const handleSuccessfulRoll = useCallback(() => {
    if (diceScore > 0) {
      setRollHistory((prev) => [...prev, diceScore]);
    }
    setDiceScore(0);
    setDiceSettled(false);
    onSuccessfulRoll();
  }, [diceScore, onSuccessfulRoll]);

  const handleFailedRoll = useCallback(() => {
    setRollHistory((prev) => [...prev, diceScore]);
    setDiceScore(0);
    setDiceSettled(false);
    onFailedRoll();
  }, [diceScore, onFailedRoll]);

  const handleDiceSettled = useCallback(
    (diceValues?: number[]) => {
      setDiceSettled(true);
      onDiceSettled(diceValues);
    },
    [onDiceSettled]
  );

  const handleItemSelected = useCallback(
    (item: ItemDefinition) => {
      const newInventory = applyItemToInventory(inventory, item);
      setInventory(newInventory);
      setItemChoices([]);
      onItemSelected();
    },
    [inventory, onItemSelected]
  );

  // Generate store choices once on mount
  useEffect(() => {
    const generatedStoreChoices = generateStoreChoices(5);
    setStoreChoices(generatedStoreChoices);
  }, []); // Empty dependency - only run once

  // Generate item choices when entering item_selection phase
  useEffect(() => {
    if (gameState.phase === "item_selection" && itemChoices.length === 0) {
      const choices = generateItemChoices(inventory, 3);
      setItemChoices(choices);
    }
  }, [gameState.phase, inventory, itemChoices.length]);

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
      {/* 2D UI Components are rendered here, outside of the Canvas */}
      {gameState.phase === "menu" && (
        <div className="menu-overlay">
          <h1>Enter to Play</h1>
        </div>
      )}
      {gameState.phase !== "menu" && !cinematicMode && <Crosshair />}
      {gameState.phase !== "menu" && (
        <GameHUD
          scores={gameState.scoring.currentScores}
          timeOfDay={gameState.scoring.currentTimeOfDay}
          currentAttempts={gameState.currentAttempts}
          maxAttempts={2}
          currentScore={diceScore}
          isSettled={diceSettled}
          balance={balances.cents}
          hoveredDice={hoveredDice}
        />
      )}

      {/* The Canvas is ONLY for 3D components */}
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
          onAttempt={onAttempt}
          onDiceSettled={handleDiceSettled}
          daysMarked={gameState.daysMarked}
          currentAttempts={gameState.currentAttempts}
          timeOfDay={gameState.timeOfDay}
          successfulRolls={gameState.successfulRolls}
          itemChoices={gameState.phase === "item_selection" ? itemChoices : []}
          storeChoices={storeChoices || []}
          onItemSelected={handleItemSelected}
          isStoreOpen={true}
          onDieSettledForCurrency={handleDieSettledForCurrency}
          onPurchase={handlePurchase}
          onCloseStore={onItemSelected}
          spendCurrency={spendCurrency}
          playerBalance={balances.cents}
          gameState={gameState}
          onStartGame={onStartGame}
          onDiceHover={setHoveredDice}
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

function App() {
  return (
    <GameStateProvider>
      <AppContent />
    </GameStateProvider>
  );
}

export default App;
