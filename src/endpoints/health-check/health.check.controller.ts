import { Controller, Get } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

@Controller()
export class HealthCheckController {
  @Get("/hello")
  @ApiOperation({ summary: 'Health check', description: 'Returns \'hello\', used for performing health checks' })
  getHello(): string {
    return 'hello';
  }
}
