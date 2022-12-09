import { ApiService, ApiSettings, PerformanceProfiler } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { ApiMetricsService } from "../metrics/api.metrics.service";
import { Auction } from "./entities/auction";
import { GatewayComponentRequest } from "./entities/gateway.component.request";

@Injectable()
export class GatewayService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => ApiMetricsService))
    private readonly metricsService: ApiMetricsService,
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
      return await this.apiService.get(`${this.getUrl(component)}/${url}`, new ApiSettings(), errorHandler);
    } finally {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }

  private getUrl(component: GatewayComponentRequest): string {
    const lightGatewayComponents = [
      GatewayComponentRequest.addressBalance,
      GatewayComponentRequest.addressDetails,
      GatewayComponentRequest.addressEsdt,
      GatewayComponentRequest.addressNftByNonce,
      GatewayComponentRequest.vmQuery,
    ];

    if (lightGatewayComponents.includes(component)) {
      return this.apiConfigService.getLightGatewayUrl() ?? this.apiConfigService.getGatewayUrl();
    }

    return this.apiConfigService.getGatewayUrl();
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
