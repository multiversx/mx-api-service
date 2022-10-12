import { Resolver, Query } from "@nestjs/graphql";
import { WebsocketConfig } from "src/endpoints/websocket/entities/websocket.config";
import { WebsocketService } from "src/endpoints/websocket/websocket.service";

@Resolver()
export class WebsocketConfigQuery {
  constructor(protected readonly websocketService: WebsocketService) { }

  @Query(() => WebsocketConfig, { name: "webSocketConfig", description: "Retrieve config used for accessing websocket on the same cluster." })
  public getSocketUrl(): WebsocketConfig {
    return this.websocketService.getConfiguration();
  }
}
