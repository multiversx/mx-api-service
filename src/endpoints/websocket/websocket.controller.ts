import { Controller, Get } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { WebsocketConfig } from "./entities/websocket.config";
import { WebsocketService } from "./websocket.service";

@Controller('websocket')
@ApiTags('websocket')
export class WebsocketController {
  constructor(
    private readonly websocketConfigService: WebsocketService,
  ) { }

  @Get("/config")
  @ApiOperation({ summary: 'Websocket configuration', description: 'Returns config used for accessing websocket on the same cluster' })
  @ApiOkResponse({ type: WebsocketConfig })
  @ApiNotFoundResponse({ description: 'Websocket configuration not found' })

  getConfiguration(): WebsocketConfig {
    return this.websocketConfigService.getConfiguration();
  }
}
