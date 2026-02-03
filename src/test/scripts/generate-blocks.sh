#!/usr/bin/env bash
set -euo pipefail

SIM_URL="${SIM_URL:-http://localhost:8085}"
BLOCKS="${BLOCKS:-10}"
TIMEOUT_SEC="${TIMEOUT_SEC:-120}"

echo "[generate-blocks] Waiting for simulator at ${SIM_URL} (timeout ${TIMEOUT_SEC}s)"
start=$(date +%s)
while true; do
  # Try a cheap HEAD on the base URL or GET on a likely health path
  if curl -s -o /dev/null -I "${SIM_URL}" || curl -s -o /dev/null "${SIM_URL}/network/status"; then
    break
  fi
  now=$(date +%s)
  if [ $((now-start)) -gt ${TIMEOUT_SEC} ]; then
    echo "[generate-blocks] Simulator not reachable at ${SIM_URL} within timeout" >&2
    exit 1
  fi
  sleep 2
done

echo "[generate-blocks] Generating ${BLOCKS} blocks at ${SIM_URL}"
curl --fail --silent --show-error --request POST \
  --url "${SIM_URL}/simulator/generate-blocks/${BLOCKS}" \
  --header 'Content-Type: application/json'
echo
