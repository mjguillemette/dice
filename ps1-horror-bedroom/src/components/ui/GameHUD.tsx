import { useEffect, useState, useRef, useCallback } from "react";
import type { ScoreCategoryData } from "../../systems/scoringSystem";
import { getCategoryDisplayName } from "../../systems/scoringSystem";
import type { DiceData } from "./DiceInfo";
import "./GameHUD.css";

interface GameHUDProps {
  scores: ScoreCategoryData[];
  timeOfDay: string;
  currentAttempts: number;
  maxAttempts: number;
  currentScore: number;
  isSettled: boolean;
  balance: number;
  hoveredDice: DiceData | null;
  onScoreHover?: (diceIds: number[] | null) => void; // NEW: Callback when hovering over a score
  totalAttempts: number; // Total attempts across all rounds
  dailyTarget: number; // Daily score target
  dailyBestScore: number; // Best score achieved today
  corruption: number; // Corruption level (0-1)
  successfulRolls: number; // Total successful rolls (for time progression)
  daysMarked: number; // Current day number
  incenseActive?: boolean; // Whether incense item is active for combo tracking
}

export function GameHUD({
  scores,
  timeOfDay,
  currentAttempts,
  maxAttempts,
  currentScore,
  isSettled,
  balance,
  hoveredDice,
  onScoreHover,
  totalAttempts,
  dailyTarget,
  dailyBestScore,
  corruption,
  successfulRolls,
  daysMarked,
  incenseActive = false
}: GameHUDProps) {
  const isLastAttempt = currentAttempts >= maxAttempts;

  // --- 💰 Animated Balance State ---
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [gainAmount, setGainAmount] = useState<number | null>(null);
  const [isGaining, setIsGaining] = useState(false);

  // --- 🎯 Score Animation State ---
  const [displayScore, setDisplayScore] = useState(currentScore);
  const [recentlyAchieved, setRecentlyAchieved] = useState<Set<string>>(new Set());

  const prevBalance = useRef(balance);
  const prevScore = useRef(currentScore);
  const prevScores = useRef<ScoreCategoryData[]>(scores);
  const gainTimeout = useRef<number | null>(null);
  const highlightTimeout = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const scoreIntervalRef = useRef<number | null>(null);

  const startTicker = useCallback(
    (amountToAdd: number) => {
      let remaining = amountToAdd;
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = window.setInterval(() => {
        if (remaining <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
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

  // Animate current score changes
  useEffect(() => {
    const oldScore = prevScore.current;
    const newScore = currentScore;

    if (newScore !== oldScore) {
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);

      const diff = newScore - oldScore;
      let current = oldScore;
      const steps = 15;
      const increment = diff / steps;

      scoreIntervalRef.current = window.setInterval(() => {
        current += increment;
        if ((diff > 0 && current >= newScore) || (diff < 0 && current <= newScore)) {
          setDisplayScore(newScore);
          if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
        } else {
          setDisplayScore(Math.round(current));
        }
      }, 30);
    }

    prevScore.current = newScore;
  }, [currentScore]);

  // Track newly achieved scores for animation
  useEffect(() => {
    const newAchieved = new Set<string>();
    
    scores.forEach((score, idx) => {
      const prevScore = prevScores.current[idx];
      if (score.achieved && prevScore && !prevScore.achieved) {
        newAchieved.add(score.category);
      }
    });

    if (newAchieved.size > 0) {
      setRecentlyAchieved(newAchieved);
      setTimeout(() => setRecentlyAchieved(new Set()), 2000);
    }

    prevScores.current = scores;
  }, [scores]);

  // Balance animation
  useEffect(() => {
    const oldVal = prevBalance.current;
    const newVal = balance;

    if (newVal > oldVal) {
      const diff = newVal - oldVal;
      setGainAmount(diff);
      startTicker(diff);
      setIsGaining(true);

      if (gainTimeout.current) clearTimeout(gainTimeout.current);
      if (highlightTimeout.current) clearTimeout(highlightTimeout.current);

      gainTimeout.current = window.setTimeout(() => setGainAmount(null), 1500);
      highlightTimeout.current = window.setTimeout(
        () => setIsGaining(false),
        600
      );
    } else if (newVal !== oldVal) {
      setDisplayBalance(newVal);
    }

    prevBalance.current = newVal;
  }, [balance, startTicker]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
      if (gainTimeout.current) clearTimeout(gainTimeout.current);
      if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
    };
  }, []);

  const getDiceTypeDisplay = (type: string): string => {
    const typeMap: Record<string, string> = {
      d6: "D6",
      d4: "D4",
      d3: "D3",
      coin: "Coin",
      thumbtack: "Thumbtack"
    };
    return typeMap[type] || type.toUpperCase();
  };

  const stackModifiers = (modifiers: string[]): Array<{ name: string; count: number }> => {
    const modifierCounts = new Map<string, number>();
    
    modifiers.forEach(mod => {
      modifierCounts.set(mod, (modifierCounts.get(mod) || 0) + 1);
    });

    return Array.from(modifierCounts.entries()).map(([name, count]) => ({
      name,
      count
    }));
  };

  const achievedCount = scores.filter(s => s.achieved).length;
  const totalCount = scores.length;
  const progressPercentage = (achievedCount / totalCount) * 100;

  // Calculate multi-score combo multiplier (exclude highest_total)
  const multiScoreMultiplier = scores.find(s => s.multiScoreMultiplier)?.multiScoreMultiplier || 1.0;
  const achievedScoresThisRound = scores.filter(
    (s) => s.achieved && s.category !== "highest_total" && s.lastUpdatedAttempt === currentAttempts
  ).length;
  const hasMultiScoreBonus = achievedScoresThisRound >= 2 && multiScoreMultiplier > 1.0;

  // Calculate time progression (3 successful rolls per time period)
  const rollsInCurrentPeriod = successfulRolls % 3;
  const rollsUntilNextPeriod = 3 - rollsInCurrentPeriod;

  return (
    <div className="game-hud">
      {/* Score panel with progress indicator */}
      <div className="hud-panel hud-scores">
        <div className="hud-header">
          <h2 className="hud-title">
            {timeOfDay.toUpperCase()}
            <span className="day-indicator"> - Day {daysMarked - 1}</span>
          </h2>
          <div className="time-progression">
            <span className="time-progress-label">
              {rollsUntilNextPeriod === 3 ? "Time advances in " : ""}
              {rollsUntilNextPeriod} roll{rollsUntilNextPeriod !== 1 ? "s" : ""}
            </span>
            <div className="time-progress-dots">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className={`time-dot ${i < rollsInCurrentPeriod ? "filled" : ""}`}
                />
              ))}
            </div>
          </div>
          <div className="progress-indicator">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="progress-text">
              {achievedCount}/{totalCount}
            </span>
          </div>

          {/* Daily Target */}
          <div className="daily-target">
            <div className="target-label">Daily Goal</div>
            <div className="target-values">
              <span className={`target-current ${dailyBestScore >= dailyTarget ? "target-met" : ""}`}>
                {dailyBestScore}
              </span>
              <span className="target-separator">/</span>
              <span className="target-goal">{dailyTarget}</span>
            </div>
          </div>

          {/* Corruption Bar */}
          <div className="corruption-meter">
            <div className="corruption-label">
              <span>Corruption</span>
              <span className="corruption-percent">{Math.floor(corruption * 100)}%</span>
            </div>
            <div className="corruption-bar">
              <div
                className="corruption-fill"
                style={{ width: `${corruption * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Multi-score combo bonus banner */}
        {hasMultiScoreBonus && (
          <div className="multi-score-bonus">
            <span className="bonus-icon">⚡</span>
            <span className="bonus-text">
              {achievedScoresThisRound}× COMBO
            </span>
            <span className="bonus-multiplier">
              +{Math.floor((multiScoreMultiplier - 1) * 100)}%
            </span>
          </div>
        )}

        <div className="hud-body">
          {scores.map((score) => {
            const isNewlyAchieved = recentlyAchieved.has(score.category);

            // Check if the hovered die is part of this score
            const isScoreHighlighted = hoveredDice &&
              score.diceIds &&
              score.diceIds.includes(hoveredDice.id);

            // Check if this score is from the current throw (not a previous round)
            const isFromCurrentThrow = score.lastUpdatedAttempt === totalAttempts;

            // Check if this score has an incense combo
            const hasCombo = score.comboCount && score.comboCount > 1;
            const isIncenseCombo = incenseActive && hasCombo;

            return (
              <div
                key={score.category}
                className={`score-item ${score.achieved ? "achieved" : "locked"} ${
                  isNewlyAchieved ? "newly-achieved" : ""
                } ${isScoreHighlighted ? (isFromCurrentThrow ? "highlighted-by-dice" : "highlighted-by-dice-subtle") : ""} ${
                  isIncenseCombo ? "incense-combo" : ""
                }`}
                onMouseEnter={() => {
                  if (score.achieved && score.diceIds && score.diceIds.length > 0 && onScoreHover) {
                    onScoreHover(score.diceIds);
                  }
                }}
                onMouseLeave={() => {
                  if (onScoreHover) {
                    onScoreHover(null);
                  }
                }}
              >
                <div className="score-content">
                  <div className="score-name">
                    {getCategoryDisplayName(score.category)}
                  </div>
                  <div className="score-points">
                    {score.achieved ? (
                      <>
                        <span className="score-value">{score.score}</span>
                        {isNewlyAchieved && (
                          <span className="score-sparkle">✨</span>
                        )}
                        {isIncenseCombo && (
                          <div className="score-streak incense-active" title={`Incense: ${score.comboCount}× streak!`}>
                            <span className="streak-icon">🔥</span>
                            <span className="streak-count">×{score.comboCount}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                
                {score.achieved &&
                  score.diceValues &&
                  score.diceValues.length > 0 && (
                    <div className="score-dice-preview">
                      {score.diceValues.map((val, idx) => {
                        // Check if this specific pip corresponds to the hovered die
                        const pipDiceId = score.diceIds ? score.diceIds[idx] : undefined;
                        const isPipHighlighted = hoveredDice && pipDiceId === hoveredDice.id;

                        return (
                          <span
                            key={idx}
                            className={`dice-pip ${isPipHighlighted ? (isFromCurrentThrow ? "highlighted" : "highlighted-subtle") : ""}`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            {val}
                          </span>
                        );
                      })}
                    </div>
                  )}
              </div>
            );
          })}
        </div>

        <div className="hud-footer">
          <div className="wallet-row">
            <span className="wallet-label">
              <span className="wallet-icon">💰</span> Balance
            </span>
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

      {/* Current attempt panel with enhanced visuals */}
      <div className="hud-panel hud-attempt">
        <div className="attempt-score">
          <div className="attempt-label">CURRENT TOSS</div>
          <div className={`attempt-value ${isSettled ? "settled" : ""}`}>
            {displayScore > 0 ? (
              <span className="score-number">{displayScore}</span>
            ) : (
              <span className="score-placeholder">—</span>
            )}
          </div>
        </div>

        <div className={`attempt-tracker ${isLastAttempt ? "critical" : ""}`}>
          <div className="attempt-counter-label">
            ATTEMPT {currentAttempts}/{maxAttempts}
            {isLastAttempt && <span className="warning-badge">FINAL</span>}
          </div>
          <div className="attempt-dots">
            {Array.from({ length: maxAttempts }).map((_, i) => (
              <div
                key={i}
                className={`attempt-dot ${i < currentAttempts ? "used" : ""} ${
                  i === currentAttempts - 1 && isLastAttempt ? "critical" : ""
                }`}
              >
                <div className="dot-inner" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced dice tooltip */}
      {hoveredDice && (
        <div
          className="hud-dice-tooltip"
          style={{
            left: `${hoveredDice.position.x + 20}px`,
            top: `${hoveredDice.position.y - 10}px`
          }}
        >
          <div className="tooltip-glow" />
          <div className="tooltip-content">
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
              <div className="tooltip-divider" />
              <div className="tooltip-stat">
                <span className="stat-label">Score</span>
                <span className="stat-value score">{hoveredDice.score}</span>
              </div>
            </div>

            {hoveredDice.modifiers.length > 0 && (
              <div className="tooltip-modifiers">
                {stackModifiers(hoveredDice.modifiers).map((mod, idx) => (
                  <span 
                    key={idx} 
                    className="modifier-badge"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {mod.name}
                    {mod.count > 1 && (
                      <span className="modifier-count"> ×{mod.count}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GameHUD;