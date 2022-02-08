import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthCheckController {
  @Get("/hello")
  getHello(): string {
    return 'hello';
  }
}
