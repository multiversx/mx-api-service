import { ElasticSortable } from "./elastic.sortable";

export interface Account extends ElasticSortable {
  address: string;
  nonce: number;
  timestampMs: number;
  timestamp: number;
  balance: string;
  balanceNum: number;
  totalBalanceWithStake: string;
  totalBalanceWithStakeNum: number;
  currentOwner?: string;
  api_assets?: any;
  api_transfersLast24h?: number;
}
