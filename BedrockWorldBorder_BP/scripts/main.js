import { 
    world, 
    system,
    CommandPermissionLevel,
    CustomCommandParamType
} from '@minecraft/server';

class WorldBorderManager {
    constructor() {
        this.config = {
            overworld: { enabled: false, size: 1000, warning: true, warnDistance: 50 },
            nether: { enabled: false, size: 1000, warning: true, warnDistance: 50 },
            end: { enabled: false, size: 1000, warning: true, warnDistance: 50 }
        };
        this.globalWarning = true;
        this.globalWarnDistance = 50;
        this.playerWarnings = new Map();
        this.init();
    }

    init() {
        // Delay initialization to ensure world is ready
        system.runTimeout(() => {
            this.loadConfig();
            this.startPlayerMonitoring();
        }, 20);
    }

    loadConfig() {
        try {
            const savedConfig = world.getDynamicProperty('worldBorderConfig');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsedConfig };
            }
            
            const globalWarning = world.getDynamicProperty('worldBorderGlobalWarning');
            if (globalWarning !== undefined) {
                this.globalWarning = globalWarning;
            }
            
            const globalWarnDistance = world.getDynamicProperty('worldBorderGlobalWarnDistance');
            if (globalWarnDistance !== undefined) {
                this.globalWarnDistance = globalWarnDistance;
            }
        } catch (error) {
            console.warn('Failed to load world border config, using defaults');
        }
    }

    saveConfig() {
        try {
            world.setDynamicProperty('worldBorderConfig', JSON.stringify(this.config));
            world.setDynamicProperty('worldBorderGlobalWarning', this.globalWarning);
            world.setDynamicProperty('worldBorderGlobalWarnDistance', this.globalWarnDistance);
        } catch (error) {
            console.warn('Failed to save world border config');
        }
    }

    getDimensionKey(dimensionId) {
        if (dimensionId.includes('nether')) return 'nether';
        if (dimensionId.includes('end')) return 'end';
        return 'overworld';
    }

    hasGameDirectorPermission(player) {
        return player.playerPermissionLevel >= 2; // GameDirector level or higher
    }

    showHelp(player) {
        const isGameDirector = this.hasGameDirectorPermission(player);
        player.sendMessage('§6=== World Border Commands ===');
        player.sendMessage('§e/worldborder:help §7- Show this help message');
        player.sendMessage('§e/worldborder:status §7- Show current border status');
        
        if (isGameDirector) {
            player.sendMessage('§e/worldborder:size <all|overworld|nether|end> <size> §7- Set border size');
            player.sendMessage('§e/worldborder:toggle <all|overworld|nether|end> §7- Toggle border on/off');
            player.sendMessage('§e/worldborder:warning <on|off> §7- Toggle warning messages');
            player.sendMessage('§e/worldborder:warndistance <distance> §7- Set warning distance');
        } else {
            player.sendMessage('§7Additional commands available for GameDirector+ permission level');
        }
    }

    showStatus(player) {
        player.sendMessage('§6=== World Border Status ===');
        
        for (const [dim, config] of Object.entries(this.config)) {
            const statusColor = config.enabled ? '§a' : '§c';
            const statusText = config.enabled ? 'Enabled' : 'Disabled';
            const sizeColor = '§b';
            
            player.sendMessage(`§e${dim.charAt(0).toUpperCase() + dim.slice(1)}: ${statusColor}${statusText} §7| Size: ${sizeColor}${config.size}`);
        }
        
        const warningStatus = this.globalWarning ? '§aOn' : '§cOff';
        player.sendMessage(`§eWarnings: ${warningStatus} §7| Distance: §b${this.globalWarnDistance}`);
    }

    setSize(player, dimension, size) {
        if (isNaN(size) || size < 1) {
            player.sendMessage('§cSize must be a positive number.');
            return;
        }

        if (size < 100) {
            player.sendMessage('§cWorld border size must be at least 100 blocks.');
            return;
        }

        // Check if border size would be smaller than warn distance
        if (this.globalWarnDistance >= size) {
            player.sendMessage(`§cBorder size (${size}) must be greater than warning distance (${this.globalWarnDistance}).`);
            return;
        }

        if (dimension === 'all') {
            for (const dim of ['overworld', 'nether', 'end']) {
                this.config[dim].size = size;
            }
            player.sendMessage(`§aSet world border size to §b${size} §afor all dimensions.`);
        } else if (this.config[dimension]) {
            this.config[dimension].size = size;
            player.sendMessage(`§aSet world border size to §b${size} §afor ${dimension}.`);
        } else {
            player.sendMessage('§cInvalid dimension. Use: all, overworld, nether, or end.');
            return;
        }

        this.saveConfig();
    }

    toggleBorder(player, dimension) {
        if (dimension === 'all') {
            const newState = !this.config.overworld.enabled;
            for (const dim of ['overworld', 'nether', 'end']) {
                this.config[dim].enabled = newState;
            }
            const statusText = newState ? '§aenabled' : '§cdisabled';
            player.sendMessage(`§aWorld border ${statusText} §afor all dimensions.`);
        } else if (this.config[dimension]) {
            this.config[dimension].enabled = !this.config[dimension].enabled;
            const statusText = this.config[dimension].enabled ? '§aenabled' : '§cdisabled';
            player.sendMessage(`§aWorld border ${statusText} §afor ${dimension}.`);
        } else {
            player.sendMessage('§cInvalid dimension. Use: all, overworld, nether, or end.');
            return;
        }

        this.saveConfig();
    }

    setWarning(player, enabled) {
        this.globalWarning = enabled;
        const statusText = enabled ? '§aenabled' : '§cdisabled';
        player.sendMessage(`§aWorld border warnings ${statusText}.`);
        this.saveConfig();
    }

    setWarnDistance(player, distance) {
        if (isNaN(distance) || distance < 0) {
            player.sendMessage('§cWarning distance must be a non-negative number.');
            return;
        }

        if (distance > 50) {
            player.sendMessage('§cWarning distance cannot be greater than 50 blocks.');
            return;
        }

        // Check if warn distance is greater than any active border size
        const activeBorders = Object.entries(this.config).filter(([_, config]) => config.enabled);
        for (const [dim, config] of activeBorders) {
            if (distance >= config.size) {
                player.sendMessage(`§cWarning distance (${distance}) must be less than ${dim} border size (${config.size}).`);
                return;
            }
        }

        this.globalWarnDistance = distance;
        player.sendMessage(`§aSet warning distance to §b${distance} §ablocks.`);
        this.saveConfig();
    }

    startPlayerMonitoring() {
        system.runInterval(() => {
            for (const player of world.getPlayers()) {
                this.checkPlayerPosition(player);
            }
        }, 10);
    }

    checkPlayerPosition(player) {
        const location = player.location;
        const dimensionKey = this.getDimensionKey(player.dimension.id);
        const borderConfig = this.config[dimensionKey];

        if (!borderConfig.enabled) return;

        const maxDistance = borderConfig.size;
        const x = Math.abs(location.x);
        const z = Math.abs(location.z);
        const maxCoord = Math.max(x, z);
        const isGameDirector = this.hasGameDirectorPermission(player);

        if (maxCoord > maxDistance) {
            if (isGameDirector) {
                const distanceBeyond = Math.floor(maxCoord - maxDistance);
                player.onScreenDisplay.setActionBar(`§cBeyond border: §b${distanceBeyond} §cblocks`);
            } else {
                this.teleportPlayerBack(player, location, maxDistance);
            }
        } else if (this.globalWarning && maxCoord > (maxDistance - this.globalWarnDistance)) {
            const distanceToBarrier = Math.floor(maxDistance - maxCoord);
            player.onScreenDisplay.setActionBar(`§eApproaching world border: §c${distanceToBarrier} §eblocks remaining`);
        }
    }

    teleportPlayerBack(player, currentLocation, maxDistance) {
        const x = currentLocation.x;
        const z = currentLocation.z;
        const y = currentLocation.y;

        let newX = x;
        let newZ = z;

        if (Math.abs(x) > maxDistance) {
            newX = x > 0 ? maxDistance - 1 : -maxDistance + 1;
        }
        if (Math.abs(z) > maxDistance) {
            newZ = z > 0 ? maxDistance - 1 : -maxDistance + 1;
        }

        // Find safe Y level at the teleport location
        const safeY = this.findSafeY(player, newX, newZ, y);

        try {
            player.teleport({ x: newX, y: safeY, z: newZ }, { 
                dimension: player.dimension,
                facingLocation: { x: 0, y: safeY, z: 0 }
            });
            player.onScreenDisplay.setActionBar('§cYou have reached the world border!');
            
            // Play sound effect
            try {
                player.playSound('random.orb', {
                    volume: 0.5,
                    pitch: 0.8
                });
            } catch (soundError) {
                // Sound failed silently
            }
        } catch (error) {
            // Silently fail teleport
        }
    }

    findSafeY(player, x, z, currentY) {
        try {
            const dimension = player.dimension;
            const startY = Math.floor(currentY);
            
            // First, try the current Y level - if it's air or we can't check it (void/sky), stay there!
            try {
                const block = dimension.getBlock({ x: Math.floor(x), y: startY, z: Math.floor(z) });
                const blockAbove = dimension.getBlock({ x: Math.floor(x), y: startY + 1, z: Math.floor(z) });
                
                if (block && blockAbove && 
                    block.typeId === 'minecraft:air' && 
                    blockAbove.typeId === 'minecraft:air') {
                    return startY; // Stay at current Y if it's safe
                }
            } catch (blockError) {
                // Block checking failed (probably void/sky) - assume it's safe, stay at current Y
                return currentY;
            }
            
            // If current Y isn't safe, search upward
            for (let y = startY + 1; y <= Math.min(startY + 10, 320); y++) {
                try {
                    const block = dimension.getBlock({ x: Math.floor(x), y: y, z: Math.floor(z) });
                    const blockAbove = dimension.getBlock({ x: Math.floor(x), y: y + 1, z: Math.floor(z) });
                    
                    if (block && blockAbove && 
                        block.typeId === 'minecraft:air' && 
                        blockAbove.typeId === 'minecraft:air') {
                        return y;
                    }
                } catch (blockError) {
                    continue;
                }
            }
            
            // If no safe spot found going up, try going down
            for (let y = startY - 1; y >= Math.max(startY - 10, -64); y--) {
                try {
                    const block = dimension.getBlock({ x: Math.floor(x), y: y, z: Math.floor(z) });
                    const blockAbove = dimension.getBlock({ x: Math.floor(x), y: y + 1, z: Math.floor(z) });
                    
                    if (block && blockAbove && 
                        block.typeId === 'minecraft:air' && 
                        blockAbove.typeId === 'minecraft:air') {
                        return y;
                    }
                } catch (blockError) {
                    continue;
                }
            }
            
            // Fallback: if all block checking fails, return current Y (assume it's safe)
            return currentY;
            
        } catch (error) {
            // If everything fails, return the original Y level
            return currentY;
        }
    }
}

