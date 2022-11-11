import { Resolver } from "@nestjs/graphql";
import { Node } from "src/endpoints/nodes/entities/node";
import { NodeService } from "src/endpoints/nodes/node.service";
import { NodeQuery } from "./nodes.query";

@Resolver(() => Node)
export class NodeResolver extends NodeQuery {
  constructor(nodeService: NodeService) {
    super(nodeService);
  }
}
