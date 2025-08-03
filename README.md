![BedrockWorldBorder](minecraft_title.png)

# BedrockWorldBorder

A comprehensive world border addon for Minecraft Bedrock Edition that prevents players from traveling beyond specified boundaries with safe teleportation back to the border edge.

## Features

### Core Functionality
- **Multi-Dimension Support**: Different border sizes and enable/disable states for Overworld, Nether, and The End
- **Granular Control**: Set borders per-dimension or all at once with flexible commands
- **Safe Teleportation**: Players are teleported back to the border edge at their current Y-level
- **Configurable Warning System**: Adjustable warning distance and toggle on/off capability
- **Admin Exemption**: Players with 'admin' tag can pass through borders with notification
- **Admin Awareness**: Admins see distance notifications when outside borders
- **Persistent Settings**: All configuration saves between server restarts with per-dimension tracking

### Performance
- **Optimized Checking**: Runs once per second instead of every tick
- **Efficient Logic**: Only checks dimensions where players are present

## Installation

### Easy Installation (Recommended)
1. **Download** the latest `.mcpack` file from [GitHub Releases](https://github.com/mygen/BedrockWorldBorder/releases)
2. **Double-click** the `.mcpack` file to automatically import it into Minecraft
3. **Create a new world** or **edit an existing world**
4. **Enable** the BedrockWorldBorder behavior pack in world settings
5. **Activate** the "Beta APIs" experiment in world settings
6. **Start** your world

### Manual Installation
1. **Download** and extract the addon files from the repository
2. **Copy** the `BedrockWorldBorder_BP` folder to your world's `behavior_packs` directory:
   - **Windows**: `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\behavior_packs\`
   - **Android**: `/storage/emulated/0/games/com.mojang/behavior_packs/`
   - **iOS**: `Apps/Minecraft/Documents/games/com.mojang/behavior_packs/`
3. **Enable** the behavior pack in your world settings
4. **Activate** the "Beta APIs" experiment in world settings
5. **Restart** your world/server

### Requirements
- Minecraft Bedrock Edition 1.21.0+
- Beta APIs experiment enabled
- @minecraft/server 2.1.0-beta
- **Cheats enabled** (temporarily) for initial admin setup

### Admin Setup (One-Time)
1. **Enable cheats** in world settings
2. **Run command**: `/tag @s add admin` to give yourself admin privileges
3. **Optional**: Disable cheats again - admin tag persists and addon works normally
4. **Note**: Border protection works for all players regardless of cheats setting

## Commands

Commands use chat-based system with `!wb` prefix. Admin commands require the 'admin' tag.

### Available to Everyone
- `!wb help` - Show command help and usage
- `!wb status` - Show current border configuration

### Admin Commands (require 'admin' tag)

### `!wb set <dimension> <size>`
Sets the border size for specified dimension(s).
- **dimension**: `all`, `overworld`, `nether`, or `end`
- **size**: Integer value (minimum 100 blocks)
- **Examples**: 
  - `!wb set all 1500` - Set all dimensions to 1500 blocks
  - `!wb set overworld 2000` - Set only Overworld to 2000 blocks
  - `!wb set nether 500` - Set only Nether to 500 blocks

### `!wb toggle [dimension]`
Toggles the world border enforcement on/off for specified dimension(s).
- **dimension**: `all` (default), `overworld`, `nether`, or `end`
- **Examples**:
  - `!wb toggle` - Toggle all dimensions
  - `!wb toggle overworld` - Toggle only Overworld
  - `!wb toggle nether` - Toggle only Nether

### `!wb warn <on|off>`
Toggles the warning system on or off globally.
- **Examples**:
  - `!wb warn on` - Enable warning messages
  - `!wb warn off` - Disable warning messages

### `!wb warndistance <distance>`
Sets the warning distance in blocks from the border.
- **distance**: Integer value (1-1000 blocks)
- **Example**: `!wb warndistance 75` - Warn when within 75 blocks of border

## Configuration

### Default Border Sizes
- **Overworld**: 1000 blocks
- **Nether**: 500 blocks  
- **The End**: 1000 blocks

### Warning System
- **Default Warning Distance**: 50 blocks from border
- **Warning Message**: Shows remaining distance in action bar
- **Configurable**: Can be disabled or distance modified

### Admin System
Players with the `admin` tag have special privileges:
- **Border Bypass**: Can travel beyond borders without being teleported
- **Admin Notifications**: See distance alerts when outside borders (`[ADMIN] Outside world border by X blocks`)
- **Command Access**: Can use all admin commands

To grant admin privileges (requires cheats enabled):
```
/tag @s add admin
```

## Technical Details

### How It Works
1. **Position Checking**: Scans all player positions once per second
2. **Distance Calculation**: Uses maximum of absolute X or Z coordinates
3. **Dimension Detection**: Automatically detects player's current dimension
4. **Safe Teleportation**: Moves players to border edge minus 5 blocks for safety

### Compatibility
- **Server Performance**: Minimal impact with 1-second checking interval
- **Multiplayer Ready**: Handles multiple players efficiently
- **Cross-Platform**: Works on all Bedrock platforms

## Troubleshooting

### Common Issues

**Commands not working**
- Ensure Beta APIs experiment is enabled
- Verify you have the 'admin' tag for admin commands
- Check addon is properly installed in behavior_packs folder

**Players not being teleported**
- Confirm border is enabled with `!wb status`
- Check if player has 'admin' tag (they bypass borders)
- Verify addon loaded successfully in game logs

## Development

### File Structure
```
BedrockWorldBorder_BP/
├── manifest.json          # Addon metadata and dependencies
├── scripts/
│   └── main.js            # Core addon logic
└── README.md              # This documentation
```

**Version**: 2.0  
**Last Updated**: 2025  
**Minecraft Version**: 1.21.0+  
**API Version**: @minecraft/server 2.1.0-beta