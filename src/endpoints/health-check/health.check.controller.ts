import { NoAuth } from "@multiversx/sdk-nestjs";
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@Controller()
@ApiTags('infra')
export class HealthCheckController {
  @Get("/hello")
  @ApiOperation({ summary: 'Health check', description: 'Returns \'hello\', used for performing health checks' })
  @NoAuth()
  getHello(): string {
    return 'hello';
  }
}
