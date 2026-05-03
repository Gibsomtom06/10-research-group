# launch_daemons.ps1 — start all trading-shadow background daemons
#
# Run from the trading-shadow root directory:
#   .\scripts\launch_daemons.ps1
#
# What this starts:
#   1. news_scout.py    — stock headlines + macro pulse, every 10 min
#   2. social_scout.py  — Reddit/Stocktwits sentiment, every 10 min
#   3. loop_paper.py    — Claude + Shadow + social_media_trader, every 30 min (market hours)
#
# Logs go to logs/  (created if missing)
# Each daemon gets its own log file with unbuffered Python output (-u).
# Check logs with:   Get-Content logs\news_scout.log -Wait
#                    Get-Content logs\loop_paper.log -Wait

$root = $PSScriptRoot | Split-Path -Parent
$venv = Join-Path $root ".venv\Scripts\python.exe"
$logsDir = Join-Path $root "logs"

if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

Write-Host "[launch] Root: $root"
Write-Host "[launch] Python: $venv"

# Stop any existing instances of these scripts first (so re-running is safe)
foreach ($scriptName in @("news_scout.py", "social_scout.py", "loop_paper.py")) {
    $procs = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*$scriptName*"
    }
    if ($procs) {
        $procs | Stop-Process -Force
        Write-Host "[launch] Stopped existing $scriptName process(es)"
    }
}

$env:MODE = "paper"

# 1. News scout — headlines + macro pulse
Start-Process -FilePath $venv `
    -ArgumentList "-u scripts\news_scout.py" `
    -WorkingDirectory $root `
    -RedirectStandardOutput (Join-Path $logsDir "news_scout.log") `
    -RedirectStandardError  (Join-Path $logsDir "news_scout.err") `
    -WindowStyle Hidden
Write-Host "[launch] Started news_scout.py"

Start-Sleep -Seconds 2

# 2. Social scout — Reddit/Stocktwits sentiment
Start-Process -FilePath $venv `
    -ArgumentList "-u scripts\social_scout.py" `
    -WorkingDirectory $root `
    -RedirectStandardOutput (Join-Path $logsDir "social_scout.log") `
    -RedirectStandardError  (Join-Path $logsDir "social_scout.err") `
    -WindowStyle Hidden
Write-Host "[launch] Started social_scout.py"

Start-Sleep -Seconds 2

# 3. Trading loop — paper mode, tracks A + B
Start-Process -FilePath $venv `
    -ArgumentList "-u scripts\loop_paper.py" `
    -WorkingDirectory $root `
    -RedirectStandardOutput (Join-Path $logsDir "loop_paper.log") `
    -RedirectStandardError  (Join-Path $logsDir "loop_paper.err") `
    -WindowStyle Hidden
Write-Host "[launch] Started loop_paper.py"

Write-Host ""
Write-Host "All daemons running. Monitor with:"
Write-Host "  Get-Content $logsDir\loop_paper.log -Wait"
Write-Host "  Get-Content $logsDir\news_scout.log -Wait"
Write-Host ""
Write-Host "Run data fetchers once on startup:"
Write-Host "  $venv -m scripts.crypto_signals"
Write-Host "  $venv scripts\fetch_trends.py"
Write-Host "  $venv scripts\research_signals.py"
Write-Host "  $venv scripts\fetch_13f.py"
