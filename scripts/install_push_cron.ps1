# Registers push_umbrella.ps1 as a nightly Task Scheduler job.
# Run once. Requires the GitHub remote to be set up first (see setup_github_remote.md).

$TaskName  = "10RG_NightlyPush"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script    = Join-Path $ScriptDir "push_umbrella.ps1"

$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -WindowStyle Hidden -File `"$Script`""

# Nightly at 11pm ET
$Trigger = New-ScheduledTaskTrigger -Daily -At "23:00"

$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -StartWhenAvailable $true

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -RunLevel Highest `
    -Force

Write-Host "Registered: $TaskName — runs nightly at 11pm ET"
Write-Host "To unregister: Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
Write-Host ""
Write-Host "PREREQUISITE: GitHub remote must be set up first."
Write-Host "See: $(Join-Path $ScriptDir 'setup_github_remote.md')"
