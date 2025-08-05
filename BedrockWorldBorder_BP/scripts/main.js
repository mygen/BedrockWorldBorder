import { 
    world, 
    system,
    CommandPermissionLevel,
    CustomCommandParamType
} from '@minecraft/server';

import {
    ActionFormData,
    MessageFormData,
    ModalFormData
} from "@minecraft/server-ui";

class WorldBorderManager {
    constructor() {
        this.config = {
            overworld: { enabled: false, size: 1000, warning: true, warnDistance: 50, centerX: 0, centerZ: 0, particlesEnabled: true, particleType: 'flame', action: 'teleport' },
            nether: { enabled: false, size: 1000, warning: true, warnDistance: 50, centerX: 0, centerZ: 0, particlesEnabled: true, particleType: 'redstone', action: 'teleport' },
            end: { enabled: false, size: 1000, warning: true, warnDistance: 50, centerX: 0, centerZ: 0, particlesEnabled: true, particleType: 'portal', action: 'teleport' }
        };
        this.playerWarnings = new Map();
        this.lastParticlePositions = new Map();
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

    saveConfig() {
        try {
            world.setDynamicProperty('worldBorderConfig', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Failed to save world border config');
        }
    }

    getDimensionKey(dimensionId) {
        if (dimensionId.includes('nether')) return 'nether';
        if (dimensionId.includes('end')) return 'end';
        return 'overworld';
    }

    hasBypassPermission(player) {
        return player.playerPermissionLevel >= 2 || player.hasTag('border_bypass');
    }

    showHelp(player) {
        const isGameDirector = player.playerPermissionLevel >= 2;
        player.sendMessage('§6=== World Border Commands ===');
        player.sendMessage('§e/worldborder:help §7- Show this help message');
        player.sendMessage('§e/worldborder:status §7- Show current border status');
        
        if (isGameDirector) {
            player.sendMessage('§e/worldborder:menu §7- Open settings GUI');
            player.sendMessage('§e/worldborder:allow <player> <on|off> §7- Grant/revoke border bypass');
            player.sendMessage('§e/worldborder:size <all|overworld|nether|end> <size> §7- Set border size');
            player.sendMessage('§e/worldborder:toggle <all|overworld|nether|end> §7- Toggle border on/off');
            player.sendMessage('§e/worldborder:warning <all|overworld|nether|end> <on|off> §7- Toggle warning messages');
            player.sendMessage('§e/worldborder:warndistance <all|overworld|nether|end> <distance> §7- Set warning distance');
            player.sendMessage('§e/worldborder:center <all|overworld|nether|end> <x> <z> §7- Set center coordinates');
        } else {
            player.sendMessage('§7Additional commands available for GameDirector+ permission level');
        }
    }

    showStatus(player) {
        player.sendMessage('§6=== World Border Status ===');
        
        for (const [dim, config] of Object.entries(this.config)) {
            const statusColor = config.enabled ? '§a' : '§c';
            const statusText = config.enabled ? 'Enabled' : 'Disabled';
            const warningStatus = config.warning ? '§aOn' : '§cOff';
            const particleStatus = config.particlesEnabled ? '§aOn' : '§cOff';
            const actionText = config.action === 'knockback' ? 'Knockback' : 'Teleport';
            const sizeColor = '§b';
            
            player.sendMessage(`§e${dim.charAt(0).toUpperCase() + dim.slice(1)}: ${statusColor}${statusText} §7| Size: ${sizeColor}${config.size} §7| Center: §b${config.centerX}, ${config.centerZ}`);
            player.sendMessage(`  §7Warnings: ${warningStatus} §7| Distance: §b${config.warnDistance} §7| Action: §b${actionText} §7| Particles: ${particleStatus}`);
        }
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

    setWarning(player, enabled, dimension = 'all') {
        if (dimension === 'all') {
            for (const dim of ['overworld', 'nether', 'end']) {
                this.config[dim].warning = enabled;
            }
            const statusText = enabled ? '§aenabled' : '§cdisabled';
            player.sendMessage(`§aWorld border warnings ${statusText} for all dimensions.`);
        } else if (this.config[dimension]) {
            this.config[dimension].warning = enabled;
            const statusText = enabled ? '§aenabled' : '§cdisabled';
            player.sendMessage(`§aWorld border warnings ${statusText} for ${dimension}.`);
        } else {
            player.sendMessage('§cInvalid dimension. Use: all, overworld, nether, or end.');
            return;
        }
        this.saveConfig();
    }

    setWarnDistance(player, distance, dimension = 'all') {
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

        // Apply to all dimensions or specific dimension
        if (dimension === 'all') {
            for (const dim of ['overworld', 'nether', 'end']) {
                this.config[dim].warnDistance = distance;
            }
            player.sendMessage(`§aSet warning distance to §b${distance} §ablocks for all dimensions.`);
        } else if (this.config[dimension]) {
            this.config[dimension].warnDistance = distance;
            player.sendMessage(`§aSet warning distance to §b${distance} §ablocks for ${dimension}.`);
        } else {
            player.sendMessage('§cInvalid dimension. Use: all, overworld, nether, or end.');
            return;
        }
        this.saveConfig();
    }

    setCenter(player, dimension, x, z) {
        if (isNaN(x) || isNaN(z)) {
            player.sendMessage('§cCenter coordinates must be valid numbers.');
            return;
        }

        if (dimension === 'all') {
            for (const dim of ['overworld', 'nether', 'end']) {
                this.config[dim].centerX = x;
                this.config[dim].centerZ = z;
            }
            player.sendMessage(`§aSet center coordinates to §b${x}, ${z} §afor all dimensions.`);
        } else if (this.config[dimension]) {
            this.config[dimension].centerX = x;
            this.config[dimension].centerZ = z;
            player.sendMessage(`§aSet center coordinates to §b${x}, ${z} §afor ${dimension}.`);
        } else {
            player.sendMessage('§cInvalid dimension. Use: all, overworld, nether, or end.');
            return;
        }

        this.saveConfig();
    }

    getParticleString(particleType) {
        // Using performance-friendly Bedrock particle names only
        const particleMap = {
            'flame': 'minecraft:basic_flame_particle',           // Orange flame
            'redstone': 'minecraft:redstone_wire_dust_particle', // Red dust  
            'portal': 'minecraft:basic_portal_particle',         // Purple portal particles
            'critical': 'minecraft:critical_hit_emitter'         // Yellow critical sparks
        };
        
        // Always fallback to basic flame since it works reliably
        return particleMap[particleType] || 'minecraft:basic_flame_particle';
    }

    showBorderParticles(player) {
        const dimensionKey = this.getDimensionKey(player.dimension.id);
        const borderConfig = this.config[dimensionKey];

        if (!borderConfig.enabled || !borderConfig.particlesEnabled) return;

        const location = player.location;
        const maxDistance = borderConfig.size;
        const relativeX = location.x - borderConfig.centerX;
        const relativeZ = location.z - borderConfig.centerZ;
        
        // Calculate distance from each border edge
        const distanceFromEastWest = maxDistance - Math.abs(relativeX);
        const distanceFromNorthSouth = maxDistance - Math.abs(relativeZ);
        
        
        // Only show particles if within 10 blocks of border
        const particleDistance = 10;
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
        
        // Check if player moved significantly to avoid unnecessary particle updates
        const lastPos = this.lastParticlePositions.get(player.id);
        const currentPos = { x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z) };
        
        if (lastPos && 
            Math.abs(lastPos.x - currentPos.x) < 1 && 
            Math.abs(lastPos.y - currentPos.y) < 1 && 
            Math.abs(lastPos.z - currentPos.z) < 1) {
            return; // Player hasn't moved enough to update particles
        }
        
        this.lastParticlePositions.set(player.id, currentPos);
        
        // Get particle type based on user selection
        const particleType = this.getParticleString(borderConfig.particleType);
        
        // Dynamic proximity barrier - larger when far, smaller when close
        const playerHeadY = Math.floor(location.y) + 1;
        
        // Calculate closest distance to border for scaling
        const closestDistance = Math.min(distanceFromEastWest, distanceFromNorthSouth);
        
        // Scale factor: 1.0 at 10 blocks away, 0.3 at 0 blocks away
        const distanceRatio = Math.max(0, Math.min(1, closestDistance / particleDistance)); // 0.0 to 1.0
        const scaleFactor = 0.3 + (distanceRatio * 0.7); // 0.3 to 1.0
        
        // Dynamic grid size based on distance
        const maxGridSize = Math.floor(6 * scaleFactor); // 2 to 6 blocks radius
        const spacing = 0.3 + (scaleFactor * 0.4); // 0.3 to 0.7 block spacing
        
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
                    
                    // Add random particles for extra density when far away
                    const extraParticles = Math.floor(scaleFactor * 2); // 0-2 extra particles
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

    startPlayerMonitoring() {
        system.runInterval(() => {
            for (const player of world.getPlayers()) {
                this.checkPlayerPosition(player);
            }
        }, 10);
        
        // Particle system runs less frequently for performance
        system.runInterval(() => {
            for (const player of world.getPlayers()) {
                this.showBorderParticles(player);
            }
        }, 10); // Every 0.5 seconds
    }

    checkPlayerPosition(player) {
        const location = player.location;
        const dimensionKey = this.getDimensionKey(player.dimension.id);
        const borderConfig = this.config[dimensionKey];

        if (!borderConfig.enabled) return;

        const maxDistance = borderConfig.size;
        const x = Math.abs(location.x - borderConfig.centerX);
        const z = Math.abs(location.z - borderConfig.centerZ);
        const maxCoord = Math.max(x, z);
        const hasBypass = this.hasBypassPermission(player);

        if (maxCoord > maxDistance) {
            if (hasBypass) {
                // Show distance beyond border for admins/bypass players
                const distanceBeyond = Math.floor(maxCoord - maxDistance);
                player.onScreenDisplay.setActionBar(`§cBeyond border: §b${distanceBeyond} §cblocks`);
            } else {
                // Apply border action for regular players
                if (borderConfig.action === 'knockback') {
                    this.applyKnockbackToPlayer(player, location, borderConfig);
                } else {
                    this.teleportPlayerBack(player, location, maxDistance, borderConfig);
                }
            }
        } else if (borderConfig.warning && maxCoord > (maxDistance - borderConfig.warnDistance)) {
            const distanceToBarrier = Math.floor(maxDistance - maxCoord);
            player.onScreenDisplay.setActionBar(`§eApproaching world border: §c${distanceToBarrier} §eblocks remaining`);
        }
    }

    applyKnockbackToPlayer(player, currentLocation, borderConfig) {
        const directionX = borderConfig.centerX - currentLocation.x;
        const directionZ = borderConfig.centerZ - currentLocation.z;

        // Normalize the direction vector
        const magnitude = Math.sqrt(directionX * directionX + directionZ * directionZ);
        if (magnitude === 0) return; // Avoid division by zero

        const normalizedX = directionX / magnitude;
        const normalizedZ = directionZ / magnitude;

        const horizontalStrength = 3.0; // A gentle push
        const verticalStrength = 0.1;   // Minimal vertical lift

        const finalDirection = { 
            x: normalizedX * horizontalStrength, 
            z: normalizedZ * horizontalStrength 
        };

        try {
            // After much trial and error, this appears to be the correct signature:
            // The first argument is a VectorXZ object for horizontal force.
            // The second argument is a number for vertical force.
            player.applyKnockback(finalDirection, verticalStrength);
            player.onScreenDisplay.setActionBar('§cYou have reached the world border!');
            
            player.playSound('item.shield.block', { volume: 0.5, pitch: 0.8 });
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

        // Find safe Y level at the teleport location
        const safeY = this.findSafeY(player, newX, newZ, y);

        try {
            player.teleport({ x: newX, y: safeY, z: newZ }, { 
                dimension: player.dimension,
                facingLocation: { x: borderConfig.centerX, y: safeY, z: borderConfig.centerZ }
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

    async showMainMenu(player) {
        // Force close chat with damage command
        player.runCommand('damage @s 0');
        
        await system.runTimeout(() => {
            // Get status for each dimension
            const overworldStatus = this.config.overworld.enabled ? '§aEnabled' : '§cDisabled';
            const netherStatus = this.config.nether.enabled ? '§aEnabled' : '§cDisabled';
            const endStatus = this.config.end.enabled ? '§aEnabled' : '§cDisabled';
            
            const form = new ActionFormData()
                .title('§6World Border Settings')
                .body('Select a dimension to configure:')
                .button('§eAll Dimensions', 'textures/ui/World')
                .button(`§2Overworld\n${overworldStatus} §8• Size: §b${this.config.overworld.size}`, 'textures/blocks/grass_side_carried')
                .button(`§4The Nether\n${netherStatus} §8• Size: §b${this.config.nether.size}`, 'textures/blocks/netherrack')
                .button(`§5The End\n${endStatus} §8• Size: §b${this.config.end.size}`, 'textures/blocks/end_stone');

            form.show(player).then(response => {
                if (response.canceled) return;
                
                const dimensions = ['all', 'overworld', 'nether', 'end'];
                const selectedDimension = dimensions[response.selection];
                this.showDimensionSettings(player, selectedDimension);
            });
        }, 5);
    }

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
            if (isNaN(size) || size < 100) {
                player.sendMessage('§cInvalid size. Must be at least 100.');
                return;
            }
            
            if (isNaN(warnDistance) || warnDistance < 0 || warnDistance > 50) {
                player.sendMessage('§cInvalid warning distance. Must be 0-50.');
                return;
            }
            
            if (warnDistance >= size) {
                player.sendMessage(`§cWarning distance (${warnDistance}) must be less than border size (${size}).`);
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
            
            const statusText = enabled ? '§aenabled' : '§cdisabled';
            const warningStatusText = warningEnabled ? '§aOn' : '§cOff';
            const particlesStatusText = particlesEnabled ? '§aOn' : '§cOff';
            const particleName = particleNames[particleStyleIndex] || 'Unknown';
            const actionName = actionNames[actionIndexResult] || 'Unknown';

            player.sendMessage(`§aSettings updated for ${dimensionName}:`);
            player.sendMessage(`§eBorder: ${statusText} §7| Size: §b${size} §7| Action: §b${actionName} §7| Center: §b${centerX}, ${centerZ}`);
            player.sendMessage(`§eWarnings: ${warningStatusText} §7| Distance: §b${warnDistance} §7| Particles: ${particlesStatusText} (${particleName})`);
        } catch (error) {
            player.sendMessage('§cError opening settings form. Please try again.');
            console.warn('Form error:', error);
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

    // Register warndistance command
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

    // Register center command
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

    // Register menu command
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

    // Register allow command
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
                const target = world.getPlayers().find(p => p.name === playerName);
                if (!target) {
                    origin.sourceEntity.sendMessage(`§cPlayer '${playerName}' not found.`);
                    return;
                }

                if (onoff === 'on') {
                    target.addTag('border_bypass');
                    origin.sourceEntity.sendMessage(`§aGave border bypass to ${target.name}.`);
                    target.sendMessage("§aYou can now bypass the world border.");
                } else {
                    target.removeTag('border_bypass');
                    origin.sourceEntity.sendMessage(`§aRemoved border bypass from ${target.name}.`);
                    target.sendMessage("§cYou can no longer bypass the world border.");
                }
            });
        }
    );


    // Commands registered successfully
});

// Persistence is handled in the constructor with delayed loading


// Initialization complete
system.run(() => {
    system.runTimeout(() => {
        console.log('BedrockWorldBorder v2.1.1 by Rob \'myGen\' Hall - Loaded successfully!');
    }, 20);
});
