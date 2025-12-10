import { ArgumentsHost, Catch } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

@Catch(WsException)
export class WebsocketExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient() as Socket;

    const pattern = host.switchToWs().getPattern();
    const data = host.switchToWs().getData();
    const error = exception.getError();

    client.emit('error', {
      pattern,
      data,
      error,
    });
  }
}
