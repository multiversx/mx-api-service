export class TrieIterateKeysError extends Error {
  constructor() {
    super('Trie iterate keys failed');

    Object.setPrototypeOf(this, TrieIterateKeysError.prototype);
  }
}
