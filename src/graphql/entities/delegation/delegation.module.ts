import { Module } from "@nestjs/common";
import { DelegationModule as InternalDelegationModule } from "src/endpoints/delegation/delegation.module";
import { DelegationResolver } from "./delegation.resolver";

@Module({
  imports: [InternalDelegationModule],
  providers: [DelegationResolver],
})
export class DelegationModule { }
