export class TrieOperationsTimeoutError extends Error {
  constructor() {
    super('Trie operations timeout');

    Object.setPrototypeOf(this, TrieOperationsTimeoutError.prototype);
  }
}
