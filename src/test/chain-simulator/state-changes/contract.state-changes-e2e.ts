import axios from 'axios';
import { config } from '../config/env.config';
import { ChainSimulatorUtils } from '../utils/test.utils';

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function pickField(payload: any, field: string): any {
  if (!payload || typeof payload !== 'object') return undefined;
  if (payload[field] !== undefined) return payload[field];
  if (payload.data && payload.data[field] !== undefined) return payload.data[field];
  if (payload.data && payload.data.account && payload.data.account[field] !== undefined) return payload.data.account[field];
  return undefined;
}

async function fetchAccount(baseUrl: string, address: string): Promise<any> {
  for (let i = 0; i < 45; i++) {
    // Read straight from gateway proxy to avoid indexer/depository lag
    const resp = await axios.get(`${baseUrl}/address/${address}`).catch(() => undefined);
    const acc = resp?.data;
    if (acc) return acc;
    await sleep(1000);
  }
  throw new Error(`Could not fetch account ${address}`);
}

async function fetchNonce(baseUrl: string, address: string): Promise<number> {
  for (let i = 0; i < 45; i++) {
    // Use the direct nonce route exposed by the API (no /proxy prefix)
    const resp = await axios.get(`${baseUrl}/address/${address}/nonce`).catch(() => undefined);
    const n = resp?.data?.data?.nonce;
    if (typeof n === 'number') return n;
    await sleep(1000);
  }
  throw new Error(`Could not fetch nonce for ${address}`);
}

async function fetchMetaNonce(baseUrl: string): Promise<number> {
  for (let i = 0; i < 45; i++) {
    const resp = await axios.get(`${baseUrl}/network/status/4294967295`).catch(() => undefined);
    const n = resp?.data?.data?.status?.erd_nonce;
    if (typeof n === 'number') return n;
    await sleep(1000);
  }
  throw new Error('Could not fetch meta-chain nonce');
}

describe('State changes: smart contract deploy visibility', () => {
  const api = config.apiServiceUrl;
  const deployer = config.aliceAddress;

  it('Deploys ping-pong contract and exposes codeHash/rootHash; meta nonce increases', async () => {
    const startMeta = await fetchMetaNonce(api);
    const startNonce = await fetchNonce(api, deployer);

    const scAddress = await ChainSimulatorUtils.deployPingPongSc(deployer);

    // Wait until /accounts reflects deployment
    let account: any = null;
    for (let i = 0; i < 45; i++) {
      account = await fetchAccount(api, scAddress).catch(() => undefined);
      const codeHash = pickField(account, 'codeHash');
      const rootHash = pickField(account, 'rootHash');
      if (codeHash && codeHash !== '' && rootHash && rootHash !== '') break;
      await sleep(1000);
    }

    const codeHash = pickField(account, 'codeHash');
    const rootHash = pickField(account, 'rootHash');
    expect(typeof codeHash).toBe('string');
    expect(codeHash.length).toBeGreaterThan(0);
    expect(typeof rootHash).toBe('string');
    expect(rootHash.length).toBeGreaterThan(0);

    // Nonce of deployer should increase
    let endNonce = startNonce;
    for (let i = 0; i < 30; i++) {
      endNonce = await fetchNonce(api, deployer);
      if (endNonce >= startNonce + 1) break;
      await sleep(1000);
    }
    expect(endNonce).toBeGreaterThanOrEqual(startNonce + 1);

    // Meta-chain nonce should advance as well
    let endMeta = startMeta;
    for (let i = 0; i < 30; i++) {
      endMeta = await fetchMetaNonce(api);
      if (endMeta > startMeta) break;
      await sleep(1000);
    }
    expect(endMeta).toBeGreaterThan(startMeta);
  });
});
