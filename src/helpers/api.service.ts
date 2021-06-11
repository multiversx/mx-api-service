import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { PerformanceProfiler } from "./performance.profiler";

@Injectable()
export class ApiService {
  async get(url: string): Promise<any> {
    let profiler = new PerformanceProfiler(`apiService:get:${url}`);

    try {
      return await axios.get(url);
    } catch(error) {
      let logger = new Logger(ApiService.name);
      logger.error(`Error when performing GET on url ${url}`);
      throw error;
    } finally {
      profiler.stop();
    }
  }

  async post(url: string, data: any): Promise<any> {
    let profiler = new PerformanceProfiler(`apiService:get:${url}`);
    
    try {
      return await axios.post(url, data);
    } catch(error) {
      let logger = new Logger(ApiService.name);
      logger.error(`Error when performing POST on url ${url} and data ${data}`);
      throw error;
    } finally {
      profiler.stop();
    }
  }

  async head(url: string): Promise<any> {
    let profiler = new PerformanceProfiler(`apiService:get:${url}`);

    try {
      return await axios.head(url);
    } catch(error) {
      let logger = new Logger(ApiService.name);
      logger.error(`Error when performing HEAD on url ${url}`);
      throw error;
    } finally {
      profiler.stop();
    }
  }
}