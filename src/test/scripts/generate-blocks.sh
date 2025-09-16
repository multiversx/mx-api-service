#!/usr/bin/env bash
set -euo pipefail

SIM_URL="${SIM_URL:-http://localhost:8085}"
BLOCKS="${BLOCKS:-10}"

echo "[generate-blocks] Generating ${BLOCKS} blocks at ${SIM_URL}"
curl --fail --silent --show-error --request POST \
  --url "${SIM_URL}/simulator/generate-blocks/${BLOCKS}" \
  --header 'Content-Type: application/json'
echo

