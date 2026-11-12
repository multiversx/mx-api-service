import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class SubscriptionSocketAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly compressionThreshold: number | undefined,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions & { namespace?: string, server?: any }) {
    if (this.compressionThreshold === undefined) {
      return super.createIOServer(port, options);
    }

    // payloads below the threshold are sent as they are, compressing them costs more than it saves
    return super.createIOServer(port, {
      ...options,
      perMessageDeflate: { threshold: this.compressionThreshold },
    });
  }
}
