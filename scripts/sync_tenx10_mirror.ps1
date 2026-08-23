# Sync the OneDrive tenx10-platform mirror with GitHub.
# The active dev clone is C:\Users\slash\Projects\tenx10\ (off OneDrive).
# This OneDrive copy exists as a read-only mirror so the umbrella's
# gitlink stays consistent and other workspaces can browse the source.
#
# Run nightly via Task Scheduler, or manually before reading code in
# the OneDrive copy.

$ErrorActionPreference = 'Stop'
$mirror = 'C:\Users\slash\OneDrive\10 Research Group\products\tenx10-platform'

Push-Location $mirror
try {
    & git fetch origin --quiet
    & git pull --ff-only origin master
    $head = (& git rev-parse --short HEAD).Trim()
    Write-Host "tenx10-platform mirror synced - HEAD now $head"
} catch {
    Write-Warning "Mirror sync failed: $_"
    Write-Warning "Fix manually with: cd '$mirror'; git status"
    exit 1
} finally {
    Pop-Location
}
