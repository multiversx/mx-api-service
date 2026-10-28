export class TrieOperationsLimitError extends Error {
  constructor() {
    super('Trie collection limit exceeded');

    Object.setPrototypeOf(this, TrieOperationsLimitError.prototype);
  }
}
