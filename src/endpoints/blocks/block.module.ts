import { forwardRef, Module } from "@nestjs/common";
import { BlsModule } from "../bls/bls.module";
import { IdentitiesModule } from "../identities/identities.module";
import { NodeModule } from "../nodes/node.module";
import { BlockService } from "./block.service";
import { BlocksGateway } from "./blocks.gateway";

@Module({
  imports: [
    BlsModule,
    forwardRef(() => NodeModule),
    forwardRef(() => IdentitiesModule),
  ],
  providers: [
    BlockService, BlocksGateway,
  ],
  exports: [
    BlockService, BlocksGateway,
  ],
})
export class BlockModule { }
