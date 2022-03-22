import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { WebsocketConfig } from "./entities/websocket.config";

@Injectable()
export class WebsocketService {
  constructor(
    private readonly apiConfigService: ApiConfigService
  ) { }

  getConfiguration(): WebsocketConfig {
    return {
      url: this.apiConfigService.getSocketUrl(),
    };
  }
}
