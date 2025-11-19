/**
 * Constants and configuration defaults for BedrockWorldBorder
 * @module constants
 */

/**
 * Default configuration values
 */
export const DEFAULTS = {
    MIN_BORDER_SIZE: 100,
    MAX_WARN_DISTANCE: 50,
    PARTICLE_RENDER_DISTANCE: 10,
    WARNING_CHECK_INTERVAL: 10,  // ticks
    PARTICLE_UPDATE_INTERVAL: 20,  // ticks (reduced from 10 for performance)
    INIT_DELAY: 20,  // ticks
    MAX_GRID_SIZE: 4,  // Reduced from 6 for performance
    MIN_GRID_SIZE: 2,
    PARTICLE_SPACING_MIN: 0.4,  // Increased from 0.3 for less density
    PARTICLE_SPACING_MAX: 0.8,  // Increased from 0.7
    SAFE_Y_SEARCH_RANGE: 10,
    MIN_PLAYER_MOVEMENT_FOR_PARTICLE_UPDATE: 1,  // blocks
    KNOCKBACK_HORIZONTAL_STRENGTH: 3.0,
    KNOCKBACK_VERTICAL_STRENGTH: 0.1,
    MAX_EXTRA_PARTICLES: 1,  // Reduced from 2 for performance
};

/**
 * Color codes for messages
 */
export const COLORS = {
    SUCCESS: '§a',
    ERROR: '§c',
    WARNING: '§e',
    INFO: '§b',
    NEUTRAL: '§7',
    HIGHLIGHT: '§6',
    DARK_GRAY: '§8',
};

/**
 * Localized messages
 */
