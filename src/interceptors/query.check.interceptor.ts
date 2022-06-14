import { CallHandler, ExecutionContext, HttpAdapterHost, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class QueryCheckInterceptor implements NestInterceptor {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpAdapter = this.httpAdapterHost.httpAdapter;

    const request = context.getArgByIndex(0);
    if (httpAdapter.getRequestMethod(request) !== 'GET') {
      return next.handle();
    }

    const metadata = Reflect.getOwnMetadata('__routeArguments__', context.getClass(), context.getHandler().name);
    if (!metadata) {
      return next.handle();
    }

    const supportedQueryNames = Object.values(metadata).map((x: any) => x.data);

    for (const paramName of Object.keys(request.query)) {
      if (!['fields', 'extract'].includes(paramName) && !supportedQueryNames.includes(paramName)) {
        // throw new BadRequestException(`Unsupported parameter '${paramName}'. Supported parameters are: ${supportedQueryNames.join(', ')}`);
        // const origin = request.headers['origin'];
        // const apiFunction = context.getClass().name + '.' + context.getHandler().name;
        // const logger = new Logger(QueryCheckInterceptor.name);
        // logger.error(`Unsupported parameter '${paramName}' for function '${apiFunction}', origin '${origin}', ip '${request.clientIp}'`);
      }
    }

    return next.handle();
  }
}
