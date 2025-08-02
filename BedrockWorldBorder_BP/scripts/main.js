import { world, system, CommandPermissionLevel, CustomCommandParamType } from '@minecraft/server';

class WorldBorderManager {
    constructor() {
        this.defaultBorderSizes = {
            'overworld': 1000,
            'nether': 500,
            'the_end': 1000
        };
        this.defaultBorderEnabled = {
            'overworld': true,
            'nether': true,
            'the_end': true
        };
        this.adminPrefix = '!';
        this.warningDistance = 50;
        this.warningEnabled = true;
        
        this.init();
    }

    init() {
        this.borderSizes = { ...this.defaultBorderSizes };
        this.borderEnabled = { ...this.defaultBorderEnabled };

        system.runInterval(() => {
            this.checkAllPlayers();
        }, 20);
    }

    registerCommands(customCommandRegistry) {
        try {
            // Register enums first
            customCommandRegistry.registerEnum("worldborder:dimensions", ["all", "overworld", "nether", "end"]);
            customCommandRegistry.registerEnum("worldborder:toggle", ["on", "off"]);

            // /worldborder:set <dimension> <size>
            customCommandRegistry.registerCommand(
                {
                    name: "worldborder:set",
                    description: "Set the world border size for specified dimension(s)",
                    permissionLevel: CommandPermissionLevel.GameDirectors,
                    mandatoryParameters: [
                        {
                            name: "worldborder:dimensions",
                            type: CustomCommandParamType.Enum,
                        },
                        {
                            name: "size",
                            type: CustomCommandParamType.Integer,
                        },
                    ],
                },
                (origin, dimension, size) => {
                    this.handleSetSize(dimension, size);
                }
            );

            // /worldborder:toggle [dimension]
            customCommandRegistry.registerCommand(
                {
                    name: "worldborder:toggle",
                    description: "Toggle the world border on/off for specified dimension(s)",
                    permissionLevel: CommandPermissionLevel.GameDirectors,
                    optionalParameters: [
                        {
                            name: "worldborder:dimensions",
                            type: CustomCommandParamType.Enum,
                        },
                    ],
                },
                (origin, dimension) => {
                    this.handleToggle(dimension || "all");
                }
            );

            // /worldborder:status
            customCommandRegistry.registerCommand(
                {
                    name: "worldborder:status",
                    description: "Show world border status",
                    permissionLevel: CommandPermissionLevel.GameDirectors,
                },
                (origin) => {
                    this.handleStatus();
                }
            );

            // /worldborder:warn <on|off>
            customCommandRegistry.registerCommand(
                {
                    name: "worldborder:warn",
                    description: "Toggle warning system on/off",
                    permissionLevel: CommandPermissionLevel.GameDirectors,
                    mandatoryParameters: [
                        {
                            name: "worldborder:toggle",
                            type: CustomCommandParamType.Enum,
                        },
                    ],
                },
                (origin, toggle) => {
                    this.handleWarnToggle(toggle);
                }
            );

            // /worldborder:warndistance <distance>
            customCommandRegistry.registerCommand(
                {
                    name: "worldborder:warndistance",
                    description: "Set warning distance in blocks",
                    permissionLevel: CommandPermissionLevel.GameDirectors,
                    mandatoryParameters: [
                        {
                            name: "distance",
                            type: CustomCommandParamType.Integer,
                        },
                    ],
                },
                (origin, distance) => {
                    this.handleWarnDistance(distance);
                }
            );

        } catch (error) {
            console.error('Failed to register custom commands:', error);
        }
    }
    

