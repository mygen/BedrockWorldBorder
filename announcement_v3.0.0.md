# BedrockWorldBorder 3.0.0 - Major Update Released!

**January 27, 2025**

We're excited to announce the release of **BedrockWorldBorder 3.0.0**, our biggest update yet! This release brings highly requested features, stunning visual customization options, and major quality-of-life improvements that make managing your world borders easier and more polished than ever.

## 🎨 What's New

### Particle Style System
The standout feature of this release is the all-new **Particle Style System**. Choose from **11 beautiful particle styles** to customize how your world border walls appear:

- Each dimension (Overworld, Nether, End) can have its own unique style
- Easy-to-use dropdown selector right in the admin UI
- Switch styles instantly without server restarts
- Animations now run at a smooth 16 FPS for better visual appeal

Make your world borders match your server's aesthetic perfectly!

### Interaction Prevention
Take control of what players can do outside your borders with the new **Interaction Prevention** feature:

- **Block Breaking Prevention**: Stop players from mining outside the border
- **Block Placing Prevention**: Prevent building in restricted areas (blocks are automatically returned)
- **Block Interaction Prevention**: Lock chests, doors, buttons, and other interactive blocks outside borders
- **Fully Configurable**: Toggle per dimension to match your server's needs
- **Permission Aware**: Respects admin and bypass permissions automatically

Perfect for keeping your world pristine and preventing players from spreading too far!

### Enhanced User Experience

**Smoother Teleportation**
- Players now maintain their camera direction when teleported back inside borders
- No more jarring camera snaps - the experience is seamless and natural

**Custom Dimension Icons**
- The admin UI now features custom-designed icons for each dimension
- More polished, professional appearance
- Better visual distinction between dimension settings

## 🔧 Technical Improvements

### Stable API Migration
This release completes our migration to stable Minecraft APIs, meaning:
- No more beta API dependencies
- Better compatibility and stability
- Future-proof implementation using afterEvents

### Bug Fixes
- Resolved privilege errors with action bar messages
- Fixed API compatibility issues with block placement detection
- Improved error handling throughout the codebase

## 📦 Compatibility

- **Minecraft Version**: 1.21.50+
- **API Version**: @minecraft/server 2.3.0 (stable)
- **Dependencies**: All stable APIs, no beta features required

## 🚀 Upgrade Guide

Upgrading from version 2.x is seamless:

1. **Backup Your World** (always recommended!)
2. **Replace** the old addon files with the new version
3. **Reload** your world or restart the server
4. Your existing settings will be preserved automatically

New features (particle styles and interaction prevention) are disabled by default, so you can enable them at your own pace through the `/worldborder:menu` interface.

## 🎯 Getting Started

### For New Users
1. Install both the Behavior Pack and Resource Pack
2. Join your world with operator permissions
3. Run `/worldborder:menu` to configure your first border
4. Choose your preferred particle style and settings

### For Existing Users
Open the settings menu (`/worldborder:menu`) for any dimension to access:
- The new **Particle Style** dropdown (bottom of settings)
- The new **Prevent Interaction Outside Border** toggle

## 💡 Tips & Tricks

- **Mix and Match**: Try different particle styles for each dimension - red particles in the Nether, purple in the End!
- **Test Before Enabling**: Use the particle style preview to find your favorite before applying to all players
- **Gradual Rollout**: Enable interaction prevention in one dimension first to test how it affects gameplay
- **Custom Styles**: Using the provided particle textures as templates, you can create your own custom styles

## 🙏 Thank You

A huge thank you to everyone who provided feedback, reported bugs, and suggested features. This release was shaped by your input, and we're thrilled to deliver these improvements to the community.

## 📝 Full Changelog

For a complete list of changes, see the [CHANGELOG.md](CHANGELOG.md) file.

## 🐛 Found a Bug?

If you encounter any issues, please report them on our [GitHub repository](https://github.com/yourusername/BedrockWorldBorder) with:
- Minecraft version
- Addon version (3.0.0)
- Steps to reproduce the issue
- Any error messages

## 🔮 What's Next?

We're already working on future updates! Stay tuned for:
- Additional particle customization options
- More interaction control features
- Performance optimizations for large servers

---

**Download BedrockWorldBorder 3.0.0** and transform your world borders today!

Happy building! 🎮✨
