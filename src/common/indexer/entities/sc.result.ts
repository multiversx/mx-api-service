import { ElasticSortable } from "./elastic.sortable";

export interface ScResult extends ElasticSortable {
  scHash: string
  nonce: number;
  gasLimit: string;
  gasPrice: string;
  value: string;
  sender: string;
  receiver: string;
  senderShard: number;
  receiverShard: number;
  data: string;
  prevTxHash: string;
  originalTxHash: string;
  callType: string;
  timestamp: number;
  timestampMs?: number;
  tokens: string[];
  esdtValues: string[];
  operation: string;
}
