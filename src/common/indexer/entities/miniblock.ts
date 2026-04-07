import { ElasticSortable } from "./elastic.sortable";

export interface MiniBlock extends ElasticSortable {
  miniBlockHash: string;
  senderShard: number;
  receiverShard: number;
  senderBlockHash: string;
  receiverBlockHash: string;
  type: string;
  procTypeD: string;
  timestamp: number;
  timestampMs?: number;
  procTypeS: string;
  senderBlockNonce: string;
  receiverBlockNonce: string;
}
