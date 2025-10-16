import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BlockService } from '../../endpoints/blocks/block.service';
import { BlockFilter } from '../../endpoints/blocks/entities/block.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { BlockSubscribePayload } from '../../endpoints/blocks/entities/block.subscribe';
import { UseFilters } from '@nestjs/common';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class BlocksGateway {
  private readonly logger = new OriginLogger(BlocksGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly blockService: BlockService) { }

  @SubscribeMessage('subscribeBlocks')
  async handleSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: BlockSubscribePayload
  ) {
    const filterIdentifier = JSON.stringify(payload);
    await client.join(`blocks-${filterIdentifier}`);

    return { status: 'success' };
  }

  async pushBlocksForRoom(roomName: string): Promise<void> {
    if (!roomName.startsWith("blocks-")) return;

    try {
      const filterIdentifier = roomName.replace("blocks-", "");
      const filter: BlockSubscribePayload = JSON.parse(filterIdentifier);

      const blockFilter = new BlockFilter({
        shard: filter.shard,
        order: filter.order,
      });

      const [blocks, blocksCount] = await Promise.all([
        this.blockService.getBlocks(
          blockFilter,
          new QueryPagination({ from: filter.from, size: filter.size }),
          filter.withProposerIdentity,
        ),
        this.blockService.getBlocksCount(blockFilter),
      ]);

      this.server.to(roomName).emit("blocksUpdate", { blocks, blocksCount });
    } catch (error) {
      this.logger.error(error);
    }
  }

  async pushBlocks(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [roomName] of this.server.sockets.adapter.rooms) {
      promises.push(this.pushBlocksForRoom(roomName));
    }

    await Promise.all(promises);
  }
}

