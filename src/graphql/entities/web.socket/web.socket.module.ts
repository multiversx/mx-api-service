import { Module } from "@nestjs/common";
import { WebsocketModule as InternalWebsocketModule } from "src/endpoints/websocket/websocket.module";
import { WebsocketConfigResolver } from "./web.socket.resolver";

@Module({
  imports: [InternalWebsocketModule],
  providers: [WebsocketConfigResolver],
})
export class WebsocketModule { }
