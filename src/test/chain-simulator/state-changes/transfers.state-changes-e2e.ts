import axios from 'axios';
import fetch from 'node-fetch';
import { config } from '../config/env.config';
import { SendTransactionArgs, fundAddress, sendTransaction } from '../utils/chain.simulator.operations';

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function getJson(url: string): Promise<any | undefined> {
  for (let i = 0; i < 45; i++) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        return await resp.json();
      }
    } catch {
      // ignore and retry
    }
    await sleep(1000);
  }
  return undefined;
}

function pickBalance(payload: any): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  if (typeof payload.balance === 'string') return payload.balance;
  if (typeof payload.balance === 'number') return String(payload.balance);
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

async function fetchApiBalance(baseUrl: string, address: string): Promise<bigint> {
  const url = `${baseUrl}/accounts/${address}`;
  const payload = await getJson(url);
  if (!payload) throw new Error(`No payload from ${url}`);
  const bal = pickBalance(payload);
  if (!bal) throw new Error(`No balance field in response from ${url}`);
  return BigInt(bal);
}

async function fetchTxFeeFromSimulator(simUrl: string, txHash: string): Promise<bigint> {
  // Prefer explicit fee, fallback to gasUsed * gasPrice if needed
  for (let i = 0; i < 30; i++) {
    const resp = await axios.get(`${simUrl}/transaction/${txHash}?withResults=true`).catch(() => undefined);
    const tx = resp?.data?.data?.transaction;
    if (tx) {
      if (tx.fee) return BigInt(String(tx.fee));
      if (tx.gasUsed && (tx.gasPrice || tx.initialPaidFee)) {
        // gasPrice might be missing; initialPaidFee may be present. Use what we have.
        const gasUsed = BigInt(String(tx.gasUsed));
        if (tx.gasPrice) return gasUsed * BigInt(String(tx.gasPrice));
        if (tx.initialPaidFee) return BigInt(String(tx.initialPaidFee));
      }
    }
    await sleep(1000);
  }
  throw new Error(`Could not fetch fee for tx ${txHash}`);
}

describe('State changes: native EGLD transfers reflect in balances', () => {
  const sim = config.chainSimulatorUrl;
  const api = config.apiServiceUrl;
  const alice = config.aliceAddress;
  const bob = config.bobAddress;

  it('Alice -> Bob single transfer updates balances with exact fee accounting', async () => {
    // Ensure both parties have funds to simplify expectations
    await fundAddress(sim, alice);
    await fundAddress(sim, bob);

    const beforeAlice = await fetchApiBalance(api, alice);
    const beforeBob = await fetchApiBalance(api, bob);

    const amount = BigInt('1000000000000000000'); // 1 EGLD
    const txHash = await sendTransaction(new SendTransactionArgs({
      chainSimulatorUrl: sim,
      sender: alice,
      receiver: bob,
      value: amount.toString(),
      dataField: '',
    }));

    const fee = await fetchTxFeeFromSimulator(sim, txHash);

    const afterAlice = await fetchApiBalance(api, alice);
    const afterBob = await fetchApiBalance(api, bob);

    expect(afterAlice).toBe(beforeAlice - amount - fee);
    expect(afterBob).toBe(beforeBob + amount);
  });

  it('Round-trip transfers: Alice->Bob then Bob->Alice yields expected finals', async () => {
    await fundAddress(sim, alice);
    await fundAddress(sim, bob);

    const startAlice = await fetchApiBalance(api, alice);
    const startBob = await fetchApiBalance(api, bob);

    const amount1 = BigInt('2500000000000000000'); // 2.5 EGLD
    const hash1 = await sendTransaction(new SendTransactionArgs({
      chainSimulatorUrl: sim,
      sender: alice,
      receiver: bob,
      value: amount1.toString(),
      dataField: '',
    }));
    const fee1 = await fetchTxFeeFromSimulator(sim, hash1);

    const amount2 = BigInt('1700000000000000000'); // 1.7 EGLD
    const hash2 = await sendTransaction(new SendTransactionArgs({
      chainSimulatorUrl: sim,
      sender: bob,
      receiver: alice,
      value: amount2.toString(),
      dataField: '',
    }));
    const fee2 = await fetchTxFeeFromSimulator(sim, hash2);

    const endAlice = await fetchApiBalance(api, alice);
    const endBob = await fetchApiBalance(api, bob);

    // Alice: -amount1 - fee1 + amount2
    expect(endAlice).toBe(startAlice - amount1 - fee1 + amount2);
    // Bob:   +amount1 - fee2 - amount2
    expect(endBob).toBe(startBob + amount1 - fee2 - amount2);
  });

  it('Multiple sequential transfers accumulate correctly (Alice->Bob x3)', async () => {
    await fundAddress(sim, alice);
    await fundAddress(sim, bob);

    const startAlice = await fetchApiBalance(api, alice);
    const startBob = await fetchApiBalance(api, bob);

    const amounts = [
      BigInt('100000000000000000'),  // 0.1 EGLD
      BigInt('200000000000000000'),  // 0.2 EGLD
      BigInt('300000000000000000'),  // 0.3 EGLD
    ];

    let totalSent = BigInt(0);
    let totalFees = BigInt(0);
    for (const amt of amounts) {
      const hash = await sendTransaction(new SendTransactionArgs({
        chainSimulatorUrl: sim,
        sender: alice,
        receiver: bob,
        value: amt.toString(),
        dataField: '',
      }));
      const fee = await fetchTxFeeFromSimulator(sim, hash);
      totalSent += amt;
      totalFees += fee;
    }

    const endAlice = await fetchApiBalance(api, alice);
    const endBob = await fetchApiBalance(api, bob);

    expect(endAlice).toBe(startAlice - totalSent - totalFees);
    expect(endBob).toBe(startBob + totalSent);
  });
});

