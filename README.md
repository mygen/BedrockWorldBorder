![BedrockWorldBorder](minecraft_title.png)

# BedrockWorldBorder

A comprehensive world border addon for Minecraft Bedrock Edition that prevents players from traveling beyond specified boundaries with safe teleportation back to the border edge.

## Features

### Core Functionality
- **Multi-Dimension Support**: Different border sizes and enable/disable states for Overworld, Nether, and The End
- **Granular Control**: Set borders per-dimension or all at once with flexible commands
- **Smart Teleportation**: Players are teleported back to safe locations with intelligent Y-level preservation
- **Sound Feedback**: Audio cues when hitting world border for better user experience
- **Configurable Warning System**: Adjustable warning distance with maximum 50-block limit
- **Op+ Permissions**: Players with Op permission level or higher can bypass borders
- **Admin Awareness**: Op+ players see distance notifications when outside borders
- **Persistent Settings**: All configuration saves between server restarts with robust error handling

### Advanced Features
- **Input Validation**: Minimum border size of 100 blocks, maximum warn distance of 50 blocks
- **Cross-Validation**: Prevents invalid configurations (e.g., warn distance larger than border size)
- **Y-Level Intelligence**: Preserves player's Y coordinate unless destination blocks are unsafe
- **Void/Sky Support**: Players in void or above build height maintain their Y-level
- **Block Safety Checking**: Automatically finds nearest safe air blocks when needed

### Performance
- **Optimized Checking**: Runs every 0.5 seconds (10 ticks) for responsive border enforcement
- **Efficient Logic**: Only processes players in enabled dimensions

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
- @minecraft/server 2.1.0-beta with experimental features
- **No cheats required** - addon works with cheatsRequired: false

## Commands

Commands use proper Minecraft slash command system with `worldborder:` namespace. Op+ permission level required for administrative commands.

### Available to Everyone
- `/worldborder:help` - Show command help and available commands
- `/worldborder:status` - Show current border configuration with color-coded status

### Op+ Commands (require Op permission level or higher)

#### `/worldborder:size <dimension> <size>`
Sets the border size for specified dimension(s).
- **dimension**: `all`, `overworld`, `nether`, or `end`
- **size**: Integer value (minimum 100 blocks)
- **Validation**: Automatically prevents sizes smaller than current warning distance
- **Examples**: 
  - `/worldborder:size all 1500` - Set all dimensions to 1500 blocks
  - `/worldborder:size overworld 2000` - Set only Overworld to 2000 blocks
  - `/worldborder:size nether 500` - Set only Nether to 500 blocks

#### `/worldborder:toggle <dimension>`
Toggles the world border enforcement on/off for specified dimension(s).
- **dimension**: `all`, `overworld`, `nether`, or `end`
- **Examples**:
  - `/worldborder:toggle all` - Toggle all dimensions
  - `/worldborder:toggle overworld` - Toggle only Overworld
  - `/worldborder:toggle nether` - Toggle only Nether

#### `/worldborder:warning <on|off>`
Toggles the warning system on or off globally.
- **Examples**:
  - `/worldborder:warning on` - Enable warning messages
  - `/worldborder:warning off` - Disable warning messages

#### `/worldborder:warndistance <distance>`
Sets the warning distance in blocks from the border.
- **distance**: Integer value (0-50 blocks maximum)
- **Validation**: Automatically prevents distances larger than active border sizes
- **Example**: `/worldborder:warndistance 25` - Warn when within 25 blocks of border

## Configuration

### Default Border Sizes
- **Overworld**: 1000 blocks (disabled by default)
- **Nether**: 1000 blocks (disabled by default)  
- **The End**: 1000 blocks (disabled by default)

### Warning System
- **Default Warning Distance**: 50 blocks from border
- **Warning Message**: Shows remaining distance in action bar
- **Global Control**: Can be disabled globally or per-distance modified
- **Maximum Distance**: 50 blocks to prevent performance issues

