import { Logger } from "@nestjs/common";
import { PerformanceProfiler } from "./performance.profiler";

export class Locker {
  private static lockArray: string[] = [];

  static async lock(key: string, func: () => Promise<void>, log: boolean = false) {
    let logger = new Logger('Lock');

    if (Locker.lockArray.includes(key)) {
      logger.log(`${key} is already running`);
      return;
    }

    Locker.lockArray.push(key);

    let profiler = new PerformanceProfiler();

    try {
      await func();
    } catch (error) {
      logger.error(`Error running ${key}`);
      logger.error(error);
    } finally {
      profiler.stop(`Running ${key}`, log);
      Locker.lockArray.remove(key);
    }
  }
}