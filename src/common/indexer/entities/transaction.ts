export interface Transaction {
  hash: string;
  miniBlockHash: string;
  nonce: number;
  round: number;
  value: string;
  receiver: string;
  sender: string;
  receiverShard: number;
  senderShard: number;
  gasPrice: string;
  gasLimit: string;
  gasUsed: string;
  fee: string;
  data: string;
  signature: string;
  timestamp: number;
  status: string;
  searchOrder: number;
  hasScResults: boolean;
  hasOperations: boolean;
  tokens: string[];
  esdtValues: string[];
  receivers: string[];
  receiversShardIDs: number[];
  operation: string;
  scResults: any[];
}
