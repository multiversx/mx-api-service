import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { ProxyController } from "src/endpoints/proxy/proxy.controller";
import { TransactionController } from "src/endpoints/transactions/transaction.controller";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { catchError, tap } from 'rxjs/operators';
import async_hooks from 'async_hooks';

@Injectable()
export class TransactionLoggingInterceptor implements NestInterceptor {
  private readonly transactionLogger: winston.Logger;
  private readonly logger: Logger;

  private counter = 0;
  private readonly dict: Record<number, { function: string, duration: number, timestamp: number }> = {};

  private now() {
    const hrTime = process.hrtime();
    return hrTime[0] * 1000 + hrTime[1] / 1000000;
  }

  constructor() {
    const asyncHook = async_hooks.createHook({ init, destroy, promiseResolve, before, after });
    asyncHook.enable();

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    // @ts-ignore
    function init(asyncId: number, type: string, triggerAsyncId: number, resource: any) {
      const previousValue = self.dict[triggerAsyncId];
      if (previousValue) {
        // console.log({ event: 'init', asyncId, type, triggerAsyncId });
        self.dict[asyncId] = {
          function: previousValue.function,
          duration: 0,
          timestamp: 0,
        };

        // console.log({ value: self.dict[asyncId], asyncId, triggerAsyncId });
        console.log({ d: previousValue.duration.toRounded(4), asyncId, triggerAsyncId });

        self.counter += previousValue.duration;
      }
    }

    function destroy(asyncId: number) {
      const value = self.dict[asyncId];
      if (value) {
        // console.log({ event: 'destroy', asyncId });
        delete self.dict[asyncId];
      }

    }

    function promiseResolve(asyncId: number) {
      const value = self.dict[asyncId];
      if (value) {
        // console.log({ event: 'destroy', asyncId });
        value.timestamp = self.now();
      }

    }

    // @ts-ignore
    function before(asyncId: number) {
      const value = self.dict[asyncId];
      if (value && value.timestamp === 0) {
        // console.log({ event: 'before', asyncId });
        value.timestamp = self.now();
      }
    }

    function after(asyncId: number) {
      const value = self.dict[asyncId];
      if (value) {
        value.duration = value.duration + self.now() - value.timestamp;
      }
    }

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

    this.logger = new Logger(TransactionLoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const apiFunction = context.getClass().name + '.' + context.getHandler().name;

    console.log({ status: 'start', apiFunction, executionAsyncId: async_hooks.executionAsyncId(), triggerAsyncId: async_hooks.triggerAsyncId() });

    const start = this.now();

    this.dict[async_hooks.executionAsyncId()] = {
      function: apiFunction,
      duration: 0,
      timestamp: this.now(),
    };

    const request = context.getArgByIndex(0);

    const isCreateTransactionCall = context.getClass().name === TransactionController.name && context.getHandler().name === 'createTransaction';
    const isSendTransactionCall = context.getClass().name === ProxyController.name && context.getHandler().name === 'transactionSend';

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
      .handle()
      .pipe(
        tap(() => {
          console.log({ status: 'finish', apiFunction, executionAsyncId: async_hooks.executionAsyncId(), triggerAsyncId: async_hooks.triggerAsyncId() });

          console.log({ elapsed: this.now() - start, value: this.dict[async_hooks.triggerAsyncId()], counter: this.counter });

          // console.log({ dict: this.dict });
        }),
        catchError(err => {
          console.log({ status: 'error', apiFunction, executionAsyncId: async_hooks.executionAsyncId(), triggerAsyncId: async_hooks.triggerAsyncId() });

          return throwError(() => err);
        })
      );
  }
}
