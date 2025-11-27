/**
 * Main WorldBorderManager class (Simplified - Java-style particles only)
 * @module WorldBorderManager
 */

import { world, system } from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
import {
    CHUNK_SIZE,
    DEFAULTS,
    COLORS,
    MESSAGES,
    DEFAULT_DIMENSION_CONFIG,
    SOUNDS,
    PARTICLE_STYLES
} from './constants.js';
import {
    getDimensionKey,
    validateNumericInput,
    hasBypassPermission,
    isGameDirector,
    findSafeY,
    sanitizePlayerName,
} from './utils.js';
import { BorderEventEmitter, BorderEvents } from './events.js';

/**
 * Manages world border functionality across all dimensions.
 * All border sizes are stored and managed in CHUNKS.
 */
export class WorldBorderManager {
    constructor() {
        this.config = JSON.parse(JSON.stringify(DEFAULT_DIMENSION_CONFIG));
        this.events = new BorderEventEmitter();
        this.init();
    }

    // ==========================================
    // HELPER: Convert chunks to blocks
    // ==========================================
    
    chunksToBlocks(chunks) {
        return chunks * CHUNK_SIZE;
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    init() {
        system.runTimeout(() => {
            this.loadConfig();
            this.startPlayerMonitoring();
            this.registerPlayerCleanup();
            this.registerInteractionPrevention();
        }, DEFAULTS.INIT_DELAY);
    }

    registerPlayerCleanup() {
        world.afterEvents.playerLeave.subscribe((event) => {
            this.events.emit(BorderEvents.PLAYER_CLEANUP, { playerId: event.playerId });
        });
    }

    registerInteractionPrevention() {
        // Prevent block breaking outside border
        world.beforeEvents.playerBreakBlock.subscribe((event) => {
            const player = event.player;
            if (hasBypassPermission(player)) return;

            const dimensionKey = getDimensionKey(player.dimension.id);
            const borderConfig = this.config[dimensionKey];

            if (!borderConfig.enabled || !borderConfig.preventInteraction) return;

            const blockLocation = event.block.location;
            if (this.isLocationOutsideBorder(blockLocation, borderConfig)) {
                event.cancel = true;
                system.run(() => {
                    player.onScreenDisplay.setActionBar(MESSAGES.INTERACTION_PREVENTED);
                });
            }
        });

        // Prevent block placing outside border (using afterEvent workaround)
        world.afterEvents.playerPlaceBlock.subscribe((event) => {
            const player = event.player;
            if (hasBypassPermission(player)) return;

            const dimensionKey = getDimensionKey(player.dimension.id);
            const borderConfig = this.config[dimensionKey];

            if (!borderConfig.enabled || !borderConfig.preventInteraction) return;

            const blockLocation = event.block.location;
            if (this.isLocationOutsideBorder(blockLocation, borderConfig)) {
                try {
                    // Get the block that was placed
                    const placedBlock = event.block;
                    const blockPermutation = placedBlock.permutation;

                    // Replace with air
                    placedBlock.setType('minecraft:air');

                    // Give the block back to the player
                    const itemStack = blockPermutation.getItemStack(1);
                    if (itemStack) {
                        player.dimension.spawnItem(itemStack, player.location);
                    }

                    // Defer message to next tick when privileges are restored
                    system.run(() => {
                        player.onScreenDisplay.setActionBar(MESSAGES.INTERACTION_PREVENTED);
                    });
                } catch (error) {
                    console.warn('Failed to prevent block placement:', error);
                }
            }
        });

        // Prevent block interaction outside border
        world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
            const player = event.player;
            if (hasBypassPermission(player)) return;

            const dimensionKey = getDimensionKey(player.dimension.id);
            const borderConfig = this.config[dimensionKey];

            if (!borderConfig.enabled || !borderConfig.preventInteraction) return;

            const blockLocation = event.block.location;
            if (this.isLocationOutsideBorder(blockLocation, borderConfig)) {
                event.cancel = true;
                system.run(() => {
                    player.onScreenDisplay.setActionBar(MESSAGES.INTERACTION_PREVENTED);
                });
            }
        });
    }

    /**
     * Check if a location is outside the border
     * @param {Object} location - Location to check (with x, z properties)
     * @param {Object} borderConfig - Border configuration
     * @returns {boolean} - True if outside border
     */
    isLocationOutsideBorder(location, borderConfig) {
        const x = Math.abs(location.x - borderConfig.centerX);
        const z = Math.abs(location.z - borderConfig.centerZ);
        const maxCoord = Math.max(x, z);
        const maxDistance = this.chunksToBlocks(borderConfig.sizeChunks);
        return maxCoord > maxDistance;
    }

    // ==========================================
    // CONFIG MANAGEMENT
    // ==========================================

    loadConfig() {
        try {
            const savedConfig = world.getDynamicProperty('worldBorderConfig');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                for (const dim in this.config) {
                    if (parsedConfig[dim]) {
                        this.config[dim] = { ...this.config[dim], ...parsedConfig[dim] };
                        
                        // Migration: convert old 'size' (blocks) to 'sizeChunks'
                        if (parsedConfig[dim].size && !parsedConfig[dim].sizeChunks) {
                            this.config[dim].sizeChunks = Math.ceil(parsedConfig[dim].size / CHUNK_SIZE);
                            delete this.config[dim].size;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load world border config, using defaults');
        }
    }

    saveConfig() {
        try {
            world.setDynamicProperty('worldBorderConfig', JSON.stringify(this.config));
            this.events.emit(BorderEvents.CONFIG_CHANGED, { config: this.config });
        } catch (error) {
            console.warn('Failed to save world border config');
        }
    }

    // ==========================================
    // COMMANDS: HELP & STATUS
    // ==========================================

    showHelp(player) {
        const isAdmin = isGameDirector(player);
        player.sendMessage(`${COLORS.HIGHLIGHT}=== World Border Commands ===`);
        player.sendMessage(`${COLORS.WARNING}/worldborder:help ${COLORS.NEUTRAL}- Show this help message`);
        player.sendMessage(`${COLORS.WARNING}/worldborder:status ${COLORS.NEUTRAL}- Show current border status`);

        if (isAdmin) {
            player.sendMessage(`${COLORS.WARNING}/worldborder:menu ${COLORS.NEUTRAL}- Open settings GUI`);
            player.sendMessage(`${COLORS.WARNING}/worldborder:allow <player> <on|off> ${COLORS.NEUTRAL}- Grant/revoke bypass`);
            player.sendMessage(`${COLORS.WARNING}/worldborder:size <dimension> <chunks> ${COLORS.NEUTRAL}- Set border size`);
            player.sendMessage(`${COLORS.WARNING}/worldborder:toggle <dimension> ${COLORS.NEUTRAL}- Toggle border on/off`);
            player.sendMessage(`${COLORS.WARNING}/worldborder:warning <dimension> <on|off> ${COLORS.NEUTRAL}- Toggle warnings`);
            player.sendMessage(`${COLORS.WARNING}/worldborder:warndistance <dimension> <blocks> ${COLORS.NEUTRAL}- Set warning distance`);
            player.sendMessage(`${COLORS.WARNING}/worldborder:center <dimension> <x> <z> ${COLORS.NEUTRAL}- Set center`);
        } else {
            player.sendMessage(`${COLORS.NEUTRAL}Additional commands available for GameDirector+`);
        }
    }

    showStatus(player) {
        player.sendMessage(`${COLORS.HIGHLIGHT}=== World Border Status ===`);

        for (const [dim, config] of Object.entries(this.config)) {
            const statusColor = config.enabled ? COLORS.SUCCESS : COLORS.ERROR;
            const statusText = config.enabled ? 'Enabled' : 'Disabled';
            const actionText = config.action === 'knockback' ? 'Knockback' : 'Teleport';
            const sizeBlocks = this.chunksToBlocks(config.sizeChunks);
            
            const warningText = config.warning 
                ? `${COLORS.SUCCESS}On ${COLORS.NEUTRAL}(${config.warnDistance} blocks)` 
                : `${COLORS.ERROR}Off`;

            player.sendMessage(`${COLORS.WARNING}${dim.charAt(0).toUpperCase() + dim.slice(1)}: ${statusColor}${statusText} ${COLORS.NEUTRAL}| Size: ${COLORS.INFO}${config.sizeChunks} chunks ${COLORS.NEUTRAL}(${sizeBlocks} blocks)`);
            player.sendMessage(`  ${COLORS.NEUTRAL}Center: ${COLORS.INFO}${config.centerX}, ${config.centerZ} ${COLORS.NEUTRAL}| Action: ${COLORS.INFO}${actionText} ${COLORS.NEUTRAL}| Warnings: ${warningText}`);
        }
    }

    // ==========================================
    // COMMANDS: SIZE
    // ==========================================

    setSize(player, dimension, sizeChunks) {
        const validation = validateNumericInput(sizeChunks, DEFAULTS.MIN_BORDER_SIZE_CHUNKS, Infinity, 'Size');
        if (!validation.valid) {
            player.sendMessage(`${COLORS.ERROR}${validation.error}`);
            return;
        }
        sizeChunks = validation.value;

        const sizeBlocks = this.chunksToBlocks(sizeChunks);

        // Only check warn distance if warnings are enabled
        const dimensionsToCheck = dimension === 'all' ? ['overworld', 'nether', 'end'] : [dimension];
        for (const dim of dimensionsToCheck) {
            if (!this.config[dim]) continue;
            if (this.config[dim].warning && this.config[dim].warnDistance >= sizeBlocks) {
                player.sendMessage(MESSAGES.SIZE_LESS_THAN_WARN(sizeBlocks, this.config[dim].warnDistance));
                return;
            }
        }

        if (dimension === 'all') {
            for (const dim of ['overworld', 'nether', 'end']) {
                this.config[dim].sizeChunks = sizeChunks;
            }
            player.sendMessage(MESSAGES.SIZE_SET_ALL(sizeChunks));
        } else if (this.config[dimension]) {
            this.config[dimension].sizeChunks = sizeChunks;
            player.sendMessage(MESSAGES.SIZE_SET_DIM(sizeChunks, dimension));
        } else {
            player.sendMessage(MESSAGES.INVALID_DIMENSION);
            return;
        }

        this.saveConfig();
    }

    // ==========================================
    // COMMANDS: TOGGLE, PARTICLES, WARNING, CENTER
    // ==========================================

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

    setParticles(player, dimension, enabled) {
        if (dimension === 'all') {
            for (const dim of ['overworld', 'nether', 'end']) {
                this.config[dim].particlesEnabled = enabled;
            }
            player.sendMessage(enabled ? MESSAGES.PARTICLES_ENABLED_ALL : MESSAGES.PARTICLES_DISABLED_ALL);
        } else if (this.config[dimension]) {
            this.config[dimension].particlesEnabled = enabled;
            player.sendMessage(enabled ? MESSAGES.PARTICLES_ENABLED_DIM(dimension) : MESSAGES.PARTICLES_DISABLED_DIM(dimension));
        } else {
            player.sendMessage(MESSAGES.INVALID_DIMENSION);
            return;
        }
        this.saveConfig();
    }

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

    setWarnDistance(player, distance, dimension = 'all') {
        const validation = validateNumericInput(distance, 0, DEFAULTS.MAX_WARN_DISTANCE, 'Warning distance');
        if (!validation.valid) {
            player.sendMessage(`${COLORS.ERROR}${validation.error}`);
            return;
        }
        distance = validation.value;

        // Only validate against border size if warnings are enabled
        const dimensionsToCheck = dimension === 'all' ? ['overworld', 'nether', 'end'] : [dimension];
        for (const dim of dimensionsToCheck) {
            if (!this.config[dim]) continue;
            const sizeBlocks = this.chunksToBlocks(this.config[dim].sizeChunks);
            if (this.config[dim].warning && distance >= sizeBlocks) {
                player.sendMessage(MESSAGES.WARN_DIST_GREATER_THAN_SIZE(distance, dim, sizeBlocks));
                return;
            }
        }

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

    // ==========================================
    // COMMANDS: BYPASS
    // ==========================================

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

    // ==========================================
    // PLAYER MONITORING
    // ==========================================

    startPlayerMonitoring() {
        // Position enforcement
        system.runInterval(() => {
            for (const player of world.getPlayers()) {
                const dimKey = getDimensionKey(player.dimension.id);
                if (!this.config[dimKey].enabled) continue;
                this.checkPlayerPosition(player);
            }
        }, DEFAULTS.WARNING_CHECK_INTERVAL);

        // Wall particle rendering
        system.runInterval(() => {
            for (const player of world.getPlayers()) {
                const dimKey = getDimensionKey(player.dimension.id);
                const config = this.config[dimKey];
                
                if (!config.enabled || !config.particlesEnabled) continue;
                this.showWallParticles(player);
            }
        }, DEFAULTS.PARTICLE_SPAWN_INTERVAL);
    }

    // ==========================================
    // POSITION CHECKING
    // ==========================================

    checkPlayerPosition(player) {
        const location = player.location;
        const dimensionKey = getDimensionKey(player.dimension.id);
        const borderConfig = this.config[dimensionKey];

        if (!borderConfig.enabled) return;

        const maxDistance = this.chunksToBlocks(borderConfig.sizeChunks);
        const x = Math.abs(location.x - borderConfig.centerX);
        const z = Math.abs(location.z - borderConfig.centerZ);
        const maxCoord = Math.max(x, z);
        const hasBypass = hasBypassPermission(player);

        if (maxCoord > maxDistance) {
            if (hasBypass) {
                const distanceBeyond = Math.floor(maxCoord - maxDistance);
                player.onScreenDisplay.setActionBar(MESSAGES.BEYOND_BORDER(distanceBeyond));
            } else {
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

    // ==========================================
    // BORDER ENFORCEMENT
    // ==========================================

    applyKnockbackToPlayer(player, currentLocation, borderConfig) {
        const directionX = borderConfig.centerX - currentLocation.x;
        const directionZ = borderConfig.centerZ - currentLocation.z;

        const magnitude = Math.sqrt(directionX * directionX + directionZ * directionZ);
        if (magnitude === 0) {
            const maxDistance = this.chunksToBlocks(borderConfig.sizeChunks);
            this.teleportPlayerBack(player, currentLocation, maxDistance, borderConfig);
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

        const safeY = findSafeY(player, newX, newZ, y);

        try {
            player.teleport({ x: newX, y: safeY, z: newZ }, {
                dimension: player.dimension
            });
            player.onScreenDisplay.setActionBar(MESSAGES.AT_BORDER);
            player.playSound(SOUNDS.BORDER_HIT, { volume: 0.5, pitch: 0.8 });
            this.events.emit(BorderEvents.PLAYER_TELEPORTED, { player, from: currentLocation, to: { x: newX, y: safeY, z: newZ } });
        } catch (error) {
            // Silently fail
        }
    }

    // ==========================================
    // WALL PARTICLES (chunk-aligned)
    // ==========================================

    showWallParticles(player) {
        const dimensionKey = getDimensionKey(player.dimension.id);
        const borderConfig = this.config[dimensionKey];

        if (!borderConfig.enabled || !borderConfig.particlesEnabled) {
            return;
        }

        const playerX = player.location.x;
        const playerZ = player.location.z;
        const centerX = borderConfig.centerX;
        const centerZ = borderConfig.centerZ;
        
        const sizeBlocks = this.chunksToBlocks(borderConfig.sizeChunks);
        const visibilityDistance = DEFAULTS.WALL_VISIBILITY_CHUNKS * CHUNK_SIZE;
        const segmentRadius = DEFAULTS.WALL_SEGMENT_CHUNKS * CHUNK_SIZE;

        // Build particle IDs based on selected style
        const particleStyle = borderConfig.particleStyle || 'default';
        const particleIdNS = particleStyle === 'default'
            ? 'worldborder:worldborder'
            : `worldborder:worldborder_${particleStyle}`;
        const particleIdEW = particleStyle === 'default'
            ? 'worldborder:worldborder_ew'
            : `worldborder:worldborder_${particleStyle}_ew`;

        // Wall positions
        const eastWallX = centerX + sizeBlocks;
        const westWallX = centerX - sizeBlocks;
        const southWallZ = centerZ + sizeBlocks;
        const northWallZ = centerZ - sizeBlocks;

        // Absolute distance to each wall (works from both sides)
        const distToEast = Math.abs(eastWallX - playerX);
        const distToWest = Math.abs(playerX - westWallX);
        const distToSouth = Math.abs(southWallZ - playerZ);
        const distToNorth = Math.abs(playerZ - northWallZ);

        // Player's chunk position
        const playerChunkX = Math.floor(playerX / CHUNK_SIZE) * CHUNK_SIZE;
        const playerChunkZ = Math.floor(playerZ / CHUNK_SIZE) * CHUNK_SIZE;

        // East wall
        if (distToEast <= visibilityDistance) {
            this.spawnWallChunks(player, eastWallX, playerChunkZ, northWallZ, southWallZ, segmentRadius, 'z', particleIdNS);
        }

        // West wall
        if (distToWest <= visibilityDistance) {
            this.spawnWallChunks(player, westWallX, playerChunkZ, northWallZ, southWallZ, segmentRadius, 'z', particleIdNS);
        }

        // South wall
        if (distToSouth <= visibilityDistance) {
            this.spawnWallChunks(player, southWallZ, playerChunkX, westWallX, eastWallX, segmentRadius, 'x', particleIdEW);
        }

        // North wall
        if (distToNorth <= visibilityDistance) {
            this.spawnWallChunks(player, northWallZ, playerChunkX, westWallX, eastWallX, segmentRadius, 'x', particleIdEW);
        }
    }

    /**
     * Spawn chunk-aligned particles along a wall segment.
     */
    spawnWallChunks(player, wallPos, playerChunkCoord, wallMin, wallMax, segmentRadius, axis, particleId) {
        const minChunk = Math.max(
            Math.floor(wallMin / CHUNK_SIZE) * CHUNK_SIZE,
            playerChunkCoord - segmentRadius
        );
        const maxChunk = Math.min(
            Math.floor(wallMax / CHUNK_SIZE) * CHUNK_SIZE,
            playerChunkCoord + segmentRadius
        );

        for (let chunk = minChunk; chunk <= maxChunk; chunk += CHUNK_SIZE) {
            const spawnCoord = chunk + (CHUNK_SIZE / 2);
            
            if (spawnCoord < wallMin || spawnCoord > wallMax) continue;

            const spawnPos = axis === 'z'
                ? { x: wallPos, y: DEFAULTS.PARTICLE_SPAWN_Y, z: spawnCoord }
                : { x: spawnCoord, y: DEFAULTS.PARTICLE_SPAWN_Y, z: wallPos };

            try {
                player.spawnParticle(particleId, spawnPos);
            } catch (e) {
                // Chunk not loaded
            }
        }
    }

    // ==========================================
    // GUI MENUS
    // ==========================================

    showMainMenu(player) {
        player.runCommand('damage @s 0');

        system.runTimeout(() => {
            const overworldStatus = this.config.overworld.enabled ? `${COLORS.SUCCESS}Enabled` : `${COLORS.ERROR}Disabled`;
            const netherStatus = this.config.nether.enabled ? `${COLORS.SUCCESS}Enabled` : `${COLORS.ERROR}Disabled`;
            const endStatus = this.config.end.enabled ? `${COLORS.SUCCESS}Enabled` : `${COLORS.ERROR}Disabled`;

            const form = new ActionFormData()
                .title(`${COLORS.HIGHLIGHT}World Border Settings`)
                .body('Select a dimension to configure:')
                .button(`${COLORS.WARNING}All Dimensions`, 'textures/all')
                .button(`§2Overworld\n${overworldStatus} ${COLORS.DARK_GRAY}• ${COLORS.INFO}${this.config.overworld.sizeChunks} chunks`, 'textures/overworld')
                .button(`§4The Nether\n${netherStatus} ${COLORS.DARK_GRAY}• ${COLORS.INFO}${this.config.nether.sizeChunks} chunks`, 'textures/nether')
                .button(`§5The End\n${endStatus} ${COLORS.DARK_GRAY}• ${COLORS.INFO}${this.config.end.sizeChunks} chunks`, 'textures/end');

            form.show(player).then(response => {
                if (response.canceled) return;
                const dimensions = ['all', 'overworld', 'nether', 'end'];
                this.showDimensionSettings(player, dimensions[response.selection]);
            });
        }, 5);
    }

    async showDimensionSettings(player, dimension) {
        const isAll = dimension === 'all';
        const config = isAll ? this.config.overworld : this.config[dimension];
        const dimensionName = isAll ? 'All Dimensions' : dimension.charAt(0).toUpperCase() + dimension.slice(1);

        try {
            const actionOptions = ['teleport', 'knockback'];
            const actionNames = ['Teleport', 'Knockback'];
            let actionIndex = actionOptions.indexOf(config.action);
            if (actionIndex === -1) actionIndex = 0;

            let particleStyleIndex = PARTICLE_STYLES.OPTIONS.indexOf(config.particleStyle);
            if (particleStyleIndex === -1) particleStyleIndex = 0;

            const form = new ModalFormData()
                .title(`${dimensionName} Settings`)
                .toggle('Border Enabled', { defaultValue: config.enabled })
                .textField('Border Size (chunks)', `Min ${DEFAULTS.MIN_BORDER_SIZE_CHUNKS}`, { defaultValue: config.sizeChunks.toString() })
                .dropdown('Border Action', actionNames, { defaultValueIndex: actionIndex })
                .toggle('Warnings Enabled', { defaultValue: config.warning })
                .textField('Warning Distance (blocks)', `0-${DEFAULTS.MAX_WARN_DISTANCE}`, { defaultValue: config.warnDistance.toString() })
                .textField('Center X', 'X coordinate', { defaultValue: config.centerX.toString() })
                .textField('Center Z', 'Z coordinate', { defaultValue: config.centerZ.toString() })
                .toggle('Prevent Interaction Outside Border', { defaultValue: config.preventInteraction ?? false })
                .dropdown('Particle Style', PARTICLE_STYLES.NAMES, { defaultValueIndex: particleStyleIndex });

            const response = await form.show(player);
            if (response.canceled) return;

            const [enabled, sizeText, actionIdx, warningEnabled, warnDistText, centerXText, centerZText, preventInteraction, particleStyleIdx] = response.formValues;

            const sizeChunks = parseInt(sizeText);
            const warnDistance = parseInt(warnDistText);
            const centerX = parseInt(centerXText) || 0;
            const centerZ = parseInt(centerZText) || 0;
            const sizeBlocks = sizeChunks * CHUNK_SIZE;

            // Validation
            if (isNaN(sizeChunks) || sizeChunks < DEFAULTS.MIN_BORDER_SIZE_CHUNKS) {
                player.sendMessage(MESSAGES.INVALID_FORM_SIZE);
                return;
            }

            if (isNaN(warnDistance) || warnDistance < 0 || warnDistance > DEFAULTS.MAX_WARN_DISTANCE) {
                player.sendMessage(MESSAGES.INVALID_FORM_WARN_DIST);
                return;
            }

            // Only validate warn distance against size if warnings are enabled
            if (warningEnabled && warnDistance >= sizeBlocks) {
                player.sendMessage(MESSAGES.FORM_WARN_GREATER_THAN_SIZE(warnDistance, sizeBlocks));
                return;
            }

            // Apply settings
            const applyTo = isAll ? ['overworld', 'nether', 'end'] : [dimension];
            const selectedParticleStyle = PARTICLE_STYLES.OPTIONS[particleStyleIdx];
            for (const dim of applyTo) {
                this.config[dim].enabled = enabled;
                this.config[dim].sizeChunks = sizeChunks;
                this.config[dim].action = actionOptions[actionIdx];
                this.config[dim].warning = warningEnabled;
                this.config[dim].warnDistance = warnDistance;
                this.config[dim].centerX = centerX;
                this.config[dim].centerZ = centerZ;
                this.config[dim].preventInteraction = preventInteraction;
                this.config[dim].particleStyle = selectedParticleStyle;
            }
            this.saveConfig();

            const statusText = enabled ? `${COLORS.SUCCESS}enabled` : `${COLORS.ERROR}disabled`;
            const warningText = warningEnabled ? `${COLORS.SUCCESS}On ${COLORS.NEUTRAL}(${warnDistance} blocks)` : `${COLORS.ERROR}Off`;
            const interactionText = preventInteraction ? `${COLORS.SUCCESS}On` : `${COLORS.ERROR}Off`;
            player.sendMessage(`${COLORS.SUCCESS}Settings updated for ${dimensionName}:`);
            player.sendMessage(`${COLORS.WARNING}Border: ${statusText} ${COLORS.NEUTRAL}| Size: ${COLORS.INFO}${sizeChunks} chunks ${COLORS.NEUTRAL}(${sizeBlocks} blocks)`);
            player.sendMessage(`${COLORS.WARNING}Center: ${COLORS.INFO}${centerX}, ${centerZ} ${COLORS.NEUTRAL}| Action: ${COLORS.INFO}${actionNames[actionIdx]} ${COLORS.NEUTRAL}| Warnings: ${warningText}`);
            player.sendMessage(`${COLORS.WARNING}Prevent Interaction: ${interactionText} ${COLORS.NEUTRAL}| Particle Style: ${COLORS.INFO}${PARTICLE_STYLES.NAMES[particleStyleIdx]}`);
        } catch (error) {
            player.sendMessage(MESSAGES.FORM_ERROR);
            console.warn('Form error:', error);
        }
    }
}