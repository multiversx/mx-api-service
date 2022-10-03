import { Module } from "@nestjs/common";
import { StakeModule as InternalStakeModule } from "src/endpoints/stake/stake.module";
import { StakeResolver } from "./stake.resolver";
@Module({
  imports: [InternalStakeModule],
  providers: [StakeResolver],
})
export class StakeModule { }
