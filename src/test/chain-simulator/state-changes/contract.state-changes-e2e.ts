import axios from 'axios';
import { config } from '../config/env.config';
import { ChainSimulatorUtils } from '../utils/test.utils';

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function fetchAccount(baseUrl: string, address: string): Promise<any> {
  for (let i = 0; i < 45; i++) {
    const resp = await axios.get(`${baseUrl}/accounts/${address}`).catch(() => undefined);
    const acc = resp?.data;
    if (acc) return acc;
    await sleep(1000);
  }
  throw new Error(`Could not fetch account ${address}`);
}

async function fetchNonce(baseUrl: string, address: string): Promise<number> {
  for (let i = 0; i < 45; i++) {
    const resp = await axios.get(`${baseUrl}/proxy/address/${address}/nonce`).catch(() => undefined);
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
      const codeHash = account?.codeHash ?? account?.data?.codeHash;
      const rootHash = account?.rootHash ?? account?.data?.rootHash;
      if (codeHash && codeHash !== '' && rootHash && rootHash !== '') break;
      await sleep(1000);
    }

    const codeHash = account?.codeHash ?? account?.data?.codeHash;
    const rootHash = account?.rootHash ?? account?.data?.rootHash;
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
