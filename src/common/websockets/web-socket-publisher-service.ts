import { AddressUtils, OriginLogger } from "@multiversx/sdk-nestjs-common";
import * as os from 'os';
import { URL } from 'url';
import { ShardTransaction } from "@multiversx/sdk-transaction-processor";
import { Injectable } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionActionService } from "src/endpoints/transactions/transaction-action/transaction.action.service";

@Injectable()
@WebSocketGateway(3099)
export class WebSocketPublisherService {
  private readonly maxAddressesSize = 16;
  private readonly logger = new OriginLogger(WebSocketPublisherService.name);

  @WebSocketServer()
  server: Server | undefined;

  constructor(
    private readonly transactionActionService: TransactionActionService
  ) { }

  // Called by NestJS after the Socket.IO server is created
  afterInit(server: Server) {
    this.logger.log(
      `[init] pid=${process.pid} host=${os.hostname()} path=${(server as any).opts?.path ?? '/socket.io'} transports=${JSON.stringify((server as any).opts?.transports ?? ['polling','websocket'])} adapter=${(server.of('/') as any).adapter?.constructor?.name ?? 'unknown'}`,
    );

    // Engine.IO level hooks — useful to debug EIO sid lifecycle
    const eio = (server as any).engine;
    if (!eio) {
      this.logger.log('[init] engine.io not available');
      return;
    }

    eio.on('connection', (rawSocket: any) => {
      const req = rawSocket?.request;
      const remote = req?.socket?.remoteAddress ?? '';
      const xff = req?.headers?.['x-forwarded-for'] ?? '';
      const ua = req?.headers?.['user-agent'] ?? '';
      const transport = rawSocket?.transport?.name ?? '';
      this.logger.log(`[eio:connection] sid=${rawSocket?.id} transport=${transport} ip=${remote} xff=${xff} ua=${ua}`);

      rawSocket.on('upgrade', (to: any) => {
        this.logger.log(`[eio:upgrade] sid=${rawSocket?.id} to=${to?.name ?? to}`);
      });
      rawSocket.on('close', (reason: any) => {
        this.logger.log(`[eio:close] sid=${rawSocket?.id} reason=${reason}`);
      });
      rawSocket.on('error', (err: any) => {
        this.logger.error(`[eio:error] sid=${rawSocket?.id} ${err?.message ?? err}`);
      });
    });

    // Fired for every request handled by Engine.IO (handshake + subsequent polling/websocket)
    eio.on('headers', (_headers: any, req: any) => {
      try {
        const method = req?.method ?? '';
        const urlStr = (req?.url as string) ?? '';
        const parsed = new URL(urlStr, 'http://localhost');
        const sid = parsed.searchParams.get('sid') ?? '';
        const transport = parsed.searchParams.get('transport') ?? '';
        const eioVersion = parsed.searchParams.get('EIO') ?? '';
        const remote = req?.socket?.remoteAddress ?? '';
        const xff = req?.headers?.['x-forwarded-for'] ?? '';
        const host = req?.headers?.['host'] ?? '';
        const cookie = (req?.headers?.['cookie'] as string | undefined) ?? '';
        const shortCookie = cookie.length > 200 ? cookie.substring(0, 200) + '…' : cookie;
        const clients = (eio as any).clients ?? {};
        const hasSid = sid ? !!clients[sid] : false;
        const willLikely400 = !!sid && !hasSid; // indicative of "Session ID unknown"
        this.logger.log(
          `[eio:headers] method=${method} url=${parsed.pathname} sid=${sid} sidKnown=${hasSid} transport=${transport} EIO=${eioVersion} host=${host} ip=${remote} xff=${xff} cookie=${shortCookie} likely400=${willLikely400}`,
        );
      } catch (err) {
        this.logger.error(`[eio:headers:error] ${(err as any)?.message ?? err}`);
      }
    });

    // Handshake failures at the Socket.IO layer
    (server as any).on('connection_error', (err: any) => {
      this.logger.error(`[sio:connection_error] code=${err?.data?.code ?? err?.code} message=${err?.message ?? ''}`);
    });

    // Engine.IO connection errors (e.g., unknown session id on follow-up requests)
    eio.on('connection_error', (err: any) => {
      try {
        const req = (err as any)?.req;
        const urlStr = req?.url ?? '';
        const parsed = new URL(urlStr, 'http://localhost');
        const sid = parsed.searchParams.get('sid') ?? '';
        const transport = parsed.searchParams.get('transport') ?? '';
        const code = (err as any)?.code ?? (err as any)?.data?.code;
        const message = (err as any)?.message ?? (err as any)?.data?.message;
        const remote = req?.socket?.remoteAddress ?? '';
        const xff = req?.headers?.['x-forwarded-for'] ?? '';
        this.logger.error(`[eio:connection_error] sid=${sid} transport=${transport} code=${code} message=${message} ip=${remote} xff=${xff}`);
      } catch (e) {
        this.logger.error(`[eio:connection_error] ${e}`);
      }
    });
  }