    loadSettings() {
        try {
            const savedBorderSizes = world.getDynamicProperty('worldBorderSizes');
            const savedBorderEnabled = world.getDynamicProperty('worldBorderEnabled');
            const savedWarningDistance = world.getDynamicProperty('worldBorderWarningDistance');
            const savedWarningEnabled = world.getDynamicProperty('worldBorderWarningEnabled');
            
            this.borderSizes = savedBorderSizes !== undefined ? JSON.parse(savedBorderSizes) : { ...this.defaultBorderSizes };
            
            // Handle legacy boolean or new object format
            if (savedBorderEnabled !== undefined) {
                const parsed = JSON.parse(savedBorderEnabled);
                if (typeof parsed === 'boolean') {
                    // Legacy format - apply to all dimensions
                    this.borderEnabled = {
                        'overworld': parsed,
                        'nether': parsed,
                        'the_end': parsed
                    };
                } else {
                    // New object format
                    this.borderEnabled = parsed;
                }
            } else {
                this.borderEnabled = { ...this.defaultBorderEnabled };
            }
            
            this.warningDistance = savedWarningDistance !== undefined ? savedWarningDistance : 50;
            this.warningEnabled = savedWarningEnabled !== undefined ? savedWarningEnabled : true;
            
        } catch (error) {
            console.warn(`Failed to load world border settings: ${error}`);
            this.borderSizes = { ...this.defaultBorderSizes };
            this.borderEnabled = { ...this.defaultBorderEnabled };
            this.warningDistance = 50;
            this.warningEnabled = true;
        }
    }

    saveSettings() {
        try {
            world.setDynamicProperty('worldBorderSizes', JSON.stringify(this.borderSizes));
            world.setDynamicProperty('worldBorderEnabled', JSON.stringify(this.borderEnabled));
            world.setDynamicProperty('worldBorderWarningDistance', this.warningDistance);
            world.setDynamicProperty('worldBorderWarningEnabled', this.warningEnabled);
        } catch (error) {
            console.warn(`Failed to save world border settings: ${error}`);
        }
    }

    handleSetSize(dimension, size) {
        if (size < 100) {
            world.sendMessage('§cInvalid size. Minimum size is 100 blocks.');
            return;
        }

        const dimensionMap = {
            'overworld': 'overworld',
            'nether': 'nether', 
            'end': 'the_end'
        };

        if (dimension === 'all') {
            Object.keys(this.borderSizes).forEach(dim => {
                this.borderSizes[dim] = size;
            });
            world.sendMessage(`§aAll dimension borders set to ${size} blocks`);
        } else {
            const targetDim = dimensionMap[dimension] || dimension;
            if (this.borderSizes[targetDim] !== undefined) {
                this.borderSizes[targetDim] = size;
                world.sendMessage(`§a${dimension.charAt(0).toUpperCase() + dimension.slice(1)} border set to ${size} blocks`);
            } else {
                world.sendMessage(`§cUnknown dimension: ${dimension}`);
                return;
            }
        }
        
        this.saveSettings();
    }

    handleToggle(dimension) {
        const dimensionMap = {
            'overworld': 'overworld',
            'nether': 'nether', 
            'end': 'the_end'
        };

        if (dimension === 'all') {
            const newState = !this.borderEnabled['overworld']; // Use overworld as reference
            Object.keys(this.borderEnabled).forEach(dim => {
                this.borderEnabled[dim] = newState;
            });
            world.sendMessage(`§aAll dimension borders ${newState ? 'enabled' : 'disabled'}`);
        } else {
            const targetDim = dimensionMap[dimension] || dimension;
            
            if (this.borderEnabled[targetDim] !== undefined) {
                this.borderEnabled[targetDim] = !this.borderEnabled[targetDim];
                world.sendMessage(`§a${dimension.charAt(0).toUpperCase() + dimension.slice(1)} border ${this.borderEnabled[targetDim] ? 'enabled' : 'disabled'}`);
            } else {
                world.sendMessage(`§cUnknown dimension: ${dimension}`);
                return;
            }
        }
        
        this.saveSettings();
    }

    handleWarnToggle(toggle) {
        this.warningEnabled = (toggle === 'on');
        this.saveSettings();
        world.sendMessage(`§aWarning system ${this.warningEnabled ? 'enabled' : 'disabled'}`);
    }

    handleWarnDistance(distance) {
        if (distance < 1 || distance > 1000) {
            world.sendMessage('§cInvalid distance. Must be between 1 and 1000 blocks.');
            return;
        }
        
        this.warningDistance = distance;
        this.saveSettings();
        world.sendMessage(`§aWarning distance set to ${distance} blocks`);
    }

