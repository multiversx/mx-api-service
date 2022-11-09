import { forwardRef, Inject } from "@nestjs/common";
import { PerformanceProfiler } from "@elrondnetwork/erdnest";
import { ApiMetricsService } from "src/common/metrics/api.metrics.service";

interface ILogPerformanceOptions {
  argIndex: number;
}

// You can use either a static string as methodName
// or an argument passed to decorated method
const getMethodFromArgs = (methodArg: string | ILogPerformanceOptions, args: any[]): string => {
  if (typeof methodArg === 'string') return methodArg;
  return args[methodArg.argIndex];
};

export function LogPerformanceAsync(method: string, methodArg: string | ILogPerformanceOptions) {
  const apiMetricsService = Inject(forwardRef(() => ApiMetricsService));

  return (
    target: Object,
    _key: string | symbol,
    descriptor: PropertyDescriptor
  ) => {

    apiMetricsService(target, 'apiMetricsService');

    const childMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      //@ts-ignore
      const apiMetricsService: ApiMetricsService = this.apiMetricsService;

      const profiler = new PerformanceProfiler();
      try {
        return await childMethod.apply(this, args);
      } finally {
        profiler.stop();
        //@ts-ignore
        if (typeof apiMetricsService[method] === 'function')
          //@ts-ignore
          apiMetricsService[method](getMethodFromArgs(methodArg, args), profiler.duration);
      }
    };
    return descriptor;
  };
}

