/**
 * Development Logger Utility
 * Centralized logging with categories and conditional output
 */

export type LogCategory =
  | "game-state"
  | "items"
  | "scoring"
  | "physics"
  | "camera"
  | "lighting"
  | "dice"
  | "error";

interface LogConfig {
  enabled: boolean;
  categories: Set<LogCategory>;
}

const config: LogConfig = {
  enabled: import.meta.env.DEV, // Only log in development
  categories: new Set([
    "game-state",
    "items",
    "error"
    // Add categories here to enable their logs
  ])
};

/**
 * Enable/disable logging for specific categories
 */
export function setLogCategories(categories: LogCategory[]) {
  config.categories = new Set(categories);
}

/**
 * Enable all logging categories
 */
export function enableAllLogs() {
  config.categories = new Set([
    "game-state",
    "items",
    "scoring",
    "physics",
    "camera",
    "lighting",
    "dice",
    "error"
  ]);
}

/**
 * Disable all logging
 */
export function disableAllLogs() {
  config.categories.clear();
}

/**
 * Log with category filtering
 */
export function devLog(category: LogCategory, emoji: string, message: string, ...args: any[]) {
  if (!config.enabled) return;
  if (!config.categories.has(category)) return;

  console.log(`${emoji} [${category}] ${message}`, ...args);
}

/**
 * Always log errors regardless of category settings
 */
export function devError(message: string, ...args: any[]) {
  if (!config.enabled) return;
  console.error(`❌ [ERROR] ${message}`, ...args);
}

/**
 * Always log warnings regardless of category settings
 */
export function devWarn(message: string, ...args: any[]) {
  if (!config.enabled) return;
  console.warn(`⚠️ [WARN] ${message}`, ...args);
}

/**
 * Get current log configuration
 */
export function getLogConfig() {
  return {
    enabled: config.enabled,
    categories: Array.from(config.categories)
  };
}
