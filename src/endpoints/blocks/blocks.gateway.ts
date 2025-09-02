import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BlockService } from './block.service';
import { BlockFilter } from './entities/block.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { BlockSubscribePayload } from './entities/block.subscribe';
import { UseFilters } from '@nestjs/common';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' } })
export class BlocksGateway implements OnGatewayDisconnect {
  private readonly logger = new OriginLogger(BlocksGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly blockService: BlockService) { }


  @SubscribeMessage('subscribeBlocks')
  async handleSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: BlockSubscribePayload
  ) {
    const filterHash = JSON.stringify(payload);
    await client.join(`block-${filterHash}`);

    return { status: 'success' };
  }

  async pushBlocks() {
    for (const [roomName] of this.server.sockets.adapter.rooms) {
      try {
        if (!roomName.startsWith("block-")) continue;

        const filterHash = roomName.replace("block-", "");
        const filter: BlockSubscribePayload = JSON.parse(filterHash);

        const blockFilter = new BlockFilter({
          shard: filter.shard,
          order: filter.order,
        });

        const blocks = await this.blockService.getBlocks(
          blockFilter,
          new QueryPagination({ from: filter.from, size: filter.size }),
          filter.withProposerIdentity,
        );

        this.server.to(roomName).emit('blocksUpdate', blocks);
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  handleDisconnect(_client: Socket) { }
}

