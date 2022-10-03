import { Module } from "@nestjs/common";
import { NodeModule as InternalNodeModule } from "src/endpoints/nodes/node.module";
import { NodeResolver } from "./nodes.resolver";
@Module({
  imports: [InternalNodeModule],
  providers: [NodeResolver],
})
export class NodeModule { }
