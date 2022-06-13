import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { NodeService } from "src/endpoints/nodes/node.service";
import { Node } from "src/endpoints/nodes/entities/node";
import { ParseOptionalBoolPipe } from "src/utils/pipes/parse.optional.bool.pipe";
import { NodeType } from "./entities/node.type";
import { ParseOptionalEnumPipe } from "src/utils/pipes/parse.optional.enum.pipe";
import { NodeStatus } from "./entities/node.status";
import { ParseOptionalIntPipe } from "src/utils/pipes/parse.optional.int.pipe";
import { SortOrder } from "src/common/entities/sort.order";
import { NodeSort } from "./entities/node.sort";
import { ParseAddressPipe } from "src/utils/pipes/parse.address.pipe";
import { ParseBlsHashPipe } from "src/utils/pipes/parse.bls.hash.pipe";

@Controller()
@ApiTags('nodes')
export class NodeController {
  constructor(private readonly nodeService: NodeService) { }

  @Get("/nodes")
  @ApiOperation({ summary: 'Nodes', description: 'Returns a list of nodes of type observer or validator' })
  @ApiOkResponse({ type: [Node] })
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
  @ApiQuery({ name: 'sort', description: 'Sorting criteria', required: false })
  @ApiQuery({ name: 'order', description: 'Sorting order (asc / desc)', required: false })
  async getNodes(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('online', ParseOptionalBoolPipe) online?: boolean,
    @Query('type', new ParseOptionalEnumPipe(NodeType)) type?: NodeType,
    @Query('status', new ParseOptionalEnumPipe(NodeStatus)) status?: NodeStatus,
    @Query('shard', ParseOptionalIntPipe) shard?: number,
    @Query('issues', ParseOptionalBoolPipe) issues?: boolean,
    @Query('identity') identity?: string,
    @Query('provider', ParseAddressPipe) provider?: string,
    @Query('owner', ParseAddressPipe) owner?: string,
    @Query('sort', new ParseOptionalEnumPipe(NodeSort)) sort?: NodeSort,
    @Query('order', new ParseOptionalEnumPipe(SortOrder)) order?: SortOrder,
  ): Promise<Node[]> {
    return await this.nodeService.getNodes({ from, size }, { search, online, type, status, shard, issues, identity, provider, owner, sort, order });
  }

  @Get("/nodes/versions")
  @ApiOperation({ summary: 'Node versions', description: 'Returns breakdown of node versions for validator nodes' })
  @ApiOkResponse()
  async getNodeVersions() {
    return await this.nodeService.getNodeVersions();
  }

  @Get("/nodes/count")
  @ApiOperation({ summary: 'Nodes count', description: 'Returns number of all observer/validator nodes available on blockchain' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'search', description: 'Search by name, bls or version', required: false })
  @ApiQuery({ name: 'online', description: 'Whether node is online or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'type', description: 'Type of node', required: false, enum: NodeType })
  @ApiQuery({ name: 'status', description: 'Node status', required: false, enum: NodeStatus })
  @ApiQuery({ name: 'shard', description: 'Node shard', required: false })
  @ApiQuery({ name: 'issues', description: 'Whether node has issues or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'identity', description: 'Node identity', required: false })
  @ApiQuery({ name: 'provider', description: 'Node provider', required: false })
  @ApiQuery({ name: 'owner', description: 'Node owner', required: false })
  @ApiQuery({ name: 'sort', description: 'Sorting criteria', required: false })
  @ApiQuery({ name: 'order', description: 'Sorting order (asc / desc)', required: false })
  getNodeCount(
    @Query('search') search?: string,
    @Query('online', ParseOptionalBoolPipe) online?: boolean,
    @Query('type', new ParseOptionalEnumPipe(NodeType)) type?: NodeType,
    @Query('status', new ParseOptionalEnumPipe(NodeStatus)) status?: NodeStatus,
    @Query('shard', ParseOptionalIntPipe) shard?: number,
    @Query('issues', ParseOptionalBoolPipe) issues?: boolean,
    @Query('identity') identity?: string,
    @Query('provider', ParseAddressPipe) provider?: string,
    @Query('owner', ParseAddressPipe) owner?: string,
    @Query('sort', new ParseOptionalEnumPipe(NodeSort)) sort?: NodeSort,
    @Query('order', new ParseOptionalEnumPipe(SortOrder)) order?: SortOrder,
  ): Promise<number> {
    return this.nodeService.getNodeCount({ search, online, type, status, shard, issues, identity, provider, owner, sort, order });
  }

  @Get("/nodes/c")
  @ApiExcludeEndpoint()
  getNodeCountAlternative(
    @Query('search') search?: string,
    @Query('online', ParseOptionalBoolPipe) online?: boolean,
    @Query('type', new ParseOptionalEnumPipe(NodeType)) type?: NodeType,
    @Query('status', new ParseOptionalEnumPipe(NodeStatus)) status?: NodeStatus,
    @Query('shard', ParseOptionalIntPipe) shard?: number,
    @Query('issues', ParseOptionalBoolPipe) issues?: boolean,
    @Query('identity') identity?: string,
    @Query('provider', ParseAddressPipe) provider?: string,
    @Query('owner', ParseAddressPipe) owner?: string,
    @Query('sort', new ParseOptionalEnumPipe(NodeSort)) sort?: NodeSort,
    @Query('order', new ParseOptionalEnumPipe(SortOrder)) order?: SortOrder,
  ): Promise<number> {
    return this.nodeService.getNodeCount({ search, online, type, status, shard, issues, identity, provider, owner, sort, order });
  }

  @Get('/nodes/:bls')
  @ApiOperation({ summary: 'Node', description: 'Returns details about a specific node for a given bls key' })
  @ApiOkResponse({ type: Node })
  @ApiNotFoundResponse({ description: 'Node not found' })
  async getNode(@Param('bls', ParseBlsHashPipe) bls: string): Promise<Node> {
    const provider = await this.nodeService.getNode(bls);
    if (provider === undefined) {
      throw new HttpException('Node not found', HttpStatus.NOT_FOUND);
    }

    return provider;
  }
}
