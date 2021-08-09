import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';

@Injectable()
export class ExtractInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.getArgByIndex(0);

    return next
      .handle()
      .pipe(
        tap(async (result) => {
          let extractArgument = request.query.extract;
          if (extractArgument) {
            let field = extractArgument;
            if (Array.isArray(result)) {
              for (let item of result) {
                this.transformItem(item, field);
              }
            }
            else {
              this.transformItem(result, field);
            }
          }
          
          return result;
        })
      );
  }

  private transformItem(item: any, field: string) {  
    for (let key of Object.keys(item)) {
      if (field !== key) {    
        delete item[key];
      } 
    }
    return item[field];
  }
}