# BedrockWorldBorder

A Minecraft Bedrock Edition addon that prevents players from traveling beyond specified world borders with safe teleportation and admin controls.

## Features

- **Dynamic World Border**: Set custom world border sizes using admin commands
- **Safe Teleportation**: Players are safely teleported back when they exceed the border
- **Warning System**: Players receive actionbar warnings when approaching the border
- **Admin Controls**: Operators can configure border size with `!worldborder <size>` command
- **Sound Effects**: Audio feedback when players hit the border
- **Safe Landing**: Intelligent Y-coordinate detection for safe teleportation

## Installation

1. Download or clone this repository
2. Copy the `BedrockWorldBorder_BP` folder to your Minecraft development behavior packs directory:
   ```
   %LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs\
   ```
3. Enable the behavior pack in your world settings
4. Ensure "Script API" experimental toggle is enabled in your world

## Development Setup

### Prerequisites
- Node.js (for nodemon file watching)
- Visual Studio Code (recommended)
- Minecraft Bedrock Edition

### Quick Start
1. Run `start-development.bat` to open the VSCode workspace
2. Use `auto-sync.bat` or VSCode tasks to auto-sync files to Minecraft
3. Enable experimental features in your test world

### Available Commands

#### Batch Files
- `start-development.bat` - Opens VSCode workspace
- `auto-sync.bat` - Starts file watcher for automatic syncing

#### VSCode Tasks
- **Start Auto-Sync Watcher** - Monitors files and syncs changes automatically
- **Manual Sync to Minecraft** - One-time sync to development folders
- **Stop Auto-Sync** - Stops the file watcher
- **Install/Update Nodemon** - Installs nodemon globally

## Usage

### Admin Commands
- `!worldborder <size>` - Set world border size (requires admin/op permissions)
  - Example: `!worldborder 5000` sets border to ±5000 blocks on X and Z axes
  - Minimum size: 100 blocks

### Player Experience
- Players receive warnings when within 50 blocks of the border
- Actionbar messages show remaining distance to border
- Safe teleportation back inside border when exceeded
- Audio feedback (orb sound) when teleported

### Permissions
- Admin commands require either:
  - Operator status (`/op <player>`)
  - Admin tag (`/tag <player> add admin`)

## Technical Details

### File Structure
```
BedrockWorldBorder/
├── BedrockWorldBorder_BP/          # Behavior Pack
│   ├── manifest.json               # Pack manifest with dependencies
│   ├── scripts/
│   │   └── main.js                 # Main addon logic
│   └── pack_icon.png               # Pack icon (optional)
├── .vscode/
│   └── tasks.json                  # VSCode tasks for development
├── BedrockWorldBorder.code-workspace # VSCode workspace
├── auto-sync.bat                   # Auto-sync script
├── start-development.bat           # Development launcher
├── .gitignore                      # Git ignore rules
└── README.md                       # This file
```

### Dependencies
- `@minecraft/server` v1.15.0+ - Core server API
- Node.js with nodemon - Development file watching

### Configuration
- Default border size: 1000 blocks
- Warning distance: 50 blocks from border
- Check interval: Every 20 ticks (1 second)
- Safe teleport offset: 5 blocks inside border

## Development

### File Watching
The addon includes automatic file synchronization:
- Watches: `*.js`, `*.json`, `*.png`, `*.bbmodel`, `*.mcfunction`
- Syncs to: Minecraft development behavior packs folder
- Excludes: `node_modules`, `.git` folders

### Testing
1. Create a new world with experimental features enabled
2. Add the behavior pack to the world
3. Test with `/gamemode creative` for easy movement
4. Use `/tp` commands to test border detection

### Customization
Modify `main.js` to adjust:
- Default border size
- Warning distance
- Check frequency
- Admin command prefix
- Teleportation behavior

## Git Setup

Initialize Git repository and connect to GitHub:

```bash
# Initialize repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: BedrockWorldBorder addon setup"

# Add remote repository (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/BedrockWorldBorder.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Troubleshooting

### Common Issues

1. **Addon not working**
   - Ensure experimental features are enabled
   - Check behavior pack is applied to world
   - Verify script module dependencies in manifest.json

2. **Auto-sync not working**
   - Install Node.js and nodemon: `npm install -g nodemon`
   - Check file paths in auto-sync.bat
   - Ensure Minecraft is closed when syncing

3. **Commands not responding**
   - Verify admin permissions (`/op` or admin tag)
   - Check command prefix (default: `!`)
   - Ensure chat messages start with exact command syntax

### Debug Tips
- Check Minecraft behavior pack logs for script errors
- Use `/reload` command to refresh scripts
- Test in creative mode for easier debugging

## License

This project is open source. Feel free to modify and distribute according to your needs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This addon requires Minecraft Bedrock Edition with Script API experimental features enabled.