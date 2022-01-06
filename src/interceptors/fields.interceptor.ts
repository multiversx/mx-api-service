import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';

@Injectable()
export class FieldsInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.getArgByIndex(0);

    return next
      .handle()
      .pipe(
        tap(async (result) => {
          const fieldsArgument = request.query.fields;
          if (fieldsArgument) {
            const fields = fieldsArgument.split(',');
            if (Array.isArray(result)) {
              for (const item of result) {
                this.transformItem(item, fields);
              }
            }
            else {
              this.transformItem(result, fields);
            }
          }

          return result;
        })
      );
  }

  private transformItem(item: any, fields: string[]) {
    for (const key of Object.keys(item)) {
      if (!fields.includes(key)) {
        delete item[key];
      }
    }
  }
}