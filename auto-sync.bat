@echo off
echo Starting BedrockWorldBorder Auto-Sync...
echo.
echo This will automatically sync your addon files to Minecraft when changes are detected.
echo Watching files: *.js, *.json, *.png, *.bbmodel, *.mcfunction
echo.
echo Target Directory: %LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs\BedrockWorldBorder_BP
echo.

REM Check if nodemon is installed
where nodemon >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Nodemon not found. Installing globally...
    npm install -g nodemon
    if %ERRORLEVEL% neq 0 (
        echo Error: Failed to install nodemon. Please install Node.js first.
        pause
        exit /b 1
    )
)

REM Create target directory if it doesn't exist
if not exist "%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs\BedrockWorldBorder_BP" (
    echo Creating target directory...
    mkdir "%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs\BedrockWorldBorder_BP"
)

REM Initial sync
echo Performing initial sync...
robocopy "BedrockWorldBorder_BP" "%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs\BedrockWorldBorder_BP" /MIR /XD .git node_modules
echo.

REM Start watching for changes
echo Starting file watcher...
echo Press Ctrl+C to stop watching
echo.
nodemon --watch "BedrockWorldBorder_BP" --ext "js,json,png,bbmodel,mcfunction" --ignore "node_modules/" --ignore ".git/" --exec "robocopy BedrockWorldBorder_BP \"%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs\BedrockWorldBorder_BP\" /MIR /XD .git node_modules && echo Synced at %TIME%"