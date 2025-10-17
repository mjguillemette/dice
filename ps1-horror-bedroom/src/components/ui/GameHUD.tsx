import type { ScoreCategoryData } from "../../systems/scoringSystem";
import { getCategoryDisplayName } from "../../systems/scoringSystem";
import type { DiceData } from "./DiceInfo";
import "./GameHUD.css";

interface GameHUDProps {
  // Score card data
  scores: ScoreCategoryData[];
  timeOfDay: string;

  // Current attempt info
  currentAttempts: number;
  maxAttempts: number;
  currentScore: number;
  isSettled: boolean;

  // Currency
  balance: number;

  // Hovered dice info
  hoveredDice: DiceData | null;
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

  return (
    <div className="game-hud">
      {/* Main score card - left side */}
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
              {score.achieved && score.diceValues && score.diceValues.length > 0 && (
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

        {/* Wallet section at bottom of score card */}
        <div className="hud-footer">
          <div className="wallet-row">
            <span className="wallet-label">Balance</span>
            <span className="wallet-amount">
              {(balance / 100).toLocaleString("en-US", {
                style: "currency",
                currency: "USD"
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Current attempt panel - top right */}
      <div className="hud-panel hud-attempt">
        <div className="attempt-score">
          <div className="attempt-label">CURRENT TOSS</div>
          <div className={`attempt-value ${isSettled ? 'settled' : ''}`}>
            {currentScore > 0 ? currentScore : "—"}
          </div>
        </div>

        <div className={`attempt-tracker ${isLastAttempt ? 'critical' : ''}`}>
          <div className="attempt-counter-label">
            ATTEMPT {currentAttempts}/{maxAttempts}
          </div>
          <div className="attempt-dots">
            {Array.from({ length: maxAttempts }).map((_, i) => (
              <div
                key={i}
                className={`attempt-dot ${i < currentAttempts ? 'used' : ''} ${
                  i === currentAttempts - 1 && isLastAttempt ? 'critical' : ''
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dice info tooltip - positioned absolutely */}
      {hoveredDice && (
        <div
          className="hud-dice-tooltip"
          style={{
            left: `${hoveredDice.position.x + 20}px`,
            top: `${hoveredDice.position.y - 10}px`
          }}
        >
          <div className="tooltip-header">
            <span className="tooltip-type">{getDiceTypeDisplay(hoveredDice.type)}</span>
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
