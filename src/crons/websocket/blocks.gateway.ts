import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BlockService } from '../../endpoints/blocks/block.service';
import { BlockFilter } from '../../endpoints/blocks/entities/block.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { BlockSubscribePayload } from '../../endpoints/blocks/entities/block.subscribe';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { WebsocketExceptionsFilter } from 'src/utils/ws-exceptions.filter';
import { WsValidationPipe } from 'src/utils/ws-validation.pipe';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { RoomKeyGenerator } from './room.key.generator';
import { LockingGuardInterceptor } from 'src/utils/locking.guard.interceptor';
import { LatestBlocksTracker } from './latest.blocks.tracker';

@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class BlocksGateway {
  private readonly logger = new OriginLogger(BlocksGateway.name);
  static readonly keyPrefix = 'blocks-';

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly blockService: BlockService,
    private readonly latestBlocksTracker: LatestBlocksTracker,
  ) { }

  @UseInterceptors(LockingGuardInterceptor)
  @SubscribeMessage('subscribeBlocks')
  async handleSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: BlockSubscribePayload
  ) {
    const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
    const roomName = `${BlocksGateway.keyPrefix}${filterIdentifier}`;

    if (!client.rooms.has(roomName)) {
      await client.join(roomName);
    }

    return { status: 'success' };
  }

  @SubscribeMessage('unsubscribeBlocks')
  async handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: BlockSubscribePayload
  ) {
    const filterIdentifier = RoomKeyGenerator.deterministicStringify(payload);
    const roomName = `${BlocksGateway.keyPrefix}${filterIdentifier}`;

    if (client.rooms.has(roomName)) {
      await client.leave(roomName);
    }

    return { status: 'unsubscribed' };
  }

  async pushBlocksForRoom(roomName: string): Promise<void> {
    if (!roomName.startsWith(BlocksGateway.keyPrefix)) return;

    try {
      const filterIdentifier = roomName.replace(BlocksGateway.keyPrefix, "");
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
    const roomNames = await this.latestBlocksTracker.getRoomsWithNewBlocks(BlocksGateway.keyPrefix, this.server.sockets.adapter.rooms);

    await Promise.all(roomNames.map(roomName => this.pushBlocksForRoom(roomName)));
  }
}

