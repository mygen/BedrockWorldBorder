import { world, system } from '@minecraft/server';

class WorldBorderManager {
    constructor() {
        this.borderSize = 1000;
        this.adminPrefix = '!';
        this.warningDistance = 50;
        
        this.init();
    }

    init() {
        world.beforeEvents.chatSend.subscribe((event) => {
            this.handleChatCommand(event);
        });

        system.runInterval(() => {
            this.checkAllPlayers();
        }, 20);
    }

    handleChatCommand(event) {
        const message = event.message;
        const player = event.sender;

        if (!message.startsWith(this.adminPrefix)) return;

        const args = message.slice(1).split(' ');
        const command = args[0].toLowerCase();

        if (command === 'worldborder') {
            event.cancel = true;
            
            if (!player.hasTag('admin') && !player.isOp()) {
                player.sendMessage('§cYou do not have permission to use this command.');
                return;
            }

            if (args.length < 2) {
                player.sendMessage('§eUsage: !worldborder <size>');
                player.sendMessage(`§eCurrent world border size: ${this.borderSize}`);
                return;
            }

            const newSize = parseInt(args[1]);
            if (isNaN(newSize) || newSize < 100) {
                player.sendMessage('§cInvalid size. Minimum size is 100 blocks.');
                return;
            }

            this.borderSize = newSize;
            world.sendMessage(`§aWorld border set to ${this.borderSize} blocks by ${player.name}`);
        }
    }

    checkAllPlayers() {
        for (const player of world.getAllPlayers()) {
            this.checkPlayerPosition(player);
        }
    }

    checkPlayerPosition(player) {
        const location = player.location;
        const x = location.x;
        const z = location.z;

        const maxDistance = Math.max(Math.abs(x), Math.abs(z));

        if (maxDistance > this.borderSize - this.warningDistance && maxDistance <= this.borderSize) {
            player.onScreenDisplay.setActionBar(`§eWarning: Approaching world border (${Math.round(this.borderSize - maxDistance)} blocks remaining)`);
        }

        if (maxDistance > this.borderSize) {
            this.teleportPlayerToSafety(player);
        }
    }

    teleportPlayerToSafety(player) {
        const location = player.location;
        let x = location.x;
        let z = location.z;
        const y = location.y;

        if (Math.abs(x) > this.borderSize) {
            x = Math.sign(x) * (this.borderSize - 5);
        }
        if (Math.abs(z) > this.borderSize) {
            z = Math.sign(z) * (this.borderSize - 5);
        }

        const safeY = this.findSafeY(x, z, y);

        try {
            player.teleport({ x: x, y: safeY, z: z });
            player.onScreenDisplay.setActionBar('§cYou have reached the world border and been teleported back!');
            
            player.playSound('random.orb', {
                location: player.location,
                volume: 0.5,
                pitch: 0.8
            });
        } catch (error) {
            console.warn(`Failed to teleport player ${player.name}: ${error}`);
        }
    }

    findSafeY(x, z, currentY) {
        const dimension = world.getDimension('overworld');
        let testY = Math.max(currentY, 64);

        for (let i = 0; i < 50; i++) {
            try {
                const blockBelow = dimension.getBlock({ x: Math.floor(x), y: Math.floor(testY) - 1, z: Math.floor(z) });
                const blockAt = dimension.getBlock({ x: Math.floor(x), y: Math.floor(testY), z: Math.floor(z) });
                const blockAbove = dimension.getBlock({ x: Math.floor(x), y: Math.floor(testY) + 1, z: Math.floor(z) });

                if (blockBelow && blockBelow.isSolid && 
                    blockAt && !blockAt.isSolid && 
                    blockAbove && !blockAbove.isSolid) {
                    return testY;
                }
            } catch (error) {
                console.warn(`Error checking block at Y=${testY}: ${error}`);
            }
            
            testY++;
            if (testY > 300) break;
        }

        return Math.max(currentY, 100);
    }
}

const worldBorderManager = new WorldBorderManager();

console.log('BedrockWorldBorder addon loaded successfully!');