import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthCheckController {  
  @Get("/hello")
  async getHello(): Promise<string> {
    return 'hello';
  }
}