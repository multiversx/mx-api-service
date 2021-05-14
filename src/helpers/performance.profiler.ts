export class PerformanceProfiler {
  started: number;
  description: string;

  stopped: number = 0;
  duration: number = 0;

  constructor(description: string) {
    this.started = Date.now();
    this.description = description;
  }

  stop(description: string | null = null) {
    this.stopped = Date.now();
    this.duration = this.stopped - this.started;

    console.log(`${description ?? this.description}: ${this.duration}ms`);
  }
}