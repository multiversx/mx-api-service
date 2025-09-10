#!/usr/bin/env bash

set -euo pipefail

# This script clones mx-chain-simulator-go and mx-chain-notifier-go, pins specific
# dependency commits for the simulator, builds it, adjusts config files, starts
# the notifier, and verifies the HTTP endpoint returns 200.

# Requirements: git, go, make, curl, awk

SIM_REPO_URL="https://github.com/multiversx/mx-chain-simulator-go"
SIM_DIR="${SIM_DIR:-mx-chain-simulator-go}"

NOTIFIER_REPO_URL="https://github.com/multiversx/mx-chain-notifier-go"
NOTIFIER_BRANCH="${NOTIFIER_BRANCH:-state-accesses-per-account}"
NOTIFIER_DIR="${NOTIFIER_DIR:-mx-chain-notifier-go}"

# Commit pins
CHAIN_GO_COMMIT="757f2de643d3d69494179cd899d92b31edfbb64a"        # github.com/multiversx/mx-chain-go
CHAIN_CORE_GO_COMMIT="60b4de5d3d1bb3f2a34c764f8cf353c5af8c3194"   # github.com/multiversx/mx-chain-core-go

# Endpoint check
VERIFY_URL="${VERIFY_URL:-http://localhost:8085/network/status/0}"
VERIFY_TIMEOUT_SEC="${VERIFY_TIMEOUT_SEC:-120}"

log() { printf "[+] %s\n" "$*" >&2; }
err() { printf "[!] %s\n" "$*" >&2; }

need() {
  command -v "$1" >/dev/null 2>&1 || { err "Missing dependency: $1"; exit 1; }
}

need git
need go
need make
need curl
need awk

clone_or_update() {
  local repo_url="$1" dir="$2" branch_opt="${3:-}"
  if [[ -d "$dir/.git" ]]; then
    log "Updating existing repo: $dir"
    git -C "$dir" fetch --all --tags --prune
    if [[ -n "$branch_opt" ]]; then
      git -C "$dir" checkout "$branch_opt"
      git -C "$dir" pull --ff-only origin "$branch_opt" || true
    fi
  else
    log "Cloning $repo_url into $dir ${branch_opt:+(branch $branch_opt)}"
    if [[ -n "$branch_opt" ]]; then
      git clone --single-branch -b "$branch_opt" "$repo_url" "$dir"
    else
      git clone "$repo_url" "$dir"
    fi
  fi
}

pin_go_deps() {
  local module_dir="$1"
  pushd "$module_dir" >/dev/null
  log "Pinning dependencies in $(pwd)"
  # Pin exact commits using go get
  GOFLAGS=${GOFLAGS:-} \
  go get \
    github.com/multiversx/mx-chain-go@"$CHAIN_GO_COMMIT" \
    github.com/multiversx/mx-chain-core-go@"$CHAIN_CORE_GO_COMMIT"

  # Ensure module graph is clean
  go mod tidy
  popd >/dev/null
}

build_chainsimulator() {
  local module_dir="$1"
  pushd "$module_dir" >/dev/null
  log "Building chainsimulator binary"
  go build -v ./cmd/chainsimulator
  popd >/dev/null
}

dummy_run_generate_configs() {
  local module_dir="$1"
  local cmd_dir="$module_dir/cmd/chainsimulator"
  pushd "$cmd_dir" >/dev/null
  log "Dummy run to fetch/generate configs (fetch-configs-and-close)"
  # Build binary here so relative ./config paths resolve correctly
  go build -v .
  ./chainsimulator --fetch-configs-and-close
  popd >/dev/null
}

