import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import axios, { AxiosRequestConfig } from "axios";
import { ApiConfigService } from "./api.config.service";
import { PerformanceProfiler } from "../utils/performance.profiler";
import Agent from 'agentkeepalive';
import { MetricsService } from "src/endpoints/metrics/metrics.service";

@Injectable()
export class ApiService {
  private readonly defaultTimeout: number = 30000;
  private keepaliveAgent: Agent | undefined | null = null;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => MetricsService))
    private readonly metricsService: MetricsService
  ) {};
  
  private getKeepAliveAgent(): Agent | undefined {
    if (this.keepaliveAgent === null) {
      if (this.apiConfigService.getUseKeepAliveAgentFlag()) {
        this.keepaliveAgent = new Agent({
          keepAlive: true,
          maxSockets: Infinity,
          maxFreeSockets: 10,
          timeout: this.apiConfigService.getAxiosTimeout(), // active socket keepalive
          freeSocketTimeout: 30000, // free socket keepalive for 30 seconds
        });
      } else {
        this.keepaliveAgent = undefined;
      }
    }

    return this.keepaliveAgent;
  }


  private getConfig(timeout: number | undefined): AxiosRequestConfig {
    timeout = timeout || this.defaultTimeout;

    let headers = {};

    let rateLimiterSecret = this.apiConfigService.getRateLimiterSecret();
    if (rateLimiterSecret) {
      // @ts-ignore
      headers['x-rate-limiter-secret'] = rateLimiterSecret;
    }

    return {
      timeout,
      httpAgent: this.getKeepAliveAgent(),
      headers,
      transformResponse: [ 
        (data) => {
          try {
            return JSON.parse(data);
          } catch (error) {
            return data;
          }
        }  
      ],
    };
  }

  async get(url: string, timeout: number | undefined = undefined, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    timeout = timeout || this.defaultTimeout;

    let profiler = new PerformanceProfiler();

    try {
      return await axios.get(url, this.getConfig(timeout));
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      } 
      
      if (!handled) {
        let logger = new Logger(ApiService.name);
        logger.error({
          method: 'GET',
          url,
          response: error.response?.data,
          status: error.response?.status,
          message: error.message,
          name: error.name,
        });

        throw error;
      }
    } finally {
      profiler.stop();
      this.metricsService.setExternalCall(this.getHostname(url), profiler.duration);
    }
  }

  async post(url: string, data: any, timeout: number | undefined = undefined, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    timeout = timeout || this.defaultTimeout;

    let profiler = new PerformanceProfiler();
    
    try {
      return await axios.post(url, data, this.getConfig(timeout));
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      } 
      
      if (!handled) {
        let logger = new Logger(ApiService.name);
        logger.error({
          method: 'POST',
          url,
          body: data,
          response: error.response?.data,
          status: error.response?.status,
          message: error.message,
          name: error.name,
        });

        throw error;
      }
    } finally {
      profiler.stop();
      this.metricsService.setExternalCall(this.getHostname(url), profiler.duration);
    }
  }

  async head(url: string, timeout: number | undefined = undefined, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    timeout = timeout || this.defaultTimeout;

    let profiler = new PerformanceProfiler();

    try {
      return await axios.head(url, this.getConfig(timeout));
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      } 
      
      if (!handled) {
        let logger = new Logger(ApiService.name);
        logger.error({
          method: 'HEAD',
          url,
          response: error.response?.data,
          status: error.response?.status,
          message: error.message,
          name: error.name,
        });

        throw error;
      }
    } finally {
      profiler.stop();
      this.metricsService.setExternalCall(this.getHostname(url), profiler.duration);
    }
  }

  private getHostname(url: string): string {
    return new URL(url).hostname;
  }
}