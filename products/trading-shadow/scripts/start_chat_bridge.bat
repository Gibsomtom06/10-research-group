@echo off
REM ====================================================================
REM start_chat_bridge.bat
REM Double-click launcher for the Discord chat bridge.
REM Activates venv, sets MODE=paper (so .env.paper is loaded for keys),
REM runs scripts\chat_bridge.py with output captured to logs\bot_<ts>.log.
REM ====================================================================

setlocal

set "PROJECT_ROOT=%~dp0.."
pushd "%PROJECT_ROOT%"

if not exist "logs" mkdir "logs"

for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "TS=%%I"
set "LOGFILE=logs\bot_%TS%.log"

echo ====================================================================
echo Discord Chat Bridge starting
echo Project root : %CD%
echo Log file     : %LOGFILE%
echo Time         : %DATE% %TIME%
echo ====================================================================
echo.
echo The bot listens on these channels (from .env.paper):
echo   IDEAS_INBOX_CHANNEL_ID  -^> appends messages to data\ideas_inbox.jsonl
echo   XAI_CHAT_CHANNEL_ID     -^> Xai (Anthropic Claude with TENx10 prompt)
echo   CLAUDE_CHAT_CHANNEL_ID  -^> Claude (general help)
echo.
echo If a channel ID is empty, that route is just disabled.
echo.
echo Ctrl-C in this window stops the bot. To watch the log live:
echo     Get-Content -Path "%CD%\%LOGFILE%" -Wait -Tail 50
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] .venv not found. Run: uv venv ^&^& uv pip install -e .
    pause
    exit /b 1
)

if not exist ".env.paper" (
    echo [ERROR] .env.paper not found. Copy .env.example and fill keys.
    pause
    exit /b 1
)

set "MODE=paper"

powershell -NoProfile -Command ^
    "$env:MODE='paper'; & '.venv\Scripts\python.exe' -u scripts\chat_bridge.py 2>&1 | Tee-Object -FilePath '%LOGFILE%'"

set "EXITCODE=%ERRORLEVEL%"

echo.
echo ====================================================================
echo Bot exited with code %EXITCODE% at %DATE% %TIME%
echo Log saved to: %CD%\%LOGFILE%
echo ====================================================================

popd
endlocal
pause
