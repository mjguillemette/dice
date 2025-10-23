import { useEffect, useState, useRef } from "react";
import type { ScoreCategoryData } from "../../systems/scoringSystem";
import { getCategoryDisplayName } from "../../systems/scoringSystem";
import { useUISound } from "../../systems/audioSystem";
import "./CharacterHUD.css"; // Note: New CSS styles would be needed for this component

interface CharacterHUDProps {
  scores: ScoreCategoryData[];
  currentHP: number;
  timeOfDay: string;
  currentAttempts: number;
  maxAttempts: number;
  balance: number; // Total currency in copper
}

/**
 * Formats a total copper value into gold, silver, and copper coins.
 * Conversion rates: 100 copper = 1 silver, 100 silver = 1 gold.
 */
const formatCurrency = (totalCopper: number) => {
  const gold = Math.floor(totalCopper / 10000);
  const silver = Math.floor((totalCopper % 10000) / 100);
  const copper = totalCopper % 100;
  return { gold, silver, copper };
};

export function CharacterHUD({
  scores,
  currentHP,
  timeOfDay,
  currentAttempts,
  maxAttempts,
  balance
}: CharacterHUDProps) {
  // --- ✨ State for highlighting newly enabled abilities ---
  const [recentlyEnabled, setRecentlyEnabled] = useState<Set<string>>(
    new Set()
  );

  // --- 🔊 Audio ---
  const { playScore } = useUISound();

  const prevScores = useRef<ScoreCategoryData[]>(scores);

  // Find the 'highest_total' score to determine Max HP, with a default fallback.
  const maxHP =
    scores.find((s) => s.category === "highest_total")?.score || 100;
  const hpPercentage = maxHP > 0 ? (currentHP / maxHP) * 100 : 0;

  // Filter the scores to get a list of currently active abilities.
  const activeAbilities = scores.filter(
    (s) => s.achieved && s.category !== "highest_total"
  );

  // Format the balance into Gold, Silver, and Copper.
  const wallet = formatCurrency(balance);

  // Track newly enabled abilities to play a sound and apply a visual highlight.
  useEffect(() => {
    const newAbilities = new Set<string>();

    scores.forEach((score, idx) => {
      const prevScore = prevScores.current[idx];
      if (score.achieved && prevScore && !prevScore.achieved) {
        // Exclude 'highest_total' as it's a stat, not an ability
        if (score.category !== "highest_total") {
          newAbilities.add(score.category);
        }
      }
    });

    if (newAbilities.size > 0) {
      setRecentlyEnabled(newAbilities);
      playScore(); // Play a sound for newly acquired abilities.
      setTimeout(() => setRecentlyEnabled(new Set()), 2000); // Highlight lasts 2 seconds.
    }

    prevScores.current = scores;
  }, [scores, playScore]);

  return (
    <div className="character-hud">
      <div className="hud-panel">
        <div className="hud-header">
          <h2 className="hud-title">{timeOfDay.toUpperCase()}</h2>
          <div className="attempt-indicator">
            <span className="attempt-label">Attempts:</span>
            <div className="attempt-dots">
              {[...Array(maxAttempts)].map((_, index) => (
                <span
                  key={index}
                  className={`attempt-dot ${
                    index < currentAttempts ? "used" : ""
                  }`}
                >
                  <span className="dot-inner" />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="hud-body">
          {/* Character Stats Section */}
          <div className="character-stats">
            <div
              className="stat-bar hp-bar"
              title={`Health: ${currentHP} / ${maxHP}`}
            >
              <div className="stat-bar-label">
                <span>HP</span>
                <span>
                  {currentHP} / {maxHP}
                </span>
              </div>
              <div className="stat-bar-background">
                <div
                  className="stat-bar-fill"
                  style={{ width: `${hpPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Abilities Section */}
          <div className="abilities-section">
            <h3 className="abilities-title">Abilities</h3>
            <div className="abilities-list">
              {activeAbilities.length > 0 ? (
                activeAbilities.map((ability) => (
                  <div
                    key={ability.category}
                    className={`ability-item ${
                      recentlyEnabled.has(ability.category)
                        ? "newly-enabled"
                        : ""
                    }`}
                  >
                    {getCategoryDisplayName(ability.category)}
                  </div>
                ))
              ) : (
                <div className="no-abilities-text">No abilities active.</div>
              )}
            </div>
          </div>
        </div>

        <div className="hud-footer">
          <div className="wallet-row">
            <span className="wallet-amount">
              <span className="currency-gold" title={`${wallet.gold} Gold`}>
                {wallet.gold}g
              </span>
              <span
                className="currency-silver"
                title={`${wallet.silver} Silver`}
              >
                {wallet.silver}s
              </span>
              <span
                className="currency-copper"
                title={`${wallet.copper} Copper`}
              >
                {wallet.copper}c
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CharacterHUD;
