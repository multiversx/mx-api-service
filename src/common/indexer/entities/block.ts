export interface Block {
  hash: string;
  nonce: number;
  round: number;
  epoch: number;
  miniBlocksHashes: string[];
  miniBlocksDetails?: MiniBlockDetails[];
  notarizedBlocksHashes?: string[];
  proposer: number;
  validators: number[],
  pubKeyBitmap: string;
  size: number;
  sizeTxs: number;
  timestamp: number;
  stateRootHash: string;
  prevHash: string;
  shardId: number;
  txCount: number;
  notarizedTxsCount: number;
  accumulatedFees: string;
  developerFees: string;
  epochStartBlock: boolean,
  searchOrder: number;
  gasProvided: string;
  gasRefunded: string;
  gasPenalized: number;
  maxGasLimit: string;
}

export interface MiniBlockDetails {
  firstProcessedTx: number;
  lastProcessedTx: number;
  senderShard: number;
  receiverShard: number;
  mbIndex: number;
  type: string;
  procType: string;
  txsHashes: string[];
  executionOrderTxsIndices: number[];
}
