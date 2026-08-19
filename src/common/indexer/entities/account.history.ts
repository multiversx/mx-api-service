import { ElasticSortable } from "./elastic.sortable";

export interface AccountHistory extends ElasticSortable {
  address: string;
  timestamp: number;
  balance: string;
}
