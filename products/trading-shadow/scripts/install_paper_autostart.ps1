# Install Windows Task Scheduler entry that auto-starts the trading-shadow
# paper loop at user logon. Hidden window. Restarts on failure. No admin
# required (registers in user-context task store).
#
# Run ONCE with:
#     powershell -ExecutionPolicy Bypass -File scripts\install_paper_autostart.ps1
#
# After installation, log out and back in (or reboot). The loop starts
# automatically and stays running. Discord posts every market-open cycle
# act as the heartbeat. Logs land in logs\paper_<timestamp>.log.
#
# To stop: run scripts\uninstall_paper_autostart.ps1
# Or: open Task Scheduler -> Task Scheduler Library -> find
# "TradingShadow_PaperLoop" -> right-click -> Disable / Delete.

$ErrorActionPreference = "Stop"

# Resolve project root from this script's location
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BatPath = Join-Path $ProjectRoot "scripts\start_paper.bat"

if (-not (Test-Path $BatPath)) {
    Write-Error "start_paper.bat not found at: $BatPath"
    exit 1
}

$VenvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Warning "No .venv found at $VenvPython"
    Write-Warning "The auto-start task will fail until you create the venv."
    Write-Warning "Run: cd `"$ProjectRoot`"; uv venv; uv pip install -e ."
}

$EnvFile = Join-Path $ProjectRoot ".env.paper"
if (-not (Test-Path $EnvFile)) {
    Write-Warning "No .env.paper found at $EnvFile"
    Write-Warning "Auto-start will fail until you copy .env.example -> .env.paper and fill keys."
}

$TaskName = "TradingShadow_PaperLoop"
$TaskDescription = "Auto-starts trading-shadow paper loop at user logon. Heartbeat = Discord posts every market-open cycle. Logs at logs\paper_<ts>.log."

# Action: run the .bat in a hidden powershell window so the console doesn't pop up
$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command `"& `'$BatPath`'`"" `
    -WorkingDirectory $ProjectRoot

# Trigger: at logon of current user
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

# Settings: restart on failure, run only when network available, run on AC + battery
$Settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -RestartCount 5 `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -ExecutionTimeLimit (New-TimeSpan -Days 0) `
    -MultipleInstances IgnoreNew

# Principal: run as current user, in interactive (logged-on) session.
# This avoids needing to store a password.
$Principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited

# Remove any existing task with the same name (idempotent re-install)
$Existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Existing) {
    Write-Host "Removing existing task '$TaskName' before re-registering..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask `
    -TaskName $TaskName `
    -Description $TaskDescription `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Principal $Principal | Out-Null

Write-Host ""
Write-Host "================================================================="
Write-Host "  Trading-shadow paper loop autostart REGISTERED"
Write-Host "================================================================="
Write-Host "  Task name : $TaskName"
Write-Host "  User      : $env:USERNAME"
Write-Host "  Project   : $ProjectRoot"
Write-Host "  Trigger   : At user logon"
Write-Host "  Window    : Hidden (no console clutter)"
Write-Host "  Restart   : On failure, every 5 min, up to 5 times"
Write-Host ""
Write-Host "  NEXT STEP: log out and back in (or reboot). The loop starts"
Write-Host "  automatically. First trade attempt: next market-open window"
Write-Host "  (9:30 AM ET on a weekday)."
Write-Host ""
Write-Host "  To verify it's running:"
Write-Host "    1. Open Task Manager -> Details tab -> look for python.exe"
Write-Host "    2. Watch Discord for trade-attempt posts during market hours"
Write-Host "    3. Tail the log:"
Write-Host "       Get-Content -Path '$ProjectRoot\logs\paper_*.log' -Wait -Tail 50"
Write-Host ""
Write-Host "  To stop / uninstall:"
Write-Host "    powershell -File scripts\uninstall_paper_autostart.ps1"
Write-Host ""
Write-Host "  To start immediately (without waiting for next logon):"
Write-Host "    Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "================================================================="
