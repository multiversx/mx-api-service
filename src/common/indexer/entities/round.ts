export interface Round {
  round: number,
  signersIndexes: number[],
  blockWasProposed: boolean,
  shardId: number,
  epoch: number,
  timestamp: number
}
