/**
 * Main WorldBorderManager class
 * @module WorldBorderManager
 */

import { world, system } from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
import { DEFAULTS, COLORS, MESSAGES, DEFAULT_DIMENSION_CONFIG, SOUNDS } from './constants.js';
import {
    getDimensionKey,
    validateNumericInput,
    hasBypassPermission,
    isGameDirector,
    getParticleString,
    findSafeY,
    sanitizePlayerName,
} from './utils.js';
import { BorderEventEmitter, BorderEvents } from './events.js';

/**
 * Manages world border functionality across all dimensions
 */
export class WorldBorderManager {
    constructor() {
        this.config = JSON.parse(JSON.stringify(DEFAULT_DIMENSION_CONFIG));
        this.playerWarnings = new Map();
        this.lastParticlePositions = new Map();
        this.events = new BorderEventEmitter();
        this.init();
    }

    /**
     * Initialize the world border manager
     */
    init() {
        // Delay initialization to ensure world is ready
        system.runTimeout(() => {
            this.loadConfig();
            this.startPlayerMonitoring();
            this.registerPlayerCleanup();
        }, DEFAULTS.INIT_DELAY);
    }

    /**
     * Register cleanup handler for when players leave
     * Fixes memory leak by removing player data from Maps
     */
    registerPlayerCleanup() {
        world.afterEvents.playerLeave.subscribe((event) => {
            this.playerWarnings.delete(event.playerId);
            this.lastParticlePositions.delete(event.playerId);
            this.events.emit(BorderEvents.PLAYER_CLEANUP, { playerId: event.playerId });
        });
    }

