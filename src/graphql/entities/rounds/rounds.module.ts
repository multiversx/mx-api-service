import { Module } from "@nestjs/common";
import { RoundModule as InternalRoundModule } from "src/endpoints/rounds/round.module";
import { RoundResolver } from "./rounds.resolver";

@Module({
  imports: [InternalRoundModule],
  providers: [RoundResolver],
})
export class RoundModule { }
