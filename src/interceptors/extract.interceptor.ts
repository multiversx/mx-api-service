import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';

@Injectable()
export class ExtractInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.getArgByIndex(0);

    return next
      .handle()
      .pipe(map(result => {
          const extractArgument = request.query.extract;
          if (extractArgument) {
            return result[extractArgument];
          }

          return result;
        })
      );
  }
}