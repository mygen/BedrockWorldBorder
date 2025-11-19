/**
 * Utility functions for BedrockWorldBorder
 * @module utils
 */

import { DEFAULTS, MESSAGES } from './constants.js';

/**
 * Gets the dimension key from a dimension ID
 * @param {string} dimensionId - The full dimension ID (e.g., "minecraft:overworld")
 * @returns {string} The dimension key ("overworld", "nether", or "end")
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
 * @returns {{valid: boolean, value?: number, error?: string}} Validation result
 */
export function validateNumericInput(value, min, max, fieldName) {
    const num = typeof value === 'string' ? parseInt(value) : value;

    if (isNaN(num)) {
        return {
            valid: false,
            error: `${fieldName} must be a valid number.`
        };
    }

    if (num < min || num > max) {
        return {
            valid: false,
            error: `${fieldName} must be between ${min} and ${max}.`
        };
    }

    return {
        valid: true,
        value: num
    };
}

/**
 * Checks if a player has permission to bypass world borders
 * @param {Player} player - The player to check
 * @returns {boolean} True if player has bypass permission
 */
export function hasBypassPermission(player) {
    return player.playerPermissionLevel >= 2 || player.hasTag('border_bypass');
}

/**
 * Checks if a player is a Game Director or higher
 * @param {Player} player - The player to check
 * @returns {boolean} True if player has Game Director permissions
 */
export function isGameDirector(player) {
    return player.playerPermissionLevel >= 2;
}

/**
 * Gets the particle string identifier from a particle type
 * @param {string} particleType - The particle type key
 * @returns {string} The Minecraft particle identifier
 */
export function getParticleString(particleType) {
    const particleMap = {
        'flame': 'minecraft:basic_flame_particle',
        'redstone': 'minecraft:redstone_wire_dust_particle',
        'portal': 'minecraft:basic_portal_particle',
        'critical': 'minecraft:critical_hit_emitter'
    };

    return particleMap[particleType] || 'minecraft:basic_flame_particle';
}

/**
 * Finds a safe Y coordinate for teleportation
 * @param {Player} player - The player to teleport
 * @param {number} x - Target X coordinate
 * @param {number} z - Target Z coordinate
 * @param {number} currentY - Current Y coordinate
 * @returns {number} Safe Y coordinate
 */
export function findSafeY(player, x, z, currentY) {
    try {
        const dimension = player.dimension;
        const startY = Math.floor(currentY);
        const floorX = Math.floor(x);
        const floorZ = Math.floor(z);

        // Helper function to check if a Y level is safe (optimized)
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

        // First, try the current Y level
        if (isSafe(startY)) {
            return startY;
        }

        // Search in an expanding pattern (more efficient than separate up/down searches)
        for (let offset = 1; offset <= DEFAULTS.SAFE_Y_SEARCH_RANGE; offset++) {
            // Try above first (safer than below)
            const yAbove = startY + offset;
            if (yAbove <= 320 && isSafe(yAbove)) {
                return yAbove;
            }

            // Then try below
            const yBelow = startY - offset;
            if (yBelow >= -64 && isSafe(yBelow)) {
                return yBelow;
            }
        }

        // Fallback: return current Y
        return currentY;

    } catch (error) {
        return currentY;
    }
}

/**
 * Calculates the distance from a point to the border
 * @param {number} x - X coordinate relative to center
 * @param {number} z - Z coordinate relative to center
 * @param {number} maxDistance - Border size
 * @returns {number} Distance to border
 */
export function getDistanceToBorder(x, z, maxDistance) {
    const maxCoord = Math.max(Math.abs(x), Math.abs(z));
    return maxDistance - maxCoord;
}

/**
 * Validates border size against warning distance
 * @param {number} size - Border size
 * @param {number} warnDistance - Warning distance
 * @returns {boolean} True if valid
 */
export function isValidBorderSize(size, warnDistance) {
    return size >= DEFAULTS.MIN_BORDER_SIZE && size > warnDistance;
}

/**
 * Sanitizes player name input
 * @param {string} name - Player name
 * @returns {string} Sanitized name
 */
export function sanitizePlayerName(name) {
    return name.trim().substring(0, 16);
}
