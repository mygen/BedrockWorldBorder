/**
 * Utility functions for BedrockWorldBorder
 * @module utils
 */

import { CHUNK_SIZE, DEFAULTS } from './constants.js';

/**
 * Gets the dimension key from a dimension ID
 * @param {string} dimensionId - The full dimension ID
 * @returns {string} The dimension key
 */
export function getDimensionKey(dimensionId) {
    if (dimensionId.includes('nether')) return 'nether';
    if (dimensionId.includes('end')) return 'end';
    return 'overworld';
}

/**
 * Validates and parses numeric input
 * @param {any} value - The value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} fieldName - Name of the field for error messages
 * @returns {{valid: boolean, value?: number, error?: string}}
 */
export function validateNumericInput(value, min, max, fieldName) {
    const num = typeof value === 'string' ? parseInt(value) : value;

    if (isNaN(num)) {
        return { valid: false, error: `${fieldName} must be a valid number.` };
    }

    if (num < min || num > max) {
        return { valid: false, error: `${fieldName} must be between ${min} and ${max}.` };
    }

    return { valid: true, value: num };
}

/**
 * Checks if a player has permission to bypass world borders
 * @param {Player} player
 * @returns {boolean}
 */
export function hasBypassPermission(player) {
    return player.playerPermissionLevel >= 2 || player.hasTag('border_bypass');
}

/**
 * Checks if a player is a Game Director or higher
 * @param {Player} player
 * @returns {boolean}
 */
export function isGameDirector(player) {
    return player.playerPermissionLevel >= 2;
}

/**
 * Finds a safe Y coordinate for teleportation
 * @param {Player} player
 * @param {number} x - Target X
 * @param {number} z - Target Z
 * @param {number} currentY - Current Y
 * @returns {number} Safe Y coordinate
 */
export function findSafeY(player, x, z, currentY) {
    try {
        const dimension = player.dimension;
        const startY = Math.floor(currentY);
        const floorX = Math.floor(x);
        const floorZ = Math.floor(z);

        const isSafe = (y) => {
            try {
                const block = dimension.getBlock({ x: floorX, y: y, z: floorZ });
                const blockAbove = dimension.getBlock({ x: floorX, y: y + 1, z: floorZ });
                return block && blockAbove &&
                       block.typeId === 'minecraft:air' &&
                       blockAbove.typeId === 'minecraft:air';
            } catch {
                return false;
            }
        };

        if (isSafe(startY)) return startY;

        for (let offset = 1; offset <= DEFAULTS.SAFE_Y_SEARCH_RANGE; offset++) {
            const yAbove = startY + offset;
            if (yAbove <= 320 && isSafe(yAbove)) return yAbove;

            const yBelow = startY - offset;
            if (yBelow >= -64 && isSafe(yBelow)) return yBelow;
        }

        return currentY;
    } catch {
        return currentY;
    }
}

/**
 * Sanitizes player name input
 * @param {string} name
 * @returns {string}
 */
export function sanitizePlayerName(name) {
    return name.trim().substring(0, 16);
}