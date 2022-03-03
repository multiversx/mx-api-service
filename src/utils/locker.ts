import { Logger } from "@nestjs/common";
import { MetricsService } from "src/common/metrics/metrics.service";
import { PerformanceProfiler } from "./performance.profiler";

export class Locker {
  private static lockArray: string[] = [];

  static async lock(key: string, func: () => Promise<void>, log: boolean = false) {
    const logger = new Logger('Lock');

    if (Locker.lockArray.includes(key)) {
      logger.log(`${key} is already running`);
      return;
    }

    Locker.lockArray.push(key);

    const profiler = new PerformanceProfiler();

    try {
      await func();

      profiler.stop(`Running ${key}`, log);
      MetricsService.setJobResult(key, 'success', profiler.duration);
    } catch (error) {
      logger.error(`Error running ${key}`);
      logger.error(error);

      profiler.stop(`Running ${key}`, log);
      MetricsService.setJobResult(key, 'error', profiler.duration);
    } finally {
      Locker.lockArray.remove(key);
    }
  }
}
