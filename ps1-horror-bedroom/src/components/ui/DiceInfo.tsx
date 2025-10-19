import "./DiceInfo.css";

export interface DiceData {
  id: number;
  type: string; // "d6", "d4", "d3", "coin", "thumbtack", "caltrop", "golden_pyramid", etc.
  faceValue: number;
  score: number;
  modifiers: string[];
  position: { x: number; y: number }; // Screen position for tooltip
  currencyEarned?: number; // Amount of cents earned this roll (for coins/nickels)
}

interface DiceInfoProps {
  diceData: DiceData | null;
}

export function DiceInfo({ diceData }: DiceInfoProps) {
  if (!diceData) return null;

  // Special dice information with display name and description
  const specialDiceInfo: Record<string, { name: string; description: string }> = {
    golden_pyramid: {
      name: "Golden Pyramid",
      description: "A gilded D3 that generates 1-3 coins on each roll."
    },
    caltrop: {
      name: "Caltrop",
      description: "A sharp D4 with unpredictable bounces."
    },
    casino_reject: {
      name: "Casino Reject",
      description: "A rigged D6 weighted to roll high."
    },
    weighted_die: {
      name: "Weighted Die",
      description: "Special D6 with higher average values."
    },
    loaded_coin: {
      name: "Loaded Coin",
      description: "A rigged coin that favors heads."
    },
    cursed_die: {
      name: "Cursed Die",
      description: "Rolls high but adds corruption (+5% per roll)."
    },
    split_die: {
      name: "Split Die",
      description: "A D6 that can split into 2 D3s."
    },
    mirror_die: {
      name: "Mirror Die",
      description: "A D6 that copies another die's value."
    },
    rigged_die: {
      name: "Rigged Die",
      description: "A D6 that always rolls high."
    },
    nickel: {
      name: "Nickel",
      description: "Worth 5¢ or 10¢ depending on the face."
    }
  };

  const getDiceTypeDisplay = (type: string): string => {
    // Check if this is a special die
    if (specialDiceInfo[type]) {
      return specialDiceInfo[type].name;
    }

    // Standard dice types
    const typeMap: Record<string, string> = {
      d6: "D6",
      d4: "D4",
      d3: "D3",
      d8: "D8",
      d10: "D10",
      d12: "D12",
      d20: "D20",
      coin: "Coin",
      thumbtack: "Thumbtack"
    };
    return typeMap[type] || type.toUpperCase();
  };

  const getDiceDescription = (type: string): string | null => {
    return specialDiceInfo[type]?.description || null;
  };

  const description = getDiceDescription(diceData.type);
  const hasCurrency = diceData.currencyEarned !== undefined && diceData.currencyEarned > 0;

  return (
    <div
      className="dice-info-tooltip"
      style={{
        left: `${diceData.position.x + 20}px`,
        top: `${diceData.position.y - 10}px`
      }}
    >
      <div className="dice-info-header">
        <span className="dice-type">{getDiceTypeDisplay(diceData.type)}</span>
        <span className="dice-id">#{diceData.id}</span>
      </div>

      {description && (
        <div className="dice-info-description">
          {description}
        </div>
      )}

      <div className="dice-info-body">
        <div className="dice-info-row">
          <span className="dice-info-label">Face Value:</span>
          <span className="dice-info-value dice-face">{diceData.faceValue}</span>
        </div>

        <div className="dice-info-row">
          <span className="dice-info-label">Score:</span>
          <span className="dice-info-value dice-score">{diceData.score}</span>
        </div>

        {hasCurrency && (
          <div className="dice-info-row dice-info-currency">
            <span className="dice-info-label">Currency Earned:</span>
            <span className="dice-info-value dice-currency">
              ${((diceData.currencyEarned ?? 0) / 100).toFixed(2)}
            </span>
          </div>
        )}

        {diceData.modifiers.length > 0 && (
          <div className="dice-info-modifiers">
            <span className="dice-info-label">Modifiers:</span>
            <div className="modifier-list">
              {diceData.modifiers.map((mod, idx) => (
                <span key={idx} className="modifier-tag">
                  {mod}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiceInfo;
