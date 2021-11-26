import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { PerformanceProfiler } from "src/utils/performance.profiler";
import { ApiConfigService } from "../api-config/api.config.service";
import { MetricsService } from "../metrics/metrics.service";
import { ApiService } from "../network/api.service";

@Injectable()
export class GatewayService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => MetricsService))
    private readonly metricsService: MetricsService,
  ) {}

  async get(url: string, component: string, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    let profiler = new PerformanceProfiler();
    try {
      let result = await this.getRaw(url, component, errorHandler);
      return result?.data?.data;
    } finally  {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }
 
  async getRaw(url: string, component: string, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    let profiler = new PerformanceProfiler();
    try {
      return await this.apiService.get(`${this.apiConfigService.getGatewayUrl()}/${url}`, undefined, errorHandler);
    } finally  {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }

  async create(url: string, component: string, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    let profiler = new PerformanceProfiler();
    try {
      let result = await this.createRaw(url, component, data, errorHandler);
      return result?.data?.data;
  
    } finally  {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }

  async createRaw(url: string, component: string, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {

    let profiler = new PerformanceProfiler();
    try {
      return await this.apiService.post(`${this.apiConfigService.getGatewayUrl()}/${url}`, data, undefined, errorHandler);
    } finally  {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }
}