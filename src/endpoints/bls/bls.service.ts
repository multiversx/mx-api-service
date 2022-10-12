import { CachingService } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { IndexerService } from "src/common/indexer/indexer.service";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class BlsService {
  constructor(
    @Inject(forwardRef(() => IndexerService))
    private readonly indexerService: IndexerService,
    private readonly cachingService: CachingService,
  ) { }

  public async getPublicKeys(shard: number, epoch: number): Promise<string[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.ShardAndEpochBlses(shard, epoch).key,
      async () => await this.getPublicKeysRaw(shard, epoch),
      CacheInfo.ShardAndEpochBlses(shard, epoch).ttl
    );
  }

  private async getPublicKeysRaw(shard: number, epoch: number): Promise<string[]> {
    const publicKeys = await this.indexerService.getPublicKeys(shard, epoch);
    if (publicKeys) {
      return publicKeys;
    }
    return [];
  }

  async getBlsIndex(bls: string, shardId: number, epoch: number): Promise<number | boolean> {
    const publicKeys = await this.getPublicKeys(shardId, epoch);

    return publicKeys.indexOf(bls);
  }
}
