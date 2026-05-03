# Nightly auto-commit + push for the 10 Research Group umbrella repo.
# Register with Task Scheduler via install_push_cron.ps1 (see same folder).
# Does NOT auto-commit the tenx10-platform subdir — that has its own GitHub
# remote and commit discipline (no auto-commits on an active dev repo).

$UmbrellaRoot = Split-Path -Parent $PSScriptRoot

Set-Location $UmbrellaRoot

# Stage everything except what .gitignore excludes
git add -A

# Only commit if there are staged changes
$diff = git diff --cached --name-only
if ($diff) {
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "auto: nightly snapshot $stamp"
    Write-Host "Committed changes: $($diff.Count) files"
} else {
    Write-Host "No changes to commit."
}

# Push to origin (will fail gracefully if no remote — see setup_github_remote.md)
git push origin HEAD 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed — remote may not be set up yet. See scripts/setup_github_remote.md"
}
