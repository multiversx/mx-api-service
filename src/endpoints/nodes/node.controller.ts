import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query, Res } from "@nestjs/common";
import { ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { NodeService } from "src/endpoints/nodes/node.service";
import { Node } from "src/endpoints/nodes/entities/node";
import { ParseOptionalBoolPipe } from "src/helpers/pipes/parse.optional.bool.pipe";
import { NodeType } from "./entities/node.type";
import { ParseOptionalEnumPipe } from "src/helpers/pipes/parse.optional.enum.pipe";
import { NodeStatus } from "./entities/node.status";
import { ParseOptionalIntPipe } from "src/helpers/pipes/parse.optional.int.pipe";
import { Response } from 'express';

@Controller()
@ApiTags('nodes')
export class NodeController {
	constructor(private readonly nodeService: NodeService) {}

	@Get("/nodes")
	@ApiResponse({
		status: 200,
		description: 'The nodes available on the blockchain',
		type: Node,
		isArray: true
	})
	@ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
	@ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
	@ApiQuery({ name: 'search', description: 'Search by name, bls or version', required: false })
	@ApiQuery({ name: 'online', description: 'Whether node is online or not', required: false, type: 'boolean' })
	@ApiQuery({ name: 'type', description: 'Type of node', required: false, enum: NodeType })
	@ApiQuery({ name: 'status', description: 'Node status', required: false, enum: NodeStatus })
	@ApiQuery({ name: 'shard', description: 'Node shard', required: false })
	@ApiQuery({ name: 'issues', description: 'Whether node has issues or not', required: false, type: 'boolean' })
	@ApiQuery({ name: 'identity', description: 'Node identity', required: false })
	@ApiQuery({ name: 'provider', description: 'Node provider', required: false })
	@ApiQuery({ name: 'owner', description: 'Node owner', required: false })
	async getNodes(
		@Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
		@Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
		@Query('search') search: string | undefined,
		@Query('online', ParseOptionalBoolPipe) online: boolean | undefined,
		@Query('type', new ParseOptionalEnumPipe(NodeType)) type: NodeType | undefined,
		@Query('status', new ParseOptionalEnumPipe(NodeStatus)) status: NodeStatus | undefined,
		@Query('shard', ParseOptionalIntPipe) shard: number | undefined,
		@Query('issues', ParseOptionalBoolPipe) issues: boolean | undefined,
		@Query('identity', ParseOptionalIntPipe) identity: string | undefined,
		@Query('provider') provider: string | undefined,
		@Query('owner', ParseOptionalIntPipe) owner: string | undefined,
	): Promise<Node[]> {
		return await this.nodeService.getNodes(from, size, { search, online, type, status, shard, issues, identity, provider, owner });
	}

	@Get("/nodes/versions")
	@ApiResponse({
		status: 200,
		description: 'The node versions available on the blockchain',
	})
	async getNodeVersions(@Res() res: Response) {
		let nodeVersions = await this.nodeService.getNodeVersions();

		res.status(HttpStatus.OK).json(nodeVersions);
	}

	@Get("/nodes/count")
	@ApiResponse({
		status: 200,
		description: 'The number of nodes available on the blockchain',
	})
	@ApiQuery({ name: 'search', description: 'Search by name, bls or version', required: false })
	@ApiQuery({ name: 'online', description: 'Whether node is online or not', required: false, type: 'boolean' })
	@ApiQuery({ name: 'type', description: 'Type of node', required: false, enum: NodeType })
	@ApiQuery({ name: 'status', description: 'Node status', required: false, enum: NodeStatus })
	@ApiQuery({ name: 'shard', description: 'Node shard', required: false })
	@ApiQuery({ name: 'issues', description: 'Whether node has issues or not', required: false, type: 'boolean' })
	@ApiQuery({ name: 'identity', description: 'Node identity', required: false })
	@ApiQuery({ name: 'provider', description: 'Node provider', required: false })
	@ApiQuery({ name: 'owner', description: 'Node owner', required: false })
	getNodeCount(
		@Query('search') search: string | undefined,
		@Query('online', ParseOptionalBoolPipe) online: boolean | undefined,
		@Query('type', new ParseOptionalEnumPipe(NodeType)) type: NodeType | undefined,
		@Query('status', new ParseOptionalEnumPipe(NodeStatus)) status: NodeStatus | undefined,
		@Query('shard', ParseOptionalIntPipe) shard: number | undefined,
		@Query('issues', ParseOptionalBoolPipe) issues: boolean | undefined,
		@Query('identity', ParseOptionalIntPipe) identity: string | undefined,
		@Query('provider', ParseOptionalIntPipe) provider: string | undefined,
		@Query('owner', ParseOptionalIntPipe) owner: string | undefined,
	): Promise<number> {
		return this.nodeService.getNodeCount({ search, online, type, status, shard, issues, identity, provider, owner });
	}

  @Get('/nodes/:bls')
  @ApiResponse({
    status: 200,
    description: 'Node details',
    type: Node
  })
  @ApiResponse({
    status: 404,
    description: 'Node not found'
  })
  async getNode(@Param('bls') bls: string): Promise<Node> {
    let provider = await this.nodeService.getNode(bls);
    if (provider === undefined) {
      throw new HttpException('Node not found', HttpStatus.NOT_FOUND);
    }

    return provider;
  }
}