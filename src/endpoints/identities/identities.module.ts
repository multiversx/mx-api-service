import { forwardRef, Module } from "@nestjs/common";
import { KeybaseModule } from "src/common/keybase/keybase.module";
import { NetworkModule } from "../network/network.module";
import { NodeModule } from "../nodes/node.module";
import { IdentitiesService } from "./identities.service";
import { BlockModule } from "../blocks/block.module";

@Module({
  imports: [
    forwardRef(() => NodeModule),
    forwardRef(() => NetworkModule),
    forwardRef(() => KeybaseModule),
    forwardRef(() => BlockModule),
  ],
  providers: [
    IdentitiesService,
  ],
  exports: [
    IdentitiesService,
  ],
})
export class IdentitiesModule { }
