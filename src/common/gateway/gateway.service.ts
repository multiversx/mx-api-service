import { ApiService, ApiSettings } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { Auction } from "./entities/auction";
import { GatewayComponentRequest } from "./entities/gateway.component.request";
import { LogPerformanceAsync } from "../../decorators/log.performance.decorators";

@Injectable()
export class GatewayService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService
  ) { }

  async getAuctions(): Promise<Auction[]> {
    const result = await this.get('validator/auction', GatewayComponentRequest.validatorAuction);

    return result.auction;
  }

  @LogPerformanceAsync('setGatewayDuration', { argIndex: 1 })
  async get(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const result = await this.getRaw(url, component, errorHandler);
    return result?.data?.data;
  }

  @LogPerformanceAsync('setGatewayDuration', { argIndex: 1 })
  async getRaw(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    return await this.apiService.get(`${this.getUrl(component)}/${url}`, new ApiSettings(), errorHandler);
  }

  private getUrl(component: GatewayComponentRequest): string {
    const lightGatewayComponents = [
      GatewayComponentRequest.addressBalance,
      GatewayComponentRequest.addressDetails,
      GatewayComponentRequest.addressEsdt,
      GatewayComponentRequest.vmQuery,
    ];

    if (lightGatewayComponents.includes(component)) {
      return this.apiConfigService.getLightGatewayUrl() ?? this.apiConfigService.getGatewayUrl();
    }

    return this.apiConfigService.getGatewayUrl();
  }

  @LogPerformanceAsync('setGatewayDuration', { argIndex: 1 })
  async create(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const result = await this.createRaw(url, component, data, errorHandler);
    return result?.data?.data;
  }

  @LogPerformanceAsync('setGatewayDuration', { argIndex: 1 })
  async createRaw(url: string, _component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    return await this.apiService.post(`${this.apiConfigService.getGatewayUrl()}/${url}`, data, new ApiSettings(), errorHandler);
  }
}
