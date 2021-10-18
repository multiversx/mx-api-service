import { Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { RoundController } from "./round.controller";
import { RoundService } from "./round.service";

@Module({
  imports: [
    CommonModule,
  ],
  controllers: [
    RoundController,
  ],
  providers: [
    RoundService,
  ],
  exports: [
    RoundService,
  ]
})
export class RoundModule { }