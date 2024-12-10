import axios from 'axios';
import { AddressUtils } from "@multiversx/sdk-nestjs-common";

const VM_TYPE = '0500';
const CODE_METADATA = '0100';
const SC_DEPLOY_ADDRESS =
  'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu';
const ESDT_ADDRESS =
  'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';

export async function fundAddress(chainSimulatorUrl: string, address: string) {
  const payload = [
    {
      address: address,
      balance: '100000000000000000000000',
    },
  ];
  await axios.post(`${chainSimulatorUrl}/simulator/set-state`, payload);
}

export async function getNonce(
  chainSimulatorUrl: string,
  address: string,
): Promise<number> {
  try {
    const currentNonceResponse = await axios.get(
      `${chainSimulatorUrl}/address/${address}/nonce`,
    );
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

    const txHash = await sendTransaction(
      new SendTransactionArgs({
        chainSimulatorUrl: args.chainSimulatorUrl,
        sender: args.deployer,
        receiver: SC_DEPLOY_ADDRESS,
        dataField: contractPayload,
      }),
    );

    const txResponse = await axios.get(
      `${args.chainSimulatorUrl}/transaction/${txHash}?withResults=true`,
    );
    const scDeployLog = txResponse?.data?.data?.transaction?.logs?.events?.find(
      (event: { identifier: string }) => event.identifier === 'SCDeploy',
    );
    console.log(
      `Deployed SC. tx hash: ${txHash}. address: ${scDeployLog?.address}`,
    );
    return scDeployLog?.address;
  } catch (e) {
    console.error(e);
    return 'n/a';
  }
}

export async function issueEsdt(args: IssueEsdtArgs) {
  const txHash = await sendTransaction(
    new SendTransactionArgs({
      chainSimulatorUrl: args.chainSimulatorUrl,
      sender: args.issuer,
      receiver: ESDT_ADDRESS,
      dataField: `issue@${Buffer.from(args.tokenName).toString(
        'hex',
      )}@${Buffer.from(args.tokenTicker).toString(
        'hex',
      )}@1e9b0e04e39e5845000000@12`,
      value: '50000000000000000',
    }),
  );

  const txResponse = await axios.get(
    `${args.chainSimulatorUrl}/transaction/${txHash}?withResults=true`,
  );
  const esdtIssueLog = txResponse?.data?.data?.transaction?.logs?.events?.find(
    (event: { identifier: string }) => event.identifier === 'issue',
  );
  const tokenIdentifier = Buffer.from(
    esdtIssueLog.topics[0],
    'base64',
  ).toString();
  console.log(
    `Issued token with ticker ${args.tokenTicker}. tx hash: ${txHash}. identifier: ${tokenIdentifier}`,
  );
  return tokenIdentifier;
}

export async function transferEsdt(args: TransferEsdtArgs) {
  const transferValue = args.plainAmountOfTokens * 10 ** 18;
  return await sendTransaction(
    new SendTransactionArgs({
      chainSimulatorUrl: args.chainSimulatorUrl,
      sender: args.sender,
      receiver: args.receiver,
      dataField: `ESDTTransfer@${Buffer.from(args.tokenIdentifier).toString(
        'hex',
      )}@${transferValue.toString(16)}`,
      value: '0',
    }),
  );
}

export async function sendTransaction(
  args: SendTransactionArgs,
): Promise<string> {
  try {
    const nonce = await getNonce(args.chainSimulatorUrl, args.sender);

    const tx = {
      sender: args.sender,
      receiver: args.receiver,
      nonce: nonce + (args.nonceOffset ?? 0),
      value: args.value,
      gasPrice: 1000000000,
      gasLimit: args.gasLimit ?? (50_000 + 1_500 * args.dataField.length),
      data: Buffer.from(args.dataField).toString('base64'),
      signature: 'a'.repeat(128),
      chainID: 'chain',
      version: 1,
    };

    const txHashResponse = await axios.post(
      `${args.chainSimulatorUrl}/transaction/send`,
      tx,
    );
    const txHash = txHashResponse.data.data.txHash;
    if (args.nonceOffset) {
      // when a nonce offset is present, it means that the transaction won't be executed in real time, so we should early exit
      console.log(`Broadcasted tx hash ${txHash} of sender ${args.sender} with nonce ${tx.nonce}`);
      console.log(JSON.stringify(tx));
      await axios.post(
        `${args.chainSimulatorUrl}/simulator/generate-blocks/1`,
      );
      return txHash;
    }

    await axios.post(
      `${args.chainSimulatorUrl}/simulator/generate-blocks-until-transaction-processed/${txHash}`,
    );
    return txHash;
  } catch (e) {
    console.error(e);
    return 'n/a';
  }
}

export async function issueMultipleEsdts(
  chainSimulatorUrl: string,
  issuer: string,
  numTokens: number,
) {
  const tokenIdentifiers = [];
  for (let i = 1; i <= numTokens; i++) {
    const tokenName = `Token${i}`;
    const tokenTicker = `TKN${i}`;
    const tokenIdentifier = await issueEsdt(
      new IssueEsdtArgs({
        chainSimulatorUrl,
        issuer,
        tokenName,
        tokenTicker,
      }),
    );
    tokenIdentifiers.push(tokenIdentifier);
  }
  return tokenIdentifiers;
}

