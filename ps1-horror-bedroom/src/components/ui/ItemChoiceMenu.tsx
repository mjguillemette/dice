import { useState } from "react";
import { type ItemDefinition } from "../../systems/itemSystem";

interface ItemChoiceMenuProps {
items: ItemDefinition[];
  onSelectItem: (item: ItemDefinition) => void;
  dayNumber: number;
}

/**
 * ItemChoiceMenu - Rogue-like item selection overlay
 * Shows 3 item choices at the end of each day
 */
export function ItemChoiceMenu({
  items,
  onSelectItem,
  dayNumber
}: ItemChoiceMenuProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return null;
  }

  // Rarity color mapping
  const rarityColors: Record<ItemDefinition["rarity"], string> = {
    common: "#999999",
    uncommon: "#4488FF",
    rare: "#FFD700",
    epic: "#FF44FF",
    legendary: "#FF0000"
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        fontFamily: "monospace",
        color: "#CCCCCC"
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#FFFFFF",
            marginBottom: "10px",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)"
          }}
        >
          Day {dayNumber} Complete
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#888888"
          }}
        >
          Choose an item to add to your collection
        </p>
      </div>

      {/* Item cards */}
      <div
        style={{
          display: "flex",
          gap: "30px",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "1200px"
        }}
      >
        {items.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const rarityColor = rarityColors[item.rarity];

          return (
            <button
              key={item.id}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onSelectItem(item)}
              style={{
                width: "280px",
                padding: "24px",
                backgroundColor: isHovered ? "#222222" : "#111111",
                border: `2px solid ${isHovered ? rarityColor : "#333333"}`,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                transform: isHovered
                  ? "translateY(-8px) scale(1.05)"
                  : "translateY(0) scale(1)",
                boxShadow: isHovered
                  ? `0 8px 24px rgba(0, 0, 0, 0.8), 0 0 20px ${rarityColor}40`
                  : "0 4px 12px rgba(0, 0, 0, 0.5)",
                textAlign: "left"
              }}
            >
              {/* Rarity badge */}
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  backgroundColor: rarityColor + "20",
                  border: `1px solid ${rarityColor}`,
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  color: rarityColor,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "12px"
                }}
              >
                {item.rarity}
              </div>

              {/* Item name */}
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  color: "#FFFFFF",
                  marginBottom: "12px",
                  textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)"
                }}
              >
                {item.name}
              </h2>

              {/* Item description */}
              <p
                style={{
                  fontSize: "14px",
                  color: "#AAAAAA",
                  lineHeight: "1.5",
                  marginBottom: "16px",
                  minHeight: "60px"
                }}
              >
                {item.description}
              </p>

              {/* Effect badge */}
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333333",
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: "#888888"
                }}
              >
                {item.effect.type === "add_dice" && (
                  <span>
                    <strong style={{ color: "#FFFFFF" }}>+1 Die</strong> (
                    {item.effect.maxValue === 1 && "Thumbtack"}
                    {item.effect.maxValue === 2 && "Coin"}
                    {item.effect.maxValue === 3 && "D3"}
                    {item.effect.maxValue === 4 && "D4"}
                    {item.effect.maxValue === 6 && "D6"})
                  </span>
                )}
                {item.effect.type === "add_card" && (
                  <span>
                    <strong style={{ color: "#FFFFFF" }}>Tarot Card</strong>{" "}
                    (Multiplier)
                  </span>
                )}
                {item.effect.type === "add_decoration" && (
                  <span>
                    <strong style={{ color: "#FFFFFF" }}>Decoration</strong>{" "}
                    (???)
                  </span>
                )}
              </div>

              {/* Hover prompt */}
              {isHovered && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "8px",
                    backgroundColor: rarityColor + "20",
                    border: `1px solid ${rarityColor}`,
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: rarityColor,
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "1px"
                  }}
                >
                  Click to Select
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div
        style={{
          marginTop: "40px",
          fontSize: "14px",
          color: "#555555",
          textAlign: "center"
        }}
      >
        Choose wisely - you can only pick one item per day
      </div>
    </div>
  );
}

export default ItemChoiceMenu;
