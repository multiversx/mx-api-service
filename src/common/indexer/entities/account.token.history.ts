import { ElasticSortable } from "./elastic.sortable";

export interface AccountTokenHistory extends ElasticSortable {
  address: string;
  timestamp: number;
  balance: string;
  token: string;
  identifier: string;
  tokenNonce: number;
  isSmartContract: boolean;
}
