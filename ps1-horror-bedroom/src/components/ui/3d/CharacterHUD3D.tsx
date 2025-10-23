import { useEffect, useState, useRef } from "react";
import { useSpring, a, useTransition, config } from "@react-spring/three";
import {
  getCategoryDisplayName,
  type ScoreCategoryData
} from "../../../systems/scoringSystem";
// Import your new 3D components
import { UIPanel3D } from "./UIPanel3D";
import { Text3D } from "./Text3D";
import { StatBar3D } from "./StatBar3D";
import { DotIndicator3D } from "./DotIndicator3D";
import { useUISound } from "../../../systems/audioSystem";
import * as THREE from "three";
import { AbilityCard3D, type AbilityCard3DProps } from "./AbilityCard3D";

// New Prop interface
interface CharacterHUD3DProps {
  scores: ScoreCategoryData[];
  currentHP: number;
  timeOfDay: string;
  currentAttempts: number;
  maxAttempts: number;
  balance: number; // Total currency in copper
  visible?: boolean; // Optional prop to control visibility
}

// ABILITY_DEFINITIONS (unchanged from your version)
const ABILITY_DEFINITIONS: Record<string, Partial<AbilityCard3DProps>> = {
  pair: {
    title: "Quick Strike",
    description: "Pair - Deal damage",
    iconLetter: "S",
    iconColor: "#FF4136", // Red
    effectLabel: "DMG"
  },
  two_pair: {
    title: "Double Strike",
    description: "Two Pair - Heavy damage",
    iconLetter: "SS",
    iconColor: "#FF851B", // Orange
    effectLabel: "DMG"
  },
  three_of_kind: {
    title: "Battle Shout",
    description: "Three of a Kind - Buff",
    iconLetter: "B",
    iconColor: "#0074D9", // Blue
    effectLabel: "BUFF"
  },
  four_of_kind: {
    title: "Quadra Slice",
    description: "Four of a Kind - Massive damage",
    iconLetter: "X4",
    iconColor: "#B10DC9", // Purple
    effectLabel: "DMG"
  },
  run_of_3: {
    title: "Run of 3",
    description: "Small Straight",
    iconLetter: "R3",
    iconColor: "#2ECC40", // Green
    effectLabel: "VAL"
  },
  run_of_4: {
    title: "Run of 4",
    description: "Medium Straight",
    iconLetter: "R4",
    iconColor: "#FFDC00", // Yellow
    effectLabel: "VAL"
  },
  run_of_5: {
    title: "Run of 5",
    description: "Large Straight",
    iconLetter: "R5",
    iconColor: "#FFDC00", // Bright Yellow
    effectLabel: "CHAIN"
  },
  run_of_6: {
    title: "Perfect Run",
    description: "Run of 6 - Max effect",
    iconLetter: "R6",
    iconColor: "#FFFFFF", // White
    effectLabel: "ULT"
  }
};

const formatCurrency = (totalCopper: number) => {
  const gold = Math.floor(totalCopper / 10000);
  const silver = Math.floor((totalCopper % 10000) / 100);
  const copper = totalCopper % 100;
  return { gold, silver, copper };
};

