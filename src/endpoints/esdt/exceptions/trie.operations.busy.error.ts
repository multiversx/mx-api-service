export class TrieOperationsBusyError extends Error {
  constructor() {
    super('Too many concurrent trie operations');

    Object.setPrototypeOf(this, TrieOperationsBusyError.prototype);
  }
}
