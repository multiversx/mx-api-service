import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { LockingGuardInterceptor } from 'src/utils/locking.guard.interceptor';

describe('LockingGuardInterceptor', () => {
  const maxGlobal = 3;
  const maxClient = 2;

  const apiConfigService = {
    getWebsocketMaxSubscriptionsPerInstance: () => maxGlobal,
    getWebsocketMaxSubscriptionsPerClient: () => maxClient,
  } as unknown as ApiConfigService;

  const next: CallHandler = { handle: () => of({ status: 'success' }) };

  // mimics socket.io: every connected socket sits in a room named after its own id
  const createServer = (socketIds: string[], subscriptions: Record<string, string[]>) => {
    const rooms = new Map<string, Set<string>>();
    for (const id of socketIds) {
      rooms.set(id, new Set([id]));
    }

    for (const [room, members] of Object.entries(subscriptions)) {
      rooms.set(room, new Set(members));
    }

    const sockets = new Map(socketIds.map(id => [id, {}]));

    return { sockets: { adapter: { rooms }, sockets } };
  };

  const createContext = (server: any, clientId: string): ExecutionContext => {
    const clientRooms = new Set<string>();
    for (const [room, members] of server.sockets.adapter.rooms) {
      if (members.has(clientId)) {
        clientRooms.add(room);
      }
    }

    const client = { id: clientId, rooms: clientRooms, nsp: { server } };

    return { switchToWs: () => ({ getClient: () => client }) } as unknown as ExecutionContext;
  };

  it('does not count connected sockets as subscriptions', async () => {
    const socketIds = Array.from({ length: 10 }, (_, i) => `socket-${i}`);
    const server = createServer(socketIds, { 'tx-{}': ['socket-1'] });

    const interceptor = new LockingGuardInterceptor(apiConfigService);
    const result = await lastValueFrom(interceptor.intercept(createContext(server, 'socket-0'), next));

    expect(result).toEqual({ status: 'success' });
  });

  it('rejects when the instance subscriptions limit is reached', async () => {
    const server = createServer(['socket-0', 'socket-1'], {
      'tx-{"size":1}': ['socket-1'],
      'tx-{"size":2}': ['socket-1'],
      'blocks-{}': ['socket-1'],
    });

    const interceptor = new LockingGuardInterceptor(apiConfigService);

    await expect(lastValueFrom(interceptor.intercept(createContext(server, 'socket-0'), next)))
      .rejects.toThrow(`Max global subscriptions (${maxGlobal}) reached!`);
  });

  it('rejects when the client subscriptions limit is reached', async () => {
    const server = createServer(['socket-0'], {
      'tx-{}': ['socket-0'],
      'blocks-{}': ['socket-0'],
    });

    const interceptor = new LockingGuardInterceptor(apiConfigService);

    await expect(lastValueFrom(interceptor.intercept(createContext(server, 'socket-0'), next)))
      .rejects.toThrow(`Max client subscriptions (${maxClient}) reached!`);
  });
});
