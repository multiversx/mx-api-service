import axios from "axios";

const VM_TYPE = "0500";
const CODE_METADATA = "0100";
const SC_DEPLOY_ADDRESS = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu';
const ESDT_ADDRESS = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';

export async function fundAddress(chainSimulatorUrl: string, address: string) {
  const payload = [
    {
      address: address,
      balance: '100000000000000000000000',
    },
  ];
  await axios.post(`${chainSimulatorUrl}/simulator/set-state`, payload);
}

export async function getNonce(chainSimulatorUrl: string, address: string): Promise<number> {
  try {
    const currentNonceResponse = await axios.get(`${chainSimulatorUrl}/address/${address}/nonce`);
    return currentNonceResponse.data.data.nonce;
  } catch (e) {
    console.error(e);
    return 0;
  }
}

export async function deploySc(args: DeployScArgs): Promise<string> {
  try {
    const contractCodeHex = Buffer.from(args.contractCodeRaw).toString('hex');
    const contractArgs = [VM_TYPE, CODE_METADATA, ...args.hexArguments];
    const contractPayload = contractCodeHex + '@' + contractArgs.join('@');

    const txHash = await sendTransaction(new SendTransactionArgs({
      chainSimulatorUrl: args.chainSimulatorUrl,
      sender: args.deployer,
      receiver: SC_DEPLOY_ADDRESS,
      dataField: contractPayload,
    }));

    const txResponse = await axios.get(`${args.chainSimulatorUrl}/transaction/${txHash}?withResults=true`);
    const scDeployLog = txResponse?.data?.data?.transaction?.logs?.events?.find((event: { identifier: string; }) => event.identifier === 'SCDeploy');
    console.log(`Deployed SC. tx hash: ${txHash}. address: ${scDeployLog?.address}`);
    return scDeployLog?.address;
  } catch (e) {
    console.error(e);
    return 'n/a';
  }
}

export async function issueEsdt(args: IssueEsdtArgs) {
  const txHash = await sendTransaction(new SendTransactionArgs({
    chainSimulatorUrl: args.chainSimulatorUrl,
    sender: args.issuer,
    receiver: ESDT_ADDRESS,
    dataField: `issue@${Buffer.from(args.tokenName).toString('hex')}@${Buffer.from(args.tokenTicker).toString('hex')}@1e9b0e04e39e5845000000@12`,
    value: '50000000000000000',
  }));

  const txResponse = await axios.get(`${args.chainSimulatorUrl}/transaction/${txHash}?withResults=true`);
  const esdtIssueLog = txResponse?.data?.data?.transaction?.logs?.events?.find((event: { identifier: string; }) => event.identifier === 'issue');
  const tokenIdentifier = Buffer.from(esdtIssueLog.topics[0], 'base64').toString();
  console.log(`Issued token with ticker ${args.tokenTicker}. tx hash: ${txHash}. identifier: ${tokenIdentifier}`);
  return tokenIdentifier;
}

export async function transferEsdt(args: TransferEsdtArgs) {
  const transferValue = args.plainAmountOfTokens * (10 ** 18);
  return await sendTransaction(new SendTransactionArgs({
    chainSimulatorUrl: args.chainSimulatorUrl,
    sender: args.sender,
    receiver: args.receiver,
    dataField: `ESDTTransfer@${Buffer.from(args.tokenIdentifier).toString('hex')}@${transferValue.toString(16)}`,
    value: '0',
  }));
}

export async function sendTransaction(args: SendTransactionArgs): Promise<string> {
  try {
    const nonce = await getNonce(args.chainSimulatorUrl, args.sender);

    const tx = {
      sender: args.sender,
      receiver: args.receiver,
      nonce: nonce,
      value: args.value,
      gasPrice: 1000000000,
      gasLimit: args.gasLimit,
      data: Buffer.from(args.dataField).toString('base64'),
      signature: 'a'.repeat(128),
      chainID: 'chain',
      version: 1,
    };

    const txHashResponse = await axios.post(`${args.chainSimulatorUrl}/transaction/send`, tx);
    const txHash = txHashResponse.data.data.txHash;
    await axios.post(`${args.chainSimulatorUrl}/simulator/generate-blocks-until-transaction-processed/${txHash}`);
    return txHash;
  } catch (e) {
    console.error(e);
    return 'n/a';
  }
}

export class SendTransactionArgs {
  chainSimulatorUrl: string = '';
  sender: string = '';
  receiver: string = '';
  dataField: string = '';
  value?: string = '0';
  gasLimit?: number = 100_000_000;

  constructor(options: Partial<SendTransactionArgs> = {}) {
    Object.assign(this, options);
  }
}

export class IssueEsdtArgs {
  chainSimulatorUrl: string = '';
  issuer: string = '';
  tokenName: string = '';
  tokenTicker: string = '';

  constructor(options: Partial<IssueEsdtArgs> = {}) {
    Object.assign(this, options);
  }
}

export class TransferEsdtArgs {
  chainSimulatorUrl: string = '';
  sender: string = '';
  receiver: string = '';
  tokenIdentifier: string = '';
  plainAmountOfTokens: number = 1;

  constructor(options: Partial<TransferEsdtArgs> = {}) {
    Object.assign(this, options);
  }
}

export class DeployScArgs {
  chainSimulatorUrl: string = '';
  deployer: string = '';
  contractCodeRaw: Buffer = Buffer.from('');
  hexArguments: string[] = [];

  constructor(options: Partial<DeployScArgs> = {}) {
    Object.assign(this, options);
  }
}
