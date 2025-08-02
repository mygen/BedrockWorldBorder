# BedrockWorldBorder

A comprehensive world border addon for Minecraft Bedrock Edition that prevents players from traveling beyond specified boundaries with safe teleportation back to the border edge.

## Features

### Core Functionality
- **Multi-Dimension Support**: Different border sizes for Overworld, Nether, and The End
- **Safe Teleportation**: Players are teleported back to the border edge at their current Y-level
- **Warning System**: Configurable warning distance with action bar notifications
- **Admin Exemption**: Players with 'admin' tag can pass through borders
- **Persistent Settings**: All configuration saves between server/realm restarts

### Performance
- **Optimized Checking**: Runs once per second instead of every tick
- **Efficient Logic**: Only checks dimensions where players are present
- **Minimal Overhead**: Lightweight implementation suitable for production servers

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

All commands require Game Director permissions and use the `/worldborder:` prefix:

### `/worldborder:set <size>`
Sets the border size for the Overworld dimension.
- **size**: Integer value (minimum 100 blocks)
- **Example**: `/worldborder:set 1500`

### `/worldborder:toggle`
Toggles the world border enforcement on/off globally.
- **Example**: `/worldborder:toggle`

### `/worldborder:status`
Shows current border configuration for all dimensions.
- **Example**: `/worldborder:status`

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

### Data Storage
Settings are stored as world dynamic properties:
- `worldBorderSizes`: JSON object with per-dimension sizes
- `worldBorderEnabled`: Global enable/disable state
- `worldBorderWarningDistance`: Warning threshold distance
- `worldBorderWarningEnabled`: Warning system toggle

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

### Extending the Addon
The code is modular and can be extended to add:
- Additional command parameters for dimension-specific settings
- Custom warning messages per dimension
- Integration with other server management addons
- Advanced permission systems

## License

This addon is provided as-is for educational and server management purposes. Feel free to modify and distribute according to your needs.

## Support

For issues, feature requests, or questions:
1. Check the troubleshooting section above
2. Review game logs for script errors
3. Verify all requirements are met
4. Test with minimal addon setup to isolate issues

---

**Version**: 2.0  
**Last Updated**: 2025  
**Minecraft Version**: 1.21.0+  
**API Version**: @minecraft/server 2.1.0-beta