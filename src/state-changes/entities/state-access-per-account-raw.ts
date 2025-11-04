import { DataTrieChange } from "./data-trie-change";

export class StateAccessPerAccountRaw {
  type!: number;
  index!: number;
  txHash!: string;
  mainTrieKey!: string;
  mainTrieVal!: string;
  operation!: number;
  dataTrieChanges?: DataTrieChange[];
  accountChanges?: number;

  constructor(init?: Partial<StateAccessPerAccountRaw>) {
    Object.assign(this, init);
  }
}
