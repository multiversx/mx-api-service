import { Logger } from "@nestjs/common";

export class PerformanceProfiler {
  started: number;
  description: string;

  stopped: number = 0;
  duration: number = 0;

  constructor(description: string = '') {
    this.started = Date.now();
    this.description = description;
  }

  stop(description: string | null = null, log: boolean = false) {
    this.stopped = Date.now();
    this.duration = this.stopped - this.started;

    if (log) {
      let logger = new Logger(PerformanceProfiler.name);

      logger.log(`${description ?? this.description}: ${this.duration}ms`);
    }
  }
}