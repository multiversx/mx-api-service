export interface Transaction {
  hash: string;
  miniBlockHash: string;
  nonce: number;
  round: number;
  value: string;
  receiver: string;
  receiverUserName: string; // TODO: newer versions of ES will have this field named receiverUsername
  sender: string;
  senderUserName: string; // TODO: newer versions of ES will have this field named senderUsername
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
