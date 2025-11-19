/**
 * BedrockWorldBorder - Main Entry Point
 * @author Rob 'myGen' Hall
 * @version 2.1.1
 * @license CC BY-NC-SA 4.0
 */

import {
    world,
    system,
    CommandPermissionLevel,
    CustomCommandParamType
} from '@minecraft/server';

import { WorldBorderManager } from './WorldBorderManager.js';
import { PERMISSION_LEVELS } from './constants.js';

// Initialize the world border manager
const worldBorderManager = new WorldBorderManager();

/**
 * Register custom commands using the startup event
 */
system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    // Register enums for command parameters
    customCommandRegistry.registerEnum("worldborder:dimension", ["all", "overworld", "nether", "end"]);
    customCommandRegistry.registerEnum("worldborder:onoff", ["on", "off"]);

    /**
     * Help command - shows all available commands
     */
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

    /**
     * Status command - shows current border configuration
     */
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

    /**
     * Size command - sets the border size
     */
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

    /**
     * Toggle command - enables/disables the border
     */
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

    /**
     * Warning command - toggles warning messages
     */
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:warning",
            description: "Turns warning messages on or off for specified dimension",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                {
                    name: "worldborder:dimension",
                    type: CustomCommandParamType.Enum,
                },
                {
                    name: "worldborder:onoff",
                    type: CustomCommandParamType.Enum,
                }
            ]
        },
        (origin, dimension, setting) => {
            if (!origin.sourceEntity) return;
            system.run(() => {
                worldBorderManager.setWarning(origin.sourceEntity, setting === 'on', dimension);
            });
        }
    );

    /**
     * Warn distance command - sets the warning distance
     */
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:warndistance",
            description: "Sets the distance for border warnings for specified dimension",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                {
                    name: "worldborder:dimension",
                    type: CustomCommandParamType.Enum,
                },
                {
                    name: "distance",
                    type: CustomCommandParamType.Integer,
                }
            ]
        },
        (origin, dimension, distance) => {
            if (!origin.sourceEntity) return;
            system.run(() => {
                worldBorderManager.setWarnDistance(origin.sourceEntity, distance, dimension);
            });
        }
    );

    /**
     * Center command - sets the center coordinates
     */
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:center",
            description: "Sets the center coordinates for specified dimension",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                {
                    name: "worldborder:dimension",
                    type: CustomCommandParamType.Enum,
                },
                {
                    name: "x",
                    type: CustomCommandParamType.Integer,
                },
                {
                    name: "z",
                    type: CustomCommandParamType.Integer,
                }
            ]
        },
        (origin, dimension, x, z) => {
            if (!origin.sourceEntity) return;
            system.run(() => {
                worldBorderManager.setCenter(origin.sourceEntity, dimension, x, z);
            });
        }
    );

    /**
     * Menu command - opens the settings GUI
     */
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:menu",
            description: "Opens the world border settings GUI",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: []
        },
        (origin) => {
            if (!origin.sourceEntity) return;
            system.run(() => {
                worldBorderManager.showMainMenu(origin.sourceEntity);
            });
        }
    );

    /**
     * Allow command - grants/revokes border bypass permission
     */
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:allow",
            description: "Grants or revokes world border bypass for a player",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                {
                    name: "player",
                    type: CustomCommandParamType.String,
                },
                {
                    name: "worldborder:onoff",
                    type: CustomCommandParamType.Enum,
                }
            ]
        },
        (origin, playerName, onoff) => {
            if (!origin.sourceEntity) return;
            system.run(() => {
                worldBorderManager.manageBorderBypass(origin.sourceEntity, playerName, onoff === 'on');
            });
        }
    );

    // Commands registered successfully
});

// Initialization complete message
system.run(() => {
    system.runTimeout(() => {
        console.log('BedrockWorldBorder v2.1.1 by Rob \'myGen\' Hall - Loaded successfully!');
        console.log('Using stable APIs: @minecraft/server 2.3.0, @minecraft/server-ui 2.0.0');
    }, 20);
});
