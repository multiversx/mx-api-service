import { SortOrder } from "src/common/entities/sort.order";

export class BlockFilter {
  constructor(init?: Partial<BlockFilter>) {
    Object.assign(this, init);
  }

  shard?: number;
  proposer?: string;
  validator?: string;
  epoch?: number;
  nonce?: number;
  beforeNonce?: number;
  afterNonce?: number;
  hashes?: string[];
  order?: SortOrder;
}
