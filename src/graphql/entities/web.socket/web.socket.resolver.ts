import { Resolver } from "@nestjs/graphql";
import { WebsocketConfig } from "src/endpoints/websocket/entities/websocket.config";
import { WebsocketService } from "src/endpoints/websocket/websocket.service";
import { WebsocketConfigQuery } from "./web.socket.query";

@Resolver(() => WebsocketConfig)
export class WebsocketConfigResolver extends WebsocketConfigQuery {
  constructor(websocketService: WebsocketService) {
    super(websocketService);
  }
}
