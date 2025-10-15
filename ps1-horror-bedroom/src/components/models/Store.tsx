import { Text } from "@react-three/drei";
import { type ItemDefinition } from "../../systems/itemSystem";
import { ItemChoice } from "./ItemChoice";

/**
 * Defines the structure for an item available for purchase in the store.
 */
export interface StoreItemDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  // The type of dice this item corresponds to for purchase logic
  type: "thumbtacks" | "coins" | "d6" | "d4" | "d3";
}

interface StoreMenuProps {
  items: StoreItemDefinition[];
  onPurchaseItem: (item: StoreItemDefinition) => void;
  onClose: () => void; // Function to close the store menu
  playerBalance: number;
  position?: [number, number, number]; // Optional position for the whole store setup
}

/**
 * A helper function to convert a store item into a format
 * that the ItemChoice component can render.
 */
const convertToDisplayItem = (
  item: StoreItemDefinition
): Partial<ItemDefinition> => {
  const effectMap = {
    thumbtacks: { type: "add_dice", maxValue: 1 },
    coins: { type: "add_dice", maxValue: 2 },
    d3: { type: "add_dice", maxValue: 3 },
    d4: { type: "add_dice", maxValue: 4 },
    d6: { type: "add_dice", maxValue: 6 }
  };

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    // We'll use rarity to control the color/feel in the store
    rarity: "uncommon",
    effect: effectMap[item.type]
  };
};

/**
 * StoreMenu - A 3D in-world component for purchasing items.
 * Replaces the 2D HTML overlay with 3D item pedestals.
 */
export function StoreMenu({
  items,
  onPurchaseItem,
  onClose,
  playerBalance,
  position = [2.01, 1.55, 4.88]
}: StoreMenuProps) {
  if (items?.length === 0) {
    return null;
  }

  // Define the layout for the items in 3D space
  const itemSpacing = 0.5;
  const totalWidth = (items.length - 1) * itemSpacing;
  const startX = position[0] - totalWidth / 2;

  return (
    <group position={position}>
      {/* Header Text */}
      <Text
        position={[0, 1, 0]}
        fontSize={0.15}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        font="/fonts/VT323-Regular.ttf" // Example font, replace with your own
      >
        General Store
      </Text>
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.06}
        color="#AAAAAA"
        anchorX="center"
        anchorY="middle"
        font="/fonts/VT323-Regular.ttf"
      >
        Your Balance: <Text color="#FFD700">{playerBalance}¢</Text>
      </Text>

      {/* Item Pedestals */}
      <group position={[1, -0.1, 0.2]}>
        {items.map((item, index) => {
          const canAfford = playerBalance >= item.cost;
          const itemPosition: [number, number, number] = [
            startX + index * itemSpacing,
            0,
            0
          ];

          // Convert to the format ItemChoice expects
          const displayItem = convertToDisplayItem(item) as ItemDefinition;

          // If the player can't afford the item, we make it 'common'
          // which the ItemChoice component renders as grey.
          if (!canAfford) {
            displayItem.rarity = "common";
          }

          return (
            <group key={item.id} position={itemPosition}>
              <ItemChoice
                item={displayItem}
                position={[0, 0.2, 0]}
                onSelect={() => canAfford && onPurchaseItem(item)}
              />
              {/* Item Name and Cost Text */}
              <Text
                position={[0, 0, 0]}
                fontSize={0.05}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
                font="/fonts/VT323-Regular.ttf"
              >
                {item.name}
              </Text>
              <Text
                position={[0, -0.06, 0]}
                fontSize={0.04}
                color={canAfford ? "#FFD700" : "#555555"}
                anchorX="center"
                anchorY="middle"
                font="/fonts/VT323-Regular.ttf"
              >
                {item.cost}¢
              </Text>
            </group>
          );
        })}
      </group>

      {/* You can add a 3D "close" button or handle the onClose via an ESC key press in the parent component */}
    </group>
  );
}

export default StoreMenu;
