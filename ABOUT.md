# About BedrockWorldBorder

## What is BedrockWorldBorder?

BedrockWorldBorder is a comprehensive world border addon for Minecraft Bedrock Edition that brings Java Edition-style world borders to Bedrock servers and worlds. It provides server administrators with powerful tools to define, visualize, and enforce boundaries in their worlds, helping to manage server resources, guide player exploration, and create controlled gameplay experiences.

## The Problem It Solves

Minecraft worlds are virtually infinite, but this creates several challenges for server administrators and world creators:

- **Performance Issues**: Players spreading too far can cause excessive chunk loading and memory usage
- **Resource Management**: Unlimited exploration makes world backups large and time-consuming
- **Gameplay Balance**: Infinite worlds can dilute player interaction and community building
- **Map Design**: Custom maps and adventure worlds need defined boundaries
- **Griefing Prevention**: Unlimited space makes it harder to moderate and protect areas

BedrockWorldBorder addresses these challenges by providing a robust, feature-rich border system that rivals and exceeds Java Edition's built-in world border functionality.

## Core Philosophy

BedrockWorldBorder is built on three key principles:

1. **Flexibility**: Every server is different. The addon provides extensive customization options to match your specific needs, from visual appearance to enforcement behavior.

2. **Performance**: Efficiency matters. The addon uses chunk-aligned rendering, optimized event handling, and smart caching to minimize server impact while maintaining smooth gameplay.

3. **User Experience**: Borders should guide, not frustrate. The addon includes visual warnings, smooth teleportation, customizable feedback, and intuitive administration tools to create a seamless experience for both players and admins.

## What Makes It Special

### Java Edition Parity
- Authentic animated wall particles that match Java Edition's appearance
- Similar behavior and feedback systems
- Familiar command structure for server admins transitioning from Java

### Beyond Java Edition
While inspired by Java Edition, BedrockWorldBorder adds unique features:
- **Per-Dimension Borders**: Independent settings for Overworld, Nether, and End
- **Visual Customization**: 11 different particle styles to match your server's aesthetic
- **Flexible Enforcement**: Choose between teleportation or physics-based knockback
- **Interaction Control**: Prevent block manipulation outside borders
- **Custom Center Points**: Place borders anywhere, not just at spawn
- **GUI Interface**: In-game settings menu for easy configuration

## Key Features

### Border Management
- **Multi-Dimension Support**: Configure independent borders for each dimension
- **Custom Centers**: Position borders anywhere in the world
- **Real-Time Updates**: Changes apply immediately without server restarts

### Visual Feedback System
- **Java-Style Wall Particles**: Animated 192-block tall walls mark the boundary
- **11 Particle Styles**: Customize appearance per dimension
- **Distance Warnings**: Progressive warnings as players approach the border
- **Smart Rendering**: Particles only appear when players are within simulation distance
- **Performance Optimized**: Chunk-aligned spawning and limited rendering distance

### Player Enforcement
- **Two Enforcement Modes**:
  - **Teleport**: Safely returns players inside the border with intelligent Y-level detection
  - **Knockback**: Physics-based pushback using momentum and direction
- **Smart Teleportation**: Finds safe Y-levels to prevent suffocation
- **View Preservation**: Camera direction maintained during teleportation
- **Sound & Visual Feedback**: Clear audio and action bar notifications

### Interaction Prevention
- **Block Breaking Prevention**: Stop mining outside borders
- **Block Placing Prevention**: Prevent building in restricted areas (blocks returned to player)
- **Block Interaction Prevention**: Lock chests, doors, buttons, and other interactables
- **Per-Dimension Control**: Enable/disable for each dimension independently

### Permission System
- **Game Director Level**: Full admin access to all border management features
- **Bypass System**: Tag-based system for trusted players (`border_bypass` tag)
- **Admin Notifications**: Special feedback when admins cross borders
- **Granular Control**: Different permissions for different actions

### Administration Tools
- **In-Game GUI**: User-friendly forms-based interface
- **Slash Commands**: Full command-line control for power users
- **Status Display**: Real-time information about all border configurations
- **Persistent Settings**: Configuration saved automatically using dynamic properties

## How It Works

### Architecture Overview

BedrockWorldBorder uses a modular, event-driven architecture:

1. **Configuration Layer**: Manages per-dimension settings stored in world dynamic properties
2. **Monitoring Layer**: Tracks player positions and proximity to borders
3. **Enforcement Layer**: Handles player interactions with borders (teleport/knockback)
4. **Visualization Layer**: Manages particle spawning and rendering
5. **Permission Layer**: Controls access to admin features and bypass abilities

### Technical Implementation

**Chunk-Aligned System**
- Borders are defined in chunks (16-block units) for performance and consistency
- Particle spawning aligns to chunk boundaries for optimal rendering
- Position checks use chunk-based calculations to reduce computational overhead

**Event-Driven Design**
- Uses Minecraft's event system for all player interactions
- `beforeEvents` for cancellable actions (block breaking, interaction)
- `afterEvents` for post-action handling (block placing with return)
- Custom event emitter for extensibility and future features

