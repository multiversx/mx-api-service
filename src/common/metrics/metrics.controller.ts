import { Controller, Get } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Controller()
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService
  ) {}
  
  @Get("/metrics")
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
  
  @Get("/hello")
  async getHello(): Promise<string> {
    return 'hello';
  }
}