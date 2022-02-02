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

Array.prototype.toRecord = function <TIN, TOUT>(keyPredicate: (item: TIN) => string, valuePredicate?: (item: TIN) => TOUT): Record<string, TOUT> {
  const result: Record<string, TOUT> = {};

  for (const item of this) {
    result[keyPredicate(item)] = valuePredicate ? valuePredicate(item) : item;
  }

  return result;
};

Array.prototype.sorted = function <T>(predicate?: (item: T) => number): T[] {
  const cloned = [...this];

  if (predicate) {
    cloned.sort((a, b) => predicate(a) - predicate(b));
  } else {
    cloned.sort((a, b) => a - b);
  }

  return cloned;
};

Array.prototype.sortedDescending = function <T>(predicate?: (item: T) => number): T[] {
  const sorted = this.sorted(predicate);

  sorted.reverse();

  return sorted;
};

Array.prototype.sum = function <T>(predicate?: (item: T) => number): number {
  if (predicate) {
    return this.map(predicate).reduce((a, b) => a + b);
  }

  return this.reduce((a, b) => a + b);
};

Array.prototype.sumBigInt = function <T>(predicate?: (item: T) => bigint): bigint {
  if (predicate) {
    return this.map(predicate).reduce((a, b) => BigInt(a) + BigInt(b), BigInt(0));
  }

  return this.reduce((a, b) => BigInt(a) + BigInt(b), BigInt(0));
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
  sorted(predicate?: (element: T) => number): T[];
  sortedDescending(predicate?: (element: T) => number): T[];
  sum(predicate?: (item: T) => number): number;
  sumBigInt(predicate?: (item: T) => bigint): bigint;
  toRecord<TOUT>(keyPredicate: (item: T) => string, valuePredicate?: (item: T) => TOUT): Record<string, TOUT>;
}
