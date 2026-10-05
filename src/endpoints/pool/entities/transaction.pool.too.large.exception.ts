import { HttpException, HttpStatus } from "@nestjs/common";

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
