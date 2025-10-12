import { useState, useReducer, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import DevPanel from './components/DevPanel';
import { gameStateReducer, initialGameState } from './systems/gameStateSystem';
import './App.css';

function App() {
  const [cameraName, setCameraName] = useState('Bedroom Overview');
  const [cinematicMode, setCinematicMode] = useState(true);
  const [hellFactor, setHellFactor] = useState(0);
  const [autoCorruption, setAutoCorruption] = useState(true);
  const [diceCount, setDiceCount] = useState(2);
  const [coinCount, setCoinCount] = useState(2);
  const [d3Count, setD3Count] = useState(2);
  const [d4Count, setD4Count] = useState(2);
  const [thumbTackCount, setThumbTackCount] = useState(2);
  const [diceScore, setDiceScore] = useState(0);
  const [diceShaderEnabled, setDiceShaderEnabled] = useState(true);
  const [cardEnabled, setCardEnabled] = useState(false);
  const [diceOnCard, setDiceOnCard] = useState<number[]>([]);

  // Game state machine
  const [gameState, dispatch] = useReducer(gameStateReducer, initialGameState);

  console.log('🎮 App render - Game State:', {
    phase: gameState.phase,
    timeOfDay: gameState.timeOfDay,
    daysMarked: gameState.daysMarked,
    successfulRolls: gameState.successfulRolls,
    currentAttempts: gameState.currentAttempts,
  });

  // Handle successful roll completion (all dice settled in receptacle)
  const handleSuccessfulRoll = useCallback(() => {
    console.log('✅ App: Successful roll detected');
    dispatch({ type: 'SUCCESSFUL_ROLL' });
  }, []);

  // Handle failed roll (some dice outside receptacle)
  const handleFailedRoll = useCallback(() => {
    console.log('❌ App: Failed roll detected');
    dispatch({ type: 'FAILED_ROLL' });
  }, []);

  // Handle dice throw attempt
  const handleAttempt = useCallback(() => {
    console.log('🎲 App: Throw attempt');
    dispatch({ type: 'THROW_DICE' });
  }, []);

  // Handle dice settled
  const handleDiceSettled = useCallback(() => {
    console.log('⏸️ App: Dice settled');
    dispatch({ type: 'DICE_SETTLED' });
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.6, 5] }}
        gl={{ antialias: false }}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          imageRendering: 'pixelated',
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
          cardEnabled={cardEnabled}
          onCardItemsChange={setDiceOnCard}
          onSuccessfulRoll={handleSuccessfulRoll}
          onFailedRoll={handleFailedRoll}
          onAttempt={handleAttempt}
          onDiceSettled={handleDiceSettled}
          daysMarked={gameState.daysMarked}
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
        cardEnabled={cardEnabled}
        diceOnCard={diceOnCard}
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
        onCardToggle={() => setCardEnabled(!cardEnabled)}
        onTestSuccessfulRoll={handleSuccessfulRoll}
      />
    </div>
  );
}

export default App;
