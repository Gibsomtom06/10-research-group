# One-time setup: create the standalone off-OneDrive tenx10-platform dev
# clone on THIS machine. Run once per machine (laptop already has one).
#
# Why this exists: git + OneDrive's real-time sync fight over the same
# files (stale .git/index.lock, "Permission denied" on worktree cleanup,
# git-index-*-conflictcopy files). The fix is to keep active dev off
# OneDrive entirely. See ../products/TENX10_PLATFORM_MIRROR_README.md.
#
# This script is idempotent - safe to re-run. It will not touch the
# OneDrive copy (read-only mirror, synced separately by
# sync_tenx10_mirror.ps1).

$ErrorActionPreference = 'Stop'

$standalone = 'C:\Users\Slash\Projects\tenx10'
$mirror     = 'C:\Users\Slash\OneDrive\10 Research Group\products\tenx10-platform'
$remote     = 'https://github.com/Gibsomtom06/tenx10.git'

if (Test-Path $standalone) {
    Write-Host "Standalone clone already exists at $standalone - nothing to do."
    Write-Host "(If it's broken, remove the folder and re-run this script.)"
    exit 0
}

Write-Host "Cloning $remote to $standalone ..."
New-Item -ItemType Directory -Force -Path (Split-Path $standalone) | Out-Null
& git clone $remote $standalone
if ($LASTEXITCODE -ne 0) { throw "git clone failed" }

Write-Host "Copying local config from the OneDrive mirror (secrets never leave this machine) ..."
New-Item -ItemType Directory -Force -Path (Join-Path $standalone '.vercel') | Out-Null
foreach ($f in @('.env.local', '.env.production.local')) {
    $src = Join-Path $mirror $f
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $standalone $f) -Force
        Write-Host "  copied $f"
    } else {
        Write-Warning "  $f not found in mirror - copy it manually before running the app"
    }
}
$vercelSrc = Join-Path $mirror '.vercel\project.json'
if (Test-Path $vercelSrc) {
    Copy-Item $vercelSrc (Join-Path $standalone '.vercel\project.json') -Force
    Write-Host "  copied .vercel/project.json"
}

Write-Host "Installing dependencies ..."
Push-Location $standalone
try {
    & npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
} finally {
    Pop-Location
}

Write-Host "Registering the nightly mirror-sync scheduled task ..."
$taskName = 'sync_tenx10_mirror'
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Write-Host "  scheduled task '$taskName' already exists - leaving it alone"
} else {
    $action   = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -File "C:\Users\Slash\OneDrive\10 Research Group\scripts\sync_tenx10_mirror.ps1"'
    $trigger  = New-ScheduledTaskTrigger -Daily -At 3:00AM
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings `
        -Description 'Fast-forwards the OneDrive tenx10-platform read-only mirror from GitHub.' -Force | Out-Null
    Write-Host "  registered '$taskName' (daily 3am)"
}

Write-Host ""
Write-Host "Done. Open C:\Users\Slash\Projects\tenx10\ for tenx10-platform work on this machine."
Write-Host "Never edit or commit inside the OneDrive copy - it's a read-only mirror now."
