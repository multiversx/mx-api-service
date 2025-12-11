import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';
import { Mutex } from 'async-mutex';
import { WsException } from '@nestjs/websockets';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { Socket } from 'socket.io';

@Injectable()
export class LockingGuardInterceptor implements NestInterceptor {
  private readonly locks = new Map<string, Mutex>();

  constructor(
    private readonly apiConfigService: ApiConfigService
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const client: Socket = context.switchToWs().getClient();
    const clientId = client?.id;

    if (!clientId) {
      return next.handle();
    }

    let tempMutex = this.locks.get(clientId);

    if (!tempMutex) {
      tempMutex = new Mutex();
      this.locks.set(clientId, tempMutex);
    }

    const mutex = tempMutex;

    return from(mutex.acquire()).pipe(
      switchMap((release) => {
        try {
          const totalRoomsGlobal = client.nsp.server.sockets.adapter.rooms.size;
          const totalClientRooms = client.rooms.size;
          const maxGlobal = this.apiConfigService.getWebsocketMaxSubscriptionsPerInstance();
          const maxClient = this.apiConfigService.getWebsocketMaxSubscriptionsPerClient();

          if (totalRoomsGlobal >= maxGlobal) {
            throw new WsException(`Max global subscriptions (${maxGlobal}) reached!`);
          }

          if (totalClientRooms >= maxClient + 1) {
            throw new WsException(`Max client subscriptions (${maxClient}) reached!`);
          }

          return next.handle().pipe(
            finalize(() => {
              release();
              if (!mutex.isLocked()) {
                this.locks.delete(clientId);
              }
            })
          );

        } catch (err) {
          release();

          if (!mutex.isLocked()) {
            this.locks.delete(clientId);
          }
          return throwError(() => err);
        }
      }),
    );
  }
}
