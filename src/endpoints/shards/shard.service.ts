// import { Injectable } from "@nestjs/common";
// import { ElasticPagination } from "src/helpers/entities/ElasticPagination";
// import { ElasticService } from "src/helpers/elastic.service";
// import { mergeObjects } from "src/helpers/helpers";

// @Injectable()
// export class ShardService {
//   constructor(private readonly elasticService: ElasticService) {}

//   async getShards(shard: number | null, from: number, size: number): Promise<Shard[]> {
//     const query = {
//       shardId: shard
//     };

//     const pagination: ElasticPagination = {
//       from,
//       size
//     }

//     const sort = {
//       timestamp: 'desc',
//     };

//     let result = await this.elasticService.getList('blocks', 'hash', query, pagination, sort);

//     for (let item of result) {
//       item.shard = item.shardId;
//     }

//     return result.map(item => mergeObjects(new Block(), item));
//   }
// }