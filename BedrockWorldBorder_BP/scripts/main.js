/**
 * BedrockWorldBorder - Main Entry Point
 * @author Rob 'myGen' Hall
 * @version 3.0.0
 * @license CC BY-NC-SA 4.0
 */

import {
    system,
    CommandPermissionLevel,
    CustomCommandParamType
} from '@minecraft/server';

import { WorldBorderManager } from './WorldBorderManager.js';

const worldBorderManager = new WorldBorderManager();

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    customCommandRegistry.registerEnum("worldborder:dimension", ["all", "overworld", "nether", "end"]);
    customCommandRegistry.registerEnum("worldborder:onoff", ["on", "off"]);

    // Help
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
            system.run(() => worldBorderManager.showHelp(origin.sourceEntity));
        }
    );

    // Status
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
            system.run(() => worldBorderManager.showStatus(origin.sourceEntity));
        }
    );

    // Size (chunks)
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:size",
            description: "Sets border size in chunks (16 blocks each)",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                { name: "worldborder:dimension", type: CustomCommandParamType.Enum },
                { name: "chunks", type: CustomCommandParamType.Integer }
            ]
        },
        (origin, dimension, chunks) => {
            if (!origin.sourceEntity) return;
            system.run(() => worldBorderManager.setSize(origin.sourceEntity, dimension, chunks));
        }
    );

    // Toggle
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:toggle",
            description: "Toggles world border on/off",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                { name: "worldborder:dimension", type: CustomCommandParamType.Enum }
            ]
        },
        (origin, dimension) => {
            if (!origin.sourceEntity) return;
            system.run(() => worldBorderManager.toggleBorder(origin.sourceEntity, dimension));
        }
    );

    // Warning
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:warning",
            description: "Toggles warning messages on/off",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                { name: "worldborder:dimension", type: CustomCommandParamType.Enum },
                { name: "worldborder:onoff", type: CustomCommandParamType.Enum }
            ]
        },
        (origin, dimension, setting) => {
            if (!origin.sourceEntity) return;
            system.run(() => worldBorderManager.setWarning(origin.sourceEntity, setting === 'on', dimension));
        }
    );

    // Warn distance
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:warndistance",
            description: "Sets warning distance in blocks (0-50)",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                { name: "worldborder:dimension", type: CustomCommandParamType.Enum },
                { name: "blocks", type: CustomCommandParamType.Integer }
            ]
        },
        (origin, dimension, blocks) => {
            if (!origin.sourceEntity) return;
            system.run(() => worldBorderManager.setWarnDistance(origin.sourceEntity, blocks, dimension));
        }
    );

    // Center
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:center",
            description: "Sets the center coordinates",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                { name: "worldborder:dimension", type: CustomCommandParamType.Enum },
                { name: "x", type: CustomCommandParamType.Integer },
                { name: "z", type: CustomCommandParamType.Integer }
            ]
        },
        (origin, dimension, x, z) => {
            if (!origin.sourceEntity) return;
            system.run(() => worldBorderManager.setCenter(origin.sourceEntity, dimension, x, z));
        }
    );

    // Menu
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:menu",
            description: "Opens the settings GUI",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: []
        },
        (origin) => {
            if (!origin.sourceEntity) return;
            system.run(() => worldBorderManager.showMainMenu(origin.sourceEntity));
        }
    );

    // Allow (bypass)
    customCommandRegistry.registerCommand(
        {
            name: "worldborder:allow",
            description: "Grants or revokes border bypass",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                { name: "player", type: CustomCommandParamType.String },
                { name: "worldborder:onoff", type: CustomCommandParamType.Enum }
            ]
        },
        (origin, playerName, onoff) => {
            if (!origin.sourceEntity) return;
            system.run(() => worldBorderManager.manageBorderBypass(origin.sourceEntity, playerName, onoff === 'on'));
        }
    );
});

system.run(() => {
    system.runTimeout(() => {
        console.log('BedrockWorldBorder v3.0.0 by Rob \'myGen\' Hall - Loaded!');
    }, 20);
});