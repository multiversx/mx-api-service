import { Logger } from "@nestjs/common";

export class PerformanceProfiler {
  started: number;
  description: string;

  stopped: number = 0;
  duration: number = 0;

  constructor(description: string = '') {
    this.started = this.now();
    this.description = description;
  }

  stop(description: string | null = null, log: boolean = false) {
    this.stopped = this.now();
    this.duration = this.stopped - this.started;

    if (log) {
      const logger = new Logger(PerformanceProfiler.name);

      logger.log(`${description ?? this.description}: ${this.duration.toFixed(3)}ms`);
    }
  }

  private now() {
    const hrTime = process.hrtime();
    return hrTime[0] * 1000 + hrTime[1] / 1000000;
  }

  static async profile<T>(description: string, promise: Promise<T> | (() => Promise<T>)): Promise<T> {
    const profiler = new PerformanceProfiler();

    try {
      if (promise instanceof Function) {
        return await promise();
      } else {
        return await promise;
      }
    } finally {
      profiler.stop(description, true);
    }
  }
}
