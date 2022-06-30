import { NoAuth } from "@elrondnetwork/erdnest";
import { Controller, Get } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

@Controller()
export class HealthCheckController {
  @Get("/hello")
  @ApiOperation({ summary: 'Health check', description: 'Returns \'hello\', used for performing health checks' })
  @NoAuth()
  getHello(): string {
    return 'hello';
  }
}
