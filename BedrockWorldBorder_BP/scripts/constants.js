/**
 * Constants and configuration defaults for BedrockWorldBorder
 * @module constants
 */

/**
 * World constants
 */
export const CHUNK_SIZE = 16;

/**
 * Default configuration values
 */
export const DEFAULTS = {
    // Border settings (in chunks)
    MIN_BORDER_SIZE_CHUNKS: 1,
    DEFAULT_BORDER_SIZE_CHUNKS: 64,
    
    // Warning settings (in blocks)
    MAX_WARN_DISTANCE: 50,
    DEFAULT_WARN_DISTANCE: 50,
    
    // Wall particle settings
    WALL_VISIBILITY_CHUNKS: 6,      // Show wall when within 6 chunks (96 blocks)
    WALL_SEGMENT_CHUNKS: 8,         // Render 8 chunks in each direction from player
    PARTICLE_SPAWN_Y: 128,          // Y level for particle spawn
    PARTICLE_SPAWN_INTERVAL: 60,    // Ticks between spawns (3 seconds)
    
    // Player monitoring
    WARNING_CHECK_INTERVAL: 10,
    INIT_DELAY: 20,
    
    // Border enforcement
    KNOCKBACK_HORIZONTAL_STRENGTH: 3.0,
    KNOCKBACK_VERTICAL_STRENGTH: 0.1,
    SAFE_Y_SEARCH_RANGE: 10,
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
    // Validation errors
    INVALID_SIZE: `${COLORS.ERROR}Size must be a positive number of chunks.`,
    BORDER_TOO_SMALL: `${COLORS.ERROR}World border size must be at least ${DEFAULTS.MIN_BORDER_SIZE_CHUNKS} chunk(s).`,
    SIZE_LESS_THAN_WARN: (sizeBlocks, warnDist) =>
        `${COLORS.ERROR}Border size (${sizeBlocks} blocks) must be greater than warning distance (${warnDist} blocks).`,
    WARN_DIST_TOO_LARGE: `${COLORS.ERROR}Warning distance cannot be greater than ${DEFAULTS.MAX_WARN_DISTANCE} blocks.`,
    WARN_DIST_GREATER_THAN_SIZE: (warnDist, dim, sizeBlocks) =>
        `${COLORS.ERROR}Warning distance (${warnDist}) must be less than ${dim} border size (${sizeBlocks} blocks).`,
    INVALID_CENTER_COORDS: `${COLORS.ERROR}Center coordinates must be valid numbers.`,
    INVALID_DIMENSION: `${COLORS.ERROR}Invalid dimension. Use: all, overworld, nether, or end.`,
    
    // Player feedback
    AT_BORDER: `${COLORS.ERROR}You have reached the world border!`,
    APPROACHING_BORDER: (distance) =>
        `${COLORS.WARNING}Approaching world border: ${COLORS.ERROR}${distance} ${COLORS.WARNING}blocks remaining`,
    BEYOND_BORDER: (distance) =>
        `${COLORS.ERROR}Beyond border: ${COLORS.INFO}${distance} ${COLORS.ERROR}blocks`,
    INTERACTION_PREVENTED: `${COLORS.ERROR}You cannot interact with blocks outside the world border!`,
    
    // Admin feedback - Size
    SIZE_SET_ALL: (chunks) => `${COLORS.SUCCESS}Set world border size to ${COLORS.INFO}${chunks} chunks ${COLORS.NEUTRAL}(${chunks * CHUNK_SIZE} blocks) ${COLORS.SUCCESS}for all dimensions.`,
    SIZE_SET_DIM: (chunks, dim) => `${COLORS.SUCCESS}Set world border size to ${COLORS.INFO}${chunks} chunks ${COLORS.NEUTRAL}(${chunks * CHUNK_SIZE} blocks) ${COLORS.SUCCESS}for ${dim}.`,
    
    // Admin feedback - Toggle
    BORDER_ENABLED_ALL: `${COLORS.SUCCESS}World border ${COLORS.SUCCESS}enabled ${COLORS.SUCCESS}for all dimensions.`,
    BORDER_DISABLED_ALL: `${COLORS.SUCCESS}World border ${COLORS.ERROR}disabled ${COLORS.SUCCESS}for all dimensions.`,
    BORDER_ENABLED_DIM: (dim) => `${COLORS.SUCCESS}World border ${COLORS.SUCCESS}enabled ${COLORS.SUCCESS}for ${dim}.`,
    BORDER_DISABLED_DIM: (dim) => `${COLORS.SUCCESS}World border ${COLORS.ERROR}disabled ${COLORS.SUCCESS}for ${dim}.`,
    
    // Admin feedback - Warnings
    WARNING_ENABLED_ALL: `${COLORS.SUCCESS}World border warnings ${COLORS.SUCCESS}enabled for all dimensions.`,
    WARNING_DISABLED_ALL: `${COLORS.SUCCESS}World border warnings ${COLORS.ERROR}disabled for all dimensions.`,
    WARNING_ENABLED_DIM: (dim) => `${COLORS.SUCCESS}World border warnings ${COLORS.SUCCESS}enabled for ${dim}.`,
    WARNING_DISABLED_DIM: (dim) => `${COLORS.SUCCESS}World border warnings ${COLORS.ERROR}disabled for ${dim}.`,
    WARN_DIST_SET_ALL: (distance) =>
        `${COLORS.SUCCESS}Set warning distance to ${COLORS.INFO}${distance} ${COLORS.SUCCESS}blocks for all dimensions.`,
    WARN_DIST_SET_DIM: (distance, dim) =>
        `${COLORS.SUCCESS}Set warning distance to ${COLORS.INFO}${distance} ${COLORS.SUCCESS}blocks for ${dim}.`,
    
    // Admin feedback - Center
    CENTER_SET_ALL: (x, z) => `${COLORS.SUCCESS}Set center coordinates to ${COLORS.INFO}${x}, ${z} ${COLORS.SUCCESS}for all dimensions.`,
    CENTER_SET_DIM: (x, z, dim) => `${COLORS.SUCCESS}Set center coordinates to ${COLORS.INFO}${x}, ${z} ${COLORS.SUCCESS}for ${dim}.`,
    
    // Admin feedback - Bypass
    BYPASS_GRANTED: (name) => `${COLORS.SUCCESS}Gave border bypass to ${name}.`,
    BYPASS_REVOKED: (name) => `${COLORS.SUCCESS}Removed border bypass from ${name}.`,
    BYPASS_GRANTED_SELF: `${COLORS.SUCCESS}You can now bypass the world border.`,
    BYPASS_REVOKED_SELF: `${COLORS.ERROR}You can no longer bypass the world border.`,
    PLAYER_NOT_FOUND: (name) => `${COLORS.ERROR}Player '${name}' not found.`,
    
    // Form messages
    FORM_ERROR: `${COLORS.ERROR}Error opening settings form. Please try again.`,
    INVALID_FORM_SIZE: `${COLORS.ERROR}Invalid size. Must be at least ${DEFAULTS.MIN_BORDER_SIZE_CHUNKS} chunk(s).`,
    INVALID_FORM_WARN_DIST: `${COLORS.ERROR}Invalid warning distance. Must be 0-${DEFAULTS.MAX_WARN_DISTANCE} blocks.`,
    FORM_WARN_GREATER_THAN_SIZE: (warnDist, sizeBlocks) =>
        `${COLORS.ERROR}Warning distance (${warnDist}) must be less than border size (${sizeBlocks} blocks).`,
};

