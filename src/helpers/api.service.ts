import { Injectable } from "@nestjs/common";
import axios from "axios";
import { PerformanceProfiler } from "./performance.profiler";

@Injectable()
export class ApiService {
  async get(url: string): Promise<any> {
    let profiler = new PerformanceProfiler(`apiService:get:${url}`);

    let result = await axios.get(url);

    profiler.stop();
    
    return result;
  }

  async post(url: string, data: any): Promise<any> {
    let profiler = new PerformanceProfiler(`apiService:get:${url}`);
    
    let result = await axios.post(url, data);

    profiler.stop();

    return result;
  }

  async head(url: string): Promise<any> {
    let profiler = new PerformanceProfiler(`apiService:get:${url}`);

    let result = await axios.head(url);

    profiler.stop();

    return result;
  }
}