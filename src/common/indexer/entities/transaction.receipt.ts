import { ElasticSortable } from "./elastic.sortable";

export interface TransactionReceipt extends ElasticSortable {
  receiptHash: string;
  value: string;
  sender: string;
  data: string;
  txHash: string;
  timestamp: number;
}
