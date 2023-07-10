import { forwardRef, Module } from "@nestjs/common";
import { KeybaseModule } from "src/common/keybase/keybase.module";
import { IdentitiesModule } from "../identities/identities.module";
import { NodeModule } from "../nodes/node.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { ProviderService } from "./provider.service";
import { DelegationManagerContractModule } from "../vm.query/contracts/delegation.manager.contract.module";

@Module({
  imports: [
    forwardRef(() => KeybaseModule),
    forwardRef(() => NodeModule),
    VmQueryModule,
    IdentitiesModule,
    DelegationManagerContractModule,
  ],
  providers: [
    ProviderService,
  ],
  exports: [
    ProviderService,
  ],
})
export class ProviderModule { }