### Permission System
Players with Op permission level (2) or higher have special privileges:
- **Border Bypass**: Can travel beyond borders without being teleported back
- **Distance Notifications**: See exact distance when outside borders
- **Command Access**: Can use all administrative commands
- **Sound Effects**: Still hear border sound for awareness

To check your permission level, Op+ users will see additional commands in `/worldborder:help`.

## Technical Details

### How It Works
1. **Position Checking**: Scans all player positions every 0.5 seconds (10 ticks)
2. **Distance Calculation**: Uses maximum of absolute X or Z coordinates from world center (0,0)
3. **Dimension Detection**: Automatically detects player's current dimension
4. **Smart Teleportation**: 
   - Moves players just inside border edge (border size - 1 block)
   - Preserves Y coordinate unless destination blocks are unsafe
   - Checks for air blocks at destination
   - Searches up/down for safe blocks if needed
   - Faces player toward world center (0,0)
5. **Audio Feedback**: Plays 'random.orb' sound at 50% volume when teleported

### Advanced Y-Level Logic
The addon intelligently handles player teleportation at any Y-level:
- **Safe Destination**: Keeps original Y coordinate
- **Unsafe Destination**: Searches for nearest air blocks (up to ±10 blocks)
- **Void Players**: Maintains void position unless blocks would be unsafe
- **Sky Limit Players**: Maintains high altitude unless blocks would be unsafe
- **Fallback**: Returns to original Y if block checking fails

### Data Persistence
- **World Properties**: Uses Minecraft's dynamic properties system
- **Automatic Saving**: Configuration saves immediately after changes
- **Load on Startup**: Settings restored when world loads
- **Error Handling**: Graceful fallback to defaults if loading fails

### Compatibility
- **Server Performance**: Minimal impact with optimized 10-tick checking interval
- **Multiplayer Ready**: Handles unlimited players efficiently
- **Cross-Platform**: Works on all Bedrock platforms (Windows, Mobile, Console, etc.)
- **Permission Integration**: Uses native Bedrock permission levels

## Troubleshooting

### Common Issues

**Commands not working**
- Ensure Beta APIs experiment is enabled in world settings
- Verify you have Op permission level or higher
- Check addon is properly installed and enabled in behavior packs

**"Unknown command" errors**
- Confirm the command name includes the namespace: `/worldborder:help`
- Make sure you're using the full command name, not abbreviations

**Players not being teleported**
- Confirm border is enabled for that dimension with `/worldborder:status`
- Check if player has Op+ permissions (they bypass borders)
- Verify addon loaded successfully - look for "BedrockWorldBorder v2.0 by Rob 'myGen' Hall - Loaded successfully!" in logs

**Teleported to wrong Y-level**
- This is normal behavior for void/sky positions - addon preserves original Y unless unsafe
- For underground positions, addon searches for safe air blocks nearby
- If consistently problematic, report with specific coordinates and dimension

**Settings not saving**
- Ensure world has write permissions
- Check for "World border configuration saved successfully" in logs
- Verify Beta APIs are enabled (required for dynamic properties)

## Development

### File Structure
```
BedrockWorldBorder_BP/
├── manifest.json          # Addon metadata and dependencies
├── scripts/
│   └── main.js            # Core addon logic with custom commands
└── README.md              # This documentation
```

### Key Code Features
- **Custom Command Registration**: Uses official Bedrock custom command API
- **Enum Parameters**: Provides autocomplete for dimension and on/off parameters
- **Input Validation**: Comprehensive error checking and user feedback
- **Smart Teleportation**: Advanced Y-level calculation with block safety checking
- **Persistent Storage**: Robust configuration saving with error handling

**Version**: 2.0  
**Author**: Rob 'myGen' Hall  
**Last Updated**: 2025  
**Minecraft Version**: 1.21.0+  
**API Version**: @minecraft/server 2.1.0-beta