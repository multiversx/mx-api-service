import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';

@Injectable()
export class CleanupInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    context.getArgByIndex(0);

    return next
      .handle()
      .pipe(
        tap(async (result) => await this.clean(result))
      );
  }

  private clean = (obj: any): any => {
    if (typeof obj === 'number') return obj;
    if (Array.isArray(obj)) {
      return obj.map((v) => (v && typeof v === 'object' ? this.clean(v) : v)).filter((v) => !(v == null));
    } else {
      return Object.entries(obj)
        .map(([k, v]) => [k, v && typeof v === 'object' ? this.clean(v) : v])
        .reduce(
          (a: any, [k, v]: any): any =>
            v === null ||
            v === '' || 
            (v instanceof Object && Object.keys(v).length == 0)
            ? a
            : ((a[k] = v), a),
          {}
        );
    }
  };
}