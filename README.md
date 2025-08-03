![BedrockWorldBorder](minecraft_title.png)

# BedrockWorldBorder

A comprehensive world border addon for Minecraft Bedrock Edition that prevents players from traveling beyond specified boundaries with safe teleportation back to the border edge.

## Features

### Core Functionality
- **Multi-Dimension Support**: Different border sizes and enable/disable states for Overworld, Nether, and The End
- **Granular Control**: Set borders per-dimension or all at once with flexible commands
- **Safe Teleportation**: Players are teleported back to the border edge at their current Y-level
- **Configurable Warning System**: Adjustable warning distance and toggle on/off capability
- **Admin Exemption**: Players with 'admin' tag can pass through borders
- **Persistent Settings**: All configuration saves between server restarts with per-dimension tracking

### Performance
- **Optimized Checking**: Runs once per second instead of every tick
- **Efficient Logic**: Only checks dimensions where players are present

## Installation

1. **Download** the addon files
2. **Copy** the `BedrockWorldBorder_BP` folder to your world's `behavior_packs` directory
3. **Enable** the behavior pack in your world settings
4. **Activate** the "Beta APIs" experiment in your world settings
5. **Restart** your world/server

### Requirements
- Minecraft Bedrock Edition 1.21.0+
- Beta APIs experiment enabled
- @minecraft/server 2.1.0-beta

## Commands

All commands require Op permissions and use the `/worldborder:` prefix:

### `/worldborder:set <dimension> <size>`
Sets the border size for specified dimension(s).
- **dimension**: `all`, `overworld`, `nether`, or `end`
- **size**: Integer value (minimum 100 blocks)
- **Examples**: 
  - `/worldborder:set all 1500` - Set all dimensions to 1500 blocks
  - `/worldborder:set overworld 2000` - Set only Overworld to 2000 blocks
  - `/worldborder:set nether 500` - Set only Nether to 500 blocks

### `/worldborder:toggle [dimension]`
Toggles the world border enforcement on/off for specified dimension(s).
- **dimension**: `all` (default), `overworld`, `nether`, or `end`
- **Examples**:
  - `/worldborder:toggle` - Toggle all dimensions
  - `/worldborder:toggle overworld` - Toggle only Overworld
  - `/worldborder:toggle nether` - Toggle only Nether

### `/worldborder:status`
Shows current border configuration for all dimensions.
- **Example**: `/worldborder:status`

### `/worldborder:warn <on|off>`
Toggles the warning system on or off globally.
- **Examples**:
  - `/worldborder:warn on` - Enable warning messages
  - `/worldborder:warn off` - Disable warning messages

### `/worldborder:warndistance <distance>`
Sets the warning distance in blocks from the border.
- **distance**: Integer value (1-1000 blocks)
- **Example**: `/worldborder:warndistance 75` - Warn when within 75 blocks of border

## Configuration

### Default Border Sizes
- **Overworld**: 1000 blocks
- **Nether**: 500 blocks  
- **The End**: 1000 blocks

### Warning System
- **Default Warning Distance**: 50 blocks from border
- **Warning Message**: Shows remaining distance in action bar
- **Configurable**: Can be disabled or distance modified

### Admin Exemption
Players with the `admin` tag bypass all border restrictions:
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
- Verify you have Game Director permissions
- Check addon is properly installed in behavior_packs folder

**Players not being teleported**
- Confirm border is enabled with `/worldborder:status`
- Check if player has 'admin' tag (they bypass borders)
- Verify addon loaded successfully in game logs

**Settings not saving**
- Ensure world has write permissions
- Check for script errors in game logs
- Verify @minecraft/server version compatibility

### Performance Notes
- Checking only occurs in dimensions with active players
- No performance impact when no players are near borders
- Teleportation includes fallback methods for API compatibility

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