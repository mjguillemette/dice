import { useState, useReducer, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import DevPanel from "./components/DevPanel";
import Crosshair from "./components/ui/Crosshair";
import ScoreDisplay from "./components/ui/ScoreDisplay";
import Wallet from "./components/ui/Wallet";
import StoreMenu, { type StoreItemDefinition } from "./components/models/Store";
import { useWallet } from "./hooks/useWallet";
import { gameStateReducer, initialGameState } from "./systems/gameStateSystem";
import {
  type PlayerInventory,
  INITIAL_INVENTORY,
  generateItemChoices,
  applyItemToInventory,
  type ItemDefinition,
  generateStoreChoices
} from "./systems/itemSystem";
import "./App.css";

// Define the items available in the store
const storeItems: StoreItemDefinition[] = [
  {
    id: "buy_thumbtack",
    name: "Thumbtack",
    description: "A sharp, pointy classic.",
    cost: 15,
    type: "thumbtacks"
  },
  {
    id: "buy_coin",
    name: "Coin",
    description: "Heads or tails?",
    cost: 50,
    type: "coins"
  },
  {
    id: "buy_d4",
    name: "D4",
    description: "The caltrop of dice.",
    cost: 150,
    type: "d4"
  },
  {
    id: "buy_d3",
    name: "D3",
    description: "A strange D6, scratched out and numbered 1-3 twice.",
    cost: 200,
    type: "d3"
  },
  {
    id: "buy_d6",
    name: "D6",
    description: "Ol' reliable.",
    cost: 500,
    type: "d6"
  }
];

function App() {
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

  const [spotlightHeight, setSpotlightHeight] = useState(0.5);
  const [spotlightIntensity, setSpotlightIntensity] = useState(0.8);
  const [spotlightAngle, setSpotlightAngle] = useState(Math.PI / 6);

  const [gameState, dispatch] = useReducer(gameStateReducer, initialGameState);
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
        dispatch({ type: "ITEM_SELECTED" });
        return newInventory;
      } else {
        console.log("Purchase failed: Insufficient funds.");
      }
    },
    [spendCurrency, setInventory, inventory]
  );

  const handleSuccessfulRoll = useCallback(() => {
    if (diceScore > 0) {
      setRollHistory((prev) => [...prev, diceScore]);
    }
    setDiceScore(0);
    setDiceSettled(false);
    dispatch({ type: "SUCCESSFUL_ROLL" });
  }, [diceScore]);

  const handleFailedRoll = useCallback(() => {
    setRollHistory((prev) => [...prev, diceScore]);
    setDiceScore(0);
    setDiceSettled(false);
    dispatch({ type: "FAILED_ROLL" });
  }, [diceScore]);

  const handleAttempt = useCallback(() => {
    dispatch({ type: "THROW_DICE" });
  }, []);

  const handleDiceSettled = useCallback(() => {
    setDiceSettled(true);
    dispatch({ type: "DICE_SETTLED" });
  }, []);

  const handleItemSelected = useCallback(
    (item: ItemDefinition) => {
      const newInventory = applyItemToInventory(inventory, item);
      setInventory(newInventory);
      setItemChoices([]);
      dispatch({ type: "ITEM_SELECTED" });
    },
    [inventory]
  );

  useEffect(() => {
    const storeChoices = generateStoreChoices(inventory, 5);
    setStoreChoices(storeChoices);
    if (gameState.phase === "item_selection" && itemChoices.length === 0) {
      const choices = generateItemChoices(inventory, 3);
      setItemChoices(choices);
    }
  }, [gameState.phase, inventory, itemChoices.length, storeChoices]);

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
      {!cinematicMode && <Crosshair />}
      <ScoreDisplay
        currentScore={diceScore}
        rollHistory={rollHistory}
        currentAttempt={gameState.currentAttempts}
        maxAttempts={2}
        isSettled={diceSettled}
      />
      <Wallet balances={balances} />

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
          storeChoices={storeChoices || []}
          onItemSelected={handleItemSelected}
          isStoreOpen={true}
          onDieSettledForCurrency={handleDieSettledForCurrency}
          onPurchaseItem={handlePurchase}
          onCloseStore={() => dispatch({ type: "EXIT_STORE" })}
          storeItems={storeItems}
          spendCurrency={spendCurrency}
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
        onTestStoreOpen={() => dispatch({ type: "ENTER_STORE" })}
      />
    </div>
  );
}

export default App;
