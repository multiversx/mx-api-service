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
  
    const url = `${this.url}/validators/_doc/${key}`;
  
    const {
      data: {
        _source: { publicKeys },
      },
    } = await this.elasticService.get(url);
  
    this.publicKeysCache[key] = publicKeys;
  
    return publicKeys;
  };

  async getBlsIndex(bls: string, shardId: number, epoch: number): Promise<number | boolean> {
    const url = `${this.url}/validators/_doc/${shardId}_${epoch}`;
  
    const {
      data: {
        _source: { publicKeys },
      },
    } = await this.elasticService.get(url);
  
    const index = publicKeys.indexOf(bls);
  
    if (index !== -1) {
      return index;
    }
  
    return false;
  };

  async getBlses(shard: number, epoch: number) {
    const key = `${shard}_${epoch}`;
  
    const url = `${this.url}/validators/_doc/${key}`;
  
    const {
      data: {
        _source: { publicKeys },
      },
    } = await this.elasticService.get(url);
  
    return publicKeys;
  };
}
