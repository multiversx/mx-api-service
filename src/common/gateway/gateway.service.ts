import { PerformanceProfiler } from "@elrondnetwork/nestjs-microservice-common";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { MetricsService } from "../metrics/metrics.service";
import { ApiService } from "../network/api.service";
import { ApiSettings } from "../network/entities/api.settings";
import { Auction } from "./entities/auction";
import { GatewayComponentRequest } from "./entities/gateway.component.request";

@Injectable()
export class GatewayService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => MetricsService))
    private readonly metricsService: MetricsService,
  ) { }

  async getAuctions(): Promise<Auction[]> {
    const result = await this.get('validator/auction', GatewayComponentRequest.validatorAuction);

    return result.auction;
  }

  async get(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();

    try {
      const result = await this.getRaw(url, component, errorHandler);
      return result?.data?.data;
    } finally {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }

  async getRaw(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();

    try {
      return await this.apiService.get(`${this.apiConfigService.getGatewayUrl()}/${url}`, new ApiSettings(), errorHandler);
    } finally {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }

  async create(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();

    try {
      const result = await this.createRaw(url, component, data, errorHandler);
      return result?.data?.data;

    } finally {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }

  async createRaw(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();

    try {
      return await this.apiService.post(`${this.apiConfigService.getGatewayUrl()}/${url}`, data, new ApiSettings(), errorHandler);
    } finally {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }
}
