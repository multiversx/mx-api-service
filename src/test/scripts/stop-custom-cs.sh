#!/usr/bin/env bash
set -euo pipefail

# Best-effort stop of locally started custom ChainSimulator and Notifier

log() { printf "[stop-custom-cs] %s\n" "$*"; }

# Attempt to kill chainsimulator started via setup-simulator-and-notifier.sh
if pgrep -f "/cmd/chainsimulator/chainsimulator" >/dev/null 2>&1; then
  log "Stopping chainsimulator..."
  pkill -f "/cmd/chainsimulator/chainsimulator" || true
  sleep 1
fi

# Attempt to stop notifier started via `make run` (binary name typically 'notifier')
if pgrep -f "mx-chain-notifier-go" >/dev/null 2>&1; then
  log "Stopping notifier (by repo path)..."
  pkill -f "mx-chain-notifier-go" || true
  sleep 1
elif pgrep -f "/notifier" >/dev/null 2>&1; then
  log "Stopping notifier (by binary)..."
  pkill -f "/notifier" || true
  sleep 1
fi

log "Done"