  async handleDisconnect(socket: Socket) {
    const { addresses, error } = this.getAddressesFromSocketQuery(socket);
    this.logger.log(
      `[disconnect] socketId=${socket.id} eioSid=${(socket as any).conn?.id ?? ''} roomsBefore=${JSON.stringify(Array.from(socket.rooms))} queryAddresses=${JSON.stringify(addresses)} error=${error ?? 'none'}`,
    );
    if (error) {
      socket.emit('error', error);
      return;
    }

    for (const address of addresses) {
      await socket.leave(address);
    }

    this.logServerState('after-disconnect');
  }

  async handleConnection(socket: Socket) {
    const { addresses, error } = this.getAddressesFromSocketQuery(socket);
    this.logger.log(
      `[connect] socketId=${socket.id} eioSid=${(socket as any).conn?.id ?? ''} xff=${socket.handshake.headers['x-forwarded-for'] ?? ''} ip=${socket.handshake.address ?? ''} transports=${JSON.stringify(socket.conn.transport?.name)} queryAddresses=${JSON.stringify(addresses)} error=${error ?? 'none'}`,
    );
    if (error) {
      socket.emit('error', error);
      return;
    }

    // capture rooms before they are cleared by Socket.IO
    socket.on('disconnecting', (reason) => {
      this.logger.log(
        `[disconnecting] socketId=${socket.id} eioSid=${(socket as any).conn?.id ?? ''} reason=${reason} rooms=${JSON.stringify(Array.from(socket.rooms))}`,
      );
    });

    await socket.join(addresses);
    this.logger.log(
      `[joined] socketId=${socket.id} joinedRooms=${JSON.stringify(addresses)} totalRoomsNow=${this.server?.sockets.adapter.rooms.size ?? 0}`,
    );
    this.logServerState('after-join');
  }

  async onTransactionCompleted(transaction: ShardTransaction) {
    await this.emitTransactionEvent(transaction, 'transactionCompleted');
  }

  async onTransactionPendingResults(transaction: ShardTransaction) {
    await this.emitTransactionEvent(transaction, 'transactionPendingResults');
  }

  onBatchUpdated(address: string, batchId: string, txHashes: string[]) {
    const roomSize = this.server?.sockets.adapter.rooms.get(address)?.size ?? 0;
    this.logger.log(
      `[emit] event=batchUpdated address=${address} listeners=${roomSize} batchId=${batchId} hashesCount=${txHashes?.length ?? 0}`,
    );
    this.server?.to(address).emit('batchUpdated', { batchId, txHashes });
  }

