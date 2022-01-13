Array.prototype.groupBy = function (predicate: Function, asArray = false) {
  let result = this.reduce(function (rv, x) {
    (rv[predicate(x)] = rv[predicate(x)] || []).push(x);
    return rv;
  }, {});

  if (asArray === true) {
    result = Object.keys(result).map(key => {
      return {
        key: key,
        values: result[key],
      };
    });
  }

  return result;
};

Array.prototype.selectMany = function (predicate: Function) {
  const result = [];

  for (const item of this) {
    result.push(...predicate(item));
  }

  return result;
};

Array.prototype.firstOrUndefined = function (predicate?: Function) {
  if (!predicate) {
    if (this.length > 0) {
      return this[0];
    }

    return undefined;
  }

  const result = this.filter(x => predicate(x));
  if (result.length > 0) {
    return result[0];
  }

  return undefined;
};

Array.prototype.zip = function <TSecond, TResult>(second: TSecond[], predicate: Function): TResult[] {
  return this.map((element: any, index: number) => predicate(element, second[index]));
};

Array.prototype.remove = function <T>(element: T): number {
  const index = this.indexOf(element);
  if (index >= 0) {
    this.splice(index, 1);
  }

  return index;
};

Array.prototype.findMissingElements = function <T>(second: T[]) {
  const missing: T[] = [];
  for (const item of this) {
    if (!second.includes(item)) {
      missing.push(item);
    }
  }

  return missing;
};

Array.prototype.distinct = function <T>(): T[] {
  return [...new Set(this)];
};

Array.prototype.distinctBy = function <TCollection, TResult>(predicate: (element: TCollection) => TResult): TCollection[] {
  const distinctProjections: TResult[] = [];
  const result: TCollection[] = [];

  for (const element of this) {
    const projection = predicate(element);
    if (!distinctProjections.includes(projection)) {
      distinctProjections.push(projection);
      result.push(element);
    }
  }

  return result;
};

Array.prototype.all = function <T>(predicate: (item: T) => boolean): boolean {
  return !this.some(x => !predicate(x));
};

Array.prototype.toObject = function <T>(predicate: (item: T) => string): { [key: string]: T } {
  const result: { [key: string]: T } = {};

  for (const item of this) {
    result[predicate(item)] = item;
  }

  return result;
};

declare interface Array<T> {
  groupBy(predicate: (item: T) => any): any;
  selectMany<TOUT>(predicate: (item: T) => TOUT[]): TOUT[];
  firstOrUndefined(predicate?: (item: T) => boolean): T | undefined;
  zip<TSecond, TResult>(second: TSecond[], predicate: (first: T, second: TSecond) => TResult): TResult[];
  remove(element: T): number;
  findMissingElements<T>(second: T[]): T[];
  distinct(): T[];
  distinctBy<TResult>(predicate: (element: T) => TResult): T[];
  all(predicate: (item: T) => boolean): boolean;
  toObject(predicate: (item: T) => string): { [key: string]: T };
}