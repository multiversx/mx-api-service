import { Injectable } from "@nestjs/common";
import axios from "axios";
import { ApiConfigService } from "./api.config.service";

@Injectable()
export class GatewayService {
  constructor(private readonly apiConfigService: ApiConfigService) {}

  async get(url: string): Promise<any> {
    let result = await this.getRaw(url);
    return result.data.data;
  }

  async getRaw(url: string): Promise<any> {
    return await axios.get(`${this.apiConfigService.getGatewayUrl()}/${url}`);
  }

  async create(url: string, data: any): Promise<any> {
    let result = await this.createRaw(url, data);
    return result.data.data;
  }

  async createRaw(url: string, data: any): Promise<any> {
    return await axios.post(`${this.apiConfigService.getGatewayUrl()}/${url}`, data);
  }
}