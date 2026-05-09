#!/usr/bin/env bash
# vm-sync.sh — runs on the AMD VM (tenx10-dev-amd) every 5 minutes.
#
# Pulls origin/master, hard-resets the working tree, and restarts the
# chat-bridge service if its source changed. Intended to make the VM an
# always-current mirror of the umbrella repo for services that run there
# (Discord chat bridge, Oracle A1 launcher, future agents).
#
# Lives at ~/dev/bin/vm-sync.sh on the VM (outside the repo so a
# `git reset --hard` can't wipe it). Wired up via /etc/systemd/system/vm-sync.service
# + vm-sync.timer (OnUnitActiveSec=5min).
#
# Read-only deploy key: tenx10-dev-amd (read-only) on Gibsomtom06/10-research-group.
# To make the VM able to push back, swap to a read-write key — but mind the
# blast radius.
set -e
cd "$HOME/dev/10-research-group"

BEFORE=$(git rev-parse HEAD 2>/dev/null || echo none)
git fetch --quiet origin master
AFTER=$(git rev-parse origin/master)

if [[ "$BEFORE" == "$AFTER" ]]; then
  exit 0
fi

CHANGED=$(git diff --name-only "$BEFORE" "$AFTER" 2>/dev/null || echo "")
git reset --hard origin/master --quiet

# Restart chat bridge if its code (env file is gitignored, so won't appear here)
# changed.
if echo "$CHANGED" | grep -qE '^products/trading-shadow/scripts/chat_bridge\.py$'; then
  /usr/bin/systemctl restart chat-bridge.service \
    && echo "$(date -Iseconds) restarted chat-bridge after sync" >> "$HOME/dev/logs/vm-sync.log"
fi

echo "$(date -Iseconds) synced $BEFORE -> $AFTER ($(echo "$CHANGED" | wc -l) files)" >> "$HOME/dev/logs/vm-sync.log"
