import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { MetricsService } from "src/endpoints/metrics/metrics.service";
import { ApiConfigService } from "./api.config.service";
import { ApiService } from "./api.service";
import { PerformanceProfiler } from "./performance.profiler";

@Injectable()
export class GatewayService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => MetricsService))
    private readonly metricsService: MetricsService,
    private readonly apiService: ApiService
  ) {}

  async get(url: string): Promise<any> {
    let result = await this.getRaw(url);
    return result.data.data;
  }

  async getRaw(url: string): Promise<any> {
    let profiler = new PerformanceProfiler();
    let result = await this.apiService.get(`${this.apiConfigService.getGatewayUrl()}/${url}`);
    profiler.stop();

    this.metricsService.setExternalCall('gateway', profiler.duration);

    return result;
  }

  async create(url: string, data: any): Promise<any> {
    let result = await this.createRaw(url, data);
    return result.data.data;
  }

  async createRaw(url: string, data: any): Promise<any> {
    let profiler = new PerformanceProfiler();
    let result = await this.apiService.post(`${this.apiConfigService.getGatewayUrl()}/${url}`, data);
    profiler.stop();

    this.metricsService.setExternalCall('gateway', profiler.duration);

    return result;
  }
}