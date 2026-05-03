# trading-shadow paper loop watchdog
# Runs every 10 minutes via Task Scheduler.
# Alerts to Discord if heartbeat is stale (>45 min) or missing.
# Also sends a daily 8am ET "all-OK" ping so silence never means broken watchdog.

param(
    [string]$WebhookUrl = $env:DISCORD_WEBHOOK_URL
)

$HeartbeatFile = "$PSScriptRoot\..\data\.heartbeat_paper.txt"
$StaleLimitSeconds = 2700  # 45 minutes — loop sleeps 30min, 15min buffer
$ET = [System.TimeZoneInfo]::FindSystemTimeZoneById("Eastern Standard Time")
$NowET = [System.TimeZoneInfo]::ConvertTimeFromUtc([datetime]::UtcNow, $ET)

function Send-DiscordAlert {
    param([string]$Message)
    if (-not $WebhookUrl) {
        Write-Host "ALERT (no webhook): $Message"
        return
    }
    $body = @{ content = $Message } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri $WebhookUrl -Method Post -ContentType "application/json" -Body $body | Out-Null
    } catch {
        Write-Host "Discord send failed: $_"
    }
}

# --- Daily 8am OK ping ---
if ($NowET.Hour -eq 8 -and $NowET.Minute -lt 10) {
    if (Test-Path $HeartbeatFile) {
        $lastRaw = Get-Content $HeartbeatFile -Raw
        try {
            $lastUtc = [datetime]::Parse($lastRaw).ToUniversalTime()
            $ageSeconds = ([datetime]::UtcNow - $lastUtc).TotalSeconds
            $ageMin = [math]::Round($ageSeconds / 60, 1)
            Send-DiscordAlert "trading-shadow heartbeat OK — last tick ${ageMin}min ago"
        } catch {
            Send-DiscordAlert "trading-shadow: heartbeat file exists but couldn't parse timestamp"
        }
    } else {
        Send-DiscordAlert "trading-shadow: no heartbeat file at 8am ET — process may never have started"
    }
    exit 0
}

# --- Stale / missing check ---
if (-not (Test-Path $HeartbeatFile)) {
    Send-DiscordAlert "ALERT: trading-shadow heartbeat file missing — process is not running or data/ dir is gone"
    exit 1
}

$lastRaw = Get-Content $HeartbeatFile -Raw
try {
    $lastUtc = [datetime]::Parse($lastRaw).ToUniversalTime()
} catch {
    Send-DiscordAlert "ALERT: trading-shadow heartbeat file unreadable — content: $lastRaw"
    exit 1
}

$ageSeconds = ([datetime]::UtcNow - $lastUtc).TotalSeconds

if ($ageSeconds -gt $StaleLimitSeconds) {
    $ageMins = [math]::Round($ageSeconds / 60, 1)
    Send-DiscordAlert "ALERT: trading-shadow heartbeat stale (${ageMins} min) — process may have crashed. Check Task Scheduler or restart start_paper.bat"
    exit 1
}

# All good — silent exit (don't spam Discord on every 10-min check)
exit 0
