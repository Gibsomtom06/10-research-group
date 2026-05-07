#!/usr/bin/env bash
# launch-a1-when-available.sh
#
# Tries to launch the Always Free Oracle Cloud Ampere A1 instance (4 OCPU / 24 GB)
# in any Ashburn availability domain. Loops until success.
#
# Why: Oracle's Always Free A1 capacity in us-ashburn-1 is famously tight; "Out of host
# capacity" is the standard error. The fix is to retry every few minutes until a slot
# opens. Most users get their box within 24-72h of polite retries.
#
# Usage:
#   bash scripts/oracle/launch-a1-when-available.sh
#
# Stop with Ctrl+C. Safe to leave running indefinitely — it only LAUNCHES, never deletes.
#
# Requires: oci CLI configured at ~/.oci/config (already present 2026-05-06).

set -e

TENANCY=ocid1.tenancy.oc1..aaaaaaaa6imvb6jzhqmzvrd4lo62xy6ruja7rlippoogfsu4cxhhvshqapha
SUBNET=ocid1.subnet.oc1.iad.aaaaaaaao65z5cgny2ajndnmidqxayyq7yecbujzkftnkvaec7mrwhxn6hvq
IMAGE=ocid1.image.oc1.iad.aaaaaaaas3q57pjdbmj46ykc5djtazakxanfvvadw43iuyguiue6ruvjd6yq  # Canonical Ubuntu 22.04 aarch64 (refresh quarterly)
SSH_KEY="${SSH_PUB_KEY:-$HOME/.ssh/oracle_ashburn.pub}"
DISPLAY_NAME=tenx10-dev-a1
SHAPE=VM.Standard.A1.Flex
SHAPE_CONFIG='{"ocpus": 4, "memoryInGBs": 24}'
ADS=("XawR:US-ASHBURN-AD-1" "XawR:US-ASHBURN-AD-2" "XawR:US-ASHBURN-AD-3")
SLEEP_SECONDS=180  # 3 minutes between full sweeps. Don't hammer Oracle's API.

if [[ ! -f "$SSH_KEY" ]]; then
  echo "ERROR: SSH public key not found at $SSH_KEY" >&2
  exit 1
fi

attempt=0
while true; do
  attempt=$((attempt + 1))
  echo "=== Attempt $attempt at $(date '+%Y-%m-%d %H:%M:%S %Z') ==="
  for AD in "${ADS[@]}"; do
    OUT=$(oci compute instance launch \
      --availability-domain "$AD" \
      --compartment-id "$TENANCY" \
      --shape "$SHAPE" \
      --shape-config "$SHAPE_CONFIG" \
      --image-id "$IMAGE" \
      --subnet-id "$SUBNET" \
      --display-name "$DISPLAY_NAME" \
      --ssh-authorized-keys-file "$SSH_KEY" \
      --assign-public-ip true \
      --wait-for-state RUNNING \
      --max-wait-seconds 600 \
      2>&1) || true
    if echo "$OUT" | grep -q '"lifecycle-state": "RUNNING"'; then
      echo "✅ A1 launched in $AD"
      INSTANCE_ID=$(echo "$OUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d['data']['id'])")
      echo "instance-id: $INSTANCE_ID"
      VNIC=$(oci compute instance list-vnics --instance-id "$INSTANCE_ID" --output json 2>&1)
      PUB=$(echo "$VNIC" | python -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0].get('public-ip','?'))")
      PRIV=$(echo "$VNIC" | python -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0].get('private-ip','?'))")
      echo "public-ip:  $PUB"
      echo "private-ip: $PRIV"
      echo ""
      echo "Add to ~/.ssh/config:"
      echo "  Host tenx10-a1"
      echo "    HostName $PUB"
      echo "    User ubuntu"
      echo "    IdentityFile ~/.ssh/oracle_ashburn"
      exit 0
    elif echo "$OUT" | grep -q "Out of host capacity"; then
      echo "  $AD: out of capacity"
    else
      echo "  $AD: unexpected"
      echo "$OUT" | head -10
    fi
  done
  echo "All ADs full. Sleeping ${SLEEP_SECONDS}s..."
  sleep "$SLEEP_SECONDS"
done
