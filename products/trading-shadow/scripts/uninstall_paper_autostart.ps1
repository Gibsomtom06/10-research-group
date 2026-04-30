# Remove the trading-shadow paper loop auto-start task.
# Counterpart to install_paper_autostart.ps1.
#
# Run with:
#     powershell -ExecutionPolicy Bypass -File scripts\uninstall_paper_autostart.ps1

$ErrorActionPreference = "Stop"
$TaskName = "TradingShadow_PaperLoop"

$Existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $Existing) {
    Write-Host "Task '$TaskName' is not registered. Nothing to remove."
    exit 0
}

# If the task is currently running, stop it before unregistering
$Info = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Info -and $Info.LastTaskResult -eq 0x41301) {
    Write-Host "Task is currently running. Stopping it..."
    Stop-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 2
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Removed scheduled task '$TaskName'."
Write-Host "Note: any python.exe processes still running need to be ended manually"
Write-Host "      via Task Manager (the task only controls auto-start at logon)."