// Main Component
export function CharacterHUD3D({
  scores,
  currentHP,
  timeOfDay,
  currentAttempts,
  maxAttempts,
  balance,
  visible = true // Default to visible
}: CharacterHUD3DProps) {
  // --- Visibility State & Toggle ---
  const [isHudVisible, setIsHudVisible] = useState(visible);

  useEffect(() => {
    setIsHudVisible(visible);
  }, [visible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p") {
        setIsHudVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- Audio & State ---
  const { playScore } = useUISound();
  const [recentlyEnabled, setRecentlyEnabled] = useState<Set<string>>(
    new Set()
  );
  const prevScores = useRef<ScoreCategoryData[]>(scores);

  // --- Derived Data ---
  const maxHP =
    scores.find((s) => s.category === "highest_total")?.score || 100;
  const activeAbilities = scores.filter(
    (s) => s.achieved && s.category !== "highest_total"
  );
  const wallet = formatCurrency(balance);

  // --- Highlight & Sound Effect ---
  useEffect(() => {
    const newAbilities = new Set<string>();
    scores.forEach((score, idx) => {
      const prevScore = prevScores.current[idx];
      if (score.achieved && prevScore && !prevScore.achieved) {
        if (score.category !== "highest_total") {
          newAbilities.add(score.category);
        }
      }
    });

    if (newAbilities.size > 0) {
      setRecentlyEnabled(newAbilities);
      playScore();
      setTimeout(() => setRecentlyEnabled(new Set()), 2000);
    }
    prevScores.current = scores;
  }, [scores, playScore]);

  // --- Layout Constants ---
  const PANEL_WIDTH = 2.0; // Widened to fit 3 cards
  const PANEL_HEIGHT = 2.0;
  const STATS_PANEL_HEIGHT = 0.68;
  const CARD_WIDTH = 1.2;
  const CARD_STEP = 1.28; // Card width + padding

  // --- Main HUD Animation (Slide in/out) ---
  const hudSpring = useSpring({
    // Animate position and scale
    scale: isHudVisible ? 0.25 : 0,
    position: isHudVisible
      ? [.275, PANEL_HEIGHT / 2 - 0.16, 2.62]
      : [.275, PANEL_HEIGHT / 3 - 0.16, 2.62],
    config: config.stiff
  });

  // --- Ability Card Animation (Staggered list) ---
  // Define the type for the items passed to useTransition
  type TransitionItem = ScoreCategoryData & { x: number };

  const numCards = activeAbilities.length;
  const startX = -(CARD_STEP * (numCards - 1)) / 2; // Calculate start for centering

  const cardTransitions = useTransition<
    TransitionItem,
    { opacity: number; y: number; scale: number }
  >(
    activeAbilities.map((ability, i) => ({
      ...ability,
      x: startX + i * CARD_STEP // Add x position to the item data
    })),
    {
      keys: (item) => item.category, // Use category as the key
      from: { opacity: 0, y: -0.5, scale: 0.9 },
      enter: { opacity: 1, y: 0, scale: 1 },
      leave: { opacity: 0, y: -0.5, scale: 0.9 },
      trail: 100, // Stagger animation
      config: config.gentle
    }
  );

  return (
    <a.group
      name="ui_3d_hud"
      position={hudSpring.position as any}
      rotation={[Math.PI / 4.6, Math.PI, 0]}
      scale={hudSpring.scale}
    >
      <UIPanel3D width={PANEL_WIDTH} height={PANEL_HEIGHT} opacity={0}>
        {/* === Stats Panel (Top) === */}
        <UIPanel3D
          width={PANEL_WIDTH - 0.1}
          height={STATS_PANEL_HEIGHT}
          position={[-1, PANEL_HEIGHT / 2 - STATS_PANEL_HEIGHT / 4 - 0.05, 0.02]}
          color="#000000"
          opacity={1}
        >
          {/* Time */}
          <Text3D
            anchorX="center"
            font="Jersey25-Regular.ttf"
            fontSize={0.12}
            position={[0, STATS_PANEL_HEIGHT / 2 - 0.12, 0.01]}
          >
            {timeOfDay.toUpperCase()}
          </Text3D>

          {/* HP Bar */}
          <group position={[0, 0.05, 0.01]}>
            <Text3D
              position={[-PANEL_WIDTH / 2 + 0.1, 0.08, 0]}
              fontSize={0.08}
              color="#AAAAAA"
              font="Jersey25-Regular.ttf"
            >
              HP
            </Text3D>
            <Text3D
              position={[PANEL_WIDTH / 2 - 0.1, 0.08, 0]}
              fontSize={0.08}
              anchorX="right"
              font="Jersey25-Regular.ttf"
            >
              {currentHP} / {maxHP}
            </Text3D>
            <StatBar3D
              value={currentHP}
              max={maxHP}
              width={Math.min(PANEL_WIDTH - 0.2, 2.4)}
              height={0.06}
              color="#FF4D6D"
              position={[0, -.04, 0]}
            />
          </group>

          {/* Attempts (Bottom Left) */}
          <group
            position={[
              -PANEL_WIDTH / 2 + 0.5,
              -STATS_PANEL_HEIGHT / 2 + 0.15,
              0.01
            ]}
          >
            <Text3D
              anchorX="left"
              fontSize={0.07}
              position={[-0.4, 0, 0]}
              color="#AAAAAA"
              font="Jersey25-Regular.ttf"
            >
              Attempts:
            </Text3D>
            <DotIndicator3D
              max={maxAttempts}
              current={currentAttempts}
              position={[0, 0, 0]}
            />
          </group>

          {/* Wallet (Bottom Right) */}
          <group
            position={[
              PANEL_WIDTH / 2 - .77,
              -STATS_PANEL_HEIGHT / 2 + 0.15,
              0.01
            ]}
          >
            <Text3D
              position={[0, 0, 0]}
              fontSize={0.09}
              color="#FFD700"
              anchorX="center"
              font="Jersey25-Regular.ttf"
            >
              {wallet.gold}g
            </Text3D>
            <Text3D
              position={[0.3, 0, 0]}
              fontSize={0.09}
              color="#C0C0C0"
              anchorX="center"
              font="Jersey25-Regular.ttf"
            >
              {wallet.silver}s
            </Text3D>
            <Text3D
              position={[0.6, 0, 0]}
              fontSize={0.09}
              color="#B87333"
              anchorX="center"
              font="Jersey25-Regular.ttf"
            >
              {wallet.copper}c
            </Text3D>
          </group>
        </UIPanel3D>

        {/* === Abilities Section (Bottom) === */}
        <group position={[0, -0.3, 0]}>

          {/* Animated Ability Cards */}
          <group position={[0, .12, .5]}>
            {cardTransitions((style, item) => {
              // 'item' contains both style and original data
              const ability = item; // Rename for clarity
              const def = ABILITY_DEFINITIONS[ability.category];
              if (!def) {
                console.warn(
                  `No 3D definition for ability: ${ability.category}`
                );
                return null;
              }

              // Access 'x' from the 'item' (which includes the original data)
              // Apply animated 'y' and 'scale' from 'style'
              return (
                <a.group
                  position-x={item.x}
                  position-y={style.y}
                  scale={style.scale}
                >
                  <AbilityCard3D
                    key={ability.category}
                    title={
                      def.title || getCategoryDisplayName(ability.category)
                    }
                    description={def.description || "Ability"}
                    iconLetter={def.iconLetter || "!"}
                    iconColor={def.iconColor || "#FFFFFF"}
                    effectLabel={def.effectLabel || "Value"}
                    state={
                      recentlyEnabled.has(ability.category)
                        ? "hovered"
                        : "active"
                    }
                    effectValue={ability.score}
                    contributingDice={ability.diceValues || []}
                    onClick={() => {
                      console.log(`Clicked ${def.title}`);
                    }}
                  />
                </a.group>
              );
            })}

            {/* "No abilities" text (only shows if list is empty) */}
            {activeAbilities.length === 0 && (
              <Text3D
                fontSize={0.07}
                color="#777"
                position={[0, 0, 0]}
                anchorX="center"
                font="Jersey25-Regular.ttf"
              >
                No abilities active.
              </Text3D>
            )}
          </group>
        </group>
      </UIPanel3D>
    </a.group>
  );
}
