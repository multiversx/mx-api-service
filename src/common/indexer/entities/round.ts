import { ElasticSortable } from "./elastic.sortable";

export interface Round extends ElasticSortable {
  round: number,
  signersIndexes: number[],
  blockWasProposed: boolean,
  shardId: number,
  epoch: number,
  timestamp: number,
  timestampMs?: number,
}
