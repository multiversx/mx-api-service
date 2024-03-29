import { SortOrder } from "src/common/entities/sort.order";
import { SortBlocks } from "./sort.blocks";

export class BlockFilter {
  constructor(init?: Partial<BlockFilter>) {
    Object.assign(this, init);
  }

  shard?: number;
  proposer?: string;
  validator?: string;
  epoch?: number;
  nonce?: number;
  hashes?: string[];
  order?: SortOrder;
  sort?: SortBlocks;
}
