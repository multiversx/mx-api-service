import { Operation } from 'src/common/indexer/entities';
import { Events as IndexerEvents } from 'src/common/indexer/entities/events';

export class IndexerRound {
  constructor(init?: Partial<IndexerRound>) {
    Object.assign(this, init);
  }

  timestampMs: number = 0;
  operations: Operation[] = [];
  events: IndexerEvents[] = [];
}
