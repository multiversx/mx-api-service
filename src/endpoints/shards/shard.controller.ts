import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from "@nestjs/common";
import { ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ShardService } from "./shard.service";
import { Shard } from "./entities/shard";

@Controller()
@ApiTags('shards')
export class ShardController {
	constructor(private readonly shardService: ShardService) {}

	@Get("/shards")
	@ApiResponse({
		status: 200,
		description: 'The shards available on the blockchain',
		type: Shard,
		isArray: true
	})
	@ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
	@ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
	async getShards(
		@Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
		@Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
	): Promise<Shard[]> {
		return await this.shardService.getShards({from, size});
	}
}