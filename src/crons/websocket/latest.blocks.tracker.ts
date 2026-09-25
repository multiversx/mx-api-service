import { Injectable } from '@nestjs/common';
import { ElasticQuery, ElasticService, ElasticSortOrder } from '@multiversx/sdk-nestjs-elastic';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { ProtocolService } from 'src/common/protocol/protocol.service';

@Injectable()
export class LatestBlocksTracker {
  private readonly pushedFingerprints = new Map<string, string>();
  private fingerprintPromise: Promise<string> | undefined;
  private fingerprintTimestamp = 0;

  constructor(
    private readonly elasticService: ElasticService,
    private readonly protocolService: ProtocolService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  async getRoomsWithNewBlocks(prefix: string, rooms: Map<string, Set<string>>): Promise<string[]> {
    const fingerprint = await this.getFingerprint();

    const roomNames: string[] = [];
    for (const roomName of rooms.keys()) {
      if (!roomName.startsWith(prefix) || this.pushedFingerprints.get(roomName) === fingerprint) {
        continue;
      }

      this.pushedFingerprints.set(roomName, fingerprint);
      roomNames.push(roomName);
    }

    for (const roomName of this.pushedFingerprints.keys()) {
      if (roomName.startsWith(prefix) && !rooms.has(roomName)) {
        this.pushedFingerprints.delete(roomName);
      }
    }

    return roomNames;
  }

  // shared by all the gateways running in the same tick
  private async getFingerprint(): Promise<string> {
    const maxAgeMs = this.apiConfigService.getWebsocketSubscriptionBroadcastIntervalMs() / 2;

    const now = Date.now();
    if (!this.fingerprintPromise || now - this.fingerprintTimestamp >= maxAgeMs) {
      this.fingerprintTimestamp = now;
      this.fingerprintPromise = this.getFingerprintRaw();
    }

    return await this.fingerprintPromise;
  }

  private async getFingerprintRaw(): Promise<string> {
    const shardCount = await this.protocolService.getShardCount();

    const elasticQuery = ElasticQuery.create()
      .withSort([
        { name: 'timestamp', order: ElasticSortOrder.descending },
        { name: 'timestampMs', order: ElasticSortOrder.descending, missing: 0 },
        { name: 'shardId', order: ElasticSortOrder.ascending },
      ])
      .withPagination({ from: 0, size: shardCount + 1 })
      .withFields(['shardId']);

    const blocks = await this.elasticService.getList('blocks', 'hash', elasticQuery);

    return blocks.map(block => block.hash).join(',');
  }
}
