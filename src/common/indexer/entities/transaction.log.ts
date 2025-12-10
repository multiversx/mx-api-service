export interface TransactionLog {
  id: string;
  originalTxHash: string;
  address: string;
  events: TransactionLogEvent[];
  timestamp: number;
}

export interface TransactionLogEvent {
  address: string;
  identifier: string;
  topics: string[];
  data?: string;
  order: number;
}

export interface ElasticTransactionLogEvent {
  address: string;
  identifier: string;
  topics: string[];
  data?: string;
  order: number;
  txHash: string;
  originalTxHash: string;
  logAddress: string;
  additionalData?: string[];
}
