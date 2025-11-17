import { DataTrieChangeOperation } from "./data-trie-change-operation";

export class DataTrieChange {
  type!: number;
  key!: string;
  val!: any;
  version!: number;
  operation!: DataTrieChangeOperation;
}
