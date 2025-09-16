import fetch from 'node-fetch';
import { config } from '../config/env.config';

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function getJson(url: string): Promise<any | undefined> {
  for (let i = 0; i < 30; i++) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (_) {
      // ignore and retry
    }
    await sleep(1000);
  }
  return undefined;
}

function pickBalance(payload: any): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  // Primary shape used by CI shell script: top-level balance
  if (typeof payload.balance === 'string') return payload.balance;
  if (typeof payload.balance === 'number') return String(payload.balance);
  // Fallbacks in case the shape is wrapped
  if (payload.data) {
    if (typeof payload.data.balance === 'string') return payload.data.balance;
    if (typeof payload.data.balance === 'number') return String(payload.data.balance);
    if (payload.data.account && payload.data.account.balance) {
      const b = payload.data.account.balance;
      if (typeof b === 'string') return b;
      if (typeof b === 'number') return String(b);
    }
  }
  return undefined;
}

async function fetchBalance(baseUrl: string, address: string): Promise<string> {
  const url = `${baseUrl}/accounts/${address}`;
  const payload = await getJson(url);
  if (!payload) throw new Error(`No payload from ${url}`);
  const bal = pickBalance(payload);
  if (!bal) throw new Error(`No balance field in response from ${url}`);
  return bal;
}

async function fetchBalanceV2(baseUrl: string, address: string): Promise<string> {
  const url = `${baseUrl}/v2/accounts/${address}`;
  const payload = await getJson(url);
  if (!payload) throw new Error(`No payload from ${url}`);
  const bal = pickBalance(payload);
  if (!bal) throw new Error(`No balance field in v2 response from ${url}`);
  return bal;
}

describe('State changes: balances parity (v1 vs v2)', () => {
  const base = config.apiServiceUrl;
  const alice = config.aliceAddress;
  const bob = config.bobAddress;

  it('Alice balance matches between v1 and v2', async () => {
    const v1 = await fetchBalance(base, alice);
    const v2 = await fetchBalanceV2(base, alice);
    expect(v1).toBe(v2);
  });

  it('Bob balance matches between v1 and v2', async () => {
    const v1 = await fetchBalance(base, bob);
    const v2 = await fetchBalanceV2(base, bob);
    expect(v1).toBe(v2);
  });
});
