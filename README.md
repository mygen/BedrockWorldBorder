# BedrockWorldBorder

A world border addon for Minecraft Bedrock Edition that prevents players from exploring beyond set boundaries. Perfect for servers and realms that want to limit world size.

## Features

- **Easy Setup**: Install and configure through in-game menus - no complex commands needed
- **Per-Dimension Borders**: Set different limits for Overworld, Nether, and End
- **Visual Warnings**: See particle effects when approaching the border
- **Two Border Actions**: Choose between safe teleportation or knockback
- **Admin Controls**: Grant trusted players permission to cross borders
- **Custom Centers**: Place borders anywhere, not just at spawn (0,0)

## Installation

1. Download the `.mcpack` file
2. Import it into Minecraft (double-click or use Import in Settings)
3. Create a new world or edit existing world
4. Enable the "BedrockWorldBorder" behavior pack
5. **Important**: Enable "Beta APIs" experiment in world settings
6. Start your world

## Quick Start

Once in your world, use `/worldborder:menu` to open the settings GUI. From there you can:

- Enable/disable borders for each dimension
- Set border size (how many blocks from center)
- Choose particle effects (flame, redstone, portal, critical)
- Pick border action (teleport players back or push them with knockback)
- Set custom center coordinates

## Commands

**Everyone can use:**
- `/worldborder:help` - Show available commands
- `/worldborder:status` - See current border settings

**Admins only (GameDirector+):**
- `/worldborder:menu` - Open settings GUI (recommended)
- `/worldborder:size <dimension> <blocks>` - Set border size
- `/worldborder:center <dimension> <x> <z>` - Set custom center
- `/worldborder:allow <player> <on|off>` - Grant border bypass permission

**Dimensions**: Use `overworld`, `nether`, `end`, or `all`

## How It Works

1. **Particle Warning**: When you get within 10 blocks of the border, you'll see particles showing where the boundary is
2. **Distance Warning**: Get closer and you'll see chat messages telling you how far you are from the edge
3. **Border Action**: Cross the border and either get teleported back safely or pushed back with knockback

## Border Actions

- **Teleport**: Instantly moves you back to a safe spot inside the border (default)
- **Knockback**: Pushes you back toward the center with momentum and sound effects

## Permissions

- **Regular Players**: Affected by all border rules
- **Admins (GameDirector+)**: Can use commands and see "Beyond border" warnings when outside
- **Bypass Players**: Can cross borders freely (use `/worldborder:allow PlayerName on`)

## Common Issues

**Commands don't work?**
- Make sure "Beta APIs" experiment is enabled
- Check you have GameDirector permissions or higher
- Use the full command with colon: `/worldborder:help`

**No particles showing?**
- Border must be enabled for your dimension
- Get within 10 blocks of the border edge
- Check particles are enabled in the GUI settings

**Border not stopping players?**
- Verify border is enabled with `/worldborder:status`
- Make sure you don't have bypass permissions
- Look for the "Loaded successfully!" message when joining the world

## Default Settings

- **All Dimensions**: 1000 block radius from center (0,0)
- **Particles**: Flame (Overworld), Redstone (Nether), Portal (End)
- **Action**: Teleport back to border edge
- **Warnings**: Enabled, starting 50 blocks from border

---

**Version**: 2.1.1 | **Requires**: Minecraft Bedrock 1.21.0+ with Beta APIs enabled