export const MESSAGES = {
    INVALID_SIZE: `${COLORS.ERROR}Size must be a positive number.`,
    BORDER_TOO_SMALL: `${COLORS.ERROR}World border size must be at least ${DEFAULTS.MIN_BORDER_SIZE} blocks.`,
    SIZE_LESS_THAN_WARN: (size, warnDist) =>
        `${COLORS.ERROR}Border size (${size}) must be greater than warning distance (${warnDist}).`,
    WARN_DIST_MUST_BE_NUMBER: `${COLORS.ERROR}Warning distance must be a non-negative number.`,
    WARN_DIST_TOO_LARGE: `${COLORS.ERROR}Warning distance cannot be greater than ${DEFAULTS.MAX_WARN_DISTANCE} blocks.`,
    WARN_DIST_GREATER_THAN_SIZE: (warnDist, dim, size) =>
        `${COLORS.ERROR}Warning distance (${warnDist}) must be less than ${dim} border size (${size}).`,
    INVALID_CENTER_COORDS: `${COLORS.ERROR}Center coordinates must be valid numbers.`,
    INVALID_DIMENSION: `${COLORS.ERROR}Invalid dimension. Use: all, overworld, nether, or end.`,
    AT_BORDER: `${COLORS.ERROR}You have reached the world border!`,
    APPROACHING_BORDER: (distance) =>
        `${COLORS.WARNING}Approaching world border: ${COLORS.ERROR}${distance} ${COLORS.WARNING}blocks remaining`,
    BEYOND_BORDER: (distance) =>
        `${COLORS.ERROR}Beyond border: ${COLORS.INFO}${distance} ${COLORS.ERROR}blocks`,
    SIZE_SET_ALL: (size) => `${COLORS.SUCCESS}Set world border size to ${COLORS.INFO}${size} ${COLORS.SUCCESS}for all dimensions.`,
    SIZE_SET_DIM: (size, dim) => `${COLORS.SUCCESS}Set world border size to ${COLORS.INFO}${size} ${COLORS.SUCCESS}for ${dim}.`,
    BORDER_ENABLED_ALL: `${COLORS.SUCCESS}World border ${COLORS.SUCCESS}enabled ${COLORS.SUCCESS}for all dimensions.`,
    BORDER_DISABLED_ALL: `${COLORS.SUCCESS}World border ${COLORS.ERROR}disabled ${COLORS.SUCCESS}for all dimensions.`,
    BORDER_ENABLED_DIM: (dim) => `${COLORS.SUCCESS}World border ${COLORS.SUCCESS}enabled ${COLORS.SUCCESS}for ${dim}.`,
    BORDER_DISABLED_DIM: (dim) => `${COLORS.SUCCESS}World border ${COLORS.ERROR}disabled ${COLORS.SUCCESS}for ${dim}.`,
    WARNING_ENABLED_ALL: `${COLORS.SUCCESS}World border warnings ${COLORS.SUCCESS}enabled for all dimensions.`,
    WARNING_DISABLED_ALL: `${COLORS.SUCCESS}World border warnings ${COLORS.ERROR}disabled for all dimensions.`,
    WARNING_ENABLED_DIM: (dim) => `${COLORS.SUCCESS}World border warnings ${COLORS.SUCCESS}enabled for ${dim}.`,
    WARNING_DISABLED_DIM: (dim) => `${COLORS.SUCCESS}World border warnings ${COLORS.ERROR}disabled for ${dim}.`,
    WARN_DIST_SET_ALL: (distance) =>
        `${COLORS.SUCCESS}Set warning distance to ${COLORS.INFO}${distance} ${COLORS.SUCCESS}blocks for all dimensions.`,
    WARN_DIST_SET_DIM: (distance, dim) =>
        `${COLORS.SUCCESS}Set warning distance to ${COLORS.INFO}${distance} ${COLORS.SUCCESS}blocks for ${dim}.`,
    CENTER_SET_ALL: (x, z) => `${COLORS.SUCCESS}Set center coordinates to ${COLORS.INFO}${x}, ${z} ${COLORS.SUCCESS}for all dimensions.`,
    CENTER_SET_DIM: (x, z, dim) => `${COLORS.SUCCESS}Set center coordinates to ${COLORS.INFO}${x}, ${z} ${COLORS.SUCCESS}for ${dim}.`,
    BYPASS_GRANTED: (name) => `${COLORS.SUCCESS}Gave border bypass to ${name}.`,
    BYPASS_REVOKED: (name) => `${COLORS.SUCCESS}Removed border bypass from ${name}.`,
    BYPASS_GRANTED_SELF: `${COLORS.SUCCESS}You can now bypass the world border.`,
    BYPASS_REVOKED_SELF: `${COLORS.ERROR}You can no longer bypass the world border.`,
    PLAYER_NOT_FOUND: (name) => `${COLORS.ERROR}Player '${name}' not found.`,
    FORM_ERROR: `${COLORS.ERROR}Error opening settings form. Please try again.`,
    INVALID_FORM_SIZE: `${COLORS.ERROR}Invalid size. Must be at least ${DEFAULTS.MIN_BORDER_SIZE}.`,
    INVALID_FORM_WARN_DIST: `${COLORS.ERROR}Invalid warning distance. Must be 0-${DEFAULTS.MAX_WARN_DISTANCE}.`,
    FORM_WARN_GREATER_THAN_SIZE: (warnDist, size) =>
        `${COLORS.ERROR}Warning distance (${warnDist}) must be less than border size (${size}).`,
};

/**
 * Default dimension configurations
 */
export const DEFAULT_DIMENSION_CONFIG = {
    overworld: {
        enabled: false,
        size: 1000,
        warning: true,
        warnDistance: 50,
        centerX: 0,
        centerZ: 0,
        particlesEnabled: true,
        particleType: 'flame',
        action: 'teleport'
    },
    nether: {
        enabled: false,
        size: 1000,
        warning: true,
        warnDistance: 50,
        centerX: 0,
        centerZ: 0,
        particlesEnabled: true,
        particleType: 'redstone',
        action: 'teleport'
    },
    end: {
        enabled: false,
        size: 1000,
        warning: true,
        warnDistance: 50,
        centerX: 0,
        centerZ: 0,
        particlesEnabled: true,
        particleType: 'portal',
        action: 'teleport'
    }
};

/**
 * Particle type mapping
 */
export const PARTICLE_TYPES = {
    'flame': 'minecraft:basic_flame_particle',
    'redstone': 'minecraft:redstone_wire_dust_particle',
    'portal': 'minecraft:basic_portal_particle',
    'critical': 'minecraft:critical_hit_emitter'
};

/**
 * Sound effects
 */
export const SOUNDS = {
    BORDER_HIT: 'random.orb',
    KNOCKBACK: 'item.shield.block',
};

/**
 * Permission levels
 */
export const PERMISSION_LEVELS = {
    GAME_DIRECTOR: 2,
    ANY: 0,
};
