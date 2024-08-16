import http from 'k6/http';
import { sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = 'http://localhost:3001';

const tokensApiCallTrened = new Trend('tokens_api_call_trend', true);
const nodesApiCallTrened = new Trend('nodes_api_call_trend', true);

export const options = {
    scenarios: {
        tokens: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            gracefulStop: '0s',
            exec: 'tokens',
        },
        nodes: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            gracefulStop: '0s',
            exec: 'nodes',
        },
    },
    discardResponseBodies: true,
};

export function tokens() {
    const response = http.get(`${BASE_URL}/tokens`);
    tokensApiCallTrened.add(response.timings.duration);
}

export function nodes() {
    const response = http.get(`${BASE_URL}/nodes`);
    nodesApiCallTrened.add(response.timings.duration);
}

export function handleSummary(data) {
  return {
    'k6/output/summary.json': JSON.stringify(data),
  };
}