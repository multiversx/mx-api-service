import http from 'k6/http';
import { sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = 'http://localhost:3001';

const accountsApiCallTrend = new Trend('accounts_http_req_duration', true);
const blocksApiCallTrend = new Trend('blocks_http_req_duration', true);
const mexPairsApiCallTrend = new Trend('mex_pairs_http_req_duration', true);
const mexTokensApiCallTrend = new Trend('mex_tokens_http_req_duration', true);
const mexFarmsApiCallTrend = new Trend('mex_farms_http_req_duration', true);
const nodesApiCallTrend = new Trend('nodes_http_req_duration', true);
const nodesAuctionsApiCallTrend = new Trend('nodes_auctions_http_req_duration', true);
const poolApiCallTrend = new Trend('pool_http_req_duration', true);
const tokensApiCallTrend = new Trend('tokens_http_req_duration', true);
const transactionsApiCallTrend = new Trend('transactions_http_req_duration', true);


function getScenarioDict(functionName) {
    return {
        executor: 'constant-vus',
        vus: 10,
        duration: '1m',
        gracefulStop: '0s',
        exec: functionName,
    }
}

export const options = {
    scenarios: {
        accounts: getScenarioDict('accounts'),
        blocks: getScenarioDict('blocks'),
        mexPairs: getScenarioDict('mexPairs'),
        mexTokens: getScenarioDict('mexTokens'),
        mexFarms: getScenarioDict('mexFarms'),
        nodes: getScenarioDict('nodes'),
        nodesAuctions: getScenarioDict('nodesAuctions'),
        pool: getScenarioDict('pool'),
        tokens: getScenarioDict('tokens'),
        transactions: getScenarioDict('transactions'),
    },
    discardResponseBodies: true,
};

export function accounts() {
    const response = http.get(`${BASE_URL}/accounts`);
    accountsApiCallTrend.add(response.timings.duration);
}

export function blocks() {
    const response = http.get(`${BASE_URL}/blocks`);
    blocksApiCallTrend.add(response.timings.duration);
}

export function mexPairs() {
    const response = http.get(`${BASE_URL}/mex/pairs`);
    mexPairsApiCallTrend.add(response.timings.duration);
}

export function mexTokens() {
    const response = http.get(`${BASE_URL}/mex/tokens`);
    mexTokensApiCallTrend.add(response.timings.duration);
}

export function mexFarms() {
    const response = http.get(`${BASE_URL}/mex/farms`);
    mexFarmsApiCallTrend.add(response.timings.duration);
}

export function nodes() {
    const response = http.get(`${BASE_URL}/nodes`);
    nodesApiCallTrend.add(response.timings.duration);
}

export function nodesAuctions() {
    const response = http.get(`${BASE_URL}/nodes/auctions`);
    nodesAuctionsApiCallTrend.add(response.timings.duration);
}

export function pool() {
    const response = http.get(`${BASE_URL}/pool`);
    poolApiCallTrend.add(response.timings.duration);
}

export function tokens() {
    const response = http.get(`${BASE_URL}/tokens`);
    tokensApiCallTrend.add(response.timings.duration);
}

export function transactions() {
    const response = http.get(`${BASE_URL}/transactions`);
    transactionsApiCallTrend.add(response.timings.duration);
}

export function handleSummary(data) {
  return {
    'k6/output/summary.json': JSON.stringify(data),
  };
}
