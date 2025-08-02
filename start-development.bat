@echo off
echo Starting BedrockWorldBorder Development Environment...
echo.

REM Check if VSCode is installed
where code >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Visual Studio Code not found in PATH.
    echo Please install VSCode or add it to your PATH.
    echo.
    echo Opening workspace file with default application...
    start "" "BedrockWorldBorder.code-workspace"
) else (
    echo Opening VSCode workspace...
    code "BedrockWorldBorder.code-workspace"
)

echo.
echo Development environment setup complete!
echo.
echo To start auto-sync:
echo 1. Use Ctrl+Shift+P in VSCode and run "Tasks: Run Task"
echo 2. Select "Start Auto-Sync Watcher"
echo 3. Or run auto-sync.bat manually
echo.
pause