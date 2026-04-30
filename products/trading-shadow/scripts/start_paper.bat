@echo off
REM ====================================================================
REM start_paper.bat
REM Double-click launcher for the trading-shadow paper loop.
REM Activates the venv, sets MODE=paper, runs loop_paper.py with all
REM output streamed to console AND captured to logs\paper_<ts>.log.
REM ====================================================================

setlocal

REM Resolve project root from this script's location (scripts\ -> ..\)
set "PROJECT_ROOT=%~dp0.."
pushd "%PROJECT_ROOT%"

REM Make sure logs dir exists
if not exist "logs" mkdir "logs"

REM Build timestamp like 20260430_184530 using PowerShell (more reliable than wmic)
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "TS=%%I"

set "LOGFILE=logs\paper_%TS%.log"

echo ====================================================================
echo Trading Shadow paper loop starting
echo Project root : %CD%
echo Mode         : paper
echo Log file     : %LOGFILE%
echo Time         : %DATE% %TIME%
echo ====================================================================
echo.
echo Press Ctrl-C in this window to stop the loop. Closing the window
echo also stops it. To watch the log live in another window, run:
echo     Get-Content -Path "%CD%\%LOGFILE%" -Wait -Tail 50
echo.

REM Verify venv
if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] .venv not found at %CD%\.venv\Scripts\python.exe
    echo Run: uv venv ^&^& uv pip install -e .
    pause
    exit /b 1
)

REM Verify .env.paper
if not exist ".env.paper" (
    echo [ERROR] .env.paper not found in %CD%
    echo Create it from .env.example and fill in API keys.
    pause
    exit /b 1
)

REM MODE drives which .env file config.py loads
set "MODE=paper"

REM Run the loop. PowerShell Tee-Object dual-streams to console + log.
powershell -NoProfile -Command ^
    "$env:MODE='paper'; & '.venv\Scripts\python.exe' -u scripts\loop_paper.py 2>&1 | Tee-Object -FilePath '%LOGFILE%'"

set "EXITCODE=%ERRORLEVEL%"

echo.
echo ====================================================================
echo Loop exited with code %EXITCODE% at %DATE% %TIME%
echo Log saved to: %CD%\%LOGFILE%
echo ====================================================================

popd
endlocal
pause
