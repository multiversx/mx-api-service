import { Inject } from "@nestjs/common";
import { PerformanceProfiler } from "@elrondnetwork/erdnest";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { LogMetricsEvent } from "../common/metrics/events/log-metrics.event";

interface ILogPerformanceOptions {
  argIndex: number;
}

// First argument of decorator is event name
// everything after that are values (static or extracted
// from decorated method)
const extractDecoratorArgs = (descriptorValue: any, decoratorArgs: Array<string | ILogPerformanceOptions>, decoratedMethodArgs: any[]): any[] => {
  if (!decoratorArgs || decoratorArgs.length === 0) {
    return [descriptorValue.name];
  }

  return decoratorArgs.map(arg => {
    if (typeof arg === 'string') {
      return arg;
    }

    return decoratedMethodArgs[arg.argIndex];
  });
};

export function LogPerformanceAsync(method: string, ...decoratorArgs: Array<string | ILogPerformanceOptions>) {
  const eventEmitter = Inject(EventEmitter2);

  return (
    target: Object,
    _key: string | symbol,
    descriptor: PropertyDescriptor
  ) => {

    eventEmitter(target, 'eventEmitter');

    const childMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      //@ts-ignore
      const eventEmitter: EventEmitter2 = this.eventEmitter;

      const profiler = new PerformanceProfiler();
      try {
        return await childMethod.apply(this, args);
      } finally {
        profiler.stop();

        const metricsEvent = new LogMetricsEvent();
        metricsEvent.args = extractDecoratorArgs(childMethod, decoratorArgs, args);
        metricsEvent.args.push(profiler.duration);

        eventEmitter.emit(method, metricsEvent);
      }
    };
    return descriptor;
  };
}

