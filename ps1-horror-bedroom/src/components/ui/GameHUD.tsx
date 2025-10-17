import { useEffect, useState, useRef, useCallback } from "react";
import type { ScoreCategoryData } from "../../systems/scoringSystem";
import { getCategoryDisplayName } from "../../systems/scoringSystem";
import type { DiceData } from "./DiceInfo";
import "./GameHUD.css";

interface GameHUDProps {
  // ... (props are the same)
  scores: ScoreCategoryData[];
  timeOfDay: string;
  currentAttempts: number;
  maxAttempts: number;
  currentScore: number;
  isSettled: boolean;
  balance: number;
  hoveredDice: DiceData | null;
}

interface GainPopup {
  id: number;
  amount: number;
}

export function GameHUD({
  scores,
  timeOfDay,
  currentAttempts,
  maxAttempts,
  currentScore,
  isSettled,
  balance,
  hoveredDice
}: GameHUDProps) {
  const isLastAttempt = currentAttempts >= maxAttempts;

  // --- 💰 Animated Balance State ---
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [gainAmount, setGainAmount] = useState<number | null>(null);
  const [isGaining, setIsGaining] = useState(false); // For CSS highlight

  const prevBalance = useRef(balance);
  const gainTimeout = useRef<number | null>(null);
  const highlightTimeout = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startTicker = useCallback(
    (amountToAdd: number) => {
      let remaining = amountToAdd;
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = window.setInterval(() => {
        if (remaining <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Final sync to prevent rounding errors
          setDisplayBalance(balance);
          return;
        }
        const chunk = Math.max(1, Math.floor(remaining * 0.15));
        setDisplayBalance((prev) => prev + chunk);
        remaining -= chunk;
      }, 50);
    },
    [balance]
  );

  // Effect to handle incoming balance changes
  useEffect(() => {
    const oldVal = prevBalance.current;
    const newVal = balance;

    if (newVal > oldVal) {
      const diff = newVal - oldVal;

      // Update the gain indicator and start the ticker
      setGainAmount(diff);
      startTicker(diff);

      // Add a temporary highlight class to the balance
      setIsGaining(true);

      // Clear any existing timeouts to reset the animation
      if (gainTimeout.current) clearTimeout(gainTimeout.current);
      if (highlightTimeout.current) clearTimeout(highlightTimeout.current);

      // Set timers to remove the gain indicator and highlight
      gainTimeout.current = window.setTimeout(() => setGainAmount(null), 1500);
      highlightTimeout.current = window.setTimeout(
        () => setIsGaining(false),
        600
      );
    } else if (newVal !== oldVal) {
      // If balance decreases, snap to the new value instantly
      setDisplayBalance(newVal);
    }

    prevBalance.current = newVal;
  }, [balance, startTicker]);

  // Final cleanup for when the component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (gainTimeout.current) clearTimeout(gainTimeout.current);
      if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
    };
  }, []);

  const getDiceTypeDisplay = (type: string): string => {
    // ... (rest of the component is the same)
    const typeMap: Record<string, string> = {
      d6: "D6",
      d4: "D4",
      d3: "D3",
      coin: "Coin",
      thumbtack: "Thumbtack"
    };
    return typeMap[type] || type.toUpperCase();
  };

  return (
    <div className="game-hud">
      {/* ... (Score panel and other HUD elements are the same) ... */}

      {/* This is the only modified JSX part */}
      <div className="hud-panel hud-scores">
        <div className="hud-header">
          <h2 className="hud-title">{timeOfDay.toUpperCase()}</h2>
        </div>

        <div className="hud-body">
          {scores.map((score) => (
            <div
              key={score.category}
              className={`score-item ${score.achieved ? "achieved" : "locked"}`}
            >
              <div className="score-name">
                {getCategoryDisplayName(score.category)}
              </div>
              <div className="score-points">
                {score.achieved ? score.score : "—"}
              </div>
              {score.achieved &&
                score.diceValues &&
                score.diceValues.length > 0 && (
                  <div className="score-dice-preview">
                    {score.diceValues.map((val, idx) => (
                      <span key={idx} className="dice-pip">
                        {val}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>

        <div className="hud-footer">
          <div className="wallet-row">
            <span className="wallet-label">Balance</span>
            <span className="wallet-amount-wrapper">
              {gainAmount && (
                <span key={gainAmount} className="wallet-gain">
                  +${(gainAmount / 100).toFixed(2)}
                </span>
              )}
              <span className={`wallet-amount ${isGaining ? "gaining" : ""}`}>
                {(displayBalance / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD"
                })}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Current attempt panel */}
      <div className="hud-panel hud-attempt">
        <div className="attempt-score">
          <div className="attempt-label">CURRENT TOSS</div>
          <div className={`attempt-value ${isSettled ? "settled" : ""}`}>
            {currentScore > 0 ? currentScore : "—"}
          </div>
        </div>

        <div className={`attempt-tracker ${isLastAttempt ? "critical" : ""}`}>
          <div className="attempt-counter-label">
            ATTEMPT {currentAttempts}/{maxAttempts}
          </div>
          <div className="attempt-dots">
            {Array.from({ length: maxAttempts }).map((_, i) => (
              <div
                key={i}
                className={`attempt-dot ${i < currentAttempts ? "used" : ""} ${
                  i === currentAttempts - 1 && isLastAttempt ? "critical" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dice tooltip */}
      {hoveredDice && (
        <div
          className="hud-dice-tooltip"
          style={{
            left: `${hoveredDice.position.x + 20}px`,
            top: `${hoveredDice.position.y - 10}px`
          }}
        >
          <div className="tooltip-header">
            <span className="tooltip-type">
              {getDiceTypeDisplay(hoveredDice.type)}
            </span>
            <span className="tooltip-id">#{hoveredDice.id}</span>
          </div>

          <div className="tooltip-stats">
            <div className="tooltip-stat">
              <span className="stat-label">Face</span>
              <span className="stat-value face">{hoveredDice.faceValue}</span>
            </div>
            <div className="tooltip-stat">
              <span className="stat-label">Score</span>
              <span className="stat-value score">{hoveredDice.score}</span>
            </div>
          </div>

          {hoveredDice.modifiers.length > 0 && (
            <div className="tooltip-modifiers">
              {hoveredDice.modifiers.map((mod, idx) => (
                <span key={idx} className="modifier-badge">
                  {mod}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GameHUD;
