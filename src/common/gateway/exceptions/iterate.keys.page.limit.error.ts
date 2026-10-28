export class IterateKeysPageLimitError extends Error {
  constructor() {
    super('Iterate keys page limit exceeded');

    Object.setPrototypeOf(this, IterateKeysPageLimitError.prototype);
  }
}
