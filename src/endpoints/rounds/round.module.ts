import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { RoundService } from "./round.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  providers: [
    RoundService,
  ],
  exports: [
    RoundService,
  ]
})
export class RoundModule { }