/**
 * Default dimension configurations
 */
export const DEFAULT_DIMENSION_CONFIG = {
    overworld: {
        enabled: false,
        sizeChunks: 64,
        warning: true,
        warnDistance: 50,
        centerX: 0,
        centerZ: 0,
        action: 'teleport',
        preventInteraction: false,
        particleStyle: 'default'
    },
    nether: {
        enabled: false,
        sizeChunks: 64,
        warning: true,
        warnDistance: 50,
        centerX: 0,
        centerZ: 0,
        action: 'teleport',
        preventInteraction: false,
        particleStyle: 'default'
    },
    end: {
        enabled: false,
        sizeChunks: 64,
        warning: true,
        warnDistance: 50,
        centerX: 0,
        centerZ: 0,
        action: 'teleport',
        preventInteraction: false,
        particleStyle: 'default'
    }
};

/**
 * Available particle styles
 */
export const PARTICLE_STYLES = {
    OPTIONS: ['default', 'style1', 'style2', 'style3', 'style4', 'style5', 'style6', 'style7', 'style8', 'style9', 'style10'],
    NAMES: ['Default', 'Style 1', 'Style 2', 'Style 3', 'Style 4', 'Style 5', 'Style 6', 'Style 7', 'Style 8', 'Style 9', 'Style 10']
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