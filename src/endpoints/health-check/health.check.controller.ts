import { Controller, Get } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { NoAuth } from "src/decorators/no.auth";

@Controller()
export class HealthCheckController {
  @Get("/hello")
  @ApiOperation({ summary: 'Health check', description: 'Returns \'hello\', used for performing health checks' })
  @NoAuth()
  getHello(): string {
    return 'hello';
  }
}
