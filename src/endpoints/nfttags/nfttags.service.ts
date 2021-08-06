import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ApiConfigService } from "src/helpers/api.config.service";
import { CachingService } from "src/helpers/caching.service";
import { ElasticService } from "src/helpers/elastic.service";
import { GatewayService } from "src/helpers/gateway.service";
import { NftTag } from "./entities/nft.tag";

@Injectable()
export class NftTagsService {

  constructor(
    private readonly elasticService: ElasticService, 
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => CachingService))
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService
  ) {}

  async getNftTags(pagination: QueryPagination): Promise<NftTag[]> {
    
  }
}