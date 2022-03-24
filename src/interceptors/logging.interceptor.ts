import { CallHandler, ExecutionContext, HttpStatus, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from 'rxjs/operators';
import { MetricsService } from "src/common/metrics/metrics.service";
import { ProxyController } from "src/endpoints/proxy/proxy.controller";
import { TransactionController } from "src/endpoints/transactions/transaction.controller";
import { PerformanceProfiler } from "src/utils/performance.profiler";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly transactionLogger: winston.Logger;
  private readonly logger: Logger;

  constructor(
    private readonly metricsService: MetricsService,
  ) {
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

    this.logger = new Logger(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const apiFunction = context.getClass().name + '.' + context.getHandler().name;

    const profiler = new PerformanceProfiler(apiFunction);

    const request = context.getArgByIndex(0);

    const isCreateTransactionCall = context.getClass().name === TransactionController.name && context.getHandler().name === 'createTransaction';
    const isSendTransactionCall = context.getClass().name === ProxyController.name && context.getHandler().name === 'transactionSend';

    if (isCreateTransactionCall || isSendTransactionCall) {
      const logBody = {
        apiFunction,
        body: request.body,
        userAgent: request.headers['user-agent'],
        clientIp: request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress,
      };

      this.transactionLogger.info(logBody);
      this.logger.log(logBody);
    }

    const origin = request.headers['origin'];

    return next
      .handle()
      .pipe(
        tap(() => {
          profiler.stop();

          const http = context.switchToHttp();
          const res = http.getResponse();

          this.metricsService.setApiCall(apiFunction, origin, res.statusCode, profiler.duration);
        }),
        catchError(err => {
          profiler.stop();

          const statusCode = err.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
          this.metricsService.setApiCall(apiFunction, origin, statusCode, profiler.duration);

          return throwError(() => err);
        })
      );
  }
}
