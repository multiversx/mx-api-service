import { forwardRef, Module } from "@nestjs/common";
import { KeybaseModule } from "src/common/keybase/keybase.module";
import { IdentitiesModule } from "../identities/identities.module";
import { NodeModule } from "../nodes/node.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { ProviderService } from "./provider.service";

@Module({
  imports: [
    forwardRef(() => KeybaseModule),
    forwardRef(() => NodeModule),
    VmQueryModule,
    forwardRef(() => IdentitiesModule),
  ],
  providers: [
    ProviderService,
  ],
  exports: [
    ProviderService,
  ],
})
export class ProviderModule { }