    /**
     * Load configuration from world dynamic properties
     */
    loadConfig() {
        try {
            const savedConfig = world.getDynamicProperty('worldBorderConfig');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                // Merge saved config with defaults to ensure new properties are added
                for (const dim in this.config) {
                    if (parsedConfig[dim]) {
                        this.config[dim] = { ...this.config[dim], ...parsedConfig[dim] };
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load world border config, using defaults');
        }
    }

    /**
     * Save configuration to world dynamic properties
     */
    saveConfig() {
        try {
            world.setDynamicProperty('worldBorderConfig', JSON.stringify(this.config));
            this.events.emit(BorderEvents.CONFIG_CHANGED, { config: this.config });
        } catch (error) {
            console.warn('Failed to save world border config');
        }
    }

    /**
     * Show help message to player
     * @param {Player} player - The player to show help to
     */
    showHelp(player) {
        const isAdmin = isGameDirector(player);
        player.sendMessage(`${COLORS.HIGHLIGHT}=== World Border Commands ===`);
        player.sendMessage(`${COLORS.WARNING}/worldborder:help ${COLORS.NEUTRAL}- Show this help message`);
        player.sendMessage(`${COLORS.WARNING}/worldborder:status ${COLORS.NEUTRAL}- Show current border status`);

        if (isAdmin) {
            player.sendMessage(`${COLORS.WARNING}/worldborder:menu ${COLORS.NEUTRAL}- Open settings GUI`);
            player.sendMessage(`${COLORS.WARNING}/worldborder:allow <player> <on|off> ${COLORS.NEUTRAL}- Grant/revoke border bypass`);
            player.sendMessage(`${COLORS.WARNING}/worldborder:size <all|overworld|nether|end> <size> ${COLORS.NEUTRAL}- Set border size`);
            player.sendMessage(`${COLORS.WARNING}/worldborder:toggle <all|overworld|nether|end> ${COLORS.NEUTRAL}- Toggle border on/off`);
            player.sendMessage(`${COLORS.WARNING}/worldborder:warning <all|overworld|nether|end> <on|off> ${COLORS.NEUTRAL}- Toggle warning messages`);
            player.sendMessage(`${COLORS.WARNING}/worldborder:warndistance <all|overworld|nether|end> <distance> ${COLORS.NEUTRAL}- Set warning distance`);
            player.sendMessage(`${COLORS.WARNING}/worldborder:center <all|overworld|nether|end> <x> <z> ${COLORS.NEUTRAL}- Set center coordinates`);
        } else {
            player.sendMessage(`${COLORS.NEUTRAL}Additional commands available for GameDirector+ permission level`);
        }
    }

    /**
     * Show current border status to player
     * @param {Player} player - The player to show status to
     */
    showStatus(player) {
        player.sendMessage(`${COLORS.HIGHLIGHT}=== World Border Status ===`);

        for (const [dim, config] of Object.entries(this.config)) {
            const statusColor = config.enabled ? COLORS.SUCCESS : COLORS.ERROR;
            const statusText = config.enabled ? 'Enabled' : 'Disabled';
            const warningStatus = config.warning ? `${COLORS.SUCCESS}On` : `${COLORS.ERROR}Off`;
            const particleStatus = config.particlesEnabled ? `${COLORS.SUCCESS}On` : `${COLORS.ERROR}Off`;
            const actionText = config.action === 'knockback' ? 'Knockback' : 'Teleport';

            player.sendMessage(`${COLORS.WARNING}${dim.charAt(0).toUpperCase() + dim.slice(1)}: ${statusColor}${statusText} ${COLORS.NEUTRAL}| Size: ${COLORS.INFO}${config.size} ${COLORS.NEUTRAL}| Center: ${COLORS.INFO}${config.centerX}, ${config.centerZ}`);
            player.sendMessage(`  ${COLORS.NEUTRAL}Warnings: ${warningStatus} ${COLORS.NEUTRAL}| Distance: ${COLORS.INFO}${config.warnDistance} ${COLORS.NEUTRAL}| Action: ${COLORS.INFO}${actionText} ${COLORS.NEUTRAL}| Particles: ${particleStatus}`);
        }
    }

    /**
     * Set border size for a dimension
     * @param {Player} player - The player executing the command
     * @param {string} dimension - Dimension key or 'all'
     * @param {number} size - Border size
     */
    setSize(player, dimension, size) {
        const validation = validateNumericInput(size, DEFAULTS.MIN_BORDER_SIZE, Infinity, 'Size');
        if (!validation.valid) {
            player.sendMessage(`${COLORS.ERROR}${validation.error}`);
            return;
        }
        size = validation.value;

        if (size < DEFAULTS.MIN_BORDER_SIZE) {
            player.sendMessage(MESSAGES.BORDER_TOO_SMALL);
            return;
        }

        // Check if border size would be smaller than warn distance for affected dimensions
        const dimensionsToCheck = dimension === 'all' ? ['overworld', 'nether', 'end'] : [dimension];
        for (const dim of dimensionsToCheck) {
            if (!this.config[dim]) continue;
            if (this.config[dim].warnDistance >= size) {
                player.sendMessage(MESSAGES.SIZE_LESS_THAN_WARN(size, this.config[dim].warnDistance));
                return;
            }
        }

        if (dimension === 'all') {
            for (const dim of ['overworld', 'nether', 'end']) {
                this.config[dim].size = size;
            }
            player.sendMessage(MESSAGES.SIZE_SET_ALL(size));
        } else if (this.config[dimension]) {
            this.config[dimension].size = size;
            player.sendMessage(MESSAGES.SIZE_SET_DIM(size, dimension));
        } else {
            player.sendMessage(MESSAGES.INVALID_DIMENSION);
            return;
        }

        this.saveConfig();
    }

    /**
     * Toggle border on/off for a dimension
     * @param {Player} player - The player executing the command
     * @param {string} dimension - Dimension key or 'all'
     */
    toggleBorder(player, dimension) {
        if (dimension === 'all') {
            const newState = !this.config.overworld.enabled;
            for (const dim of ['overworld', 'nether', 'end']) {
                this.config[dim].enabled = newState;
            }
            player.sendMessage(newState ? MESSAGES.BORDER_ENABLED_ALL : MESSAGES.BORDER_DISABLED_ALL);
            this.events.emit(newState ? BorderEvents.BORDER_ENABLED : BorderEvents.BORDER_DISABLED, { dimension: 'all' });
        } else if (this.config[dimension]) {
            this.config[dimension].enabled = !this.config[dimension].enabled;
            const newState = this.config[dimension].enabled;
            player.sendMessage(newState ? MESSAGES.BORDER_ENABLED_DIM(dimension) : MESSAGES.BORDER_DISABLED_DIM(dimension));
            this.events.emit(newState ? BorderEvents.BORDER_ENABLED : BorderEvents.BORDER_DISABLED, { dimension });
        } else {
            player.sendMessage(MESSAGES.INVALID_DIMENSION);
            return;
        }

        this.saveConfig();
    }

    /**
     * Set warning on/off for a dimension
     * @param {Player} player - The player executing the command
     * @param {boolean} enabled - Whether warnings are enabled
     * @param {string} dimension - Dimension key or 'all'
     */
    setWarning(player, enabled, dimension = 'all') {
        if (dimension === 'all') {
            for (const dim of ['overworld', 'nether', 'end']) {
                this.config[dim].warning = enabled;
            }
            player.sendMessage(enabled ? MESSAGES.WARNING_ENABLED_ALL : MESSAGES.WARNING_DISABLED_ALL);
        } else if (this.config[dimension]) {
            this.config[dimension].warning = enabled;
            player.sendMessage(enabled ? MESSAGES.WARNING_ENABLED_DIM(dimension) : MESSAGES.WARNING_DISABLED_DIM(dimension));
        } else {
            player.sendMessage(MESSAGES.INVALID_DIMENSION);
            return;
        }
        this.saveConfig();
    }

    /**
     * Set warning distance for a dimension
     * @param {Player} player - The player executing the command
     * @param {number} distance - Warning distance
     * @param {string} dimension - Dimension key or 'all'
     */
    setWarnDistance(player, distance, dimension = 'all') {
        const validation = validateNumericInput(distance, 0, DEFAULTS.MAX_WARN_DISTANCE, 'Warning distance');
        if (!validation.valid) {
            player.sendMessage(`${COLORS.ERROR}${validation.error}`);
            return;
        }
        distance = validation.value;

        if (distance > DEFAULTS.MAX_WARN_DISTANCE) {
            player.sendMessage(MESSAGES.WARN_DIST_TOO_LARGE);
            return;
        }

        // Check if warn distance is greater than any active border size
        const activeBorders = Object.entries(this.config).filter(([_, config]) => config.enabled);
        for (const [dim, config] of activeBorders) {
            if (distance >= config.size) {
                player.sendMessage(MESSAGES.WARN_DIST_GREATER_THAN_SIZE(distance, dim, config.size));
                return;
            }
        }

        // Apply to all dimensions or specific dimension
        if (dimension === 'all') {
            for (const dim of ['overworld', 'nether', 'end']) {
                this.config[dim].warnDistance = distance;
            }
            player.sendMessage(MESSAGES.WARN_DIST_SET_ALL(distance));
        } else if (this.config[dimension]) {
            this.config[dimension].warnDistance = distance;
            player.sendMessage(MESSAGES.WARN_DIST_SET_DIM(distance, dimension));
        } else {
            player.sendMessage(MESSAGES.INVALID_DIMENSION);
            return;
        }
        this.saveConfig();
    }

    /**
     * Set center coordinates for a dimension
     * @param {Player} player - The player executing the command
     * @param {string} dimension - Dimension key or 'all'
     * @param {number} x - Center X coordinate
     * @param {number} z - Center Z coordinate
     */
    setCenter(player, dimension, x, z) {
        if (isNaN(x) || isNaN(z)) {
            player.sendMessage(MESSAGES.INVALID_CENTER_COORDS);
            return;
        }

        if (dimension === 'all') {
            for (const dim of ['overworld', 'nether', 'end']) {
                this.config[dim].centerX = x;
                this.config[dim].centerZ = z;
            }
            player.sendMessage(MESSAGES.CENTER_SET_ALL(x, z));
        } else if (this.config[dimension]) {
            this.config[dimension].centerX = x;
            this.config[dimension].centerZ = z;
            player.sendMessage(MESSAGES.CENTER_SET_DIM(x, z, dimension));
        } else {
            player.sendMessage(MESSAGES.INVALID_DIMENSION);
            return;
        }

        this.saveConfig();
    }

    /**
     * Show border particles to a player (optimized)
     * @param {Player} player - The player to show particles to
     */
    showBorderParticles(player) {
        const dimensionKey = getDimensionKey(player.dimension.id);
        const borderConfig = this.config[dimensionKey];

        if (!borderConfig.enabled || !borderConfig.particlesEnabled) return;

        const location = player.location;
        const maxDistance = borderConfig.size;
        const relativeX = location.x - borderConfig.centerX;
        const relativeZ = location.z - borderConfig.centerZ;

        // Calculate distance from each border edge
        const distanceFromEastWest = maxDistance - Math.abs(relativeX);
        const distanceFromNorthSouth = maxDistance - Math.abs(relativeZ);

        // Only show particles if within PARTICLE_RENDER_DISTANCE blocks of border
        const particleDistance = DEFAULTS.PARTICLE_RENDER_DISTANCE;
        let showParticles = false;
        let wallX = null;
        let wallZ = null;

        // Determine which wall to show particles on (closest edge)
        if (distanceFromEastWest <= particleDistance && distanceFromEastWest <= distanceFromNorthSouth) {
            // Show particles on East/West wall
            wallX = borderConfig.centerX + (relativeX > 0 ? maxDistance : -maxDistance);
            showParticles = true;
        } else if (distanceFromNorthSouth <= particleDistance) {
            // Show particles on North/South wall
            wallZ = borderConfig.centerZ + (relativeZ > 0 ? maxDistance : -maxDistance);
            showParticles = true;
        }

        if (!showParticles) {
            this.lastParticlePositions.delete(player.id);
            return;
        }

        // Check if player moved significantly to avoid unnecessary particle updates (PERFORMANCE FIX)
        const lastPos = this.lastParticlePositions.get(player.id);
        const currentPos = { x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z) };

        if (lastPos &&
            Math.abs(lastPos.x - currentPos.x) < DEFAULTS.MIN_PLAYER_MOVEMENT_FOR_PARTICLE_UPDATE &&
            Math.abs(lastPos.y - currentPos.y) < DEFAULTS.MIN_PLAYER_MOVEMENT_FOR_PARTICLE_UPDATE &&
            Math.abs(lastPos.z - currentPos.z) < DEFAULTS.MIN_PLAYER_MOVEMENT_FOR_PARTICLE_UPDATE) {
            return; // Player hasn't moved enough to update particles
        }

        this.lastParticlePositions.set(player.id, currentPos);

        // Get particle type based on user selection
        const particleType = getParticleString(borderConfig.particleType);

        // Dynamic proximity barrier - larger when far, smaller when close
        const playerHeadY = Math.floor(location.y) + 1;

        // Calculate closest distance to border for scaling
        const closestDistance = Math.min(distanceFromEastWest, distanceFromNorthSouth);

        // Scale factor: 1.0 at particleDistance blocks away, 0.3 at 0 blocks away
        const distanceRatio = Math.max(0, Math.min(1, closestDistance / particleDistance));
        const scaleFactor = 0.3 + (distanceRatio * 0.7); // 0.3 to 1.0

        // Dynamic grid size based on distance (PERFORMANCE FIX: reduced from 6 to 4 max)
        const maxGridSize = Math.floor(DEFAULTS.MAX_GRID_SIZE * scaleFactor);
        const spacing = DEFAULTS.PARTICLE_SPACING_MIN + (scaleFactor * (DEFAULTS.PARTICLE_SPACING_MAX - DEFAULTS.PARTICLE_SPACING_MIN));

        try {
            for (let yOffset = -maxGridSize; yOffset <= maxGridSize; yOffset++) {
                for (let otherOffset = -maxGridSize; otherOffset <= maxGridSize; otherOffset++) {
                    let particlePos;

                    if (wallX !== null) {
                        // Vertical wall (East/West boundary)
                        particlePos = {
                            x: wallX,
                            y: playerHeadY + (yOffset * spacing),
                            z: location.z + (otherOffset * spacing)
                        };
                    } else {
                        // Horizontal wall (North/South boundary)
                        particlePos = {
                            x: location.x + (otherOffset * spacing),
                            y: playerHeadY + (yOffset * spacing),
                            z: wallZ
                        };
                    }

                    // Spawn main particle
                    player.spawnParticle(particleType, particlePos);

                    // Add random particles for extra density when far away (PERFORMANCE FIX: reduced from 2 to 1)
                    const extraParticles = Math.floor(scaleFactor * DEFAULTS.MAX_EXTRA_PARTICLES);
                    for (let i = 0; i < extraParticles; i++) {
                        const randomOffset = {
                            x: particlePos.x + (Math.random() - 0.5) * spacing,
                            y: particlePos.y + (Math.random() - 0.5) * spacing,
                            z: particlePos.z + (Math.random() - 0.5) * spacing
                        };
                        player.spawnParticle(particleType, randomOffset);
                    }
                }
            }
        } catch (error) {
            // Silently handle particle spawn failures
        }
    }

    /**
     * Start monitoring player positions (optimized)
     */
    startPlayerMonitoring() {
        // Position check interval (PERFORMANCE FIX: only check players in enabled dimensions)
        system.runInterval(() => {
            for (const player of world.getPlayers()) {
                const dimKey = getDimensionKey(player.dimension.id);
                if (!this.config[dimKey].enabled) continue; // Skip disabled dimensions
                this.checkPlayerPosition(player);
            }
        }, DEFAULTS.WARNING_CHECK_INTERVAL);

        // Particle system runs less frequently for performance (PERFORMANCE FIX: increased from 10 to 20 ticks)
        system.runInterval(() => {
            for (const player of world.getPlayers()) {
                const dimKey = getDimensionKey(player.dimension.id);
                if (!this.config[dimKey].enabled) continue; // Skip disabled dimensions
                this.showBorderParticles(player);
            }
        }, DEFAULTS.PARTICLE_UPDATE_INTERVAL);
    }

    /**
     * Check a player's position against the border
     * @param {Player} player - The player to check
     */
    checkPlayerPosition(player) {
        const location = player.location;
        const dimensionKey = getDimensionKey(player.dimension.id);
        const borderConfig = this.config[dimensionKey];

        if (!borderConfig.enabled) return;

        const maxDistance = borderConfig.size;
        const x = Math.abs(location.x - borderConfig.centerX);
        const z = Math.abs(location.z - borderConfig.centerZ);
        const maxCoord = Math.max(x, z);
        const hasBypass = hasBypassPermission(player);

        if (maxCoord > maxDistance) {
            if (hasBypass) {
                // Show distance beyond border for admins/bypass players
                const distanceBeyond = Math.floor(maxCoord - maxDistance);
                player.onScreenDisplay.setActionBar(MESSAGES.BEYOND_BORDER(distanceBeyond));
            } else {
                // Apply border action for regular players
                if (borderConfig.action === 'knockback') {
                    this.applyKnockbackToPlayer(player, location, borderConfig);
                } else {
                    this.teleportPlayerBack(player, location, maxDistance, borderConfig);
                }
                this.events.emit(BorderEvents.PLAYER_CROSS_BORDER, { player, dimension: dimensionKey });
            }
        } else if (borderConfig.warning && maxCoord > (maxDistance - borderConfig.warnDistance)) {
            const distanceToBarrier = Math.floor(maxDistance - maxCoord);
            player.onScreenDisplay.setActionBar(MESSAGES.APPROACHING_BORDER(distanceToBarrier));
            this.events.emit(BorderEvents.PLAYER_NEAR_BORDER, { player, dimension: dimensionKey, distance: distanceToBarrier });
        }
    }

    /**
     * Apply knockback to a player
     * @param {Player} player - The player to knockback
     * @param {Vector3} currentLocation - The player's current location
     * @param {Object} borderConfig - The border configuration
     */
    applyKnockbackToPlayer(player, currentLocation, borderConfig) {
        const directionX = borderConfig.centerX - currentLocation.x;
        const directionZ = borderConfig.centerZ - currentLocation.z;

        // Normalize the direction vector
        const magnitude = Math.sqrt(directionX * directionX + directionZ * directionZ);
        if (magnitude === 0) {
            // Player is exactly at center but outside border - teleport instead
            this.teleportPlayerBack(player, currentLocation, borderConfig.size, borderConfig);
            return;
        }

        const normalizedX = directionX / magnitude;
        const normalizedZ = directionZ / magnitude;

        const finalDirection = {
            x: normalizedX * DEFAULTS.KNOCKBACK_HORIZONTAL_STRENGTH,
            z: normalizedZ * DEFAULTS.KNOCKBACK_HORIZONTAL_STRENGTH
        };

        try {
            player.applyKnockback(finalDirection, DEFAULTS.KNOCKBACK_VERTICAL_STRENGTH);
            player.onScreenDisplay.setActionBar(MESSAGES.AT_BORDER);

            player.playSound(SOUNDS.KNOCKBACK, { volume: 0.5, pitch: 0.8 });
            this.events.emit(BorderEvents.PLAYER_KNOCKED_BACK, { player, direction: finalDirection });
        } catch (error) {
            console.warn(`Failed to apply knockback to ${player.name}: ${error}`);
        }
    }

    /**
     * Teleport a player back inside the border
     * @param {Player} player - The player to teleport
     * @param {Vector3} currentLocation - The player's current location
     * @param {number} maxDistance - The border size
     * @param {Object} borderConfig - The border configuration
     */
    teleportPlayerBack(player, currentLocation, maxDistance, borderConfig) {
        const x = currentLocation.x;
        const z = currentLocation.z;
        const y = currentLocation.y;
        const relativeX = x - borderConfig.centerX;
        const relativeZ = z - borderConfig.centerZ;

        let newX = x;
        let newZ = z;

        if (Math.abs(relativeX) > maxDistance) {
            newX = borderConfig.centerX + (relativeX > 0 ? maxDistance - 1 : -maxDistance + 1);
        }
        if (Math.abs(relativeZ) > maxDistance) {
            newZ = borderConfig.centerZ + (relativeZ > 0 ? maxDistance - 1 : -maxDistance + 1);
        }

        // Find safe Y level at the teleport location (PERFORMANCE FIX: optimized in utils.js)
        const safeY = findSafeY(player, newX, newZ, y);

        try {
            player.teleport({ x: newX, y: safeY, z: newZ }, {
                dimension: player.dimension,
                facingLocation: { x: borderConfig.centerX, y: safeY, z: borderConfig.centerZ }
            });
            player.onScreenDisplay.setActionBar(MESSAGES.AT_BORDER);

            // Play sound effect
            try {
                player.playSound(SOUNDS.BORDER_HIT, {
                    volume: 0.5,
                    pitch: 0.8
                });
            } catch (soundError) {
                // Sound failed silently
            }

            this.events.emit(BorderEvents.PLAYER_TELEPORTED, { player, from: currentLocation, to: { x: newX, y: safeY, z: newZ } });
        } catch (error) {
            // Silently fail teleport
        }
    }

    /**
     * Show main settings menu to a player
     * @param {Player} player - The player to show the menu to
     */
    showMainMenu(player) {
        // Force close chat with damage command
        player.runCommand('damage @s 0');

        // Fixed: Removed incorrect await (line 542 bug fix)
        system.runTimeout(() => {
            // Get status for each dimension
            const overworldStatus = this.config.overworld.enabled ? `${COLORS.SUCCESS}Enabled` : `${COLORS.ERROR}Disabled`;
            const netherStatus = this.config.nether.enabled ? `${COLORS.SUCCESS}Enabled` : `${COLORS.ERROR}Disabled`;
            const endStatus = this.config.end.enabled ? `${COLORS.SUCCESS}Enabled` : `${COLORS.ERROR}Disabled`;

            const form = new ActionFormData()
                .title(`${COLORS.HIGHLIGHT}World Border Settings`)
                .body('Select a dimension to configure:')
                .button(`${COLORS.WARNING}All Dimensions`, 'textures/ui/World')
                .button(`§2Overworld\n${overworldStatus} ${COLORS.DARK_GRAY}• Size: ${COLORS.INFO}${this.config.overworld.size}`, 'textures/blocks/grass_side_carried')
                .button(`§4The Nether\n${netherStatus} ${COLORS.DARK_GRAY}• Size: ${COLORS.INFO}${this.config.nether.size}`, 'textures/blocks/netherrack')
                .button(`§5The End\n${endStatus} ${COLORS.DARK_GRAY}• Size: ${COLORS.INFO}${this.config.end.size}`, 'textures/blocks/end_stone');

            form.show(player).then(response => {
                if (response.canceled) return;

                const dimensions = ['all', 'overworld', 'nether', 'end'];
                const selectedDimension = dimensions[response.selection];
                this.showDimensionSettings(player, selectedDimension);
            });
        }, 5);
    }

    /**
     * Show dimension-specific settings form
     * @param {Player} player - The player to show the form to
     * @param {string} dimension - Dimension key or 'all'
     */
    async showDimensionSettings(player, dimension) {
        const isAll = dimension === 'all';
        const config = isAll ? this.config.overworld : this.config[dimension];
        const dimensionName = isAll ? 'All Dimensions' : dimension.charAt(0).toUpperCase() + dimension.slice(1);

        try {
            const particleOptions = ['flame', 'redstone', 'portal', 'critical'];
            const particleNames = ['Flame (Orange)', 'Redstone (Red)', 'Portal (Purple)', 'Critical (Yellow)'];
            let particleIndex = particleOptions.indexOf(config.particleType);
            if (particleIndex === -1) particleIndex = 0;

            const actionOptions = ['teleport', 'knockback'];
            const actionNames = ['Teleport', 'Knockback'];
            let actionIndex = actionOptions.indexOf(config.action);
            if (actionIndex === -1) actionIndex = 0;

            const form = new ModalFormData()
                .title(`${dimensionName} Settings`)
                .toggle('Border Enabled', { defaultValue: config.enabled })
                .textField('Border Size', 'Enter size (minimum 100)', { defaultValue: config.size.toString() })
                .dropdown('Border Action', actionNames, { defaultValueIndex: actionIndex })
                .toggle('Warnings Enabled', { defaultValue: config.warning })
                .textField('Warning Distance', 'Enter distance (0-50)', { defaultValue: config.warnDistance.toString() })
                .toggle('Particles Enabled', { defaultValue: config.particlesEnabled })
                .dropdown('Particle Style', particleNames, { defaultValueIndex: particleIndex })
                .textField('Center X Coordinate', 'Enter X center (default: 0)', { defaultValue: config.centerX.toString() })
                .textField('Center Z Coordinate', 'Enter Z center (default: 0)', { defaultValue: config.centerZ.toString() });

            const response = await form.show(player);
            if (response.canceled) return;

            const [enabled, sizeText, actionIndexResult, warningEnabled, warnDistanceText, particlesEnabled, particleStyleIndex, centerXText, centerZText] = response.formValues;

            const size = parseInt(sizeText);
            const warnDistance = parseInt(warnDistanceText);
            const centerX = parseInt(centerXText) || 0;
            const centerZ = parseInt(centerZText) || 0;
            const selectedParticleType = particleOptions[particleStyleIndex] || 'portal';
            const selectedAction = actionOptions[actionIndexResult] || 'teleport';

            // Validate inputs
            if (isNaN(size) || size < DEFAULTS.MIN_BORDER_SIZE) {
                player.sendMessage(MESSAGES.INVALID_FORM_SIZE);
                return;
            }

            if (isNaN(warnDistance) || warnDistance < 0 || warnDistance > DEFAULTS.MAX_WARN_DISTANCE) {
                player.sendMessage(MESSAGES.INVALID_FORM_WARN_DIST);
                return;
            }

            if (warnDistance >= size) {
                player.sendMessage(MESSAGES.FORM_WARN_GREATER_THAN_SIZE(warnDistance, size));
                return;
            }

            // Apply settings
            if (isAll) {
                for (const dim of ['overworld', 'nether', 'end']) {
                    this.config[dim].enabled = enabled;
                    this.config[dim].size = size;
                    this.config[dim].action = selectedAction;
                    this.config[dim].warning = warningEnabled;
                    this.config[dim].warnDistance = warnDistance;
                    this.config[dim].particlesEnabled = particlesEnabled;
                    this.config[dim].particleType = selectedParticleType;
                    this.config[dim].centerX = centerX;
                    this.config[dim].centerZ = centerZ;
                }
            } else {
                this.config[dimension].enabled = enabled;
                this.config[dimension].size = size;
                this.config[dimension].action = selectedAction;
                this.config[dimension].warning = warningEnabled;
                this.config[dimension].warnDistance = warnDistance;
                this.config[dimension].particlesEnabled = particlesEnabled;
                this.config[dimension].particleType = selectedParticleType;
                this.config[dimension].centerX = centerX;
                this.config[dimension].centerZ = centerZ;
            }
            this.saveConfig();

            const statusText = enabled ? `${COLORS.SUCCESS}enabled` : `${COLORS.ERROR}disabled`;
            const warningStatusText = warningEnabled ? `${COLORS.SUCCESS}On` : `${COLORS.ERROR}Off`;
            const particlesStatusText = particlesEnabled ? `${COLORS.SUCCESS}On` : `${COLORS.ERROR}Off`;
            const particleName = particleNames[particleStyleIndex] || 'Unknown';
            const actionName = actionNames[actionIndexResult] || 'Unknown';

            player.sendMessage(`${COLORS.SUCCESS}Settings updated for ${dimensionName}:`);
            player.sendMessage(`${COLORS.WARNING}Border: ${statusText} ${COLORS.NEUTRAL}| Size: ${COLORS.INFO}${size} ${COLORS.NEUTRAL}| Action: ${COLORS.INFO}${actionName} ${COLORS.NEUTRAL}| Center: ${COLORS.INFO}${centerX}, ${centerZ}`);
            player.sendMessage(`${COLORS.WARNING}Warnings: ${warningStatusText} ${COLORS.NEUTRAL}| Distance: ${COLORS.INFO}${warnDistance} ${COLORS.NEUTRAL}| Particles: ${particlesStatusText} (${particleName})`);
        } catch (error) {
            player.sendMessage(MESSAGES.FORM_ERROR);
            console.warn('Form error:', error);
        }
    }

    /**
     * Grant or revoke border bypass for a player
     * @param {Player} admin - The admin executing the command
     * @param {string} playerName - The target player's name
     * @param {boolean} grant - Whether to grant (true) or revoke (false) bypass
     */
    manageBorderBypass(admin, playerName, grant) {
        const sanitizedName = sanitizePlayerName(playerName);
        const target = world.getPlayers().find(p => p.name === sanitizedName);

        if (!target) {
            admin.sendMessage(MESSAGES.PLAYER_NOT_FOUND(sanitizedName));
            return;
        }

        if (grant) {
            target.addTag('border_bypass');
            admin.sendMessage(MESSAGES.BYPASS_GRANTED(target.name));
            target.sendMessage(MESSAGES.BYPASS_GRANTED_SELF);
        } else {
            target.removeTag('border_bypass');
            admin.sendMessage(MESSAGES.BYPASS_REVOKED(target.name));
            target.sendMessage(MESSAGES.BYPASS_REVOKED_SELF);
        }
    }
}
