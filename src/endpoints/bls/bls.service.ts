import { ElasticService } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { IndexerService } from "src/common/indexer/indexer.service";

@Injectable()
export class BlsService {
  private publicKeysCache: any = {};

  constructor(
    @Inject(forwardRef(() => ElasticService))
    private readonly indexerService: IndexerService,
  ) { }


  public async getPublicKeys(shard: number, epoch: number): Promise<string[]> {
    const key = `${shard}_${epoch}`;

    if (this.publicKeysCache[key]) {
      return this.publicKeysCache[key];
    }

    const publicKeys = await this.indexerService.getPublicKeys(shard, epoch);
    if (publicKeys) {
      this.publicKeysCache[key] = publicKeys;
      return publicKeys;
    }

    return [];
  }

  async getBlsIndex(bls: string, shardId: number, epoch: number): Promise<number | boolean> {
    const publicKeys = await this.getPublicKeys(shardId, epoch);

    return publicKeys.indexOf(bls);
  }
}
