import { Module } from "@nestjs/common";
import { DelegationLegacyModule as InternalDelegationLegacyModule } from "src/endpoints/delegation.legacy/delegation.legacy.module";
import { DelegationLegacyResolver } from "./delegation-legacy.resolver";
@Module({
  imports: [InternalDelegationLegacyModule],
  providers: [DelegationLegacyResolver],
})
export class DelegationLegacyModule { }
