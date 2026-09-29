import { HttpException, HttpStatus } from "@nestjs/common";

// the pool is read from the gateway in a single response, which is limited in size. above that limit there
// is no pool to show, and clients can tell this case apart from other failures by the code in the body
export class TransactionPoolTooLargeException extends HttpException {
  static readonly code = 'transaction_pool_too_large';

  constructor() {
    super({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      code: TransactionPoolTooLargeException.code,
      message: 'The transaction pool is too large to be displayed',
    }, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
