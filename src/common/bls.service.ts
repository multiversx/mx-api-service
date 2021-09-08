import { Injectable } from "@nestjs/common";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { AddressUtils } from "src/utils/address.utils";
import { ApiConfigService } from "./api.config.service";
import { ElasticService } from "./elastic.service";

@Injectable()
export class BlsService {
  private readonly url: string;
  private publicKeysCache: any = {};

  constructor(
    private apiConfigService: ApiConfigService,
    private readonly elasticService: ElasticService,
    private readonly vmQueryService: VmQueryService,
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

  async getBlsOwner(bls: string): Promise<string | undefined> {
    let result = await this.vmQueryService.vmQuery(
      this.apiConfigService.getStakingContractAddress(),
      'getOwner',
      this.apiConfigService.getAuctionContractAddress(),
      [ bls ],
    );

    if (!result) {
      return undefined;
    }

    const [encodedOwnerBase64] = result;
  
    return AddressUtils.bech32Encode(Buffer.from(encodedOwnerBase64, 'base64').toString('hex'));
  };
  
  async getOwnerBlses(owner: string): Promise<string[]> {
    const getBlsKeysStatusListEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getAuctionContractAddress(),
      'getBlsKeysStatus',
      this.apiConfigService.getAuctionContractAddress(),
      [ AddressUtils.bech32Decode(owner) ],
    );
  
    if (!getBlsKeysStatusListEncoded) {
      return [];
    }
  
    return getBlsKeysStatusListEncoded.reduce((result: any[], _: string, index: number, array: string[]) => {
      if (index % 2 === 0) {
        const [blsBase64, _] = array.slice(index, index + 2);
  
        const bls = Buffer.from(blsBase64, 'base64').toString('hex');
  
        result.push(bls);
      }
  
      return result;
    }, []);
  };
}
