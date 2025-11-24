# Changelog

All notable changes to BedrockWorldBorder will be documented in this file.

## [2.1.1] - 2025-01-05

### Changed
- Updated API dependency from `@minecraft/server 2.1.0-beta` to `2.2.0-beta` for compatibility with latest Minecraft Bedrock
- Simplified README documentation for better user experience
- Made README more focused on server admins and players rather than developers

### Technical
- Maintained `@minecraft/server-ui 2.1.0-beta` dependency (still current)
- All existing features remain unchanged and fully functional

## [2.1.0] - 2024

### Added
- **GUI Settings System**: Complete in-game interface using ActionFormData and ModalFormData
- **Dynamic Particle Effects**: 4 particle types (flame, redstone, portal, critical) with proximity-based scaling
- **Knockback Border Action**: Physics-based alternative to teleportation using applyKnockback API
- **Custom Center Coordinates**: Set border origin to any X,Z coordinates instead of hardcoded 0,0
- **Border Bypass System**: Tag-based permission system allowing trusted players to cross borders
- **Per-Dimension Configuration**: Individual settings for particles, actions, warnings, and centers per dimension

### Enhanced
- **Permission System**: Improved admin notifications with "Beyond border" distance display
- **Performance Optimization**: Reduced particle count and improved checking intervals
- **Error Handling**: Better form validation and user feedback

### Fixed
- Player permission checking using `playerPermissionLevel >= 2` instead of non-existent `player.isOp()`
- Particle names corrected for Bedrock Edition compatibility
- Command parameter types fixed for proper player lookup
- Admin warning display issues resolved

## [2.0.0] - 2024

### Added
- **Namespaced Slash Commands**: Full `/worldborder:` command system
- **Multi-Dimension Support**: Individual borders for Overworld, Nether, and End
- **Smart Teleportation**: Intelligent Y-level preservation and safe block detection
- **Persistent Configuration**: Settings saved using dynamic properties system

### Changed
- Complete rewrite from basic `!` commands to proper Minecraft slash commands
- No longer requires cheats enabled - works with built-in permissions

## [1.0.1] - 2024

### Added
- **Basic World Border**: Simple border enforcement with teleportation
- **Admin Notifications**: Alerts when players go outside border
- **Command System**: Basic `!` prefix commands requiring cheats

### Changed
- Commands changed from chat-based to `!` prefix due to cheat requirements
- Updated documentation

## [1.0.0] - 2024

### Added
- Initial release with basic world border functionality
- Simple teleportation back to spawn when crossing border
- Basic configuration options