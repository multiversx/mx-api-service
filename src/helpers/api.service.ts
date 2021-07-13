import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { ApiConfigService } from "./api.config.service";
import { PerformanceProfiler } from "./performance.profiler";
import Agent from 'agentkeepalive';

@Injectable()
export class ApiService {
  private readonly defaultTimeout: number = 30000;
  private readonly keepaliveAgent = new Agent({
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: this.apiConfigService.getAxiosTimeout(), // active socket keepalive
    freeSocketTimeout: 30000, // free socket keepalive for 30 seconds
  });

  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) {};

  async get(url: string, timeout: number | undefined = undefined): Promise<any> {
    timeout = timeout || this.defaultTimeout;

    let profiler = new PerformanceProfiler(`apiService get ${url}`);

    try {
      return await axios.get(url, { timeout, httpAgent: this.keepaliveAgent });
    } catch(error) {
      let logger = new Logger(ApiService.name);
      logger.error(`Error when performing GET on url ${url}`);
      throw error;
    } finally {
      profiler.stop();
    }
  }

  async post(url: string, data: any, timeout: number | undefined = undefined): Promise<any> {
    timeout = timeout || this.defaultTimeout;

    let profiler = new PerformanceProfiler(`apiService post ${url}`);
    
    try {
      return await axios.post(url, data, { timeout, httpAgent: this.keepaliveAgent });
    } catch(error) {
      let logger = new Logger(ApiService.name);
      logger.error(`Error when performing POST on url ${url} and data ${JSON.stringify(data)}`);
      throw error;
    } finally {
      profiler.stop();
    }
  }

  async head(url: string, timeout: number | undefined = undefined): Promise<any> {
    timeout = timeout || this.defaultTimeout;

    let profiler = new PerformanceProfiler(`apiService head ${url}`);

    try {
      return await axios.head(url, { timeout, httpAgent: this.keepaliveAgent });
    } catch(error) {
      let logger = new Logger(ApiService.name);
      logger.error(`Error when performing HEAD on url ${url}`);
      throw error;
    } finally {
      profiler.stop();
    }
  }
}