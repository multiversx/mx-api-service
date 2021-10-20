import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api.config.service";
import { ApiService } from "../network/api.service";

@Injectable()
export class GatewayService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService
  ) {}

  async get(url: string): Promise<any> {
    let result = await this.getRaw(url);
    return result.data.data;
  }

  async getRaw(url: string): Promise<any> {
    return await this.apiService.get(`${this.apiConfigService.getGatewayUrl()}/${url}`);
  }

  async create(url: string, data: any): Promise<any> {
    let result = await this.createRaw(url, data);
    return result.data.data;
  }

  async createRaw(url: string, data: any): Promise<any> {
    return await this.apiService.post(`${this.apiConfigService.getGatewayUrl()}/${url}`, data);
  }
}