  private async emitTransactionEvent(transaction: ShardTransaction, eventName: string) {
    const senderListeners = this.server?.sockets.adapter.rooms.get(transaction.sender)?.size ?? 0;
    const receiverListeners = this.server?.sockets.adapter.rooms.get(transaction.receiver)?.size ?? 0;
    this.logger.log(
      `[emit] event=${eventName} hash=${transaction.hash} sender=${transaction.sender} senderListeners=${senderListeners} receiver=${transaction.receiver} receiverListeners=${receiverListeners}`,
    );
    this.server?.to(transaction.sender).emit(eventName, transaction.hash);

    if (transaction.sender === transaction.receiver) {
      const actionTransaction = new Transaction();
      actionTransaction.sender = transaction.sender;
      actionTransaction.receiver = transaction.receiver;
      actionTransaction.data = transaction.data;
      actionTransaction.value = transaction.value;

      const metadata = await this.transactionActionService.getTransactionMetadata(actionTransaction);
      if (metadata && transaction.sender !== metadata.receiver) {
        const metaReceiverListeners = this.server?.sockets.adapter.rooms.get(metadata.receiver)?.size ?? 0;
        this.logger.log(
          `[emit] event=${eventName} (metaReceiver) hash=${transaction.hash} receiver=${metadata.receiver} listeners=${metaReceiverListeners}`,
        );
        this.server?.to(metadata.receiver).emit(eventName, transaction.hash);
      }
    } else {
      const recListeners = this.server?.sockets.adapter.rooms.get(transaction.receiver)?.size ?? 0;
      this.logger.log(
        `[emit] event=${eventName} (receiver) hash=${transaction.hash} receiver=${transaction.receiver} listeners=${recListeners}`,
      );
      this.server?.to(transaction.receiver).emit(eventName, transaction.hash);
    }
  }

  private getAddressesFromSocketQuery(socket: Socket): { addresses: string[], error?: string } {
    const rawAddresses = socket.handshake.query.address as string | undefined;
    if (!rawAddresses) {
      return { addresses: [], error: 'Validation failed (an address is expected)' };
    }

    const addresses = rawAddresses.split(',');
    if (addresses.length > this.maxAddressesSize) {
      return { addresses: [], error: `Validation failed for 'address' (less than ${this.maxAddressesSize} comma separated values expected)` };
    }

    const distinctAddresses = addresses.distinct();
    for (const address of distinctAddresses) {
      if (!AddressUtils.isAddressValid(address)) {
        return { addresses: [], error: `Validation failed for 'address' (a bech32 address is expected)` };
      }
    }

    return { addresses: distinctAddresses };
  }

  private logServerState(context: string) {
    try {
      const adapter = this.server?.sockets.adapter;
      if (!adapter) {
        this.logger.log(`[state/${context}] server adapter not ready`);
        return;
      }

      const rooms = adapter.rooms; // Map<string, Set<SocketId>>
      const sids = adapter.sids;   // Map<SocketId, Set<room>>

      const totalSockets = sids?.size ?? 0;
      const totalRooms = rooms?.size ?? 0;

      // Engine.IO sessions snapshot
      const eio: any = (this.server as any)?.engine;
      const eioClients = eio?.clients ?? {};
      const eioClientIds: string[] = Object.keys(eioClients);
      const eioClientsCount: number = eio?.clientsCount ?? eioClientIds.length ?? 0;
      const eioTop = eioClientIds.slice(0, 50);

      const addressRooms: { room: string; size: number }[] = [];
      for (const [room, sockets] of rooms) {
        // filter out the auto-room for each socket id
        if (!sids.has(room)) {
          addressRooms.push({ room, size: sockets.size });
        }
      }
      // sort by size desc
      addressRooms.sort((a, b) => b.size - a.size);

      const topRooms = addressRooms.slice(0, 50); // avoid oversized logs

      this.logger.log(
        `[state/${context}] sockets=${totalSockets} rooms=${totalRooms} addressRooms=${addressRooms.length} engineClients=${eioClientsCount} engineClientSids=${JSON.stringify(eioTop)} topRooms=${JSON.stringify(topRooms)}`,
      );
    } catch (err) {
      this.logger.error(err);
    }
  }
}
