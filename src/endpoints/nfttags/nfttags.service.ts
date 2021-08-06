import { Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ElasticService } from "src/helpers/elastic.service";
import { ElasticQuery } from "src/helpers/entities/elastic/elastic.query";
import { ElasticSortOrder } from "src/helpers/entities/elastic/elastic.sort.order";
import { ElasticSortProperty } from "src/helpers/entities/elastic/elastic.sort.property";
import { mergeObjects } from "src/helpers/helpers";
import { NftTag } from "./entities/nft.tag";

@Injectable()
export class NftTagsService {

  constructor(
    private readonly elasticService: ElasticService, 
  ) {}

  async getNftTags(pagination: QueryPagination): Promise<NftTag[]> {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = pagination;
   
    const count: ElasticSortProperty = { name: 'count', order: ElasticSortOrder.descending };
    elasticQueryAdapter.sort = [count];

    let result = await this.elasticService.getList('tags', 'tag', elasticQueryAdapter);

    let nftTags: NftTag[] = result.map(item => mergeObjects(new NftTag(), item));

    return nftTags;
  }

  async getNftTag(tag: string): Promise<NftTag> {
    let result = await this.elasticService.getItem('tags', 'tag', tag);

    return mergeObjects(new NftTag(), result);
  }
}