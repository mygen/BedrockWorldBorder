/**
 * Event emitter for BedrockWorldBorder
 * @module events
 */

/**
 * Simple event emitter for border events
 */
export class BorderEventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Register an event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     */
    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
    }

    /**
     * Remove an event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function to remove
     */
    off(event, handler) {
        if (!this.listeners.has(event)) return;

        const handlers = this.listeners.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {any} data - Event data
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;

        const handlers = this.listeners.get(event);
        for (const handler of handlers) {
            try {
                handler(data);
            } catch (error) {
                console.warn(`Error in event handler for ${event}:`, error);
            }
        }
    }

    /**
     * Register a one-time event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     */
    once(event, handler) {
        const onceHandler = (data) => {
            handler(data);
            this.off(event, onceHandler);
        };
        this.on(event, onceHandler);
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name
     */
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

/**
 * Border event types
 */
export const BorderEvents = {
    PLAYER_CROSS_BORDER: 'playerCrossBorder',
    PLAYER_NEAR_BORDER: 'playerNearBorder',
    PLAYER_TELEPORTED: 'playerTeleported',
    PLAYER_KNOCKED_BACK: 'playerKnockedBack',
    CONFIG_CHANGED: 'configChanged',
    BORDER_ENABLED: 'borderEnabled',
    BORDER_DISABLED: 'borderDisabled',
    PLAYER_CLEANUP: 'playerCleanup',
};