// Initialize the world border manager
const worldBorderManager = new WorldBorderManager();

// Register custom commands using proper startup event
system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    // Register enums for command parameters
    customCommandRegistry.registerEnum("worldborder:dimension", ["all", "overworld", "nether", "end"]);
    customCommandRegistry.registerEnum("worldborder:onoff", ["on", "off"]);

    // Register help command
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:help",
            description: "Shows available world border commands",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            mandatoryParameters: []
        },
        (origin) => {
            if (!origin.sourceEntity) return;
            system.run(() => {
                worldBorderManager.showHelp(origin.sourceEntity);
            });
        }
    );

    // Register status command
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:status",
            description: "Shows current world border status",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            mandatoryParameters: []
        },
        (origin) => {
            if (!origin.sourceEntity) return;
            system.run(() => {
                worldBorderManager.showStatus(origin.sourceEntity);
            });
        }
    );

    // Register size command
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:size",
            description: "Sets the world border size for specified dimension",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                {
                    name: "worldborder:dimension",
                    type: CustomCommandParamType.Enum,
                },
                {
                    name: "size",
                    type: CustomCommandParamType.Integer,
                }
            ]
        },
        (origin, dimension, size) => {
            if (!origin.sourceEntity) return;
            system.run(() => {
                worldBorderManager.setSize(origin.sourceEntity, dimension, size);
            });
        }
    );

    // Register toggle command
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:toggle",
            description: "Toggles world border on/off for specified dimension",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                {
                    name: "worldborder:dimension",
                    type: CustomCommandParamType.Enum,
                }
            ]
        },
        (origin, dimension) => {
            if (!origin.sourceEntity) return;
            system.run(() => {
                worldBorderManager.toggleBorder(origin.sourceEntity, dimension);
            });
        }
    );

    // Register warning command
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:warning",
            description: "Turns warning messages on or off",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                {
                    name: "worldborder:onoff",
                    type: CustomCommandParamType.Enum,
                }
            ]
        },
        (origin, setting) => {
            if (!origin.sourceEntity) return;
            system.run(() => {
                worldBorderManager.setWarning(origin.sourceEntity, setting === 'on');
            });
        }
    );

    // Register warndistance command
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:warndistance",
            description: "Sets the distance for border warnings",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                {
                    name: "distance",
                    type: CustomCommandParamType.Integer,
                }
            ]
        },
        (origin, distance) => {
            if (!origin.sourceEntity) return;
            system.run(() => {
                worldBorderManager.setWarnDistance(origin.sourceEntity, distance);
            });
        }
    );

    // Commands registered successfully
});

// Persistence is handled in the constructor with delayed loading


// Initialization complete
system.run(() => {
    system.runTimeout(() => {
        console.log('BedrockWorldBorder v2.0 by Rob \'myGen\' Hall - Loaded successfully!');
    }, 20);
});