#!/usr/bin/env bash
set -euo pipefail

# Configurable via env
RABBIT_HOST="${RABBIT_HOST:-127.0.0.1}"
RABBIT_MGMT_PORT="${RABBIT_MGMT_PORT:-15672}"
RABBIT_USER="${RABBIT_USER:-guest}"
RABBIT_PASS="${RABBIT_PASS:-guest}"
EXCHANGE_NAME="${EXCHANGE_NAME:-state_accesses}"
EXCHANGE_TYPE="${EXCHANGE_TYPE:-fanout}"
QUEUE_NAME="${QUEUE_NAME:-state_accesses_test}"
ROUTING_KEY="${ROUTING_KEY:-#}"

base="http://${RABBIT_HOST}:${RABBIT_MGMT_PORT}/api"

echo "[rabbit-setup] Waiting for RabbitMQ management API at ${base} ..."
for i in {1..120}; do
  if curl -sf -u "${RABBIT_USER}:${RABBIT_PASS}" "${base}/overview" >/dev/null; then
    break
  fi
  sleep 1
done

http_code() {
  curl -s -o /dev/null -w "%{http_code}" -u "${RABBIT_USER}:${RABBIT_PASS}" "$1"
}

echo "[rabbit-setup] Ensuring exchange '${EXCHANGE_NAME}' exists (type='${EXCHANGE_TYPE}')"
ex_code=$(http_code "${base}/exchanges/%2f/${EXCHANGE_NAME}")
if [ "${ex_code}" != "200" ]; then
  out=$(curl -s -u "${RABBIT_USER}:${RABBIT_PASS}" -H "content-type: application/json" \
    -w "\n%{http_code}" \
    -X PUT "${base}/exchanges/%2f/${EXCHANGE_NAME}" \
    -d '{"type":"'"${EXCHANGE_TYPE}"'","durable":true,"auto_delete":false,"internal":false,"arguments":{}}')
  code=$(echo "$out" | tail -n1)
  if [ "$code" != "201" ] && [ "$code" != "204" ]; then
    echo "[rabbit-setup] Failed to create exchange, status: $code" >&2
    echo "$out" | head -n -1 >&2
    exit 1
  fi
else
  echo "[rabbit-setup] Exchange already exists"
fi

echo "[rabbit-setup] Ensuring queue '${QUEUE_NAME}' exists"
q_code=$(http_code "${base}/queues/%2f/${QUEUE_NAME}")
if [ "${q_code}" != "200" ]; then
  out=$(curl -s -u "${RABBIT_USER}:${RABBIT_PASS}" -H "content-type: application/json" \
    -w "\n%{http_code}" \
    -X PUT "${base}/queues/%2f/${QUEUE_NAME}" \
    -d '{"durable":true,"auto_delete":false,"arguments":{}}')
  code=$(echo "$out" | tail -n1)
  if [ "$code" != "201" ] && [ "$code" != "204" ]; then
    echo "[rabbit-setup] Failed to create queue, status: $code" >&2
    echo "$out" | head -n -1 >&2
    exit 1
  fi
else
  echo "[rabbit-setup] Queue already exists"
fi

echo "[rabbit-setup] Ensuring binding ${EXCHANGE_NAME} -> ${QUEUE_NAME} (routing '${ROUTING_KEY}')"
out=$(curl -s -u "${RABBIT_USER}:${RABBIT_PASS}" -H "content-type: application/json" \
  "${base}/bindings/%2f/e/${EXCHANGE_NAME}/q/${QUEUE_NAME}")
if [ "${out}" = "[]" ] || [ -z "${out}" ]; then
  out=$(curl -s -u "${RABBIT_USER}:${RABBIT_PASS}" -H "content-type: application/json" \
    -w "\n%{http_code}" \
    -X POST "${base}/bindings/%2f/e/${EXCHANGE_NAME}/q/${QUEUE_NAME}" \
    -d "{\"routing_key\":\"${ROUTING_KEY}\",\"arguments\":{}}")
  code=$(echo "$out" | tail -n1)
  if [ "$code" != "201" ] && [ "$code" != "204" ]; then
    echo "[rabbit-setup] Failed to create binding, status: $code" >&2
    echo "$out" | head -n -1 >&2
    exit 1
  fi
else
  echo "[rabbit-setup] Binding already exists"
fi

echo "[rabbit-setup] Done"