patch_external_toml() {
  local module_dir="$1"
  local toml_path="$module_dir/cmd/chainsimulator/config/node/config/external.toml"
  if [[ ! -f "$toml_path" ]]; then
    err "Config file not found: $toml_path"
    exit 1
  fi
  log "Patching HostDriversConfig in $toml_path (Enabled=true, MarshallerType=\"gogo protobuf\")"
  local tmp
  tmp="$(mktemp)"
  awk '
    BEGIN { inside=0 }
    /^\[\[HostDriversConfig\]\]/ { inside=1; print; next }
    /^\[/ { if (inside) inside=0 }
    {
      if (inside && $0 ~ /^[[:space:]]*Enabled[[:space:]]*=/) { $0="    Enabled = true" }
      if (inside && $0 ~ /^[[:space:]]*MarshallerType[[:space:]]*=/) { $0="    MarshallerType = \"gogo protobuf\"" }
      print
    }
  ' "$toml_path" > "$tmp" && mv "$tmp" "$toml_path"
}

enable_ws_connector() {
  local notifier_dir="$1"
  local toml_path="$notifier_dir/cmd/notifier/config/config.toml"
  if [[ ! -f "$toml_path" ]]; then
    err "Notifier config not found: $toml_path"
    exit 1
  fi
  log "Enabling WebSocketConnector in $toml_path"
  local tmp
  tmp="$(mktemp)"
  awk '
    BEGIN { inside=0 }
    /^\[WebSocketConnector\]/ { inside=1; print; next }
    /^\[/ { if (inside) inside=0 }
    {
      if (inside && $0 ~ /^[[:space:]]*Enabled[[:space:]]*=/) { $0="Enabled = true" }
      print
    }
  ' "$toml_path" > "$tmp" && mv "$tmp" "$toml_path"
}

start_notifier() {
  local notifier_dir="$1"
  pushd "$notifier_dir" >/dev/null
  printf "[+] %s\n" "Starting notifier via 'make run' in background" >&2
  # Run in background, redirect logs
  nohup make run > notifier.out 2>&1 &
  local pid=$!
  popd >/dev/null
  echo "$pid"
}

start_chainsimulator() {
  local module_dir="$1"
  local cmd_dir="$module_dir/cmd/chainsimulator"
  pushd "$cmd_dir" >/dev/null
  printf "[+] %s\n" "Starting chainsimulator in background" >&2
  # Build if missing
  if [[ ! -x ./chainsimulator ]]; then
    go build -v .
  fi
  nohup ./chainsimulator > chainsimulator.out 2>&1 &
  local pid=$!
  popd >/dev/null
  echo "$pid"
}

wait_for_http_200() {
  local url="$1" timeout_sec="$2"
  log "Waiting for 200 from $url (timeout ${timeout_sec}s)"
  local start_ts now status code
  start_ts=$(date +%s)
  while true; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
    if [[ "$code" == "200" ]]; then
      log "Received HTTP 200 from $url"
      return 0
    fi
    now=$(date +%s)
    if (( now - start_ts > timeout_sec )); then
      err "Timeout waiting for HTTP 200 from $url (last code: $code)"
      return 1
    fi
    sleep 2
  done
}

main() {
  # 1) Clone simulator
  clone_or_update "$SIM_REPO_URL" "$SIM_DIR"

  # 2) Pin deps to requested commits
  pin_go_deps "$SIM_DIR"

  # 3) Build chainsimulator
  build_chainsimulator "$SIM_DIR"

  # 4) Dummy run to ensure configs are materialized on disk
  dummy_run_generate_configs "$SIM_DIR"

  # 5) Patch external.toml HostDriversConfig
  patch_external_toml "$SIM_DIR"

  # 6) Clone notifier at branch
  clone_or_update "$NOTIFIER_REPO_URL" "$NOTIFIER_DIR" "$NOTIFIER_BRANCH"

  # 7) Enable WebSocketConnector in notifier config
  enable_ws_connector "$NOTIFIER_DIR"

  # 8) Start notifier first
  notifier_pid=$(start_notifier "$NOTIFIER_DIR")
  log "Notifier PID: $notifier_pid"

  # 9) Start chain simulator next
  chainsim_pid=$(start_chainsimulator "$SIM_DIR")
  log "ChainSimulator PID: $chainsim_pid"

  # 10) Verify HTTP 200 after both are up
  if ! wait_for_http_200 "$VERIFY_URL" "$VERIFY_TIMEOUT_SEC"; then
    err "Verification failed. See $NOTIFIER_DIR/notifier.out for logs."
    exit 1
  fi

  log "All done. Notifier (PID $notifier_pid) and ChainSimulator (PID $chainsim_pid) are running."
  log "Notifier logs: $NOTIFIER_DIR/notifier.out"
  log "ChainSimulator logs: $SIM_DIR/cmd/chainsimulator/chainsimulator.out"
}

main "$@"
