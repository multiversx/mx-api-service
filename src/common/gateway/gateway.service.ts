import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { ApiService } from "../network/api.service";

@Injectable()
export class GatewayService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService
  ) {}

  async get(url: string, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    let result = await this.getRaw(url, errorHandler);
    return result?.data?.data;
  }

  async getRaw(url: string, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    return await this.apiService.get(`${this.apiConfigService.getGatewayUrl()}/${url}`, undefined, errorHandler);
  }

  async create(url: string, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    let result = await this.createRaw(url, data, errorHandler);
    return result?.data?.data;
  }

  async createRaw(url: string, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    return await this.apiService.post(`${this.apiConfigService.getGatewayUrl()}/${url}`, data, undefined, errorHandler);
  }

  async getShards(): Promise<number[]> {
    let networkConfig = await this.get('network/config');
    let shardCount = networkConfig.config.erd_num_shards_without_meta;

    let result = [];
    for (let i = 0; i < shardCount; i++) {
      result.push(i);
    }

    result.push(4294967295);
    return result;
  }
}