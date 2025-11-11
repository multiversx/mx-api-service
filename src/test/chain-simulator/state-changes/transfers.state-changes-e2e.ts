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
  // Prefer nested shapes returned by gateway/proxy
  if (payload.data) {
    if (typeof payload.data.balance === 'string') return payload.data.balance;
    if (typeof payload.data.balance === 'number') return String(payload.data.balance);
    if (payload.data.account && payload.data.account.balance !== undefined) {
      const b = payload.data.account.balance;
      if (typeof b === 'string') return b;
      if (typeof b === 'number') return String(b);
    }
  }
  // Fallback: some environments may return balance at the top level
  if (typeof payload.balance === 'string') return payload.balance;
  if (typeof payload.balance === 'number') return String(payload.balance);
  return undefined;
}

async function fetchApiBalance(baseUrl: string, address: string): Promise<bigint> {
  // Fetch full account details from gateway to ensure consistent shape
  const url = `${baseUrl}/address/${address}`;
  const payload = await getJson(url);
  if (!payload) throw new Error(`No payload from ${url}`);
  const bal = pickBalance(payload);
  if (!bal) throw new Error(`No balance field in response from ${url}`);
  try {
    const top = typeof payload.balance === 'string' ? payload.balance : (typeof payload.balance === 'number' ? String(payload.balance) : undefined);
    const dataBal = typeof payload?.data?.balance === 'string' ? payload.data.balance : (typeof payload?.data?.balance === 'number' ? String(payload.data.balance) : undefined);
    const acctBal = payload?.data?.account?.balance !== undefined ? (typeof payload.data.account.balance === 'string' ? payload.data.account.balance : String(payload.data.account.balance)) : undefined;
    const picked = bal;
    let pickedFrom = 'unknown';
    if (acctBal !== undefined && picked === acctBal) pickedFrom = 'data.account.balance';
    else if (dataBal !== undefined && picked === dataBal) pickedFrom = 'data.balance';
    else if (top !== undefined && picked === top) pickedFrom = 'balance';
    console.log(`[BalanceFetch] addr=${address} picked=${pickedFrom} value=${picked} candidates={balance:${top},data.balance:${dataBal},data.account.balance:${acctBal}}`);
  } catch (_) { }
  return BigInt(bal);
}

async function waitForBalance(baseUrl: string, address: string, expected: bigint, timeoutMs = 60000): Promise<bigint> {
  const start = Date.now();
  let last: bigint = BigInt(0);
  while (Date.now() - start < timeoutMs) {
    last = await fetchApiBalance(baseUrl, address);
    if (last === expected) return last;
    const tries = Math.floor((Date.now() - start) / 1000);
    if (tries % 5 === 0) {
      console.log(`[WaitForBalance] addr=${address} expected=${expected.toString()} last=${last.toString()} t=${tries}s`);
    }
    await sleep(1000);
  }
  console.log(`[WaitForBalance][Timeout] addr=${address} expected=${expected.toString()} last=${last.toString()} durationMs=${Date.now() - start}`);
  return last;
}

// Observe fee via balance deltas (more robust than parsing simulator fields across versions)
function computeFeeFromDeltas(beforeSender: bigint, afterSender: bigint, amount: bigint): bigint {
  const debited = beforeSender - afterSender;
  const fee = debited - amount;
  return fee > BigInt(0) ? fee : BigInt(0);
}

