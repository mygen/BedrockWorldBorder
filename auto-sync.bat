@echo off
setlocal enabledelayedexpansion

set SOURCE=%~dp0
set MINECRAFT_DIR=D:\Minecraft Stuff\BDS
set LOCAL_DIR=C:\Users\rob\AppData\Local\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang
echo [%time%] Syncing BedrockWorldBorder addon changes to Minecraft...

REM Create directories if they don't exist
if not exist "%MINECRAFT_DIR%\behavior_packs\BedrockWorldBorder" mkdir "%MINECRAFT_DIR%\behavior_packs\BedrockWorldBorder"
if not exist "%LOCAL_DIR%\behavior_packs\BedrockWorldBorder" mkdir "%MINECRAFT_DIR%\behavior_packs\BedrockWorldBorder"
REM Sync behavior pack (from BedrockWorldBorder_BP) - Mirror mode handles deletions
echo [%time%] Syncing behavior pack from BedrockWorldBorder_BP...
robocopy "%SOURCE%BedrockWorldBorder_BP" "%MINECRAFT_DIR%\behavior_packs\BedrockWorldBorder" /MIR /NP /NJH /NJS
robocopy "%SOURCE%BedrockWorldBorder_BP" "%LOCAL_DIR%\behavior_packs\BedrockWorldBorder" /MIR /NP /NJH /NJS
echo [%time%] SUCCESS: Sync complete! Changes available in Minecraft.
echo.