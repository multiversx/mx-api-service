import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { GatewayProxyController } from "src/endpoints/proxy/gateway.proxy.controller";
import { TransactionController } from "src/endpoints/transactions/transaction.controller";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

@Injectable()
export class TransactionLoggingInterceptor implements NestInterceptor {
  private readonly transactionLogger: winston.Logger;
  private readonly logger = new OriginLogger(TransactionLoggingInterceptor.name);

  constructor() {
    this.transactionLogger = winston.createLogger({
      format: winston.format.json({
        replacer: (key: string, value: any) => {
          if (key === '') {
            return {
              ...value.message,
              level: value.level,
            };
          }

          return value;
        },
      }),
      transports: [
        new DailyRotateFile({
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          createSymlink: true,
          dirname: 'dist/logs',
          symlinkName: 'application.log',
        }),
      ],
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType: string = context.getType();

    if (!["http", "https"].includes(contextType)) {
      return next.handle();
    }

    const apiFunction = context.getClass().name + '.' + context.getHandler().name;

    const request = context.getArgByIndex(0);

    const isCreateTransactionCall = context.getClass().name === TransactionController.name && context.getHandler().name === 'createTransaction';
    const isSendTransactionCall = context.getClass().name === GatewayProxyController.name && context.getHandler().name === 'transactionSend';

    if (isCreateTransactionCall || isSendTransactionCall) {
      const logBody = {
        apiFunction,
        body: request.body,
        userAgent: request.headers['user-agent'],
        clientIp: request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.clientIp,
      };

      this.transactionLogger.info(logBody);
      this.logger.log(logBody);
    }

    return next
      .handle();
  }
}
