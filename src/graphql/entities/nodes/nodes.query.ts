import { Args, Float, Query, Resolver } from "@nestjs/graphql";
import GraphQLJSON from "graphql-type-json";
import { QueryPagination } from "src/common/entities/query.pagination";
import { Node } from "src/endpoints/nodes/entities/node";
import { NodeFilter } from "src/endpoints/nodes/entities/node.filter";
import { NodeService } from "src/endpoints/nodes/node.service";
import { GetNodesCountInput, GetNodesInput } from "./nodes.input";

@Resolver()
export class NodeQuery {
  constructor(protected readonly nodeService: NodeService) { }

  @Query(() => [Node], { name: "nodes", description: "Retrieve all nodes for the given input." })
  public async getNodes(@Args("input", { description: "Input to retrieve the given nodes for." }) input: GetNodesInput): Promise<Node[]> {
    return await this.nodeService.getNodes(
      new QueryPagination({ from: input.from, size: input.size }),
      new NodeFilter({
        search: input.search,
        online: input.online,
        type: input.type,
        status: input.status,
        shard: input.shard,
        issues: input.issues,
        identity: input.identity,
        provider: input.provider,
        owner: input.owner,
        auctioned: input.auctioned,
        fullHistory: input.fullHistory,
        sort: input.sort,
        order: input.order,
      }),
    );
  }

  @Query(() => Float, { name: "nodesCount", description: "Returns number of all observer/validator nodes available on blockchain.", nullable: true })
  public async getBlocksCount(@Args("input", { description: "Input to retrieve the given nodes count for." }) input: GetNodesCountInput): Promise<number> {
    return await this.nodeService.getNodeCount(GetNodesCountInput.resolve(input));
  }

  @Query(() => GraphQLJSON, { name: "nodesVersion", description: "Retrieve the nodes version." })
  public async getNodeVersions(): Promise<any> {
    return await this.nodeService.getNodeVersions();
  }
}

