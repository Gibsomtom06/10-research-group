# Registers watchdog_paper.ps1 as a Windows Task Scheduler task.
# Run once as administrator (or from elevated PowerShell).
# Runs every 10 minutes, all day, every day.

$TaskName  = "TradingShadow_Watchdog"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script    = Join-Path $ScriptDir "watchdog_paper.ps1"

# Load DISCORD_WEBHOOK_URL from .env.paper so the webhook is available at task runtime
$EnvFile = Join-Path $ScriptDir "..\..env.paper"
if (Test-Path $EnvFile) {
    $webhookLine = Get-Content $EnvFile | Where-Object { $_ -match "^DISCORD_WEBHOOK_URL=" }
    if ($webhookLine) {
        $webhookUrl = $webhookLine -replace "^DISCORD_WEBHOOK_URL=", ""
    }
}

$Action  = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -WindowStyle Hidden -File `"$Script`" -WebhookUrl `"$webhookUrl`""

$Trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 10) -Once -At (Get-Date)

$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 2) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -RunLevel Highest `
    -Force

Write-Host "Watchdog registered: $TaskName — runs every 10 minutes"
Write-Host "To unregister: Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
