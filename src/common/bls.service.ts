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

    let publicKeys = result.data.hits.hits[0]._source.publicKeys;

    this.publicKeysCache[key] = publicKeys;
  
    return publicKeys;
  };

  async getBlsIndex(bls: string, shardId: number, epoch: number): Promise<number | boolean> {
    let publicKeys = await this.getPublicKeys(shardId, epoch);

    const index = publicKeys.indexOf(bls);
  
    if (index !== -1) {
      return index;
    }
  
    return false;
  };
}
