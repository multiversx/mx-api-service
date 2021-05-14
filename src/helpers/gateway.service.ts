import { Injectable } from "@nestjs/common";
import axios from "axios";
import { ApiConfigService } from "./api.config.service";

@Injectable()
export class GatewayService {
  constructor(private readonly apiConfigService: ApiConfigService) {}

  async get(url: string): Promise<any> {
    let result = await axios.get(`${this.apiConfigService.getGatewayUrl()}/${url}`);
    return result.data.data;
  }

  async create(url: string, data: any): Promise<any> {
    let result = await axios.post(`${this.apiConfigService.getGatewayUrl()}/${url}`, data);

    return result.data.data;
  }
}