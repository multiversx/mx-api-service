import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";
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

  constructor(
    private readonly metricsService: MetricsService,
  ) {
    this.transactionLogger = winston.createLogger({
      transports: [
        new DailyRotateFile({
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          createSymlink: true,
          dirname: 'dist/logs',
          symlinkName: 'application.log'
        })
      ]
    })
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    let apiFunction = context.getClass().name + '.' + context.getHandler().name;

    let profiler = new PerformanceProfiler(apiFunction);

    const request = context.getArgByIndex(0);

    const isCreateTransactionCall = context.getClass().name === TransactionController.name && context.getHandler().name === 'createTransaction';
    const isSendTransactionCall = context.getClass().name === ProxyController.name && context.getHandler().name === 'transactionSend';

    if (isCreateTransactionCall || isSendTransactionCall) {
      this.transactionLogger.info({
        apiFunction,
        body: request.body,
        userAgent: request.headers['user-agent'],
        clientIp: request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress
      });
    }

    return next
      .handle()
      .pipe(
        tap(() => {
          profiler.stop();

          const http = context.switchToHttp();
          const res = http.getResponse();

          this.metricsService.setApiCall(apiFunction, res.statusCode, profiler.duration, 0);
        }),
        catchError(err => {
          profiler.stop();

          let statusCode = err.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
          this.metricsService.setApiCall(apiFunction, statusCode, profiler.duration, 0);
          
          return throwError(() => err);
        })
      );
  }
}