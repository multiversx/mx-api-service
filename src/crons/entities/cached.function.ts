import { InvalidationFunction } from "./invalidation.function";

export class CachedFunction {
  funcName: string = '';
  invalidations: InvalidationFunction[] = [];
}
