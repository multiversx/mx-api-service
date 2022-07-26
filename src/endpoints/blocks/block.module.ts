import { forwardRef, Module } from "@nestjs/common";
import { BlsModule } from "../bls/bls.module";
import { IdentitiesModule } from "../identities/identities.module";
import { NodeModule } from "../nodes/node.module";
import { BlockService } from "./block.service";

@Module({
  imports: [
    BlsModule,
    forwardRef(() => NodeModule),
    forwardRef(() => IdentitiesModule),
  ],
  providers: [
    BlockService,
  ],
  exports: [
    BlockService,
  ],
})
export class BlockModule { }