    handleStatus() {
        // Beta API limitation - can't access player directly, use world message
        world.sendMessage(`§eWorld Border Status:`);
        world.sendMessage(`§e- Border Sizes & Status:`);
        world.sendMessage(`§e  - Overworld: ${this.borderSizes['overworld']} blocks (${this.borderEnabled['overworld'] ? 'Enabled' : 'Disabled'})`);
        world.sendMessage(`§e  - Nether: ${this.borderSizes['nether']} blocks (${this.borderEnabled['nether'] ? 'Enabled' : 'Disabled'})`);
        world.sendMessage(`§e  - The End: ${this.borderSizes['the_end']} blocks (${this.borderEnabled['the_end'] ? 'Enabled' : 'Disabled'})`);
        world.sendMessage(`§e- Warning System: ${this.warningEnabled ? 'Enabled (' + this.warningDistance + ' blocks)' : 'Disabled'}`);
        world.sendMessage(`§e- Admin Exemption: Players with 'admin' tag bypass border`);
    }

    checkAllPlayers() {
        for (const player of world.getAllPlayers()) {
            this.checkPlayerPosition(player);
        }
    }

    checkPlayerPosition(player) {
        // Skip admin players
        if (player.hasTag('admin')) {
            return;
        }

        const location = player.location;
        const x = location.x;
        const z = location.z;
        const dimension = player.dimension.id;

        // Check if border is enabled for this dimension
        const dimensionEnabled = this.borderEnabled[dimension] !== undefined ? this.borderEnabled[dimension] : this.borderEnabled['overworld'];
        if (!dimensionEnabled) {
            return;
        }

        const borderSize = this.borderSizes[dimension] || this.borderSizes['overworld'];
        const maxDistance = Math.max(Math.abs(x), Math.abs(z));

        if (this.warningEnabled && maxDistance > borderSize - this.warningDistance && maxDistance <= borderSize) {
            player.onScreenDisplay.setActionBar(`§eWarning: Approaching world border (${Math.round(borderSize - maxDistance)} blocks remaining)`);
        }

        if (maxDistance > borderSize) {
            this.teleportPlayerToSafety(player, borderSize);
        }
    }

    teleportPlayerToSafety(player, borderSize) {
        const location = player.location;
        let x = location.x;
        let z = location.z;
        const y = location.y;

        if (Math.abs(x) > borderSize) {
            x = Math.sign(x) * (borderSize - 5);
        }
        if (Math.abs(z) > borderSize) {
            z = Math.sign(z) * (borderSize - 5);
        }

        try {
            player.teleport({ x: x, y: y, z: z });
            player.onScreenDisplay.setActionBar('§cYou have reached the world border and been teleported back!');
            
            try {
                player.playSound('random.orb', {
                    volume: 0.5,
                    pitch: 0.8
                });
            } catch (soundError) {
                // Sound failed silently
            }
        } catch (error) {
            console.warn(`Failed to teleport player ${player.name}: ${error}`);
            // Try alternative teleport method
            try {
                player.runCommand(`tp @s ${x} ${y} ${z}`);
                player.onScreenDisplay.setActionBar('§cYou have reached the world border and been teleported back!');
            } catch (cmdError) {
                console.warn(`Failed alternative teleport: ${cmdError}`);
            }
        }
    }

    findSafeY(x, z, currentY) {
        // Simplified approach - just use a reasonable Y level
        // The complex block checking might not work reliably in Beta API
        
        // If player is underground, bring them up
        if (currentY < 64) {
            return 70;
        }
        
        // If player is at reasonable height, keep them there
        if (currentY >= 64 && currentY <= 200) {
            return currentY;
        }
        
        // If player is too high, bring them down to a safe level
        return 100;
    }
}

const worldBorderManager = new WorldBorderManager();

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    worldBorderManager.registerCommands(customCommandRegistry);
});

system.runTimeout(() => {
    worldBorderManager.loadSettings();
}, 20);

console.log('BedrockWorldBorder v2.0 by Rob \'myGen\' Hall - Loaded successfully!');