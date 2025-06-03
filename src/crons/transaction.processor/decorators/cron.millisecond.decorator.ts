// TODO: move to sdk-nestjs
const timerRegistryKey = Symbol('__cronMillisecondTimers');

export function CronMillisecond(intervalMs: number): MethodDecorator {
  return function (target: any, propertyKey, _descriptor) {
    const methodName = propertyKey as string;

    // Patch onModuleInit
    const originalInit = target['onModuleInit'];
    target['onModuleInit'] = function (...args: any[]) {
      if (typeof originalInit === 'function') {
        originalInit.apply(this, args);
      }

      // Create timer registry on instance
      if (!this[timerRegistryKey]) {
        this[timerRegistryKey] = new Map<string, NodeJS.Timer>();
      }

      const timers: Map<string, NodeJS.Timer> = this[timerRegistryKey];

      if (!timers.has(methodName)) {
        const timer = setInterval(() => {
          this[methodName](); // always runs bound to the instance
        }, intervalMs);

        timers.set(methodName, timer);
      }
    };

    // Patch onModuleDestroy
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
