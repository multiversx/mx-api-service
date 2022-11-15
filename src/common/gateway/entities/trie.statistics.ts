export class TrieStatistics {
  constructor(init?: Partial<TrieStatistics>) {
    Object.assign(this, init);
  }

  accounts_snapshot_num_nodes: number = 0;
}
