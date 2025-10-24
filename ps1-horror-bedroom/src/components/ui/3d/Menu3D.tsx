import React, { useState } from "react";
import { UIPanel3D } from "./UIPanel3D";
import { TabButton3D } from "./TabButton3D";

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface Menu3DProps {
  tabs: Tab[];
  width?: number;
  height?: number;
  depth?: number;
  [key: string]: any; // for position, rotation
}

export const Menu3D = ({
  tabs,
  width = 2.5,
  height = 1.8,
  depth = 0.1,
  ...props
}: Menu3DProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const tabButtonWidth = 0.5;
  const tabButtonHeight = 0.15;
  const tabSpacing = 0.55;
  const totalTabsWidth =
    tabs.length * tabSpacing - (tabSpacing - tabButtonWidth);
  const tabsStartY = height / 2 + tabButtonHeight / 2 + 0.02;
  const tabsStartX = -totalTabsWidth / 2 + tabButtonWidth / 2;

  return (
    <group
      position={[.2, 1.4, 3.2]}
      scale={0.3}
      rotation={[0, Math.PI, 0]}
      {...props}
    >
      {/* Main Panel */}
      <UIPanel3D
        width={width}
        height={height}
        depth={depth}
        color="#111111"
        opacity={0.9}
      >
        {/* Render only the active tab's content */}
        {tabs[activeIndex]?.content}
      </UIPanel3D>

      {/* Tab Buttons */}
      <group position={[0, tabsStartY, depth / 2]}>
        {tabs.map((tab, index) => (
          <TabButton3D
            key={tab.label}
            label={tab.label}
            isActive={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            position={[tabsStartX + index * tabSpacing, 0, 0]}
            width={tabButtonWidth}
            height={tabButtonHeight}
          />
        ))}
      </group>
    </group>
  );
};