export class SendTransactionArgs {
  chainSimulatorUrl: string = '';
  sender: string = '';
  receiver: string = '';
  dataField: string = '';
  value?: string = '0';
  gasLimit?: number = 100_000_000;
  nonceOffset?: number = 0; // useful for scenarios where a higher nonce is desired

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

export async function issueNftCollection(args: IssueNftArgs): Promise<string> {
  const properties = [
    'canFreeze',
    'canWipe',
    'canPause',
    'canTransferNFTCreateRole',
    'canChangeOwner',
    'canUpgrade',
    'canAddSpecialRoles',
  ];

  const dataFields = [
    'issueNonFungible',
    Buffer.from(args.tokenName).toString('hex'),
    Buffer.from(args.tokenTicker).toString('hex'),
  ];

  // Add all properties and their values in hex
  for (const prop of properties) {
    dataFields.push(Buffer.from(prop).toString('hex'));
    dataFields.push(Buffer.from('true').toString('hex'));
  }

  const txHash = await sendTransaction(
    new SendTransactionArgs({
      chainSimulatorUrl: args.chainSimulatorUrl,
      sender: args.issuer,
      receiver: ESDT_ADDRESS,
      dataField: dataFields.join('@'),
      value: '50000000000000000',
      gasLimit: 60000000,
    })
  );

  const txResponse = await axios.get(
    `${args.chainSimulatorUrl}/transaction/${txHash}?withResults=true`
  );

  const nftIssueLog = txResponse?.data?.data?.transaction?.logs?.events?.find(
    (event: { identifier: string }) => event.identifier === 'issueNonFungible'
  );

  const tokenIdentifier = Buffer.from(
    nftIssueLog.topics[0],
    'base64'
  ).toString();

  console.log(
    `Issued NFT collection with ticker ${args.tokenTicker}. tx hash: ${txHash}. identifier: ${tokenIdentifier}`
  );

  return tokenIdentifier;
}

export async function issueMultipleNftsCollections(
  chainSimulatorUrl: string,
  issuer: string,
  numCollections: number,
  numNfts: number,
) {
  const nftCollectionIdentifiers = [];
  for (let i = 1; i <= numCollections; i++) {
    const tokenName = `NFTCollection${i}`;
    const tokenTicker = `NFT${i}`;
    const tokenIdentifier = await issueNftCollection(
      new IssueNftArgs({
        chainSimulatorUrl,
        issuer,
        tokenName,
        tokenTicker,
      }),
    );
    nftCollectionIdentifiers.push(tokenIdentifier);
  }

  // Wait a bit before setting roles
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Set roles for each collection
  for (const tokenIdentifier of nftCollectionIdentifiers) {
    const dataFields = [
      'setSpecialRole',
      Buffer.from(tokenIdentifier).toString('hex'),
      AddressUtils.bech32Decode(issuer),
      Buffer.from('ESDTRoleNFTCreate').toString('hex'),
      Buffer.from('ESDTRoleNFTBurn').toString('hex'),
      Buffer.from('ESDTRoleNFTUpdateAttributes').toString('hex'),
      Buffer.from('ESDTRoleNFTAddURI').toString('hex'),
      Buffer.from('ESDTTransferRole').toString('hex'),
    ];

    const txHash = await sendTransaction(
      new SendTransactionArgs({
        chainSimulatorUrl,
        sender: issuer,
        receiver: ESDT_ADDRESS,
        dataField: dataFields.join('@'),
        value: '0',
        gasLimit: 60000000,
      })
    );

    console.log(
      `Set special roles for collection ${tokenIdentifier}. tx hash: ${txHash}`
    );

    // Wait a bit after setting roles before creating NFT
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Create multiple NFTs for each collection
    for (let j = 1; j <= numNfts; j++) {
      // Create NFT with updated format
      const nftCreateDataFields = [
        'ESDTNFTCreate',
        Buffer.from(tokenIdentifier).toString('hex'),
        '01', // Initial quantity
        Buffer.from(`TestNFT${j}`).toString('hex'), // Name
        '0064', // Royalties (100 = 1%)
        Buffer.from('TestHash').toString('hex'), // Hash
        Buffer.from(`tags:test,example;description:Test NFT ${j}`).toString('hex'), // Attributes
        Buffer.from('https://example.com/nft.png').toString('hex'), // URI 1
        Buffer.from('https://example.com/nft.json').toString('hex'), // URI 2
      ];

      const createTxHash = await sendTransaction(
        new SendTransactionArgs({
          chainSimulatorUrl,
          sender: issuer,
          receiver: issuer,
          dataField: nftCreateDataFields.join('@'),
          value: '0',
          gasLimit: 100000000,
        })
      );

      // Check transaction status
      const txResponse = await axios.get(
        `${chainSimulatorUrl}/transaction/${createTxHash}?withResults=true`
      );

      if (txResponse?.data?.data?.status === 'fail') {
        console.error(`Failed to create NFT ${j} for collection ${tokenIdentifier}. tx hash: ${createTxHash}`);
        console.error('Error:', txResponse?.data?.data?.logs?.events[0]?.topics[1]);
      } else {
        console.log(
          `Created NFT ${j} for collection ${tokenIdentifier}. tx hash: ${createTxHash}`
        );
      }
    }
  }

  return nftCollectionIdentifiers;
}

export class IssueNftArgs {
  chainSimulatorUrl: string = '';
  issuer: string = '';
  tokenName: string = '';
  tokenTicker: string = '';

  constructor(options: Partial<IssueNftArgs> = {}) {
    Object.assign(this, options);
  }
}
