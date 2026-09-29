// thrown when the pool is too large to be read from the gateway, which limits the size of its response.
// the controller and the websocket gateway answer it with TransactionPoolTooLarge instead of an error
export class TransactionPoolTooLargeError extends Error {
  constructor() {
    super('The transaction pool is too large to be read');
  }
}