**Smart Particle Rendering**
- Particles only spawn within 6 chunks (96 blocks) of players
- Renders 8 chunks in each direction from player position
- 3-second particle lifetime with 60-tick respawn interval
- Separate particle types for north-south and east-west walls

**Performance Optimization**
- Position checks every 10 ticks (0.5 seconds)
- Particle updates every 60 ticks (3 seconds)
- Dimension filtering skips disabled dimensions
- Graceful error handling prevents chunk loading issues

## Use Cases

### Survival Servers
- Limit world size for manageable backups
- Encourage community building in concentrated area
- Prevent resource depletion from over-exploration
- Control server performance and chunk loading

### Creative Servers
- Define build zones and competition areas
- Create themed regions with visual boundaries
- Separate different project areas
- Protect spawn and showcase areas

### Minigame Servers
- Create game boundaries for matches
- Define arena edges for PvP games
- Build adventure map boundaries
- Set up parkour or challenge course limits

### Adventure Maps
- Guide players through intended paths
- Prevent sequence breaking
- Create immersive world edges
- Control pacing and exploration

### Educational Worlds
- Create safe, bounded learning environments
- Separate different lesson areas
- Control student exploration range
- Define specific activity zones

## Technical Requirements

### Minimum Requirements
- **Minecraft Version**: 1.21.50 or higher
- **API Version**: @minecraft/server 2.3.0 (stable)
- **Permissions**: Game Director level (2+) for administration

### Installation Components
- **Behavior Pack**: Contains all logic, commands, and functionality
- **Resource Pack**: Provides particle effects and custom textures

### No Beta APIs
Version 3.0.0+ uses only stable Minecraft APIs, ensuring:
- Better compatibility across versions
- No experimental gameplay flags required
- More stable and predictable behavior
- Future-proof implementation

## Performance Characteristics

### Server Impact
- **Minimal CPU Usage**: Efficient tick-based checks and smart caching
- **Low Memory Footprint**: Chunk-aligned data structures and optimized storage
- **Network Friendly**: Particles only sent to nearby players
- **Scalable**: Performance remains consistent regardless of player count

### Optimization Features
- Chunk-aligned calculations reduce computation
- Visibility culling prevents unnecessary particle spawning
- Event-based architecture avoids continuous polling
- Smart Y-level detection minimizes world queries
- Graceful degradation under load

## Configuration Flexibility

Every aspect of BedrockWorldBorder is customizable:

- **Border Size**: From 1 chunk to virtually unlimited
- **Center Point**: Any X,Z coordinate in the world
- **Enforcement Mode**: Teleport or knockback
- **Warning Distance**: 0-50 blocks (configurable)
- **Particle Style**: 11 different visual styles
- **Interaction Prevention**: Toggle per dimension
- **Warning Messages**: Enable/disable per dimension

## Development & Support

### Open Development
- Built with clean, modular, well-documented code
- Event-driven architecture for easy extensibility
- Comprehensive JSDoc comments throughout
- Constants extracted for easy customization

### Community Driven
- Features developed based on user feedback
- Active bug fixing and improvements
- Regular updates and enhancements
- Open to feature requests and contributions

## Philosophy on Updates

We believe in:
- **Backward Compatibility**: Updates preserve existing configurations
- **Stable APIs**: Avoiding beta features for production reliability
- **Performance First**: Every feature is optimized before release
- **User Experience**: Changes focus on improving usability and feedback

## Why Choose BedrockWorldBorder?

### vs. Command Block Solutions
- ✅ No redstone or command blocks needed
- ✅ Works automatically for all players
- ✅ Professional visual feedback
- ✅ No performance impact from constant command execution
- ✅ Easy configuration through GUI

### vs. Other Border Addons
- ✅ Java Edition parity with enhanced features
- ✅ 11 customizable particle styles
- ✅ Interaction prevention system
- ✅ Stable API implementation
- ✅ Active development and support
- ✅ Comprehensive documentation
- ✅ Per-dimension configuration

### vs. Java Edition Built-In Border
- ✅ More flexible enforcement options (knockback mode)
- ✅ Visual customization with particle styles
- ✅ Interaction prevention features
- ✅ Custom dimension icons in UI
- ✅ More granular permission system
- ✅ Event system for extensibility

## The Future

BedrockWorldBorder continues to evolve with:
- Additional particle customization options
- More interaction control features
- Performance optimizations for massive servers
- Integration with other popular addons
- Enhanced admin tools and analytics
- Community-requested features

## Getting Started

Ready to add professional world borders to your server?

1. **Download** the latest version from our releases page
2. **Install** both the Behavior Pack and Resource Pack
3. **Configure** your first border using `/worldborder:menu`
4. **Customize** particle styles and settings to match your server

For detailed installation instructions, see the [README.md](README.md) file.

For version history and changes, see the [CHANGELOG.md](CHANGELOG.md) file.

---

**BedrockWorldBorder** - Professional world boundaries for Minecraft Bedrock Edition.

*Built with ❤️ for the Bedrock community.*