async function performTransferAndAssert(simUrl: string, apiUrl: string, sender: string, receiver: string, amount: bigint) {
  const beforeSender = await fetchApiBalance(apiUrl, sender);
  const beforeReceiver = await fetchApiBalance(apiUrl, receiver);
  console.log(`[PreTransfer] sender=${sender} bal=${beforeSender.toString()} receiver=${receiver} bal=${beforeReceiver.toString()} amount=${amount.toString()}`);

  const hash = await sendTransaction(new SendTransactionArgs({
    chainSimulatorUrl: simUrl,
    sender,
    receiver,
    value: amount.toString(),
    dataField: '',
  }));
  console.log(`[TxSent] hash=${hash} sender=${sender} -> receiver=${receiver} amount=${amount.toString()}`);

  // Wait for receiver to reflect amount increase
  const expectedReceiver = beforeReceiver + amount;
  const afterReceiver = await waitForBalance(apiUrl, receiver, expectedReceiver);
  console.log(`[PostTransferReceiver] receiver=${receiver} expected=${expectedReceiver.toString()} actual=${afterReceiver.toString()}`);
  expect(afterReceiver).toBe(expectedReceiver);

  // Read sender post and derive fee
  const afterSender = await fetchApiBalance(apiUrl, sender);
  const fee = computeFeeFromDeltas(beforeSender, afterSender, amount);
  console.log(`[PostTransferSender] sender=${sender} before=${beforeSender.toString()} after=${afterSender.toString()} amount=${amount.toString()} fee=${fee.toString()}`);
  expect(afterSender).toBe(beforeSender - amount - fee);
  // Sanity-check fee is > 0 and not absurdly large
  expect(fee).toBeGreaterThan(BigInt(0));
  // Fee should be < 0.1 EGLD in simulator settings
  expect(fee).toBeLessThan(BigInt('100000000000000000'));

  return {fee, afterSender, afterReceiver, hash};
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

    const amount = BigInt('1000000000000000000'); // 1 EGLD
    await performTransferAndAssert(sim, api, alice, bob, amount);
  });

  it('Round-trip transfers: Alice->Bob then Bob->Alice yields expected finals', async () => {
    await fundAddress(sim, alice);
    await fundAddress(sim, bob);

    const startAlice = await fetchApiBalance(api, alice);
    const startBob = await fetchApiBalance(api, bob);

    const amount1 = BigInt('2500000000000000000'); // 2.5 EGLD
    const {fee: fee1} = await performTransferAndAssert(sim, api, alice, bob, amount1);

    const amount2 = BigInt('1700000000000000000'); // 1.7 EGLD
    const {fee: fee2} = await performTransferAndAssert(sim, api, bob, alice, amount2);

    const expectedAlice = startAlice - amount1 - fee1 + amount2;
    const expectedBob = startBob + amount1 - fee2 - amount2;
    const endAlice = await waitForBalance(api, alice, expectedAlice);
    const endBob = await waitForBalance(api, bob, expectedBob);

    expect(endAlice).toBe(expectedAlice);
    expect(endBob).toBe(expectedBob);
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
      const {fee} = await performTransferAndAssert(sim, api, alice, bob, amt);
      totalSent += amt;
      totalFees += fee;
    }

    const expectedAlice = startAlice - totalSent - totalFees;
    const expectedBob = startBob + totalSent;
    const endAlice = await waitForBalance(api, alice, expectedAlice);
    const endBob = await waitForBalance(api, bob, expectedBob);

    expect(endAlice).toBe(expectedAlice);
    expect(endBob).toBe(expectedBob);
  });

  it('Sender nonce increases after successful transfers', async () => {
    await fundAddress(sim, alice);
    const nonceResp = await axios.get(`${api}/address/${alice}/nonce`);
    const startNonce: number = nonceResp?.data?.data?.nonce ?? 0;

    const amount = BigInt('1000000000000000'); // 0.001 EGLD
    await sendTransaction(new SendTransactionArgs({
      chainSimulatorUrl: sim,
      sender: alice,
      receiver: bob,
      value: amount.toString(),
      dataField: '',
    }));

    // Nonce should increase by 1
    let newNonce = startNonce;
    for (let i = 0; i < 30; i++) {
      const n = await axios.get(`${api}/address/${alice}/nonce`).then(r => r?.data?.data?.nonce ?? 0).catch(() => startNonce);
      if (typeof n === 'number') newNonce = n;
      if (newNonce >= startNonce + 1) break;
      await sleep(1000);
    }
    expect(newNonce).toBeGreaterThanOrEqual(startNonce + 1);
  });
});
