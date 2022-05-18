import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import axios, { AxiosRequestConfig } from "axios";
import Agent from 'agentkeepalive';
import { MetricsService } from "src/common/metrics/metrics.service";
import { ApiConfigService } from "../api-config/api.config.service";
import { PerformanceProfiler } from "src/utils/performance.profiler";
import { ApiSettings } from "./entities/api.settings";

@Injectable()
export class ApiService {
  private readonly defaultTimeout: number = 30000;
  private keepaliveAgent: Agent | undefined | null = null;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => MetricsService))
    private readonly metricsService: MetricsService,
  ) { }

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


  private getConfig(settings: ApiSettings): AxiosRequestConfig {
    const timeout = settings.timeout || this.defaultTimeout;
    const maxRedirects = settings.skipRedirects === true ? 0 : undefined;

    const headers = settings.headers ?? {};

    const rateLimiterSecret = this.apiConfigService.getRateLimiterSecret();
    if (rateLimiterSecret) {
      // @ts-ignore
      headers['x-rate-limiter-secret'] = rateLimiterSecret;
    }

    return {
      timeout,
      maxRedirects,
      httpAgent: this.getKeepAliveAgent(),
      responseType: settings.responseType,
      headers,
      transformResponse: [
        (data) => {
          try {
            return JSON.parse(data);
          } catch (error) {
            return data;
          }
        },
      ],
    };
  }

  async get(url: string, settings: ApiSettings = new ApiSettings(), errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();

    try {
      return await axios.get(url, this.getConfig(settings));
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      }

      if (!handled) {
        const logger = new Logger(ApiService.name);
        const customError = {
          method: 'GET',
          url,
          response: error.response?.data,
          status: error.response?.status,
          message: error.message,
          name: error.name,
        };

        logger.error(customError);

        throw customError;
      }
    } finally {
      profiler.stop();
      this.metricsService.setExternalCall(this.getHostname(url), profiler.duration);
    }
  }

  async post(url: string, data: any, settings: ApiSettings = new ApiSettings(), errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();

    try {
      return await axios.post(url, data, this.getConfig(settings));
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      }

      if (!handled) {
        const customError = {
          method: 'POST',
          url,
          body: data,
          response: error.response?.data,
          status: error.response?.status,
          message: error.message,
          name: error.name,
        };

        const logger = new Logger(ApiService.name);
        logger.error(customError);

        throw customError;
      }
    } finally {
      profiler.stop();
      this.metricsService.setExternalCall(this.getHostname(url), profiler.duration);
    }
  }

  async head(url: string, settings: ApiSettings = new ApiSettings(), errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();

    try {
      return await axios.head(url, this.getConfig(settings));
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      }

      if (!handled) {
        const customError = {
          method: 'HEAD',
          url,
          response: error.response?.data,
          status: error.response?.status,
          message: error.message,
          name: error.name,
        };

        const logger = new Logger(ApiService.name);
        logger.error(customError);

        throw customError;
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
