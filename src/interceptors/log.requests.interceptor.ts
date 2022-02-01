import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Observable } from "rxjs";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

@Injectable()
export class LogRequestsInterceptor implements NestInterceptor {
  private readonly logger: winston.Logger;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {
    this.logger = winston.createLogger({
      transports: [
        new DailyRotateFile({
          filename: 'requests-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '100m',
          maxFiles: '14d',
          dirname: 'dist/logs',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpAdapter = this.httpAdapterHost.httpAdapter;

    const request = context.getArgByIndex(0);
    if (httpAdapter.getRequestMethod(request) !== 'GET') {
      return next.handle();
    }

    const url = httpAdapter.getRequestUrl(request);

    this.logger.info(url);

    return next.handle();
  }
}
