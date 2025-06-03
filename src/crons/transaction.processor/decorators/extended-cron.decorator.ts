// TODO: move to sdk-nestjs
import { Cron } from '@nestjs/schedule';

const timerRegistryKey = Symbol('__extendedCronTimers');

export function ExtendedCron(expression: string): MethodDecorator {
  return function (target: any, propertyKey, descriptor) {
    const methodName = propertyKey as string;

    // Check if it's a 7-part expression: "*/100 * * * * * *"
    const parts = expression.trim().split(/\s+/);
    const isMillisecondCron = parts.length === 7;

    if (!isMillisecondCron) {
      // Use standard @Cron for regular cron syntax
      return Cron(expression)(target, propertyKey, descriptor);
    }

    // Extract millisecond interval
    const msExpr = parts[0]; // e.g. */100
    const match = msExpr.match(/^\*\/(\d+)$/);
    if (!match) {
      throw new Error(
        `Invalid millisecond cron format: ${expression}. Expected format like '*/100 * * * * * *'`
      );
    }

    const intervalMs = parseInt(match[1], 10);

    // Handle onModuleInit / Destroy
    const originalInit = target['onModuleInit'];
    target['onModuleInit'] = function (...args: any[]) {
      if (typeof originalInit === 'function') {
        originalInit.apply(this, args);
      }

      if (!this[timerRegistryKey]) {
        this[timerRegistryKey] = new Map<string, NodeJS.Timer>();
      }

      const timers: Map<string, NodeJS.Timer> = this[timerRegistryKey];

      if (!timers.has(methodName)) {
        const timer = setInterval(() => {
          this[methodName]();
        }, intervalMs);

        timers.set(methodName, timer);
      }
    };

    const originalDestroy = target['onModuleDestroy'];
    target['onModuleDestroy'] = function (...args: any[]) {
      if (typeof originalDestroy === 'function') {
        originalDestroy.apply(this, args);
      }

      const timers: Map<string, NodeJS.Timer> = this[timerRegistryKey];
      if (timers?.has(methodName)) {
        clearInterval(timers.get(methodName)!);
        timers.delete(methodName);
      }
    };
  };
}
