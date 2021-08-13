import { Logger } from "@nestjs/common";
import { PerformanceProfiler } from "./performance.profiler";

const { readdirSync } = require('fs');

export function mergeObjects(obj1: any, obj2: any) {
  for (const key of Object.keys(obj2)) {
      if (key in obj1) {
          obj1[key] = obj2[key];
      }
  }

  return obj1;
}

export function base64Encode(str: string) {
  return Buffer.from(str).toString('base64');
};

export function base64Decode(str: string): string {
  return base64DecodeBinary(str).toString('binary');
}

export function base64DecodeBinary(str: string): Buffer {
  return Buffer.from(str, 'base64');
};

export function cleanupApiValueRecursively(obj: any) {
  if (Array.isArray(obj)) {
    for (let item of obj) {
      if (item && typeof item === 'object') {
        cleanupApiValueRecursively(item);
      }
    }
  } else if (obj && typeof obj === 'object') {
    for (let [key, value] of Object.entries(obj)) {
      if (typeof value === 'object') {
        cleanupApiValueRecursively(value);
      }

      if (Array.isArray(value)) {
        for (let item of value) {
          if (item && typeof item === 'object') {
            cleanupApiValueRecursively(item);
          }
        }
      }

      if (value === null || value === '' || value === undefined) {
        delete obj[key];
      }

      //TODO: think about whether this is applicable everywhere
      if (Array.isArray(value) && value.length === 0) {
        delete obj[key];
      }
    }
  }

  return obj
}

Date.prototype.isToday = function(): boolean {
  return this.toISODateString() === new Date().toISODateString();
};

Date.prototype.toISODateString = function(): string {
  return this.toISOString().slice(0, 10);
};

Number.prototype.toRounded = function(digits: number): number {
  return parseFloat(this.toFixed(digits));
};

declare global {
  interface Number {
    toRounded(digits: number): number;
  }

  interface Date {
    toISODateString(): string;
    isToday(): boolean;
  }

  interface Array<T> {
    groupBy(predicate: (item: T) => any): any;
    selectMany(predicate: (item: T) => T[]): T[];
    firstOrUndefined(predicate: (item: T) => boolean): T | undefined;
    zip<TSecond, TResult>(second: TSecond[], predicate: (first: T, second: TSecond) => TResult): TResult[];
    remove(element: T): number;
  }
}

Array.prototype.groupBy = function(predicate: Function, asArray = false) {
  let result = this.reduce(function(rv, x) {
      (rv[predicate(x)] = rv[predicate(x)] || []).push(x);
      return rv;
  }, {});

  if (asArray === true) {
      result = Object.keys(result).map(key => {
          return {
              key: key,
              values: result[key]
          };
      });
  }

  return result;
};

Array.prototype.selectMany = function(predicate: Function) {
  let result = [];

  for (let item of this) {
      result.push(...predicate(item));
  }

  return result;
};

Array.prototype.firstOrUndefined = function(predicate: Function) {
  let result = this.filter(x => predicate(x));

  if (result.length > 0) {
    return result[0];
  }

  return undefined;
};

Array.prototype.zip = function<TSecond, TResult>(second: TSecond[], predicate: Function): TResult[] {
  return this.map((element: any, index: number) => predicate(element, second[index]));
};

Array.prototype.remove = function<T>(element: T): number {
  let index = this.indexOf(element);
  if (index >= 0) {
    this.splice(index, 1);
  }

  return index;
}

export function getDirectories(source: string) {
  return readdirSync(source, { withFileTypes: true })
    .filter((dirent: any) => dirent.isDirectory())
    .map((dirent: any) => dirent.name);
}

let lockArray: string[] = [];

export async function lock(key: string, func: () => Promise<void>, log: boolean = false) {
  let logger = new Logger('Lock');

  if (lockArray.includes(key)) {
    logger.log(`${key} is already running`);
    return;
  }

  lockArray.push(key);

  let profiler = new PerformanceProfiler();

  try {
    await func();
  } catch (error) {
    logger.error(`Error running ${key}`);
    logger.error(error);
  } finally {
    profiler.stop(`Running ${key}`, log);
    lockArray.remove(key);
  }
}