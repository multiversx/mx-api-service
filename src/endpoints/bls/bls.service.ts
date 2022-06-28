import { ElasticService } from "@elrondnetwork/nestjs-microservice-common";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "../../common/api-config/api.config.service";

@Injectable()
export class BlsService {
  private readonly url: string;
  private publicKeysCache: any = {};

  constructor(
    private apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ElasticService))
    private readonly elasticService: ElasticService,
  ) {
    this.url = this.apiConfigService.getElasticUrl();
  }


  public async getPublicKeys(shard: number, epoch: number): Promise<string[]> {
    const key = `${shard}_${epoch}`;

    if (this.publicKeysCache[key]) {
      return this.publicKeysCache[key];
    }

    const url = `${this.url}/validators/_search?q=_id:${key}`;

    const result = await this.elasticService.get(url);

    const hits = result.data?.hits?.hits;
    if (hits && hits.length > 0) {
      const publicKeys = hits[0]._source.publicKeys;

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
