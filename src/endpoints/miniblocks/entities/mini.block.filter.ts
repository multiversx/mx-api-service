import { MiniBlockType } from "./mini.block.type";

export class MiniBlockFilter {
  constructor(init?: Partial<MiniBlockFilter>) {
    Object.assign(this, init);
  }

  hashes?: string[];
  type?: MiniBlockType;
}
