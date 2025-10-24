/**
 * Centralized logging utility for the application
 * Replaces scattered console.log calls with structured logging
 */

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export const LogCategory = {
  COMBAT: "Combat",
  DICE: "Dice",
  GAME_STATE: "GameState",
  ENEMY: "Enemy",
  SCORING: "Scoring",
  AUDIO: "Audio",
  PHYSICS: "Physics",
  UI: "UI",
  SYSTEM: "System"
} as const;

export type LogCategory = typeof LogCategory[keyof typeof LogCategory];

class Logger {
  private currentLevel: LogLevel = LogLevel.DEBUG;
  private enabledCategories: Set<LogCategory> = new Set(Object.values(LogCategory));

  /**
   * Set the minimum log level to display
   */
  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  /**
   * Enable logging for specific categories
   */
  enableCategories(...categories: LogCategory[]) {
    categories.forEach(cat => this.enabledCategories.add(cat));
  }

  /**
   * Disable logging for specific categories
   */
  disableCategories(...categories: LogCategory[]) {
    categories.forEach(cat => this.enabledCategories.delete(cat));
  }

  /**
   * Enable all categories
   */
  enableAll() {
    this.enabledCategories = new Set(Object.values(LogCategory));
  }

  /**
   * Disable all categories
   */
  disableAll() {
    this.enabledCategories.clear();
  }

  private shouldLog(level: LogLevel, category?: LogCategory): boolean {
    if (level < this.currentLevel) return false;
    if (category && !this.enabledCategories.has(category)) return false;
    return true;
  }

  private formatMessage(category: LogCategory | undefined, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const categoryStr = category ? `[${category}]` : '';
    return `${timestamp} ${categoryStr} ${message}`;
  }

  debug(message: string, category?: LogCategory, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG, category)) {
      console.log(`🔍 ${this.formatMessage(category, message)}`, ...args);
    }
  }

  info(message: string, category?: LogCategory, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO, category)) {
      console.log(`ℹ️ ${this.formatMessage(category, message)}`, ...args);
    }
  }

  warn(message: string, category?: LogCategory, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN, category)) {
      console.warn(`⚠️ ${this.formatMessage(category, message)}`, ...args);
    }
  }

  error(message: string, category?: LogCategory, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR, category)) {
      console.error(`❌ ${this.formatMessage(category, message)}`, ...args);
    }
  }

  // Specialized logging methods with predefined categories
  combat(message: string, ...args: any[]) {
    this.debug(message, LogCategory.COMBAT, ...args);
  }

  dice(message: string, ...args: any[]) {
    this.debug(message, LogCategory.DICE, ...args);
  }

  gameState(message: string, ...args: any[]) {
    this.debug(message, LogCategory.GAME_STATE, ...args);
  }

  enemy(message: string, ...args: any[]) {
    this.debug(message, LogCategory.ENEMY, ...args);
  }

  scoring(message: string, ...args: any[]) {
    this.debug(message, LogCategory.SCORING, ...args);
  }
}

// Export singleton instance
export const logger = new Logger();

// Expose to window for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).__logger = logger;
}

// Production: disable debug logs
if (import.meta.env.PROD) {
  logger.setLevel(LogLevel.WARN);
}
