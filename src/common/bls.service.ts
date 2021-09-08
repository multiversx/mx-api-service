import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "./api.config.service";
import { ElasticService } from "./elastic.service";

@Injectable()
export class BlsService {
  private readonly url: string;
  private publicKeysCache: any = {};

  constructor(
    private apiConfigService: ApiConfigService,
    private readonly elasticService: ElasticService,
  ) { 
    this.url = this.apiConfigService.getElasticUrl();
  }


  public async getPublicKeys(shard: number, epoch: number) {
    const key = `${shard}_${epoch}`;
  
    if (this.publicKeysCache[key]) {
      return this.publicKeysCache[key];
    }
  
    const url = `${this.url}/validators/_search?q=_id:${key}`;
  
    let result = await this.elasticService.get(url);

    let hits = result.data?.hits?.hits;
    if (hits && hits.length > 0) {
      let publicKeys = hits[0]._source.publicKeys;

      this.publicKeysCache[key] = publicKeys;
    
      return publicKeys;
    }

    return [];
  };

  async getBlsIndex(bls: string, shardId: number, epoch: number): Promise<number | boolean> {
    let publicKeys = await this.getPublicKeys(shardId, epoch);

    return publicKeys.indexOf(bls);
  };
}
