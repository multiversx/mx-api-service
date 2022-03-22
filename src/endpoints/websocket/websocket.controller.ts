import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { WebsocketConfig } from "./entities/websocket.config";
import { WebsocketService } from "./websocket.service";

@Controller('websocket')
@ApiTags('websocket')
export class WebsocketController {
  constructor(
    private readonly websocketConfigService: WebsocketService,
  ) { }

  @Get("/config")
  @ApiResponse({
    status: 200,
    description: 'Websocket configuration for specified network',
  })
  @ApiResponse({
    status: 404,
    description: 'Websocket configuration not found',
    type: WebsocketConfig,
  })
  getConfiguration(): WebsocketConfig {
    return this.websocketConfigService.getConfiguration();
  }
}
