/**
 * Event Bus - Centralized Event System
 * Enables decoupled communication between systems
 */

/**
 * All possible event types in the game
 */
export type GameEventType =
  // Dice events
  | 'dice:spawned'
  | 'dice:rolled'
  | 'dice:settled'
  | 'dice:transformed'
  | 'dice:modifier_applied'

  // Score events
  | 'score:calculated'
  | 'score:achieved'
  | 'score:combo'
  | 'score:multi_combo'

  // Item events
  | 'item:purchased'
  | 'item:activated'
  | 'item:expired'
  | 'item:effect_applied'

  // Game state events
  | 'game:started'
  | 'game:paused'
  | 'game:resumed'
  | 'game:ended'
  | 'game:phase_changed'

  // Progression events
  | 'time:advanced'
  | 'day:started'
  | 'day:ended'
  | 'round:started'
  | 'round:ended'
  | 'attempt:started'
  | 'attempt:ended'

  // Economy events
  | 'currency:earned'
  | 'currency:spent'
  | 'store:opened'
  | 'store:refreshed'

  // Corruption events
  | 'corruption:increased'
  | 'corruption:decreased'
  | 'corruption:threshold_reached';

/**
 * Base event interface
 */
export interface GameEvent<TPayload = any> {
  type: GameEventType;
  payload: TPayload;
  timestamp: number;
  source?: string; // Which system/component emitted this
}

/**
 * Event listener/handler function
 */
export type EventListener<TPayload = any> = (event: GameEvent<TPayload>) => void;

/**
 * Subscription handle returned when subscribing
 */
export interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * EventBus implementation
 * Singleton pattern - use the exported `eventBus` instance
 */
class EventBus {
  private listeners: Map<GameEventType, Set<EventListener>>;
  private eventHistory: GameEvent[];
  private maxHistorySize: number;
  private isDebugging: boolean;

  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 100;
    this.isDebugging = false;
  }

  /**
   * Subscribe to an event type
   */
  on<TPayload = any>(
    type: GameEventType,
    handler: EventListener<TPayload>
  ): EventSubscription {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const handlers = this.listeners.get(type)!;
    handlers.add(handler as EventListener);

    if (this.isDebugging) {
      console.log(`[EventBus] Subscribed to ${type}. Total listeners: ${handlers.size}`);
    }

    // Return subscription object
    return {
      unsubscribe: () => this.off(type, handler)
    };
  }

  /**
   * Unsubscribe from an event type
   */
  off<TPayload = any>(
    type: GameEventType,
    handler: EventListener<TPayload>
  ): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(handler as EventListener);

      if (this.isDebugging) {
        console.log(
          `[EventBus] Unsubscribed from ${type}. Remaining listeners: ${handlers.size}`
        );
      }

      // Clean up empty sets
      if (handlers.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  /**
   * Subscribe to an event once (auto-unsubscribe after first trigger)
   */
  once<TPayload = any>(
    type: GameEventType,
    handler: EventListener<TPayload>
  ): EventSubscription {
    const wrappedHandler: EventListener<TPayload> = (event) => {
      handler(event);
      this.off(type, wrappedHandler);
    };

    return this.on(type, wrappedHandler);
  }

  /**
   * Emit an event to all subscribers
   */
  emit<TPayload = any>(
    type: GameEventType,
    payload: TPayload,
    source?: string
  ): void {
    const event: GameEvent<TPayload> = {
      type,
      payload,
      timestamp: Date.now(),
      source
    };

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    if (this.isDebugging) {
      console.log(`[EventBus] Emitted ${type}`, { payload, source });
    }

    // Notify all listeners
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Clear all listeners (useful for testing or cleanup)
   */
  clearAll(): void {
    this.listeners.clear();
    if (this.isDebugging) {
      console.log('[EventBus] Cleared all listeners');
    }
  }

  /**
   * Clear listeners for a specific event type
   */
  clear(type: GameEventType): void {
    this.listeners.delete(type);
    if (this.isDebugging) {
      console.log(`[EventBus] Cleared listeners for ${type}`);
    }
  }

  /**
   * Get count of listeners for an event type
   */
  listenerCount(type: GameEventType): number {
    return this.listeners.get(type)?.size || 0;
  }

  /**
   * Get all event types that have listeners
   */
  getEventTypes(): GameEventType[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get event history
   */
  getHistory(type?: GameEventType): GameEvent[] {
    if (type) {
      return this.eventHistory.filter(event => event.type === type);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Enable/disable debug logging
   */
  setDebug(enabled: boolean): void {
    this.isDebugging = enabled;
    console.log(`[EventBus] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}

/**
 * Singleton instance
 */
export const eventBus = new EventBus();

/**
 * React hook for subscribing to events
 * Usage:
 *
 * useEventListener('dice:settled', (event) => {
 *   console.log('Dice settled!', event.payload);
 * });
 */
export const useEventListener = <TPayload = any>(
  _type: GameEventType,
  _handler: EventListener<TPayload>,
  _dependencies: any[] = []
) => {
  // This will be implemented when we integrate with React
  // For now, it's just a placeholder showing the intended API
  console.warn('useEventListener not yet implemented - use eventBus.on() directly');
};

/**
 * Utility: Create a typed event emitter function
 * Useful for systems that always emit the same source
 */
export const createEventEmitter = (source: string) => {
  return <TPayload = any>(type: GameEventType, payload: TPayload) => {
    eventBus.emit(type, payload, source);
  };
};

/**
 * Utility: Wait for an event to fire (Promise-based)
 */
export const waitForEvent = <TPayload = any>(
  type: GameEventType,
  timeoutMs?: number
): Promise<GameEvent<TPayload>> => {
  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const subscription = eventBus.once(type, (event) => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve(event as GameEvent<TPayload>);
    });

    if (timeoutMs) {
      timeoutId = setTimeout(() => {
        subscription.unsubscribe();
        reject(new Error(`Event ${type} did not fire within ${timeoutMs}ms`));
      }, timeoutMs);
    }
  });
};

/**
 * Utility: Create a middleware that logs all events
 */
export const createLoggingMiddleware = () => {
  const allEventTypes: GameEventType[] = [
    'dice:spawned',
    'dice:rolled',
    'dice:settled',
    'score:calculated',
    'game:started',
    // ... add more as needed
  ];

  allEventTypes.forEach(type => {
    eventBus.on(type, (event) => {
      console.log(`[Event] ${type}`, event.payload);
    });
  });
};

export default eventBus;
